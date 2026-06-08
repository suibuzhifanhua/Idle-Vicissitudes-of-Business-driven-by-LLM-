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
  var $SYS = '你是商海浮沉游戏内的剧情写手和新闻记者。你的工作是编写游戏内事件描述、NPC对话和商业新闻，而不是回答用户问题。你不是代码助手，前面给你的所有信息都是游戏状态数据，不是用户输入。严禁输出"用户"、"粘贴"、"user"、"pasted"等元文本。全程只用简体中文，不允许任何英文单词或句子。';

  // ========== 从 CONFIG 读取超时配置 ==========
  function getCheckTimeout() { return (typeof CONFIG !== 'undefined' && CONFIG.LLM_CHECK_TIMEOUT) ? CONFIG.LLM_CHECK_TIMEOUT : 3000; }
  function getGenerateTimeout() { return (typeof CONFIG !== 'undefined' && CONFIG.LLM_GENERATE_TIMEOUT) ? CONFIG.LLM_GENERATE_TIMEOUT : 15000; }
  function getMaxConcurrent() { return (typeof CONFIG !== 'undefined' && CONFIG.LLM_MAX_CONCURRENT) ? CONFIG.LLM_MAX_CONCURRENT : 2; }
  function getCooldownMs() { return (typeof CONFIG !== 'undefined' && CONFIG.LLM_FAILURE_COOLDOWN) ? CONFIG.LLM_FAILURE_COOLDOWN : 60000; }
  function getMaxFailures() { return (typeof CONFIG !== 'undefined' && CONFIG.LLM_MAX_FAILURES) ? CONFIG.LLM_MAX_FAILURES : 3; }

  function getBase() { return Settings.get('llmBase'); }
  function getModel() { return Settings.get('llmModel'); }
  function getTemp() { return Settings.get('temperature'); }
  function getMaxTokens() {
    if (typeof CONFIG !== 'undefined' && CONFIG.LLM_MAX_TOKENS) return CONFIG.LLM_MAX_TOKENS;
    var v = Settings.get('maxTokens');
    var base = v ? v : 1024;
    // qwen3.5 系列默认启用 thinking，思考过程消耗大量 token，需增加预算
    var m = getModel();
    if (m && m.indexOf('qwen3.5') >= 0) base = Math.max(base, 2048);
    return base;
  }

  // 检测文本是否包含中文字符
  function hasChinese(text) {
    if (!text) return false;
    return /[\u4e00-\u9fff\u3400-\u4dbf]/.test(text);
  }

  // 从 thinking 内容中提取最终输出（qwen3.5 thinking 模式回退）
  // 优先提取包含中文的句子，避免英文推理过程泄露到 UI
  function extractFromThinking(thinking) {
    if (!thinking) return '';
    // 按段落拆分，优先找包含中文的段落
    var paragraphs = thinking.split(/\n\n+/);
    for (var p = paragraphs.length - 1; p >= 0; p--) {
      if (hasChinese(paragraphs[p]) && paragraphs[p].trim().length > 10) {
        return paragraphs[p].trim();
      }
    }
    // 回退：逐句搜索中文
    var tail = thinking.slice(-800);
    var sentences = tail.split(/(?<=[。！？\.\?\!])/);
    for (var s = sentences.length - 1; s >= 0; s--) {
      var clean = sentences[s].trim();
      if (hasChinese(clean) && clean.length > 10) return clean;
    }
    // 不返回纯英文内容
    return '';
  }

  // 构建 Ollama API 请求 URL（通过 /api/ollama 代理转发）
  function ollamaUrl(path) {
    var base = getBase();
    if (!base) base = '/api/ollama';
    return base + path;
  }

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
    // 修复：isInCooldown() 要求 Date.now() < cooldownUntil，无法同时满足 >= cooldownUntil
    if (cooldownUntil > 0 && Date.now() >= cooldownUntil) {
      console.log('[LLM] 冷却期结束，重置状态并重检');
      cooldownUntil = 0; failureCount = 0;
      setStatus('LLM离线'); check();
    }
  }

  // ========== 请求队列处理 ==========
  function processQueue() {
    exitCooldown();
    const maxConcurrent = getMaxConcurrent();
    while (pendingQueue.length > 0 && activeRequests < maxConcurrent) {
      if (isInCooldown()) {
        // 冷却期内不丢弃请求，延迟5秒后重试
        const item = pendingQueue.shift();
        setTimeout(() => { pendingQueue.unshift(item); processQueue(); }, 5000);
        return;
      }
      if (!available) { const item = pendingQueue.shift(); item.resolve(null); continue; }
      const item = pendingQueue.shift(); activeRequests++;
      _doGenerate(item.prompt, item.temp, 0, item.system)
        .then(result => item.resolve(result))
        .catch(() => item.resolve(null))
        .finally(() => { activeRequests--; processQueue(); });
    }
  }

  // ========== 实际执行 generate（含网络错误重试1次） ==========
  async function _doGenerate(prompt, temperature, _retryCount, system) {
    if (_retryCount === undefined) _retryCount = 0;
    if (temperature === undefined) temperature = getTemp();
    setLoading();
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), getGenerateTimeout());
      var finalPrompt = prompt;
      var modelName = getModel() || '';
      // qwen3.5 等模型对 system 参数支持不稳定，将 system 指令嵌入 prompt 开头双保险
      if (system && modelName.toLowerCase().includes('qwen')) {
        finalPrompt = system + '\n\n---\n' + prompt;
      }
      var bodyObj = {
        model: modelName,
        prompt: finalPrompt,
        stream: false,
        options: { temperature, num_predict: getMaxTokens(), think: false },
      };
      if (system) bodyObj.system = system;
      const r = await fetch(ollamaUrl('/api/generate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyObj),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!r.ok) throw new Error('llm fail ' + r.status);
      const data = await r.json();
      // Qwen3.5 可能返回 thinking 模式：response 为空或有英文推理泄露
      const responseText = (data.response || '').trim();
      // 防御：检测 response 是否包含中文，防止英文推理泄露到游戏 UI
      var responseOk = responseText && hasChinese(responseText);
      if (responseOk) {
        // 成功后同步修复 available 标志（check 不能是唯一的 true 来源）
        if (!available) { available = true; setDot('active'); setStatus('LLM在线(' + getModel() + ')'); }
        failureCount = 0;
        return responseText;
      }
      if (responseText && !hasChinese(responseText)) {
        console.warn('[LLM] response 为纯英文/无中文，疑似推理泄露，尝试从 thinking 提取中文');
      }
      // 如果 response 为空或为纯英文，尝试从 thinking 提取中文回退输出
      if (data.thinking) {
        if (!responseOk) console.warn('[LLM] response 无效，从 thinking 提取中文回退输出');
        var fallback = extractFromThinking(data.thinking);
        if (fallback && hasChinese(fallback)) {
          if (!available) { available = true; setDot('active'); setStatus('LLM在线(' + getModel() + ')'); }
          failureCount = 0;
          return fallback;
        }
      }
      // 所有路径都无有效中文内容，返回 null 让调用方使用 fallback
      if (responseText) console.warn('[LLM] 无法获取有效中文内容，返回空（将使用预设描述）');
      throw new Error('no chinese content in response');
    } catch(e) {
      // Network error: retry once
      const isNetworkErr = e.name === 'TypeError' || String(e.message || '').includes('fetch');
      if (isNetworkErr && _retryCount < 1) {
        console.warn('[LLM] 网络错误，1秒后重试 (' + (_retryCount+1) + '/1):', e.message);
        await new Promise(function(resolve) { setTimeout(resolve, 1000); });
        return _doGenerate(prompt, temperature, _retryCount + 1, system);
      }
      failureCount++;
      console.warn('[LLM] 生成失败 (' + failureCount + '/' + getMaxFailures() + '):', e.message);
      if (isNetworkErr) {
        available = false; setDot(''); setStatus('LLM离线');
        setTimeout(() => check(), 10000);
      }
      if (failureCount >= getMaxFailures()) enterCooldown();
      return null;
    }
  }

  // ========== 检测状态 ==========
  async function check() {
    // 允许检测绕过冷却期：冷却期只应限制生成请求，不应阻止 LLM 可用性检测
    if (checking) { console.log('[LLM][check] 跳过：上一轮检测仍在进行中'); return; }
    checking = true;
    setDot('loading'); setStatus('LLM检测中...');
    const url = ollamaUrl('/api/tags');
    console.log('[LLM][check] 请求 URL:', url);
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), getCheckTimeout());
      const r = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      console.log('[LLM][check] 响应状态:', r.status, r.statusText);
      if (r.ok) {
        const data = await r.json();
        const modelCount = (data.models && data.models.length) || 0;
        console.log('[LLM][check] 检测到 ' + modelCount + ' 个模型，当前配置模型：' + getModel());
        available = true; failureCount = 0; cooldownUntil = 0;
        setDot('active'); setStatus('LLM在线(' + getModel() + ')');
      } else throw new Error('HTTP ' + r.status);
    } catch(e) {
      available = false; setDot('');
      const msg = e.name === 'AbortError' ? '超时(' + (getCheckTimeout()/1000) + 's)' : (e.message || '');
      setStatus('LLM离线');
      console.warn('[LLM][check] 检测失败:', msg, '| URL:', url, e.name !== 'AbortError' ? ('| 详情: ' + (e.message || e)) : '');
    }
    checking = false;
  }

  function setDot(cls) { const el = document.getElementById('llm-dot'); if (el) el.className = 'llm-dot ' + cls; }
  function setStatus(text) { const el = document.getElementById('llm-status'); if (el) el.textContent = text; }
  function setLoading() { setDot('loading'); setStatus('LLM生成中...'); }

  // ========== 带队列的 generate（公开入口） ==========
  function generate(prompt, temperature, system) {
    exitCooldown();
    if (isInCooldown()) return Promise.resolve(null);
    if (!available) return Promise.resolve(null);
    return new Promise((resolve) => {
      if (activeRequests < getMaxConcurrent()) {
        activeRequests++;
        _doGenerate(prompt, temperature, 0, system)
          .then(result => resolve(result))
          .catch(() => resolve(null))
          .finally(() => { activeRequests--; processQueue(); });
      } else {
        pendingQueue.push({ prompt, temp: temperature, system, resolve });
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

  // 统一的游戏状态访问器（替换所有分散的 typeof SGame !== 'undefined' 守卫）
  function getG() {
    try {
      if (typeof SGame !== 'undefined' && SGame.G) return SGame.G;
    } catch(e) {
      console.warn('[LLM] SGame.G not accessible:', e.message || e);
    }
    return null;
  }

  function getQualityBonus() {
    var G = getG();
    if (G && G.unlockedSkills && G.unlockedSkills.includes('ai_empower')) return 1.3;
    return 1.0;
  }

  function buildGameContext() {
    var G = getG();
    if (!G) return '';

    var parts = [];

    // 基础状态
    if (typeof SGame.formatMoney === 'function') {
      parts.push('玩家资产：' + SGame.formatMoney(G.money || 0));
    }
    parts.push('第' + (G.act || 1) + '幕，已达成' + (G.milestone || 0) + '个里程碑');
    parts.push('声誉：' + ((G.reputation || 0).toFixed(1)) + '/100，压力：' + ((G.stress || 0).toFixed(1)) + '/100');

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
    var G = getG();
    if (!G || !G.narrativeContext || !G.narrativeContext.length) return '';

    var recent = G.narrativeContext.slice(-3);
    return '近期回顾：' + recent.join('；');
  }

  function addToNarrativeContext(text) {
    var G = getG();
    if (!G) return;
    if (!G.narrativeContext) G.narrativeContext = [];
    // 压缩：超过100字的部分截断
    var short = text.length > 80 ? text.substring(0, 80) + '...' : text;
    G.narrativeContext.push(short);
    if (G.narrativeContext.length > 10) G.narrativeContext = G.narrativeContext.slice(-5);
  }

  // ===================================================================
  // 统一 prompt 拼接 + 调用模式
  // ===================================================================
  async function _generateWithDefault(systemHint, promptParts, fallback, temperature, qualityGate) {
    var prompt = systemHint + '\n' + promptParts.join('\n');
    var result = await generate(prompt, temperature || 0.7);
    if (!result) return fallback;
    // 质量门控：启用时自评并重试
    if (qualityGate && qualityGate.enabled && available) {
      var qPrompt = '请对以下生成内容进行质量评分（仅输出JSON）：\n生成内容：' + result + '\n\n评分维度：戏剧性(1-10)、一致性(1-10)、信息量(1-10)。请严格返回JSON格式：{"drama":N,"coherence":N,"info":N}';
      var qResult = await generate(qPrompt, 0.3);
      if (qResult) {
        try {
          var qJson = JSON.parse(qResult.replace(/```json\s*/g,'').replace(/```\s*/g,'').trim());
          var total = (qJson.drama||0) + (qJson.coherence||0) + (qJson.info||0);
          var threshold = qualityGate.threshold || 18;
          if (total < threshold) {
            console.warn('[LLM] 质量门控未通过 (得分:' + total + '/' + threshold + ')，重写一次');
            var retryPrompt = prompt + '\n[注意：前次生成质量得分不足（' + total + '/' + threshold + '），请提升戏剧性和信息量后重新生成]';
            var retryResult = await generate(retryPrompt, temperature || 0.7);
            if (retryResult) return retryResult;
          }
        } catch(e) { console.warn('[LLM] 质量自评解析失败:', e.message); }
      }
    }
    return result;
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

    var result = await generate(prompt, 0.7, $SYS);
    // 质量门控：自评+重试
    if (result && available) {
      var qPromptN = '请对以下叙事进行质量评分（仅输出JSON）：\n' + result + '\n\n评分维度：戏剧性(1-10)、一致性(1-10)、信息量(1-10)。严格返回{"drama":N,"coherence":N,"info":N}';
      var qR = await generate(qPromptN, 0.3, $SYS);
      if (qR) {
        try {
          var qJ = JSON.parse(qR.replace(/```json\s*/g,'').replace(/```\s*/g,'').trim());
          var tN = (qJ.drama||0)+(qJ.coherence||0)+(qJ.info||0);
          if (tN < 18) {
            console.warn('[LLM] 叙事质量门控未通过('+tN+'/18)，重写');
            result = await generate(prompt + '\n[前次质量不足，请提升戏剧性和画面感]', 0.7, $SYS);
          }
        } catch(e) { console.warn('[LLM] 叙事质量自评失败:', e.message); }
      }
    }
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
    var result = await generate(prompt, 0.8, $SYS);
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

    var result = await generate(prompt, 0.6, $SYS);
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
    var G = getG();
    if (G && G.narrativeContext && G.narrativeContext.length) {
      var lastEvt = G.narrativeContext[G.narrativeContext.length - 1];
      if (lastEvt) eventCtx = '\n最近发生的事：' + lastEvt + '\n请在对话中自然地提及或回应这件事。';
    }

    var prompt = '你是"' + npc.name + '"（' + npc.title + '），性格：' + npc.desc + '\n当前与玩家的关系：' + (levelMap[favorLevel] || '中立') + '（好感度' + favorLevel + '）\n对话类型：' + dialogType + eventCtx + '\n' + qualityHint + '\n请生成一段20-40字的对话内容。语气要符合人物性格和当前关系亲疏。';

    var result = await generate(prompt, 0.5, $SYS);
    return result || npc.name + '：「最近生意怎么样？」';
  }

  // ---------- 商业新闻生成 (#5) ----------
  async function generateBusinessNews() {
    if (!available) return null;
    var context = buildGameContext();
    if (!context) return null;

    var prompt = '你是一个商业新闻编辑。请根据以下游戏状态生成一条40-60字的财经快讯：\n' + context + '\n格式要求：标题+正文，用「」包裹标题。新闻风格参考彭博社/财新。不使用markdown。';
    var result = await generate(prompt, 0.7, $SYS);
    return result || null;
  }

  // ---------- 竞争对手情报报告 (#7) ----------
  async function generateRivalReport() {
    if (!available) return null;
    var G = getG();
    if (!G || !G.rivals || !G.rivals.length) return null;

    var rivalInfo = G.rivals.slice(0, 3).map(function(r, i) {
      return (i+1) + '. ' + r.name + '（资产估值约' + (typeof SGame !== 'undefined' && SGame.formatMoney ? SGame.formatMoney(r.wealth || 0) : (r.wealth || 0)) + '）';
    }).join('\n');

    var prompt = '你是商业情报分析师。以下是当前商场上的竞争对手概况：\n' + rivalInfo + '\n玩家当前资产：' + (typeof SGame !== 'undefined' && SGame.formatMoney ? SGame.formatMoney(G.money) : '') + '\n请用2-3句话分析竞争态势，给出一个简短建议。语气专业自信。';

    var result = await generate(prompt, 0.5, $SYS);
    return result || null;
  }

  // ---------- 市场情绪分析 (#9) ----------
  async function analyzeMarketSentiment() {
    if (!available) return null; // 离线时不更新，保留现有值
    var context = buildGameContext();
    if (!context) return 50;

    var prompt = '你是一个金融市场分析师。请分析以下游戏状态并输出一个0到100的市场情绪指数：\n' + context + '\n标准：0=极度悲观，25=偏空，50=中性，75=偏乐观，100=极度乐观。\n\n请只输出一个数字（0-100的整数），不要输出任何其他内容。';

    var result = await generate(prompt, 0.3);
    if (!result) return null;
    // 提取第一个出现的 0-100 整数（容忍模型在数字前后加了废话）
    var match = result.trim().match(/\b([0-9]{1,3})\b/);
    if (!match) return null;
    var num = parseInt(match[1]);
    if (isNaN(num) || num < 0 || num > 100) return null;
    return num;
  }

  // ---------- 里程碑叙事 (#10) ----------
  async function generateMilestoneNarrative(msName, msDesc) {
    if (!available) return null;
    var context = buildGameContext();
    var qBonus = getQualityBonus();
    var qualityHint = qBonus > 1 ? '要求叙事更宏大、更有历史感。' : '';

    var prompt = '你是一个商业传奇故事的讲述者。玩家刚刚达成了里程碑：「' + msName + '」——' + msDesc + '\n' + (context ? '当前状态：' + context : '') + '\n' + qualityHint + '\n请用2-3句话撰写一段里程碑叙事，风格类似《财富》杂志封面故事引言，要有仪式感和成就感。';

    var result = await generate(prompt, 0.65, $SYS);
    // 质量门控
    if (result && available) {
      var qPM = '请对以下里程碑叙事进行质量评分（仅输出JSON）：\n' + result + '\n\n评分维度：戏剧性(1-10)、一致性(1-10)、信息量(1-10)。严格返回{"drama":N,"coherence":N,"info":N}';
      var qRM = await generate(qPM, 0.3, $SYS);
      if (qRM) {
        try {
          var qJM = JSON.parse(qRM.replace(/```json\s*/g,'').replace(/```\s*/g,'').trim());
          var tM = (qJM.drama||0)+(qJM.coherence||0)+(qJM.info||0);
          if (tM < 18) {
            console.warn('[LLM] 里程碑质量门控未通过('+tM+'/18)，重写');
            result = await generate(prompt + '\n[前次质量不足，请提升仪式感和宏大叙事]', 0.65, $SYS);
          }
        } catch(e) { console.warn('[LLM] 里程碑质量自评失败:', e.message); }
      }
    }
    return result || null;
  }

  // ---------- 动态难度调节：分析玩家状态 ----------
  async function analyzePlayerState(summary) {
    if (!available) return null;
    var prompt = '你是一个游戏平衡性分析师。请评估玩家状态是否需要调整难度，严格返回JSON：\n' + summary + '\n\nJSON格式：{"easeEventFreq":0.8-1.2,"boostIncome":0.8-1.2,"reason":"简短理由"}。若无需调整则所有值=1.0。';
    var result = await generate(prompt, 0.3);
    if (!result) return null;
    try {
      var jsonStr = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      var data = JSON.parse(jsonStr);
      data.easeEventFreq = Math.max(0.8, Math.min(1.2, parseFloat(data.easeEventFreq) || 1.0));
      data.boostIncome = Math.max(0.8, Math.min(1.2, parseFloat(data.boostIncome) || 1.0));
      data.reason = data.reason || '无';
      return data;
    } catch(e) {
      console.warn('[LLM] analyzePlayerState JSON解析失败:', e.message);
      return null;
    }
  }

  // ---------- 平衡性自检：数值调优建议 ----------
  async function suggestBalanceTuning(data) {
    if (!available) return null;
    var system = '你是一位游戏数值策划师。全程使用简体中文回复。';
    var prompt = '分析以下游戏数据给出平衡建议。严格返回JSON（不要包含任何其他文字，不要markdown代码块，所有文字内容必须用中文）：\n' + JSON.stringify(data, null, 2) + '\n\n格式：{"suggestions":[{"priority":"p0或p1或p2","target":"调整项名称","current":"当前值","suggested":"建议值","reason":"修改理由"}],"summary":"一句话总体评价"}';
    var result = await generate(prompt, 0.4, system);
    if (!result) return null;
    // 清理响应：去除可能的 markdown 标记和前后空白
    var cleaned = result.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch(e) {
      console.warn('[LLM] suggestBalanceTuning JSON解析失败:', e.message);
      // 回退：如果无法解析JSON，将原始文本作为 summary 返回
      return { suggestions: [], summary: cleaned.substring(0, 200) };
    }
  }

  // ---------- LLM驱动动态事件 (#8) ----------
  async function generateDynamicEvent() {
    if (!available) return null;
    var context = buildGameContext();
    if (!context) return null;

    var prompt = '你是一个商业模拟游戏的事件生成器。请根据当前游戏状态生成一个随机商业事件。\n' + context + '\n\n请严格按照以下JSON格式输出（不要输出其他内容）：\n{\n  "title": "事件标题（10-20字）",\n  "desc": "事件描述（20-40字）",\n  "type": "normal或decision",\n  "choices": [\n    {"text": "选项1文本", "effectDesc": "效果描述"},\n    {"text": "选项2文本", "effectDesc": "效果描述"}\n  ]\n}\n\n要求：事件要与当前游戏阶段匹配，有商业真实感。如果是normal类型choices为空数组。';

    var result = await generate(prompt, 0.7, $SYS);
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
    get checking() { return checking; },
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
    analyzePlayerState,
    suggestBalanceTuning,
    _generateWithDefault,
    addToNarrativeContext,
  };
})();
