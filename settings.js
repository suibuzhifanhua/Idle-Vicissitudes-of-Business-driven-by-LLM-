// Author: Fisheep.L
// ==================================================
// settings.js — LLM参数设置面板，localStorage持久化
// ==================================================

window.Settings = (() => {
  const STORAGE_KEY = 'shanghaifc_settings';

  // 默认值
  const defaults = {
    llmProvider: 'ollama',  // 'ollama' | 'lmstudio' | 'openai'
    llmBase: '',  // Ollama 代理路径（留空走 /api/ollama 代理）
    llmApiKey: '',  // 自定义 OpenAI 兼容端点的密钥
    llmModel: 'qwen3.5:4b',
    // 创意度/最大输出已从界面移除，实际取值以 CONFIG.LLM_TEMPERATURE / LLM_MAX_TOKENS 为准，
    // 这里仅作为 CONFIG 缺失时的兜底
    temperature: 0.85,
    maxTokens: 2048,
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

  // API Key 只写本浏览器 localStorage：存档(settings JSON)会进 saves/ 的 SQLite 并被
  // /api/preload 整体读出，密钥不该随存档一起被复制或分享。
  const KEY_STORE = 'shanghaifc_llm_key';
  function readKeyStore() {
    try { return localStorage.getItem(KEY_STORE) || ''; } catch(e) { return ''; }
  }
  function writeKeyStore(val) {
    try {
      if (val) localStorage.setItem(KEY_STORE, val);
      else localStorage.removeItem(KEY_STORE);
    } catch(e) { SGame.DEBUG && console.warn('[Settings] 密钥本地存储失败:', e.message || e); }
  }
  function stripKey(settings) {
    const copy = Object.assign({}, settings);
    delete copy.llmApiKey;
    return copy;
  }

  // 自定义 OpenAI 兼容端点的服务商预设（base 留空 = 用户自填）
  const OPENAI_PRESETS = [
    { id: 'custom', label: '⚙ 自定义端点（手动填写）', base: '' },
    { id: 'deepseek', label: 'DeepSeek', base: 'https://api.deepseek.com/v1' },
    { id: 'dashscope', label: '阿里云百炼 (DashScope 兼容模式)', base: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
    { id: 'zhipu', label: '智谱 GLM', base: 'https://open.bigmodel.cn/api/paas/v4' },
    { id: 'moonshot', label: 'Moonshot Kimi', base: 'https://api.moonshot.cn/v1' },
    { id: 'openrouter', label: 'OpenRouter', base: 'https://openrouter.ai/api/v1' },
    { id: 'siliconflow', label: '硅基流动 SiliconFlow', base: 'https://api.siliconflow.cn/v1' },
    { id: 'vllm', label: '本地 vLLM / LM Studio 等', base: 'http://localhost:8000/v1' },
  ];

  function presetBase(id) {
    const p = OPENAI_PRESETS.find(x => x.id === id);
    return p ? p.base : '';
  }

  // 各提供商的地址/模型输入提示
  function providerHints(provider) {
    if (provider === 'lmstudio') return {
      baseLabel: '🔗 API 地址 (LM Studio)',
      basePlaceholder: 'http://localhost:1234',
      baseHint: '本机 1234 端口自动走 /api/lmstudio 代理规避 CORS，末尾无需写 /v1。',
      modelPlaceholder: '本地已加载的模型 id',
    };
    if (provider === 'openai') return {
      baseLabel: '🔗 API 地址 (OpenAI 兼容)',
      basePlaceholder: 'https://api.deepseek.com/v1',
      baseHint: '将请求 {地址}/models 与 {地址}/chat/completions，末尾缺版本段时自动补 /v1；由本机 server.py 的 /api/relay 转发，规避浏览器 CORS。',
      modelPlaceholder: '如 deepseek-chat / kimi-k2-0905-preview / qwen-plus',
    };
    return {
      baseLabel: '🔗 Ollama API 地址',
      basePlaceholder: '留空走代理 (推荐)',
      baseHint: '留空即使用 server.py 的 /api/ollama 代理，避免 localhost:11434 被 CORS 拦截。',
      modelPlaceholder: 'qwen3.5:4b',
    };
  }

  function load() {
    try {
      const raw = Storage.get(STORAGE_KEY);
      if (raw) {
        current = { ...defaults, ...JSON.parse(raw) };
        // 迁移旧版直连模式 → 代理 Ollama（处理 localhost/127.0.0.1 + 有/无尾部斜杠）
        // 自定义 OpenAI 端点要按用户填的地址原样使用（例如 Ollama 的 11434/v1 兼容层），不做迁移
        if (current.llmProvider !== 'openai') {
          const baseVal = (current.llmBase || '').trim().toLowerCase();
          if (baseVal === 'http://localhost:11434' || baseVal === 'http://localhost:11434/' ||
              baseVal === 'http://127.0.0.1:11434' || baseVal === 'http://127.0.0.1:11434/') {
            current.llmBase = '';
            save({ llmBase: '' });
          }
          // 迁移：旧版 LM Studio 含 /v1 后缀 → 剥离（保持 localhost:1234）
          if (baseVal === 'http://localhost:1234/v1' || baseVal === 'http://localhost:1234/v1/' ||
              baseVal === 'http://127.0.0.1:1234/v1' || baseVal === 'http://127.0.0.1:1234/v1/') {
            current.llmBase = 'http://localhost:1234';
            save({ llmBase: 'http://localhost:1234' });
          }
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
    current.llmApiKey = readKeyStore();

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
    // 先构建合并后的完整配置
    var mergedSettings = { ...current, ...newSettings };
    // 如果传入的settings中包含auto_前缀的key，同步到mergedSettings.autoMode
    const autoUpdates = {};
    Object.keys(newSettings).forEach(k => {
      if (k.startsWith('auto_')) {
        autoUpdates[k.replace('auto_', '')] = newSettings[k];
      }
    });
    if (Object.keys(autoUpdates).length > 0) {
      mergedSettings.autoMode = { ...mergedSettings.autoMode, ...autoUpdates };
    }
    // 先写 Storage，成功后再更新内存 current 和 CONFIG
    try {
      Storage.set(STORAGE_KEY, JSON.stringify(stripKey(mergedSettings)));
    } catch(e) {
      SGame.DEBUG && console.error('[Settings] 保存失败（Storage写入异常）:', e);
      if (typeof UI !== 'undefined' && UI.showToast) {
        UI.showToast('设置保存失败，请检查存储空间');
      }
      return;
    }
    current = mergedSettings;
    if ('llmApiKey' in mergedSettings) writeKeyStore(String(mergedSettings.llmApiKey || '').trim());
    // 同步更新CONFIG（运行时使用）
    if (typeof CONFIG !== 'undefined') {
      CONFIG.LLM_PROVIDER = current.llmProvider;
      CONFIG.LLM_BASE = current.llmBase;
      CONFIG.LLM_MODEL = current.llmModel;
    }
  }

  function get(key) {
    const val = current[key] ?? defaults[key];
    // 自动将 localhost/127.0.0.1:11434 直连 → 代理，解决 CORS 跨域问题
    // 自定义 OpenAI 端点由 /api/relay 转发，地址按用户输入原样使用，不做迁移
    if (key === 'llmBase' && val && get('llmProvider') !== 'openai') {
      const v = String(val).trim().toLowerCase();
      if (v === 'http://localhost:11434' || v === 'http://localhost:11434/' ||
          v === 'http://127.0.0.1:11434' || v === 'http://127.0.0.1:11434/') return '';
      // 迁移：旧版 LM Studio 含 /v1 后缀 → 自动剥离
      if (v === 'http://localhost:1234/v1' || v === 'http://localhost:1234/v1/' ||
          v === 'http://127.0.0.1:1234/v1' || v === 'http://127.0.0.1:1234/v1/') return 'http://localhost:1234';
    }
    if (key === 'llmProvider' && val !== 'ollama' && val !== 'lmstudio' && val !== 'openai') return 'ollama';
    return val;
  }

  // ========== 渲染设置面板 ==========

  function _renderLLMTab(s) {
    const provider = get('llmProvider');
    const hints = providerHints(provider);
    const isCustom = provider === 'openai';
    const baseVal = get('llmBase');
    const matchedPreset = OPENAI_PRESETS.find(x => x.base && x.base === baseVal);
    const activePreset = matchedPreset ? matchedPreset.id : 'custom';
    return `<!-- ========== Tab 1: LLM 设置 ========== -->
      <div class="st-panel act" id="tab-llm">
        <div class="st-grid2">
          <div class="st-full">
            <label class="st-label">🔌 LLM 提供商</label>
            <select id="set-llmProvider" class="st-input" onchange="Settings.onProviderChange()" style="cursor:pointer;">
              <option value="ollama" ${provider==='ollama'?'selected':''}>Ollama（本机 /api/generate）</option>
              <option value="lmstudio" ${provider==='lmstudio'?'selected':''}>LM Studio（本机 OpenAI 兼容）</option>
              <option value="openai" ${provider==='openai'?'selected':''}>自定义 OpenAI 兼容 API（云端 / 本地推理服务）</option>
            </select>
          </div>
          <div class="st-full${isCustom ? '' : ' hidden'}" id="set-openaiPreset-row">
            <label class="st-label">🌐 常用服务商</label>
            <select id="set-openaiPreset" class="st-input" onchange="Settings.onPresetChange()" style="cursor:pointer;">
              ${OPENAI_PRESETS.map(function(p) {
                return '<option value="' + p.id + '"' + (p.id === activePreset ? ' selected' : '') + '>' + escHtml(p.label) + '</option>';
              }).join('')}
            </select>
            <div class="st-hint">选择后自动填入 API 地址，仍可手动改成任意 OpenAI 格式端点。</div>
          </div>
          <div class="st-full">
            <label class="st-label" id="set-llmBase-label">${escHtml(hints.baseLabel)}</label>
            <input id="set-llmBase" type="text" class="st-input" value="${escHtml(baseVal)}" placeholder="${escHtml(hints.basePlaceholder)}">
            <div class="st-hint" id="set-llmBase-hint">${escHtml(hints.baseHint)}</div>
          </div>
          <div class="st-full${isCustom ? '' : ' hidden'}" id="set-llmApiKey-row">
            <label class="st-label">🔑 API Key</label>
            <div style="display:flex;gap:8px;">
              <input id="set-llmApiKey" type="password" class="st-input" value="${escHtml(get('llmApiKey'))}" placeholder="sk-... （端点无需鉴权可留空）" autocomplete="off" spellcheck="false" style="flex:1;">
              <button type="button" class="st-btn st-btn-test" onclick="Settings.toggleKeyVisibility()" style="flex:0 0 auto;padding:8px 14px;font-size:11px;">👁 显示</button>
            </div>
            <div class="st-hint">密钥只存在本浏览器的 localStorage，不写进 saves/ 存档；请求由本机 server.py 的 /api/relay 转发到上面地址，不经第三方。</div>
          </div>
          <div class="st-full">
            <label class="st-label">🧠 模型名称</label>
            <div style="display:flex;gap:8px;">
              <input id="set-llmModel" type="text" class="st-input" value="${escHtml(s.llmModel)}" placeholder="${escHtml(hints.modelPlaceholder)}" style="flex:1;">
              <button class="st-btn st-btn-test" onclick="Settings.fetchModels()" style="flex:0 0 auto;padding:8px 14px;font-size:11px;white-space:nowrap;">🔍 获取模型</button>
            </div>
            <div id="set-model-list"></div>
          </div>
          <div class="st-full">
            <div class="st-fixed">🎨 创意度 <b>${fixedTemperature()}</b> · 📝 最大输出 <b>${fixedMaxTokens()}</b> tokens <span>已改为固定值，需要调整请改 config-game.js 的 LLM_TEMPERATURE / LLM_MAX_TOKENS</span></div>
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

      `;
  }

  function _renderAutoTab(s) {
    return `<!-- ========== Tab 2: 托管管理 ========== -->
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
  }
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
        .st-hint{font-size:10px;color:var(--text-muted);margin-top:5px;line-height:1.5;}
        .st-fixed{font-size:11px;color:var(--text-secondary);background:var(--bg-primary);border:1px solid var(--border);border-radius:7px;padding:9px 11px;line-height:1.7;}
        .st-fixed b{color:var(--accent-gold);}
        .st-fixed span{color:var(--text-muted);font-size:10px;}
        .hidden{display:none !important;}
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

      ${_renderLLMTab(s)}${_renderAutoTab(s)}    `;

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

  // ========== 提供商切换 ==========
  function applyProviderHints(provider) {
    const hints = providerHints(provider);
    const baseInput = document.getElementById('set-llmBase');
    const modelInput = document.getElementById('set-llmModel');
    const labelEl = document.getElementById('set-llmBase-label');
    const hintEl = document.getElementById('set-llmBase-hint');
    if (labelEl) labelEl.textContent = hints.baseLabel;
    if (hintEl) hintEl.textContent = hints.baseHint;
    if (baseInput) baseInput.placeholder = hints.basePlaceholder;
    if (modelInput) modelInput.placeholder = hints.modelPlaceholder;
  }

  function syncCustomRows() {
    const sel = document.getElementById('set-llmProvider');
    const isCustom = !!sel && sel.value === 'openai';
    ['set-openaiPreset-row', 'set-llmApiKey-row'].forEach(function(id) {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('hidden', !isCustom);
    });
  }

  function onProviderChange() {
    const sel = document.getElementById('set-llmProvider');
    const baseInput = document.getElementById('set-llmBase');
    const modelInput = document.getElementById('set-llmModel');
    if (!sel || !baseInput) return;
    const provider = sel.value;
    if (provider === 'lmstudio') {
      baseInput.value = 'http://localhost:1234';
    } else if (provider === 'ollama') {
      baseInput.value = '';
    } else {
      const preset = presetBase(document.getElementById('set-openaiPreset')?.value);
      if (preset) baseInput.value = preset;
    }
    syncCustomRows();
    applyProviderHints(provider);
    // 切换提供商时必须清空模型名称，避免旧提供商的模型名残留
    if (modelInput) modelInput.value = '';
    clearModelList();
  }

  function onPresetChange() {
    const presetSel = document.getElementById('set-openaiPreset');
    const baseInput = document.getElementById('set-llmBase');
    if (!presetSel || !baseInput) return;
    const base = presetBase(presetSel.value);
    if (base) baseInput.value = base;
  }

  function toggleKeyVisibility() {
    const keyInput = document.getElementById('set-llmApiKey');
    if (!keyInput) return;
    const reveal = keyInput.type === 'password';
    keyInput.type = reveal ? 'text' : 'password';
    const btn = keyInput.parentNode.querySelector('button');
    if (btn) btn.textContent = reveal ? '🙈 隐藏' : '👁 显示';
  }

  // ========== 模型列表渲染 ==========
  function setModelListMsg(text, color) {
    const el = document.getElementById('set-model-list');
    if (el) el.innerHTML = '<span style="font-size:11px;color:' + (color || 'var(--text-muted)') + ';">' + escHtml(text) + '</span>';
  }

  // 用 DOM 事件绑定，避免远端返回的模型 id 拼进内联 onclick
  function renderModelChips(models) {
    const listEl = document.getElementById('set-model-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    if (!models.length) { setModelListMsg('未找到模型'); return; }
    const input = document.getElementById('set-llmModel');
    models.forEach(function(m) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'st-model-chip';
      btn.textContent = m;
      btn.addEventListener('click', function() {
        if (input) input.value = m;
        clearModelList();
      });
      listEl.appendChild(btn);
    });
  }

  // ========== 获取模型列表 ==========
  async function fetchModels() {
    const provider = document.getElementById('set-llmProvider')?.value || 'ollama';
    let base = document.getElementById('set-llmBase').value.trim();
    let baseLc = base.toLowerCase();

    const listEl = document.getElementById('set-model-list');
    listEl.innerHTML = '<span style="font-size:11px;color:var(--text-muted);">获取中...</span>';

    if (provider === 'openai') {
      if (!base) { setModelListMsg('请先填写 API 地址'); return; }
      const key = (document.getElementById('set-llmApiKey')?.value || '').trim();
      const target = normalizeOpenAIBase(base) + '/models';
      try {
        const ctrl = new AbortController();
        const timeoutId = setTimeout(() => ctrl.abort(), 15000);
        const r = await apiFetch('/api/relay?target=' + encodeURIComponent(target), {
          headers: key ? { 'Authorization': 'Bearer ' + key } : {},
          signal: ctrl.signal,
        });
        clearTimeout(timeoutId);
        if (!r.ok) {
          const detail = await readErrorDetail(r);
          throw new Error('HTTP ' + r.status + (detail ? ' · ' + detail : ''));
        }
        const data = await r.json();
        const models = (data.data || data.models || []).map(m => (m && (m.id || m.name)) || m).filter(Boolean);
        renderModelChips(models);
      } catch(e) {
        var openaiErrMsg = e.name === 'AbortError' ? '请求超时(15s)，端点无响应' : (e.message || String(e));
        const presetMatch = OPENAI_PRESETS.find(function(p) { return p.base && target.indexOf(p.base) === 0; });
        setModelListMsg('获取失败: ' + openaiErrMsg + (presetMatch ? '（' + presetMatch.label + ' 需先在服务商控制台创建 API Key）' : ''), 'var(--red-up)');
      }
      return;
    }

    if (provider === 'lmstudio') {
      // LM Studio: GET /v1/models，localhost 走代理规避 CORS
      if (!base) base = 'http://localhost:1234';
      baseLc = base.toLowerCase().replace(/\/+$/, '');
      var fetchUrl;
      if (!baseLc || baseLc === 'http://localhost:1234' || baseLc === 'http://127.0.0.1:1234') {
        fetchUrl = '/api/lmstudio/v1/models';
      } else {
        fetchUrl = base.replace(/\/+$/, '') + '/v1/models';
      }
      try {
        const ctrl = new AbortController();
        const timeoutId = setTimeout(() => ctrl.abort(), 15000);
        const r = await apiFetch(fetchUrl, { signal: ctrl.signal });
        clearTimeout(timeoutId);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const data = await r.json();
        renderModelChips((data.data || []).map(m => m.id).filter(Boolean));
        return;
      } catch(e) {
        var lmsErrMsg = e.name === 'AbortError' ? '请求超时(15s)，LM Studio 服务响应过慢或未运行' : e.message;
        setModelListMsg('获取失败: ' + lmsErrMsg, 'var(--red-up)');
        return;
      }
    }

    // Ollama: GET /api/tags
    // localhost/127.0.0.1:11434 直连会被浏览器 CORS 拦截，统一走 /api/ollama 代理
    if (!base || baseLc === 'http://localhost:11434' || baseLc === 'http://localhost:11434/' ||
        baseLc === 'http://127.0.0.1:11434' || baseLc === 'http://127.0.0.1:11434/') {
      base = '/api/ollama';
    }
    base = base.replace(/\/+$/, '');
    try {
      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), 15000);
      const r = await apiFetch(`${base}/api/tags`, { signal: ctrl.signal });
      clearTimeout(timeoutId);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const data = await r.json();
      renderModelChips((data.models || []).map(m => m.name).filter(Boolean));
    } catch(e) {
      var errMsg = e.name === 'AbortError' ? '请求超时(15s)，Ollama服务响应过慢或未运行' : e.message;
      setModelListMsg('获取失败: ' + errMsg, 'var(--red-up)');
    }
  }

  // 自定义端点走 LLM.fetchApi，本机代理统一附带会话令牌。
  function apiFetch(url, opts) {
    if (typeof LLM !== 'undefined' && LLM.fetchApi) return LLM.fetchApi(url, opts);
    if (typeof Network !== 'undefined' && Network.fetchApi) return Network.fetchApi(url, opts);
    return fetch(url, opts);
  }

  function normalizeOpenAIBase(raw) {
    if (typeof LLM !== 'undefined' && LLM.normalizeOpenAIBase) return LLM.normalizeOpenAIBase(raw);
    var b = String(raw || '').trim().replace(/\/+$/, '');
    if (!/^https?:\/\//i.test(b)) b = (/^(localhost|127\.0\.0\.1)(:|\/|$)/i.test(b) ? 'http://' : 'https://') + b;
    return /\/v\d+$/i.test(b) ? b : b + '/v1';
  }

  // 转发层会把上游 401/404 的 JSON 错误体原样返回，取出来便于定位问题
  async function readErrorDetail(r) {
    try {
      const ct = r.headers.get('Content-Type') || '';
      if (ct.indexOf('json') < 0) return '';
      const body = await r.clone().text();
      const parsed = JSON.parse(body);
      const msg = (parsed.error && (parsed.error.message || parsed.error)) || parsed.message || parsed.detail;
      if (!msg) return '';
      return String(typeof msg === 'string' ? msg : JSON.stringify(msg)).slice(0, 160);
    } catch(e) { return ''; }
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
    const provider = document.getElementById('set-llmProvider')?.value || 'ollama';
    const model = document.getElementById('set-llmModel').value.trim();
    const llmBase = document.getElementById('set-llmBase').value.trim();
    const statusEl = document.getElementById('set-status');
    statusEl.textContent = '测试中...';
    statusEl.style.color = 'var(--accent-gold)';

    try {
      if (provider === 'openai') {
        if (!llmBase) throw new Error('请先填写 API 地址');
        if (!model) throw new Error('请先填写模型名称');
        await testConnectionOpenAI(model, llmBase, statusEl);
      } else if (provider === 'lmstudio') {
        await testConnectionLMStudio(model, llmBase, statusEl);
      } else {
        await testConnectionOllama(model, llmBase, statusEl);
      }
    } catch(e) {
      var connErrMsg = e.name === 'AbortError' ? '连接超时，服务响应过慢或未启动' : e.message;
      statusEl.textContent = `❌ ${connErrMsg}`;
      statusEl.style.color = 'var(--red-up)';
    }
  }

  async function testConnectionOpenAI(model, llmBase, statusEl) {
    const apiKey = (document.getElementById('set-llmApiKey')?.value || '').trim();
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = 'Bearer ' + apiKey;
    const targetBase = normalizeOpenAIBase(llmBase);
    const relayPath = (p) => '/api/relay?target=' + encodeURIComponent(targetBase + p);

    // 1. 端点连通 + 模型列表
    const ctrl = new AbortController();
    const timeoutId1 = setTimeout(() => ctrl.abort(), 15000);
    const r1 = await apiFetch(relayPath('/models'), { headers, signal: ctrl.signal });
    clearTimeout(timeoutId1);
    if (!r1.ok) {
      const listDetail = await readErrorDetail(r1);
      throw new Error('API不可达 (HTTP ' + r1.status + (listDetail ? ') · ' + listDetail : ')'));
    }
    const data = await r1.json();
    const modelIds = (data.data || data.models || []).map(m => (m && (m.id || m.name)) || m).filter(Boolean);
    if (modelIds.length && !modelIds.includes(model)) {
      statusEl.textContent = `⚠ 端点可连，但模型 "${model}" 不在列表中，可用: ${modelIds.slice(0,3).join(', ')}${modelIds.length > 3 ? '…' : ''}`;
      statusEl.style.color = 'var(--accent-gold)';
      return;
    }

    // 2. 真实生成一次。探测预算取 64：思考型模型（vLLM/Qwen 等）会先输出 reasoning，
    //    预算太小会导致 content 为 null，被误判成连不上。
    const startedAt = Date.now();
    const ctrl2 = new AbortController();
    const timeoutId2 = setTimeout(() => ctrl2.abort(), 60000);
    const r2 = await apiFetch(relayPath('/chat/completions'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: '只回复两个字母：OK' }],
        temperature: 0,
        max_tokens: 64,
        stream: false
      }),
      signal: ctrl2.signal,
    });
    clearTimeout(timeoutId2);
    if (!r2.ok) {
      const chatDetail = await readErrorDetail(r2);
      throw new Error('模型生成失败 (HTTP ' + r2.status + (chatDetail ? ') · ' + chatDetail : ')'));
    }
    const genData = await r2.json();
    const text = chatText(genData);
    const secs = ((Date.now() - startedAt) / 1000).toFixed(1);
    if (text) {
      statusEl.textContent = `✅ 连接成功（${secs}s，${modelIds.length || 1} 个模型）回复: ${text.slice(0, 20)}`;
      statusEl.style.color = 'var(--green-down)';
      return;
    }
    // 200 但无正文：端点与密钥都没问题，只是该模型把探测预算用在了思考上
    const fr = chatFinishReasonOf(genData);
    statusEl.textContent = `✅ 端点可用（${secs}s）· 本次未产出正文${fr ? '（finish_reason=' + fr + '）' : ''}，游戏内按 ${fixedMaxTokens()} tokens 生成通常正常`;
    statusEl.style.color = 'var(--green-down)';
  }

  // 正文提取与固定参数读取（未加载 llm.js 时退化为本地实现）
  function chatText(data) {
    const choice = data && data.choices && data.choices[0];
    if (typeof LLM !== 'undefined' && LLM.extractChatContent) return LLM.extractChatContent(choice);
    const msg = choice && (choice.message || choice.delta);
    let c = msg ? msg.content : '';
    if (Array.isArray(c)) c = c.map(p => (p && (p.text || p.content)) || '').join('');
    return String(c || '').trim();
  }

  function chatFinishReasonOf(data) {
    if (typeof LLM !== 'undefined' && LLM.chatFinishReason) return LLM.chatFinishReason(data);
    const choice = data && data.choices && data.choices[0];
    return (choice && choice.finish_reason) || '';
  }

  function fixedMaxTokens() {
    return (typeof CONFIG !== 'undefined' && CONFIG.LLM_MAX_TOKENS) ? CONFIG.LLM_MAX_TOKENS : get('maxTokens');
  }

  function fixedTemperature() {
    return (typeof CONFIG !== 'undefined' && CONFIG.LLM_TEMPERATURE != null) ? CONFIG.LLM_TEMPERATURE : get('temperature');
  }

  async function testConnectionOllama(model, llmBase, statusEl) {
    var apiUrl;
    if (typeof LLM !== 'undefined' && LLM.ollamaUrl) {
      apiUrl = LLM.ollamaUrl('/api/tags');
    } else {
      var base = llmBase || 'http://localhost:11434';
      apiUrl = base.replace(/\/+$/, '') + '/api/tags';
    }
    const ctrl = new AbortController();
    const timeoutId1 = setTimeout(() => ctrl.abort(), 15000);
    const r1 = await apiFetch(apiUrl, { signal: ctrl.signal });
    clearTimeout(timeoutId1);
    if (!r1.ok) throw new Error('API不可达 (HTTP ' + r1.status + ')');
    const data = await r1.json();
    const models = (data.models || []).map(m => m.name);
    if (!models.includes(model)) {
      statusEl.textContent = `⚠ 模型 "${model}" 未找到，可用: ${models.slice(0,3).join(', ')}...`;
      statusEl.style.color = 'var(--accent-gold)';
      return;
    }
    var generateUrl;
    if (typeof LLM !== 'undefined' && LLM.ollamaUrl) {
      generateUrl = LLM.ollamaUrl('/api/generate');
    } else {
      generateUrl = (llmBase || 'http://localhost:11434').replace(/\/+$/, '') + '/api/generate';
    }
    const ctrl2 = new AbortController();
    const timeoutId2 = setTimeout(() => ctrl2.abort(), 20000);
    const r2 = await apiFetch(generateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt: '回复"OK"', stream: false, options: { num_predict: 5 } }),
      signal: ctrl2.signal,
    });
    clearTimeout(timeoutId2);
    if (!r2.ok) throw new Error('模型生成失败');
    statusEl.textContent = '✅ 连接成功！模型正常工作';
    statusEl.style.color = 'var(--green-down)';
  }

  async function testConnectionLMStudio(model, llmBase, statusEl) {
    var base = llmBase || 'http://localhost:1234';
    var baseLc = base.toLowerCase().replace(/\/+$/, '');
    // localhost → 走 /api/lmstudio 代理规避 CORS
    var useProxy = !baseLc || baseLc === 'http://localhost:1234' || baseLc === 'http://127.0.0.1:1234';
    var modelsUrl, chatUrl;
    if (useProxy) {
      modelsUrl = '/api/lmstudio/v1/models';
      chatUrl = '/api/lmstudio/v1/chat/completions';
    } else {
      var cleanBase = base.replace(/\/+$/, '');
      modelsUrl = cleanBase + '/v1/models';
      chatUrl = cleanBase + '/v1/chat/completions';
    }
    // 1. 测试 API 连通 + 模型列表
    const ctrl = new AbortController();
    const timeoutId1 = setTimeout(() => ctrl.abort(), 15000);
    const r1 = await apiFetch(modelsUrl, { signal: ctrl.signal });
    clearTimeout(timeoutId1);
    if (!r1.ok) throw new Error('API不可达 (HTTP ' + r1.status + ')');
    const data = await r1.json();
    const modelIds = (data.data || []).map(m => m.id);
    if (!modelIds.includes(model)) {
      statusEl.textContent = `⚠ 模型 "${model}" 未找到，可用: ${modelIds.slice(0,3).join(', ')}...`;
      statusEl.style.color = 'var(--accent-gold)';
      return;
    }
    // 2. 测试模型生成
    const ctrl2 = new AbortController();
    const timeoutId2 = setTimeout(() => ctrl2.abort(), 20000);
    const r2 = await apiFetch(chatUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: '回复"OK"' }],
        temperature: 0,
        max_tokens: 5,
        stream: false
      }),
      signal: ctrl2.signal,
    });
    clearTimeout(timeoutId2);
    if (!r2.ok) throw new Error('模型生成失败');
    statusEl.textContent = '✅ 连接成功！模型正常工作';
    statusEl.style.color = 'var(--green-down)';
  }

  // ========== 托管设置辅助函数 ==========
  function getAutoMasterEnabled() {
    try {
      if (typeof SGame !== 'undefined' && SGame.G && SGame.G.autoMode) {
        return !!SGame.G.autoMode.enabled;
      }
    } catch(e) { SGame.DEBUG && console.warn('[Settings] getAutoMasterEnabled failed:', e.message || e); }
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
    } catch(e) { SGame.DEBUG && console.warn('[Settings] getAuto failed for key "' + key + '":', e.message || e); }
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
    } catch(e) { SGame.DEBUG && console.warn('[Settings] onAutoSettingChange failed:', e.message || e); }
  }

  function onAutoToggleChange(key, checked) {
    try {
      if (typeof SGame !== 'undefined' && SGame.G && SGame.G.autoMode) {
        SGame.G.autoMode[key] = checked;
        if (typeof SGame.save === 'function') SGame.save();
      }
    } catch(e) { SGame.DEBUG && console.warn('[Settings] onAutoToggleChange failed:', e.message || e); }
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

    const provider = document.getElementById('set-llmProvider')?.value || 'ollama';
    let rawBase = document.getElementById('set-llmBase').value.trim();
    // localhost:11434 直连会被浏览器 CORS 拦截，保存时自动清空以走代理
    if (provider !== 'openai' && (rawBase === 'http://localhost:11434' || rawBase === 'http://localhost:11434/')) rawBase = '';
    if (provider === 'openai' && !rawBase) {
      const errEl = document.getElementById('set-status');
      if (errEl) {
        errEl.textContent = '❌ 请先填写 OpenAI 兼容 API 地址（或改用 Ollama / LM Studio）';
        errEl.style.color = 'var(--red-up)';
      }
      return;
    }

    const newSettings = {
      llmProvider: provider,
      llmBase: rawBase,
      llmApiKey: (document.getElementById('set-llmApiKey')?.value || '').trim(),
      llmModel: document.getElementById('set-llmModel').value.trim(),
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
        try { Storage.set('shfc_audio_enabled', String(wantEnabled)); } catch(e) {}
      }
    }

    // 刷新 UI 以反映自动模式状态变化
    if (typeof UI !== 'undefined') { UI.markDirty('dashboard'); UI.renderAll(); }

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
    writeKeyStore('');
    Storage.set(STORAGE_KEY, JSON.stringify(stripKey(current)));
    if (typeof CONFIG !== 'undefined') {
      CONFIG.LLM_PROVIDER = current.llmProvider;
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
    } catch(e2) {
      // 记录托管默认值恢复失败，但不中断后续界面刷新
      SGame.DEBUG && console.error('[设置] 恢复托管默认设置失败:', e2);
    }
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
    onProviderChange,
    onPresetChange,
    toggleKeyVisibility,
    getAuto,
    bindAutoToggles,
  };
})();
