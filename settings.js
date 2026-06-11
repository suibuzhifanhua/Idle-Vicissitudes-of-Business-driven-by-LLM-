// Author: Fisheep.L
// ==================================================
// settings.js — LLM参数设置面板，localStorage持久化
// ==================================================

window.Settings = (() => {
  const STORAGE_KEY = 'shanghaifc_settings';

  // 默认值
  const defaults = {
    llmBase: '',  // Ollama 代理路径（留空走 /api/ollama 代理）
    llmModel: 'qwen3.5:4b',
    temperature: 0.7,
    maxTokens: 1024,
    eventNarrative: true,   // 事件叙事LLM
    employeeBg: true,       // 员工背景LLM
    npcDialog: true,        // NPC对话LLM
    decisionNarrative: true,// 决策叙事LLM
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
      autoNegotiate: true,
      autoAssetBuy: true,
      autoAssetPawn: true,
      autoRepay: true,
      autoGift: false,
      giftBudget: 50000,
      autoManualWork: true,
      autoRest: true,
    },
  };

  let current = {};

  function load() {
    try {
      const raw = Storage.get(STORAGE_KEY);
      if (raw) {
        current = { ...defaults, ...JSON.parse(raw) };
        // 迁移旧版直连模式 → 代理 Ollama（处理 localhost/127.0.0.1 + 有/无尾部斜杠）
        const baseVal = (current.llmBase || '').trim().toLowerCase();
        if (baseVal === 'http://localhost:11434' || baseVal === 'http://localhost:11434/' ||
            baseVal === 'http://127.0.0.1:11434' || baseVal === 'http://127.0.0.1:11434/') {
          current.llmBase = '';
          save({ llmBase: '' });
        }
        // 同步：应用时同样过滤
        if (typeof CONFIG !== 'undefined') {
          const cfgBase = (CONFIG.LLM_BASE || '').trim().toLowerCase();
          if (cfgBase === 'http://localhost:11434' || cfgBase === 'http://localhost:11434/' ||
              cfgBase === 'http://127.0.0.1:11434' || cfgBase === 'http://127.0.0.1:11434/') {
            CONFIG.LLM_BASE = '';
          }
        }
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

    // 同步托管配置到游戏状态（从localStorage恢复，动态遍历默认值key）
    try {
      if (typeof SGame !== 'undefined' && SGame.G && SGame.G.autoMode && current.autoMode) {
        const savedAm = current.autoMode;
        const defAm = defaults.autoMode;
        Object.keys(defAm).forEach(function(key) {
          if (key === 'upgradeThreshold') {
            SGame.G.autoMode.upgradeThreshold = upgradeThresholdMap(savedAm.upgradeThreshold || defAm.upgradeThreshold);
          } else if (key in savedAm) {
            SGame.G.autoMode[key] = savedAm[key] ?? defAm[key];
          }
        });
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
    Storage.set(STORAGE_KEY, JSON.stringify(current));
    // 同步更新CONFIG（运行时使用）
    if (typeof CONFIG !== 'undefined') {
      CONFIG.LLM_BASE = current.llmBase;
      CONFIG.LLM_MODEL = current.llmModel;
    }
  }

  function get(key) {
    const val = current[key] ?? defaults[key];
    // 自动将 localhost/127.0.0.1:11434 直连 → 代理，解决 CORS 跨域问题
    if (key === 'llmBase' && val) {
      const v = String(val).trim().toLowerCase();
      if (v === 'http://localhost:11434' || v === 'http://localhost:11434/' ||
          v === 'http://127.0.0.1:11434' || v === 'http://127.0.0.1:11434/') return '';
    }
    return val;
  }

  // ========== 渲染设置面板 ==========
  function renderSettings() {
    const container = document.getElementById('settings-content');
    if (!container) return;

    const s = load();

    const C = function(cls, body) { return '<div class="' + cls + '">' + body + '</div>'; };
    const ICON = function(icon, label, h) { return '<span class="settings-section-icon">' + icon + '</span><span>' + label + '</span>' + (h ? '<span class="settings-section-hint">' + h + '</span>' : ''); };

    container.innerHTML = `
      <style>
        .st-tabs{display:flex;gap:4px;margin-bottom:18px;background:var(--bg-primary);border-radius:10px;padding:4px;}
        .st-tab{flex:1;padding:9px 0;cursor:pointer;font-size:13px;font-weight:600;border:none;background:transparent;color:var(--text-muted);border-radius:8px;transition:all .2s;font-family:var(--font);}
        .st-tab.act{background:var(--bg-card);color:var(--accent-gold);box-shadow:0 2px 8px rgba(0,0,0,.2);}
        .st-tab:hover:not(.act){color:var(--text-primary);}
        .st-panel{display:none;}
        .st-panel.act{display:block;}
        .st-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .st-full{grid-column:span 2;}
        .st-label{font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;font-weight:600;letter-spacing:.02em;}
        .st-input{width:100%;padding:8px 10px;background:var(--bg-primary);border:1px solid var(--border);border-radius:7px;color:var(--text-primary);font-size:12px;font-family:var(--font);box-sizing:border-box;transition:border-color .2s;}
        .st-input:focus{border-color:var(--accent-gold);outline:none;box-shadow:0 0 0 3px rgba(245,158,11,.1);}
        .st-range{width:100%;accent-color:var(--accent-gold);height:6px;margin:8px 0;}
        .st-range-hint{display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted);}
        .st-toggle{display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--bg-primary);border:1px solid var(--border);border-radius:7px;cursor:pointer;font-size:12px;color:var(--text-primary);transition:all .15s;}
        .st-toggle:hover{border-color:var(--accent-blue);}
        .st-toggle input[type=checkbox]{accent-color:var(--accent-blue);width:16px;height:16px;margin:0;flex-shrink:0;}
        .st-toggle-sm{font-size:11px;padding:5px 10px;}
        .st-toggle-on{border-color:rgba(59,130,246,.35);background:rgba(59,130,246,.06);}
        .st-card{background:var(--bg-primary);border:1px solid var(--border);border-radius:10px;padding:12px;transition:border-color .15s;}
        .st-card:hover{border-color:rgba(245,158,11,.2);}
        .st-card-title{font-size:12px;font-weight:700;color:var(--text-primary);margin-bottom:10px;display:flex;align-items:center;gap:6px;}
        .st-card-title .st-card-icon{font-size:15px;}
        .st-card-sub{font-size:10px;color:var(--text-muted);margin-bottom:8px;}
        .st-radios{display:flex;gap:3px;flex-wrap:wrap;margin:6px 0;}
        .st-radio{display:flex;align-items:center;gap:5px;cursor:pointer;font-size:10px;padding:5px 9px;background:var(--bg-primary);border:1px solid var(--border);border-radius:6px;color:var(--text-secondary);transition:all .15s;white-space:nowrap;}
        .st-radio input[type=radio]{accent-color:var(--accent-gold);width:12px;height:12px;margin:0;}
        .st-radio:has(input:checked){background:rgba(245,158,11,.12);border-color:var(--accent-gold);color:var(--accent-gold);font-weight:600;}
        .st-radio:hover:not(:has(input:checked)){border-color:var(--text-muted);}
        .st-master{display:flex;align-items:center;padding:12px 14px;background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.2);border-radius:10px;margin-bottom:14px;cursor:pointer;transition:all .15s;}
        .st-master:hover{border-color:rgba(34,197,94,.35);}
        .st-master input[type=checkbox]{accent-color:#22c55e;width:18px;height:18px;flex-shrink:0;}
        .st-master-label{flex:1;margin-left:10px;}
        .st-master-label .st-master-title{font-size:13px;font-weight:700;color:var(--text-primary);}
        .st-master-label .st-master-desc{font-size:10px;color:var(--text-muted);margin-top:2px;}
        .st-btns{display:flex;gap:10px;margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}
        .st-btn{padding:10px 20px;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;font-family:var(--font);transition:all .2s;text-align:center;}
        .st-btn-save{flex:3;background:linear-gradient(135deg,var(--accent-gold),#d97706);color:#fff;}
        .st-btn-save:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(245,158,11,.3);}
        .st-btn-test{flex:2;background:rgba(6,182,212,.12);color:var(--accent-cyan);border:1px solid rgba(6,182,212,.25);}
        .st-btn-test:hover{background:rgba(6,182,212,.22);}
        .st-btn-reset{flex:1;background:transparent;color:var(--text-muted);border:1px solid var(--border);}
        .st-btn-reset:hover{color:var(--red-up);border-color:var(--red-up);}
        .st-status{font-size:11px;color:var(--text-secondary);text-align:center;padding:8px 0;min-height:20px;}
        #set-model-list{margin-top:8px;display:flex;flex-wrap:wrap;gap:4px;}
        #set-model-list .st-model-chip{padding:3px 10px;background:var(--bg-hover);border:1px solid var(--border);border-radius:5px;font-size:10px;color:var(--text-secondary);cursor:pointer;font-family:var(--font);transition:all .15s;}
        #set-model-list .st-model-chip:hover{color:var(--accent-cyan);border-color:var(--accent-cyan);}
      </style>

      <div class="st-tabs">
        <button class="st-tab act" onclick="Settings.switchTab('tab-llm',this)">⚙ LLM设置</button>
        <button class="st-tab" onclick="Settings.switchTab('tab-auto',this)">🤖 托管管理</button>
      </div>

      <!-- ========== Tab 1: LLM 设置 ========== -->
      <div class="st-panel act" id="tab-llm">
        <div class="st-grid2">
          <div class="st-full">
            <label class="st-label">🔗 Ollama API 地址</label>
            <input id="set-llmBase" type="text" class="st-input" value="${escHtml(get('llmBase'))}" placeholder="留空走代理 (推荐)">
          </div>
          <div class="st-full">
            <label class="st-label">🧠 模型名称</label>
            <div style="display:flex;gap:8px;">
              <input id="set-llmModel" type="text" class="st-input" value="${escHtml(s.llmModel)}" placeholder="qwen3.5:4b" style="flex:1;">
              <button class="st-btn st-btn-test" onclick="Settings.fetchModels()" style="flex:0 0 auto;padding:8px 14px;font-size:11px;white-space:nowrap;">🔍 获取模型</button>
            </div>
            <div id="set-model-list"></div>
          </div>
          <div>
            <label class="st-label">🎨 创意度 <span id="set-temp-val" style="color:var(--accent-gold);font-weight:700;">${s.temperature.toFixed(1)}</span></label>
            <input id="set-temperature" type="range" class="st-range" min="0" max="2" step="0.1" value="${s.temperature}"
              oninput="document.getElementById('set-temp-val').textContent=parseFloat(this.value).toFixed(1)">
            <div class="st-range-hint"><span>精确 0</span><span>均衡 1.0</span><span>创意 2.0</span></div>
          </div>
          <div>
            <label class="st-label">📝 最大输出 <span id="set-tokens-val" style="color:var(--accent-gold);font-weight:700;">${s.maxTokens}</span> tokens</label>
            <input id="set-maxTokens" type="range" class="st-range" min="50" max="1000" step="50" value="${s.maxTokens}"
              oninput="document.getElementById('set-tokens-val').textContent=this.value">
            <div class="st-range-hint"><span>简短 50</span><span>标准 500</span><span>详细 1000</span></div>
          </div>
        </div>

        <div style="margin:14px 0;">
          <label class="st-label" style="margin-bottom:8px;">✨ LLM 功能开关</label>
          <div class="st-grid2">
            ${toggleRowV2('set-eventNarrative', '📖 事件叙事', '事件触发时生成沉浸式故事', s.eventNarrative)}
            ${toggleRowV2('set-employeeBg', '👤 员工背景', '招聘时为员工生成背景故事', s.employeeBg)}
            ${toggleRowV2('set-npcDialog', '💬 NPC对话', '与NPC互动时生成个性对话', s.npcDialog)}
            ${toggleRowV2('set-decisionNarrative', '⚡ 决策叙事', '做出决策时生成情境描写', s.decisionNarrative)}
          </div>
        </div>

        <div style="margin:14px 0;">
          <label class="st-label" style="margin-bottom:8px;">🔊 音效设置</label>
          ${toggleRowV2('set-audioEnabled', '🔊 游戏音效', '控制游戏内所有音效开关', typeof AudioFX !== 'undefined' && AudioFX ? AudioFX.enabled : true)}
        </div>

        <div class="st-btns">
          <button class="st-btn st-btn-test" onclick="Settings.testConnection()">🔗 测试连接</button>
          <button class="st-btn st-btn-save" onclick="Settings.applyAndClose()">💾 保存并应用</button>
          <button class="st-btn st-btn-reset" onclick="Settings.resetToDefaults()">↺ 重置</button>
        </div>
        <div id="set-status" class="st-status"></div>
      </div>

      <!-- ========== Tab 2: 托管管理 ========== -->
      <div class="st-panel" id="tab-auto" style="max-height:52vh;overflow-y:auto;padding-right:4px;">
        <!-- 主开关 -->
        <label class="st-master">
          <input id="set-autoMasterEnabled" type="checkbox" ${getAutoMasterEnabled()?'checked':''} style="margin:0;">
          <div class="st-master-label">
            <div class="st-master-title">🔛 启用全自动托管</div>
            <div class="st-master-desc">开启后 AI 将接管游戏内所有决策，关闭则暂停自动操作</div>
          </div>
        </label>

        <div class="st-grid2">
          <!-- 事件决策 -->
          <div class="st-card">
            <div class="st-card-title"><span class="st-card-icon">📋</span> 事件决策</div>
            ${toggleRowV2('set-autoEventDecide', '自动决策事件', '', getAuto('eventDecide', true), true)}
            <div class="st-card-sub">决策偏好</div>
            <div class="st-radios">
              ${autoRadioRow('eventPreference', 'balanced', '⚖ 均衡', getAuto('eventPreference', 'balanced'), '综合评估')}
              ${autoRadioRow('eventPreference', 'aggressive', '🚀 激进', getAuto('eventPreference', 'balanced'), '追高收益')}
              ${autoRadioRow('eventPreference', 'conservative', '🛡 保守', getAuto('eventPreference', 'balanced'), '避免损失')}
              ${autoRadioRow('eventPreference', 'social', '🤝 社交', getAuto('eventPreference', 'balanced'), '提升好感')}
            </div>
          </div>

          <!-- 业务管理 -->
          <div class="st-card">
            <div class="st-card-title"><span class="st-card-icon">🏢</span> 业务管理</div>
            ${toggleRowV2('set-autoOpenBusiness', '自动开设业务', '', getAuto('autoOpenBusiness', true), true)}
            ${toggleRowV2('set-autoUpgradeBusiness', '自动升级业务', '', getAuto('autoUpgradeBusiness', true), true)}
            <div class="st-card-sub">升级资金阈值</div>
            <div class="st-radios">
              ${autoRadioRow('upgradeThreshold', 'conservative', '保守 5x', getAuto('upgradeThreshold', 'normal'), '资金需5倍升级费')}
              ${autoRadioRow('upgradeThreshold', 'normal', '正常 3x', getAuto('upgradeThreshold', 'normal'), '资金需3倍升级费')}
              ${autoRadioRow('upgradeThreshold', 'aggressive', '激进 1.5x', getAuto('upgradeThreshold', 'normal'), '资金仅需1.5倍')}
            </div>
          </div>

          <!-- 员工管理 -->
          <div class="st-card">
            <div class="st-card-title"><span class="st-card-icon">👥</span> 员工管理</div>
            ${toggleRowV2('set-autoHire', '自动招聘', '', getAuto('autoHire', true), true)}
            <div class="st-card-sub">员工上限（托管模式）</div>
            <div class="st-radios">
              ${autoRadioRow('maxEmployees', '8', '8人', String(getAuto('maxEmployees', 8)), '小团队')}
              ${autoRadioRow('maxEmployees', '15', '15人', String(getAuto('maxEmployees', 8)), '中等团队')}
              ${autoRadioRow('maxEmployees', '30', '30人', String(getAuto('maxEmployees', 8)), '标准团队')}
              ${autoRadioRow('maxEmployees', '50', '50人', String(getAuto('maxEmployees', 8)), '大型团队')}
              ${autoRadioRow('maxEmployees', '99', '不限', String(getAuto('maxEmployees', 8)), '有多少招多少')}
            </div>
            ${toggleRowV2('set-autoFire', '自动解雇低忠诚度', '', getAuto('autoFire', false), true)}
            <div class="st-card-sub">解雇阈值</div>
            <div class="st-radios">
              ${autoRadioRow('fireThreshold', '10', '≤10', String(getAuto('fireThreshold', 20)), '极低')}
              ${autoRadioRow('fireThreshold', '20', '≤20', String(getAuto('fireThreshold', 20)), '较低')}
              ${autoRadioRow('fireThreshold', '30', '≤30', String(getAuto('fireThreshold', 20)), '略低')}
            </div>
          </div>

          <!-- 区域与研发 -->
          <div class="st-card">
            <div class="st-card-title"><span class="st-card-icon">🔬</span> 区域与研发</div>
            ${toggleRowV2('set-autoUnlockRegion', '自动解锁区域', '', getAuto('autoUnlockRegion', true), true)}
            ${toggleRowV2('set-autoResearch', '自动启动研发', '', getAuto('autoResearch', true), true)}
            <div style="height:8px;"></div>
            <div class="st-card-title"><span class="st-card-icon">📈</span> 股票投资</div>
            ${toggleRowV2('set-autoInvest', '自动股票投资', '', getAuto('autoInvest', false), true)}
            <div class="st-card-sub">投资预算</div>
            <div class="st-radios">
              ${autoRadioRow('investBudget', '0.05', '5%', String(getAuto('investBudget', 0.1)), '保守')}
              ${autoRadioRow('investBudget', '0.1', '10%', String(getAuto('investBudget', 0.1)), '标准')}
              ${autoRadioRow('investBudget', '0.2', '20%', String(getAuto('investBudget', 0.1)), '积极')}
              ${autoRadioRow('investBudget', '0.3', '30%', String(getAuto('investBudget', 0.1)), '激进')}
            </div>
          </div>

          <!-- 贷款 -->
          <div class="st-card">
            <div class="st-card-title"><span class="st-card-icon">🏦</span> 贷款管理</div>
            ${toggleRowV2('set-autoRepay', '自动还款', '', getAuto('autoRepay', true), true)}
            ${toggleRowV2('set-autoLoan', '自动贷款（资金紧张）', '', getAuto('autoLoan', false), true)}
          </div>

          <!-- NPC社交 -->
          <div class="st-card">
            <div class="st-card-title"><span class="st-card-icon">💝</span> NPC社交</div>
            ${toggleRowV2('set-autoGift', '自动送礼', '', getAuto('autoGift', false), true)}
            <div class="st-card-sub">单次送礼预算</div>
            <div class="st-radios">
              ${autoRadioRow('giftBudget', '10000', '1万', String(getAuto('giftBudget', 50000)), '小礼物')}
              ${autoRadioRow('giftBudget', '30000', '3万', String(getAuto('giftBudget', 50000)), '中等')}
              ${autoRadioRow('giftBudget', '50000', '5万', String(getAuto('giftBudget', 50000)), '好礼')}
              ${autoRadioRow('giftBudget', '100000', '10万', String(getAuto('giftBudget', 50000)), '贵重')}
            </div>
          </div>

          <!-- 自动操作 -->
          <div class="st-card">
            <div class="st-card-title"><span class="st-card-icon">🤝</span> 自动操作</div>
            ${toggleRowV2('set-autoManualWork', '自动拉项目/谈合作', 'CD到了自动点击', getAuto('autoManualWork', true), true)}
            ${toggleRowV2('set-autoRest', '自动员工休息', '疲劳>60自动休息', getAuto('autoRest', true), true)}
            ${toggleRowV2('set-autoNegotiate', '自动商务约谈', '每60tick与好感>40的NPC约谈', getAuto('autoNegotiate', true), true)}
            ${toggleRowV2('set-autoAssetBuy', '自动资产投资', '资金充裕时购买资产', getAuto('autoAssetBuy', true), true)}
            ${toggleRowV2('set-autoAssetPawn', '自动资产典当', '资金窘迫时典当低值资产救急', getAuto('autoAssetPawn', true), true)}
          </div>
        </div>

        <div class="st-btns">
          <button class="st-btn st-btn-save" onclick="Settings.applyAndClose()">💾 保存并应用</button>
          <button class="st-btn st-btn-reset" onclick="Settings.resetAutoDefaults()">↺ 恢复默认</button>
        </div>
        <div id="set-status-auto" class="st-status"></div>
      </div>
    `;

    // 绑定托管开关事件
    setTimeout(() => { bindAutoToggles(); }, 50);
  }

  // ========== Tab 切换 ==========
  function switchTab(tabId, btn) {
    document.querySelectorAll('.st-tab').forEach(function(t) { t.classList.remove('act'); });
    document.querySelectorAll('.st-panel').forEach(function(p) { p.classList.remove('act'); });
    if (btn) btn.classList.add('act');
    document.getElementById(tabId).classList.add('act');
  }

  function toggleRowV2(id, label, desc, checked, compact) {
    var cls = 'st-toggle' + (compact ? ' st-toggle-sm' : '') + (checked ? ' st-toggle-on' : '');
    var descHtml = desc ? '<span style="font-size:10px;color:var(--text-muted);margin-left:auto;">' + desc + '</span>' : '';
    return '<label class="' + cls + '">' +
      '<input id="' + id + '" type="checkbox" ' + (checked ? 'checked' : '') + '>' +
      '<span>' + label + '</span>' + descHtml +
      '</label>';
  }

  function bindAutoToggles() {
    var keyMap = {
      'set-autoMasterEnabled': 'enabled',
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
      'set-autoManualWork': 'autoManualWork',
      'set-autoRest': 'autoRest',
      'set-autoNegotiate': 'autoNegotiate',
      'set-autoAssetBuy': 'autoAssetBuy',
      'set-autoAssetPawn': 'autoAssetPawn',
    };
    Object.entries(keyMap).forEach(function(e) {
      var el = document.getElementById(e[0]);
      if (el && !el._autoBound) {
        el._autoBound = true;
        el.addEventListener('change', function() {
          Settings.onAutoToggleChange(e[1], this.checked);
        });
      }
    });
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
    let base = document.getElementById('set-llmBase').value.trim();
    // localhost/127.0.0.1:11434 直连会被浏览器 CORS 拦截，统一走 /api/ollama 代理
    const baseLc = base.toLowerCase();
    if (!base || baseLc === 'http://localhost:11434' || baseLc === 'http://localhost:11434/' ||
        baseLc === 'http://127.0.0.1:11434' || baseLc === 'http://127.0.0.1:11434/') {
      base = '/api/ollama';
    }
    // 去掉尾部斜杠避免双斜杠
    base = base.replace(/\/+$/, '');
    const listEl = document.getElementById('set-model-list');
    listEl.innerHTML = '<span style="font-size:11px;color:var(--text-muted);">获取中...</span>';
    try {
      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), 15000);
      const r = await fetch(`${base}/api/tags`, { signal: ctrl.signal });
      clearTimeout(timeoutId);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const data = await r.json();
      const models = (data.models || []).map(m => m.name);
      if (models.length === 0) {
        listEl.innerHTML = '<span style="font-size:11px;color:var(--text-muted);">未找到模型</span>';
      } else {
        listEl.innerHTML = models.map(function(m) {
          return '<button class="st-model-chip" onclick="document.getElementById(\'set-llmModel\').value=\'' + escHtml(m) + '\';Settings.clearModelList();">' + escHtml(m) + '</button>';
        }).join('');
      }
    } catch(e) {
      var errMsg = e.name === 'AbortError' ? '请求超时(15s)，Ollama服务响应过慢或未运行' : e.message;
      listEl.innerHTML = `<span style="font-size:11px;color:var(--red-up);">获取失败: ${escHtml(errMsg)}</span>`;
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
    const model = document.getElementById('set-llmModel').value.trim();
    const llmBase = document.getElementById('set-llmBase').value.trim();
    // 统一使用与 llm.js 相同的 url 拼接逻辑
    var apiUrl;
    if (typeof LLM !== 'undefined' && LLM.ollamaUrl) {
      apiUrl = LLM.ollamaUrl('/api/tags');
    } else {
      var base = llmBase || 'http://localhost:11434';
      apiUrl = base.replace(/\/+$/, '') + '/api/tags';
    }
    const statusEl = document.getElementById('set-status');
    statusEl.textContent = '测试中...';
    statusEl.style.color = 'var(--accent-gold)';

    try {
      // 1. 测试API连通
      const ctrl = new AbortController();
      const timeoutId1 = setTimeout(() => ctrl.abort(), 15000);
      const r1 = await fetch(apiUrl, { signal: ctrl.signal });
      clearTimeout(timeoutId1);
      if (!r1.ok) throw new Error('API不可达 (HTTP ' + r1.status + ')');
      const data = await r1.json();
      const models = (data.models || []).map(m => m.name);

      if (!models.includes(model)) {
        statusEl.textContent = `⚠ 模型 "${model}" 未找到，可用: ${models.slice(0,3).join(', ')}...`;
        statusEl.style.color = 'var(--accent-gold)';
        return;
      }

      // 2. 测试模型生成
      var generateUrl;
      if (typeof LLM !== 'undefined' && LLM.ollamaUrl) {
        generateUrl = LLM.ollamaUrl('/api/generate');
      } else {
        generateUrl = (llmBase || 'http://localhost:11434').replace(/\/+$/, '') + '/api/generate';
      }
      const ctrl2 = new AbortController();
      const timeoutId2 = setTimeout(() => ctrl2.abort(), 20000);
      const r2 = await fetch(generateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt: '回复"OK"', stream: false, options: { num_predict: 5 } }),
        signal: ctrl2.signal,
      });
      clearTimeout(timeoutId2);
      if (!r2.ok) throw new Error('模型生成失败');
      statusEl.textContent = '✅ 连接成功！模型正常工作';
      statusEl.style.color = 'var(--green-down)';
    } catch(e) {
      var connErrMsg = e.name === 'AbortError' ? '连接超时，Ollama服务响应过慢或未启动' : e.message;
      statusEl.textContent = `❌ ${connErrMsg}`;
      statusEl.style.color = 'var(--red-up)';
    }
  }

  // ========== 托管设置辅助函数 ==========
  function getAutoMasterEnabled() {
    try {
      if (typeof SGame !== 'undefined' && SGame.G && SGame.G.autoMode) {
        return !!SGame.G.autoMode.enabled;
      }
    } catch(e) { console.warn('[Settings] getAutoMasterEnabled failed:', e.message || e); }
    return false;
  }

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
    } catch(e) { console.warn('[Settings] getAuto failed for key "' + key + '":', e.message || e); }
    return defVal;
  }

  function autoRadioRow(name, value, label, currentValue, desc) {
    const checked = String(currentValue) === String(value) ? 'checked' : '';
    return '<label class="st-radio" title="' + escHtml(desc) + '">' +
      '<input type="radio" name="auto_' + name + '" value="' + value + '" ' + checked + ' onchange="Settings.onAutoSettingChange(\'' + name + '\', \'' + value + '\')">' +
      label +
      '</label>';
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
    } catch(e) { console.warn('[Settings] onAutoSettingChange failed:', e.message || e); }
  }

  function onAutoToggleChange(key, checked) {
    try {
      if (typeof SGame !== 'undefined' && SGame.G && SGame.G.autoMode) {
        SGame.G.autoMode[key] = checked;
        if (typeof SGame.save === 'function') SGame.save();
      }
    } catch(e) { console.warn('[Settings] onAutoToggleChange failed:', e.message || e); }
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

    let rawBase = document.getElementById('set-llmBase').value.trim();
    // localhost:11434 直连会被浏览器 CORS 拦截，保存时自动清空以走代理
    if (rawBase === 'http://localhost:11434' || rawBase === 'http://localhost:11434/') rawBase = '';

    const newSettings = {
      llmBase: rawBase,
      llmModel: document.getElementById('set-llmModel').value.trim(),
      temperature: parseFloat(document.getElementById('set-temperature').value),
      maxTokens: parseInt(document.getElementById('set-maxTokens').value),
      eventNarrative: getChecked('set-eventNarrative'),
      employeeBg: getChecked('set-employeeBg'),
      npcDialog: getChecked('set-npcDialog'),
      decisionNarrative: getChecked('set-decisionNarrative'),
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
      auto_autoManualWork: getChecked('set-autoManualWork'),
      auto_autoRest: getChecked('set-autoRest'),
      auto_autoNegotiate: getChecked('set-autoNegotiate'),
      auto_autoAssetBuy: getChecked('set-autoAssetBuy'),
      auto_autoAssetPawn: getChecked('set-autoAssetPawn'),
    };

    save(newSettings);

    // 自动托管主开关：优先尊重主开关选择
    if (typeof SGame !== 'undefined' && SGame.G && SGame.G.autoMode) {
      const anyOn = newSettings.auto_eventDecide || newSettings.auto_autoHire ||
        newSettings.auto_autoOpenBusiness || newSettings.auto_autoUpgradeBusiness ||
        newSettings.auto_autoFire || newSettings.auto_autoResearch ||
        newSettings.auto_autoUnlockRegion || newSettings.auto_autoInvest ||
        newSettings.auto_autoLoan || newSettings.auto_autoRepay ||
        newSettings.auto_autoGift || newSettings.auto_autoManualWork ||
        newSettings.auto_autoRest || newSettings.auto_autoNegotiate ||
        newSettings.auto_autoAssetBuy || newSettings.auto_autoAssetPawn;
      const masterCheck = document.getElementById('set-autoMasterEnabled');
      // 主开关已存在 → 完全按用户选择
      if (masterCheck) {
        SGame.G.autoMode.enabled = masterCheck.checked;
      } else {
        // 降级：任何子功能开启则启用
        SGame.G.autoMode.enabled = anyOn;
      }
      // ★ 关键：同步所有子开关到 G.autoMode（否则需要刷新页面才生效）
      SGame.G.autoMode.eventDecide = newSettings.auto_eventDecide;
      SGame.G.autoMode.eventPreference = newSettings.auto_eventPreference;
      SGame.G.autoMode.autoOpenBusiness = newSettings.auto_autoOpenBusiness;
      SGame.G.autoMode.autoUpgradeBusiness = newSettings.auto_autoUpgradeBusiness;
      SGame.G.autoMode.upgradeThreshold = upgradeThresholdMap(newSettings.auto_upgradeThreshold || 'normal');
      SGame.G.autoMode.autoHire = newSettings.auto_autoHire;
      SGame.G.autoMode.autoFire = newSettings.auto_autoFire;
      SGame.G.autoMode.fireThreshold = newSettings.auto_fireThreshold;
      SGame.G.autoMode.maxEmployees = newSettings.auto_maxEmployees;
      SGame.G.autoMode.autoUnlockRegion = newSettings.auto_autoUnlockRegion;
      SGame.G.autoMode.autoResearch = newSettings.auto_autoResearch;
      SGame.G.autoMode.autoInvest = newSettings.auto_autoInvest;
      SGame.G.autoMode.investBudget = newSettings.auto_investBudget;
      SGame.G.autoMode.autoLoan = newSettings.auto_autoLoan;
      SGame.G.autoMode.autoRepay = newSettings.auto_autoRepay;
      SGame.G.autoMode.autoGift = newSettings.auto_autoGift;
      SGame.G.autoMode.giftBudget = newSettings.auto_giftBudget;
      SGame.G.autoMode.autoManualWork = newSettings.auto_autoManualWork;
      SGame.G.autoMode.autoRest = newSettings.auto_autoRest;
      SGame.G.autoMode.autoNegotiate = newSettings.auto_autoNegotiate;
      SGame.G.autoMode.autoAssetBuy = newSettings.auto_autoAssetBuy;
      SGame.G.autoMode.autoAssetPawn = newSettings.auto_autoAssetPawn;
      if (SGame.G.autoMode.enabled && typeof EventSystem !== 'undefined') {
        EventSystem.addLog('[托管] 全自动托管已开启');
      }
      // 同步主UI按钮
      const mainToggle = document.getElementById('auto-toggle-input');
      if (mainToggle) mainToggle.checked = SGame.G.autoMode.enabled;
      const mainStatus = document.getElementById('auto-toggle-status');
      if (mainStatus) mainStatus.textContent = SGame.G.autoMode.enabled ? '托管中' : '关闭';
    }

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

  // ========== 重置功能 ==========
  function resetToDefaults() {
    current = { ...defaults };
    Storage.set(STORAGE_KEY, JSON.stringify(current));
    if (typeof CONFIG !== 'undefined') {
      CONFIG.LLM_BASE = current.llmBase;
      CONFIG.LLM_MODEL = current.llmModel;
    }
    renderSettings();
    var statusEl = document.getElementById('set-status');
    if (statusEl) {
      statusEl.textContent = '✅ 已恢复 LLM 默认设置';
      statusEl.style.color = 'var(--green-down)';
      setTimeout(function() { statusEl.textContent = ''; }, 2000);
    }
  }

  function resetAutoDefaults() {
    current.autoMode = { ...defaults.autoMode };
    Storage.set(STORAGE_KEY, JSON.stringify(current));
    try {
      if (typeof SGame !== 'undefined' && SGame.G && SGame.G.autoMode) {
        var d = defaults.autoMode;
        Object.keys(d).forEach(function(key) {
          if (key === 'upgradeThreshold') {
            SGame.G.autoMode.upgradeThreshold = upgradeThresholdMap(d.upgradeThreshold);
          } else {
            SGame.G.autoMode[key] = d[key];
          }
        });
        if (typeof SGame.save === 'function') SGame.save();
      }
    } catch(e2) {}
    renderSettings();
    var statusEl = document.getElementById('set-status-auto');
    if (statusEl) {
      statusEl.textContent = '✅ 已恢复托管默认设置';
      statusEl.style.color = 'var(--green-down)';
      setTimeout(function() { statusEl.textContent = ''; }, 2000);
    }
  }

  // ========== 公开API ==========
  load(); // 启动时加载

  return {
    load, save, get,
    defaults,
    get current() { return current; },
    renderSettings, switchTab,
    fetchModels, clearModelList,
    testConnection, applyAndClose,
    resetToDefaults, resetAutoDefaults,
    onAutoPrefChange,
    onAutoSettingChange,
    onAutoToggleChange,
    getAuto,
    bindAutoToggles,
  };
})();
