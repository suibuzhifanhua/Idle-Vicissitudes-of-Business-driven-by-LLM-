// Author: Fisheep.L
// ==================================================
// llm.js — LLM集成：Ollama调用、请求队列、降级、叙事引擎
// ==================================================

window.LLM = (() => {
  let available = false;
  let checking = false;
  let failureCount = 0;
  let cooldownUntil = 0;

  // ========== 统一任务队列（第二阶段） ==========
  // 队列条目：{ id, taskFn, resolve, reject, priority, taskType, enqueueTime }
  const _taskQueue = [];
  let _activeCount = 0;
  let _processing = false;
  let _nextTaskId = 1;

  // 优先级：数字越小越优先（0=关键路径，1=普通，2=低优先级）
  const PRIORITY = { HIGH: 0, NORMAL: 1, LOW: 2 };

  // 当前正在处理的任务类型（用于UI显示）
  let _currentTaskType = '';
  let _queueStats = { enqueued: 0, completed: 0, failed: 0 };

  function getQueueLength() { return _taskQueue.length; }
  function getActiveCount() { return _activeCount; }
  function getCurrentTaskType() { return _currentTaskType; }
  function getQueueStats() { return Object.assign({}, _queueStats); }

  // 通知UI更新队列状态（防抖：每500ms最多一次）
  let _uiUpdateTimer = null;
  function _notifyUIQueueChange() {
    if (_uiUpdateTimer) return;
    _uiUpdateTimer = setTimeout(function() {
      _uiUpdateTimer = null;
      if (typeof UI !== 'undefined' && UI.updateLLMQueueStatus) {
        UI.updateLLMQueueStatus({
          queueLength: _taskQueue.length,
          activeCount: _activeCount,
          currentTaskType: _currentTaskType,
          available: available,
          generating: _activeCount > 0
        });
      }
    }, 500);
  }

  // ========== 统一队列核心：enqueue() ==========
  // priority: 0=HIGH(插队), 1=NORMAL, 2=LOW
  // taskType: 用于UI显示的任务类型描述
  // taskFn: 返回 Promise 的函数（由调用方提供实际LLM调用）
  // timeoutMs: 单任务超时（ms），默认15000
  function enqueue(taskFn, options) {
    options = options || {};
    var priority = options.priority != null ? options.priority : PRIORITY.NORMAL;
    var taskType = options.taskType || 'LLM请求';
    var timeoutMs = options.timeout || getGenerateTimeout();
    var taskId = _nextTaskId++;

    return new Promise(function(resolve, reject) {
      _queueStats.enqueued++;
      // 按优先级插入队列（优先级相同则FIFO）
      var entry = {
        id: taskId,
        taskFn: taskFn,
        resolve: resolve,
        reject: reject,
        priority: priority,
        taskType: taskType,
        timeoutMs: timeoutMs,
        enqueueTime: Date.now()
      };

      if (priority === PRIORITY.HIGH) {
        // 插队：放到所有 NORMAL/LOW 前面，但排在同样 HIGH 的后面（FIFO）
        var insertIdx = 0;
        while (insertIdx < _taskQueue.length && _taskQueue[insertIdx].priority === PRIORITY.HIGH) insertIdx++;
        _taskQueue.splice(insertIdx, 0, entry);
      } else {
        _taskQueue.push(entry);
      }

      _notifyUIQueueChange();
      _drainQueue();
    });
  }

  // 从队列取任务执行（FIFO + 优先级）
  async function _drainQueue() {
    if (_processing) return; // 已有循环在运行
    _processing = true;
    var drainStallCount = 0;
    try {
      while (_taskQueue.length > 0) {
        // 冷却期检查：若处于冷却中，等待5秒后重试
        if (isInCooldown()) {
          drainStallCount++;
          if (drainStallCount > 5) {
            SGame.DEBUG && console.warn('[LLM] _drainQueue stalled in cooldown, aborting');
            break;
          }
          _currentTaskType = '冷却中';
          _notifyUIQueueChange();
          await new Promise(function(r) { setTimeout(r, 5000); });
          await exitCooldown();
          continue;
        }

        drainStallCount = 0;

        // 并发限制
        if (_activeCount >= getMaxConcurrent()) {
          SGame.DEBUG && console.log('[LLM] _drainQueue 并发限制等待 — 活跃:', _activeCount, '最大:', getMaxConcurrent(), '排队任务:', _taskQueue.length);
          _notifyUIQueueChange();
          await new Promise(function(r) { setTimeout(r, 500); });
          continue;
        }

        var entry = _taskQueue.shift();
        _activeCount++;
        _currentTaskType = entry.taskType;
        _notifyUIQueueChange();

        SGame.DEBUG && console.log('[LLM] _drainQueue 取任务执行 — 类型:', entry.taskType, '优先级:', entry.priority, '超时:', (entry.timeoutMs/1000) + 's', '活跃任务数:', _activeCount, '剩余队列:', _taskQueue.length, '排队时长:', ((Date.now() - entry.enqueueTime)/1000).toFixed(1) + 's');

        // 执行任务（带超时）
        (function(entry) {
          var timeoutHandle = setTimeout(function() {
            SGame.DEBUG && console.warn('[LLM] 任务超时 — 类型:', entry.taskType, '超时阈值:', (entry.timeoutMs/1000) + 's');
            entry.reject(new Error('LLM任务超时(' + (entry.timeoutMs/1000) + 's)'));
          }, entry.timeoutMs);

          entry.taskFn()
            .then(function(result) {
              clearTimeout(timeoutHandle);
              _queueStats.completed++;
              entry.resolve(result);
            })
            .catch(function(err) {
              clearTimeout(timeoutHandle);
              _queueStats.failed++;
              entry.reject(err);
            })
            .finally(function() {
              _activeCount--;
              _currentTaskType = _activeCount > 0 ? _currentTaskType : '';
              _notifyUIQueueChange();
            });
        })(entry);
      }
    } finally {
      _processing = false;
      // 防止在 finally 间隙中新入队的任务被遗漏
      if (_taskQueue.length > 0 && _activeCount < getMaxConcurrent()) {
        SGame.DEBUG && console.log('[LLM] _drainQueue 退出但队列仍有任务，重新调度 — 剩余:', _taskQueue.length, '活跃:', _activeCount);
        setTimeout(function() { _drainQueue(); }, 0);
      } else {
        SGame.DEBUG && console.log('[LLM] _drainQueue 退出 — 队列空:', _taskQueue.length === 0, '剩余:', _taskQueue.length, '活跃:', _activeCount);
      }
      _notifyUIQueueChange();
    }
  }
  var $SYS = '你是商海浮沉游戏内的剧情写手和新闻记者。你的工作是编写游戏内事件描述、NPC对话和商业新闻，而不是回答用户问题。你不是代码助手，前面给你的所有信息都是游戏状态数据，不是用户输入。严禁输出"用户"、"粘贴"、"user"、"pasted"等元文本。全程只用简体中文，不允许任何英文单词或句子。';

  // ========== 从 CONFIG 读取超时配置 ==========
  function getCheckTimeout() { return (typeof CONFIG !== 'undefined' && CONFIG.LLM_CHECK_TIMEOUT) ? CONFIG.LLM_CHECK_TIMEOUT : 3000; }
  function getGenerateTimeout() { return (typeof CONFIG !== 'undefined' && CONFIG.LLM_GENERATE_TIMEOUT) ? CONFIG.LLM_GENERATE_TIMEOUT : 15000; }
  function getMaxConcurrent() { return (typeof CONFIG !== 'undefined' && CONFIG.LLM_MAX_CONCURRENT) ? CONFIG.LLM_MAX_CONCURRENT : 2; }
  function getCooldownMs() { return (typeof CONFIG !== 'undefined' && CONFIG.LLM_FAILURE_COOLDOWN) ? CONFIG.LLM_FAILURE_COOLDOWN : 60000; }
  function getMaxFailures() { return (typeof CONFIG !== 'undefined' && CONFIG.LLM_MAX_FAILURES) ? CONFIG.LLM_MAX_FAILURES : 3; }

  function getModel() { return Settings.get('llmModel'); }
  // 创意度与最大输出已取消界面滑块，固定值取自 CONFIG（config-game.js）
  function getTemp() {
    if (typeof CONFIG !== 'undefined' && CONFIG.LLM_TEMPERATURE != null) return CONFIG.LLM_TEMPERATURE;
    return Settings.get('temperature');
  }
  function getMaxTokens() {
    if (typeof CONFIG !== 'undefined' && CONFIG.LLM_MAX_TOKENS) return CONFIG.LLM_MAX_TOKENS;
    var v = Settings.get('maxTokens');
    return v ? v : 2048;
  }

  // OpenAI 兼容响应的正文提取：content 可能是字符串、也可能是分段数组；
  // 带思考的模型（vLLM/DeepSeek-Qwen 等）预算不足时 content 会是 null，正文只在 reasoning 里
  function extractChatContent(choice) {
    var msg = choice ? (choice.message || choice.delta) : null;
    if (!msg) return '';
    var c = msg.content;
    if (Array.isArray(c)) {
      c = c.map(function(part) { return (part && (part.text || part.content)) || ''; }).join('');
    }
    return String(c || '').trim();
  }

  function chatFinishReason(data) {
    var choice = data && data.choices && data.choices[0];
    return (choice && choice.finish_reason) || '';
  }

  // 检测文本是否包含中文字符
  function hasChinese(text) {
    if (!text) return false;
    return /[\u4e00-\u9fff\u3400-\u4dbf]/.test(text);
  }

  // 从 thinking 内容中提取最终输出（qwen3.5 thinking 模式回退）
  // 优先提取包含中文的句子，避免英文推理过程泄露到 UI
  // 检测文本中英文占比是否过高（基于字符数而非片段数，避免短中文词被长英文词放大比例）
  // 阈值：英文字母字符数超过总字符数的35%判定为 thinking 泄漏
  function isExcessivelyMixedChinese(text) {
    if (!text || !hasChinese(text)) return false;
    var chineseChars = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
    var englishChars = (text.match(/[a-zA-Z]/g) || []).length;
    var totalChars = chineseChars + englishChars;
    if (totalChars === 0) return false;
    // 仅当英文字母占比 > 35% 且中文字符 < 50 时才判定泄漏
    // 避免正常的中英混合回复（如 "升级 TechnologyStudio 到 Lv.3"）被误杀
    if (englishChars / totalChars > 0.35 && chineseChars < 50) return true;
    return false;
  }

  // 从混合中英文文本中提取中文主体（剔除明显的英文 thinking 段落）
  function extractChineseContent(text) {
    if (!text) return '';
    // 移除纯英文行（开头无中文的行通常为 thinking）
    var lines = text.split('\n');
    var chineseLines = lines.filter(function(line) {
      var trimmed = line.trim();
      if (!trimmed) return true; // 保留空行
      return hasChinese(trimmed);
    });
    return chineseLines.join('\n').trim();
  }

  function extractFromThinking(thinking) {
    // qwen3.5 thinking 内容主要是模型内部推理过程（规则检查、翻译对照等），
    // 不适合作为 UI 输出。直接返回空，让调用方使用 fallback 预设描述。
    return '';
  }

  // ========== 提供商检测 ==========
  function getProvider() {
    if (typeof Settings !== 'undefined' && Settings.get) {
      return Settings.get('llmProvider') || 'ollama';
    }
    if (typeof CONFIG !== 'undefined' && CONFIG.LLM_PROVIDER) {
      return CONFIG.LLM_PROVIDER;
    }
    return 'ollama';
  }

  // ========== 基础 URL 获取 ==========
  function getBase() {
    var saved = typeof Settings !== 'undefined' && Settings.get ? Settings.get('llmBase') || '' : '';
    if (!saved && typeof CONFIG !== 'undefined' && CONFIG.LLM_BASE) saved = CONFIG.LLM_BASE;
    if (!saved) {
      if (getProvider() === 'openai') return '';
      if (getProvider() === 'lmstudio') return 'http://localhost:1234';
      return 'http://localhost:11434';
    }
    return saved;
  }

  // ========== OpenAI 兼容协议辅助 ==========
  // lmstudio 与 openai 都走 /v1/chat/completions，差别只在自定义端点需要 API Key
  function isOpenAICompat() {
    var p = getProvider();
    return p === 'lmstudio' || p === 'openai';
  }

  function getApiKey() {
    var key = typeof Settings !== 'undefined' && Settings.get ? Settings.get('llmApiKey') || '' : '';
    if (!key && typeof CONFIG !== 'undefined' && CONFIG.LLM_API_KEY) key = CONFIG.LLM_API_KEY;
    return String(key).trim();
  }

  // 用户可填 https://api.xxx.com 或 .../v1；末尾无版本段时补 /v1
  function normalizeOpenAIBase(raw) {
    var b = String(raw || '').trim().replace(/\/+$/, '');
    if (!b) return '';
    // 常见误填：直接把完整的 chat/completions 地址粘进来，会被拼成 .../chat/completions/chat/completions
    b = b.replace(/\/(chat\/completions|completions|models)$/i, '');
    if (!/^https?:\/\//i.test(b)) {
      // 省略协议时：本机端口按 http 走，公网端点按 https 走
      b = (/^(localhost|127\.0\.0\.1)(:|\/|$)/i.test(b) ? 'http://' : 'https://') + b;
    }
    try {
      var u = new URL(b);
      var p = u.pathname.replace(/\/+$/, '');
      if (p === '' || p === '/') p += '/v1';
      return u.origin + p;
    } catch(e) {
      return b;
    }
  }

  // 远端 API 不返回 CORS 头，浏览器无法直连 → 统一经本机 server.py 的 /api/relay 转发
  function relayUrl(target) {
    return '/api/relay?target=' + encodeURIComponent(target);
  }

  function authHeaders(extra) {
    var headers = extra || {};
    if (getProvider() === 'openai') {
      var key = getApiKey();
      if (key) headers['Authorization'] = 'Bearer ' + key;
    }
    return headers;
  }

  function _relayEndpointBase(target) {
    try {
      const url = new URL(target, window.location.origin);
      const endpoints = ['/chat/completions', '/completions', '/models', '/embeddings', '/api/generate', '/api/tags'];
      let path = (url.pathname || '/').replace(/\/+$/, '');
      const matched = endpoints.find((endpoint) => path.endsWith(endpoint));
      if (matched) path = path.slice(0, -matched.length) || '/';
      return url.protocol + '//' + url.host + (path === '/' ? '' : path);
    } catch (_) {
      return target;
    }
  }

  async function fetchApi(url, opts) {
    const relayPrefix = '/api/relay?target=';
    if (url.indexOf(relayPrefix) === 0) {
      const target = decodeURIComponent(url.slice(relayPrefix.length));
      if (typeof Network !== 'undefined' && Network.registerRelayBase) {
        await Network.registerRelayBase(_relayEndpointBase(target));
      }
    }
    var fetcher = (typeof Network !== 'undefined' && Network.fetchApi) ? Network.fetchApi : fetch;
    var r = await fetcher(url, opts);
    if (r.status === 401 && url.indexOf('/api/') === 0) {
      throw new Error('local_session_unavailable');
    }
    if (r.status === 403 && url.indexOf('/api/relay?') === 0) {
      throw new Error('relay_base_not_registered');
    }
    return r;
  }

  // 构建 API 请求 URL（通过 /api/ollama 代理转发 Ollama，LM Studio 直连 localhost:1234 或走代理）
  function ollamaUrl(path) {
    var base = getBase();
    if (getProvider() === 'openai') {
      var openaiBase = normalizeOpenAIBase(base);
      if (!openaiBase) return '';
      return relayUrl(openaiBase + path);
    }
    if (getProvider() === 'lmstudio') {
      var lmsBase = base.replace(/\/+$/, '').toLowerCase();
      // LM Studio: path 不含 /v1 前缀，需在此拼接。localhost → 走 /api/lmstudio 代理规避 CORS
      if (!lmsBase || lmsBase === 'http://localhost:1234' || lmsBase === 'http://127.0.0.1:1234') {
        return '/api/lmstudio/v1' + path;
      }
      return base.replace(/\/+$/, '') + '/v1' + path;
    }
    // Ollama: 直接访问 → 走代理
    if (!base) return '/api/ollama' + path;
    var normalized = base.replace(/\/+$/, '').toLowerCase();
    if (normalized === 'http://localhost:11434' || normalized === 'http://127.0.0.1:11434') {
      return '/api/ollama' + path;
    }
    return base.replace(/\/+$/, '') + path;
  }

  // ========== 冷却检查 ==========
  function isInCooldown() { return cooldownUntil > 0 && Date.now() < cooldownUntil; }

  function enterCooldown() {
    cooldownUntil = Date.now() + getCooldownMs();
    available = false;
    setDot('');
    setStatus('LLM冷却中...(' + Math.round(getCooldownMs()/1000) + 's)');
    SGame.DEBUG && console.warn('[LLM] 连续失败' + failureCount + '次，进入' + (getCooldownMs()/1000) + '秒冷却期');
  }

  // 修复 3：改为 async，await check() 结果，仅在成功时重置状态
  async function exitCooldown() {
    if (cooldownUntil > 0 && Date.now() >= cooldownUntil) {
      SGame.DEBUG && console.log('[LLM] 冷却期结束，正在重检');
      setStatus('LLM检测中...');
      await check();
      if (available) {
        cooldownUntil = 0; failureCount = 0;
        SGame.DEBUG && console.log('[LLM] 冷却期结束后重检成功');
      } else {
        SGame.DEBUG && console.warn('[LLM] 冷却期结束后重检失败，保留状态等待定时器重试');
      }
    }
  }

  // ========== 请求队列处理（已废弃，由统一队列替代） ==========
  // processQueue() 已废弃，所有任务通过 enqueue() 进入统一队列

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
      var useOpenAICompat = isOpenAICompat();

      if (useOpenAICompat) {
        // LM Studio / 自定义 OpenAI 兼容端点：POST /v1/chat/completions
        var messages = [];
        if (system) messages.push({ role: 'system', content: system });
        messages.push({ role: 'user', content: prompt });
        var bodyObj = {
          model: modelName,
          messages: messages,
          temperature: temperature,
          max_tokens: getMaxTokens(),
          stream: false
        };
        var compatUrl = ollamaUrl('/chat/completions');
        if (!compatUrl) throw new Error('未配置 LLM API 地址');
        const r = await fetchApi(compatUrl, {
          method: 'POST',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(bodyObj),
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        if (!r.ok) throw new Error('llm fail ' + r.status);
        const data = await r.json();
        var responseText = extractChatContent(data.choices && data.choices[0]);
        if (!responseText) {
          var fr = chatFinishReason(data);
          throw new Error('端点未返回正文' + (fr ? '（finish_reason=' + fr + '）' : '') +
            (fr === 'length' ? '，思考型模型需要更大的 max_tokens' : ''));
        }

        if (responseText && hasChinese(responseText)) {
          if (!available) { available = true; setDot('active'); setStatus('LLM在线(' + getModel() + ')'); }
          failureCount = Math.max(0, failureCount - 1);
          return responseText;
        }
        if (responseText && !hasChinese(responseText)) {
          SGame.DEBUG && console.warn('[LLM] response 为纯英文/无中文');
        }
        throw new Error('no chinese content in response');
      }

      // Ollama: POST /api/generate
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
      if (system && !modelName.toLowerCase().includes('qwen')) bodyObj.system = system;
      const r = await fetchApi(ollamaUrl('/api/generate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyObj),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!r.ok) throw new Error('llm fail ' + r.status);
      const data = await r.json();
      // Qwen3.5 可能返回 thinking 模式：response 为空或有英文推理泄露
      var responseText = (data.response || '').trim();
      // 防御：检测 response 是否包含中文 + 英文占比不过高，防止英文推理泄露到游戏 UI
      if (responseText && hasChinese(responseText) && isExcessivelyMixedChinese(responseText)) {
        // 尝试提取中文主体作为降级输出（剔除英文 thinking 行）
        var extracted = extractChineseContent(responseText);
        if (extracted && hasChinese(extracted) && !isExcessivelyMixedChinese(extracted)) {
          SGame.DEBUG && console.warn('[LLM] 原始 response 英文占比过高，已提取中文主体（' + extracted.length + ' 字符）');
          if (!available) { available = true; setDot('active'); setStatus('LLM在线(' + getModel() + ')'); }
          failureCount = Math.max(0, failureCount - 1);
          return extracted;
        }
        SGame.DEBUG && console.warn('[LLM] response 英文占比过高且无法提取有效中文，将走 fallback');
      }
      var responseOk = responseText && hasChinese(responseText) && !isExcessivelyMixedChinese(responseText);
      if (responseOk) {
        // 成功后同步修复 available 标志（check 不能是唯一的 true 来源）
        if (!available) { available = true; setDot('active'); setStatus('LLM在线(' + getModel() + ')'); }
        failureCount = Math.max(0, failureCount - 1);
        return responseText;
      }
      if (responseText && !hasChinese(responseText)) {
        SGame.DEBUG && console.warn('[LLM] response 为纯英文/无中文，疑似推理泄露，不提取 thinking');
      }
      if (responseText) SGame.DEBUG && console.warn('[LLM] 无法获取有效中文内容，返回空（将使用预设描述）');
      throw new Error('no chinese content in response');
    } catch(e) {
      // Network error: retry once
      const isNetworkErr = e.name === 'TypeError' || String(e.message || '').includes('fetch');
      if (isNetworkErr && _retryCount < 1) {
        SGame.DEBUG && console.warn('[LLM] 网络错误，1秒后重试 (' + (_retryCount+1) + '/1):', e.message);
        await new Promise(function(resolve) { setTimeout(resolve, 1000); });
        return _doGenerate(prompt, temperature, _retryCount + 1, system);
      }
      failureCount += 1;
      SGame.DEBUG && console.warn('[LLM] 生成失败 (' + failureCount + '/' + getMaxFailures() + '):', e.message);
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
    if (checking) { SGame.DEBUG && console.log('[LLM][check] 跳过：上一轮检测仍在进行中'); return; }
    checking = true;
    setDot('loading'); setStatus('LLM检测中...');
    let url;
    try {
      if (isOpenAICompat()) {
        if (getProvider() === 'openai' && !getBase()) {
          available = false; setDot('');
          setStatus('LLM未配置（请填写 API 地址）');
          return;
        }
        url = ollamaUrl('/models');
        SGame.DEBUG && console.log('[LLM][check] OpenAI 兼容端点请求 URL:', url);
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), getCheckTimeout());
        const r = await fetchApi(url, { headers: authHeaders(), signal: ctrl.signal });
        clearTimeout(timer);
        SGame.DEBUG && console.log('[LLM][check] 响应状态:', r.status, r.statusText);
        if (r.ok) {
          const data = await r.json();
          // 兼容两种响应格式：标准 {"data":[...]} 和代理/Ollama {"models":[...]}
          const models = data.data || data.models || [];
          const modelCount = Array.isArray(models) ? models.length : 0;
          SGame.DEBUG && console.log('[LLM][check] 检测到 ' + modelCount + ' 个模型，当前配置模型：' + getModel());
          if (modelCount > 0) {
            available = true; failureCount = 0; cooldownUntil = 0;
            setDot('active'); setStatus('LLM在线(' + getModel() + ')');
          } else {
            SGame.DEBUG && console.warn('[LLM][check] 端点返回空模型列表，仍标记为可用（模型需手动加载/填写）');
            available = true; failureCount = 0; cooldownUntil = 0;
            setDot('active'); setStatus('LLM在线(' + getModel() + ')');
          }
        } else throw new Error('HTTP ' + r.status);
      } else {
        url = ollamaUrl('/api/tags');
        SGame.DEBUG && console.log('[LLM][check] 请求 URL:', url);
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), getCheckTimeout());
        const r = await fetchApi(url, { signal: ctrl.signal });
        clearTimeout(timer);
        SGame.DEBUG && console.log('[LLM][check] 响应状态:', r.status, r.statusText);
        if (r.ok) {
          const data = await r.json();
          const modelCount = (data.models && data.models.length) || 0;
          SGame.DEBUG && console.log('[LLM][check] 检测到 ' + modelCount + ' 个模型，当前配置模型：' + getModel());
          if (modelCount > 0) {
            available = true; failureCount = 0; cooldownUntil = 0;
            setDot('active'); setStatus('LLM在线(' + getModel() + ')');
          } else {
            SGame.DEBUG && console.warn('[LLM][check] Ollama 无可用模型');
            // 不将 available 设为 true：必须至少有一个模型
          }
        } else throw new Error('HTTP ' + r.status);
      }
    } catch(e) {
      available = false; setDot('');
      const msg = e.name === 'AbortError' ? '超时(' + (getCheckTimeout()/1000) + 's)' : (e.message || '');
      setStatus('LLM离线');
      SGame.DEBUG && console.warn('[LLM][check] 检测失败:', msg, '| URL:', url, e.name !== 'AbortError' ? ('| 详情: ' + (e.message || e)) : '');
    } finally {
      checking = false;
    }
  }

  function setDot(cls) { const el = document.getElementById('llm-dot'); if (el) el.className = 'llm-dot ' + cls; }
  function setStatus(text) { const el = document.getElementById('llm-status'); if (el) el.textContent = text; }
  function setLoading() { setDot('loading'); setStatus('LLM生成中...'); }

  // ========== 带队列的 generate（公开入口） ==========
  async function generate(prompt, temperature, system, options) {
    // 先同步检查冷却是否已过期，仅在需要重检时才走异步
    if (cooldownUntil > 0 && Date.now() >= cooldownUntil) {
      await exitCooldown();
    } else if (cooldownUntil === 0) {
      // 冷却已解除，无需异步重检
    } else {
      // 仍在冷却中
    }
    if (isInCooldown()) return Promise.resolve(null);

    options = options || {};
    var priority = options.priority != null ? options.priority : PRIORITY.NORMAL;
    var timeoutMs = options.timeout || getGenerateTimeout();
    var taskType = options.taskType || 'LLM生成';

    // 可用性检查：LLM 不在线时，若无检测进行中则盲发探测
    if (!available) {
      if (!checking) { check(); }
      return new Promise((resolve) => {
        var pollStart = Date.now();
        var pollTimer = setInterval(() => {
          if (!checking || Date.now() - pollStart > 10000) {
            clearInterval(pollTimer);
            if (available) {
              // 递归调用自己，此时 available 应为 true
              generate(prompt, temperature, system, options).then(resolve).catch(function() {
                clearInterval(pollTimer);
                resolve(null);
              });
            } else {
              resolve(null);
            }
          }
        }, 300);
      });
    }

    // 通过统一队列执行
    return enqueue(function() {
      return _doGenerate(prompt, temperature, 0, system);
    }, {
      priority: priority,
      taskType: taskType,
      timeout: timeoutMs
    });
  }

  // 清空任务队列：切换提供商时所有旧任务必须取消
  function _flushQueue(reason) {
    const cancelled = _taskQueue.length;
    _taskQueue.forEach(entry => {
      try { entry.reject(new Error('LLM queue flushed: ' + reason)); } catch(e) { if (typeof SGame !== "undefined" && SGame.DEBUG) SGame.DEBUG && console.error("[llm] queue flush error:", e && e.message); }
    });
    _taskQueue.length = 0;
    _notifyUIQueueChange();
    if (cancelled > 0) SGame.DEBUG && console.warn('[LLM] 已清除', cancelled, '个排队任务（原因：' + reason + '）');
  }

  // cancelAll：取消队列中所有等待任务（不影响正在执行的），以 null 值 resolve
  // 被取消的任务调用方走 || fallback 模式自然降级
  function cancelAll(reason) {
    reason = reason || '优先级任务抢占';
    var cancelled = _taskQueue.length;
    if (cancelled === 0) {
      SGame.DEBUG && console.log('[LLM] cancelAll: 队列为空，无需取消（活跃任务:', _activeCount, '）');
      return 0;
    }
    SGame.DEBUG && console.warn('[LLM] cancelAll: 将取消', cancelled, '个排队任务（活跃任务:', _activeCount, '不受影响），原因：', reason);
    _taskQueue.forEach(function(entry) {
      try { entry.resolve(null); } catch(e) { if (typeof SGame !== "undefined" && SGame.DEBUG) SGame.DEBUG && console.error("[llm] cancelAll resolve error:", e && e.message); }
    });
    _taskQueue.length = 0;
    _notifyUIQueueChange();
    SGame.DEBUG && console.log('[LLM] cancelAll 完成 — 活跃任务:', _activeCount, '队列剩余:', _taskQueue.length);
    return cancelled;
  }

  async function forceRecheck() {
    checking = false; available = false; failureCount = 0; cooldownUntil = 0;
    setDot(''); setStatus('重新检测中...');
    _flushQueue('provider switched');
    await check(); _drainQueue();
  }

  // ===================================================================
  // 上下文构建器（统一注入游戏状态）
  // ===================================================================

  // 统一的游戏状态访问器（替换所有分散的 typeof SGame !== 'undefined' 守卫）
  function getG() {
    try {
      if (typeof SGame !== 'undefined' && SGame.G) return SGame.G;
    } catch(e) {
      SGame.DEBUG && console.warn('[LLM] SGame.G not accessible:', e.message || e);
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
            SGame.DEBUG && console.warn('[LLM] 质量门控未通过 (得分:' + total + '/' + threshold + ')，重写一次');
            var retryPrompt = prompt + '\n[注意：前次生成质量得分不足（' + total + '/' + threshold + '），请提升戏剧性和信息量后重新生成]';
            var retryResult = await generate(retryPrompt, temperature || 0.7);
            if (retryResult) return retryResult;
          }
        } catch(e) { SGame.DEBUG && console.warn('[LLM] 质量自评解析失败:', e.message); }
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

    var result = await generate(prompt, 0.7, $SYS, { taskType: '事件叙事', priority: PRIORITY.HIGH });
    // 客户端轻量检查：英文占比过高则视为失败
    if (result && isExcessivelyMixedChinese(result)) {
      SGame.DEBUG && console.warn('[LLM] 叙事英文占比过高，走fallback');
      result = null;
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
    var result = await generate(prompt, 0.8, $SYS, { taskType: '员工背景' });
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

    var result = await generate(prompt, 0.6, $SYS, { taskType: '决策叙事', priority: PRIORITY.HIGH });
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

    var result = await generate(prompt, 0.5, $SYS, { taskType: 'NPC对话' });
    return result || npc.name + '：「最近生意怎么样？」';
  }

  // ---------- 商业新闻生成 (#5) ----------
  async function generateBusinessNews() {
    // 由 LLM 内部判断，调用方无需重复检查
    if (!available) return null;
    var context = buildGameContext();
    if (!context) return null;

    var prompt = '你是一个商业新闻编辑。请根据以下游戏状态生成一条40-60字的财经快讯：\n' + context + '\n格式要求：标题+正文，用「」包裹标题。新闻风格参考彭博社/财新。不使用markdown。';
    var result = await generate(prompt, 0.7, $SYS, { taskType: '商业新闻' });
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

    var result = await generate(prompt, 0.5, $SYS, { taskType: '竞争对手情报' });
    return result || null;
  }

  // ---------- 市场情绪分析 (#9) ----------
  async function analyzeMarketSentiment() {
    if (!available) return null; // 离线时不更新，保留现有值
    var context = buildGameContext();
    if (!context) return 50;

    var prompt = '你是一个金融市场分析师。请分析以下游戏状态并输出一个0到100的市场情绪指数：\n' + context + '\n标准：0=极度悲观，25=偏空，50=中性，75=偏乐观，100=极度乐观。\n\n请只输出一个数字（0-100的整数），不要输出任何其他内容。';

    var result = await generate(prompt, 0.3, undefined, { taskType: '市场情绪分析' });
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

    var result = await generate(prompt, 0.65, $SYS, { taskType: '里程碑叙事', priority: PRIORITY.HIGH });
    // 客户端轻量检查
    if (result && isExcessivelyMixedChinese(result)) {
      SGame.DEBUG && console.warn('[LLM] 里程碑叙事英文占比过高，走fallback');
      result = null;
    }
    return result || null;
  }

  // ---------- 动态难度调节：分析玩家状态 ----------
  async function analyzePlayerState(summary) {
    if (!available) return null;
    var prompt = '你是一个游戏平衡性分析师。请评估玩家状态是否需要调整难度，严格返回JSON：\n' + summary + '\n\nJSON格式：{"easeEventFreq":0.8-1.2,"boostIncome":0.8-1.2,"reason":"简短理由"}。若无需调整则所有值=1.0。';
    var result = await generate(prompt, 0.3, undefined, { taskType: '动态难度评估' });
    if (!result) return null;
    try {
      var jsonStr = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      var data = JSON.parse(jsonStr);
      data.easeEventFreq = Math.max(0.8, Math.min(1.2, parseFloat(data.easeEventFreq) || 1.0));
      data.boostIncome = Math.max(0.8, Math.min(1.2, parseFloat(data.boostIncome) || 1.0));
      data.reason = data.reason || '无';
      return data;
    } catch(e) {
      SGame.DEBUG && console.warn('[LLM] analyzePlayerState JSON解析失败:', e.message);
      return null;
    }
  }

  // ---------- 平衡性自检：数值调优建议 ----------
  async function suggestBalanceTuning(data) {
    if (!available) return null;
    var system = '你是一位游戏数值策划师。全程使用简体中文回复。';
    var prompt = '分析以下游戏数据给出平衡建议。严格返回JSON（不要包含任何其他文字，不要markdown代码块，所有文字内容必须用中文）：\n' + JSON.stringify(data, null, 2) + '\n\n格式：{"suggestions":[{"priority":"p0或p1或p2","target":"调整项名称","current":"当前值","suggested":"建议值","reason":"修改理由"}],"summary":"一句话总体评价"}';
    var result = await generate(prompt, 0.4, system, { taskType: '平衡性自检' });
    if (!result) return null;
    // 清理响应：去除可能的 markdown 标记和前后空白
    var cleaned = result.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch(e) {
      SGame.DEBUG && console.warn('[LLM] suggestBalanceTuning JSON解析失败:', e.message);
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

    var result = await generate(prompt, 0.7, $SYS, { taskType: '动态事件' });
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
      SGame.DEBUG && console.warn('[LLM] 动态事件JSON解析失败:', e.message, result.substring(0, 100));
      return null;
    }
  }

  function _extractJsonObject(text) {
    const source = String(text || '');
    const start = source.indexOf('{');
    const end = source.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try {
      const parsed = JSON.parse(source.slice(start, end + 1));
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  async function generateJson(prompt, system, options) {
    const jsonPrompt = prompt + '\n\n只输出一个 JSON 对象。不要输出 Markdown、代码围栏或解释文字。';
    const raw = await generate(jsonPrompt, 0.28, (system || '') + '\n你是严格的 JSON 生成器。只能输出合法 JSON。', options || {});
    return _extractJsonObject(raw);
  }

  // ========== 公开API ==========
  return {
    get available() { return available; },
    get checking() { return checking; },
    get generating() { return _activeCount > 0; },
    get queueLength() { return _taskQueue.length; },
    get activeCount() { return _activeCount; },
    get currentTaskType() { return _currentTaskType; },
    get queueStats() { return getQueueStats(); },
    get PRIORITY() { return PRIORITY; },
    check, forceRecheck, flushQueue: _flushQueue, cancelAll, setLoading,
    generate, enqueue, generateJson,
    // OpenAI 兼容端点辅助（设置面板在未保存时按表单值试连需要）
    relayUrl, normalizeOpenAIBase, fetchApi, extractChatContent, chatFinishReason,
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
