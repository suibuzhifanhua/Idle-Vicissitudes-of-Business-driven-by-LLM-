// ==================================================
// llm.js — LLM集成：Ollama调用、请求队列、降级、叙事引擎
// ==================================================

window.LLM = (() => {
  let available = false;
  let checking = false;
  let activeRequests = 0;
  let failureCount = 0;
  let cooldownUntil = 0;
  const pendingQueue = [];

  // ========== 从 CONFIG 读取超时配置 ==========
  function getCheckTimeout() { return (typeof CONFIG !== 'undefined' && CONFIG.LLM_CHECK_TIMEOUT) ? CONFIG.LLM_CHECK_TIMEOUT : 3000; }
  function getGenerateTimeout() { return (typeof CONFIG !== 'undefined' && CONFIG.LLM_GENERATE_TIMEOUT) ? CONFIG.LLM_GENERATE_TIMEOUT : 15000; }
  function getMaxConcurrent() { return (typeof CONFIG !== 'undefined' && CONFIG.LLM_MAX_CONCURRENT) ? CONFIG.LLM_MAX_CONCURRENT : 2; }
  function getCooldownMs() { return (typeof CONFIG !== 'undefined' && CONFIG.LLM_FAILURE_COOLDOWN) ? CONFIG.LLM_FAILURE_COOLDOWN : 60000; }
  function getMaxFailures() { return (typeof CONFIG !== 'undefined' && CONFIG.LLM_MAX_FAILURES) ? CONFIG.LLM_MAX_FAILURES : 3; }

  function getBase() { return Settings.get('llmBase'); }
  function getModel() { return Settings.get('llmModel'); }
  function getTemp() { return Settings.get('temperature'); }
  function getMaxTokens() { return Settings.get('maxTokens'); }

  // ========== 冷却检查 ==========
  function isInCooldown() { return cooldownUntil > 0 && Date.now() < cooldownUntil; }

  function enterCooldown() {
    cooldownUntil = Date.now() + getCooldownMs();
    available = false;
    setDot('');
    setStatus('LLM冷却中...(' + Math.round(getCooldownMs()/1000) + 's)');
    console.warn('[LLM] 连续失败' + failureCount + '次，进入' + (getCooldownMs()/1000) + '秒冷却期');
  }

  function exitCooldown() {
    if (isInCooldown() && Date.now() >= cooldownUntil) {
      cooldownUntil = 0; failureCount = 0;
      setStatus('LLM离线'); check();
    }
  }

  // ========== 请求队列处理 ==========
  function processQueue() {
    exitCooldown();
    const maxConcurrent = getMaxConcurrent();
    while (pendingQueue.length > 0 && activeRequests < maxConcurrent) {
      if (isInCooldown()) { const item = pendingQueue.shift(); item.resolve(null); continue; }
      if (!available) { const item = pendingQueue.shift(); item.resolve(null); continue; }
      const item = pendingQueue.shift(); activeRequests++;
      _doGenerate(item.prompt, item.temp)
        .then(result => item.resolve(result))
        .catch(() => item.resolve(null))
        .finally(() => { activeRequests--; processQueue(); });
    }
  }

  // ========== 实际执行 generate ==========
  async function _doGenerate(prompt, temperature) {
    if (temperature === undefined) temperature = getTemp();
    setLoading();
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), getGenerateTimeout());
      const r = await fetch(`${getBase()}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: getModel(),
          prompt,
          stream: false,
          options: { temperature, num_predict: getMaxTokens() },
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!r.ok) throw new Error('llm fail ' + r.status);
      const data = await r.json();
      if (data.response && data.response.trim()) {
        failureCount = 0;
        return data.response.trim();
      }
      throw new Error('empty response');
    } catch(e) {
      failureCount++;
      console.warn('[LLM] 生成失败 (' + failureCount + '/' + getMaxFailures() + '):', e.message);
      if (e.name === 'TypeError' || e.message.includes('fetch')) {
        available = false; setDot(''); setStatus('LLM离线');
        setTimeout(() => check(), 10000);
      }
      if (failureCount >= getMaxFailures()) enterCooldown();
      return null;
    }
  }

  // ========== 检测状态 ==========
  async function check() {
    if (checking) return;
    if (isInCooldown()) return;
    checking = true;
    setDot('loading'); setStatus('LLM检测中...');
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), getCheckTimeout());
      const r = await fetch(`${getBase()}/api/tags`, { signal: ctrl.signal });
      clearTimeout(timer);
      if (r.ok) {
        available = true; failureCount = 0; cooldownUntil = 0;
        setDot('active'); setStatus('LLM在线(' + getModel() + ')');
      } else throw new Error('HTTP ' + r.status);
    } catch(e) {
      available = false; setDot('');
      const msg = e.name === 'AbortError' ? '超时' : (e.message || '');
      setStatus('LLM离线');
      console.warn('[LLM] 检测失败(' + msg + '): Ollama是否已启动并用HTTP服务器打开游戏？');
    }
    checking = false;
  }

  function setDot(cls) { const el = document.getElementById('llm-dot'); if (el) el.className = 'llm-dot ' + cls; }
  function setStatus(text) { const el = document.getElementById('llm-status'); if (el) el.textContent = text; }
  function setLoading() { setDot('loading'); setStatus('LLM生成中...'); }

  // ========== 带队列的 generate（公开入口） ==========
  function generate(prompt, temperature) {
    exitCooldown();
    if (isInCooldown()) return Promise.resolve(null);
    if (!available) return Promise.resolve(null);
    return new Promise((resolve) => {
      if (activeRequests < getMaxConcurrent()) {
        activeRequests++;
        _doGenerate(prompt, temperature)
          .then(result => resolve(result))
          .catch(() => resolve(null))
          .finally(() => { activeRequests--; processQueue(); });
      } else {
        pendingQueue.push({ prompt, temp: temperature, resolve });
      }
    });
  }

  async function forceRecheck() {
    checking = false; available = false; failureCount = 0; cooldownUntil = 0;
    setDot(''); setStatus('重新检测中...');
    await check(); processQueue();
  }

  // ===================================================================
  // 上下文构建器（统一注入游戏状态）
  // ===================================================================

  function getQualityBonus() {
    try {
      if (typeof SGame !== 'undefined' && SGame.G && SGame.G.unlockedSkills) {
        if (SGame.G.unlockedSkills.includes('ai_empower')) return 1.3;
      }
    } catch(e) {}
    return 1.0;
  }

  function buildGameContext() {
    var G;
    try {
      if (typeof SGame !== 'undefined' && SGame.G) G = SGame.G;
    } catch(e) { return ''; }
    if (!G) return '';

    var parts = [];

    // 基础状态
    if (typeof SGame.formatMoney === 'function') {
      parts.push('玩家资产：' + SGame.formatMoney(G.money || 0));
    }
    parts.push('第' + (G.act || 1) + '幕，已达成' + (G.milestone || 0) + '个里程碑');
    parts.push('声誉：' + (G.reputation || 0) + '/100，压力：' + (G.stress || 0) + '/100');

    // 员工
    if (G.employees && G.employees.length > 0) {
      var empNames = G.employees.slice(0, 5).map(function(e) { return e.name || e.role || '员工'; });
      parts.push('团队' + G.employees.length + '人：' + empNames.join('、') + (G.employees.length > 5 ? '等' : ''));
    }

    // 业务概况
    if (G.businesses) {
      var activeBiz = Object.entries(G.businesses).filter(function(e) { return e[1].level > 0; });
      if (activeBiz.length > 0) {
        var bizNames = activeBiz.slice(0, 4).map(function(e) {
          var def = (typeof BUSINESS_DEFS !== 'undefined') ? BUSINESS_DEFS.find(function(b) { return b.id === e[0]; }) : null;
          return (def ? def.name : e[0]) + 'Lv' + e[1].level;
        });
        parts.push('经营业务：' + bizNames.join('、') + (activeBiz.length > 4 ? '等' + activeBiz.length + '项' : ''));
      }
    }

    // 竞争对手
    if (G.rivals && G.rivals.length > 0) {
      var topRival = G.rivals[0];
      if (topRival) parts.push('主要竞争对手：' + topRival.name + '（排名第' + (G.rivals.indexOf(topRival) + 1) + '）');
    }

    // 股票市场风向
    if (G.stocks && typeof SGame.getStockPortfolioValue === 'function') {
      var pv = SGame.getStockPortfolioValue();
      if (pv > 0) parts.push('持有股票市值：' + SGame.formatMoney(pv));
    }

    // 已解锁区域
    if (G.unlockedRegions && G.unlockedRegions.length > 1) {
      parts.push('已解锁' + G.unlockedRegions.length + '个区域');
    }

    // 市场情绪
    if (G.marketSentiment !== undefined) {
      var sentLabel = G.marketSentiment >= 70 ? '乐观' : G.marketSentiment >= 50 ? '中性偏多' : G.marketSentiment >= 30 ? '中性偏空' : '悲观';
      parts.push('市场情绪：' + sentLabel + '(' + G.marketSentiment + ')');
    }

    return parts.join('；');
  }

  // 获取最近事件摘要（用于叙事连续性）
  function getRecentEventContext() {
    var G;
    try { if (typeof SGame !== 'undefined' && SGame.G) G = SGame.G; } catch(e) { return ''; }
    if (!G || !G.narrativeContext || !G.narrativeContext.length) return '';

    var recent = G.narrativeContext.slice(-3);
    return '近期回顾：' + recent.join('；');
  }

  function addToNarrativeContext(text) {
    try {
      if (typeof SGame !== 'undefined' && SGame.G) {
        if (!SGame.G.narrativeContext) SGame.G.narrativeContext = [];
        // 压缩：超过100字的部分截断
        var short = text.length > 80 ? text.substring(0, 80) + '...' : text;
        SGame.G.narrativeContext.push(short);
        if (SGame.G.narrativeContext.length > 10) SGame.G.narrativeContext = SGame.G.narrativeContext.slice(-5);
      }
    } catch(e) {}
  }

  // ===================================================================
  // 场景专用生成器
  // ===================================================================

  // ---------- 事件叙事 ----------
  async function generateNarrative(event, fallbackDesc) {
    if (!Settings.get('eventNarrative')) return fallbackDesc;
    var qBonus = getQualityBonus();
    var qualityHint = qBonus > 1 ? '（叙事质量加成x' + qBonus.toFixed(1) + '，请用更生动细腻、富有画面感的语言叙述）' : '';
    var context = buildGameContext();
    var recentCtx = getRecentEventContext();

    var prompt = '你是一个商业模拟游戏的旁白。请用2-3句话生动描述以下事件（不要重复标题）：\n事件：' + event.title + '\n背景：' + fallbackDesc;
    if (context) prompt += '\n游戏状态：' + context;
    if (recentCtx) prompt += '\n' + recentCtx;
    prompt += '\n' + qualityHint + '\n要求：简短有力，有画面感，第三人称叙述。';

    var result = await generate(prompt, 0.7);
    var final = result || fallbackDesc;
    if (result) addToNarrativeContext(result);
    return final;
  }

  // ---------- 员工背景故事（含属性评价） ----------
  async function generateEmployeeBackground(roleNameOrEmp) {
    // 支持传入角色名或完整员工对象
    var roleName = typeof roleNameOrEmp === 'string' ? roleNameOrEmp : (roleNameOrEmp.roleName || '员工');
    var attrs = null;
    if (typeof roleNameOrEmp === 'object' && roleNameOrEmp.attrs) {
      attrs = roleNameOrEmp.attrs;
    }
    if (!Settings.get('employeeBg')) return '一名经验丰富的' + roleName + '，曾在多家公司任职。';
    var qBonus = getQualityBonus();
    var qualityHint = qBonus > 1 ? '要求更细腻有趣，展现人物个性。' : '';
    var attrHint = '';
    if (attrs && typeof SGame !== 'undefined' && SGame.EMP_ATTRIBUTES) {
      attrHint = '属性：' + Object.entries(attrs).map(function(e) {
        var def = SGame.EMP_ATTRIBUTES[e[0]];
        return def ? def.name + e[1] : e[0] + e[1];
      }).join('、') + '。';
    }
    var prompt = '为一名' + roleName + '生成一段50字以内的背景故事。\n' + attrHint + '\n要求：包含年龄、学历、一个有趣的经历或特点。用中文回答，简洁有趣。' + qualityHint;
    var result = await generate(prompt, 0.8);
    return result || '一名经验丰富的' + roleName + '，曾在多家公司任职。';
  }

  // ---------- 决策叙事 (#1 启用) ----------
  async function generateDecisionNarrative(event) {
    if (!Settings.get('decisionNarrative')) return '';
    var qBonus = getQualityBonus();
    var qualityHint = qBonus > 1 ? '（质量加成x' + qBonus.toFixed(1) + '，请营造更强烈的戏剧张力）' : '';
    var context = buildGameContext();
    var desc = typeof event.getDesc === 'function' ? event.getDesc() : (event.desc || '');
    var choices = event.choices ? event.choices.map(function(c,i) { return (i+1) + '. ' + c.text; }).join('\n') : '';

    var prompt = '你是商业模拟游戏的旁白。玩家面临以下决策：\n' + event.title + '\n' + desc;
    if (choices) prompt += '\n选项：\n' + choices;
    if (context) prompt += '\n当前状态：' + context;
    prompt += '\n' + qualityHint + '\n请用3-5句话营造紧张氛围，让玩家感受到这个决策的重要性。不要替玩家做决定，只渲染氛围。';

    var result = await generate(prompt, 0.6);
    return result || '';
  }

  // ---------- NPC对话 (#4 关联事件) ----------
  async function generateNPCDialog(npcId, dialogType, favorLevel) {
    if (!Settings.get('npcDialog')) return '';
    var npc = NPCS[npcId];
    if (!npc) return '';
    var levelMap = ['敌对','冷淡','中立','友好','亲密'];
    var qBonus = getQualityBonus();
    var qualityHint = qBonus > 1 ? '要求对话更有角色辨识度，体现人物独特性格。' : '';

    // 获取最近事件，注入对话上下文
    var eventCtx = '';
    try {
      if (typeof SGame !== 'undefined' && SGame.G && SGame.G.narrativeContext && SGame.G.narrativeContext.length) {
        var lastEvt = SGame.G.narrativeContext[SGame.G.narrativeContext.length - 1];
        if (lastEvt) eventCtx = '\n最近发生的事：' + lastEvt + '\n请在对话中自然地提及或回应这件事。';
      }
    } catch(e) {}

    var prompt = '你是"' + npc.name + '"（' + npc.title + '），性格：' + npc.desc + '\n当前与玩家的关系：' + (levelMap[favorLevel] || '中立') + '（好感度' + favorLevel + '）\n对话类型：' + dialogType + eventCtx + '\n' + qualityHint + '\n请生成一段20-40字的对话内容。语气要符合人物性格和当前关系亲疏。';

    var result = await generate(prompt, 0.5);
    return result || npc.name + '：「最近生意怎么样？」';
  }

  // ---------- 商业新闻生成 (#5) ----------
  async function generateBusinessNews() {
    if (!available) return null;
    var context = buildGameContext();
    if (!context) return null;

    var prompt = '你是一个商业新闻编辑。请根据以下游戏状态生成一条40-60字的财经快讯：\n' + context + '\n格式要求：标题+正文，用「」包裹标题。新闻风格参考彭博社/财新。不使用markdown。';
    var result = await generate(prompt, 0.7);
    return result || null;
  }

  // ---------- 竞争对手情报报告 (#7) ----------
  async function generateRivalReport() {
    if (!available) return null;
    var G;
    try { if (typeof SGame !== 'undefined' && SGame.G) G = SGame.G; } catch(e) { return null; }
    if (!G || !G.rivals || !G.rivals.length) return null;

    var rivalInfo = G.rivals.slice(0, 3).map(function(r, i) {
      return (i+1) + '. ' + r.name + '（资产估值约' + (typeof SGame.formatMoney === 'function' ? SGame.formatMoney(r.wealth || 0) : (r.wealth || 0)) + '）';
    }).join('\n');

    var prompt = '你是商业情报分析师。以下是当前商场上的竞争对手概况：\n' + rivalInfo + '\n玩家当前资产：' + (typeof SGame.formatMoney === 'function' ? SGame.formatMoney(G.money) : '') + '\n请用2-3句话分析竞争态势，给出一个简短建议。语气专业自信。';

    var result = await generate(prompt, 0.5);
    return result || null;
  }

  // ---------- 市场情绪分析 (#9) ----------
  async function analyzeMarketSentiment() {
    if (!available) return 50; // 默认中性
    var context = buildGameContext();
    if (!context) return 50;

    var prompt = '你是一个金融市场分析师。请分析以下游戏状态并输出一个0到100的市场情绪指数：\n' + context + '\n标准：0=极度悲观，25=偏空，50=中性，75=偏乐观，100=极度乐观。\n\n请只输出一个数字（0-100的整数），不要输出任何其他内容。';

    var result = await generate(prompt, 0.3);
    if (!result) return 50;
    var num = parseInt(result.trim());
    if (isNaN(num) || num < 0 || num > 100) return 50;
    return num;
  }

  // ---------- 里程碑叙事 (#10) ----------
  async function generateMilestoneNarrative(msName, msDesc) {
    if (!available) return null;
    var context = buildGameContext();
    var qBonus = getQualityBonus();
    var qualityHint = qBonus > 1 ? '要求叙事更宏大、更有历史感。' : '';

    var prompt = '你是一个商业传奇故事的讲述者。玩家刚刚达成了里程碑：「' + msName + '」——' + msDesc + '\n' + (context ? '当前状态：' + context : '') + '\n' + qualityHint + '\n请用2-3句话撰写一段里程碑叙事，风格类似《财富》杂志封面故事引言，要有仪式感和成就感。';

    var result = await generate(prompt, 0.65);
    return result || null;
  }

  // ---------- LLM驱动动态事件 (#8) ----------
  async function generateDynamicEvent() {
    if (!available) return null;
    var context = buildGameContext();
    if (!context) return null;

    var prompt = '你是一个商业模拟游戏的事件生成器。请根据当前游戏状态生成一个随机商业事件。\n' + context + '\n\n请严格按照以下JSON格式输出（不要输出其他内容）：\n{\n  "title": "事件标题（10-20字）",\n  "desc": "事件描述（20-40字）",\n  "type": "normal或decision",\n  "choices": [\n    {"text": "选项1文本", "effectDesc": "效果描述"},\n    {"text": "选项2文本", "effectDesc": "效果描述"}\n  ]\n}\n\n要求：事件要与当前游戏阶段匹配，有商业真实感。如果是normal类型choices为空数组。';

    var result = await generate(prompt, 0.7);
    if (!result) return null;

    // 解析 JSON
    try {
      // 清理可能的 markdown 包装
      var jsonStr = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      var evt = JSON.parse(jsonStr);
      if (!evt.title || !evt.desc) return null;
      evt.id = 'llm_' + Date.now();
      evt.source = 'llm';
      return evt;
    } catch(e) {
      console.warn('[LLM] 动态事件JSON解析失败:', e.message, result.substring(0, 100));
      return null;
    }
  }

  // ========== 公开API ==========
  return {
    get available() { return available; },
    check, forceRecheck, setLoading,
    generate,
    generateNarrative,
    generateEmployeeBackground,
    generateDecisionNarrative,
    generateNPCDialog,
    generateBusinessNews,
    generateRivalReport,
    analyzeMarketSentiment,
    generateMilestoneNarrative,
    generateDynamicEvent,
    addToNarrativeContext,
  };
})();
