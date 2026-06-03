// ==================================================
// events.js — 事件系统：触发、渲染、决策处理
// ==================================================

window.EventSystem = (() => {
  let currentEvent = null;
  let eventQueue = [];  // 事件队列

  // ========== 触发事件 ==========
  function fireEvent(event) {
    currentEvent = event;
    SGame.G.eventCooldowns[event.id] = SGame.G.tickCount;
    SGame.G.eventHistory.push(event.id);
    if (SGame.G.eventHistory.length > 500) SGame.G.eventHistory = SGame.G.eventHistory.slice(-200);

    const desc = typeof event.getDesc === 'function' ? event.getDesc() : event.desc;

    // 添加到事件队列
    eventQueue.push(event);
    if (eventQueue.length > CONFIG.MAX_PENDING_DECISIONS + 5) eventQueue.shift();

    // 添加到日志
    addLog(`[事件] ${event.title}`);
    // 更新热搜
    updateHotSearch(event);
    // 显示事件卡片（先渲染静态描述，LLM生成后替换）
    renderEventCard(event, desc);

    // 所有事件都尝试用LLM生成叙事，替换描述
    if (typeof LLM !== 'undefined') {
      LLM.generateNarrative(event, desc).then(narrative => {
        const el = document.getElementById(`event-desc-${event.id}`);
        if (el) el.textContent = narrative;
      }).catch(() => {});
    }
  }

  function addLog(text) {
    SGame.G.eventLog = SGame.G.eventLog || [];
    SGame.G.eventLog.unshift({ time: SGame.G.tickCount, text });
    if (SGame.G.eventLog.length > 200) SGame.G.eventLog.length = 200;
    // 更新UI
    if (typeof UI !== 'undefined') UI.renderEventLog();
  }

  function updateHotSearch(event) {
    const hot = SGame.G.hotSearch;
    hot.unshift({ rank: 0, text: event.title, heat: 8000 + Math.floor(Math.random() * 2000) });
    hot.forEach((h, i) => h.rank = i + 1);
    if (hot.length > 10) hot.length = 10;
    if (typeof UI !== 'undefined') UI.renderHotSearch();
  }

  // ========== 渲染事件卡片 ==========
  function renderEventCard(event, desc) {
    const area = document.getElementById('event-area');
    const isDecision = event.type === 'decision';
    const isAuto = SGame.G && SGame.G.autoMode && SGame.G.autoMode.enabled && SGame.G.autoMode.eventDecide;

    let choicesHTML = '';
    if (event.choices && event.choices.length > 0) {
      if (isAuto) {
        choicesHTML = '<div class="event-choices"><div style="font-size:11px;color:var(--accent-gold);padding:8px 12px;background:rgba(245,158,11,0.08);border-radius:6px;display:flex;align-items:center;gap:8px;">🤖 托管中 — 1.5秒后自动决策...</div></div>';
      } else {
        choicesHTML = '<div class="event-choices">';
        event.choices.forEach((c, i) => {
          choicesHTML += `<button class="event-choice" onclick="EventSystem.choose('${event.id}', ${i})">${c.text}</button>`;
        });
        choicesHTML += '</div>';
      }
      // 稍后处理按钮
      choicesHTML += `<button class="event-choice event-defer" style="background:var(--bg-card);color:var(--text-muted);border:1px solid var(--border-color);" onclick="EventSystem.deferEvent('${event.id}')">稍后处理</button>`;
    }

    const card = document.createElement('div');
    card.className = `event-card ${isDecision ? 'decision' : ''}`;
    card.id = `event-${event.id}`;

    // 决策事件额外增加决策叙事区域
    var decisionNarrativeHTML = '';
    if (isDecision) {
      decisionNarrativeHTML = `<div class="event-decision-narrative" id="event-decision-${event.id}" style="font-size:11px;color:var(--accent-gold);line-height:1.6;margin-bottom:8px;padding:8px 10px;background:rgba(245,158,11,0.06);border-radius:6px;border-left:3px solid var(--accent-gold);font-style:italic;min-height:20px;"></div>`;
    }

    card.innerHTML = `
      <div class="event-title">
        ${isDecision ? '⚡' : '📰'} ${event.title}
        ${isDecision ? '<span class="act-badge" style="background:#1a2e1a;color:var(--green-down);margin-left:8px;">决策</span>' : ''}
      </div>
      <div class="event-text" id="event-desc-${event.id}">${desc}</div>
      ${decisionNarrativeHTML}
      ${choicesHTML}
      <div class="event-meta">Tick ${SGame.G.tickCount}</div>
    `;
    // 新事件插到前面
    if (area.firstChild) {
      area.insertBefore(card, area.firstChild);
    } else {
      area.appendChild(card);
    }
    // 限制事件卡片数量
    while (area.children.length > 20) area.removeChild(area.lastChild);

    // 决策事件：调用专用的决策叙事生成器（新功能 #1）
    if (isDecision && typeof LLM !== 'undefined') {
      LLM.generateDecisionNarrative(event).then(function(narrative) {
        if (narrative) {
          var el = document.getElementById('event-decision-' + event.id);
          if (el) el.textContent = '🎯 ' + narrative;
        }
      }).catch(function() {});
    }
  }

  // ========== 玩家选择 ==========
  function choose(eventId, choiceIdx) {
    const event = EVENTS.find(e => e.id === eventId);
    if (!event) return;
    const choice = event.choices[choiceIdx];
    if (!choice) return;

    // 应用效果
    applyEffects(choice.effect);

    // 记录决策
    SGame.G.decisionHistory.push({ eventId, choice: choice.text, tick: SGame.G.tickCount });
    SGame.G.decisionCount = (SGame.G.decisionCount || 0) + 1;
    if (SGame.G.decisionHistory.length > 500) SGame.G.decisionHistory = SGame.G.decisionHistory.slice(-200);

    // 移除事件卡片
    const card = document.getElementById(`event-${eventId}`);
    if (card) card.remove();

    // 结局检查 — 已禁用（长期放置游戏无结局）
    if (choice.ending) {
      // 不再触发结局，改为记录里程碑
      SGame.addLog(`🏆 达成成就：${choice.ending}`);
      if (typeof UI !== 'undefined' && UI.showToast) UI.showToast(`🏆 ${choice.ending}`);
      return;
    }

    addLog(`[选择] ${event.title} → ${choice.text}`);

    // 从延迟队列中移除已处理事件
    eventQueue = eventQueue.filter(qe => qe.id !== eventId);

    // 重新渲染UI
    if (typeof UI !== 'undefined') UI.renderAll();
  }

  function applyEffects(eff) {
    if (!eff) return;
    const G = SGame.G;
    // eff.money: 绝对值<1 且不为0 视为乘数，否则视为绝对增减量
    if (eff.money) {
      if (Math.abs(eff.money) < 1 && eff.money !== 0) {
        G.money *= eff.money;
      } else {
        G.money += eff.money;
      }
    }
    if (eff.moneyAbs) G.money += eff.moneyAbs;
    if (eff.reputation) G.reputation = Math.max(0, Math.min(100, G.reputation + eff.reputation));
    if (eff.stress) G.stress = Math.max(0, Math.min(100, G.stress + eff.stress));
    if (eff.connections) {
      const scaled = Math.floor(eff.connections * (CONFIG.CONNECTIONS_GAIN_SCALE || 0.6));
      G.connections = Math.min(CONFIG.MAX_CONNECTIONS || 100, Math.max(0, G.connections + scaled));
    }
    if (eff.reputationMul) G.reputation = Math.max(0, Math.min(100, G.reputation * eff.reputationMul));
    if (eff.stressMul) G.stress = Math.max(0, Math.min(100, G.stress * eff.stressMul));
    // NPC好感度处理
    if (eff.npcFavor) {
      Object.entries(eff.npcFavor).forEach(([npcId, delta]) => {
        if (typeof NPCSystem !== 'undefined') NPCSystem.changeFavor(npcId, delta);
      });
    }
  }

  // ========== 结局（已禁用） ==========
  function triggerEnding(endingType) {
    // 长期放置游戏无结局，改为里程碑通知
    SGame.addLog(`🏆 里程碑达成：${endingType}`);
    if (typeof UI !== 'undefined' && UI.showToast) UI.showToast(`🏆 ${endingType}`);
  }

  // ========== 稍后处理 ==========
  function deferEvent(eventId) {
    const card = document.getElementById(`event-${eventId}`);
    if (card) {
      card.style.opacity = '0.5';
      card.style.transform = 'scale(0.98)';
      setTimeout(() => {
        if (card.parentNode) card.remove();
      }, 300);
    }
    // 事件仍在队列中，稍后可重新显示
    addLog(`[事件] ${eventId} 已暂时搁置`);
  }

  // ========== 重新显示搁置事件 ==========
  function showDeferredEvents() {
    if (!SGame.G || !eventQueue.length) return;
    eventQueue.forEach(event => {
      const existing = document.getElementById(`event-${event.id}`);
      if (!existing && event.type === 'decision') {
        const desc = typeof event.getDesc === 'function' ? event.getDesc() : event.desc;
        renderEventCard(event, desc);
      }
    });
    // 清空已处理的
    eventQueue = eventQueue.filter(e => {
      const card = document.getElementById(`event-${e.id}`);
      return !card && e.type === 'decision';
    });
  }

  // ========== 节日事件触发 ==========
  function fireHolidayEvent(holidayKey) {
    const holidayNames = {
      spring_festival: '春节', lantern: '元宵节', qingming: '清明节',
      labor: '劳动节', dragon_boat: '端午节', qixi: '七夕',
      mid_autumn: '中秋节', national: '国庆节', double11: '双十一',
      double12: '双十二', newyear: '元旦', christmas: '圣诞节'
    };
    const holidayBonuses = {
      spring_festival: { retail: 0.30, food_chain: 0.20, media: 0.10 },
      double11: { retail: 0.40, media: 0.15, tech: 0.05 },
      national: { office: 0.15, retail: 0.10, new_energy: 0.15 },
      labor: { retail: 0.20, food_chain: 0.15 },
      christmas: { retail: 0.20, media: 0.10 },
      dragon_boat: { retail: 0.10, media: 0.15 },
      qixi: { retail: 0.15, food_chain: 0.10, media: 0.05 },
      mid_autumn: { retail: 0.10, food_chain: 0.10 },
      double12: { retail: 0.20, media: 0.05 },
    };
    const hName = holidayNames[holidayKey] || holidayKey;
    const bonus = holidayBonuses[holidayKey] || {};
    addLog(`🎉 ${hName}到了！${Object.keys(bonus).length > 0 ? '相关业务收益加成！' : ''}`);
    SGame.G._currentHoliday = holidayKey;
    setTimeout(() => { if (SGame.G) SGame.G._currentHoliday = null; }, 24 * (CONFIG.TICK_MS / 1000) * 1000);
  }

  // ========== 公开API ==========
  return {
    fireEvent,
    choose,
    addLog,
    triggerEnding,
    deferEvent,
    showDeferredEvents,
    fireHolidayEvent,
    getEventQueue: () => eventQueue,
  };
})();
