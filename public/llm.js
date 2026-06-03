// ==================================================
// llm.js — LLM集成：Ollama调用、叙事生成、fallback
// ==================================================

window.LLM = (() => {
  let available = false;
  let checking = false;

  // ========== 获取当前配置 ==========
  function getBase() { return Settings.get('llmBase'); }
  function getModel() { return Settings.get('llmModel'); }
  function getTemp() { return Settings.get('temperature'); }
  function getMaxTokens() { return Settings.get('maxTokens'); }

  // ========== 强制重检（设置变更后调用） ==========
  async function forceRecheck() {
    checking = false;  // 重置锁
    if (typeof LLM !== 'undefined' && LLM !== forceRecheck) {
      // LLM还没完成初始化，调用全局的check
    }
    available = false;
    setDot('');
    setStatus('重新检测中...');
    await check();
  }

  // ========== 检测状态 ==========
  async function check() {
    if (checking) return;
    checking = true;
    setDot('loading');
    setStatus('LLM检测中...');
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 3000);
      const r = await fetch(`${getBase()}/api/tags`, { signal: ctrl.signal });
      clearTimeout(timer);
      if (r.ok) {
        available = true;
        setDot('active');
        setStatus(`LLM在线(${getModel()})`);
      } else throw new Error('HTTP ' + r.status);
    } catch(e) {
      available = false;
      setDot('');
      const msg = e.name === 'AbortError' ? '超时' : (e.message || '');
      setStatus('LLM离线');
      console.warn('LLM检测失败(' + msg + '): Ollama是否已启动并用HTTP服务器打开游戏？');
    }
    checking = false;
  }

  function setDot(cls) {
    const el = document.getElementById('llm-dot');
    if (el) el.className = 'llm-dot ' + cls;
  }

  function setStatus(text) {
    const el = document.getElementById('llm-status');
    if (el) el.textContent = text;
  }

  function setLoading() {
    setDot('loading');
    setStatus('LLM生成中...');
  }

  // ========== 调用LLM生成叙事 ==========
  async function generate(prompt, temperature) {
    if (!available) return null;
    if (temperature === undefined) temperature = getTemp();
    setLoading();
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
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
      if (!r.ok) throw new Error('llm fail');
      const data = await r.json();
      if (data.response && data.response.trim()) {
        return data.response.trim();
      }
      throw new Error('empty response');
    } catch(e) {
      console.warn('LLM生成失败:', e.message);
      if (e.name === 'TypeError' || e.message.includes('fetch')) {
        available = false;
        setDot('');
        setStatus('LLM离线');
        setTimeout(() => check(), 10000);
      }
      return null;
    }
  }

  // ========== 各场景专用生成器 ==========
  // 事件叙事
  async function generateNarrative(event, fallbackDesc) {
    if (!Settings.get('eventNarrative')) return fallbackDesc;
    const prompt = `你是一个商业模拟游戏的旁白。请用2-3句话生动描述以下事件（不要重复标题）：
事件：${event.title}
背景：${fallbackDesc}
玩家当前资产：${SGame.G ? SGame.formatMoney(SGame.G.money || 0) : '未知'}
当前幕次：第${SGame.G ? SGame.G.act : 1}幕
要求：简短有力，有画面感，第三人称叙述。`;
    const result = await generate(prompt, 0.7);
    return result || fallbackDesc;
  }

  // 员工背景故事
  async function generateEmployeeBackground(roleName) {
    if (!Settings.get('employeeBg')) return `一名经验丰富的${roleName}，曾在多家公司任职。`;
    const prompt = `为一名${roleName}生成一段50字以内的背景故事。
要求：包含年龄、学历、一个有趣的经历或特点。用中文回答，简洁有趣。`;
    const result = await generate(prompt, 0.8);
    return result || `一名经验丰富的${roleName}，曾在多家公司任职。`;
  }

  // 决策叙事
  async function generateDecisionNarrative(event) {
    if (!Settings.get('decisionNarrative')) return event.choices[0].text;
    const prompt = `你是商业模拟游戏的旁白。玩家面临以下决策：
${event.title}
${typeof event.getDesc === 'function' ? event.getDesc() : event.desc || ''}
选项：
${event.choices.map((c,i)=>`${i+1}. ${c.text}`).join('\n')}
请用3-5句话营造紧张氛围，让玩家感受到这个决策的重要性。`;
    const result = await generate(prompt, 0.6);
    return result || event.choices[0].text;
  }

  // NPC对话
  async function generateNPCDialog(npcId, dialogType, favorLevel) {
    if (!Settings.get('npcDialog')) return '';
    const npc = NPCS[npcId];
    if (!npc) return '';
    const levelMap = ['敌对','冷淡','中立','友好','亲密'];
    const prompt = `你是"${npc.name}"（${npc.title}），性格：${npc.desc}
当前与玩家的关系：${levelMap[favorLevel] || '中立'}（好感度${favorLevel}）
对话类型：${dialogType}
请生成一段20-40字的对话内容。语气要符合人物性格和当前关系亲疏。`;
    const result = await generate(prompt, 0.5);
    return result || `${npc.name}：「最近生意怎么样？」`;
  }

  // ========== 公开API ==========
  return {
    get available() { return available; },
    check, forceRecheck, setLoading,
    generate, generateNarrative, generateEmployeeBackground,
    generateDecisionNarrative, generateNPCDialog,
  };
})();
