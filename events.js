// ==================================================
// events.js — 事件系统：触发、渲染、决策处理
// ==================================================

window.EventSystem = (() => {
  let currentEvent = null;

  // ========== 触发事件 ==========
  function fireEvent(event) {
    currentEvent = event;
    SGame.G.eventCooldowns[event.id] = SGame.G.tickCount;
    SGame.G.eventHistory.push(event.id);

    const desc = typeof event.getDesc === 'function' ? event.getDesc() : event.desc;

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
    const isAuto = SGame.G && SGame.G.autoMode;

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
    }

    const card = document.createElement('div');
    card.className = `event-card ${isDecision ? 'decision' : ''}`;
    card.id = `event-${event.id}`;
    card.innerHTML = `
      <div class="event-title">
        ${isDecision ? '⚡' : '📰'} ${event.title}
        ${isDecision ? '<span class="act-badge" style="background:#1a2e1a;color:var(--green-down);margin-left:8px;">决策</span>' : ''}
      </div>
      <div class="event-text" id="event-desc-${event.id}">${desc}</div>
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

    // 如果是决策型且有LLM，尝试生成叙事
    if (isDecision && typeof LLM !== 'undefined') {
      LLM.generateNarrative(event, desc).then(narrative => {
        const el = document.getElementById(`event-desc-${event.id}`);
        if (el) el.textContent = narrative;
      }).catch(() => {});
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

    // 移除事件卡片
    const card = document.getElementById(`event-${eventId}`);
    if (card) card.remove();

    // 结局检查
    if (choice.ending) {
      triggerEnding(choice.ending);
      return;
    }

    addLog(`[选择] ${event.title} → ${choice.text}`);

    // 重新渲染UI
    if (typeof UI !== 'undefined') UI.renderAll();
  }

  function applyEffects(eff) {
    if (!eff) return;
    const G = SGame.G;
    if (eff.money) G.money *= (eff.money > 0 && eff.money < 1) ? eff.money : (1 + eff.money / 10000);
    if (eff.moneyAbs) G.money += eff.moneyAbs;
    if (eff.reputation) G.reputation = Math.max(0, Math.min(100, G.reputation + eff.reputation));
    if (eff.stress) G.stress = Math.max(0, Math.min(100, G.stress + eff.stress));
    if (eff.connections) G.connections = Math.max(0, G.connections + eff.connections);
    if (eff.reputationMul) G.reputation = Math.min(100, G.reputation * eff.reputationMul);
    if (eff.stressMul) G.stress = Math.min(100, G.stress * eff.stressMul);
    // NPC好感度处理
    if (eff.npcFavor) {
      Object.entries(eff.npcFavor).forEach(([npcId, delta]) => {
        if (typeof NPCSystem !== 'undefined') NPCSystem.changeFavor(npcId, delta);
      });
    }
  }

  // ========== 结局 ==========
  function triggerEnding(endingType) {
    SGame.G.ending = endingType;
    if (typeof UI !== 'undefined') UI.showEnding(endingType);
  }

  // ========== 公开API ==========
  return {
    fireEvent,
    choose,
    addLog,
    triggerEnding,
  };
})();
