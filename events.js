// Author: Fisheep.L
// ==================================================
// events.js — 事件系统：触发、渲染、决策处理
// ==================================================

window.EventSystem = (() => {
  let currentEvent = null;
  let eventQueue = [];  // 事件队列
  let pendingChainEvents = [];  // 连锁事件延迟队列

  function _stripHtml(str) {
    if (!str) return '';
    return String(str).replace(/<[^>]*>/g, '');
  }

  // ========== 触发事件 ==========
  const _firedEventIds = new Set();

  // 条件过滤：检查事件是否满足触发条件
  function _checkConditionTags(event) {
    if (!event.conditionTags) return true;
    const G = SGame.G;
    const tags = event.conditionTags;

    // 地区限定：当前已解锁城市中是否包含需求地区
    if (tags.regionLimit && tags.regionLimit.length > 0) {
      let hasRegion = false;
      if (G.cities) {
        for (const rid of tags.regionLimit) {
          if (G.cities[rid] && G.cities[rid].unlocked) { hasRegion = true; break; }
        }
      }
      if (!hasRegion) return false;
    }

    // 行业限定：是否拥有指定行业的业务
    if (tags.industryLimit && tags.industryLimit.length > 0) {
      let hasIndustry = false;
      if (G.businesses) {
        for (const bid of tags.industryLimit) {
          const biz = G.businesses[bid];
          if (biz && biz.unlocked && biz.level > 0) { hasIndustry = true; break; }
        }
      }
      // 也检查多城业务
      if (!hasIndustry && G.cities) {
        Object.values(G.cities).forEach(city => {
          if (!city || !city.unlocked || !city.businesses) return;
          for (const bid of tags.industryLimit) {
            const b = city.businesses[bid];
            if (b && b.level > 0) { hasIndustry = true; }
          }
        });
      }
      if (!hasIndustry) return false;
    }

    // 资产门槛
    if (tags.assetThreshold && G.money < tags.assetThreshold) return false;

    return true;
  }

  function fireEvent(event) {
    // Resolve event from EVENTS by id if string passed
    if (typeof event === 'string') {
      const found = EVENTS.find(e => e.id === event);
      if (!found) return;
      event = found;
    }

    // 条件过滤：不满足则跳过
    if (!_checkConditionTags(event)) return;

    // Dedup: skip if same event ID already fired this tick
    if (_firedEventIds.has(event.id)) return;
    _firedEventIds.add(event.id);
    // FIFO 淘汰：超过 50 时移除最早的一半，避免全量清空导致事件过早复现
    if (_firedEventIds.size > 50) {
      const toRemove = Math.floor(_firedEventIds.size / 2);
      const it = _firedEventIds.values();
      for (let i = 0; i < toRemove; i++) { _firedEventIds.delete(it.next().value); }
    }

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

    // ===== 热搜 → 市场情绪联动 =====
    SGame.G.marketSentiment = SGame.G.marketSentiment || 50;
    const sentDelta = getEventSentiment(event);
    SGame.G.marketSentiment = Math.max(5, Math.min(95, SGame.G.marketSentiment + sentDelta));

    // ===== 热搜 → 股票联动 =====
    const sector = getEventSector(event);
    if (sector && typeof STOCKS !== 'undefined' && SGame.G.stockPrices) {
      const style = sectorToEventStyle(sector);
      const changePct = getEventStockChange(event);
      Object.entries(STOCKS).forEach(function(entry) {
        var sid = entry[0], stock = entry[1];
        if (stock.sector && sectorToEventStyle(stock.sector) === style) {
          var oldPrice = SGame.G.stockPrices[sid] || stock.basePrice;
          SGame.G.stockPrices[sid] = Math.max(1, +(oldPrice * (1 + changePct)).toFixed(2));
          if (!SGame.G.stockChangeLog) SGame.G.stockChangeLog = {};
          SGame.G.stockChangeLog[sid] = parseFloat((changePct * 100).toFixed(2));
        }
      });
    }
  }

  // 事件类型 → 板块映射
  function getEventSector(event) {
    var title = event.title || '';
    var type = event.type || '';
    // 从标题关键词推断板块
    if (/芯片|AI|5G|量子|科技|软件|算法|算力|代码|数据|机器人/.test(title)) return '科技';
    if (/金融|银行|融资|上市|投资|股市|股票|资本|基金|汇率/.test(title)) return '金融';
    if (/地产|楼盘|房价|房产|物业|建筑/.test(title)) return '地产';
    if (/新能源|能源|石油|光伏|风电|电池/.test(title)) return '能源';
    if (/医药|医疗|健康|疫苗|医院/.test(title)) return '医药';
    if (/物流|快递|运输|供应链/.test(title)) return '物流';
    if (/零售|消费|电商|购物|门店/.test(title)) return '零售';
    // 兜底：按类型映射
    if (type === 'market') return '金融';
    if (type === 'crisis') return '金融';
    return null;
  }

  // 板块 → style（与 core.js 中 sectorToStyle 保持一致）
  function sectorToEventStyle(sector) {
    var map = {
      '科技': 'tech', 'AI': 'tech', '5G': 'tech', '量子计算': 'tech',
      '金融': 'finance', '区块链': 'finance',
      '地产': 'real_estate',
      '零售': 'retail',
      '能源': 'energy', '新能源': 'energy',
      '医药': 'health',
      '物流': 'logistics',
    };
    return map[sector] || '';
  }

  // 推断事件情感倾向（±2）
  function getEventSentiment(event) {
    // 从 effects.money 推断：平均值 > 1 偏利好，< 1 偏利空
    if (event.effects && event.effects.money && Array.isArray(event.effects.money)) {
      var avg = (event.effects.money[0] + event.effects.money[event.effects.money.length - 1]) / 2;
      if (avg > 1.1) return 2;
      if (avg > 1.0) return 1;
      if (avg < 0.9) return -2;
      if (avg < 1.0) return -1;
    }
    // 从标题关键词推断
    var title = event.title || '';
    if (/利好|上涨|突破|签约|融资成功|上市/.test(title)) return 2;
    if (/警告|下跌|罚款|爆雷|危机|崩盘|亏损/.test(title)) return -2;
    if (/增长|扩大|扩张|研发/.test(title)) return 1;
    if (/下降|萎缩|裁员|倒闭/.test(title)) return -1;
    return 0;
  }

  // 事件对股票价格的影响百分比
  function getEventStockChange(event) {
    var sent = getEventSentiment(event);
    if (sent === 2) return 0.06 + Math.random() * 0.08;   // 利好：+6%~+14%
    if (sent === 1) return 0.02 + Math.random() * 0.05;   // 利好：+2%~+7%
    if (sent === -2) return -(0.06 + Math.random() * 0.08); // 利空：-6%~-14%
    if (sent === -1) return -(0.02 + Math.random() * 0.05); // 利空：-2%~-7%
    return (Math.random() - 0.5) * 0.04; // 中性：-2%~+2%
  }

  // ========== 渲染事件卡片 ==========
  function renderEventCard(event, desc) {
    const area = document.getElementById('event-area');
    const isDecision = event.type === 'decision';
    const isAuto = SGame.G && SGame.G.autoMode && SGame.G.autoMode.enabled && SGame.G.autoMode.eventDecide;

    let choicesHTML = '';
    if (event.choices && event.choices.length > 0) {
      if (isAuto) {
        choicesHTML = '<div class="event-choices"><div id="event-auto-status-' + event.id + '" class="event-auto-countdown" style="font-size:12px;color:var(--accent-gold);padding:8px 12px;background:rgba(245,158,11,0.08);border-radius:6px;display:flex;align-items:center;gap:8px;cursor:pointer;border:1px dashed var(--accent-gold);user-select:none;transition:background 0.2s;" onclick="EventSystem.cancelAutoForEvent(\'' + event.id + '\')" title="点击取消托管，手动选择决策">🤖 托管中 — <span id="event-countdown-' + event.id + '">1.5</span>秒后自动决策...（点击取消）</div></div>';
      } else {
        choicesHTML = '<div class="event-choices">';
        event.choices.forEach((c, i) => {
          choicesHTML += `<button class="event-choice" onclick="EventSystem.choose('${event.id}', ${i})">${c.text}</button>`;
        });
        choicesHTML += '</div>';
      }
      // 稍后处理按钮
      choicesHTML += `<button class="event-choice event-defer" style="background:rgba(100,116,139,0.15);color:var(--text-secondary);border:1px solid var(--text-muted);cursor:pointer;transition:all 0.2s;" onclick="EventSystem.deferEvent('${event.id}')">稍后处理</button>`;
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
        ${isDecision ? '⚡' : '📰'} ${_stripHtml(event.title)}
        ${isDecision ? '<span class="act-badge" style="background:#1a2e1a;color:var(--green-down);margin-left:8px;">决策</span>' : ''}
      </div>
      <div class="event-text" id="event-desc-${event.id}">${_stripHtml(desc)}</div>
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
      }).catch(function(e) { if (typeof SGame !== "undefined" && SGame.DEBUG) SGame.DEBUG && console.error("[events] LLM narrative failed:", e && e.message); });
    }

    // 托管模式倒计时：动态更新秒数
    if (isAuto && event._autoDecideTimer) {
      var startTime = Date.now();
      var totalMs = 1500;
      var countdownEl = document.getElementById('event-countdown-' + event.id);
      event._countdownTimer = setInterval(function() {
        var elapsed = Date.now() - startTime;
        var remain = Math.max(0, totalMs - elapsed);
        var sec = (remain / 1000).toFixed(1);
        if (countdownEl) countdownEl.textContent = sec;
        if (remain <= 0 && event._countdownTimer) {
          clearInterval(event._countdownTimer);
          delete event._countdownTimer;
        }
      }, 100);
    }
  }

  // ========== 玩家选择 ==========
  function choose(eventId, choiceIdx) {
    const event = EVENTS.find(e => e.id === eventId);
    if (!event) {
      eventQueue = eventQueue.filter(qe => qe.id !== eventId);
      return;
    }
    const choice = event.choices[choiceIdx];
    if (!choice) {
      eventQueue = eventQueue.filter(qe => qe.id !== eventId);
      return;
    }

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

    // 同步清理 core.js 的 pendingDecisions（避免手动决策后队列积压）
    if (typeof SGame !== 'undefined' && SGame.pendingDecisions) {
      SGame.pendingDecisions = SGame.pendingDecisions.filter(d => d !== event && d.id !== eventId);
    }

    // 连锁事件：如果事件有 nextEvent，加入延迟队列
    if (event.nextEvent) {
      const delay = 2 + Math.floor(Math.random() * 4); // 2-5 tick 延迟
      pendingChainEvents.push({
        eventId: event.nextEvent,
        triggerTick: SGame.G.tickCount + delay,
      });
      addLog(`🔗 连锁事件将在 ${delay} Tick 后触发...`);
    }

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
    // 出身事件特有字段
    if (eff.rpt) G.rpt = (G.rpt || 0) + eff.rpt;
    if (eff.empAdd && typeof EMP_ROLES !== 'undefined') {
      var roleDef = EMP_ROLES.find(function(r) { return r.id === eff.empAdd; });
      if (roleDef) {
        var newEmp = (typeof S.generateEmployeeWithAttributes === 'function')
          ? S.generateEmployeeWithAttributes(roleDef, G)
          : { id: 'emp_' + Date.now(), name: roleDef.name, role: roleDef.id, salary: roleDef.salary || 5000, stats: {} };
        G.employees.push(newEmp);
        if (typeof SGame !== 'undefined' && SGame.addLog) SGame.addLog('👤 ' + newEmp.name + '（' + roleDef.name + '）加入了你的团队');
      }
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
    // 清除自动决策计时器（如果存在）
    const event = eventQueue.find(e => e.id === eventId);
    if (event) {
      if (event._autoDecideTimer) { clearTimeout(event._autoDecideTimer); delete event._autoDecideTimer; }
      if (event._countdownTimer) { clearInterval(event._countdownTimer); delete event._countdownTimer; }
    }
    if (SGame.S && SGame.S.pendingDecisions) {
      var pe = SGame.S.pendingDecisions.find(function(d) { return d.id === eventId; });
      if (pe) {
        if (pe._autoDecideTimer) { clearTimeout(pe._autoDecideTimer); delete pe._autoDecideTimer; }
        if (pe._countdownTimer) { clearInterval(pe._countdownTimer); delete pe._countdownTimer; }
      }
    }
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

  // ========== 取消本次自动决策（点击倒计时状态） ==========
  function cancelAutoForEvent(eventId) {
    // 查找事件对象并清除所有计时器
    var targetEvent = eventQueue.find(function(e) { return e.id === eventId; });
    if (!targetEvent && SGame.S && SGame.S.pendingDecisions) {
      targetEvent = SGame.S.pendingDecisions.find(function(d) { return d.id === eventId; });
    }
    if (targetEvent) {
      if (targetEvent._autoDecideTimer) { clearTimeout(targetEvent._autoDecideTimer); delete targetEvent._autoDecideTimer; }
      if (targetEvent._countdownTimer) { clearInterval(targetEvent._countdownTimer); delete targetEvent._countdownTimer; }
    }
    // 关闭事件自动决策（不影响托管其他功能），让玩家手动选择
    if (SGame.G && SGame.G.autoMode) {
      SGame.G.autoMode.eventDecide = false;
    }
    // 重建卡片中的 choices 区域为手动选择模式
    var card = document.getElementById('event-' + eventId);
    if (card && targetEvent && targetEvent.choices && targetEvent.choices.length > 0) {
      // 移除旧的 choices / defer 元素
      var oldChoices = card.querySelector('.event-choices');
      if (oldChoices) oldChoices.remove();
      var oldDefer = card.querySelector('.event-defer');
      if (oldDefer) oldDefer.remove();
      // 构建新的手动选择按钮
      var newHTML = '<div class="event-choices">';
      targetEvent.choices.forEach(function(c, i) {
        newHTML += '<button class="event-choice" onclick="EventSystem.choose(\'' + targetEvent.id + '\', ' + i + ')">' + c.text + '</button>';
      });
      newHTML += '</div>';
      newHTML += '<button class="event-choice event-defer" style="background:rgba(100,116,139,0.15);color:var(--text-secondary);border:1px solid var(--text-muted);cursor:pointer;" onclick="EventSystem.deferEvent(\'' + targetEvent.id + '\')">稍后处理</button>';
      // 插入到 event-meta 之前
      var meta = card.querySelector('.event-meta');
      if (meta) {
        meta.insertAdjacentHTML('beforebegin', newHTML);
      } else {
        card.insertAdjacentHTML('beforeend', newHTML);
      }
    }
    addLog('[事件] 已取消自动决策，请手动选择');
  }

  // ========== 重新显示搁置事件 ==========
  function showDeferredEvents() {
    if (!SGame.G || !eventQueue.length) return;
    // 只重渲染，不清理队列 — 队列在 choose() 中清理
    eventQueue.forEach(event => {
      const existing = document.getElementById(`event-${event.id}`);
      if (!existing && event.choices && event.choices.length > 0) {
        const desc = typeof event.getDesc === 'function' ? event.getDesc() : event.desc;
        renderEventCard(event, desc);
      }
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

  // ========== 处理连锁事件队列（由core.js的tickEvents调用） ==========
  function processChainEvents() {
    if (!pendingChainEvents.length) return;
    const G = SGame.G;
    const toFire = [];
    pendingChainEvents = pendingChainEvents.filter(ce => {
      if (G.tickCount >= ce.triggerTick) {
        toFire.push(ce.eventId);
        return false; // 移除
      }
      return true;
    });
    toFire.forEach(eid => {
      const event = EVENTS.find(e => e.id === eid);
      if (event) {
        addLog(`🔗 连锁事件触发：${event.title}`);
        fireEvent(event);
      }
    });
  }

  // ========== 公开API ==========
  return {
    fireEvent,
    choose,
    addLog,
    triggerEnding,
    deferEvent,
    cancelAutoForEvent,
    showDeferredEvents,
    fireHolidayEvent,
    getEventQueue: () => eventQueue,
    processChainEvents,
    _checkConditionTags,
    _resetState: function() {
      eventQueue.length = 0;
      _firedEventIds.clear();
      pendingChainEvents.length = 0;
    },
  };
})();
