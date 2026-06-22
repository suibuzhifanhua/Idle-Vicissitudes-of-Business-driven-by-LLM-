// Author: Fisheep.L
// ==================================================
// main.js — 入口：初始化、出身选择、启动
// ==================================================

(function() {
  function _debug(...args) { if (typeof SGame !== 'undefined' && SGame.DEBUG) console.log(...args); }
  function _debugWarn(...args) { if (typeof SGame !== 'undefined' && SGame.DEBUG) console.warn(...args); }
  function _debugError(...args) { if (typeof SGame !== 'undefined' && SGame.DEBUG) console.error(...args); }
  // ========== 渲染出身选择卡片 ==========
  function renderOriginCards() {
    const container = document.getElementById('origin-cards');
    const btn = document.getElementById('start-btn');
    if (!container) return;

    container.innerHTML = ORIGINS.map(o => `
      <div class="origin-card" data-origin="${o.id}" onclick="SGame.selectOrigin('${o.id}')">
        <div style="font-size:40px;margin-bottom:8px">${o.icon}</div>
        <div style="font-size:16px;font-weight:700;margin-bottom:4px">${o.name}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;line-height:1.5">${o.desc}</div>
        <div style="font-size:10px;color:var(--text-secondary);margin-bottom:4px">初始资金: ${SGame ? SGame.formatMoney(o.money) : o.money}</div>
        <div style="font-size:10px;color:var(--accent-gold)">特殊加成: ${o.special}</div>
      </div>
    `).join('');
  }

  // ========== 检查存档 ==========
  function checkSave() {
    _debug('[商海浮沉] checkSave() called');
    if (typeof SGame !== 'undefined' && SGame.load()) {
      _debug('[商海浮沉] save loaded, G.money:', SGame.G ? SGame.G.money : 'null');
      // 有存档，直接进入游戏
      document.getElementById('origin-screen').style.display = 'none';
      _debug('[商海浮沉] calling UI.renderAll()...');
      UI.renderAll();
      _debug('[商海浮沉] UI.renderAll() done');
      startGameLoop();
      SGame.checkRegionUnlocks();
      // 首次游戏显示教程
      if (SGame.isFirstGame && SGame.isFirstGame()) {
        setTimeout(() => UI.showTutorial(), 500);
      }
      return true;
    } else {
      // 检查是否有加载错误（存档损坏）
      if (SGame.G && SGame.G._loadError) {
        _debugError('[商海浮沉] load error:', SGame.G._loadError);
        // 清除损坏的存档，显示出生选择
        setTimeout(() => {
          if (typeof UI !== 'undefined' && UI.showToast) {
            UI.showToast('⚠️', '存档加载失败', '存档数据异常，请重新开始游戏。错误：' + SGame.G._loadError);
          }
        }, 500);
      }
      _debug('[商海浮沉] no save found in this checkSave() call');
      return false;
    }
  }

  // ========== 渲染难度选择器 ==========
  function renderDiffSelector() {
    const screen = document.getElementById('origin-screen');
    if (!screen) return;
    // 避免重复插入
    if (document.getElementById('diff-selector')) return;

    const presets = typeof DIFFICULTY_PRESETS !== 'undefined' ? DIFFICULTY_PRESETS : {};
    if (!Object.keys(presets).length) return;

    const keys = ['fast', 'standard', 'slow', 'sandbox'];
    const diffHtml = keys.filter(k => presets[k]).map(k => {
      const p = presets[k];
      const isDefault = k === 'standard';
      return '<div class="diff-card' + (isDefault ? ' active' : '') + '" data-diff="' + k + '" onclick="document.querySelectorAll(\'.diff-card\').forEach(function(c){c.classList.remove(\'active\')});this.classList.add(\'active\')">' +
        '<div style="font-size:14px;font-weight:700;margin-bottom:2px">' + p.name + '</div>' +
        '<div style="font-size:10px;color:var(--text-secondary)">' + p.desc + '</div>' +
        '</div>';
    }).join('');

    const section = document.createElement('div');
    section.id = 'diff-selector';
    section.style.cssText = 'margin-top:16px;';
    section.innerHTML = '<div style="font-size:13px;font-weight:600;color:var(--accent-gold);margin-bottom:8px;">🎚 选择难度</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">' + diffHtml + '</div>';

    // 插入到 start-btn 前面
    const btn = document.getElementById('start-btn');
    if (btn) {
      btn.parentNode.insertBefore(section, btn);
    }
  }

  // 带重试的存档检查：等 Storage 异步预加载完成后再检查
  function checkSaveOrShowOrigin() {
    if (checkSave()) return;
    // 没找到存档，显示出身选择界面
    renderOriginCards();
    renderDiffSelector();
    const btn = document.getElementById('start-btn');
    if (btn) {
      btn.addEventListener('click', function() {
        const selected = document.querySelector('.origin-card.selected');
        if (!selected) return;
        const nameInput = document.getElementById('player-name-input');
        const playerName = nameInput && nameInput.value.trim() ? nameInput.value.trim() : null;
        const activeDiff = document.querySelector('.diff-card.active');
        const diffKey = activeDiff ? activeDiff.dataset.diff : 'standard';
        SGame.startGame(selected.dataset.origin, playerName, { difficulty: diffKey });
      }, { once: true });
    }
  }

  // ========== 启动游戏循环 ==========
  function startGameLoop() {
    if (typeof SGame !== 'undefined') {
      SGame.startTick();
      SGame.startEventCheck();
    }
  }

  // ========== 协议检查：file:// 无法跨域调LLM ==========
  function checkProtocol() {
    if (window.location.protocol === 'file:') {
      _debugWarn('⚠ 检测到 file:// 协议，LLM将无法工作（浏览器CORS限制）。');
      _debugWarn('   请用以下方式打开游戏：');
      _debugWarn('   1. 终端运行: cd ' + window.location.pathname.replace(/\/[^/]*$/, '') + ' && python -m http.server 8765');
      _debugWarn('   2. 浏览器打开: http://localhost:8765');
      // 创建一个提示条
      const bar = document.createElement('div');
      bar.style.cssText = 'position:fixed;top:50px;left:0;right:0;background:#7c2d12;color:#fed7aa;text-align:center;padding:8px;font-size:12px;z-index:999;';
      bar.innerHTML = '⚠ 检测到 file:// 协议，LLM功能将不可用。请通过 <b>http://localhost:8765</b> 打开游戏（终端运行: python -m http.server 8765）';
      document.body.insertBefore(bar, document.body.firstChild);
    }
  }

  // ========== DOM就绪后启动 ==========
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    _debug('[商海浮沉] init() starting...');
    checkProtocol();

    // 检测LLM：立即检查一次，之后每20秒重试直到上线
    if (typeof LLM !== 'undefined') {
      LLM.check();
      SGame._llmRetryTimer = setInterval(() => {
        if (typeof LLM !== 'undefined') {
          if (LLM.available) { clearInterval(SGame._llmRetryTimer); SGame._llmRetryTimer = null; return; }
          LLM.check();
        }
      }, 20000);
    }
    // 检查存档：等待 Storage 异步预加载完成后再检查（不再用 3 秒重试）
    _debug('[商海浮沉] waiting for Storage.ready()... typeof Storage:', typeof Storage);
    if (typeof Storage !== 'undefined' && Storage.ready) {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Storage ready timeout')), 15000)
      );
      Promise.race([Storage.ready(), timeoutPromise])
        .then(() => {
          _debug('[商海浮沉] Storage ready, checking save...');
          checkSaveOrShowOrigin();
        })
        .catch((err) => {
          _debugWarn('[商海浮沉] Storage ready failed/timed out:', err.message || err);
          checkSaveOrShowOrigin();
        });
    } else {
      // 兜底：Storage 不可用时直接检查
      checkSaveOrShowOrigin();
    }
    // 时钟
    setInterval(() => UI.renderClock(), 60000);
    UI.renderClock();

    // 构建面板标签栏
    if (typeof UI !== 'undefined' && typeof UI.buildPanelTabs === 'function') {
      UI.buildPanelTabs();
    }
    // Topbar 事件委托（data-action 替代 onclick）
    if (typeof UI !== 'undefined' && typeof UI._initTopbarDelegation === 'function') {
      UI._initTopbarDelegation();
    }

    // 键盘快捷键
    setupKeyboardShortcuts();
  }

  function setupKeyboardShortcuts() {
    // SPA 生命周期：整个游戏在同一个 HTML 页面运行，keydown 监听器无需移除
    document.addEventListener('keydown', function(e) {
      // 忽略输入框内的按键
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Space 键：用 e.code 检测更可靠（e.key 在不同浏览器可能不一致）
      if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (typeof SGame !== 'undefined' && SGame.G) {
          const result = SGame.manualWork();
          if (typeof UI !== 'undefined' && UI.showToast) {
            if (result.success) {
              UI.showToast('💰', '拉项目成功', result.msg || '收益已到账');
            } else {
              UI.showToast('⏳', '拉项目', result.msg || '操作失败');
            }
          }
        }
        return;
      }

      switch (e.key) {
        case '1': UI.switchPanel && UI.switchPanel('dashboard'); break;
        case '2': UI.switchPanel && UI.switchPanel('region'); break;
        case '3': UI.switchPanel && UI.switchPanel('business'); break;
        case '4': UI.switchPanel && UI.switchPanel('npc'); break;
        case '5': UI.switchPanel && UI.switchPanel('achievement'); break;
        case '6': UI.switchPanel && UI.switchPanel('stats'); break;
        case '7': UI.switchPanel && UI.switchPanel('ranking'); break;
        case '8': UI.switchPanel && UI.switchPanel('asset'); break;
        case 'r': case 'R':
          UI.switchPanel && UI.switchPanel('milestone');
          if (typeof UI !== 'undefined' && UI.showToast) UI.showToast('🏅', '里程碑', '查看里程碑与成就进度');
          break;
        case 'a': case 'A':
          if (typeof UI !== 'undefined' && typeof UI.toggleAutoMode === 'function') UI.toggleAutoMode();
          break;
        case 's': case 'S':
          if (typeof UI !== 'undefined' && typeof UI.openSettings === 'function') UI.openSettings();
          break;
        case 'f': case 'F':
          UI.switchPanel && UI.switchPanel('financial');
          break;
      }
    });
  }
})();
