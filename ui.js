// ==================================================
// ui.js — 界面渲染：所有面板、按钮、状态
// ==================================================

window.UI = (() => {
  let achievementTimer = null;
  let currentPanel = 'dashboard';
  let notificationsEnabled = true;

  // ========== 面板标签栏（一次性渲染，供 switchPanel 高亮用） ==========
  var _tabsBuilt = false;
  function buildPanelTabs() {
    if (_tabsBuilt) return;
    _tabsBuilt = true;
    var container = document.getElementById('center-area');
    if (!container) return;
    var tabBar = document.createElement('div');
    tabBar.id = 'panel-tab-bar';
    tabBar.style.cssText = 'display:flex;gap:0;border-bottom:1px solid var(--border);padding:0 12px;overflow-x:auto;flex-wrap:wrap;scrollbar-width:thin;';
    var panels = [
      { id:'dashboard', label:'📊 仪表盘' },
      { id:'region', label:'🏙 区域' },
      { id:'business', label:'📋 业务' },
      { id:'npc', label:'👥 NPC' },
      { id:'asset', label:'💎 资产' },
      { id:'achievement', label:'🏆 成就' },
      { id:'stats', label:'📈 统计' },
      { id:'ranking', label:'🏅 排行榜' },
      { id:'milestone', label:'🎯 里程碑' },
      { id:'worldmap', label:'🗺 地图' },
      { id:'tech', label:'🔬 科技' },
      { id:'stock', label:'📊 股票' },
    ];
    panels.forEach(function(p) {
      var span = document.createElement('span');
      span.className = 'panel-tab';
      span.setAttribute('data-panel', p.id);
      span.textContent = p.label;
      span.style.cursor = 'pointer';
      span.addEventListener('click', function() { switchPanel(p.id); });
      tabBar.appendChild(span);
    });
    container.insertBefore(tabBar, container.firstChild);
  }
  function switchPanel(name) {
    if (!['dashboard', 'region', 'business', 'npc', 'asset', 'achievement', 'stats', 'worldmap', 'tech', 'stock', 'ranking', 'milestone'].includes(name)) return;
    currentPanel = name;
    const tabs = document.querySelectorAll('.panel-tab');
    tabs.forEach(t => t.classList.remove('active'));
    const targetTab = document.querySelector('.panel-tab[data-panel="' + name + '"]');
    if (targetTab) targetTab.classList.add('active');

    const defaultView = document.getElementById('center-default');
    const panelView = document.getElementById('center-panel');
    if (!panelView) return;

    if (name === 'dashboard') {
      if (defaultView) defaultView.style.display = '';
      panelView.style.display = 'none';
    } else {
      if (defaultView) defaultView.style.display = 'none';
      panelView.style.display = '';
      panelView.className = 'dash-panel switching';
      setTimeout(() => {
        renderCenterPanel(name);
        if (panelView) panelView.className = 'dash-panel';
      }, 200);
    }
  }

  function renderCenterPanel(name) {
    const panel = document.getElementById('center-panel');
    if (!panel) return;
    switch (name) {
      case 'dashboard': renderDashboard(); return;
      case 'region': renderRegions(panel); return;
      case 'business': renderBusinessList(panel); return;
      case 'npc': renderNPCPanel(panel); return;
      case 'achievement': renderAchievementPanel(panel); return;
      case 'stats': renderStatPanel(panel); return;
      case 'worldmap': renderWorldMap(panel); return;
      case 'tech': renderTechPanel(panel); return;
      case 'stock': renderStockPanel(panel); return;
      case 'ranking': renderRankingPanel(panel); return;
      case 'milestone': renderMilestonePanel(panel); return;
      case 'asset': renderAssetPanel(panel); return;
    }
  }

  // ========== 世界地图渲染 ==========
  function renderWorldMap(panel) {
    if (!panel) return;
    const G = SGame.G;
    if (!G) return;

    // 国内城市和国际城市分开
    const domestic = ['xinhai', 'jingdu', 'shengang', 'rongcheng', 'hangjiang'];
    const international = ['xinjiapo', 'dongjing', 'niuyue', 'lundun', 'dibai'];

    let html = '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">';
    html += '<button onclick="UI.switchPanel(\'dashboard\')" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:#fff;padding:6px 14px;font-size:13px;cursor:pointer;font-family:var(--font);transition:all 0.2s;" onmouseover="this.style.background=\'rgba(255,255,255,0.18)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.08)\'">← 返回</button>';
    html += '<div style="font-size:16px;font-weight:700;color:var(--accent-gold)">🗺 世界地图</div>';
    html += '</div>';

    // 国内城市
    html += '<div style="margin-bottom:12px"><div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">🇨🇳 国内城市</div>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:10px;">';
    domestic.forEach(cid => {
      const city = CITIES[cid];
      if (!city) return;
      const isUnlocked = G.cities[cid] && G.cities[cid].unlocked;
      const isCurrent = G.currentCityId === cid;
      const btnStyle = isCurrent
        ? 'border:2px solid var(--accent-gold);background:rgba(245,158,11,0.15);'
        : isUnlocked
          ? 'border:1px solid var(--border);cursor:pointer;'
          : 'border:1px solid var(--border);opacity:0.4;';

      html += `<div onclick="${isUnlocked ? "UI.switchCity('" + cid + "')" : ''}" style="${btnStyle}padding:12px 16px;border-radius:10px;text-align:center;min-width:90px;${isUnlocked ? 'cursor:pointer;' : ''}${isUnlocked ? '' : 'cursor:default;'}">
        <div style="font-size:28px;">${city.icon}</div>
        <div style="font-size:12px;font-weight:600;color:${isUnlocked ? 'var(--text-primary)' : 'var(--text-muted)'};">${city.name}</div>
        ${isUnlocked
          ? '<div style="font-size:10px;color:var(--green-down);">已解锁</div>'
          : `<div style="font-size:10px;color:var(--text-muted);" title="资产${SGame.formatMoney(city.unlockMoney)}+${city.minAct?('第'+city.minAct+'幕+'):''}">资产${SGame.formatMoney(city.unlockMoney)}${city.minAct?'+第'+city.minAct+'幕':''}</div>`}
        ${isCurrent ? '<div style="font-size:10px;color:var(--accent-gold);margin-top:2px;">● 当前</div>' : ''}
      </div>`;
    });
    html += '</div></div>';

    // 国际城市
    html += '<div style="margin-bottom:12px"><div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">🌏 国际城市</div>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:10px;">';
    international.forEach(cid => {
      const city = CITIES[cid];
      if (!city) return;
      const isUnlocked = G.cities[cid] && G.cities[cid].unlocked;
      const isCurrent = G.currentCityId === cid;
      const btnStyle = isCurrent
        ? 'border:2px solid var(--accent-gold);background:rgba(245,158,11,0.15);'
        : isUnlocked
          ? 'border:1px solid var(--border);cursor:pointer;'
          : 'border:1px solid var(--border);opacity:0.35;';

      html += `<div onclick="${isUnlocked ? "UI.switchCity('" + cid + "')" : ''}" style="${btnStyle}padding:12px 16px;border-radius:10px;text-align:center;min-width:90px;${isUnlocked ? 'cursor:pointer;' : ''}${isUnlocked ? '' : 'cursor:default;'}">
        <div style="font-size:28px;">${city.icon}</div>
        <div style="font-size:12px;font-weight:600;color:${isUnlocked ? 'var(--text-primary)' : 'var(--text-muted)'};">${city.name}</div>
        ${isUnlocked
          ? '<div style="font-size:10px;color:var(--green-down);">已解锁</div>'
          : `<div style="font-size:10px;color:var(--text-muted);" title="资产${SGame.formatMoney(city.unlockMoney)}+${city.minAct?('第'+city.minAct+'幕+'):''}">资产${SGame.formatMoney(city.unlockMoney)}${city.minAct?'+第'+city.minAct+'幕':''}</div>`}
        ${isCurrent ? '<div style="font-size:10px;color:var(--accent-gold);margin-top:2px;">● 当前</div>' : ''}
      </div>`;
    });
    html += '</div></div>';

    // 跨城协同信息
    const unlockedCount = Object.values(G.cities || {}).filter(c => c.unlocked).length;
    const synergyPct = SGame.calcSynergyMultiplier ? Math.round((SGame.calcSynergyMultiplier() - 1) * 100) : 0;
    html += `<div style="margin-top:16px;padding:12px;background:var(--bg-hover);border-radius:8px;font-size:11px;color:var(--text-secondary);">
      已解锁城市: <b style="color:var(--accent-gold)">${unlockedCount}</b>/10 |
      跨城协同加成: <b style="color:var(--green-down)">+${synergyPct}%</b>
    </div>`;

    panel.innerHTML = html;
  }

  // ========== 城市切换 ==========
  function switchCity(cityId) {
    const G = SGame.G;
    if (!G) return;
    if (G.currentCityId === cityId) return;
    if (!G.cities[cityId] || !G.cities[cityId].unlocked) {
      EventSystem.addLog('该城市尚未解锁。');
      return;
    }

    if (typeof SGame.switchCity === 'function') {
      SGame.switchCity(cityId);
      EventSystem.addLog('切换到' + (CITIES[cityId] ? CITIES[cityId].icon + ' ' + CITIES[cityId].name : cityId));
    }
    renderAll();
    // 世界地图高亮跟随：如果当前在世界地图面板，重新渲染以更新选中态
    if (currentPanel === 'worldmap') {
      const panelView = document.getElementById('center-panel');
      if (panelView && panelView.style.display !== 'none') {
        renderWorldMap(panelView);
      }
    }
  }

  // ========== 城市选择器（仪表板下拉） ==========
  function renderCitySelector() {
    const G = SGame.G;
    if (!G) return '';
    const unlockedCities = Object.entries(G.cities || {}).filter(([_, c]) => c.unlocked);
    if (unlockedCities.length <= 1) {
      const city = CITIES[G.currentCityId];
      return city ? city.icon + ' ' + city.name : '新海市';
    }
    let opts = unlockedCities.map(([cid, _]) => {
      const city = CITIES[cid];
      const label = city ? city.icon + ' ' + city.name : cid;
      const sel = cid === G.currentCityId ? 'selected' : '';
      return `<option value="${cid}" ${sel}>${label}</option>`;
    }).join('');
    return `<select id="city-selector" onchange="UI.switchCity(this.value)" style="background:var(--bg-primary);color:var(--accent-gold);border:1px solid var(--border);border-radius:4px;font-size:11px;padding:2px 6px;">${opts}</select>`;
  }

  // (first openSettings removed — was dead code shadowed by the modal-based version)

  // ========== 主渲染入口 ==========
  // ========== 渲染节流（requestAnimationFrame 批处理） ==========
  let _renderPending = false;
  let _renderRAFId = null;

  function renderAll() {
    if (!SGame.G) return;

    // 已有一个 rAF 在队列中，跳过本次调用（合并渲染）
    if (_renderPending) return;
    _renderPending = true;

    _renderRAFId = requestAnimationFrame(() => {
      _renderPending = false;
      _renderRAFId = null;
      _doRenderAll();
    });
  }

  // #6-#7 局部更新：缓存上次渲染数据，仅变化时重绘
  var _renderCache = {
    dashboard: '', dashMoney: 0, dashIncome: 0, dashExpense: 0, dashEmpCount: 0, dashBizCount: 0,
    dashRep: 0, dashConn: 0, dashSent: 0, dashAssetCnt: 0, dashStockCnt: 0, dashResearchN: 0,
    regions: '', regionKeys: '',
    employees: '', empKeys: '',
    businesses: '', bizKeys: '',
    eventLog: '', lastLogIdx: -1,
    stats: '', statsMoney: 0, statsIncome: 0, statsTick: 0
  };

  function _shouldSkipDashboard(G) {
    var empCount = G.employees ? G.employees.length : 0;
    var bizCount = G.businesses ? Object.values(G.businesses).filter(function(b) { return b.level > 0; }).length : 0;
    var stockCount = G.stocks ? Object.keys(G.stocks).length : 0;
    var researchTotal = 0;
    if (G.completedResearch) {
      ['digital','ai','blockchain'].forEach(function(k) { researchTotal += (G.completedResearch[k] || 0); });
    }
    if (G.activeResearch && G.activeResearch.techId) researchTotal += 1;
    var assetCnt = G.assets ? G.assets.length : 0;
    var moneyDelta = Math.abs(_renderCache.dashMoney - (G.money || 0));
    var repDelta = Math.abs(_renderCache.dashRep - (G.reputation || 0));
    var sentDelta = Math.abs(_renderCache.dashSent - (G.marketSentiment || 50));

    // 仅金额小幅波动且其他数据均未变化时跳过
    if (moneyDelta < 200 &&
        empCount === _renderCache.dashEmpCount &&
        bizCount === _renderCache.dashBizCount &&
        repDelta < 1 &&
        _renderCache.dashConn === (G.connections || 0) &&
        sentDelta < 2 &&
        assetCnt === _renderCache.dashAssetCnt &&
        stockCount === _renderCache.dashStockCnt &&
        researchTotal === _renderCache.dashResearchN) {
      return true;
    }
    _renderCache.dashMoney = G.money || 0;
    _renderCache.dashEmpCount = empCount;
    _renderCache.dashBizCount = bizCount;
    _renderCache.dashRep = G.reputation || 0;
    _renderCache.dashConn = G.connections || 0;
    _renderCache.dashSent = G.marketSentiment || 50;
    _renderCache.dashAssetCnt = assetCnt;
    _renderCache.dashStockCnt = stockCount;
    _renderCache.dashResearchN = researchTotal;
    return false;
  }

  function _shouldSkipSimple(panel, key) {
    if (_renderCache[panel] === key) return true;
    _renderCache[panel] = key;
    return false;
  }

  function _doRenderAll() {
    const G = SGame.G;
    const safeRender = (name, fn, skipFn) => { try { if (!skipFn || !skipFn()) fn(); } catch(e) { console.error('[商海浮沉] renderAll/' + name + ' error:', e); } };

    // #6 仪表盘：除金钱外无显著变化时跳过（最昂贵的渲染）
    safeRender('dashboard', renderDashboard, function() { return _shouldSkipDashboard(G); });

    // #6 员工列表：仅数量或角色变化时重绘
    var empKeys = G.employees ? G.employees.map(function(e) { return e.id + ':' + (e.role || '') + ':' + (e.loyalty|0) + ':' + (e.fatigue|0); }).join(',') : '';
    safeRender('employeeList', renderEmployeeList, function() { return _shouldSkipSimple('employees', empKeys); });

    // #6 业务列表：仅等级变化时重绘
    var bizKeys = G.businesses ? Object.entries(G.businesses).filter(function(e) { return e[1].level > 0; }).map(function(e) { return e[0] + ':' + e[1].level; }).join(',') : '';
    safeRender('businessList', renderBusinessList, function() { return _shouldSkipSimple('businesses', bizKeys); });

    // #6 区域面板：仅解锁/购买/升级变化时重绘
    var regionKeys = G.cities ? Object.entries(G.cities).map(function(e) { return e[0] + ':' + (e[1].unlocked ? 'u' : 'l'); }).join(',') : '';
    safeRender('regions', renderRegions, function() { return _shouldSkipSimple('regions', regionKeys); });

    // #6 事件日志：无新条目时跳过
    var logIdx = G.eventLog ? G.eventLog.length - 1 : -1;
    safeRender('eventLog', renderEventLog, function() { return _shouldSkipSimple('eventLog', logIdx); });

    // #6 统计面板：几乎每tick变化但渲染轻量，保持
    safeRender('stats', renderStats);

    // #7 以下面板变化频率低，始终渲染但仍用 safeRender 保护
    safeRender('npcPanel', renderNPCPanel);
    safeRender('actDisplay', renderActDisplay);
    safeRender('hotSearch', renderHotSearch);
    safeRender('hireButton', renderHireButton);
    safeRender('synergyStatus', renderSynergyStatus);
    safeRender('manualButton', renderManualButton);
    safeRender('clock', renderClock);
    safeRender('autoButton', renderAutoButton);
  }

  // ========== 离线收益弹窗 ==========
  function showOfflineIncomePopup(offlineData) {
    const G = SGame.G;
    if (!G) return;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.style.zIndex = '2000';
    overlay.innerHTML = `
      <div class="modal" style="text-align:center;">
        <div style="font-size:48px;margin-bottom:12px;">💰</div>
        <div class="modal-title" style="font-size:18px;">离线收益</div>
        <div style="font-size:13px;color:var(--text-secondary);margin:12px 0;line-height:1.8;">
          你离开了 <b style="color:var(--accent-gold)">${(offlineData.hours ?? 0).toFixed(1)} 小时</b><br>
          期间经过 <b style="color:var(--accent-cyan)">${offlineData.ticks ?? 0} Tick</b><br>
          产生收益: <b style="color:var(--green-down);font-size:18px;">+${formatMoneyComma(offlineData.income ?? 0)}</b>
        </div>
        <div style="display:flex;gap:10px;justify-content:center;margin-top:16px;">
          <button class="btn" style="font-size:13px;padding:8px 24px;background:linear-gradient(135deg,var(--accent-gold),#d97706);" onclick="UI.claimOfflineIncome(this)">领取收益</button>
          <button class="btn" style="font-size:13px;padding:8px 24px;background:var(--bg-hover);border:1px solid var(--border);" onclick="this.closest('.modal-overlay').remove();">暂不领取</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  function claimOfflineIncome(btn) {
    if (typeof SGame.claimOfflineIncome === 'function') {
      SGame.claimOfflineIncome();
    }
    if (typeof SGame.save === 'function') {
      SGame.save();
    }
    const overlay = btn.closest('.modal-overlay');
    if (overlay) overlay.remove();
    showToast('💰', '离线收益已领取', '已添加到你的资产');
    renderAll();
  }

  // ========== 玩家属性面板 ==========
  function renderStats() {
    const G = SGame.G;
    const el = document.getElementById('stats-panel');
    if (!el) return;
    if (!G) { el.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:12px">等待游戏初始化...</div>'; return; }

    const stressCls = G.stress >= 70 ? 'stress-critical' : G.stress >= 40 ? 'stress-high' : G.stress >= 20 ? 'stress-mid' : 'stress-low';
    const repCls = G.reputation >= 70 ? 'rep-high' : G.reputation >= 40 ? 'rep-mid' : 'rep-low';

    const repProgCls = G.reputation >= 70 ? 'good' : G.reputation >= 40 ? 'warn' : 'danger';
    const stressProgCls = G.stress >= 70 ? 'danger' : G.stress >= 40 ? 'warn' : 'good';
    const rankDef = RANK_TIERS ? RANK_TIERS.find(r => r.name === G.rank) : null;
    const rankIcon = rankDef ? rankDef.icon : '';
    const cityDef = CITIES[G.currentCityId];
    const cityLabel = cityDef ? cityDef.icon + ' ' + cityDef.name : '新海市';
    const stats = G.stats || {};

    el.innerHTML = `
      <div style="font-size:13px;font-weight:600;color:var(--accent-gold);margin-bottom:8px">${G.name || '未命名'}</div>
      <div class="stat-row"><span class="stat-label">头衔</span><span class="stat-value" style="color:var(--accent-cyan)">${rankIcon} ${G.rank || '个体户'}</span></div>
      <div class="stat-row"><span class="stat-label">资产</span><span class="stat-value" style="color:var(--accent-gold)">${SGame.formatMoney(G.money)}</span></div>
      <div class="stat-row" style="margin-top:6px"><span class="stat-label">声誉</span><span class="stat-value ${repCls}">${(G.reputation??0).toFixed(1)}</span></div>
      <div class="progress-bar"><div class="progress-fill ${repProgCls}" style="width:${G.reputation??0}%"></div></div>
      <div class="stat-row" style="margin-top:6px"><span class="stat-label">压力</span><span class="stat-value ${stressCls}">${(G.stress??0).toFixed(1)}</span></div>
      <div class="progress-bar"><div class="progress-fill ${stressProgCls}" style="width:${G.stress??0}%"></div></div>
      <div class="stat-row"><span class="stat-label">人脉</span><span class="stat-value" style="color:var(--accent-cyan)">${G.connections ?? 0}</span></div>
      <div style="margin-top:8px;font-size:10px;color:var(--text-muted)">
        管理${stats.management ?? 0} | 技术${stats.tech ?? 0} | 社交${stats.social ?? 0} | 金融${stats.finance ?? 0}
      </div>
      <div style="font-size:10px;color:var(--text-muted);margin-top:2px">压力模式: ${G.stressMode ?? '--'}</div>
    `;
  }

  // ========== 区域面板 ==========
  function renderRegions(optEl) {
    const el = optEl || document.getElementById('regions-panel');
    if (!el) return;
    const G = SGame.G;
    if (!G) { el.innerHTML = '<div style="font-size:11px;color:var(--text-muted);padding:8px 0">--</div>'; return; }
    const cityId = G.currentCityId || 'xinhai';
    const cityDef = CITIES[cityId];
    const unlockedRegions = G.unlockedRegions || [];
    const cityRegions = cityDef ? cityDef.regionIds : [];

    let html = '';
    Object.values(REGIONS).forEach(r => {
      // 只显示当前城市的区域
      if (r.cityId !== cityId) return;

      const isUnlocked = unlockedRegions.includes(r.id);
      if (!r.unlocked && !isUnlocked) {
        html += `<div class="stat-row" style="opacity:0.4;font-size:11px"><span class="stat-label">🔒 ${r.name}</span><span class="stat-value">未解锁</span></div>`;
        return;
      }
      html += `<div class="stat-row" style="font-size:11px">
        <span class="stat-label">${r.name}</span>
        <span class="stat-value" style="font-size:10px;color:var(--text-muted)">${r.bonus.desc}</span>
      </div>`;
    });
    el.innerHTML = html;
  }

  // ========== 业务列表 ==========
  function renderBusinessList(optEl) {
    const el = optEl || document.getElementById('business-list');
    if (!el) return;
    const G = SGame.G;
    if (!G) { el.innerHTML = '<div style="font-size:11px;color:var(--text-muted);padding:8px 0">--</div>'; return; }
    const cityId = G.currentCityId || 'xinhai';
    const cityDef = CITIES[cityId];
    const businesses = G.businesses || {};
    const unlockedRegions = G.unlockedRegions || [];
    const cityLabel = cityDef ? cityDef.icon + ' ' + cityDef.name : '新海市';

    let html = '';
    let hasAnyBiz = false;
    BUSINESS_DEFS.forEach(b => {
      const state = businesses[b.id];
      if (!state) return;
      hasAnyBiz = true;

      if (!state.unlocked) {
        const unlockMoney = b.unlockMoney;
        html += `<div style="padding:8px 0;border-bottom:1px solid var(--border);opacity:0.5">
          <div style="font-size:12px">🔒 ${b.name} ${b.icon}</div>
          <div style="font-size:10px;color:var(--text-muted)">解锁需求: ${SGame.formatMoney(unlockMoney)}</div>
        </div>`;
        return;
      }

      const lv = state.level;
      const maxLv = b.levels.length;
      const def = lv > 0 ? b.levels[lv - 1] : null;
      const nextDef = lv < maxLv ? b.levels[lv] : null;

      // 区域选择 - 仅显示当前城市的区域
      let regionSelect = '';
      if (lv > 0) {
        const curRegion = state.region || '未分配';
        const availRegions = b.regions.filter(r => REGIONS[r] && REGIONS[r].cityId === cityId && (REGIONS[r].unlocked || unlockedRegions.includes(r)));
        regionSelect = `<select style="background:var(--bg-primary);color:var(--text-secondary);border:1px solid var(--border);border-radius:4px;font-size:10px;padding:2px 4px;margin-top:4px;" onchange="UI.setBusinessRegion('${b.id}', this.value)">
          ${availRegions.map(r => `<option value="${r}" ${state.region===r?'selected':''}>${REGIONS[r]?.name || r}</option>`).join('')}
          <option value="" ${!state.region?'selected':''}>未分配</option>
        </select>`;
      }

      // 市场份额和供应链状态（功能6）
      let marketShareHtml = '';
      let supplyChainHtml = '';
      if (lv > 0) {
        const ms = G.marketShare ? G.marketShare[b.id] : undefined;
        if (ms !== undefined) {
          const msPct = (ms * 100).toFixed(1);
          marketShareHtml = `<div style="font-size:10px;color:var(--accent-cyan);margin-top:2px">市场份额: ${msPct}%</div>`;
        }
        const sc = G.supplyChain ? G.supplyChain[b.id] : undefined;
        if (sc) {
          const upColor = sc.upstream === 'normal' ? 'var(--green-down)' : 'var(--red-up)';
          const downColor = sc.downstream === 'normal' ? 'var(--green-down)' : 'var(--red-up)';
          const upLabel = sc.upstream === 'normal' ? '正常' : '中断';
          const downLabel = sc.downstream === 'normal' ? '正常' : '中断';
          supplyChainHtml = `<div style="font-size:10px;color:var(--text-muted);margin-top:1px">供应链: 上游<span style="color:${upColor}">${upLabel}</span> | 下游<span style="color:${downColor}">${downLabel}</span></div>`;
        }
      }

      const lvColorClass = lv > 0 ? 'biz-lv-' + Math.min(lv, 5) : '';
      html += `<div style="padding:10px 0;border-bottom:1px solid var(--border)" class="${lvColorClass}">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:12px;font-weight:600" class="${lvColorClass}">${b.icon} ${b.name} ${lv > 0 ? `Lv.${lv}` : ''}</span>
          <span style="font-size:10px;color:var(--text-muted)">${lv === 0 ? '未开业' : def.name}</span>
        </div>
        ${lv > 0 ? `<div style="font-size:10px;color:var(--accent-gold);margin-top:2px">收益: ${(SGame.calcBizIncome ? SGame.calcBizIncome(b.id, G) : def.income).toFixed(1)}万/年</div>` : ''}
        ${marketShareHtml}
        ${supplyChainHtml}
        ${regionSelect}
        <div style="display:flex;gap:6px;margin-top:6px">
          ${lv === 0 ? `<button class="btn" style="font-size:10px;padding:3px 8px" onclick="UI.openBusiness('${b.id}')">开业</button>` : ''}
          ${nextDef ? (() => {
            const canAfford = G.money >= nextDef.cost * 10000;
            // 检查前置条件
            let condMet = true;
            let condHint = '';
            if (nextDef.reqCond) {
              if (nextDef.reqCond.techLv) {
                const maxTL = Math.max(0, ...Object.values(G.completedResearch || {}));
                if (maxTL < nextDef.reqCond.techLv) { condMet = false; condHint = `需科技Lv${nextDef.reqCond.techLv}`; }
              }
              if (nextDef.reqCond.rep && G.reputation < nextDef.reqCond.rep) { condMet = false; condHint = condHint || `需声誉${nextDef.reqCond.rep}`; }
              if (nextDef.reqCond.npcFavor) {
                for (const [nid, minF] of Object.entries(nextDef.reqCond.npcFavor)) {
                  if ((G.npcFavor && G.npcFavor[nid] || 0) < minF) { condMet = false; condHint = condHint || `需${(NPCS[nid]||{}).name||nid}好感${minF}`; break; }
                }
              }
            }
            if (canAfford && condMet) {
              return `<button class="btn" style="font-size:10px;padding:3px 8px" onclick="UI.upgradeBusiness('${b.id}')">升级 (${(nextDef.cost).toFixed(0)}万)</button>`;
            } else {
              const hint = !canAfford ? `升级 (${(nextDef.cost).toFixed(0)}万)` : `升级 (${condHint})`;
              return `<button class="btn" style="font-size:10px;padding:3px 8px;opacity:0.5" disabled title="${!canAfford ? '资金不足' : condHint}">${hint}</button>`;
            }
          })() : ''}
          ${lv > 0 ? `<button class="btn" style="font-size:10px;padding:3px 8px;background:linear-gradient(135deg,var(--accent-gold),#d97706);" onclick="UI.upgradeBusinessMax('${b.id}')">一键升级</button>` : ''}
          ${lv > 0 ? `<button class="btn" style="font-size:10px;padding:3px 8px;opacity:0.6" onclick="UI.closeBusiness('${b.id}')">停业</button>` : ''}
        </div>
      </div>`;
    });
    if (!hasAnyBiz) {
      const xinhaiHasBiz = G.cities['xinhai'] && G.cities['xinhai'].businesses && 
        Object.values(G.cities['xinhai'].businesses).some(b => b.level > 0);
      if (xinhaiHasBiz) {
        html = `<div style="padding:16px 0;text-align:center;color:var(--text-muted);line-height:1.8">
          <div style="font-size:14px;margin-bottom:8px">🏙️ ${cityLabel} 暂无业务</div>
          <div style="font-size:11px">你的业务都在新海市，切换过去即可继续经营</div>
          <button class="btn" style="margin-top:10px;font-size:12px;padding:6px 16px" onclick="UI.switchCity('xinhai')">回新海市</button>
        </div>`;
      } else {
        html = `<div style="padding:16px 0;text-align:center;color:var(--text-muted);line-height:1.8">
          <div style="font-size:14px;margin-bottom:8px">🏙️ ${cityLabel} 暂无业务</div>
          <div style="font-size:11px">前往世界地图解锁或切换其他城市</div>
          <button class="btn" style="margin-top:10px;font-size:12px;padding:6px 16px" onclick="UI.switchPanel('worldmap')">🗺 世界地图</button>
        </div>`;
      }
    }
    el.innerHTML = html;
    // 已并购业务列表
    var maList = (SGame && typeof SGame.getMAList === 'function') ? SGame.getMAList() : [];
    if (maList && maList.length > 0) {
      var maHtml = '<div style="margin-top:16px;padding-top:12px;border-top:2px solid var(--accent-gold);"><div style="font-size:13px;font-weight:600;color:var(--accent-gold);margin-bottom:8px;">🤝 已并购业务</div>';
      maList.forEach(function(b) {
        maHtml += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px;">' +
          '<span>' + (b.name || b.npcId) + '</span>' +
          '<span style="color:var(--green-down);font-weight:600;">+' + SGame.formatMoney(b.revenuePerTick || 0) + '/Tick</span>' +
          '</div>';
      });
      maHtml += '<div style="font-size:11px;color:var(--text-muted);margin-top:6px;">合计额外收入：+' + SGame.formatMoney(SGame.getMARevenue()) + '/Tick</div></div>';
      el.innerHTML += maHtml;
    }
  }

  function setBusinessRegion(bizId, regionId) {
    if (!SGame.G || !SGame.G.businesses) return;
    SGame.G.businesses[bizId].region = regionId || null;
    renderAll();
  }

  function openBusiness(bizId) {
    const G = SGame.G;
    if (!G) return;
    if (!G.businesses) G.businesses = {};
    const bDef = BUSINESS_DEFS.find(b => b.id === bizId);
    if (!bDef) return;
    let state = G.businesses[bizId];
    if (!state) { G.businesses[bizId] = bDef.unlockMoney === 0
      ? { level: 1, region: bDef.regions ? bDef.regions[0] : null, unlocked: true }
      : { level: 0, region: null, unlocked: true }; state = G.businesses[bizId]; }
    // 开业成本（Level 1的cost，富二代8折）
    const lv1 = bDef.levels[0];
    let openCost = (lv1.cost || 0) * 10000;
    if (G.origin === 'rich2nd') openCost = Math.floor(openCost * 0.8);
    if (openCost > 0 && G.money < openCost) {
      EventSystem.addLog('资金不足，无法开业。');
      return;
    }
    if (openCost > 0) G.money -= openCost;
    state.level = 1;
    state.region = bDef.regions[0];
    state.unlocked = true;
    // 同步到当前城市的 businesses
    if (G.cities && G.currentCityId) {
      var cityData = G.cities[G.currentCityId];
      if (cityData && cityData.businesses) {
        cityData.businesses[bizId] = { level: 1, region: bDef.regions[0], unlocked: true };
      }
    }
    EventSystem.addLog(`${bDef.icon} ${bDef.name} 开业了！`);
    renderAll();
  }

  function upgradeBusiness(bizId) {
    const G = SGame.G;
    if (!G) return;
    const bDef = BUSINESS_DEFS.find(b => b.id === bizId);
    if (!bDef) return;
    const state = (G.businesses || {})[bizId];
    if (!state) return;
    const next = bDef.levels[state.level];
    if (!next) return;
    // 前置条件检查（与 upgradeBusinessMax 一致）
    if (next.reqCond) {
      if (next.reqCond.techLv) {
        const maxTechLv = Math.max(0, ...Object.values(G.completedResearch || {}));
        if (maxTechLv < next.reqCond.techLv) {
          EventSystem.addLog(`升级需要科技等级 ${next.reqCond.techLv}，当前最高 ${maxTechLv}。`);
          return;
        }
      }
      if (next.reqCond.rep && G.reputation < next.reqCond.rep) {
        EventSystem.addLog(`升级需要声誉 ${next.reqCond.rep}，当前 ${G.reputation}。`);
        return;
      }
      if (next.reqCond.npcFavor) {
        for (const [npcId, minFavor] of Object.entries(next.reqCond.npcFavor)) {
          if ((G.npcFavor[npcId] || 0) < minFavor) {
            const npc = NPCS[npcId];
            EventSystem.addLog(`升级需要${npc ? npc.name : npcId}好感度 ${minFavor}，当前 ${G.npcFavor[npcId] || 0}。`);
            return;
          }
        }
      }
    }
    let cost = next.cost * 10000;
    if (G.origin === 'rich2nd') cost = Math.floor(cost * 0.8);
    if (G.money < cost) { EventSystem.addLog(`资金不足，升级需要 ${SGame.formatMoney(cost)}。`); return; }
    G.money -= cost;
    state.level++;
    // 同步到当前城市的 businesses
    if (G.cities && G.currentCityId) {
      var cityData = G.cities[G.currentCityId];
      if (cityData && cityData.businesses && cityData.businesses[bizId]) {
        cityData.businesses[bizId].level = state.level;
      }
    }
    EventSystem.addLog(`${bDef.icon} ${bDef.name} 升级到 ${next.name}！`);
    renderAll();
  }

  // ========== 一键升级 (功能3) ==========
  function upgradeBusinessMax(bizId) {
    if (typeof SGame.upgradeBusinessMax === 'function') {
      const result = SGame.upgradeBusinessMax(bizId);
      if (result.ok) {
        showToast('⬆️', '一键升级成功', result.msg);
      } else {
        EventSystem.addLog(result.msg);
      }
    }
    renderAll();
  }

  function closeBusiness(bizId) {
    const G = SGame.G;
    G.businesses[bizId].level = 0;
    G.businesses[bizId].region = null;
    renderAll();
  }

  // ========== 联动状态面板 ==========
  function renderSynergyStatus() {
    const el = document.getElementById('synergy-status');
    if (!el) return;
    const items = (SGame.getSynergyStatusDisplay && SGame.getSynergyStatusDisplay()) || [];
    if (items.length === 0) { el.style.display = 'none'; return; }
    el.style.display = 'flex';
    el.innerHTML = '<span style="font-size:10px;color:var(--text-muted);margin-right:6px;white-space:nowrap;">联动:</span>' +
      items.map(it => {
        const color = it.positive ? 'var(--green-down)' : 'var(--red-up)';
        const sign = it.positive ? '+' : '';
        return `<span style="font-size:10px;color:${color};background:${it.positive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'};padding:1px 5px;border-radius:4px;margin:0 2px;white-space:nowrap;">${it.label}:${sign}${it.value}</span>`;
      }).join('');
  }

  // ========== 仪表板 ==========
  function renderDashboard() {
    const el = document.getElementById('dashboard');
    if (!el) return;
    const G = SGame.G;
    if (!G) { el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px">等待游戏数据加载...</div>'; return; }
    const income = SGame.calcTotalIncome() ?? 0;
    const rawExpense = (G.employees || []).reduce((s, e) => s + calcActualSalary(e.baseSalary ?? e.salary, G) * 10000, 0);
    // HR 统管工资折扣
    let expense = rawExpense;
    if (typeof SGame.isHRManaged === 'function' && SGame.isHRManaged()) {
      const hrEmp = (G.employees || []).find(e => e.role === 'hr');
      if (hrEmp && (hrEmp.loyalty || 0) >= 30) expense = rawExpense * CONFIG.HR_SALARY_DISCOUNT;
    }
    const maintenanceCost = typeof SGame.calcMaintenanceCost === 'function' ? SGame.calcMaintenanceCost() : 0;
    const trendHtml = renderAssetTrend(G);
    const chartHtml = renderMiniAssetChart(G);
    const breakdownHtml = renderIncomeBreakdown();
    const citySelectHtml = renderCitySelector();
    const rankDef = RANK_TIERS ? RANK_TIERS.find(r => r.name === G.rank) : null;
    const rankIcon = rankDef ? rankDef.icon : '';
    const timeInfo = getTimeDisplay(G);
    const tickMs = (typeof CONFIG !== 'undefined' && CONFIG && CONFIG.TICK_MS) ? CONFIG.TICK_MS : 5000;

    // 市场情绪仪表盘显示 (#9)
    const sentiment = G.marketSentiment !== undefined ? G.marketSentiment : 50;
    var sentColor, sentIcon, sentLabel;
    if (sentiment >= 80) { sentColor = 'var(--red-up)'; sentIcon = '🔥'; sentLabel = '极度乐观'; }
    else if (sentiment >= 65) { sentColor = 'var(--accent-gold)'; sentIcon = '☀'; sentLabel = '偏乐观'; }
    else if (sentiment >= 45) { sentColor = 'var(--text-secondary)'; sentIcon = '☁'; sentLabel = '中性'; }
    else if (sentiment >= 25) { sentColor = 'var(--accent-blue)'; sentIcon = '🌧'; sentLabel = '偏悲观'; }
    else { sentColor = 'var(--green-down)'; sentIcon = '❄'; sentLabel = '极度悲观'; }

    // 资产估值
    const assetVal = (typeof SGame.getTotalAssetValue === 'function') ? SGame.getTotalAssetValue() : 0;

    // 托管状态标签
    let autoStatusHtml = '';
    if (G.autoMode && G.autoMode.enabled) {
      const am = G.autoMode;
      const badges = [];
      const dot = '<span style="color:var(--green-down);">●</span>';
      const gray = '<span style="color:var(--text-muted);">○</span>';
      if (am.eventDecide) badges.push(dot + '事件'); else badges.push(gray + '事件');
      if (am.autoOpenBusiness || am.autoUpgradeBusiness) badges.push(dot + '业务');
      if (am.autoHire) badges.push(dot + (typeof SGame.isHRManaged === 'function' && SGame.isHRManaged() ? '🏢员工' : '员工')); else badges.push(gray + '员工');
      if (am.autoUnlockRegion) badges.push(dot + '区域');
      if (am.autoResearch) badges.push(dot + '研发');
      if (am.autoInvest) badges.push(dot + '投资');
      if (am.autoRepay || am.autoLoan) badges.push(dot + '贷款');
      if (am.autoGift) badges.push(dot + '社交');

      // #18 增强托管状态：脉冲绿点 + 运行中横幅
      autoStatusHtml = '<div class="auto-banner">' +
        '<div style="display:flex;align-items:center;gap:4px;">' +
        '<span class="auto-dot"></span>' +
        '<span style="font-weight:700;font-size:12px;color:#22c55e;">托管运行中</span>' +
        '<span style="font-size:10px;color:var(--text-muted);margin-left:auto;">🤖</span>' +
        '</div>' +
        '<div style="font-size:10px;color:var(--text-muted);padding:4px 0 2px 14px;display:flex;align-items:center;gap:3px;flex-wrap:wrap;">' +
        badges.join(' · ') + '</div></div>';

      // 托管统计行
      var stats = G.autoStats;
      if (stats && stats.totalTicks > 0) {
        var runtimeMin = stats.startedAt ? Math.floor((Date.now() - stats.startedAt) / 60000) : 0;
        var runtimeStr = runtimeMin >= 60 ? Math.floor(runtimeMin/60) + 'h' + (runtimeMin%60) + 'm' : runtimeMin + 'min';
        autoStatusHtml += '<div style="font-size:10px;color:var(--text-muted);padding:4px 2px;display:flex;gap:8px;flex-wrap:wrap;">' +
          '<span>⏱ 运行' + runtimeStr + '</span>' +
          '<span>📋 ' + stats.decisions + '决策</span>' +
          '<span>🏗 ' + (stats.businessesOpened + stats.businessesUpgraded) + '业务</span>' +
          '<span>👤 +' + stats.employeesHired + '人</span>' +
          '<span>🎁 ' + stats.giftsGiven + '送礼</span>' +
          (stats.stocksBought + stats.stocksSold > 0 ? '<span>📈 ' + stats.stocksBought + '买/' + stats.stocksSold + '卖</span>' : '') +
          (stats.manualWorks > 0 ? '<span>💰 ' + stats.manualWorks + '拉项目</span>' : '') +
          (stats.researchesStarted > 0 ? '<span>🔬 ' + stats.researchesStarted + '研发</span>' : '') +
          '</div>';
      }
    }

    // #17 股票持仓摘要数据
    var stockCount = 0, stockPortVal = 0, stockCost = 0;
    if (G.stocks) {
      stockCount = Object.keys(G.stocks).length;
      stockPortVal = typeof SGame.getStockPortfolioValue === 'function' ? SGame.getStockPortfolioValue() : 0;
      stockCost = typeof SGame.getStockCostBasis === 'function' ? SGame.getStockCostBasis() : 0;
    }
    var stockPnl = stockPortVal - stockCost;
    var stockPnlColor = stockPnl >= 0 ? 'var(--green-down)' : 'var(--red-up)';
    var stockPnlSign = stockPnl >= 0 ? '+' : '';
    var stockCardHtml = '';
    if (stockCount > 0) {
      stockCardHtml = '<div class="dash-card">' +
        '<div class="dash-label">📈 股票持仓</div>' +
        '<div class="dash-value" style="color:var(--accent-gold);font-size:18px;">' + formatMoneyComma(stockPortVal) + '</div>' +
        '<div class="dash-sub">持有 ' + stockCount + ' 支 | 盈亏 <b style="color:' + stockPnlColor + '">' + stockPnlSign + formatMoneyComma(stockPnl) + '</b></div>' +
        '</div>';
    }

    // #17 研发进度摘要数据
    var researchCardHtml = '';
    var routes = [
      { id:'digital', name:'数字化', icon:'💻' },
      { id:'ai', name:'AI自动化', icon:'🤖' },
      { id:'blockchain', name:'区块链', icon:'🔗' }
    ];
    var researchTotal = 0, researchCompleted = 0;
    var activeResearchName = '';
    routes.forEach(function(r) {
      var techDefs = TECH_TREE && TECH_TREE[r.id] ? TECH_TREE[r.id] : null;
      if (techDefs && techDefs.levels) {
        researchTotal += techDefs.levels.length;
        var completed = (G.completedResearch && G.completedResearch[r.id]) || 0;
        researchCompleted += completed;
      }
    });
    if (G.activeResearch && G.activeResearch.techId) {
      var ar = G.activeResearch;
      var arRoute = routes.find(function(r) { return r.id === ar.techId; });
      if (arRoute) activeResearchName = arRoute.icon + ' ' + arRoute.name + ' Lv.' + (ar.level);
    }
    if (researchTotal > 0 && (researchCompleted > 0 || activeResearchName)) {
      var researchPct = Math.round(researchCompleted / researchTotal * 100);
      researchCardHtml = '<div class="dash-card">' +
        '<div class="dash-label">🔬 研发进度</div>' +
        '<div class="dash-value" style="color:var(--accent-cyan)">' + researchCompleted + '/' + researchTotal + '</div>' +
        '<div class="stat-bar" style="margin-top:4px;"><div class="stat-bar-fill" style="width:' + researchPct + '%;background:var(--accent-cyan)"></div></div>' +
        (activeResearchName ? '<div class="dash-sub">' + activeResearchName + ' 研发中</div>' : '<div class="dash-sub">完成率 ' + researchPct + '%</div>') +
        '</div>';
    }

    el.innerHTML = `
      <div class="dash-card" style="grid-column:span 2;">
        <div class="dash-label">${rankIcon} ${G.rank || '个体户'}  |  ${citySelectHtml}</div>
        <div class="dash-value" style="color:var(--accent-gold);font-size:28px;">${formatMoneyComma(G.money ?? 0)} ${trendHtml}</div>
        <div class="dash-sub">${timeInfo} |  当前总资产</div>
        ${autoStatusHtml}
        ${chartHtml}
      </div>
      <div class="dash-card">
        <div class="dash-label">Tick收益</div>
        <div class="dash-value" style="color:var(--green-down)">+${formatMoneyComma(income)}</div>
        <div class="dash-sub">每${(tickMs/1000).toFixed(0)}秒</div>
      </div>
      <div class="dash-card">
        <div class="dash-label">工资支出</div>
        <div class="dash-value" style="color:var(--red-up)">-${formatMoneyComma(expense)}</div>
        <div class="dash-sub">每Tick</div>
      </div>
      <div class="dash-card">
        <div class="dash-label">维护成本</div>
        <div class="dash-value" style="color:var(--red-up);font-size:18px;">-${formatMoneyComma(maintenanceCost)}</div>
        <div class="dash-sub">每Tick</div>
      </div>
      <div class="dash-card">
        <div class="dash-label">员工数</div>
        <div class="dash-value" style="color:var(--accent-blue)">${(G.employees || []).length}</div>
        <div class="dash-sub">上限 ${SGame.getEmpMax()}</div>
      </div>
      <div class="dash-card">
        <div class="dash-label">业务数</div>
        <div class="dash-value" style="color:var(--accent-cyan)">${Object.values(G.businesses || {}).filter(b => b.level > 0).length}</div>
        <div class="dash-sub">已开业</div>
      </div>
      ${stockCardHtml}
      ${researchCardHtml}
      <div class="dash-card">
        <div class="dash-label">声望</div>
        <div class="dash-value" style="color:var(--accent-gold)">${G.reputation ?? 0}</div>
        <div class="dash-sub">/100</div>
      </div>
      <div class="dash-card">
        <div class="dash-label">人脉</div>
        <div class="dash-value" style="color:var(--accent-cyan)">${G.connections ?? 0}</div>
        <div class="dash-sub">上限 ${(typeof CONFIG !== 'undefined' && CONFIG.MAX_CONNECTIONS) || 100}</div>
      </div>
      <div class="dash-card">
        <div class="dash-label">📊 市场情绪</div>
        <div class="dash-value" style="color:${sentColor}">${sentIcon} ${sentiment}</div>
        <div class="dash-sub">${sentLabel} (LLM分析)</div>
      </div>
      <div class="dash-card">
        <div class="dash-label">💎 资产估值</div>
        <div class="dash-value" style="color:var(--accent-gold)">${formatMoneyComma(assetVal)}</div>
        <div class="dash-sub">${G.assets ? G.assets.length : 0} 件</div>
      </div>
      <div class="dash-card" style="grid-column:span 2;">
        <div class="dash-label">收入构成</div>
        ${breakdownHtml}
      </div>
    `;

    // 追加股票&贷款信息行
    const portfolioVal = typeof SGame.getStockPortfolioValue === 'function' ? SGame.getStockPortfolioValue() : 0;
    if (portfolioVal > 0 || (G.loans && G.loans.length > 0)) {
      const appendEl = document.getElementById('dashboard');
      let extraHtml = '';
      if (portfolioVal > 0) {
        const costBasis = typeof SGame.getStockCostBasis === 'function' ? SGame.getStockCostBasis() : 0;
        const pnl = portfolioVal - costBasis;
        const pnlColor = pnl >= 0 ? 'var(--green-down)' : 'var(--red-up)';
        const pnlSign = pnl >= 0 ? '+' : '';
        extraHtml += '<div style="font-size:11px;color:var(--text-secondary);margin-bottom:2px;">📈 股票市值: <b style="color:var(--accent-gold)">' + formatMoneyComma(portfolioVal) + '</b> | 盈亏: <b style="color:' + pnlColor + '">' + pnlSign + formatMoneyComma(pnl) + '</b></div>';
      }
      if (G.loans && G.loans.length > 0) {
        const totalLoan = G.loans.reduce((s, l) => s + l.amount, 0);
        extraHtml += '<div style="font-size:11px;color:var(--text-secondary);margin-bottom:2px;">🏦 贷款余额: <b style="color:var(--red-up)">' + formatMoneyComma(totalLoan) + '</b> (' + G.loans.length + '笔)</div>';
      }
      el.innerHTML += extraHtml;
    }

    renderManualButton();
  }

  function formatMoneyComma(n) {
    if (n == null || isNaN(n)) return '0';
    const sign = n < 0 ? '-' : '';
    n = Math.abs(n);
    if (n >= 1e16) return sign + (n / 1e16).toFixed(2) + 'e16';
    if (n >= 1e12) return sign + (n / 1e12).toFixed(2) + '万亿';
    if (n >= 1e8) return sign + (n / 1e8).toFixed(1) + '亿';
    if (n >= 1e4) return sign + (n / 1e4).toFixed(1) + '万';
    // Add thousand separators
    const parts = n.toFixed(0).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return sign + parts.join('.');
  }

  function renderAssetTrend(G) {
    const hist = G.assetHistory || [];
    if (hist.length < 5) return '';
    const recent = hist.slice(-5);
    let ups = 0, downs = 0;
    for (let i = 1; i < recent.length; i++) {
      if (recent[i] > recent[i-1]) ups++; else if (recent[i] < recent[i-1]) downs++;
    }
    const arrows = [];
    for (let i = 1; i < recent.length; i++) {
      if (recent[i] > recent[i-1]) arrows.push('<span class="trend-up">▲</span>');
      else if (recent[i] < recent[i-1]) arrows.push('<span class="trend-down">▼</span>');
      else arrows.push('<span style="color:var(--text-muted);font-size:14px">─</span>');
    }
    return '<span class="asset-trend">' + arrows.join('') + '</span>';
  }

  function renderMiniAssetChart(G) {
    const hist = G.assetHistory || [];
    if (hist.length < 2) return '';
    const w = 280, h = 52, pad = 4;
    const vals = hist.slice(-60);
    const min = Math.min(...vals), max = Math.max(...vals);
    if (max === min) return '<div class="mini-chart"><svg><line x1="4" y1="26" x2="276" y2="26" stroke="#3b82f6" stroke-width="1.5"/></svg></div>';
    const points = vals.map((v, i) => {
      const x = pad + (i / Math.max(vals.length - 1, 1)) * (w - pad * 2);
      const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2);
      return x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
    const trendColor = vals[vals.length-1] >= vals[0] ? '#22c55e' : '#ef4444';
    return '<div class="mini-chart"><svg viewBox="0 0 ' + w + ' ' + h + '"><polyline points="' + points + '" fill="none" stroke="' + trendColor + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>';
  }

  function renderIncomeBreakdown() {
    const G = SGame.G;
    const breakdown = [];
    BUSINESS_DEFS.forEach(bDef => {
      const bState = (G.businesses || {})[bDef.id];
      if (!bState || bState.level === 0) return;
      const lv = bDef.levels[bState.level - 1];
      if (!lv) return;
      breakdown.push({ name: bDef.icon + ' ' + bDef.name, income: lv.income, id: bDef.id });
    });
    if (breakdown.length === 0) return '<div style="font-size:10px;color:var(--text-muted);padding:8px 0">暂无开业业务</div>';
    const total = breakdown.reduce((s, b) => s + b.income, 0);
    if (total === 0) return '<div style="font-size:10px;color:var(--text-muted);padding:8px 0">暂无收入</div>';
    const colors = ['#3b82f6', '#06b6d4', '#22c55e', '#a855f7', '#f59e0b', '#ec4899', '#14b8a6'];
    return breakdown.map((b, i) => {
      const pct = ((b.income / total) * 100).toFixed(0);
      return '<div class="income-bar-row">' +
        '<span class="income-bar-label">' + b.name + '</span>' +
        '<div class="income-bar-track"><div class="income-bar-fill" style="width:' + pct + '%;background:' + colors[i % colors.length] + '"></div></div>' +
        '<span class="income-bar-pct">' + pct + '%</span>' +
        '</div>';
    }).join('');
  }

  // ========== 员工列表 ==========
  function renderEmployeeList() {
    const el = document.getElementById('employee-list');
    if (!el) return;
    const G = SGame.G;
    if (!G) { el.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:12px">--</div>'; return; }
    const employees = G.employees || [];

    if (employees.length === 0) {
      el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px">还没有员工，点击上方按钮招聘。</div>';
      return;
    }

    // HR 统管模式：部门面板
    if (typeof SGame.isHRManaged === 'function' && SGame.isHRManaged()) {
      return renderHRManagedPanel(el, G);
    }

    // 普通模式：逐个员工卡片
    let html = '';
    employees.forEach(emp => {
      const roleDef = EMP_ROLES.find(r => r.id === emp.role);
      const roleName = roleDef ? roleDef.name : emp.role;
      const loyaltyColor = emp.loyalty >= 50 ? 'var(--green-down)' : emp.loyalty >= 20 ? 'var(--accent-gold)' : 'var(--red-up)';
      const fatigue = emp.fatigue || 0;
      const skill = emp.skill || 1;
      const fatigueColor = fatigue >= 70 ? 'var(--red-up)' : fatigue >= 40 ? 'var(--accent-gold)' : 'var(--green-down)';
      // 实习生状态展示
      var internBadge = '';
      var internProgress = '';
      if (emp.isIntern && !emp.internConverted) {
        var ticksLeft = Math.max(0, (CONFIG.INTERN_TICKS_TO_CONVERT || 20) - (emp.internTicks || 0));
        var progress = Math.min(100, ((emp.internTicks || 0) / (CONFIG.INTERN_TICKS_TO_CONVERT || 20)) * 100);
        var targetRoleDef = emp.internConvertTarget ? EMP_ROLES.find(function(r) { return r.id === emp.internConvertTarget; }) : null;
        var targetLabel = targetRoleDef ? targetRoleDef.icon + targetRoleDef.name : '待定';
        internBadge = ' <span style="font-size:10px;background:linear-gradient(135deg,var(--accent-cyan),#0891b2);color:#fff;padding:1px 5px;border-radius:3px;vertical-align:middle">实习中</span>';
        internProgress = '<div style="margin-top:2px;font-size:10px;color:var(--accent-cyan)">' +
          '📋 实习进度: <div style="display:inline-block;width:60px;height:5px;background:var(--border);border-radius:3px;vertical-align:middle">' +
          '<div style="width:' + progress + '%;height:100%;background:var(--accent-cyan);border-radius:3px"></div></div>' +
          ' ' + progress.toFixed(0) + '%（剩余' + ticksLeft + 'tick）→ ' + targetLabel + '</div>';
      } else if (emp.internConverted) {
        internBadge = ' <span style="font-size:10px;background:linear-gradient(135deg,var(--green-down),#16a34a);color:#fff;padding:1px 5px;border-radius:3px;vertical-align:middle">✅ 已转正</span>';
      }
      // 工资显示（实习生打折）
      var displaySalary = calcActualSalary(emp.baseSalary || emp.salary, G);
      if (emp.isIntern && !emp.internConverted) {
        displaySalary = SGame.calcInternSalary(emp, displaySalary);
      }
      var salaryNote = (emp.isIntern && !emp.internConverted) ? '万/年<span style="font-size:9px;color:var(--accent-gold)">(实习5折)</span>' : '万/年';
      // 属性展示
      var attrLine = '';
      if (emp.attrs && typeof SGame.EMP_ATTRIBUTES !== 'undefined') {
        attrLine = '<div style="font-size:11px;color:var(--text-secondary);margin-top:2px;">';
        Object.entries(emp.attrs).forEach(function(entry) {
          var key = entry[0], val = entry[1];
          var def = SGame.EMP_ATTRIBUTES[key];
          if (def) {
            var valColor = val >= 70 ? 'var(--green-down)' : val >= 40 ? 'var(--accent-gold)' : 'var(--text-muted)';
            attrLine += def.icon + '<span style="color:' + valColor + ';font-weight:500">' + val + '</span> ';
          }
        });
        attrLine += '</div>';
      }
      html += `<div style="padding:8px 0;border-bottom:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:13px;font-weight:600">${emp.icon} ${emp.name} <span style="font-size:11px;color:var(--text-muted)">${roleName}</span>${internBadge}</div>
            <div style="font-size:11px;color:var(--text-muted)">忠诚: <span style="color:${loyaltyColor}">${emp.loyalty.toFixed(0)}</span> | 工资: ${displaySalary.toFixed(1)}${salaryNote} | 疲劳: <span style="color:${fatigueColor}">${fatigue.toFixed(0)}</span> | 技能: Lv.${skill}</div>
            ${internProgress}
            ${attrLine}
          </div>
          <div style="display:flex;gap:4px;">
            <button class="btn" style="font-size:10px;padding:3px 8px;background:linear-gradient(135deg,var(--accent-cyan),#0891b2);" onclick="UI.trainEmployee(${emp.id})" title="培训提升技能">📚 培训</button>
            <button class="btn" style="font-size:10px;padding:3px 8px;background:linear-gradient(135deg,var(--green-down),#16a34a);" onclick="UI.restEmployee(${emp.id})" title="休息恢复疲劳">😴 休息</button>
            <button class="btn" style="font-size:10px;padding:3px 8px;opacity:0.6" onclick="UI.fireEmployee(${emp.id})">解雇</button>
          </div>
        </div>
      </div>`;
    });
    el.innerHTML = html;
  }

  // ========== HR 统管：部门面板渲染 ==========
  function renderHRManagedPanel(el, G) {
    const depts = SGame.calcDeptStats();
    let html = '<div style="font-size:10px;color:var(--accent-cyan);margin-bottom:8px;font-weight:600">🏢 HR 部门统管模式</div>';
    Object.entries(depts).forEach(([roleId, d]) => {
      const loyalCol = d.avgLoyalty >= 50 ? 'var(--green-down)' : d.avgLoyalty >= 20 ? 'var(--accent-gold)' : 'var(--red-up)';
      const fatigCol = d.avgFatigue >= 70 ? 'var(--red-up)' : d.avgFatigue >= 40 ? 'var(--accent-gold)' : 'var(--green-down)';
      html += `<div style="padding:6px 0;border-bottom:1px solid var(--border);cursor:pointer;" onclick="UI.toggleDeptDetail('${roleId}')">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="flex:1">
            <span style="font-size:12px;font-weight:600">${d.icon} ${d.name}部</span>
            <span style="font-size:10px;color:var(--text-muted);margin-left:4px">${d.count}人</span>
          </div>
          <div style="display:flex;gap:6px;align-items:center">
            <button class="btn" style="font-size:9px;padding:2px 8px;background:linear-gradient(135deg,var(--accent-cyan),#0891b2);" onclick="event.stopPropagation();UI.batchTrainDept('${roleId}')">📚 团训</button>
            <button class="btn" style="font-size:9px;padding:2px 8px;background:linear-gradient(135deg,var(--accent-gold),#f59e0b);" onclick="event.stopPropagation();UI.batchHireDept('${roleId}')">+ 扩招</button>
          </div>
        </div>
        <div style="font-size:9px;color:var(--text-muted);margin-top:2px">
          忠诚: <span style="color:${loyalCol}">${d.avgLoyalty}</span> | 技能: Lv.${d.avgSkill} | 疲劳: <span style="color:${fatigCol}">${d.avgFatigue}</span>
        </div>
        <div id="dept-detail-${roleId}" style="display:none;margin-top:4px;padding-left:12px;border-left:2px solid var(--accent-cyan)"></div>
      </div>`;
    });
    el.innerHTML = html;
  }

  // ========== HR 统管：展开/折叠部门详情 ==========
  function toggleDeptDetail(roleId) {
    const detailEl = document.getElementById('dept-detail-' + roleId);
    if (!detailEl) return;
    if (detailEl.style.display === 'none' || !detailEl.style.display) {
      // 展开：渲染该部门的员工列表
      const G = SGame.G;
      const deptEmps = (G.employees || []).filter(e => e.role === roleId);
      let detHtml = '';
      deptEmps.forEach(emp => {
        const loyalCol = emp.loyalty >= 50 ? 'var(--green-down)' : emp.loyalty >= 20 ? 'var(--accent-gold)' : 'var(--red-up)';
        const fatCol = (emp.fatigue || 0) >= 70 ? 'var(--red-up)' : (emp.fatigue || 0) >= 40 ? 'var(--accent-gold)' : 'var(--green-down)';
        // 属性展示
        var attrLine = '';
        if (emp.attrs && typeof SGame.EMP_ATTRIBUTES !== 'undefined') {
          attrLine = '<div style="font-size:10px;color:var(--text-secondary);margin-top:1px;">';
          Object.entries(emp.attrs).forEach(function(entry) {
            var key = entry[0], val = entry[1];
            var def = SGame.EMP_ATTRIBUTES[key];
            if (def) {
              var vc = val >= 70 ? 'var(--green-down)' : val >= 40 ? 'var(--accent-gold)' : 'var(--text-muted)';
              attrLine += def.icon + '<span style="color:' + vc + ';font-weight:500">' + val + '</span> ';
            }
          });
          attrLine += '</div>';
        }
        detHtml += `<div style="padding:4px 0;font-size:11px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <span>${emp.icon} ${emp.name} Lv.${emp.skill||1} <span style="color:${loyalCol}">❤${emp.loyalty.toFixed(0)}</span> <span style="color:${fatCol}">😫${(emp.fatigue||0).toFixed(0)}</span>${emp.isIntern && !emp.internConverted ? ' <span style="font-size:9px;color:var(--accent-cyan)">📋实习' + (emp.internTicks||0) + '/' + (CONFIG.INTERN_TICKS_TO_CONVERT||20) + '</span>' : ''}${emp.internConverted ? ' <span style="font-size:9px;color:var(--green-down)">✅转正</span>' : ''}</span>
            ${attrLine}
          </div>
          <button class="btn" style="font-size:9px;padding:1px 4px;opacity:0.4" onclick="UI.fireEmployee(${emp.id})">×</button>
        </div>`;
      });
      detailEl.style.display = 'block';
      detailEl.innerHTML = detHtml;
    } else {
      detailEl.style.display = 'none';
    }
  }

  // ========== 员工培训和休息 (功能5) ==========
  function trainEmployee(empId) {
    if (typeof SGame.trainEmployee === 'function') {
      const result = SGame.trainEmployee(empId);
      if (result.ok) {
        showToast('📚', '培训成功', result.msg);
      } else {
        EventSystem.addLog(result.msg);
      }
    }
    renderAll();
  }

  function restEmployee(empId) {
    if (typeof SGame.restEmployee === 'function') {
      const result = SGame.restEmployee(empId);
      if (result.ok) {
        showToast('😴', '休息恢复', result.msg);
      } else {
        EventSystem.addLog(result.msg);
      }
    }
    renderAll();
  }

  function renderHireButton() {
    if (!SGame.G || !SGame.G.employees) return;
    const btn = document.getElementById('btn-hire');
    const count = document.getElementById('emp-count');
    const max = document.getElementById('emp-max');
    if (count) count.textContent = SGame.G.employees.length;
    if (max) max.textContent = SGame.getEmpMax();
    if (btn) {
      const can = SGame.G.employees.length < SGame.getEmpMax();
      btn.disabled = !can;
      const isManaged = typeof SGame.isHRManaged === 'function' && SGame.isHRManaged();
      if (isManaged) {
        btn.textContent = can ? '+ 扩招部门（HR统管）' : `编制已满 (${SGame.G.employees.length}/${SGame.getEmpMax()})`;
        btn.style.background = 'linear-gradient(135deg, var(--accent-cyan), #0891b2)';
      } else {
        btn.textContent = can ? '+ 招聘新员工' : `人手已满 (${SGame.G.employees.length}/${SGame.getEmpMax()})`;
        btn.style.background = '';
      }
    }
  }

  // ========== 招聘模态框 ==========
  let hireCandidates = [];  // 闭包存储，避免HTML注入

  async function openHireModal() {
    const modal = document.getElementById('modal-hire');
    const content = document.getElementById('hire-content');
    modal.classList.add('active');

    // HR 统管模式：显示部门扩招面板
    if (typeof SGame.isHRManaged === 'function' && SGame.isHRManaged()) {
      return renderHRHirePanel(content);
    }

    // 普通模式：生成带属性的候选人
    hireCandidates = [];
    const numCandidates = 3;
    for (let i = 0; i < numCandidates; i++) {
      const role = EMP_ROLES[Math.floor(Math.random() * EMP_ROLES.length)];
      // 使用属性系统生成候选人
      const emp = SGame.generateEmployeeWithAttributes(role, SGame.G);
      hireCandidates.push({
        name: emp.name,
        role: role.id,
        roleName: role.name,
        roleIcon: role.icon,
        baseSalary: role.baseSalary,
        loyalty: emp.loyalty,
        attrs: emp.attrs,
        bg: '正在生成背景故事...',
      });
    }

    renderHireCards(content);

    // 异步调用LLM生成员工背景和属性评价
    hireCandidates.forEach(async (c, i) => {
      if (typeof LLM !== 'undefined') {
        // 生成背景
        const bg = await LLM.generateEmployeeBackground(c);
        c.bg = bg || `${c.roleName}，具备丰富的行业经验。`;
        const bgEl = document.getElementById(`hire-bg-${i}`);
        if (bgEl) bgEl.textContent = c.bg;
        // LLM生成属性评价（新增）
        if (LLM.available && c.attrs) {
          const attrSummary = Object.entries(c.attrs).map(([k, v]) => {
            const def = SGame.EMP_ATTRIBUTES[k];
            return def ? def.name + v : k + v;
          }).join('、');
          const prompt = '你是一个HR分析师。请用15字以内评价这位候选人的综合素质：' +
            c.roleName + '，属性：' + attrSummary + '。一句话简洁评价，不用标点。';
          const eval_result = await LLM.generate(prompt, 0.7);
          if (eval_result) {
            const evalEl = document.getElementById(`hire-eval-${i}`);
            if (evalEl) evalEl.textContent = '💬 ' + eval_result;
          }
        }
      }
    });
  }

  // ========== HR 统管：招聘面板 ==========
  function renderHRHirePanel(container) {
    const G = SGame.G;
    const depts = SGame.calcDeptStats();
    let html = '<div style="font-size:13px;font-weight:600;margin-bottom:12px;color:var(--accent-cyan)">🏢 HR 部门扩招</div>';
    html += '<div style="font-size:10px;color:var(--text-muted);margin-bottom:8px">选择部门扩招，HR统管批量录用，成本降低20%</div>';

    EMP_ROLES.forEach(r => {
      const current = depts[r.id] ? depts[r.id].count : 0;
      const target = current + 2;
      const actualSalary = calcActualSalary(r.baseSalary, G);
      const displaySalary = (r.id === 'intern') ? (actualSalary * (CONFIG.INTERN_SALARY_RATIO || 0.5)) : actualSalary;
      const estCost = displaySalary * 10000 * 2 * CONFIG.HR_HIRE_DISCOUNT; // 扩招2人
      const internNote = (r.id === 'intern' && r.internConvertTo) ? '<div style="font-size:9px;color:var(--accent-cyan);margin-top:2px">📋 实习期后可转正为：' + r.internConvertTo.map(function(rid) { var rd = EMP_ROLES.find(function(x) { return x.id === rid; }); return rd ? rd.name : rid; }).join('、') + '</div>' : '';
      html += `<div style="padding:10px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;cursor:pointer;"
        onclick="UI.batchHireDept('${r.id}');UI.closeModal('hire');">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <span style="font-weight:600">${r.icon} ${r.name}部</span>
            <span style="font-size:11px;color:var(--text-muted);margin-left:6px">现有 ${current} 人 → ${target} 人</span>
          </div>
        </div>
        <div style="font-size:10px;color:var(--text-muted);margin-top:4px">
          预估月薪: ${displaySalary.toFixed(1)}万/人${r.id === 'intern' ? '<span style="color:var(--accent-gold)">(实习5折)</span>' : ''} | 招聘成本: ${SGame.formatMoney(estCost)}（HR折扣）
        </div>
        ${internNote}
      </div>`;
    });

    html += '<button class="btn" style="margin-top:8px;width:100%;font-size:11px;background:var(--border)" onclick="UI.closeModal(\'hire\')">关闭</button>';
    container.innerHTML = html;
  }

  function renderHireCards(container) {
    const G = SGame.G;
    // 批量招聘UI (功能4)
    let batchHtml = '<div style="padding:10px;border:1px solid var(--accent-gold);border-radius:8px;margin-bottom:12px;background:rgba(245,158,11,0.05);">';
    batchHtml += '<div style="font-size:12px;font-weight:600;color:var(--accent-gold);margin-bottom:8px;">👥 批量招聘</div>';
    batchHtml += '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">';
    batchHtml += '<select id="batch-role-select" style="background:var(--bg-primary);color:var(--text-primary);border:1px solid var(--border);border-radius:4px;font-size:11px;padding:4px 8px;font-family:var(--font);">';
    EMP_ROLES.forEach(r => {
      var salary = calcActualSalary(r.baseSalary, SGame.G);
      if (r.id === 'intern') salary = salary * (CONFIG.INTERN_SALARY_RATIO || 0.5);
      batchHtml += `<option value="${r.id}">${r.icon} ${r.name} (${salary.toFixed(1)}万/月${r.id === 'intern' ? ' 实习5折' : ''})</option>`;
    });
    batchHtml += '</select>';
    batchHtml += '<select id="batch-count-select" style="background:var(--bg-primary);color:var(--text-primary);border:1px solid var(--border);border-radius:4px;font-size:11px;padding:4px 8px;font-family:var(--font);">';
    [1, 2, 3, 5].forEach(n => {
      batchHtml += `<option value="${n}">${n}人</option>`;
    });
    batchHtml += '</select>';
    batchHtml += '<button class="btn" style="font-size:11px;padding:4px 12px;background:linear-gradient(135deg,var(--accent-gold),#d97706);" onclick="UI.batchHire()">批量录用</button>';
    batchHtml += '</div></div>';

    // 属性条渲染辅助函数
    function attrBar(value, maxVal) {
      const pct = Math.min(100, Math.max(0, (value / maxVal) * 100));
      const color = pct >= 70 ? 'var(--green-down)' : pct >= 40 ? 'var(--accent-gold)' : 'var(--text-muted)';
      return `<div style="width:40px;height:5px;background:var(--border);border-radius:3px;display:inline-block;vertical-align:middle;margin-left:2px;">
        <div style="width:${pct}%;height:100%;background:${color};border-radius:3px;"></div>
      </div>`;
    }

    let cardsHtml = hireCandidates.map((c, i) => {
      var roleDef = EMP_ROLES.find(function(r) { return r.id === c.role; });
      // 属性展示
      var attrsHtml = '';
      if (c.attrs && typeof SGame.EMP_ATTRIBUTES !== 'undefined') {
        attrsHtml = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 10px;margin:6px 0;font-size:11px;">';
        Object.entries(c.attrs).forEach(function(entry) {
          var key = entry[0], val = entry[1];
          var def = SGame.EMP_ATTRIBUTES[key];
          if (def) {
            attrsHtml += '<div style="display:flex;align-items:center;gap:2px;">' +
              '<span>' + def.icon + def.name + '</span>' +
              '<span style="font-weight:600;color:' + (val >= 70 ? 'var(--green-down)' : val >= 40 ? 'var(--accent-gold)' : 'var(--text-muted)') + '">' + val + '</span>' +
              attrBar(val, 100) +
              '</div>';
          }
        });
        attrsHtml += '</div>';
      }
      // 实习生转正提示
      var internNote = '';
      if (c.role === 'intern') {
        var convertRoles = roleDef && roleDef.internConvertTo ? roleDef.internConvertTo : [];
        var convertNames = convertRoles.map(function(rid) {
          var rd = EMP_ROLES.find(function(r) { return r.id === rid; });
          return rd ? rd.name : rid;
        });
        internNote = '<div style="font-size:10px;color:var(--accent-cyan);margin-top:4px;padding:4px 6px;background:rgba(6,182,212,0.08);border-radius:4px">' +
          '📋 实习期 ' + (CONFIG.INTERN_TICKS_TO_CONVERT || 20) + ' tick 后可转正为：' + convertNames.join('、') +
          '<br>💡 实习期工资为正式薪资的50%，转正后属性+10、忠诚+15</div>';
      }
      return `
      <div style="padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between">
          <span style="font-weight:600">${c.roleIcon} ${c.name}</span>
          <span style="font-size:11px;color:var(--text-muted)">${c.roleName}</span>
        </div>
        <div id="hire-bg-${i}" style="font-size:11px;color:var(--text-secondary);margin:4px 0">${c.bg}</div>
        ${attrsHtml}
        <div id="hire-eval-${i}" style="font-size:11px;color:var(--accent-cyan);margin:2px 0;min-height:16px;"></div>
        <div style="display:flex;gap:12px;font-size:12px">
          <span>工资: ${c.role === 'intern' ? (calcActualSalary(c.baseSalary, G) * (CONFIG.INTERN_SALARY_RATIO || 0.5)).toFixed(1) : calcActualSalary(c.baseSalary, G)}万/月${c.role === 'intern' ? '<span style="font-size:9px;color:var(--accent-gold)">(实习5折)</span>' : ''}</span>
          <span>初始忠诚: ${c.loyalty}</span>
        </div>
        ${internNote}
        <button class="btn" style="margin-top:8px;font-size:11px" onclick="UI.hireCandidate(${i})">录用</button>
      </div>
    `;
    }).join('');

    container.innerHTML = batchHtml + cardsHtml;
  }

  // ========== 批量招聘 (功能4) ==========
  function batchHire() {
    const roleSelect = document.getElementById('batch-role-select');
    const countSelect = document.getElementById('batch-count-select');
    if (!roleSelect || !countSelect) return;
    const roleId = roleSelect.value;
    const count = parseInt(countSelect.value, 10);
    if (!roleId || !count) return;
    if (typeof SGame.batchHire === 'function') {
      const result = SGame.batchHire(roleId, count);
      if (result.ok) {
        showToast('👥', '批量招聘成功', `已招聘 ${result.hired} 名员工`);
        closeModal('hire');
      } else {
        EventSystem.addLog(result.msg);
      }
    }
    renderAll();
  }

  function closeModal(type) {
    const el = document.getElementById(`modal-${type}`);
    if (el) el.classList.remove('active');
  }

  function hireEmployee(name, roleId, salary, loyalty) {
    const G = SGame.G;
    if (G.employees.length >= SGame.getEmpMax()) {
      showToast('⚠️', '招聘失败', `员工已达上限 (${G.employees.length}/${SGame.getEmpMax()})`);
      return;
    }
    const roleDef = EMP_ROLES.find(r => r.id === roleId);
    // 使用 generateEmployeeWithAttributes 统一生成
    var emp = SGame.generateEmployeeWithAttributes(roleDef || { id: roleId, baseSalary: salary, icon: '👤' }, G);
    emp.name = name;
    emp.loyalty = loyalty;
    emp.baseSalary = salary;
    G.employees.push(emp);
    EventSystem.addLog(`新员工入职：${name}（${(roleDef || {}).name || roleId}）`);
    closeModal('hire');
    renderAll();
  }

  // ========== 从闭包数组录用候选人（给HTML onclick用） ==========
  function hireCandidate(idx) {
    const c = hireCandidates[idx];
    if (!c) return;
    const G = SGame.G;
    if (G.employees.length >= SGame.getEmpMax()) {
      showToast('⚠️', '招聘失败', `员工已达上限 (${G.employees.length}/${SGame.getEmpMax()})`);
      closeModal('hire');
      return;
    }
    const roleDef = EMP_ROLES.find(r => r.id === c.role);
    // 使用 generateEmployeeWithAttributes 统一生成，保证实习生字段完整
    // 但复用已有的名字、属性、忠诚度
    G.empIdCounter++;
    var emp = {
      id: G.empIdCounter,
      name: c.name,
      role: c.role,
      baseSalary: parseFloat(c.baseSalary),
      loyalty: parseFloat(c.loyalty),
      happiness: 50,
      icon: roleDef ? roleDef.icon : '👤',
      fatigue: 0,
      skill: (c.attrs && c.attrs.ability > 70) ? 2 : 1,
      attrs: c.attrs || null,
    };
    // 实习生专属字段
    if (c.role === 'intern') {
      emp.isIntern = true;
      emp.internTicks = 0;
      emp.internConverted = false;
      // 根据属性倾向确定转正方向
      var convertCandidates = roleDef && roleDef.internConvertTo ? roleDef.internConvertTo : ['developer', 'sales', 'analyst'];
      var bestRole = null;
      var bestScore = -1;
      convertCandidates.forEach(function(rid) {
        var weights = SGame.EMP_ROLE_ATTR_WEIGHTS[rid];
        if (!weights) return;
        var score = 0;
        Object.keys(weights).forEach(function(attrKey) {
          score += ((c.attrs && c.attrs[attrKey]) || 0) * weights[attrKey];
        });
        if (score > bestScore) { bestScore = score; bestRole = rid; }
      });
      emp.internConvertTarget = bestRole || convertCandidates[Math.floor(Math.random() * convertCandidates.length)];
    }
    G.employees.push(emp);
    EventSystem.addLog(`新员工入职：${c.name}（${c.roleName}）`);
    closeModal('hire');
    renderAll();
  }

  function fireEmployee(id) {
    const G = SGame.G;
    if (!G || !G.employees) return;
    const idx = G.employees.findIndex(e => e.id === id);
    if (idx < 0) return;
    const emp = G.employees[idx];
    // 赔偿（按实际工资计算；实习生按实习工资）
    const actualSalary = calcActualSalary(emp.baseSalary || emp.salary, G);
    const effectiveSalary = SGame.calcInternSalary(emp, actualSalary);
    const comp = effectiveSalary * 3;
    G.money -= comp * 10000;
    G.employees.splice(idx, 1);
    EventSystem.addLog(`解雇了${emp.name}，支付赔偿${comp.toFixed(1)}万。`);
    renderAll();
  }

  // ========== HR 统管：部门批量培训 ==========
  function batchTrainDept(roleId) {
    if (typeof SGame.batchTrainDept !== 'function') return;
    const result = SGame.batchTrainDept(roleId);
    if (result.ok) {
      showToast('📚', '部门培训', result.msg);
    } else {
      EventSystem.addLog(result.msg);
    }
    renderAll();
  }

  // ========== HR 统管：部门批量招聘 ==========
  function batchHireDept(roleId) {
    if (typeof SGame.batchHireDept !== 'function') return;
    const depts = SGame.calcDeptStats();
    const cur = depts[roleId] ? depts[roleId].count : 0;
    const target = cur + 2;
    const result = SGame.batchHireDept(roleId, target);
    if (result.ok) {
      showToast('🏢', '部门扩招', result.msg);
    } else {
      EventSystem.addLog(result.msg);
    }
    renderAll();
  }

  // ========== NPC面板 ==========
  function renderNPCPanel(optEl) {
    const el = optEl || document.getElementById('npc-panel');
    if (!el) return;
    const G = SGame.G;
    if (!G) { el.innerHTML = '<div style="font-size:11px;color:var(--text-muted);padding:8px 0">--</div>'; return; }
    const npcTriggers = G.npcTriggers || {};
    const act = G.act ?? 1;

    let html = '';
    Object.values(NPCS).forEach(npc => {
      if (npc.actUnlock >= act && !(npcTriggers[npc.id] || []).some(t => t.startsWith('act_'))) {
        // 幕次未解锁
        html += `<div class="stat-row" style="opacity:0.4;font-size:11px"><span class="stat-label">🔒 ${npc.name}</span><span class="stat-value">${npc.title}</span></div>`;
        return;
      }
      const f = NPCSystem.getFavor(npc.id);
      const fl = NPCSystem.getFavorLabel(npc.id);
      html += `<div class="stat-row" style="font-size:11px;">
        <span class="stat-label" style="cursor:pointer" onclick="NPCSystem.openDialog('${npc.id}','greeting')">${npc.name} <span style="color:var(--text-muted)">${npc.title}</span></span>
        <span style="display:flex;gap:2px;align-items:center;">
          <span class="stat-value" style="font-size:10px;margin-right:4px;">${f} ${fl}</span>
          <button class="btn" style="font-size:9px;padding:1px 4px;border-radius:3px;" onclick="event.stopPropagation();NPCSystem.openDialog('${npc.id}','gift')" title="送礼">🎁</button>
          <button class="btn" style="font-size:9px;padding:1px 4px;border-radius:3px;" onclick="event.stopPropagation();NPCSystem.openDialog('${npc.id}','business')" title="约谈">💬</button>
        </span>
      </div>`;
    });
    el.innerHTML = html;
  }

  // ========== 幕次显示 ==========
  function renderActDisplay() {
    const el = document.getElementById('act-display');
    if (!el) return;
    const G = SGame.G;
    if (!G) { el.innerHTML = '<div style="font-size:11px;color:var(--text-muted)">--</div>'; return; }

    const actNames = ['', '第一幕：创业初期', '第二幕：快速扩张', '第三幕：权力游戏', '第四幕：帝国荣耀', '第五幕：传奇永恒'];
    const act = G.act ?? 1;
    const ms = G.milestone ?? 0;

    // 计算当前总业务等级
    function getTotalBizLevels() {
      let sum = 0;
      if (!G.cities) return 0;
      Object.values(G.cities).forEach(function(city) {
        if (!city.unlocked || !city.businesses) return;
        Object.values(city.businesses).forEach(function(biz) {
          if (biz && biz.level) sum += biz.level;
        });
      });
      return sum;
    }

    let nextMsHtml = '';
    if (typeof MILESTONES !== 'undefined' && ms < MILESTONES.length) {
      const m = MILESTONES[ms];
      const bizSum = getTotalBizLevels();
      const moneyOk = G.money >= m.money;
      const repOk = (G.reputation || 0) >= m.repMin;
      const bizOk = bizSum >= m.bizSumMin;
      const allOk = moneyOk && repOk && bizOk;

      const okCol = allOk ? 'var(--green-down)' : 'var(--text-muted)';
      const okTxt = allOk ? '✅ 全部达成，即将晋升！' : '';
      nextMsHtml = `
        <div style="margin-top:10px;padding:8px 10px;background:rgba(255,215,0,0.05);border-radius:8px;border:1px solid rgba(255,215,0,0.15)">
          <div style="font-size:11px;color:${okCol};margin-bottom:6px;font-weight:600">🎯 下一幕：${m.name}${okTxt ? ' — ' + okTxt : ''}</div>
          <div style="font-size:10px;color:var(--text-secondary);line-height:1.6">
            ${moneyOk ? '✅' : '⏳'} 资产 ≥ ${(m.money/10000).toFixed(0)}万<br>
            ${repOk ? '✅' : '⏳'} 声誉 ≥ ${m.repMin}<br>
            ${bizOk ? '✅' : '⏳'} 业务总等级 ≥ ${m.bizSumMin}（当前 ${bizSum}）
          </div>
        </div>`;
    }

    el.innerHTML = `
      <div style="font-size:16px;font-weight:700;color:var(--accent-gold);margin-bottom:8px">${actNames[act] || `第${act}幕`}</div>
      <div class="stat-row" style="font-size:11px"><span class="stat-label">里程碑</span><span class="stat-value">${ms}/5</span></div>
      <div class="stat-bar"><div class="stat-bar-fill" style="width:${(ms/5)*100}%;background:var(--accent-gold)"></div></div>
      ${nextMsHtml}
      <div style="font-size:10px;color:var(--text-muted);margin-top:8px">累计tick: ${G.tickCount ?? 0}</div>
      <div style="font-size:10px;color:var(--text-muted)">游戏时长: ${Math.floor((G.totalPlayTime ?? 0)/60)}分钟</div>
    `;
  }

  // ========== 热搜 ==========
  function renderHotSearch() {
    const el = document.getElementById('hot-search');
    if (!el) return;
    const G = SGame.G;
    if (!G.hotSearch || G.hotSearch.length === 0) {
      el.innerHTML = '<div style="font-size:11px;color:var(--text-muted)">暂无热搜</div>';
      return;
    }
    // 优先使用 G.news，否则回退到 G.hotSearch
    const newsList = (G.news && G.news.length > 0) ? G.news : G.hotSearch;
    el.innerHTML = '<div style="max-height:340px;overflow-y:auto;">' + newsList.slice(0, 10).map((h, i) => {
      const isPos = h.isPositive !== false;
      const catColor = isPos ? 'var(--green-down)' : 'var(--red-up)';
      const catLabel = h.category || '';
      return `<div class="hot-item" style="cursor:pointer" onclick="UI.showNewsDetail('${h.id || ''}')" title="${h.text}">
        <span class="hot-rank ${i < 3 ? 'top3' : ''}">${i + 1}</span>
        <span style="font-size:11px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${h.text}</span>
        ${catLabel ? `<span style="font-size:9px;color:${catColor};margin:0 4px;flex-shrink:0;">${catLabel}</span>` : ''}
        <span style="font-size:10px;color:var(--text-muted);flex-shrink:0;">${(h.heat || 0).toLocaleString()}</span>
      </div>`;
    }).join('') + '</div>';
  }

  // ========== 事件日志 ==========
  var eventLogSearch = '';
  function renderEventLog() {
    const el = document.getElementById('event-log');
    if (!el) return;
    const G = SGame.G;
    if (!G.eventLog || G.eventLog.length === 0) {
      el.innerHTML = '<div style="font-size:11px;color:var(--text-muted);padding:8px 0">暂无日志</div>';
      return;
    }

    // #19 搜索过滤
    var searchTerm = eventLogSearch || '';
    var logs = G.eventLog.slice(0, 50);
    if (searchTerm) {
      var lower = searchTerm.toLowerCase();
      logs = logs.filter(function(log) { return log.text.toLowerCase().indexOf(lower) !== -1; });
    }
    var resultCount = logs.length;

    var html = '<div style="margin-bottom:8px;display:flex;align-items:center;gap:8px;">' +
      '<input type="text" id="event-log-search" placeholder="搜索日志..." value="' + escapeHtml(searchTerm) + '" ' +
      'style="flex:1;font-size:11px;padding:4px 8px;background:var(--bg-primary);border:1px solid var(--border);border-radius:4px;color:var(--text-primary);outline:none;" ' +
      'oninput="UI._eventLogSearch(this.value)" />' +
      (searchTerm ? '<button style="font-size:10px;padding:2px 6px;background:transparent;border:1px solid var(--border);border-radius:3px;color:var(--text-muted);cursor:pointer;" onclick="UI._clearEventLogSearch()">✕</button>' : '') +
      '</div>';

    if (resultCount === 0) {
      html += '<div style="font-size:11px;color:var(--text-muted);padding:8px 0">没有匹配的日志</div>';
    } else {
      if (searchTerm) {
        html += '<div style="font-size:10px;color:var(--text-muted);margin-bottom:4px;">找到 ' + resultCount + ' 条匹配</div>';
      }
      html += logs.map(function(log) {
        var text = log.text;
        if (searchTerm) {
          text = highlightText(text, searchTerm);
        }
        return '<div class="log-entry">' +
          '<span class="log-time">[' + log.time + ']</span>' +
          '<span class="log-text">' + text + '</span>' +
          '</div>';
      }).join('');
    }

    el.innerHTML = html;
  }

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function highlightText(text, query) {
    if (!query) return escapeHtml(text);
    var escaped = escapeHtml(text);
    var escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var regex = new RegExp('(' + escapedQuery + ')', 'gi');
    return escaped.replace(regex, '<mark style="background:rgba(245,158,11,0.3);color:var(--accent-gold);padding:0 1px;border-radius:1px;">$1</mark>');
  }

  // ========== 成就面板 ==========
  function openAchievementPanel() {
    const modal = document.getElementById('modal-achievements');
    const content = document.getElementById('achievements-content');
    if (!modal || !content) return;
    const G = SGame.G;
    if (!G) { content.innerHTML = '<div style="font-size:12px;color:var(--text-muted)">请先开始游戏。</div>'; modal.classList.add('active'); return; }

    const total = ACHIEVEMENTS.length;
    const unlocked = (G.unlockedAchievements || []).length;
    const pct = total > 0 ? Math.round(unlocked / total * 100) : 0;

    let html = `<div style="margin-bottom:12px"><div style="font-size:12px;color:var(--text-secondary)">进度：${unlocked}/${total}（${pct}%）</div><div class="stat-bar" style="margin-top:6px"><div class="stat-bar-fill" style="width:${pct}%;background:var(--accent-gold)"></div></div></div>`;

    ACHIEVEMENTS.forEach(a => {
      const done = (G.unlockedAchievements || []).includes(a.id);
      const read = G.achievementRead && G.achievementRead.includes(a.id);
      html += `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);opacity:${done?1:0.35}">
        <div style="font-size:28px;">${done ? a.icon : '🔒'}</div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:600;color:${done?'var(--text-primary)':'var(--text-muted)'}">${a.name}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${a.desc}</div>
          ${done ? `<div style="font-size:10px;color:var(--accent-gold);margin-top:2px">🏅 ${getAchievementRewardDesc(a.id) || '永久加成已生效'}</div>` : ''}
        </div>
        ${done && !read ? '<div style="width:8px;height:8px;border-radius:50%;background:var(--accent-blue);flex-shrink:0" title="新解锁"></div>' : ''}
      </div>`;
    });

    content.innerHTML = html;
    // 标记所有为已读
    G.achievementRead = G.achievementRead || [];
    (G.unlockedAchievements || []).forEach(id => {
      if (!G.achievementRead.includes(id)) G.achievementRead.push(id);
    });
    modal.classList.add('active');
  }

  // ========== 成就面板（中心区标签页版） ==========
  function renderAchievementPanel(panel) {
    if (!panel) return;
    const G = SGame.G;
    if (!G) { panel.innerHTML = '<div style="padding:20px;color:var(--text-muted)">请先开始游戏。</div>'; return; }
    
    const total = ACHIEVEMENTS.length;
    const unlocked = (G.unlockedAchievements || []).length;
    const pct = total > 0 ? Math.round(unlocked / total * 100) : 0;
    const achRewards = typeof calcAchievementRewards === 'function' ? calcAchievementRewards() : {};
    
    let html = '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">';
    html += '<button onclick="UI.switchPanel(\'dashboard\')" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:#fff;padding:6px 14px;font-size:13px;cursor:pointer;font-family:var(--font);">← 返回</button>';
    html += '<div style="font-size:16px;font-weight:700;color:var(--accent-gold)">🏆 成就殿堂</div>';
    html += '</div>';
    
    html += `<div style="margin-bottom:12px"><div style="font-size:12px;color:var(--text-secondary)">进度：${unlocked}/${total}（${pct}%）| 累积加成：收入+${((achRewards.incomeMult||0)*100).toFixed(0)}%</div><div class="stat-bar" style="margin-top:6px"><div class="stat-bar-fill" style="width:${pct}%;background:var(--accent-gold)"></div></div></div>`;
    
    ACHIEVEMENTS.forEach(a => {
      const done = (G.unlockedAchievements || []).includes(a.id);
      html += `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);opacity:${done?1:0.35}">
        <div style="font-size:24px;">${done ? a.icon : '🔒'}</div>
        <div style="flex:1">
          <div style="font-size:12px;font-weight:600;color:${done?'var(--text-primary)':'var(--text-muted)'}">${a.name}</div>
          <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${a.desc}</div>
          ${done ? `<div style="font-size:9px;color:var(--accent-gold);margin-top:1px">🏅 ${getAchievementRewardDesc(a.id) || '永久加成'}</div>` : ''}
        </div>
      </div>`;
    });
    panel.innerHTML = html;
  }

  // ========== 成就弹窗 ==========
  function showAchievement(icon, name) {
    // 原有顶部横幅
    const achIcon = document.getElementById('ach-icon');
    const achName = document.getElementById('ach-name');
    const banner = document.getElementById('achievement-banner');
    if (!achIcon || !achName || !banner) return; // DOM 未就绪
    achIcon.textContent = icon;
    achName.textContent = name;
    banner.classList.add('show');
    if (achievementTimer) clearTimeout(achievementTimer);
    achievementTimer = setTimeout(() => { banner.classList.remove('show'); }, 4000);
    // 新增右上角Toast通知
    showToast(icon, name, '成就解锁！');
  }

  function showToast(icon, title, desc, duration) {
    if (!notificationsEnabled) return;
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast-notify';
    toast.innerHTML = '<div style="display:flex;align-items:center"><span class="toast-icon">' + (icon || '') + '</span><div><div class="toast-name">' + (title || '') + '</div><div class="toast-desc">' + (desc || '') + '</div></div></div>';
    container.appendChild(toast);
    // 默认3.2秒后自动移除
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, (typeof duration === 'number' ? duration : 3200));
    // 限制最多5个
    const toasts = container.querySelectorAll('.toast-notify');
    if (toasts.length > 5) toasts[0].remove();
  }

  function showMilestone(text) {
    const overlay = document.getElementById('milestone-overlay');
    if (!overlay) return;
    overlay.textContent = text;
    overlay.className = 'show';
    setTimeout(() => { overlay.className = ''; }, 2600);
  }

  // ========== 时钟 ==========
  function renderClock() {
    const el = document.getElementById('game-clock');
    if (!el) return;
    const date = new Date();
    el.textContent = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  // ========== 设置面板 ==========
  function openSettings() {
    if (typeof Settings !== 'undefined') {
      Settings.renderSettings();
    }
    document.getElementById('modal-settings').classList.add('active');
  }

  // ========== #16 城市总览面板 ==========
  function showCityOverview() {
    var G = SGame.G;
    if (!G) return;
    var cityIds = Object.keys(CITIES);
    var html = '<div style="max-height:60vh;overflow-y:auto;">';
    cityIds.forEach(function(cid) {
      var city = CITIES[cid];
      var state = G.cities && G.cities[cid];
      var unlocked = state && state.unlocked;
      var isCurrent = G.currentCityId === cid;
      var regions = city.regionIds ? city.regionIds.map(function(rid) {
        var r = REGIONS[rid];
        var rState = state && state.regions ? state.regions[rid] : null;
        var rUnlocked = rState && rState.unlocked;
        var rPurchased = rState && rState.purchased;
        var icon = rPurchased ? '✅' : (rUnlocked ? '🔓' : '🔒');
        return '<span style="font-size:10px;color:var(--text-muted);margin-right:6px;">' + icon + ' ' + (r ? r.name : rid) + '</span>';
      }).join('') : '';

      html += '<div style="margin-bottom:12px;padding:10px;background:var(--bg-hover);border-radius:8px;border-left:3px solid ' + (isCurrent ? 'var(--accent-gold)' : (unlocked ? 'var(--green-down)' : 'var(--border)')) + '">';
      html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">';
      html += '<span style="font-size:18px;">' + city.icon + '</span>';
      html += '<span style="font-weight:700;color:' + (unlocked ? 'var(--text-primary)' : 'var(--text-muted)') + '">' + city.name + '</span>';
      if (isCurrent) html += '<span style="font-size:9px;padding:1px 6px;background:rgba(245,158,11,0.15);color:var(--accent-gold);border-radius:4px;">当前</span>';
      if (!unlocked) {
        html += '<span style="font-size:9px;padding:1px 6px;background:rgba(100,100,100,0.15);color:var(--text-muted);border-radius:4px;margin-left:auto;">未解锁</span>';
      } else if (city.isInternational) {
        html += '<span style="font-size:9px;padding:1px 6px;background:rgba(168,85,247,0.15);color:var(--purple);border-radius:4px;margin-left:auto;">🌏 国际</span>';
      }
      html += '</div>';
      html += '<div style="font-size:11px;color:var(--text-secondary);margin-bottom:6px;">' + city.desc + '</div>';
      html += '<div style="font-size:10px;color:var(--accent-gold);margin-bottom:4px;">🏆 ' + (city.cityBonus ? city.cityBonus.desc : '无特殊加成') + '</div>';
      if (unlocked) {
        html += '<div style="margin-top:4px;">' + regions + '</div>';
        html += '<button class="btn" style="font-size:10px;padding:2px 8px;margin-top:6px;" onclick="UI.switchCity(\'' + cid + '\');document.getElementById(\'modal-city-overview\').classList.remove(\'active\');">切换至此城市</button>';
      } else {
        html += '<div style="font-size:10px;color:var(--text-muted);margin-top:4px;">' +
          '💰 需要 ¥' + (city.unlockMoney || 0).toLocaleString() +
          (city.minAct ? ' | 幕次 ≥ ' + city.minAct : '') +
          '</div>';
      }
      html += '</div>';
    });
    html += '</div>';
    document.getElementById('city-overview-content').innerHTML = html;
    document.getElementById('modal-city-overview').classList.add('active');
  }

  function closeCityOverview() {
    document.getElementById('modal-city-overview').classList.remove('active');
  }

  // ========== 托管按钮 ==========
  function renderAutoButton() {
    try {
      const input = document.getElementById('auto-toggle-input');
      const status = document.getElementById('auto-toggle-status');
      const G = SGame.G;
      const isAuto = G && G.autoMode && G.autoMode.enabled;
      if (input) input.checked = isAuto;
      if (status) status.textContent = isAuto ? '托管中' : '关闭';
    } catch(e) {
      console.error('[商海浮沉] renderAutoButton error:', e);
    }
  }

  function toggleAutoMode() {
    try {
      // 统一入口：全部委托给 SGame.toggleAutoMode()（core.js 的完整实现）
      if (typeof SGame !== 'undefined' && typeof SGame.toggleAutoMode === 'function') {
        SGame.toggleAutoMode();
      }
      // Toast 反馈
      var isAuto = SGame.G && SGame.G.autoMode && SGame.G.autoMode.enabled;
      if (isAuto) {
        showToast('🤖', '全自动托管已开启', '系统将自动管理运营决策');
      } else {
        showToast('⏸', '托管已关闭', '已恢复手动管理模式');
      }
      renderAll();
    } catch(e) {
      console.error('[商海浮沉] toggleAutoMode error:', e);
      try { renderAutoButton(); } catch(_) {}
    }
  }

  // ========== 手动工作按钮 ==========
  function renderManualButton() {
    const container = document.getElementById('manual-work-area');
    if (!container) return;
    const cdRemain = SGame.getManualWorkCdRemain ? SGame.getManualWorkCdRemain() : 0;
    const onCd = cdRemain > 0;
    container.innerHTML = `
      <button id="btn-manual" class="btn btn-action ${onCd ? 'cooldown' : ''}" 
        ${onCd ? 'disabled' : ''} 
        onclick="UI.doManualWork()"
        style="width:100%;padding:10px;font-size:13px;background:linear-gradient(135deg,var(--accent-gold),#d97706);transition:all 0.3s;">
        ${onCd ? `冷却中 ${cdRemain}s` : '🤝 拉项目 / 谈合作'}
      </button>
    `;
  }

  function doManualWork() {
    if (typeof SGame.manualWork !== 'function') return;
    const result = SGame.manualWork();
    if (result.success) {
      const btn = document.getElementById('btn-manual');
      if (btn) {
        btn.classList.add('cooldown');
        btn.disabled = true;
        btn.textContent = '冷却中...';
      }
      EventSystem.addLog(result.msg);
    } else if (result.msg) {
      EventSystem.addLog(result.msg);
    }
    renderAll();
    // 周期性更新冷却倒计时
    startCdTimer();
  }

  let cdTimer = null;
  function startCdTimer() {
    if (cdTimer) clearInterval(cdTimer);
    cdTimer = setInterval(() => {
      const remain = SGame.getManualWorkCdRemain ? SGame.getManualWorkCdRemain() : 0;
      const btn = document.getElementById('btn-manual');
      if (!btn) { clearInterval(cdTimer); cdTimer = null; return; }
      if (remain <= 0) {
        btn.classList.remove('cooldown');
        btn.disabled = false;
        btn.textContent = '🤝 拉项目 / 谈合作';
        clearInterval(cdTimer);
        cdTimer = null;
      } else {
        btn.textContent = `冷却中 ${remain}s`;
      }
    }, 1000);
  }

  // ========== 技能树 ==========
  function openSkillTree() {
    const modal = document.getElementById('modal-skills');
    const content = document.getElementById('skills-content');
    if (!modal || !content) return;
    renderSkillTreeContent(content);
    modal.classList.add('active');
  }

  function renderSkillTreeContent(container) {
    const G = SGame.G;
    if (!G) return;
    const achRewards = typeof calcAchievementRewards === 'function' ? calcAchievementRewards() : {};
    const costReduction = achRewards.skillCostReduce || 0;
    
    let html = `<div style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:13px;color:var(--accent-gold);">可用技能点: <b>${G.statPoints || 0}</b></span>
      <span style="font-size:11px;color:var(--text-muted);">已解锁: ${(G.unlockedSkills || []).length}/20</span>
      ${costReduction > 0 ? `<span style="font-size:10px;color:var(--accent-gold);">🏅 成就减免: -${costReduction}点</span>` : ''}
    </div>`;

    const catNames = { management:'管理', tech:'技术', social:'社交', finance:'金融' };
    Object.entries(SKILL_TREES).forEach(([cat, skills]) => {
      html += `<div style="margin-bottom:14px;">
        <div style="font-size:13px;font-weight:600;color:var(--accent-cyan);margin-bottom:8px;border-bottom:1px solid var(--border);padding-bottom:4px;">${catNames[cat] || cat}</div>`;
      skills.forEach(sk => {
        const unlocked = (G.unlockedSkills || []).includes(sk.id);
        const skillCost = (sk.cost || 1);
        const effectiveCost = Math.max(1, skillCost - costReduction);
        const exclusive = getSkillExclusive(sk.id);
        const isBlocked = exclusive && exclusive.lockedBy;
        const canUnlock = !unlocked && !isBlocked && (G.statPoints || 0) >= effectiveCost;
        
        html += `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);opacity:${unlocked ? 0.6 : (isBlocked ? 0.4 : 1)};position:relative;${sk.exclusive ? 'border-left:3px solid var(--accent-gold);padding-left:7px;' : ''}">
          <div style="flex:1;">
            <div style="font-size:12px;font-weight:600;${unlocked?'color:var(--accent-gold);':(isBlocked?'color:var(--text-muted);':'')}">${sk.name} ${unlocked?'✓':''} ${sk.exclusive ? '<span style="font-size:9px;color:var(--accent-gold);background:rgba(245,158,11,0.12);padding:1px 5px;border-radius:3px;">⚡互斥</span>' : ''}</div>
            <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">${sk.desc}</div>
            ${isBlocked ? `<div style="font-size:9px;color:var(--red-up);margin-top:2px;">🚫 已被「${SKILL_TREES[sk.exclusive].find(s=>s.id===exclusive.lockedBy)?.name||exclusive.lockedBy}」锁定</div>` : ''}
          </div>
          ${canUnlock ? `<button class="btn" style="font-size:10px;padding:3px 8px;" onclick="UI.buySkill('${sk.id}')">升级 (${effectiveCost}点)</button>` : (unlocked ? '<span style="font-size:10px;color:var(--green-down);">已解锁</span>' : (isBlocked ? '<span style="font-size:10px;color:var(--text-muted);">不可用</span>' : `<span style="font-size:10px;color:var(--text-muted);">需${effectiveCost}点</span>`))}
        </div>`;
      });
      html += '</div>';
    });
    container.innerHTML = html;
  }

  function buySkill(skillId) {
    if (typeof SGame.unlockSkill === 'function') {
      const ok = SGame.unlockSkill(skillId);
      if (ok) {
        const content = document.getElementById('skills-content');
        if (content) renderSkillTreeContent(content);
        renderAll();
      }
    }
  }

  // ========== 破产面板 ==========
  function showBankruptcyPanel() {
    const ending = ENDINGS ? ENDINGS['破产清算'] : { title:'破产清算', desc:'资金链断裂，公司进入破产清算。', icon:'💸' };
    const overlay = document.createElement('div');
    overlay.id = 'bankruptcy-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:var(--bg-primary);display:flex;align-items:center;justify-content:center;z-index:9999;text-align:center;padding:40px';
    overlay.innerHTML = `
        <div>
          <div style="font-size:80px;margin-bottom:20px">${ending.icon}</div>
          <h1 style="font-size:32px;margin-bottom:12px;background:linear-gradient(135deg,var(--red-up),var(--accent-gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent">${ending.title}</h1>
          <p style="color:var(--text-secondary);font-size:16px;max-width:400px;line-height:1.8;margin-bottom:24px">${ending.desc}</p>
          <div style="font-size:13px;color:var(--text-muted);margin-bottom:32px">
            最终资产: ${SGame.formatMoney(SGame.G.money)} | 声誉: ${(SGame.G.reputation ?? 0).toFixed(0)} | 游戏时长: ${Math.floor(SGame.G.totalPlayTime/60)}分钟
          </div>
          <button class="btn" style="font-size:16px;padding:12px 40px" onclick="SGame.reset()">重新开始</button>
        </div>
    `;
    document.body.appendChild(overlay);
  }

  // ========== 教程引导 ==========
  function showTutorial() {
    if (!SGame.isFirstGame || !SGame.isFirstGame()) return;
    const overlay = document.getElementById('tutorial-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    renderTutorialStep(0);
  }

  let tutorialStep = 0;
  const tutorialSteps = [
    {
      title: '欢迎来到商海浮沉',
      text: '你是一名怀揣梦想的创业者，来到新海市打拼。初始资金 ' + (typeof SGame !== 'undefined' && SGame.G ? formatMoneyComma(SGame.G.money) : '¥20,000') + '，你的目标是成为商业大亨。',
      highlight: null
    },
    {
      title: '第一步：开业做生意',
      text: '左侧「业务」面板显示可开设的业务类型。点击任意业务旁的「🚀 开业」按钮，用初始资金开启你的第一门生意。\n\n💡 提示：业务会在每个Tick自动产生收益。',
      highlight: '#business-list'
    },
    {
      title: '第二步：雇佣帮手',
      text: '生意做大后需要员工。右侧「员工」面板可以招聘人才。\n\n不同角色有不同加成：经理提升整体效率，销售提升零售收入，开发提升科技产出。\n\n💡 注意：员工需要发工资，请量力而行。',
      highlight: '#employee-list'
    },
    {
      title: '第三步：仪表盘总览',
      text: '顶部仪表盘展示你的核心财务数据：\n• Tick收益：每周期净利润\n• 员工数/业务数：经营规模\n• 声望/人脉：社会影响力\n• 市场情绪：随LLM新闻波动，影响收益\n\n💡 托管模式下AI会帮你自动决策。',
      highlight: '#dashboard'
    },
    {
      title: '第四步：事件与决策',
      text: '游戏会随机触发商业事件。你的每个决策都会影响：\n• 金钱增减\n• 声望变化（高声望解锁更多业务和区域）\n• 员工忠诚度\n• 市场情绪\n\n💡 没有绝对正确的选择，见机行事！',
      highlight: '#event-area'
    },
    {
      title: '更多玩法',
      text: '🎯 解锁新城市区域获取区域加成\n💼 投资收藏品赚取差价\n📈 炒股把握市场时机\n🔬 研发科技树获得全局增益\n\n准备好了吗？点击「开始游戏」进入商海！',
      highlight: null
    }
  ];

  function renderTutorialStep(step) {
    if (step >= tutorialSteps.length) {
      closeTutorial();
      return;
    }
    tutorialStep = step;
    const s = tutorialSteps[step];
    const content = document.getElementById('tutorial-content');
    content.innerHTML = `
      <div style="font-size:18px;font-weight:700;margin-bottom:8px;">${s.title}</div>
      <p style="font-size:13px;color:var(--text-secondary);line-height:1.8;margin-bottom:16px;">${s.text}</p>
      <div style="display:flex;gap:8px;justify-content:space-between;">
        <button class="btn" style="font-size:11px;background:var(--bg-hover);" onclick="UI.skipTutorial()">跳过教程</button>
        <button class="btn" style="font-size:11px;" onclick="UI.nextTutorialStep()">${step === tutorialSteps.length-1 ? '开始游戏' : '下一步 →'}</button>
      </div>
    `;
    // 高亮对应区域
    document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
    if (s.highlight) {
      const target = document.querySelector(s.highlight);
      if (target) target.classList.add('tutorial-highlight');
    }
  }

  function nextTutorialStep() {
    renderTutorialStep(tutorialStep + 1);
  }

  function skipTutorial() {
    closeTutorial();
  }

  function closeTutorial() {
    document.getElementById('tutorial-overlay').style.display = 'none';
    document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
    if (typeof SGame.markTutorialDone === 'function') SGame.markTutorialDone();
  }

  // ========== 统计面板 ==========
  function renderStatPanel(container) {
    if (!container) return;
    const G = SGame.G;
    if (!G) { container.innerHTML = '<div style="font-size:11px;color:var(--text-muted)">请先开始游戏</div>'; return; }

    const section = (title) => `<div class="stat-panel-section">${title}</div>`;
    const row = (label, value, color) => `<div class="stat-panel-row"><span class="stat-panel-label">${label}</span><span class="stat-panel-value"${color ? ' style="color:' + color + '"' : ''}>${value}</span></div>`;

    // === 财务计算 ===
    const totalIncome = G.totalIncome || 0;
    const totalExpense = G.totalExpense || 0;
    const netIncome = totalIncome - totalExpense;
    const curMoney = G.money || 0;
    const perTickIncome = typeof SGame.calcTotalIncome === 'function' ? SGame.calcTotalIncome() : 0;
    const maintenanceCost = typeof SGame.calcMaintenanceCost === 'function' ? SGame.calcMaintenanceCost() : 0;

    // 每Tick工资
    let salaryPerTick = 0;
    if (G.employees) {
      G.employees.forEach(function(emp) {
        var base = emp.baseSalary || emp.salary || 0;
        var actual = typeof calcActualSalary === 'function' ? calcActualSalary(base, G) : base;
        actual = typeof SGame.calcInternSalary === 'function' ? SGame.calcInternSalary(emp, actual) : actual;
        salaryPerTick += actual * 10000;
      });
    }
    const perTickExpense = salaryPerTick + maintenanceCost;

    // 股票市值
    var stockValue = 0;
    try { if (typeof SGame.getStockPortfolioValue === 'function') stockValue = SGame.getStockPortfolioValue(); } catch(e) {}

    // 资产总值
    var assetValue = 0;
    if (G.assets) {
      G.assets.forEach(function(a) { assetValue += a.currentPrice || a.purchasePrice || 0; });
    }

    // 贷款总额
    const loanTotal = (G.loans || []).reduce(function(s, l) { return s + (l.amount || 0); }, 0);

    // 子公司
    var subSummary = { count: 0, totalIncome: 0 };
    try { if (typeof SGame.getSubsidiarySummary === 'function') subSummary = SGame.getSubsidiarySummary(); } catch(e) {}

    // === 运营计算 ===
    var activeBizCount = 0, totalBizLevel = 0;
    if (G.cities) {
      Object.values(G.cities).forEach(function(city) {
        if (!city.unlocked || !city.businesses) return;
        Object.values(city.businesses).forEach(function(b) {
          if (b.level > 0) { activeBizCount++; totalBizLevel += b.level; }
        });
      });
    }
    if (activeBizCount === 0 && G.businesses) {
      Object.values(G.businesses).forEach(function(b) {
        if (b.level > 0) { activeBizCount++; totalBizLevel += b.level; }
      });
    }

    const empCount = G.employees ? G.employees.length : 0;
    const empMax = typeof SGame.getEmpMax === 'function' ? SGame.getEmpMax() : 5;
    const internCount = G.employees ? G.employees.filter(function(e) { return e.isIntern && !e.internConverted; }).length : 0;
    const avgLoyalty = empCount > 0 ? (G.employees.reduce(function(s, e) { return s + (e.loyalty || 0); }, 0) / empCount).toFixed(1) : '0.0';
    const avgHappiness = empCount > 0 ? (G.employees.reduce(function(s, e) { return s + (e.happiness || 0); }, 0) / empCount).toFixed(1) : '0.0';

    // === 玩家状态 ===
    var repLevelMap = { infamous: '臭名昭著', unknown: '无名小卒', rising: '初露锋芒', renowned: '声名远播', legendary: '传奇人物' };
    var stressModeMap = { easy: '轻松', normal: '正常', hard: '紧张', crisis: '危机', collapse: '崩溃' };

    // === 进程 ===
    const unlockedCities = G.cities ? Object.values(G.cities).filter(function(c) { return c.unlocked; }).length : 1;
    const unlockedRegions = (G.unlockedRegions || []).length;
    const researchCompleted = G.techs ? Object.values(G.techs).filter(function(t) { return t.unlocked; }).length : 0;
    const assetCount = G.assets ? G.assets.length : 0;

    // === 最佳记录 ===
    var bestBiz = { name: '无', income: 0 };
    if (typeof SGame.calcBizIncome === 'function') {
      BUSINESS_DEFS.forEach(function(b) {
        var income = SGame.calcBizIncome(b.id, G);
        if (income > bestBiz.income) bestBiz = { name: b.icon + ' ' + b.name, income: income };
      });
    }

    var bestNpc = { name: '无', favor: 0 };
    Object.entries(G.npcFavor || {}).forEach(function(entry) {
      var id = entry[0], favor = entry[1];
      if (favor > bestNpc.favor) {
        var npc = NPCS[id];
        bestNpc = { name: npc ? npc.name : id, favor: favor };
      }
    });

    const playMin = Math.floor((G.totalPlayTime || 0) / 60);
    const playH = Math.floor(playMin / 60);
    const playM = playMin % 60;

    // === 托管统计 ===
    var autoHtml = '';
    var ast = G.autoStats;
    if (ast && ast.totalTicks > 0) {
      var runtimeMin = ast.startedAt ? Math.floor((Date.now() - ast.startedAt) / 60000) : 0;
      var runtimeStr = runtimeMin >= 60 ? Math.floor(runtimeMin / 60) + '时' + (runtimeMin % 60) + '分' : runtimeMin + '分';
      autoHtml = section('托管统计') +
        row('托管运行时长', runtimeStr) +
        row('托管处理Tick', ast.totalTicks || 0) +
        row('自动开业', ast.businessesOpened || 0) +
        row('自动升级', ast.businessesUpgraded || 0) +
        row('自动招聘', ast.employeesHired || 0) +
        row('自动解雇', ast.employeesFired || 0) +
        row('自动决策', ast.decisions || 0) +
        row('自动拉项目', ast.manualWorks || 0);
    }

    // 标题栏
    var html = '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">';
    html += '<button onclick="UI.switchPanel(\'dashboard\')" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:#fff;padding:6px 14px;font-size:13px;cursor:pointer;font-family:var(--font);transition:all 0.2s;" onmouseover="this.style.background=\'rgba(255,255,255,0.18)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.08)\'">← 返回</button>';
    html += '<div style="font-size:16px;font-weight:700;color:var(--accent-gold)">📈 经营统计</div>';
    html += '</div>';

    html += section('财务概览');
    html += row('当前资产', SGame.formatMoney(curMoney), 'var(--accent-gold)');
    html += row('累计总收入', SGame.formatMoney(totalIncome), 'var(--green-down)');
    html += row('累计总支出', SGame.formatMoney(totalExpense), 'var(--red-up)');
    html += row('净收入', SGame.formatMoney(netIncome), netIncome >= 0 ? 'var(--green-down)' : 'var(--red-up)');
    html += row('每Tick收入', SGame.formatMoney(perTickIncome), 'var(--green-down)');
    html += row('每Tick支出', SGame.formatMoney(perTickExpense), 'var(--red-up)');
    html += row('每Tick工资支出', SGame.formatMoney(salaryPerTick), 'var(--red-up)');
    html += row('每Tick维护成本', SGame.formatMoney(maintenanceCost), 'var(--red-up)');
    html += row('股票持仓市值', SGame.formatMoney(stockValue));
    html += row('资产总值', SGame.formatMoney(assetValue));
    html += row('贷款总额', SGame.formatMoney(loanTotal), 'var(--red-up)');
    html += row('子公司累计收益', SGame.formatMoney(subSummary.totalIncome), 'var(--green-down)');

    html += section('运营数据');
    html += row('运营业务数', activeBizCount + ' / ' + BUSINESS_DEFS.length);
    html += row('业务总等级', totalBizLevel);
    html += row('员工总数', empCount + ' / ' + empMax);
    html += row('实习生数', internCount);
    html += row('平均忠诚度', avgLoyalty);
    html += row('平均幸福感', avgHappiness);

    html += section('玩家状态');
    html += row('声望值', (G.reputation || 0).toFixed(1) + ' (' + (repLevelMap[G.repLevel] || G.repLevel || '--') + ')');
    html += row('压力值', (G.stress || 0).toFixed(1) + ' (' + (stressModeMap[G.stressMode] || G.stressMode || '--') + ')');
    html += row('人脉值', G.connections || 0);
    html += row('历史最高压力', (G.stressMax || 0).toFixed(1));
    html += row('高压运行Tick', G.stressHighTickCount || 0);

    html += section('进程统计');
    html += row('总Tick数', G.tickCount || 0);
    html += row('总事件数', G.eventCount || 0);
    html += row('总决策数', G.decisionCount || 0);
    html += row('已解锁城市', unlockedCities);
    html += row('已解锁区域', unlockedRegions);
    html += row('研究完成数', researchCompleted);
    html += row('已购资产数', assetCount);
    html += row('游戏时长', playH + '时' + playM + '分');

    html += section('最佳记录');
    html += row('最赚钱业务', bestBiz.name);
    html += row('关系最好NPC', bestNpc.name + ' (' + bestNpc.favor + ')');
    html += row('已解锁成就', (G.unlockedAchievements || []).length + '/' + ACHIEVEMENTS.length);

    html += autoHtml;

    container.innerHTML = html;
  }

  // ========== 里程碑面板 (功能9) ==========
  function renderMilestonePanel(container) {
    if (!container) return;
    const G = SGame.G;
    if (!G) { container.innerHTML = '<div style="font-size:11px;color:var(--text-muted)">请先开始游戏</div>'; return; }

    // 计算总业务等级
    function getTotalBizLevels() {
      let sum = 0;
      if (!G.cities) return 0;
      Object.values(G.cities).forEach(function(city) {
        if (!city.unlocked || !city.businesses) return;
        Object.values(city.businesses).forEach(function(biz) {
          if (biz && biz.level) sum += biz.level;
        });
      });
      return sum;
    }

    const coreMilestones = typeof MILESTONES !== 'undefined' ? MILESTONES : [];
    const bizSum = getTotalBizLevels();

    const advMilestones = [
      { id: 'ms_1b', name: '十亿资产', desc: '资产突破10亿', icon: '🏆' },
      { id: 'ms_10b', name: '百亿资产', desc: '资产突破100亿', icon: '💎' },
      { id: 'ms_100b', name: '千亿资产', desc: '资产突破1000亿', icon: '🌟' },
      { id: 'ms_1t', name: '万亿资产', desc: '资产突破1万亿', icon: '⭐' },
      { id: 'ms_all_cities', name: '全球版图', desc: '解锁所有城市', icon: '🌏' },
      { id: 'ms_biz_10', name: '满级业务', desc: '任意业务达到10级', icon: '🔥' },
      { id: 'ms_all_biz_10', name: '全能满级', desc: '所有业务达到10级', icon: '👑' },
      { id: 'ms_tech_max', name: '科技全满', desc: '三条研发路线全满', icon: '🔬' },
      { id: 'ms_rank_1', name: '榜首', desc: '竞争对手排名中位列第一', icon: '🥇' },
      { id: 'ms_comeback', name: '东山再起', desc: '破产后资产重返千万', icon: '💪' },
    ];

    const achieved = G.milestonesAchieved || [];
    const advancedTotal = advMilestones.length;
    const advancedAchieved = advMilestones.filter(m => achieved.includes(m.id)).length;

    let html = '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">';
    html += '<button onclick="UI.switchPanel(\'dashboard\')" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:#fff;padding:6px 14px;font-size:13px;cursor:pointer;font-family:var(--font);transition:all 0.2s;" onmouseover="this.style.background=\'rgba(255,255,255,0.18)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.08)\'">← 返回</button>';
    html += '<div style="font-size:16px;font-weight:700;color:var(--accent-gold)">🏅 里程碑</div>';
    html += '</div>';

    // 核心幕次里程碑
    html += '<div style="font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:10px">📋 幕次晋升里程碑（需同时满足三项）</div>';
    coreMilestones.forEach(function(m, i) {
      const done = G.milestone > i;
      const moneyOk = G.money >= m.money;
      const repOk = (G.reputation || 0) >= m.repMin;
      const bizOk = bizSum >= m.bizSumMin;
      const allOk = moneyOk && repOk && bizOk;
      const tierColors = ['var(--text-muted)', '#c0c8d4', 'var(--green-down)', 'var(--accent-blue)', 'var(--purple)', 'var(--accent-gold)'];
      const tierIdx = done ? Math.min(i + 1, tierColors.length - 1) : 0;
      html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);opacity:' + (done ? 1 : 0.5) + '">';
      html += '<div style="font-size:24px;">' + (done ? '🏆' : i + 1) + '</div>';
      html += '<div style="flex:1">';
      html += '<div style="font-size:12px;font-weight:600;color:' + (done ? tierColors[tierIdx] : (allOk ? 'var(--green-down)' : 'var(--text-muted)')) + '">' + (i + 1) + '. ' + m.name + (done ? ' ✓' : '') + '</div>';
      html += '<div style="font-size:10px;color:var(--text-secondary);margin-top:3px;line-height:1.5">';
      html += (done || moneyOk ? '✅' : '⏳') + ' 资产≥' + (m.money / 10000).toFixed(0) + '万 | ';
      html += (done || repOk ? '✅' : '⏳') + ' 声誉≥' + m.repMin + ' | ';
      html += (done || bizOk ? '✅' : '⏳') + ' 业务总等级≥' + m.bizSumMin;
      html += '</div>';
      html += '</div></div>';
    });

    // 进阶成就
    html += '<div style="font-size:13px;font-weight:700;color:var(--text-primary);margin-top:20px;margin-bottom:10px">🌟 进阶成就 (' + advancedAchieved + '/' + advancedTotal + ')</div>';
    html += '<div class="stat-bar" style="margin-bottom:12px;"><div class="stat-bar-fill" style="width:' + (advancedTotal > 0 ? (advancedAchieved / advancedTotal * 100) : 0) + '%;background:var(--accent-gold)"></div></div>';

    advMilestones.forEach(ms => {
      const done = achieved.includes(ms.id);
      const tierColors = ['var(--text-muted)', '#c0c8d4', 'var(--green-down)', 'var(--accent-blue)', 'var(--purple)', 'var(--accent-gold)'];
      const tierIdx = done ? Math.min(achieved.indexOf(ms.id) + 2, tierColors.length - 1) : 0;
      html += '<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);opacity:' + (done ? 1 : 0.35) + '">';
      html += '<div style="font-size:22px;">' + (done ? ms.icon : '🔒') + '</div>';
      html += '<div style="flex:1">';
      html += '<div style="font-size:12px;font-weight:600;color:' + (done ? tierColors[tierIdx] : 'var(--text-muted)') + '">' + ms.name + '</div>';
      html += '<div style="font-size:10px;color:var(--text-muted);margin-top:2px">' + ms.desc + '</div>';
      if (done) html += '<div style="font-size:9px;color:var(--accent-gold);margin-top:2px">✓ 已达成 | +2技能点</div>';
      html += '</div></div>';
    });

    container.innerHTML = html;
  }

  // ========== 存档槽位UI ==========
  function renderSaveSlots(container) {
    if (!container || typeof SGame.getSaveSlots !== 'function') return;
    const slots = SGame.getSaveSlots();
    let html = '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:10px">管理你的3个存档槽位</div>';
    slots.forEach(s => {
      const isActive = SGame.G && SGame.G.saveSlot === s.slot;
      if (s.exists) {
        const date = s.saveTime ? new Date(s.saveTime).toLocaleString('zh-CN') : '未知';
        html += '<div class="save-slot' + (isActive ? ' active' : '') + '">' +
          '<div class="slot-header"><span class="slot-name">存档槽 ' + s.slot + (s.slot === 1 ? ' (自动档)' : '') + '</span>' +
          '<span style="font-size:10px;color:var(--text-muted)">' + date + '</span></div>' +
          '<div class="slot-meta">角色: ' + (s.name || '未知') + ' | 第' + s.act + '幕 | ' + SGame.formatMoney(s.money) + ' | Tick:' + s.tickCount + '</div>' +
          '<div class="slot-actions">' +
          '<button class="btn" style="font-size:10px;padding:3px 8px" onclick="UI.loadSaveSlot(' + s.slot + ')">读取</button>' +
          '<button class="btn" style="font-size:10px;padding:3px 8px;background:var(--bg-hover)" onclick="UI.exportSaveSlot(' + s.slot + ')">导出</button>' +
          '<button class="btn" style="font-size:10px;padding:3px 8px;background:#7f1d1d" onclick="UI.deleteSaveSlot(' + s.slot + ')">删除</button>' +
          '</div></div>';
      } else {
        html += '<div class="save-slot">' +
          '<div class="slot-header"><span class="slot-name">存档槽 ' + s.slot + ' (空)</span></div>' +
          '<div class="slot-meta">暂无存档</div>' +
          '<div class="slot-actions">' +
          (SGame.G ? '<button class="btn" style="font-size:10px;padding:3px 8px" onclick="UI.saveToSlot(' + s.slot + ')">保存到此槽</button>' : '') +
          '<button class="btn" style="font-size:10px;padding:3px 8px;background:var(--bg-hover)" onclick="UI.importToSlot(' + s.slot + ')">导入</button>' +
          '</div></div>';
      }
    });
    html += '<div style="margin-top:8px;font-size:10px;color:var(--text-muted)">提示：自动档每20 Tick自动保存到槽位1；手动存档请使用槽位2或3。</div>';
    container.innerHTML = html;
  }

  function saveToSlot(slot) {
    if (slot === 1 && SGame.G && SGame.G.autoSaveEnabled !== false) {
      if (!confirm('槽位1是自动存档槽，确定要手动覆盖吗？')) return;
    }
    if (typeof SGame.save === 'function') SGame.save(slot);
    if (typeof SGame.addLog === 'function') SGame.addLog('存档已保存（槽位' + slot + '）');
    renderAll();
  }

  function loadSaveSlot(slot) {
    if (typeof SGame.load !== 'function') return;
    if (!confirm('确定要从槽位' + slot + '读取存档吗？当前进度将丢失。')) return;
    const ok = SGame.load(slot);
    if (ok) {
      document.getElementById('origin-screen').style.display = 'none';
      SGame.startTick();
      SGame.startEventCheck();
      renderAll();
    }
  }

  function exportSaveSlot(slot) {
    if (typeof SGame.exportSave !== 'function') return;
    const json = SGame.exportSave(slot);
    if (!json) { alert('该槽位没有存档。'); return; }
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shanghaifc_save_slot_' + slot + '_' + new Date().toISOString().slice(0,10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function deleteSaveSlot(slot) {
    if (!confirm('确定要删除槽位' + slot + '的存档吗？此操作不可撤销。')) return;
    if (typeof SGame.deleteSaveSlot === 'function') SGame.deleteSaveSlot(slot);
    renderAll();
    // 如果在设置面板打开了存档UI，重新渲染
    const container = document.getElementById('save-slots-content');
    if (container) renderSaveSlots(container);
  }

  function importToSlot(slot) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(ev) {
        if (typeof SGame.importSave === 'function') {
          const ok = SGame.importSave(slot, ev.target.result);
          if (ok) {
            alert('存档导入成功！已覆盖槽位' + slot);
            renderAll();
            const c2 = document.getElementById('save-slots-content');
            if (c2) renderSaveSlots(c2);
          } else {
            alert('导入失败：存档格式不正确。');
          }
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  // ========== 时间显示 ==========
  const TIME_ICONS = { dawn: '🌅', day: '☀️', dusk: '🌇', night: '🌙' };

  function getTimeDisplay(G) {
    if (!G) return '';
    const h = G.gameHour ?? 7;
    const timeOfDay = typeof SGame.getTimeOfDay === 'function' ? SGame.getTimeOfDay(h) : 'day';
    const icon = TIME_ICONS[timeOfDay] || '';
    const hourStr = String(h).padStart(2, '0');
    return `${icon} ${hourStr}:00 (第${G.gameDay || 1}天)`;
  }

  // ========== 排行榜面板 ==========
  function renderRankingPanel(container) {
    if (!container) return;
    const G = SGame.G;
    if (!G || typeof SGame.getRivalRank !== 'function') {
      container.innerHTML = '<div style="font-size:11px;color:var(--text-muted)">请先开始游戏</div>';
      return;
    }
    const rankInfo = SGame.getRivalRank();
    let html = '<div style="font-size:16px;font-weight:700;color:var(--accent-gold);margin-bottom:4px;">🏆 商界排行榜</div>';
    html += '<div style="font-size:11px;color:var(--text-muted);margin-bottom:14px;">你的排名: <b style="color:var(--accent-gold);font-size:14px;">第 ' + rankInfo.rank + ' 名</b> / 共 ' + rankInfo.total + ' 位</div>';
    html += '<div style="display:flex;flex-direction:column;gap:6px;">';
    rankInfo.list.forEach((entity, i) => {
      const isPlayer = entity.isPlayer;
      const bg = isPlayer ? 'background:rgba(0,210,255,0.1);border:1px solid var(--accent-blue);' : 'border:1px solid var(--border);';
      const nameColor = isPlayer ? 'var(--accent-cyan)' : 'var(--text-primary)';
      const rankEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
      html += '<div style="padding:10px 14px;border-radius:8px;' + bg + 'display:flex;align-items:center;gap:12px;">' +
        '<span style="font-size:20px;min-width:28px;text-align:center;">' + rankEmoji + '</span>' +
        '<span style="font-weight:600;color:' + nameColor + ';min-width:120px;">' + entity.name + '</span>' +
        '<span style="font-size:11px;color:var(--text-muted);min-width:70px;">' + (entity.boss || '') + '</span>' +
        '<span style="font-size:12px;color:var(--accent-gold);min-width:100px;text-align:right;font-weight:600;">' + formatMoneyComma(entity.money) + '</span>' +
        (entity.style ? '<span style="font-size:10px;color:' + (entity.color || 'var(--text-muted)') + ';padding:2px 8px;border-radius:4px;background:rgba(255,255,255,0.05);">' + entity.style + '</span>' : '') +
      '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  // ========== 新闻详情 ==========
  function showNewsDetail(newsId) {
    const G = SGame.G;
    if (!G) return;
    const allNews = (G.news || []).concat(G.newsHistory || []);
    const item = allNews.find(n => n.id === newsId);
    if (!item) return;
    const isPos = item.isPositive !== false;
    const catColor = isPos ? 'var(--green-down)' : 'var(--red-up)';
    const emoji = isPos ? '📈' : '📉';
    showToast(emoji, `[${item.category}] ${item.text}`, '', 3000);
  }

  // ========== 暂停/继续按钮（原"退休"改为"暂停"） ==========
  function retireGame() {
    if (!SGame.G) return;
    if (typeof SGame.retireGame === 'function') {
      SGame.retireGame();
      // 检查是否暂停
      const isPaused = SGame.G.retireRequested || false;
      const label = isPaused ? '⏸️ 游戏已暂停' : '▶️ 游戏继续';
      showToast(label.split(' ')[0], label.split(' ').slice(1).join(' '), isPaused ? '点击暂停按钮可继续' : '游戏运行中');
      renderAll();
    }
  }

  // ========== 科技研发面板 ==========
  function renderTechPanel(container) {
    if (!container) return;
    const G = SGame.G;
    if (!G) return;

    let html = '<div style="font-size:16px;font-weight:700;color:var(--accent-gold);margin-bottom:12px;">🔬 科技研发</div>' +
      '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:14px;">研发点数 (RPT): <b style="color:var(--accent-cyan)">' + (G.rpt||0) + '</b></div>';

    const routes = [
      { id:'digital', name:'数字化转型', icon:'💻', desc:'每级 +8% 全业务收入' },
      { id:'ai', name:'AI 自动化', icon:'🤖', desc:'每级 -5% 员工工资支出' },
      { id:'blockchain', name:'区块链金融', icon:'🔗', desc:'每级 基金类业务 +12% 收益' },
    ];

    routes.forEach(route => {
      const techDefs = TECH_TREE[route.id];
      if (!techDefs || !techDefs.levels) return;
      const levels = techDefs.levels;
      const completed = G.completedResearch ? (G.completedResearch[route.id] || 0) : 0;
      const active = G.activeResearch && G.activeResearch.techId === route.id ? G.activeResearch : null;

      html += '<div style="margin-bottom:16px;border:1px solid var(--border);border-radius:8px;padding:12px;">' +
        '<div style="font-size:14px;font-weight:600;margin-bottom:4px;">' + route.icon + ' ' + route.name + '</div>' +
        '<div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;">' + route.desc + ' | 进度: ' + completed + '/' + levels.length + '</div>' +
        '<div class="stat-bar" style="margin-bottom:10px;"><div class="stat-bar-fill" style="width:' + (completed/levels.length*100) + '%;background:var(--accent-cyan)"></div></div>';

      levels.forEach((tech, i) => {
        const isComplete = completed > i;
        const isActive = active && active.level === tech.level;
        const canStart = !isComplete && !isActive && completed === i;
        let statusColor = 'var(--text-muted)', statusText = '未解锁';
        if (isComplete) { statusColor = 'var(--green-down)'; statusText = '✓ 已完成'; }
        else if (isActive) { statusColor = 'var(--accent-gold)'; statusText = '研发中... 剩余 ' + active.ticksRemaining + ' Tick'; }
        else if (canStart) { statusColor = 'var(--accent-blue)'; statusText = '可研发'; }

        html += '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);font-size:11px;">' +
          '<span style="font-weight:600;min-width:80px;">Lv.' + (i+1) + ' ' + tech.name + '</span>' +
          '<span style="color:var(--text-muted);flex:1;">' + tech.desc + ' | ' + tech.rptCost + 'RPT + ' + SGame.formatMoney(tech.moneyCost) + '</span>' +
          '<span style="color:' + statusColor + ';min-width:100px;font-size:10px;">' + statusText + '</span>' +
          (canStart ? '<button class="btn" style="font-size:10px;padding:2px 8px;" onclick="SGame.startResearch(\'' + route.id + '\');UI.renderAll();">研发</button>' : '') +
        '</div>';
      });
      html += '</div>';
    });
    container.innerHTML = html;
  }

  // ========== 理财面板（股票+贷款） ==========
  function renderStockPanel(container) {
    if (!container) return;
    const G = SGame.G;
    if (!G) { container.innerHTML = '<div style="font-size:11px;color:var(--text-muted)">请先开始游戏</div>'; return; }

    let html = '<div style="font-size:16px;font-weight:700;color:var(--accent-gold);margin-bottom:12px;">📈 股票投资</div>';

    const portfolioVal = typeof SGame.getStockPortfolioValue === 'function' ? SGame.getStockPortfolioValue() : 0;
    const costBasis = typeof SGame.getStockCostBasis === 'function' ? SGame.getStockCostBasis() : 0;
    const pnl = portfolioVal - costBasis;
    const pnlColor = pnl >= 0 ? 'var(--green-down)' : 'var(--red-up)';
    const pnlSign = pnl >= 0 ? '+' : '';

    html += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;">' +
      '投资组合市值: <b style="color:var(--accent-gold)">' + formatMoneyComma(portfolioVal) + '</b> | ' +
      '成本: ' + formatMoneyComma(costBasis) + ' | ' +
      '盈亏: <b style="color:' + pnlColor + '">' + pnlSign + formatMoneyComma(pnl) + '</b>' +
      '</div>';

    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">';
    Object.entries(STOCKS).forEach(([id, stock]) => {
      const price = G.stockPrices ? (G.stockPrices[id] || stock.basePrice) : stock.basePrice;
      const change = price - stock.basePrice;
      const changePct = (change / stock.basePrice * 100).toFixed(1);
      const color = change >= 0 ? 'var(--green-down)' : 'var(--red-up)';
      const sign = change >= 0 ? '+' : '';
      const holding = G.stocks && G.stocks[id] ? G.stocks[id].shares : 0;

      html += '<div style="padding:10px;border:1px solid var(--border);border-radius:6px;font-size:11px;">' +
        '<div style="font-weight:600;">' + stock.name + ' <span style="font-size:10px;color:var(--text-muted)">' + stock.sector + '</span></div>' +
        '<div style="color:var(--accent-gold);margin:4px 0;">¥' + price.toFixed(2) + ' <span style="color:' + color + ';">' + sign + changePct + '%</span></div>' +
        (holding > 0 ? '<div style="color:var(--text-muted);font-size:10px;">持仓: ' + holding + '股</div>' : '') +
        '<div style="display:flex;gap:4px;margin-top:6px;">' +
        '<button class="btn" style="font-size:10px;padding:2px 8px;" onclick="SGame.buyStock(\'' + id + '\',10);UI.renderAll();">买10</button>' +
        '<button class="btn" style="font-size:10px;padding:2px 8px;" onclick="SGame.buyStock(\'' + id + '\',100);UI.renderAll();">买100</button>' +
        (holding > 0 ? '<button class="btn" style="font-size:10px;padding:2px 8px;background:var(--red-up);" onclick="SGame.sellStock(\'' + id + '\',' + Math.min(holding,10) + ');UI.renderAll();">卖10</button>' : '') +
        '</div></div>';
    });
    html += '</div>';

    // 贷款
    html += '<div style="font-size:16px;font-weight:700;color:var(--accent-gold);margin-bottom:12px;margin-top:20px;border-top:1px solid var(--border);padding-top:16px;">🏦 银行贷款</div>';

    const maxLoan = Math.floor(G.money * 0.5);
    const rep = G.reputation || 0;
    const npcBon = (typeof calcNpcBonus === 'function') ? calcNpcBonus() : {};
    const maxLoanActual = Math.floor(G.money * 0.5 * (1 + (npcBon._loanCapBonus || 0)));
    const rate = Math.max(0.05, 0.15 - (rep / 100) * 0.07 - (npcBon._loanRateBonus || 0));
    const rateDisp = (rate * 100).toFixed(1);

    html += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;">' +
      '可贷额度: <b style="color:var(--accent-gold)">' + formatMoneyComma(maxLoanActual) + '</b> (资产50%' + (npcBon._loanCapBonus ? '+金行长加成' : '') + ') | ' +
      '利率: <b>' + rateDisp + '%</b></div>';

    if (G.loans && G.loans.length > 0) {
      html += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">当前贷款:</div>';
      G.loans.forEach((loan, i) => {
        html += '<div style="padding:8px;border:1px solid var(--border);border-radius:6px;margin-bottom:6px;font-size:11px;display:flex;justify-content:space-between;align-items:center;">' +
          '<span>贷款 ' + formatMoneyComma(loan.amount) + ' | 利率 ' + (loan.interestRate*100).toFixed(1) + '% | 剩余 ' + loan.remaining + ' Tick</span>' +
          '<button class="btn" style="font-size:10px;padding:3px 8px;" onclick="SGame.repayLoan(' + loan.id + ');UI.renderAll();">还款</button>' +
        '</div>';
      });
    }

    const canLoan = G.loans ? G.loans.length < 3 : true;
    if (canLoan && maxLoan > 10000) {
      html += '<div style="font-size:12px;color:var(--text-secondary);margin-top:10px;">申请新贷款:</div>';
      [Math.floor(maxLoan*0.2), Math.floor(maxLoan*0.4), Math.floor(maxLoan*0.6)].forEach(amt => {
        if (amt < 10000) return;
        html += '<button class="btn" style="font-size:10px;padding:4px 10px;margin:4px;" onclick="SGame.applyLoan(' + amt + ',60);UI.renderAll();">贷 ' + formatMoneyComma(amt) + ' (60Tick)</button>';
      });
    } else if (!canLoan) {
      html += '<div style="font-size:11px;color:var(--red-up);margin-top:10px;">已达贷款上限（最多3笔）</div>';
    }

    container.innerHTML = html;
  }

  // ========== 公开API ==========

  // 获取成就奖励描述
  function getAchievementRewardDesc(achId) {
    if (typeof ACHIEVEMENT_REWARDS !== 'undefined' && ACHIEVEMENT_REWARDS[achId]) {
      return ACHIEVEMENT_REWARDS[achId].desc || '';
    }
    return '';
  }
  
  // 获取技能成本
  function getSkillCost(skillId) {
    let cost = 1;
    Object.values(SKILL_TREES).forEach(tree => {
      const found = tree.find(s => s.id === skillId);
      if (found) cost = found.cost || 1;
    });
    const achRewards = (typeof calcAchievementRewards === 'function') ? calcAchievementRewards() : {};
    const reduction = achRewards.skillCostReduce || 0;
    return Math.max(1, cost - reduction);
  }
  
  // 获取技能互斥状态
  function getSkillExclusive(skillId) {
    if (typeof SKILL_EXCLUSIVE === 'undefined') return null;
    for (const [group, ids] of Object.entries(SKILL_EXCLUSIVE)) {
      if (ids.includes(skillId)) {
        const G = SGame.G;
        if (!G) return null;
        const other = ids.find(id => id !== skillId && G.unlockedSkills.includes(id));
        if (other) return { group, lockedBy: other };
        return { group, lockedBy: null };
      }
    }
    return null;
  }

  // ===================================================
  //  资产/拍卖行渲染器
  // ===================================================

  function renderAssetPanel(panel) {
    if (!panel) return;
    var G = SGame.G;
    if (!G) return;
    if (!G.assets) G.assets = [];
    if (!G.assetAuctionList) G.assetAuctionList = [];
    if (!G.assetMarketListings) G.assetMarketListings = [];
    var html = '';

    // 标题栏
    html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap;">';
    html += '<button onclick="UI.switchPanel(\'dashboard\')" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:#fff;padding:6px 14px;font-size:13px;cursor:pointer;font-family:var(--font);">← 返回</button>';
    html += '<div style="font-size:16px;font-weight:700;color:var(--accent-gold);">💎 资产中心</div>';
    var assetCount = (G.assets && G.assets.length) ? G.assets.length : 0;
    html += '<div style="font-size:11px;color:var(--text-secondary);">总估值 ' + (typeof SGame.formatMoney === 'function' ? SGame.formatMoney(SGame.getTotalAssetValue ? SGame.getTotalAssetValue() : 0) : '0') + ' | 持有 ' + assetCount + ' 件</div>';
    html += '</div>';

    // ===== 第一行：市场 + 我的资产 =====
    html += '<div style="display:flex;gap:16px;flex-wrap:wrap;">';

    // 左侧：资产市场
    html += '<div style="flex:1;min-width:320px;">';
    html += '<div style="font-size:13px;font-weight:700;color:var(--accent-cyan);margin-bottom:8px;">📈 资产市场</div>';
    var listings = G.assetMarketListings || [];
    if (listings.length === 0) {
      html += '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:12px;">市场暂无挂牌资产，等待刷新...</div>';
    } else {
      html += '<div style="max-height:360px;overflow-y:auto;">';
      for (var i = 0; i < listings.length; i++) {
        var l = listings[i];
        var typeName = (typeof SGame.getAssetTypeName === 'function') ? SGame.getAssetTypeName(l.type) : l.type;
        var rarityName = (typeof SGame.getRarityLabel === 'function') ? SGame.getRarityLabel(l.rarity) : l.rarity;
        var rarityColor = { common:'var(--text-secondary)', uncommon:'var(--accent-green)', rare:'var(--accent-blue)', epic:'var(--purple)' }[l.rarity] || 'var(--text-secondary)';
        var canBuy = G.money >= l.price && G.assets.length < ((typeof CONFIG !== 'undefined' && CONFIG.ASSET_MAX_SLOTS) || 20);
        html += '<div class="asset-card" style="border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:8px;background:rgba(255,255,255,0.02);">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
        html += '<div>';
        html += '<span style="color:' + rarityColor + ';font-weight:700;font-size:13px;">' + l.name + '</span>';
        html += '<span style="font-size:10px;color:var(--text-muted);margin-left:8px;">' + typeName + '</span>';
        html += '<span style="font-size:10px;color:' + rarityColor + ';margin-left:4px;">[' + rarityName + ']</span>';
        html += '</div>';
        html += '<div style="text-align:right;">';
        html += '<div style="font-size:14px;font-weight:700;color:var(--accent-gold);">' + (typeof SGame.formatMoney === 'function' ? SGame.formatMoney(l.price) : l.price) + '</div>';
        html += '<button onclick="SGame.buyAsset(' + i + ');UI.renderAssetPanel(document.getElementById(\'center-panel\'));" ' +
          (canBuy ? 'class=\'btn\' style=\'font-size:11px;padding:3px 10px;\'' : 'disabled style=\'font-size:11px;padding:3px 10px;opacity:0.3;border:1px solid var(--border);border-radius:6px;background:transparent;color:var(--text-muted);\'') +
          '>' + (canBuy ? '购买' : (G.money < l.price ? '资金不足' : '槽位满')) + '</button>';
        html += '</div>';
        html += '</div>';
        html += '<div style="font-size:10px;color:var(--text-secondary);margin-top:4px;">' + (l.desc || '') + '</div>';
        html += '</div>';
      }
      html += '</div>';
    }
    html += '<div style="font-size:10px;color:var(--text-muted);margin-top:6px;text-align:center;">市场每 ' + ((typeof CONFIG !== 'undefined' && CONFIG.ASSET_REFRESH_TICKS) || 12) + ' Tick 刷新</div>';
    html += '</div>';

    // 右侧：我的资产
    html += '<div style="flex:1;min-width:320px;">';
    html += '<div style="font-size:13px;font-weight:700;color:var(--accent-gold);margin-bottom:8px;">🏠 我的资产 (' + G.assets.length + '/' + ((typeof CONFIG !== 'undefined' && CONFIG.ASSET_MAX_SLOTS) || 20) + ')</div>';
    if (G.assets.length === 0) {
      html += '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:12px;">暂无资产，去市场逛逛吧</div>';
    } else {
      html += '<div style="max-height:360px;overflow-y:auto;">';
      for (var j = 0; j < G.assets.length; j++) {
        var a = G.assets[j];
        var aTypeName = (typeof SGame.getAssetTypeName === 'function') ? SGame.getAssetTypeName(a.type) : a.type;
        var aRarityColor = { common:'var(--text-secondary)', uncommon:'var(--accent-green)', rare:'var(--accent-blue)', epic:'var(--purple)' }[a.rarity] || 'var(--text-secondary)';
        var curVal = a.currentPrice || a.purchasePrice;
        var pnl = curVal - a.purchasePrice;
        var pnlColor = pnl >= 0 ? 'var(--red-up)' : 'var(--green-down)';
        var pnlSign = pnl >= 0 ? '+' : '';
        var inAuction = G.assetAuctionList && G.assetAuctionList.some(function(auc) { return auc.assetId === a.id; });

        html += '<div class="owned-asset-card" style="border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:8px;background:rgba(255,255,255,0.02);' + (inAuction ? 'border-color:var(--accent-cyan);' : '') + '">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
        html += '<div>';
        html += '<span style="color:' + aRarityColor + ';font-weight:700;font-size:13px;">' + a.name + '</span>';
        html += '<span style="font-size:10px;color:var(--text-muted);margin-left:6px;">' + aTypeName + '</span>';
        if (inAuction) html += '<span style="font-size:10px;color:var(--accent-cyan);margin-left:6px;">🔨 拍卖中</span>';
        html += '</div>';
        html += '<div style="text-align:right;">';
        html += '<div style="font-size:14px;font-weight:700;color:var(--accent-gold);">' + (typeof SGame.formatMoney === 'function' ? SGame.formatMoney(curVal) : curVal) + '</div>';
        html += '<div style="font-size:10px;color:' + pnlColor + ';">' + pnlSign + (typeof SGame.formatMoney === 'function' ? SGame.formatMoney(pnl) : pnl) + '</div>';
        html += '</div>';
        html += '</div>';
        html += '<div style="display:flex;gap:6px;margin-top:6px;">';
        if (!inAuction) {
          // 挂牌按钮
          var defaultAsk = Math.round(curVal * 1.05);
          html += '<button onclick="var p=prompt(\'挂牌价（市场价' + (typeof SGame.formatMoney === 'function' ? SGame.formatMoney(curVal) : curVal) + '）:\', ' + defaultAsk + ');if(p){SGame.listAssetForAuction(\'' + a.id + '\',parseInt(p));UI.renderAssetPanel(document.getElementById(\'center-panel\'));}" ' +
            'class=\'btn\' style=\'font-size:11px;padding:3px 10px;\'>🔨 挂牌</button>';
          // 典当按钮
          html += '<button onclick="if(confirm(\'⚠️ 典当将以市场价的38%-55%紧急变现，确认？\')){SGame.pawnAsset(\'' + a.id + '\');UI.renderAssetPanel(document.getElementById(\'center-panel\'));}" ' +
            'class=\'btn\' style=\'font-size:11px;padding:3px 10px;background:rgba(239,68,68,0.15);\'>💸 典当</button>';
        } else {
          // 取消拍卖
          var aucIdx = -1;
          for (var ai = 0; ai < G.assetAuctionList.length; ai++) {
            if (G.assetAuctionList[ai].assetId === a.id) { aucIdx = ai; break; }
          }
          if (aucIdx >= 0) {
            var auc = G.assetAuctionList[aucIdx];
            var remainingTicks = auc.sellTick - G.tickCount;
            html += '<span style="font-size:10px;color:var(--text-secondary);">剩余 ' + remainingTicks + ' Tick</span>';
            html += '<button onclick="SGame.cancelAuction(\'' + auc.assetId + '\');UI.renderAssetPanel(document.getElementById(\'center-panel\'));" ' +
              'class=\'btn\' style=\'font-size:11px;padding:3px 10px;\'>取消拍卖</button>';
          }
        }
        html += '</div>';
        html += '</div>';
      }
      html += '</div>';
    }
    html += '</div>';
    html += '</div>'; // end flex row

    // ===== 拍卖行 =====
    if (G.assetAuctionList && G.assetAuctionList.length > 0) {
      html += '<div style="margin-top:20px;">';
      html += '<div style="font-size:13px;font-weight:700;color:var(--accent-cyan);margin-bottom:8px;">🔨 拍卖行（进行中）</div>';
      html += '<div style="display:flex;gap:10px;flex-wrap:wrap;">';
      for (var ak = 0; ak < G.assetAuctionList.length; ak++) {
        var aucItem = G.assetAuctionList[ak];
        var ast = null;
        for (var ai = 0; ai < G.assets.length; ai++) {
          if (G.assets[ai].id === aucItem.assetId) { ast = G.assets[ai]; break; }
        }
        if (!ast) continue;
        var remaining = aucItem.sellTick - G.tickCount;
        html += '<div style="border:1px solid var(--accent-cyan);border-radius:8px;padding:10px;min-width:180px;background:rgba(6,182,212,0.05);">';
        html += '<div style="font-size:12px;font-weight:700;">' + ast.name + '</div>';
        html += '<div style="font-size:10px;color:var(--text-secondary);">要价：' + (typeof SGame.formatMoney === 'function' ? SGame.formatMoney(aucItem.askPrice) : aucItem.askPrice) + '</div>';
        html += '<div style="font-size:10px;color:' + (remaining <= 0 ? 'var(--green-down)' : 'var(--text-secondary)') + ';">' + (remaining <= 0 ? '即将成交' : '剩余 ' + remaining + ' Tick') + '</div>';
        html += '</div>';
      }
      html += '</div></div>';
    }

    panel.innerHTML = html;
  }

  // ===================================================
  //  LLM 增强渲染器 (#5, #7, #9)
  // ===================================================

  // #9: 市场情绪渲染
  function renderMarketSentiment() {
    // 仪表盘会通过 renderDashboard 整体刷新，因此此处仅做标记
    // 非仪表盘视图时不需要额外渲染
    if (currentPanel === 'dashboard') renderDashboard();
  }

  // #5: 商业新闻渲染（在右侧面板中展示）
  function renderNewsFeed() {
    var logEl = document.getElementById('event-log');
    if (!logEl) return; // 如果不存在独立日志区则合并到事件日志
    var G = SGame.G;
    if (!G || !G.newsFeed || !G.newsFeed.length) return;

    // 在事件日志顶部插入最新一条 LLM 新闻
    var existingNews = logEl.querySelector('.llm-news-entry');
    if (existingNews) existingNews.remove();

    var latest = G.newsFeed[0];
    var newsDiv = document.createElement('div');
    newsDiv.className = 'log-entry llm-news-entry';
    newsDiv.style.cssText = 'border-left: 2px solid var(--accent-cyan); padding-left: 8px; background: rgba(6,182,212,0.05); border-radius: 4px;';
    newsDiv.innerHTML = '<span class="log-time">Tick' + latest.tick + '</span> <span style="font-size:10px;color:var(--accent-cyan)">📰 商业快讯</span><br><span class="log-text">' + latest.text + '</span>';
    if (logEl.firstChild) {
      logEl.insertBefore(newsDiv, logEl.firstChild);
    } else {
      logEl.appendChild(newsDiv);
    }
  }

  // #7: 竞争对手情报渲染（在右侧面板展示）
  function renderRivalReport() {
    var logEl = document.getElementById('event-log');
    if (!logEl) return;
    var G = SGame.G;
    if (!G || !G.rivalReportData || !G.rivalReportData.length) return;

    var existingReport = logEl.querySelector('.llm-rival-entry');
    if (existingReport) existingReport.remove();

    var latest = G.rivalReportData[0];
    var reportDiv = document.createElement('div');
    reportDiv.className = 'log-entry llm-rival-entry';
    reportDiv.style.cssText = 'border-left: 2px solid var(--purple); padding-left: 8px; background: rgba(168,85,247,0.05); border-radius: 4px;';
    reportDiv.innerHTML = '<span class="log-time">Tick' + latest.tick + '</span> <span style="font-size:10px;color:var(--purple)">🔍 竞争情报</span><br><span class="log-text">' + latest.text + '</span>';
    if (logEl.firstChild) {
      logEl.insertBefore(reportDiv, logEl.firstChild);
    } else {
      logEl.appendChild(reportDiv);
    }
  }

  // ========== 亮色/暗色模式切换 ==========
  function toggleTheme() {
    var isLight = document.body.classList.toggle('light-mode');
    localStorage.setItem('shanghaifc-theme', isLight ? 'light' : 'dark');
    var btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = isLight ? '☀️' : '🌙';
  }

  // 初始化主题
  (function initTheme() {
    var saved = localStorage.getItem('shanghaifc-theme');
    if (saved === 'light') {
      document.body.classList.add('light-mode');
      // 延迟设置按钮图标（DOM可能还没就绪）
      setTimeout(function() {
        var btn = document.getElementById('theme-toggle');
        if (btn) btn.textContent = '☀️';
      }, 100);
    }
  })();

  return {
    renderAll,
    renderStats, renderRegions, renderBusinessList,
    renderDashboard, renderEmployeeList, renderNPCPanel,
    renderActDisplay, renderHotSearch, renderEventLog,
    renderHireButton, renderClock,
    renderWorldMap, switchCity, renderCitySelector,
    showAchievement,
    openHireModal, closeModal, hireCandidate, hireEmployee, fireEmployee,
    setBusinessRegion, openBusiness, upgradeBusiness, closeBusiness,
    upgradeBusinessMax,
    openSettings, openAchievementPanel,
    renderManualButton, doManualWork, startCdTimer,
    openSkillTree, buySkill,
    showBankruptcyPanel,
    showCityOverview, closeCityOverview,
    showTutorial, nextTutorialStep, skipTutorial, closeTutorial,
    renderAutoButton, toggleAutoMode,
    showToast, showMilestone, renderStatPanel,
    renderSaveSlots, saveToSlot, loadSaveSlot,
    exportSaveSlot, deleteSaveSlot, importToSlot,
    formatMoneyComma, renderMiniAssetChart, renderIncomeBreakdown,
    switchPanel, openSettings,
    renderRankingPanel, showNewsDetail, retireGame,
    renderTechPanel, renderStockPanel,
    // 事件日志搜索辅助方法 (#19)
    _eventLogSearch: function(val) { eventLogSearch = val; renderEventLog(); },
    _clearEventLogSearch: function() { eventLogSearch = ''; renderEventLog(); },
    // 新增功能
    showOfflineIncomePopup, claimOfflineIncome,
    batchHire,
    trainEmployee, restEmployee,
    // HR 统管
    batchTrainDept, batchHireDept, toggleDeptDetail,
    renderMilestonePanel,
    buildPanelTabs,
    // LLM 增强渲染 (#5, #7, #9)
    renderNewsFeed, renderRivalReport, renderMarketSentiment,
    renderAssetPanel,
    toggleTheme,
  };
})();
