// ==================================================
// settings.js — LLM参数设置面板，localStorage持久化
// ==================================================

window.Settings = (() => {
  const STORAGE_KEY = 'shanghaifc_settings';

  // 默认值
  const defaults = {
    llmBase: 'http://localhost:11434',
    llmModel: 'qwen3.5:4b',
    temperature: 0.7,
    maxTokens: 300,
    eventNarrative: true,   // 事件叙事LLM
    employeeBg: true,       // 员工背景LLM
    npcDialog: true,        // NPC对话LLM
    decisionNarrative: true,// 决策叙事LLM
    atmosphereLLM: true,    // LLM氛围生成
    weatherEffects: true,   // 天气视觉效果
    // 托管管理设置
    autoMode: {
      eventDecide: true,
      eventPreference: 'balanced',
      autoOpenBusiness: true,
      autoUpgradeBusiness: true,
      upgradeThreshold: 'normal',   // conservative/normal/aggressive
      autoHire: true,
      autoFire: false,
      fireThreshold: 20,
      maxEmployees: 8,
      autoUnlockRegion: true,
      autoResearch: true,
      autoInvest: false,
      investBudget: 0.1,
      autoLoan: false,
      autoRepay: true,
      autoGift: false,
      giftBudget: 50000,
    },
  };

  let current = {};

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        current = { ...defaults, ...JSON.parse(raw) };
      } else {
        current = { ...defaults };
        // 尝试从CONFIG同步初始值
        if (typeof CONFIG !== 'undefined') {
          current.llmBase = CONFIG.LLM_BASE || current.llmBase;
          current.llmModel = CONFIG.LLM_MODEL || current.llmModel;
        }
      }
    } catch(e) {
      current = { ...defaults };
    }

    // 同步托管配置到游戏状态（从localStorage恢复）
    try {
      if (typeof SGame !== 'undefined' && SGame.G && SGame.G.autoMode) {
        const savedAm = current.autoMode;
        if (savedAm) {
          SGame.G.autoMode.eventDecide = savedAm.eventDecide ?? true;
          SGame.G.autoMode.eventPreference = savedAm.eventPreference ?? 'balanced';
          SGame.G.autoMode.autoOpenBusiness = savedAm.autoOpenBusiness ?? true;
          SGame.G.autoMode.autoUpgradeBusiness = savedAm.autoUpgradeBusiness ?? true;
          SGame.G.autoMode.upgradeThreshold = upgradeThresholdMap(savedAm.upgradeThreshold || 'normal');
          SGame.G.autoMode.autoHire = savedAm.autoHire ?? true;
          SGame.G.autoMode.autoFire = savedAm.autoFire ?? false;
          SGame.G.autoMode.fireThreshold = savedAm.fireThreshold ?? 20;
          SGame.G.autoMode.maxEmployees = savedAm.maxEmployees ?? 8;
          SGame.G.autoMode.autoUnlockRegion = savedAm.autoUnlockRegion ?? true;
          SGame.G.autoMode.autoResearch = savedAm.autoResearch ?? true;
          SGame.G.autoMode.autoInvest = savedAm.autoInvest ?? false;
          SGame.G.autoMode.investBudget = savedAm.investBudget ?? 0.1;
          SGame.G.autoMode.autoLoan = savedAm.autoLoan ?? false;
          SGame.G.autoMode.autoRepay = savedAm.autoRepay ?? true;
          SGame.G.autoMode.autoGift = savedAm.autoGift ?? false;
          SGame.G.autoMode.giftBudget = savedAm.giftBudget ?? 50000;
        }
      }
    } catch(e2) { /* ignore */ }

    return current;
  }

  function upgradeThresholdMap(val) {
    if (val === 'conservative') return 0.2;
    if (val === 'aggressive') return 0.67;
    return 0.33; // normal
  }
  function upgradeThresholdReverse(val) {
    if (val <= 0.25) return 'conservative';
    if (val >= 0.5) return 'aggressive';
    return 'normal';
  }

  function save(newSettings) {
    current = { ...current, ...newSettings };
    // 如果传入的settings中包含auto_前缀的key，同步到current.autoMode
    const autoUpdates = {};
    Object.keys(newSettings).forEach(k => {
      if (k.startsWith('auto_')) {
        autoUpdates[k.replace('auto_', '')] = newSettings[k];
      }
    });
    if (Object.keys(autoUpdates).length > 0) {
      current.autoMode = { ...current.autoMode, ...autoUpdates };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    // 同步更新CONFIG（运行时使用）
    if (typeof CONFIG !== 'undefined') {
      CONFIG.LLM_BASE = current.llmBase;
      CONFIG.LLM_MODEL = current.llmModel;
    }
  }

  function get(key) { return current[key] ?? defaults[key]; }

  // ========== 渲染设置面板 ==========
  function renderSettings() {
    const container = document.getElementById('settings-content');
    if (!container) return;

    const s = load();

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px;">

        <!-- API地址 -->
        <div>
          <label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">Ollama API地址</label>
          <input id="set-llmBase" type="text" value="${escHtml(s.llmBase)}"
            style="width:100%;padding:8px;background:var(--bg-primary);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:12px;font-family:var(--font);">
        </div>

        <!-- 模型名称 -->
        <div>
          <label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">模型名称</label>
          <div style="display:flex;gap:8px;">
            <input id="set-llmModel" type="text" value="${escHtml(s.llmModel)}"
              style="flex:1;padding:8px;background:var(--bg-primary);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:12px;font-family:var(--font);">
            <button class="btn" onclick="Settings.fetchModels()" style="font-size:11px;white-space:nowrap;">🔍 获取模型</button>
          </div>
          <div id="set-model-list" style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px;"></div>
        </div>

        <!-- Temperature -->
        <div>
          <label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">
            创意度 (Temperature): <span id="set-temp-val" style="color:var(--accent-gold);">${s.temperature.toFixed(1)}</span>
          </label>
          <input id="set-temperature" type="range" min="0" max="2" step="0.1" value="${s.temperature}"
            style="width:100%;accent-color:var(--accent-gold);"
            oninput="document.getElementById('set-temp-val').textContent=this.value">
          <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted);">
            <span>精确</span><span>均衡</span><span>创意</span>
          </div>
        </div>

        <!-- 最大输出token -->
        <div>
          <label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">
            最大输出长度: <span id="set-tokens-val" style="color:var(--accent-gold);">${s.maxTokens}</span>
          </label>
          <input id="set-maxTokens" type="range" min="50" max="1000" step="50" value="${s.maxTokens}"
            style="width:100%;accent-color:var(--accent-gold);"
            oninput="document.getElementById('set-tokens-val').textContent=this.value">
        </div>

        <!-- LLM功能开关 -->
        <div>
          <label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:6px;">LLM功能开关</label>
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${toggleRow('set-eventNarrative', '事件叙事生成', s.eventNarrative)}
            ${toggleRow('set-employeeBg', '员工背景故事', s.employeeBg)}
            ${toggleRow('set-npcDialog', 'NPC对话生成', s.npcDialog)}
            ${toggleRow('set-decisionNarrative', '决策叙事生成', s.decisionNarrative)}
          </div>
        </div>

        <!-- 音效开关 -->
        <div>
          <label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:6px;">音效设置</label>
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${toggleRow('set-audioEnabled', '游戏音效', typeof AudioFX !== 'undefined' && AudioFX ? AudioFX.enabled : true)}
          </div>
        </div>

        <!-- 环境设置 -->
        <div>
          <label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:6px;">🌍 环境氛围</label>
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${toggleRow('set-atmosphereLLM', 'LLM氛围生成（AI描述城市）', s.atmosphereLLM)}
            ${toggleRow('set-weatherEffects', '天气视觉效果（雨雪动画）', s.weatherEffects)}
          </div>
        </div>

        <!-- ==================== 托管管理 ==================== -->
        <div style="border-top:2px solid var(--accent-gold);padding-top:14px;margin-top:4px;">
          <label style="font-size:14px;font-weight:700;color:var(--accent-gold);display:block;margin-bottom:10px;">🤖 托管管理</label>

          <!-- 事件决策 -->
          <div style="margin-bottom:10px;">
            <label style="font-size:12px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:4px;">📋 事件决策</label>
            ${toggleRow('set-autoEventDecide', '自动决策事件', getAuto('eventDecide', true))}
            <div style="margin-top:6px;">
              <span style="font-size:10px;color:var(--text-muted);display:block;margin-bottom:2px;">决策偏好</span>
              <div style="display:flex;gap:6px;flex-wrap:wrap;">
                ${autoRadioRow('eventPreference', 'balanced', '均衡型', getAuto('eventPreference', 'balanced'), '综合评估')}
                ${autoRadioRow('eventPreference', 'aggressive', '激进型', getAuto('eventPreference', 'balanced'), '永远选收益最高')}
                ${autoRadioRow('eventPreference', 'conservative', '保守型', getAuto('eventPreference', 'balanced'), '优先避免损失')}
                ${autoRadioRow('eventPreference', 'social', '社交型', getAuto('eventPreference', 'balanced'), '优先提升好感')}
              </div>
            </div>
          </div>

          <!-- 业务管理 -->
          <div style="margin-bottom:10px;">
            <label style="font-size:12px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:4px;">🏢 业务管理</label>
            ${toggleRow('set-autoOpenBusiness', '自动开设业务', getAuto('autoOpenBusiness', true))}
            ${toggleRow('set-autoUpgradeBusiness', '自动升级业务', getAuto('autoUpgradeBusiness', true))}
            <div style="margin-top:6px;">
              <span style="font-size:10px;color:var(--text-muted);display:block;margin-bottom:2px;">升级资金阈值</span>
              <div style="display:flex;gap:6px;flex-wrap:wrap;">
                ${autoRadioRow('upgradeThreshold', 'conservative', '保守(5x)', getAuto('upgradeThreshold', 'normal'), '资金需5倍升级费')}
                ${autoRadioRow('upgradeThreshold', 'normal', '正常(3x)', getAuto('upgradeThreshold', 'normal'), '资金需3倍升级费')}
                ${autoRadioRow('upgradeThreshold', 'aggressive', '激进(1.5x)', getAuto('upgradeThreshold', 'normal'), '资金仅需1.5倍')}
              </div>
            </div>
          </div>

          <!-- 员工管理 -->
          <div style="margin-bottom:10px;">
            <label style="font-size:12px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:4px;">👥 员工管理</label>
            ${toggleRow('set-autoHire', '自动招聘', getAuto('autoHire', true))}
            <div style="margin-top:6px;">
              <span style="font-size:10px;color:var(--text-muted);display:block;margin-bottom:2px;">员工上限</span>
              <div style="display:flex;gap:6px;flex-wrap:wrap;">
                ${autoRadioRow('maxEmployees', '4', '4人', String(getAuto('maxEmployees', 8)), '小团队')}
                ${autoRadioRow('maxEmployees', '6', '6人', String(getAuto('maxEmployees', 8)), '中等团队')}
                ${autoRadioRow('maxEmployees', '8', '8人', String(getAuto('maxEmployees', 8)), '标准团队')}
                ${autoRadioRow('maxEmployees', '10', '10人', String(getAuto('maxEmployees', 8)), '大型团队')}
                ${autoRadioRow('maxEmployees', '99', '不限', String(getAuto('maxEmployees', 8)), '有多少招多少')}
              </div>
            </div>
            ${toggleRow('set-autoFire', '自动解雇低忠诚度员工', getAuto('autoFire', false))}
            <div style="margin-top:6px;">
              <span style="font-size:10px;color:var(--text-muted);display:block;margin-bottom:2px;">解雇忠诚度阈值</span>
              <div style="display:flex;gap:6px;flex-wrap:wrap;">
                ${autoRadioRow('fireThreshold', '10', '10', String(getAuto('fireThreshold', 20)), '极低才解雇')}
                ${autoRadioRow('fireThreshold', '20', '20', String(getAuto('fireThreshold', 20)), '较低就解雇')}
                ${autoRadioRow('fireThreshold', '30', '30', String(getAuto('fireThreshold', 20)), '略低就解雇')}
              </div>
            </div>
          </div>

          <!-- 区域与研发 -->
          <div style="margin-bottom:10px;">
            <label style="font-size:12px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:4px;">🔬 区域与研发</label>
            ${toggleRow('set-autoUnlockRegion', '自动解锁区域', getAuto('autoUnlockRegion', true))}
            ${toggleRow('set-autoResearch', '自动启动研发', getAuto('autoResearch', true))}
          </div>

          <!-- 投资 -->
          <div style="margin-bottom:10px;">
            <label style="font-size:12px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:4px;">📈 股票投资</label>
            ${toggleRow('set-autoInvest', '自动股票投资', getAuto('autoInvest', false))}
            <div style="margin-top:6px;">
              <span style="font-size:10px;color:var(--text-muted);display:block;margin-bottom:2px;">投资预算比例</span>
              <div style="display:flex;gap:6px;flex-wrap:wrap;">
                ${autoRadioRow('investBudget', '0.05', '5%', String(getAuto('investBudget', 0.1)), '保守投资')}
                ${autoRadioRow('investBudget', '0.1', '10%', String(getAuto('investBudget', 0.1)), '标准投资')}
                ${autoRadioRow('investBudget', '0.2', '20%', String(getAuto('investBudget', 0.1)), '积极投资')}
                ${autoRadioRow('investBudget', '0.3', '30%', String(getAuto('investBudget', 0.1)), '激进投资')}
              </div>
            </div>
          </div>

          <!-- 贷款 -->
          <div style="margin-bottom:10px;">
            <label style="font-size:12px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:4px;">🏦 贷款管理</label>
            ${toggleRow('set-autoRepay', '自动还款', getAuto('autoRepay', true))}
            ${toggleRow('set-autoLoan', '自动贷款（资金紧张时）', getAuto('autoLoan', false))}
          </div>

          <!-- 社交 -->
          <div style="margin-bottom:10px;">
            <label style="font-size:12px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:4px;">💝 NPC社交</label>
            ${toggleRow('set-autoGift', '自动送礼', getAuto('autoGift', false))}
            <div style="margin-top:6px;">
              <span style="font-size:10px;color:var(--text-muted);display:block;margin-bottom:2px;">单次送礼预算</span>
              <div style="display:flex;gap:6px;flex-wrap:wrap;">
                ${autoRadioRow('giftBudget', '10000', '1万', String(getAuto('giftBudget', 50000)), '小礼物')}
                ${autoRadioRow('giftBudget', '30000', '3万', String(getAuto('giftBudget', 50000)), '中等礼物')}
                ${autoRadioRow('giftBudget', '50000', '5万', String(getAuto('giftBudget', 50000)), '好礼物')}
                ${autoRadioRow('giftBudget', '100000', '10万', String(getAuto('giftBudget', 50000)), '贵重礼物')}
              </div>
            </div>
          </div>
        </div>

        <!-- 按钮 -->
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button class="btn" onclick="Settings.testConnection()" style="flex:1;background:linear-gradient(135deg,var(--accent-cyan),#0891b2);font-size:12px;">🔗 测试连接</button>
          <button class="btn" onclick="Settings.applyAndClose()" style="flex:2;font-size:13px;">💾 保存并应用</button>
        </div>
        <div id="set-status" style="font-size:11px;color:var(--text-secondary);text-align:center;"></div>
      </div>
    `;
    // 绑定托管开关的 onchange 事件
    setTimeout(() => {
      const keyMap = {
        'set-autoEventDecide': 'eventDecide',
        'set-autoOpenBusiness': 'autoOpenBusiness',
        'set-autoUpgradeBusiness': 'autoUpgradeBusiness',
        'set-autoHire': 'autoHire',
        'set-autoFire': 'autoFire',
        'set-autoUnlockRegion': 'autoUnlockRegion',
        'set-autoResearch': 'autoResearch',
        'set-autoInvest': 'autoInvest',
        'set-autoLoan': 'autoLoan',
        'set-autoRepay': 'autoRepay',
        'set-autoGift': 'autoGift',
      };
      Object.entries(keyMap).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el && !el._autoBound) {
          el._autoBound = true;
          el.addEventListener('change', function() {
            Settings.onAutoToggleChange(key, this.checked);
          });
        }
      });
    }, 50);
  }

  function toggleRow(id, label, checked) {
    return `<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;">
      <input id="${id}" type="checkbox" ${checked?'checked':''} style="accent-color:var(--accent-blue);">
      <span>${label}</span>
    </label>`;
  }

  function radioRow(name, value, label, currentValue, desc) {
    const checked = currentValue === value ? 'checked' : '';
    return `<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:11px;padding:6px 10px;background:${checked?'rgba(59,130,246,0.15)':'var(--bg-primary)'};border:1px solid ${checked?'var(--accent-blue)':'var(--border)'};border-radius:6px;color:${checked?'var(--accent-blue)':'var(--text-secondary)'};" title="${escHtml(desc)}">
      <input type="radio" name="${name}" value="${value}" ${checked} style="accent-color:var(--accent-blue);" onchange="Settings.onAutoPrefChange('${value}')">
      ${label}
    </label>`;
  }

  function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  // ========== 获取Ollama模型列表 ==========
  async function fetchModels() {
    const base = document.getElementById('set-llmBase').value.trim() || 'http://localhost:11434';
    const listEl = document.getElementById('set-model-list');
    listEl.innerHTML = '<span style="font-size:11px;color:var(--text-muted);">获取中...</span>';
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 5000);
      const r = await fetch(`${base}/api/tags`, { signal: ctrl.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const data = await r.json();
      const models = (data.models || []).map(m => m.name);
      if (models.length === 0) {
        listEl.innerHTML = '<span style="font-size:11px;color:var(--text-muted);">未找到模型</span>';
      } else {
        listEl.innerHTML = models.map(m =>
          `<button class="btn" onclick="document.getElementById('set-llmModel').value='${escHtml(m)}';Settings.clearModelList();" style="font-size:10px;padding:3px 8px;background:var(--bg-hover);border:1px solid var(--border);border-radius:4px;color:var(--text-secondary);">${escHtml(m)}</button>`
        ).join('');
      }
    } catch(e) {
      listEl.innerHTML = `<span style="font-size:11px;color:var(--red-up);">获取失败: ${escHtml(e.message)}</span>`;
    }
  }

  function clearModelList() {
    const el = document.getElementById('set-model-list');
    if (el) el.innerHTML = '';
  }

  function onAutoPrefChange(value) {
    if (typeof SGame !== 'undefined' && SGame.setAutoPreference) {
      SGame.setAutoPreference(value);
    }
  }

  // ========== 测试连接 ==========
  async function testConnection() {
    const base = document.getElementById('set-llmBase').value.trim();
    const model = document.getElementById('set-llmModel').value.trim();
    const statusEl = document.getElementById('set-status');
    statusEl.textContent = '测试中...';
    statusEl.style.color = 'var(--accent-gold)';

    try {
      // 1. 测试API连通
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 5000);
      const r1 = await fetch(`${base}/api/tags`, { signal: ctrl.signal });
      if (!r1.ok) throw new Error('API不可达 (HTTP ' + r1.status + ')');
      const data = await r1.json();
      const models = (data.models || []).map(m => m.name);

      if (!models.includes(model)) {
        statusEl.textContent = `⚠ 模型 "${model}" 未找到，可用: ${models.slice(0,3).join(', ')}...`;
        statusEl.style.color = 'var(--accent-gold)';
        return;
      }

      // 2. 测试模型生成
      const ctrl2 = new AbortController();
      setTimeout(() => ctrl2.abort(), 10000);
      const r2 = await fetch(`${base}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt: '回复"OK"', stream: false, options: { num_predict: 5 } }),
        signal: ctrl2.signal,
      });
      if (!r2.ok) throw new Error('模型生成失败');
      statusEl.textContent = '✅ 连接成功！模型正常工作';
      statusEl.style.color = 'var(--green-down)';
    } catch(e) {
      statusEl.textContent = `❌ ${e.message}`;
      statusEl.style.color = 'var(--red-up)';
    }
  }

  // ========== 托管设置辅助函数 ==========
  function getAuto(key, defVal) {
    try {
      if (typeof SGame !== 'undefined' && SGame.G && SGame.G.autoMode) {
        if (key === 'upgradeThreshold') {
          const v = SGame.G.autoMode.upgradeThreshold;
          if (v <= 0.25) return 'conservative';
          if (v >= 0.5) return 'aggressive';
          return 'normal';
        }
        if (key === 'maxEmployees' || key === 'fireThreshold') {
          return String(SGame.G.autoMode[key] ?? defVal);
        }
        if (key === 'investBudget' || key === 'giftBudget') {
          return String(SGame.G.autoMode[key] ?? defVal);
        }
        return SGame.G.autoMode[key] ?? defVal;
      }
    } catch(e) {}
    return defVal;
  }

  function autoRadioRow(name, value, label, currentValue, desc) {
    const checked = String(currentValue) === String(value) ? 'checked' : '';
    return `<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:11px;padding:6px 10px;background:${checked?'rgba(245,158,11,0.12)':'var(--bg-primary)'};border:1px solid ${checked?'var(--accent-gold)':'var(--border)'};border-radius:6px;color:${checked?'var(--accent-gold)':'var(--text-secondary)'};" title="${escHtml(desc)}">
      <input type="radio" name="auto_${name}" value="${value}" ${checked} style="accent-color:var(--accent-gold);" onchange="Settings.onAutoSettingChange('${name}', '${value}')">
      ${label}
    </label>`;
  }

  function onAutoSettingChange(key, value) {
    try {
      if (typeof SGame !== 'undefined' && SGame.G && SGame.G.autoMode) {
        switch(key) {
          case 'eventPreference':
            SGame.G.autoMode.eventPreference = value;
            break;
          case 'upgradeThreshold':
            SGame.G.autoMode.upgradeThreshold = upgradeThresholdMap(value);
            break;
          case 'maxEmployees':
            SGame.G.autoMode.maxEmployees = parseInt(value);
            break;
          case 'fireThreshold':
            SGame.G.autoMode.fireThreshold = parseInt(value);
            break;
          case 'investBudget':
            SGame.G.autoMode.investBudget = parseFloat(value);
            break;
          case 'giftBudget':
            SGame.G.autoMode.giftBudget = parseInt(value);
            break;
          default:
            break;
        }
        if (typeof SGame.save === 'function') SGame.save();
      }
    } catch(e) {}
  }

  function onAutoToggleChange(key, checked) {
    try {
      if (typeof SGame !== 'undefined' && SGame.G && SGame.G.autoMode) {
        SGame.G.autoMode[key] = checked;
        if (typeof SGame.save === 'function') SGame.save();
      }
    } catch(e) {}
  }

  // ========== 应用设置并关闭 ==========
  function applyAndClose() {
    const getChecked = (id) => {
      const el = document.getElementById(id);
      return el ? el.checked : false;
    };
    const getRadioValue = (name) => {
      const el = document.querySelector('input[name="' + name + '"]:checked');
      return el ? el.value : null;
    };

    const newSettings = {
      llmBase: document.getElementById('set-llmBase').value.trim(),
      llmModel: document.getElementById('set-llmModel').value.trim(),
      temperature: parseFloat(document.getElementById('set-temperature').value),
      maxTokens: parseInt(document.getElementById('set-maxTokens').value),
      eventNarrative: getChecked('set-eventNarrative'),
      employeeBg: getChecked('set-employeeBg'),
      npcDialog: getChecked('set-npcDialog'),
      decisionNarrative: getChecked('set-decisionNarrative'),
      atmosphereLLM: getChecked('set-atmosphereLLM'),
      weatherEffects: getChecked('set-weatherEffects'),
      // 托管设置
      auto_eventDecide: getChecked('set-autoEventDecide'),
      auto_eventPreference: getRadioValue('auto_eventPreference') || 'balanced',
      auto_autoOpenBusiness: getChecked('set-autoOpenBusiness'),
      auto_autoUpgradeBusiness: getChecked('set-autoUpgradeBusiness'),
      auto_upgradeThreshold: getRadioValue('auto_upgradeThreshold') || 'normal',
      auto_autoHire: getChecked('set-autoHire'),
      auto_autoFire: getChecked('set-autoFire'),
      auto_fireThreshold: parseInt(getRadioValue('auto_fireThreshold') || '20'),
      auto_maxEmployees: parseInt(getRadioValue('auto_maxEmployees') || '8'),
      auto_autoUnlockRegion: getChecked('set-autoUnlockRegion'),
      auto_autoResearch: getChecked('set-autoResearch'),
      auto_autoInvest: getChecked('set-autoInvest'),
      auto_investBudget: parseFloat(getRadioValue('auto_investBudget') || '0.1'),
      auto_autoLoan: getChecked('set-autoLoan'),
      auto_autoRepay: getChecked('set-autoRepay'),
      auto_autoGift: getChecked('set-autoGift'),
      auto_giftBudget: parseInt(getRadioValue('auto_giftBudget') || '50000'),
    };

    save(newSettings);

    // 强制重检LLM状态
    if (typeof LLM !== 'undefined') {
      LLM.forceRecheck();
    }

    // 应用音效设置
    if (typeof AudioFX !== 'undefined') {
      const audioEl = document.getElementById('set-audioEnabled');
      if (audioEl) {
        const wantEnabled = audioEl.checked;
        if (AudioFX.enabled !== wantEnabled) AudioFX.toggle();
      }
    }

    // 关闭弹窗
    if (typeof UI !== 'undefined') UI.closeModal('settings');

    // 通知
    if (typeof EventSystem !== 'undefined') {
      EventSystem.addLog('[系统] LLM设置已更新');
    }
  }

  // ========== 公开API ==========
  load(); // 启动时加载

  return {
    load, save, get,
    defaults,
    get current() { return current; },
    renderSettings,
    fetchModels, clearModelList,
    testConnection, applyAndClose,
    onAutoPrefChange,
    onAutoSettingChange,
    onAutoToggleChange,
    getAuto,
  };
})();
