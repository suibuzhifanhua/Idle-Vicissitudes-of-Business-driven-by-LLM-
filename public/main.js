// ==================================================
// main.js — 入口：初始化、出身选择、启动
// ==================================================

(function() {
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
    console.log('[商海浮沉] checkSave() called');
    if (typeof SGame !== 'undefined' && SGame.load()) {
      console.log('[商海浮沉] save loaded, G.money:', SGame.G ? SGame.G.money : 'null');
      // 有存档，直接进入游戏
      document.getElementById('origin-screen').style.display = 'none';
      // 计算离线收益
      const offline = SGame.calcOfflineIncome();
      if (offline > 0) {
        SGame.G.money += offline;
        SGame.addLog(`离线收益: +${SGame.formatMoney(offline)}`);
      }
      console.log('[商海浮沉] calling UI.renderAll()...');
      UI.renderAll();
      console.log('[商海浮沉] UI.renderAll() done');
      startGameLoop();
      SGame.checkRegionUnlocks();
      // 首次游戏显示教程
      if (SGame.isFirstGame && SGame.isFirstGame()) {
        setTimeout(() => UI.showTutorial(), 500);
      }
      return true;
    } else {
      console.log('[商海浮沉] no save found in this checkSave() call');
      return false;
    }
  }

  // 带重试的存档检查：等 Storage 异步 preload 完成后再试一次
  function checkSaveWithRetry() {
    const found = checkSave();
    if (found) return;
    // 没找到存档，等 3 秒让异步 preload 完成，再试一次
    console.log('[商海浮沉] save not found, will retry after 3s...');
    setTimeout(() => {
      console.log('[商海浮沉] retrying checkSave() after delay...');
      const found2 = checkSave();
      if (!found2) {
        // 两次都没找到，显示出身选择界面
        console.log('[商海浮沉] still no save, showing origin screen');
        renderOriginCards();
        const btn = document.getElementById('start-btn');
        if (btn) {
          btn.addEventListener('click', function() {
            const selected = document.querySelector('.origin-card.selected');
            if (!selected) return;
            const nameInput = document.getElementById('player-name-input');
            const playerName = nameInput && nameInput.value.trim() ? nameInput.value.trim() : null;
            if (!confirm('⚠️ 一旦踏上商海征途，便再无回头之路。\n\n每一个决策都将改写命运，确定要开始吗？')) return;
            SGame.startGame(selected.dataset.origin, playerName);
          });
        }
      }
    }, 3000);
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
      console.warn('⚠ 检测到 file:// 协议，LLM将无法工作（浏览器CORS限制）。');
      console.warn('   请用以下方式打开游戏：');
      console.warn('   1. 终端运行: cd ' + window.location.pathname.replace(/\/[^/]*$/, '') + ' && python -m http.server 8765');
      console.warn('   2. 浏览器打开: http://localhost:8765');
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
    console.log('[商海浮沉] init() starting...');
    checkProtocol();

    // 检测LLM（失败后每10秒重试一次）
    async function checkLLMWithRetry() {
      if (typeof LLM !== 'undefined') {
        await LLM.check();
        if (!LLM.available) {
          setTimeout(checkLLMWithRetry, 10000);
        }
      }
    }
    checkLLMWithRetry();
    // 每30秒重检
    setInterval(() => { if (typeof LLM !== 'undefined' && !LLM.available) LLM.check(); }, 30000);
    // 检查存档（带重试：先同步读，3秒后再异步确认一次）
    console.log('[商海浮沉] checking save... typeof SGame:', typeof SGame);
    checkSaveWithRetry();
    console.log('[商海浮沉] checkSaveWithRetry dispatched');
    // 时钟
    setInterval(() => UI.renderClock(), 60000);
    UI.renderClock();

    // 键盘快捷键
    setupKeyboardShortcuts();
  }

  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
      // 忽略输入框内的按键
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key) {
        case '1': UI.switchPanel && UI.switchPanel('dashboard'); break;
        case '2': UI.switchPanel && UI.switchPanel('region'); break;
        case '3': UI.switchPanel && UI.switchPanel('business'); break;
        case '4': UI.switchPanel && UI.switchPanel('npc'); break;
        case '5': UI.switchPanel && UI.switchPanel('achievement'); break;
        case '6': UI.switchPanel && UI.switchPanel('stats'); break;
        case '7': UI.switchPanel && UI.switchPanel('ranking'); break;
        case 'r': case 'R':
          UI.switchPanel && UI.switchPanel('ranking');
          break;
        case ' ': case 'Spacebar':
          e.preventDefault();
          if (typeof SGame !== 'undefined' && SGame.G) SGame.manualWork();
          break;
        case 'a': case 'A':
          if (typeof UI !== 'undefined' && typeof UI.toggleAutoMode === 'function') UI.toggleAutoMode();
          break;
        case 's': case 'S':
          if (typeof UI !== 'undefined' && typeof UI.openSettings === 'function') UI.openSettings();
          break;
      }
    });
  }
})();
