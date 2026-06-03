// ==================================================
// ui.js — 界面渲染：所有面板、按钮、状态
// ==================================================

window.UI = (() => {
  let achievementTimer = null;
  let currentPanel = 'dashboard';
  let notificationsEnabled = true;

  // ========== 面板切换 ==========
  function switchPanel(name) {
    if (!['dashboard', 'region', 'business', 'npc', 'achievement', 'stats', 'worldmap', 'tech', 'stock', 'ranking', 'milestone'].includes(name)) return;
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
      case 'region': renderRegions(); return;
      case 'business': renderBusinessList(); return;
      case 'npc': renderNPCPanel(panel); return;
      case 'achievement': renderAchievementPanel(panel); return;
      case 'stats': renderStatPanel(panel); return;
      case 'worldmap': renderWorldMap(panel); return;
      case 'tech': renderTechPanel(panel); return;
      case 'stock': renderStockPanel(panel); return;
      case 'ranking': renderRankingPanel(panel); return;
      case 'milestone': renderMilestonePanel(panel); return;
    }
  }

  // ========== 世界地图渲染 ==========
  function renderWorldMap(panel) {
    if (!panel) return;
    const G = SGame.G;
    if (!G) return;

    // 国内城市和国际城市分开
    const domestic = ['xinhai', 'jingdu', 'shengang', 'rongcheng', 'hangjiang'];
    const international = ['singapore', 'tokyo', 'newyork', 'london', 'dubai'];

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
    const unlockedCount = Object.values(G.cities).filter(c => c.unlocked).length;
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
    const unlockedCities = Object.entries(G.cities).filter(([_, c]) => c.unlocked);
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
  function renderAll() {
    console.log('[DEBUG-ui] renderAll called, SGame.G exists:', !!SGame.G);
    if (!SGame.G) return;
    if (SGame.G.autoMode) console.log('[DEBUG-ui] autoMode.enabled at renderAll entry:', SGame.G.autoMode.enabled);
    const safeRender = (name, fn) => { try { fn(); } catch(e) { console.error('[商海浮沉] renderAll/' + name + ' error:', e); } };
    safeRender('stats', renderStats);
    safeRender('regions', renderRegions);
    safeRender('businessList', renderBusinessList);
    safeRender('dashboard', renderDashboard);
    safeRender('employeeList', renderEmployeeList);
    safeRender('npcPanel', renderNPCPanel);
    safeRender('actDisplay', renderActDisplay);
    safeRender('hotSearch', renderHotSearch);
    safeRender('eventLog', renderEventLog);
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
  function renderRegions() {
    const el = document.getElementById('regions-panel');
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
  function renderBusinessList() {
    const el = document.getElementById('business-list');
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
        ${lv > 0 ? `<div style="font-size:10px;color:var(--accent-gold);margin-top:2px">收益: ${(def.income).toFixed(1)}万/年</div>` : ''}
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
                const maxTL = Math.max(...Object.values(G.completedResearch || {}));
                if (maxTL < nextDef.reqCond.techLv) { condMet = false; condHint = `需科技Lv${nextDef.reqCond.techLv}`; }
              }
              if (nextDef.reqCond.rep && G.reputation < nextDef.reqCond.rep) { condMet = false; condHint = condHint || `需声誉${nextDef.reqCond.rep}`; }
              if (nextDef.reqCond.npcFavor) {
                for (const [nid, minF] of Object.entries(nextDef.reqCond.npcFavor)) {
                  if ((G.npcFavor[nid] || 0) < minF) { condMet = false; condHint = condHint || `需${(NPCS[nid]||{}).name||nid}好感${minF}`; break; }
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
  }

  function setBusinessRegion(bizId, regionId) {
    SGame.G.businesses[bizId].region = regionId || null;
    renderAll();
  }

  function openBusiness(bizId) {
    const G = SGame.G;
    const bDef = BUSINESS_DEFS.find(b => b.id === bizId);
    if (!bDef) return;
    let state = G.businesses[bizId];
    if (!state) { G.businesses[bizId] = { level: 0, region: null, unlocked: true }; state = G.businesses[bizId]; }
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
    EventSystem.addLog(`${bDef.icon} ${bDef.name} 开业了！`);
    renderAll();
  }

  function upgradeBusiness(bizId) {
    const G = SGame.G;
    const bDef = BUSINESS_DEFS.find(b => b.id === bizId);
    if (!bDef) return;
    const state = G.businesses[bizId];
    const next = bDef.levels[state.level];
    if (!next) return;
    // 前置条件检查（与 upgradeBusinessMax 一致）
    if (next.reqCond) {
      if (next.reqCond.techLv) {
        const maxTechLv = Math.max(...Object.values(G.completedResearch || {}));
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
      const hrEmp = G.employees.find(e => e.role === 'hr');
      if (hrEmp && (hrEmp.loyalty || 0) >= 30) expense = rawExpense * CONFIG.HR_SALARY_DISCOUNT;
    }
    const maintenanceCost = typeof SGame.calcMaintenanceCost === 'function' ? SGame.calcMaintenanceCost() : 0;
    const trendHtml = renderAssetTrend(G);
    const chartHtml = renderMiniAssetChart(G);
    const breakdownHtml = renderIncomeBreakdown();
    const citySelectHtml = renderCitySelector();
    const rankDef = RANK_TIERS ? RANK_TIERS.find(r => r.name === G.rank) : null;
    const rankIcon = rankDef ? rankDef.icon : '';
    const weatherInfo = getWeatherDisplay(G);
    const timeInfo = getTimeDisplay(G);
    const tickMs = (typeof CONFIG !== 'undefined' && CONFIG && CONFIG.TICK_MS) ? CONFIG.TICK_MS : 5000;

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
      autoStatusHtml = '<div class="auto-status" style="font-size:10px;color:var(--text-muted);padding:4px 0 6px;margin-top:2px;display:flex;align-items:center;gap:2px;flex-wrap:wrap;border-top:1px solid rgba(245,158,11,0.15);">' +
        '<span style="color:var(--accent-gold);font-weight:600;margin-right:4px;">🤖 托管</span>' +
        badges.join(' · ') + '</div>';
    }

    el.innerHTML = `
      <div class="dash-card" style="grid-column:span 2;">
        <div class="dash-label">${rankIcon} ${G.rank || '个体户'}  |  ${citySelectHtml}</div>
        <div class="dash-value" style="color:var(--accent-gold);font-size:28px;">${formatMoneyComma(G.money ?? 0)} ${trendHtml}</div>
        <div class="dash-sub">${timeInfo}  ${weatherInfo}  |  当前总资产</div>
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
      <div class="dash-card">
        <div class="dash-label">第 ${G.act ?? '--'} 幕</div>
        <div class="dash-value" style="color:var(--purple)">${G.milestone ?? '--'}</div>
        <div class="dash-sub">已达成里程碑</div>
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
    if (n >= 1e9) return (n / 1e9).toFixed(1) + ' 亿';
    if (n >= 1e4) return (n / 1e4).toFixed(1) + ' 万';
    // Add thousand separators
    const parts = n.toFixed(0).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
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
      const bState = G.businesses[bDef.id];
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
      html += `<div style="padding:8px 0;border-bottom:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:12px;font-weight:600">${emp.icon} ${emp.name} <span style="font-size:10px;color:var(--text-muted)">${roleName}</span></div>
            <div style="font-size:10px;color:var(--text-muted)">忠诚: <span style="color:${loyaltyColor}">${emp.loyalty.toFixed(0)}</span> | 工资: ${calcActualSalary(emp.baseSalary || emp.salary, G)}万/年 | 疲劳: <span style="color:${fatigueColor}">${fatigue.toFixed(0)}</span> | 技能: Lv.${skill}</div>
          </div>
          <div style="display:flex;gap:4px;">
            <button class="btn" style="font-size:9px;padding:2px 6px;background:linear-gradient(135deg,var(--accent-cyan),#0891b2);" onclick="UI.trainEmployee(${emp.id})" title="培训提升技能">📚 培训</button>
            <button class="btn" style="font-size:9px;padding:2px 6px;background:linear-gradient(135deg,var(--green-down),#16a34a);" onclick="UI.restEmployee(${emp.id})" title="休息恢复疲劳">😴 休息</button>
            <button class="btn" style="font-size:9px;padding:2px 6px;opacity:0.6" onclick="UI.fireEmployee(${emp.id})">解雇</button>
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
        detHtml += `<div style="padding:4px 0;font-size:10px;display:flex;justify-content:space-between;align-items:center">
          <span>${emp.icon} ${emp.name} Lv.${emp.skill||1} <span style="color:${loyalCol}">❤${emp.loyalty.toFixed(0)}</span> <span style="color:${fatCol}">😫${(emp.fatigue||0).toFixed(0)}</span></span>
          <button class="btn" style="font-size:8px;padding:1px 4px;opacity:0.4" onclick="UI.fireEmployee(${emp.id})">×</button>
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

    // 普通模式：生成候选人
    hireCandidates = [];
    for (let i = 0; i < 3; i++) {
      const role = EMP_ROLES[Math.floor(Math.random() * EMP_ROLES.length)];
      const firstNames = ['王','李','张','刘','陈','杨','赵','周','吴','徐','孙','马','朱','胡','郭'];
      const lastNames = ['明','华','强','伟','磊','静','敏','婷','杰','浩','洋','雪','云','飞','翔'];
      const name = firstNames[Math.floor(Math.random() * firstNames.length)] + lastNames[Math.floor(Math.random() * lastNames.length)];
      hireCandidates.push({
        name,
        role: role.id,
        roleName: role.name,
        roleIcon: role.icon,
        baseSalary: role.baseSalary,
        loyalty: +(30 + Math.random() * 40).toFixed(0),
        bg: '正在生成背景故事...',
      });
    }

    renderHireCards(content);

    // 异步调用LLM生成员工背景
    hireCandidates.forEach(async (c, i) => {
      if (typeof LLM !== 'undefined') {
        const bg = await LLM.generateEmployeeBackground(c.roleName);
        c.bg = bg || `${c.roleName}，具备丰富的行业经验。`;
        const bgEl = document.getElementById(`hire-bg-${i}`);
        if (bgEl) bgEl.textContent = c.bg;
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
      const estCost = actualSalary * 10000 * 2 * CONFIG.HR_HIRE_DISCOUNT; // 扩招2人
      html += `<div style="padding:10px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;cursor:pointer;"
        onclick="UI.batchHireDept('${r.id}');UI.closeModal('hire');">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <span style="font-weight:600">${r.icon} ${r.name}部</span>
            <span style="font-size:11px;color:var(--text-muted);margin-left:6px">现有 ${current} 人 → ${target} 人</span>
          </div>
        </div>
        <div style="font-size:10px;color:var(--text-muted);margin-top:4px">
          预估月薪: ${actualSalary}万/人 | 招聘成本: ${SGame.formatMoney(estCost)}（HR折扣）
        </div>
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
      batchHtml += `<option value="${r.id}">${r.icon} ${r.name} (${calcActualSalary(r.baseSalary, SGame.G)}万/月)</option>`;
    });
    batchHtml += '</select>';
    batchHtml += '<select id="batch-count-select" style="background:var(--bg-primary);color:var(--text-primary);border:1px solid var(--border);border-radius:4px;font-size:11px;padding:4px 8px;font-family:var(--font);">';
    [1, 2, 3, 5].forEach(n => {
      batchHtml += `<option value="${n}">${n}人</option>`;
    });
    batchHtml += '</select>';
    batchHtml += '<button class="btn" style="font-size:11px;padding:4px 12px;background:linear-gradient(135deg,var(--accent-gold),#d97706);" onclick="UI.batchHire()">批量录用</button>';
    batchHtml += '</div></div>';

    let cardsHtml = hireCandidates.map((c, i) => `
      <div style="padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between">
          <span style="font-weight:600">${c.roleIcon} ${c.name}</span>
          <span style="font-size:11px;color:var(--text-muted)">${c.roleName}</span>
        </div>
        <div id="hire-bg-${i}" style="font-size:11px;color:var(--text-secondary);margin:4px 0">${c.bg}</div>
        <div style="display:flex;gap:12px;font-size:11px">
          <span>工资: ${calcActualSalary(c.baseSalary, G)}万/月</span>
          <span>初始忠诚: ${c.loyalty}</span>
        </div>
        <button class="btn" style="margin-top:8px;font-size:11px" onclick="UI.hireCandidate(${i})">录用</button>
      </div>
    `).join('');

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
    G.empIdCounter++;
    const roleDef = EMP_ROLES.find(r => r.id === roleId);
    G.employees.push({
      id: G.empIdCounter,
      name,
      role: roleId,
      salary,
      loyalty,
      happiness: 50,
      icon: roleDef ? roleDef.icon : '👤',
      fatigue: 0,
      skill: 1,
    });
    EventSystem.addLog(`新员工入职：${name}（${roleDef.name}）`);
    closeModal('hire');
    renderAll();
  }

  // ========== 从闭包数组录用候选人（给HTML onclick用） ==========
  function hireCandidate(idx) {
    const c = hireCandidates[idx];
    if (!c) return;
    const G = SGame.G;
    G.empIdCounter++;
    const roleDef = EMP_ROLES.find(r => r.id === c.role);
    G.employees.push({
      id: G.empIdCounter,
      name: c.name,
      role: c.role,
      baseSalary: parseFloat(c.baseSalary),
      loyalty: parseFloat(c.loyalty),
      happiness: 50,
      icon: roleDef ? roleDef.icon : '👤',
      fatigue: 0,
      skill: 1,
    });
    EventSystem.addLog(`新员工入职：${c.name}（${c.roleName}）`);
    closeModal('hire');
    renderAll();
  }

  function fireEmployee(id) {
    const G = SGame.G;
    const idx = G.employees.findIndex(e => e.id === id);
    if (idx < 0) return;
    const emp = G.employees[idx];
    // 赔偿（按实际工资计算）
    const actualSalary = calcActualSalary(emp.baseSalary || emp.salary, G);
    const comp = actualSalary * 3;
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
  function renderNPCPanel() {
    const el = document.getElementById('npc-panel');
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
    el.innerHTML = `
      <div style="font-size:16px;font-weight:700;color:var(--accent-gold);margin-bottom:8px">${actNames[act] || `第${act}幕`}</div>
      <div class="stat-row" style="font-size:11px"><span class="stat-label">里程碑</span><span class="stat-value">${ms}/5</span></div>
      <div class="stat-bar"><div class="stat-bar-fill" style="width:${(ms/5)*100}%;background:var(--accent-gold)"></div></div>
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
  function renderEventLog() {
    const el = document.getElementById('event-log');
    if (!el) return;
    const G = SGame.G;
    if (!G.eventLog || G.eventLog.length === 0) {
      el.innerHTML = '<div style="font-size:11px;color:var(--text-muted);padding:8px 0">暂无日志</div>';
      return;
    }
    el.innerHTML = G.eventLog.slice(0, 50).map(log => `
      <div class="log-entry">
        <span class="log-time">[${log.time}]</span>
        <span class="log-text">${log.text}</span>
      </div>
    `).join('');
  }

  // ========== 成就面板 ==========
  function openAchievementPanel() {
    const modal = document.getElementById('modal-achievements');
    const content = document.getElementById('achievements-content');
    if (!modal || !content) return;
    const G = SGame.G;
    if (!G) { content.innerHTML = '<div style="font-size:12px;color:var(--text-muted)">请先开始游戏。</div>'; modal.classList.add('active'); return; }

    const total = ACHIEVEMENTS.length;
    const unlocked = G.unlockedAchievements.length;
    const pct = total > 0 ? Math.round(unlocked / total * 100) : 0;

    let html = `<div style="margin-bottom:12px"><div style="font-size:12px;color:var(--text-secondary)">进度：${unlocked}/${total}（${pct}%）</div><div class="stat-bar" style="margin-top:6px"><div class="stat-bar-fill" style="width:${pct}%;background:var(--accent-gold)"></div></div></div>`;

    ACHIEVEMENTS.forEach(a => {
      const done = G.unlockedAchievements.includes(a.id);
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
    G.unlockedAchievements.forEach(id => {
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
    const unlocked = G.unlockedAchievements.length;
    const pct = total > 0 ? Math.round(unlocked / total * 100) : 0;
    const achRewards = typeof calcAchievementRewards === 'function' ? calcAchievementRewards() : {};
    
    let html = '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">';
    html += '<button onclick="UI.switchPanel(\'dashboard\')" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:#fff;padding:6px 14px;font-size:13px;cursor:pointer;font-family:var(--font);">← 返回</button>';
    html += '<div style="font-size:16px;font-weight:700;color:var(--accent-gold)">🏆 成就殿堂</div>';
    html += '</div>';
    
    html += `<div style="margin-bottom:12px"><div style="font-size:12px;color:var(--text-secondary)">进度：${unlocked}/${total}（${pct}%）| 累积加成：收入+${((achRewards.incomeMult||0)*100).toFixed(0)}%</div><div class="stat-bar" style="margin-top:6px"><div class="stat-bar-fill" style="width:${pct}%;background:var(--accent-gold)"></div></div></div>`;
    
    ACHIEVEMENTS.forEach(a => {
      const done = G.unlockedAchievements.includes(a.id);
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
    document.getElementById('ach-icon').textContent = icon;
    document.getElementById('ach-name').textContent = name;
    const banner = document.getElementById('achievement-banner');
    banner.classList.add('show');
    if (achievementTimer) clearTimeout(achievementTimer);
    achievementTimer = setTimeout(() => { banner.classList.remove('show'); }, 4000);
    // 新增右上角Toast通知
    showToast(icon, name, '成就解锁！');
  }

  function showToast(icon, title, desc) {
    if (!notificationsEnabled) return;
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast-notify';
    toast.innerHTML = '<div style="display:flex;align-items:center"><span class="toast-icon">' + (icon || '') + '</span><div><div class="toast-name">' + (title || '') + '</div><div class="toast-desc">' + (desc || '') + '</div></div></div>';
    container.appendChild(toast);
    // 3秒后自动移除
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 3200);
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
      var enabled = !(SGame.G && SGame.G.autoMode && SGame.G.autoMode.enabled);
      if (SGame.G && SGame.G.autoMode) {
        SGame.G.autoMode.enabled = enabled;
        // 首次开启托管时，确保所有子配置都已初始化
        if (enabled && SGame.G.autoMode.autoOpenBusiness === undefined) {
          SGame.G.autoMode.autoOpenBusiness = true;
          SGame.G.autoMode.autoUpgradeBusiness = true;
          SGame.G.autoMode.autoHire = true;
          SGame.G.autoMode.autoResearch = true;
          SGame.G.autoMode.eventDecide = true;
          SGame.G.autoMode.autoUnlockRegion = true;
          SGame.G.autoMode.autoRepay = true;
        }
      }
      if (enabled) {
        showToast('🤖', '全自动托管已开启', '系统将自动管理运营决策');
      } else {
        showToast('⏸', '托管已关闭', '已恢复手动管理模式');
      }
      if (typeof SGame.save === 'function') SGame.save();
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
      <span style="font-size:11px;color:var(--text-muted);">已解锁: ${G.unlockedSkills.length}/20</span>
      ${costReduction > 0 ? `<span style="font-size:10px;color:var(--accent-gold);">🏅 成就减免: -${costReduction}点</span>` : ''}
    </div>`;

    const catNames = { management:'管理', tech:'技术', social:'社交', finance:'金融' };
    Object.entries(SKILL_TREES).forEach(([cat, skills]) => {
      html += `<div style="margin-bottom:14px;">
        <div style="font-size:13px;font-weight:600;color:var(--accent-cyan);margin-bottom:8px;border-bottom:1px solid var(--border);padding-bottom:4px;">${catNames[cat] || cat}</div>`;
      skills.forEach(sk => {
        const unlocked = G.unlockedSkills.includes(sk.id);
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
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:var(--bg-primary);text-align:center;padding:40px">
        <div>
          <div style="font-size:80px;margin-bottom:20px">${ending.icon}</div>
          <h1 style="font-size:32px;margin-bottom:12px;background:linear-gradient(135deg,var(--red-up),var(--accent-gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent">${ending.title}</h1>
          <p style="color:var(--text-secondary);font-size:16px;max-width:400px;line-height:1.8;margin-bottom:24px">${ending.desc}</p>
          <div style="font-size:13px;color:var(--text-muted);margin-bottom:32px">
            最终资产: ${SGame.formatMoney(SGame.G.money)} | 声誉: ${SGame.G.reputation.toFixed(0)} | 游戏时长: ${Math.floor(SGame.G.totalPlayTime/60)}分钟
          </div>
          <button class="btn" style="font-size:16px;padding:12px 40px" onclick="SGame.reset()">重新开始</button>
        </div>
      </div>
    `;
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
    { title:'欢迎来到商海浮沉', text:'这是一个商业模拟放置游戏。你将扮演一位创业者，在新海市建立自己的商业帝国。', highlight:null },
    { title:'仪表板', text:'这里显示你的资产、收益、支出等关键数据。游戏每5秒自动推进一个Tick，计算收益和事件。', highlight:'#dashboard' },
    { title:'业务管理', text:'在左侧面板可以查看和升级你的业务。不同区域有不同加成效果，选择合适的区域经营业务。', highlight:'#business-list' },
    { title:'员工与NPC', text:'招聘员工提升业务效率，与NPC建立关系获取资源和信息。好感度越高，帮助越大。', highlight:'#npc-panel' },
    { title:'事件决策', text:'游戏中会随机触发事件，你的每个决策都会影响公司命运。做好准备，开始你的商业征途吧！', highlight:'#event-area' },
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

    const businesses = G.businesses || {};
    const activeBiz = Object.entries(businesses).filter(([_,b]) => b.level > 0);
    let bestBiz = { name: '无', income: 0 };
    activeBiz.forEach(([id, state]) => {
      const def = BUSINESS_DEFS.find(b => b.id === id);
      if (!def) return;
      const lv = def.levels[state.level - 1];
      if (lv && lv.income > bestBiz.income) bestBiz = { name: def.icon + ' ' + def.name, income: lv.income };
    });

    let bestNpc = { name: '无', favor: 0 };
    Object.entries(G.npcFavor || {}).forEach(([id, favor]) => {
      if (favor > bestNpc.favor) {
        const npc = NPCS[id];
        bestNpc = { name: npc ? npc.name : id, favor };
      }
    });

    const playMin = Math.floor((G.totalPlayTime || 0) / 60);
    const playH = Math.floor(playMin / 60);
    const playM = playMin % 60;
    const maintenanceCost = typeof SGame.calcMaintenanceCost === 'function' ? SGame.calcMaintenanceCost() : 0;

    container.innerHTML = `
      <div class="stat-panel-row"><span class="stat-panel-label">累计总收入</span><span class="stat-panel-value" style="color:var(--green-down)">${SGame.formatMoney(G.totalIncome || 0)}</span></div>
      <div class="stat-panel-row"><span class="stat-panel-label">累计总支出</span><span class="stat-panel-value" style="color:var(--red-up)">${SGame.formatMoney(G.totalExpense || 0)}</span></div>
      <div class="stat-panel-row"><span class="stat-panel-label">净收入</span><span class="stat-panel-value" style="color:var(--accent-gold)">${SGame.formatMoney((G.totalIncome||0) - (G.totalExpense||0))}</span></div>
      <div class="stat-panel-row"><span class="stat-panel-label">每Tick维护成本</span><span class="stat-panel-value" style="color:var(--red-up)">${SGame.formatMoney(maintenanceCost)}</span></div>
      <div class="stat-panel-row"><span class="stat-panel-label">总事件数</span><span class="stat-panel-value">${G.eventCount || 0}</span></div>
      <div class="stat-panel-row"><span class="stat-panel-label">总决策数</span><span class="stat-panel-value">${G.decisionCount || 0}</span></div>
      <div class="stat-panel-row"><span class="stat-panel-label">游戏时长</span><span class="stat-panel-value">${playH}时${playM}分</span></div>
      <div class="stat-panel-row"><span class="stat-panel-label">最赚钱业务</span><span class="stat-panel-value">${bestBiz.name}</span></div>
      <div class="stat-panel-row"><span class="stat-panel-label">关系最好NPC</span><span class="stat-panel-value">${bestNpc.name} (${bestNpc.favor})</span></div>
      <div class="stat-panel-row"><span class="stat-panel-label">已解锁成就</span><span class="stat-panel-value">${G.unlockedAchievements.length}/${ACHIEVEMENTS.length}</span></div>
    `;
  }

  // ========== 里程碑面板 (功能9) ==========
  function renderMilestonePanel(container) {
    if (!container) return;
    const G = SGame.G;
    if (!G) { container.innerHTML = '<div style="font-size:11px;color:var(--text-muted)">请先开始游戏</div>'; return; }

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
    const total = advMilestones.length;
    const achievedCount = advMilestones.filter(m => achieved.includes(m.id)).length;

    let html = '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">';
    html += '<button onclick="UI.switchPanel(\'dashboard\')" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:#fff;padding:6px 14px;font-size:13px;cursor:pointer;font-family:var(--font);transition:all 0.2s;" onmouseover="this.style.background=\'rgba(255,255,255,0.18)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.08)\'">← 返回</button>';
    html += '<div style="font-size:16px;font-weight:700;color:var(--accent-gold)">🏅 里程碑</div>';
    html += '</div>';

    html += `<div style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;">进度: <b style="color:var(--accent-gold)">${achievedCount}/${total}</b></div>`;
    html += `<div class="stat-bar" style="margin-bottom:16px;"><div class="stat-bar-fill" style="width:${total > 0 ? (achievedCount/total*100) : 0}%;background:var(--accent-gold)"></div></div>`;

    advMilestones.forEach(ms => {
      const done = achieved.includes(ms.id);
      const tierColors = ['var(--text-muted)', '#c0c8d4', 'var(--green-down)', 'var(--accent-blue)', 'var(--purple)', 'var(--accent-gold)'];
      const tierIdx = done ? Math.min(achieved.indexOf(ms.id) + 2, tierColors.length - 1) : 0;
      html += `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);opacity:${done ? 1 : 0.35}">
        <div style="font-size:28px;">${done ? ms.icon : '🔒'}</div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:600;color:${done ? tierColors[tierIdx] : 'var(--text-muted)'}">${ms.name}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${ms.desc}</div>
          ${done ? '<div style="font-size:10px;color:var(--accent-gold);margin-top:2px">✓ 已达成 | 奖励: +2技能点</div>' : ''}
        </div>
      </div>`;
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

  // ========== 环境主题切换 ==========
  const WEATHER_ICONS = {
    sunny: '☀️', cloudy: '⛅', rainy: '🌧️', storm: '⛈️',
    foggy: '🌫️', snow: '❄️', heatwave: '🔥',
  };
  const TIME_ICONS = { dawn: '🌅', day: '☀️', dusk: '🌇', night: '🌙' };

  function getWeatherDisplay(G) {
    if (!G || !G.currentWeather) return '';
    const icon = WEATHER_ICONS[G.currentWeather] || '';
    const w = WEATHERS[G.currentWeather];
    return `${icon} ${w ? w.name : G.currentWeather}`;
  }

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
    showToast(`${emoji} [${item.category}] ${item.text}`, 3000);
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
    const rate = Math.max(0.15 - (rep / 100) * 0.07, 0.08);
    const rateDisp = (rate * 100).toFixed(1);

    html += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;">' +
      '可贷额度: <b style="color:var(--accent-gold)">' + formatMoneyComma(maxLoan) + '</b> (资产50%) | ' +
      '利率: <b>' + rateDisp + '%</b></div>';

    if (G.loans && G.loans.length > 0) {
      html += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">当前贷款:</div>';
      G.loans.forEach((loan, i) => {
        html += '<div style="padding:8px;border:1px solid var(--border);border-radius:6px;margin-bottom:6px;font-size:11px;display:flex;justify-content:space-between;align-items:center;">' +
          '<span>贷款 ' + formatMoneyComma(loan.amount) + ' | 利率 ' + (loan.rate*100).toFixed(1) + '% | 剩余 ' + loan.ticksRemaining + ' Tick</span>' +
          '<button class="btn" style="font-size:10px;padding:3px 8px;" onclick="SGame.repayLoan(' + i + ');UI.renderAll();">还款</button>' +
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
    showTutorial, nextTutorialStep, skipTutorial, closeTutorial,
    renderAutoButton, toggleAutoMode,
    showToast, showMilestone, renderStatPanel,
    renderSaveSlots, saveToSlot, loadSaveSlot,
    exportSaveSlot, deleteSaveSlot, importToSlot,
    formatMoneyComma, renderMiniAssetChart, renderIncomeBreakdown,
    switchPanel, openSettings,
    renderRankingPanel, showNewsDetail, retireGame,
    renderTechPanel, renderStockPanel,
    // 新增功能
    showOfflineIncomePopup, claimOfflineIncome,
    batchHire,
    trainEmployee, restEmployee,
    // HR 统管
    batchTrainDept, batchHireDept, toggleDeptDetail,
    renderMilestonePanel,
  };
})();
