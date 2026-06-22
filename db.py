// ===================================================
// core-strategy.js — 托管引擎：自动管理游戏中所有可操作事项
// 从 core.js 拆分：通过 SGame 全局对象访问共享状态
// ===================================================
(function() {
  var S = window.SGame;
  // G 代理：所有 G.xxx 读写透明转发到 S.G
  var G = new Proxy({}, {
    get: function(_, k) { var g = S.G; return g ? g[k] : undefined; },
    set: function(_, k, v) { var g = S.G; if (g) { g[k] = v; } return true; },
    has: function(_, k) { var g = S.G; return g ? k in g : false; }
  });
  var addLog = function() { return S.addLog.apply(S, arguments); };
  var _formatMoney = function(v) { return S.formatMoney(v); };
  var calcTotalIncome = S.calcTotalIncome;
  var calcTotalExpense = S.calcTotalExpense;
  var getEmpMax = S.getEmpMax;
  var getManualWorkCdRemain = S.getManualWorkCdRemain;
  var buyAsset = S.buyAsset;
  var pawnAsset = S.pawnAsset;
  var unlockRegion = S.unlockRegion;
  var checkHoliday = S.checkHoliday;
  var getSeason = S.getSeason;
  var applyLoan = S.applyLoan;
  var processLoans = S.processLoans;
  var repayLoan = S.repayLoan;
  var isHRManaged = S.isHRManaged;
  var generateEmployeeWithAttributes = S.generateEmployeeWithAttributes;
  var trainEmployee = S.trainEmployee;
  var trainEmployeeSpec = S.trainEmployeeSpec;
  var restEmployee = S.restEmployee;
  var upgradeBusinessMax = S.upgradeBusinessMax;
  var save = S.save;

  // ========== 事件托管 ==========
  function toggleAutoMode() {
    if (!G) return;
    // 防御：如果 autoMode 不存在则初始化
    if (!G.autoMode) {
      G.autoMode = {
        enabled: false,
        eventDecide: true, eventPreference: 'balanced',
        autoOpenBusiness: true, autoUpgradeBusiness: true, upgradeThreshold: 0.3,
        autoHire: true, autoFire: false, fireThreshold: 20, maxEmployees: 8,
        autoUnlockRegion: true, autoResearch: true,
        autoInvest: false, investBudget: 0.1,
        autoLoan: false, autoRepay: true,
        autoGift: false, giftBudget: 50000,
        autoManualWork: true,
        autoRest: true,
        autoNegotiate: true,
        autoAssetBuy: true,
        autoAssetPawn: true,
        cooldowns: {},
      };
    }
    G.autoMode.enabled = !G.autoMode.enabled;
    SGame.DEBUG && console.log('[DIAG] toggleAutoMode: enabled=' + G.autoMode.enabled + ', autoHire=' + G.autoMode.autoHire + ', autoManualWork=' + G.autoMode.autoManualWork);
    // 初始化托管统计
    if (G.autoMode.enabled) {
      // 初始化托管统计计数器（仅在首次启动托管时创建，字段名需与 initState 一致，避免 NaN）
      if (!G.autoStats) G.autoStats = { startedAt: 0, totalTicks:0, totalIncome:0, totalExpense:0, decisions:0, businessesOpened:0, businessesUpgraded:0, employeesHired:0, employeesFired:0, regionsUnlocked:0, researchesStarted:0, stocksBought:0, stocksSold:0, giftsGiven:0, loansTaken:0, loansRepaid:0, manualWorks:0 };
      G.autoStats.startedAt = Date.now();
      // 开启托管时立即处理已有的 pending decisions
      if (G.autoMode.eventDecide && S.pendingDecisions.length > 0) {
        S.addLog('[托管] 发现 ' + S.pendingDecisions.length + ' 个待处理决策，开始自动处理...');
        let toProcess = S.pendingDecisions.slice();
        toProcess.forEach(function(evt) {
          try { autoDecide(evt); } catch(e) { SGame.DEBUG && console.error('[托管] 处理待决策事件异常:', e); }
        });
      }
    }
    S.addLog(G.autoMode.enabled ? '[托管] 全自动托管已开启' : '[托管] 全自动托管已关闭');
    S.save();
  }

  function setAutoPreference(pref) {
    if (!G) return;
    G.autoMode.eventPreference = pref;
    const names = { aggressive: '激进型', conservative: '保守型', social: '社交型', balanced: '均衡型' };
    S.addLog('[托管] 决策偏好切换为：' + (names[pref] || pref));
    S.save();
  }

  function autoDecide(event) {
    if (!G || !event) return;
    const choices = event.choices;
    if (!choices || choices.length === 0) return;

    // === 自适应权重：根据当前游戏状态动态调整 ===
    const moneyRatio = G.moneyPeak ? Math.max(0, G.money / G.moneyPeak) : 1;
    const stressRatio = Math.min(1, G.stress / 100);
    // 资金紧张时极度重视赚钱，资金充裕时更关注声誉/人脉
    const moneyWeight = 80 * (1 + 2 * (1 - moneyRatio));      // 缺钱时最高 240
    const moneyLossWeight = 60 * (1 + 2 * (1 - moneyRatio));  // 缺钱时最高 180
    const repWeight = 2 * (1 + moneyRatio);                    // 有钱时声誉更重要
    const stressPenalty = 2.5 * (1 + 1.5 * stressRatio);      // 压力越高惩罚越重，最高 6.25
    const stressMulPenalty = 12 * (1 + stressRatio);           // 压力越高乘法惩罚越重
    const connectionWeight = 1.5 * (1 + moneyRatio);           // 有钱时人脉更重要
    const npcWeight = 0.6 * (1 + moneyRatio);

    // 评分每个选项
    const scored = choices.map((c, i) => {
      const eff = c.effect || {};
      let score = 0;

      // 资金效果
      if (eff.money) {
        if (eff.money > 1) score += (eff.money - 1) * moneyWeight;
        else if (eff.money < 1 && eff.money > 0) score -= (1 - eff.money) * moneyLossWeight;
      }
      if (eff.moneyAbs) {
        score += eff.moneyAbs / WAN;
      }

      // 声誉
      if (eff.reputation) score += eff.reputation * repWeight;
      if (eff.reputationMul) {
        if (eff.reputationMul > 1) score += 15 * (1 + moneyRatio * 0.5);
        else score -= 15 / (1 + moneyRatio * 0.5);
      }

      // 压力（负面）
      if (eff.stress) score -= eff.stress * stressPenalty;
      if (eff.stressMul) {
        if (eff.stressMul > 1) score -= stressMulPenalty;
        else score += 6;
      }

      // 人脉
      if (eff.connections) score += eff.connections * connectionWeight;

      // NPC好感度
      if (eff.npcFavor) {
        Object.values(eff.npcFavor).forEach(delta => {
          score += delta * npcWeight;
        });
      }

      // 偏好调整（叠加在自适应权重之上）
      switch (G.autoMode.eventPreference) {
        case 'aggressive':
          if (eff.money && eff.money > 1) score *= 1.4;
          if (eff.moneyAbs && eff.moneyAbs > 0) score *= 1.2;
          break;
        case 'conservative':
          if (eff.stress && eff.stress > 0) score -= eff.stress * (stressPenalty * 0.6);
          if (eff.stressMul && eff.stressMul > 1) score -= stressMulPenalty * 0.6;
          // 保守型：即使没钱也要避免冒险，负资金选项惩罚加倍
          if (eff.money < 1 && eff.money > 0) score -= (1 - eff.money) * moneyLossWeight * 0.5;
          break;
        case 'social':
          if (eff.npcFavor) {
            Object.values(eff.npcFavor).forEach(delta => { score += delta * npcWeight * 1.5; });
          }
          if (eff.connections) score += eff.connections * connectionWeight * 1.3;
          break;
      }

      // 触发结局的选项尽量避免
      if (c.ending) score -= 2000;

      return { idx: i, score, text: c.text };
    });

    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];

    // 执行决策
    S.addLog('[托管] ' + event.title + ' → ' + best.text);

    // 统计
    if (G.autoStats) G.autoStats.decisions++;

    // 从 pending 中移除
    S.pendingDecisions = S.pendingDecisions.filter(d => d !== event);
    // 记录决策结果（供动态难度快照使用）
    S.recordDecisionOutcome(true);

    // 优先用 EventSystem.choose（它会处理效果应用、卡片移除、日志记录）
    if (typeof EventSystem !== 'undefined') {
      // EventSystem.choose 内部用 EVENTS.find 查找，对节日/LLM 事件可能找不到
      // 先尝试调用，如果 choose 无法处理则手动应用
      let foundInEvents = typeof EVENTS !== 'undefined' && EVENTS.find(function(e) { return e.id === event.id; });
      if (foundInEvents) {
        EventSystem.choose(event.id, best.idx);
      } else {
        // 非 EVENTS 事件（节日/LLM 生成），手动应用效果
        let bestChoice = event.choices[best.idx];
        if (bestChoice && bestChoice.effect && typeof EventSystem !== 'undefined' && EventSystem.applyEffects) {
          EventSystem.applyEffects(bestChoice.effect);
        }
        // 记录决策
        G.decisionHistory.push({ eventId: event.id, choice: best.text, tick: G.tickCount });
        if (G.decisionHistory.length > 500) G.decisionHistory = G.decisionHistory.slice(-200);
        // 移除事件卡片
        let card = document.getElementById('event-' + event.id);
        if (card) card.remove();
        // 清理 eventQueue，防止 showDeferredEvents 将已处理事件重新渲染
        if (typeof EventSystem !== 'undefined' && EventSystem.getEventQueue) {
          var eq = EventSystem.getEventQueue();
          for (var i = eq.length - 1; i >= 0; i--) {
            if (eq[i].id === event.id) eq.splice(i, 1);
          }
        }
        // 同步清理 SGame.S.pendingDecisions（与 EventSystem.choose 内逻辑一致）
        if (typeof SGame !== 'undefined' && SGame.S.pendingDecisions && Array.isArray(SGame.S.pendingDecisions)) {
          SGame.S.pendingDecisions = SGame.S.pendingDecisions.filter(function(d) { return d.id !== event.id; });
        }
        // 重新渲染UI
        if (typeof UI !== 'undefined' && UI.renderAll) { try { UI.renderAll(); } catch(e) { SGame.DEBUG && console.warn('[SGame] renderAll failed after event handled:', e.message || e); } }
      }
    }
  }

  // ===================================================
  //  托管引擎 — 自动管理游戏中所有可操作事项
  // ===================================================
  function getGameStage() {
    // 根据资产规模返回游戏阶段：early(早期) / mid(中期) / late(后期)
    if (!G) return 'early';
    if (G.money >= 5000000) return 'late';
    if (G.money >= 500000) return 'mid';
    return 'early';
  }

  // ========== 托管策略注册表 ==========
  const STRATEGIES = [
    { name:'自动决策',   key:'eventDecide',  interval:1,                 guard:() => S.pendingDecisions.length > 0, action:(bLog) => { let evt = S.pendingDecisions[0]; if (evt) autoDecide(evt); } },
    { name:'还款',       key:'repay',        interval:10,                action:(bLog) => autoRepayStrategy(bLog) },
    { name:'区域解锁',   key:'unlock',       intervalFn:() => { var s = getGameStage(); var m = s === 'early' ? 1.5 : s === 'late' ? 0.7 : 1.0; return Math.round(20 * m); }, action:(bLog) => autoUnlockRegionStrategy(bLog) },
    { name:'业务开设',   key:'openBiz',      intervalFn:() => { var s = getGameStage(); var m = s === 'early' ? 1.5 : s === 'late' ? 0.7 : 1.0; return Math.round(10 * m); }, action:(bLog) => autoOpenBusinessStrategy(bLog) },
    { name:'业务升级',   key:'upgrade',      intervalFn:() => { var s = getGameStage(); var m = s === 'early' ? 1.5 : s === 'late' ? 0.7 : 1.0; return Math.round(10 * m); }, action:(bLog) => autoUpgradeStrategy(bLog) },
    { name:'招聘',       key:'hire',         interval:5,                 action:(bLog) => autoHireStrategy(bLog) },
    { name:'解雇',       key:'fire',         interval:30,                action:(bLog) => autoFireStrategy(bLog) },
    { name:'研发',       key:'research',     interval:25,                action:(bLog) => autoResearchStrategy(bLog) },
    { name:'股票',       key:'invest',       interval:20,                action:(bLog) => autoInvestStrategy(bLog) },
    { name:'送礼',       key:'gift',         intervalFn:() => getGameStage() === 'late' ? 10 : 15, action:(bLog) => autoGiftStrategy(bLog) },
    { name:'拉项目',     key:'manualWork',   guard:() => S.getManualWorkCdRemain() === 0,  nocd:true, action:(bLog) => autoManualWorkStrategy() },
    { name:'商务约谈',   key:'negotiate',    interval:30,                action:(bLog) => autoNegotiateStrategy(bLog) },
    { name:'资产投资',   key:'assetBuy',     interval:15,                action:(bLog) => autoAssetBuyStrategy(bLog) },
    { name:'资产典当',   key:'assetPawn',    interval:10,                action:(bLog) => autoAssetPawnStrategy(bLog) },
    { name:'员工休息',   key:'rest',         interval:10,                action:(bLog) => autoRestStrategy(bLog) },
  ];

  function autoManager() {
    if (!G || !G.autoMode || !G.autoMode.enabled) return;
    SGame.DEBUG && console.log('[DIAG] autoManager 被调用, tickCount=' + G.tickCount + ', am=' + JSON.stringify({enabled:G.autoMode.enabled,autoHire:G.autoMode.autoHire,autoManualWork:G.autoMode.autoManualWork}));
    const am = G.autoMode;
    // 防御：确保新字段存在（完整覆盖全部15个策略字段，防止旧存档升级后缺失）
    if (am.eventDecide === undefined) am.eventDecide = true;
    if (am.autoRepay === undefined) am.autoRepay = true;
    if (am.autoUnlockRegion === undefined) am.autoUnlockRegion = true;
    if (am.autoOpenBusiness === undefined) am.autoOpenBusiness = true;
    if (am.autoUpgradeBusiness === undefined) am.autoUpgradeBusiness = true;
    if (am.autoHire === undefined) am.autoHire = true;
    if (am.autoFire === undefined) am.autoFire = false;
    if (am.autoResearch === undefined) am.autoResearch = true;
    if (am.autoInvest === undefined) am.autoInvest = false;
    if (am.autoGift === undefined) am.autoGift = false;
    if (am.autoManualWork === undefined) am.autoManualWork = true;
    if (am.autoNegotiate === undefined) am.autoNegotiate = true;
    if (am.autoAssetBuy === undefined) am.autoAssetBuy = true;
    if (am.autoAssetPawn === undefined) am.autoAssetPawn = true;
    if (am.autoRest === undefined) am.autoRest = true;
    am.cooldowns = am.cooldowns || {};
    const now = G.tickCount;
    const cd = (key, interval) => (am.cooldowns[key] && (now - am.cooldowns[key]) < interval);
    const setCd = (key) => { am.cooldowns[key] = now; };

    // 初始化统计（兜底初始化，字段名必须与 initState 中的 autoStats 保持一致，否则计数器累计到未定义的字段将产生 NaN）
    if (!G.autoStats) G.autoStats = { startedAt:Date.now(), totalTicks:0, totalIncome:0, totalExpense:0, decisions:0, businessesOpened:0, businessesUpgraded:0, employeesHired:0, employeesFired:0, regionsUnlocked:0, researchesStarted:0, stocksBought:0, stocksSold:0, giftsGiven:0, loansTaken:0, loansRepaid:0, manualWorks:0 };
    G.autoStats.totalTicks++;

    // 阶段自适应冷却倍率
    var stage = getGameStage();
    var stageCDMult = stage === 'early' ? 1.5 : stage === 'late' ? 0.7 : 1.0;

    // === 日志批量合并 ===
    let batchLogs = [];

    function bLog(msg) { batchLogs.push(msg); }
    function flushBatch() {
      if (batchLogs.length === 0) return;
      if (batchLogs.length === 1) { S.addLog(batchLogs[0]); }
      else { S.addLog('[托管] ' + batchLogs.length + '项操作：' + batchLogs.join('；')); }
      batchLogs = [];
    }

    // 安全执行包装：防止单个策略崩溃阻断后续所有策略
    function safeRun(label, fn) {
      try { fn(); }
      catch(e) { SGame.DEBUG && console.error('[托管] ' + label + ' 异常:', e); }
    }

    // === 就绪堆调度：首次调用时用 STRATEGIES 初始化堆 ===
    if (S._strategyHeap.length === 0) {
      for (var i = 0; i < STRATEGIES.length; i++) {
        var s0 = STRATEGIES[i];
        var initInterval = s0.interval || 1;
        if (s0.intervalFn) { try { initInterval = s0.intervalFn(); } catch(e) { SGame.DEBUG && console.error('[autoManager] intervalFn init error for ' + s0.name + ':', e); } }
        S._strategyHeap.push({ key: s0.key, name: s0.name, nextTick: 0, interval: initInterval });
      }
    }

    // 堆排序：按 nextTick 升序（越小越优先）
    S._strategyHeap.sort(function(a, b) { return a.nextTick - b.nextTick; });

    // 就绪堆主循环：每次取堆顶（最早到期者）调度
    var _iter = 0;
    var _MAX_ITER = 100;
    while (S._strategyHeap.length > 0 && _iter < _MAX_ITER) {
      _iter++;
      var heapTop = S._strategyHeap[0];
      // 堆顶尚未到期，停止调度
      if (heapTop.nextTick > now) break;
      S._strategyHeap.shift();

      // 根据 key 查找对应策略
      var s = null;
      for (var k = 0; k < STRATEGIES.length; k++) {
        if (STRATEGIES[k].key === heapTop.key) { s = STRATEGIES[k]; break; }
      }
      if (!s) continue;

      // 检查是否启用（映射 s.key → am 字段名）
      var keyMap = { hire:'autoHire',fire:'autoFire',repay:'autoRepay',unlock:'autoUnlockRegion',openBiz:'autoOpenBusiness',upgrade:'autoUpgradeBusiness',research:'autoResearch',invest:'autoInvest',gift:'autoGift',manualWork:'autoManualWork',negotiate:'autoNegotiate',assetBuy:'autoAssetBuy',assetPawn:'autoAssetPawn',rest:'autoRest' };
      var amKey = keyMap[s.key] || s.key;
      if (am[amKey] === false) {
        SGame.DEBUG && console.log('[DIAG] 策略 ' + s.name + ' 被禁用(am[amKey]=false)');
        heapTop.nextTick = now + Math.max(heapTop.interval, 10);
        S._strategyHeap.push(heapTop);
        S._strategyHeap.sort(function(a, b) { return a.nextTick - b.nextTick; });
        continue;
      }
      // 检查附加守卫条件
      if (s.guard) {
        var guardPassed = false;
        try { guardPassed = s.guard(); } catch(e) { SGame.DEBUG && console.error('[autoManager] guard error for ' + s.name + ':', e); }
        if (!guardPassed) {
          SGame.DEBUG && console.log('[DIAG] 策略 ' + s.name + ' guard失败');
          heapTop.nextTick = now + Math.max(heapTop.interval, 10);
          S._strategyHeap.push(heapTop);
          S._strategyHeap.sort(function(a, b) { return a.nextTick - b.nextTick; });
          continue;
        }
      }

      // 重新计算 interval（支持动态 intervalFn）
      var interval = s.interval || 1;
      if (s.intervalFn) { try { interval = s.intervalFn(); } catch(e) { SGame.DEBUG && console.error('[autoManager] intervalFn runtime error for ' + s.name + ':', e); } }
      heapTop.interval = interval;

      // CD 后备检查（nocd 策略跳过）
      if (!s.nocd && cd(s.key, interval)) {
        SGame.DEBUG && console.log('[DIAG] 策略 ' + s.name + ' CD检查失败, interval=' + interval);
        heapTop.nextTick = now + Math.max(interval, 10);
        S._strategyHeap.push(heapTop);
        S._strategyHeap.sort(function(a, b) { return a.nextTick - b.nextTick; });
        continue;
      }

      // 执行策略
      safeRun(s.name, function() {
        SGame.DEBUG && console.log('[DIAG] 策略执行: ' + s.name);
        s.action(bLog);
        if (!s.nocd) { setCd(s.key); }
        S._strategyRuntime[s.key] = { tick: now, time: Date.now(), name: s.name, result: 'ok' };
      });

      // 更新 nextTick 后放回堆
      heapTop.nextTick = now + interval;
      S._strategyHeap.push(heapTop);
      S._strategyHeap.sort(function(a, b) { return a.nextTick - b.nextTick; });
    }

    flushBatch();

    // 统一持久化：所有策略修改的状态写入存储
    S.save();

    // 统一标记脏模块，确保所有面板在策略修改状态后刷新
    if (typeof UI !== 'undefined' && UI.markDirty) {
      UI.markDirty('dashboard');
      UI.markDirty('businesses');
      UI.markDirty('employees');
      UI.markDirty('assets');
      UI.markDirty('stocks');
      UI.markDirty('research');
      UI.markDirty('regions');
      UI.markDirty('npcs');
    }
  }

  // 托管：自动购买资产（资金充裕时）- 改用ID
  function autoAssetBuyStrategy(bLog) {
    if (!G || !G.assetMarketListings || G.assetMarketListings.length === 0) { SGame.DEBUG && console.log('[DIAG] autoAssetBuy 跳过: 资产市场列表为空'); return; }
    let slotCap = (typeof CONFIG !== 'undefined' && CONFIG.ASSET_MAX_SLOTS) || 20;
    if (G.assets.length >= slotCap) { SGame.DEBUG && console.log('[DIAG] autoAssetBuy 跳过: 仓位已满, assets=' + G.assets.length + ' cap=' + slotCap); return; }
    // 至少保留30%流动资金
    let reserveRatio = 0.3;
    let totalIncome = typeof S.calcTotalIncome === 'function' ? S.calcTotalIncome() : 0;
    let reserve = totalIncome * 10;

    let boughtCount = 0;
    const MAX_BUY = 3;
    for (let round = 0; round < MAX_BUY; round++) {
      if (G.assets.length >= slotCap) break;
      let available = G.money - reserve;
      if (available <= 0) break;
      let bestIdx = -1;
      let bestScore = -1;
      for (let i = 0; i < G.assetMarketListings.length; i++) {
        let l = G.assetMarketListings[i];
        if (l.price > available * 0.5) continue;
        let score = (l.trend || 0.003) * 100 - (l.volatility || 0.05) * 20 + (l.rarity === 'epic' ? 0.3 : l.rarity === 'rare' ? 0.2 : 0);
        if (score > bestScore) { bestScore = score; bestIdx = i; }
      }
      if (bestIdx >= 0 && S.buyAsset(bestIdx)) {
        let lastAsset = G.assets[G.assets.length - 1];
        bLog('购入资产：' + (lastAsset ? lastAsset.name : '未知'));
        boughtCount++;
      } else {
        break;
      }
    }
  }

  // 托管：紧急典当（资金窘迫时）- 改用ID
  function autoAssetPawnStrategy(bLog) {
    if (!G || G.assets.length === 0) { SGame.DEBUG && console.log('[DIAG] autoAssetPawn 跳过: 无资产可典当'); return; }
    let totalExpense = typeof calcTotalExpense === 'function' ? calcTotalExpense() : 0;
    if (G.money > totalExpense * 2) { SGame.DEBUG && console.log('[DIAG] autoAssetPawn 跳过: 资金充裕无需典当, money=' + G.money + ' expense*2=' + (totalExpense * 2)); return; }
    let worstIdx = -1;
    let worstVal = Infinity;
    for (let i = 0; i < G.assets.length; i++) {
      let inAuction = G.assetAuctionList && G.assetAuctionList.some(function(a) { return a.assetId === G.assets[i].id; });
      if (inAuction) continue;
      let cv = G.assets[i].currentPrice || G.assets[i].purchasePrice;
      if (cv < worstVal) { worstVal = cv; worstIdx = i; }
    }
    if (worstIdx >= 0) {
      let ast = G.assets[worstIdx];
      if (S.pawnAsset(ast.id)) {
        bLog('典当救急：' + ast.name);
      }
    }
  }

  function autoRepayStrategy(bLog) {
    if (!G || !G.loans || G.loans.length === 0) return;
    G.loans.forEach(loan => {
      if (loan.repaid) return;
      const totalDue = loan.amount + loan.interestPerTick * loan.remaining;
      if (loan.remaining <= 12 && G.money >= totalDue * 1.2) {
        G.money -= totalDue;
        loan.repaid = true;
        bLog('还款 ' + S.formatMoney(totalDue));
        if (G.autoStats) G.autoStats.loansRepaid++;
      }
    });
    G.loans = G.loans.filter(l => !l.repaid);
  }

  function autoUnlockRegionStrategy(bLog) {
    if (!G) return;
    const cityId = G.currentCityId;
    const cityDef = CITIES[cityId];
    if (!cityDef) { SGame.DEBUG && console.log('[DIAG] autoUnlockRegion 跳过: cityDef缺失, cityId=' + cityId); return; }
    var _unlockCount = 0;
    Object.values(REGIONS).forEach(r => {
      if (r.unlocked || G.unlockedRegions.includes(r.id)) return;
      if (r.cityId !== cityId) return;
      if (r.actUnlock > 0 && G.act < r.actUnlock) return;
      if (r.unlockCond && r.unlockCond.money && G.money >= r.unlockCond.money) {
        S.unlockRegion(r.id);
        _unlockCount++;
        bLog(r.icon + ' 解锁 ' + r.name);
        if (G.autoStats) G.autoStats.regionsUnlocked++;
      }
    });
    if (_unlockCount === 0) { SGame.DEBUG && console.log('[DIAG] autoUnlockRegion 跳过: 无可解锁区域, money=' + G.money + ' act=' + G.act); }
  }

  function autoOpenBusinessStrategy(bLog) {
    if (!G) return;
    // 二次确认：资金是否仍充裕（前序策略可能已大幅消耗资金）
    if (G.money < 50000) return;

    // 遍历所有已解锁城市，寻找可开业的业务
    const candidates = [];

    Object.entries(G.cities).forEach(([cityId, cityData]) => {
      if (!cityData || !cityData.unlocked) return;
      const cityDef = CITIES[cityId];
      if (!cityDef) return;
      const cityRegions = cityDef.regionIds || [];
      const unlockedRegions = cityRegions.filter(rid => {
        const r = REGIONS[rid];
        return r && (r.unlocked || G.unlockedRegions.includes(rid));
      });
      if (unlockedRegions.length === 0) return;

      if (!cityData.businesses) return;
      BUSINESS_DEFS.forEach(bDef => {
        const state = cityData.businesses[bDef.id];
        if (!state || state.level > 0 || !state.unlocked) return;
        const lv1 = bDef.levels[0];
        if (!lv1) return;
        let bestScore = 0, bestRegion = null;
        unlockedRegions.forEach(rid => {
          const r = REGIONS[rid];
          let score = lv1.income;
          if (r.bonus.retail && bDef.id === 'retail') score *= r.bonus.retail;
          if (r.bonus.tech && bDef.id === 'tech') score *= r.bonus.tech;
          if (r.bonus.finance && (bDef.id === 'fund' || bDef.id === 'office')) score *= r.bonus.finance;
          if (r.bonus.repGain) score *= (1 + (r.bonus.repGain - 1) * 0.3);
          if (score > bestScore) { bestScore = score; bestRegion = rid; }
        });
        if (bestRegion) {
          let cost = (lv1.cost || 0) * WAN;
          if (G.origin === 'rich2nd') cost = Math.floor(cost * 0.8);
          candidates.push({ bizId: bDef.id, name: bDef.name, icon: bDef.icon, score: bestScore, region: bestRegion, cost, cityId });
        }
      });
    });

    candidates.sort((a, b) => b.score - a.score);
    let openedCount = 0;
    const MAX_OPEN = 5;
    for (const c of candidates) {
      if (openedCount >= MAX_OPEN) break;
      if (G.money >= c.cost * 1.5) {
        if (c.cost > 0) G.money -= c.cost;
        // 在对应城市中开业
        let targetCity = G.cities && G.cities[c.cityId];
        if (targetCity && targetCity.businesses) {
          targetCity.businesses[c.bizId] = targetCity.businesses[c.bizId] || { level: 0, region: null, unlocked: true };
          targetCity.businesses[c.bizId].level = 1;
          targetCity.businesses[c.bizId].region = c.region;
          targetCity.businesses[c.bizId].unlocked = true;
          // 若在当前城市开业，同步到 G.businesses 防止下个 tick syncCityBiz 覆盖
          if (c.cityId === G.currentCityId) {
            if (!G.businesses) G.businesses = {};
            G.businesses[c.bizId] = { level: 1, region: c.region, unlocked: true };
          }
        }
        bLog(c.icon + ' 开业 ' + c.name);
        if (G.autoStats) G.autoStats.businessesOpened++;
        openedCount++;
      }
    }
  }

  function autoUpgradeStrategy(bLog) {
    if (!G) return;
    // 二次确认：资金是否仍充裕（前序策略可能已大幅消耗资金）
    if (G.money < 10000) { SGame.DEBUG && console.log('[DIAG] autoUpgrade 跳过: 资金不足, money=' + G.money); return; }
    const candidates = [];

    // 遍历所有已解锁城市的业务
    if (G.cities) {
      Object.entries(G.cities).forEach(function([cityId, cityData]) {
        if (!cityData || !cityData.unlocked || !cityData.businesses) return;
        BUSINESS_DEFS.forEach(function(bDef) {
          const state = cityData.businesses[bDef.id];
          if (!state || state.level === 0 || state.level >= bDef.levels.length) return;
          const curLv = bDef.levels[state.level - 1];
          const nextLv = bDef.levels[state.level];
          if (!curLv || !nextLv) return;
          const cost = nextLv.cost * WAN;
          const incomeGain = (nextLv.income - curLv.income) * WAN;
          if (cost <= 0) return;
          const roi = incomeGain / cost;
          candidates.push({ bizId: bDef.id, name: bDef.name, icon: bDef.icon, cost, roi, nextLv, cityId });
        });
      });
    }

    candidates.sort((a, b) => b.roi - a.roi);
    const stage = getGameStage();
    // 阶段自适应阈值：早期更保守（留更多现金），后期更激进
    const baseThreshold = G.autoMode.upgradeThreshold || 0.3;
    const stageMult = stage === 'early' ? 0.7 : stage === 'late' ? 1.3 : 1.0;
    const threshold = baseThreshold * stageMult;

    let upgradedCount = 0;
    const MAX_UPGRADE = 5;
    for (const c of candidates) {
      if (upgradedCount >= MAX_UPGRADE) break;
      let cost = c.cost;
      if (G.origin === 'rich2nd') cost = Math.floor(cost * 0.8);
      if (G.money >= cost / threshold) {
        G.money -= cost;
        // 升级对应城市的业务
        let targetCity = G.cities && G.cities[c.cityId];
        if (targetCity && targetCity.businesses && targetCity.businesses[c.bizId]) {
          targetCity.businesses[c.bizId].level++;
          // 若在当前城市升级，同步到 G.businesses 防止下个 tick syncCityBiz 覆盖
          if (c.cityId === G.currentCityId && G.businesses && G.businesses[c.bizId]) {
            G.businesses[c.bizId].level = targetCity.businesses[c.bizId].level;
          }
        }
        bLog(c.icon + ' 升级 ' + c.name + '→' + c.nextLv.name);
        if (G.autoStats) G.autoStats.businessesUpgraded++;
        upgradedCount++;
      }
    }
  }

  function autoHireStrategy(bLog) {
    SGame.DEBUG && console.log('[DIAG] autoHireStrategy 入口, emp=' + (G ? G.employees.length : 'null') + ' max=' + (G ? S.getEmpMax() : 'null') + ' autoHire=' + (G && G.autoMode ? G.autoMode.autoHire : 'null'));
    if (!G) return;
    // 二次确认：员工数是否仍在阈值以下（前序策略可能已触发招聘）
    if (G.employees.length >= S.getEmpMax()) { SGame.DEBUG && console.log('[DIAG] autoHire 跳过: 员工已满 emp=' + G.employees.length + ' max=' + S.getEmpMax()); return; }
    // 招聘不检查金钱（与手动UI招聘一致）
    // HR 统管模式
    if (S.isHRManaged()) {
      const depts = S.calcDeptStats();
      const entries = Object.entries(depts).sort((a, b) => a[1].count - b[1].count);
      for (const [roleId, stats] of entries) {
        const result = S.batchHireDept(roleId, stats.count + 2);
        if (result.ok && result.hired > 0) {
          if (G.autoStats) G.autoStats.employeesHired += result.hired;
          bLog('招聘 ' + result.hired + '人');
          return;
        }
      }
      return;
    }
    // 批量招聘：托管模式下资金充足时积极扩张，单次最多招聘 8 人
    const MAX_BATCH = 8;
    let batchHired = 0;
    for (let bi = 0; bi < MAX_BATCH; bi++) {
      if (G.employees.length >= S.getEmpMax()) { SGame.DEBUG && console.log('[DIAG] autoHire 批量停止: 员工已满'); break; }
      const stage = getGameStage();
      let priorityRoles;
      if (stage === 'early') {
        priorityRoles = ['intern', 'sales', 'developer', 'marketer', 'analyst', 'designer', 'manager', 'hr', 'lawyer', 'finance_emp'];
      } else if (stage === 'mid') {
        priorityRoles = ['developer', 'sales', 'manager', 'marketer', 'analyst', 'hr', 'finance_emp', 'lawyer', 'designer', 'intern'];
      } else {
        priorityRoles = ['manager', 'developer', 'cto', 'lawyer', 'finance_emp', 'analyst', 'hr', 'marketer', 'sales', 'designer'];
      }
      let chosenRole = null;
      for (const rid of priorityRoles) {
        const def = EMP_ROLES.find(r => r.id === rid);
        if (!def) continue;
        // 检查角色前置条件
        if (def.req) {
          if (def.req.empCount && G.employees.length < def.req.empCount) continue;
          if (def.req.money && G.money < def.req.money) continue;
          if (def.req.techLv && (G.completedResearch && G.completedResearch.digital || 0) < def.req.techLv) continue;
          if (def.req.business) {
            let hasBiz = false;
            if (G.cities) {
              Object.values(G.cities).forEach(city => {
                if (!city.unlocked || !city.businesses) return;
                Object.values(city.businesses).forEach(biz => {
                  if (biz.type === def.req.business && biz.level > 0) hasBiz = true;
                });
              });
            }
            if (!hasBiz) continue;
          }
        }
        chosenRole = def; break;
      }
      // 如果按优先级没找到合适角色，随机选一个满足前置条件的
      if (!chosenRole) {
        const candidates = EMP_ROLES.filter(r => {
          if (r.req) {
            if (r.req.empCount && G.employees.length < r.req.empCount) return false;
            if (r.req.money && G.money < r.req.money) return false;
            if (r.req.techLv && (G.completedResearch && G.completedResearch.digital || 0) < r.req.techLv) return false;
            if (r.req.business) {
              let hasBiz = false;
              if (G.cities) {
                Object.values(G.cities).forEach(city => {
                  if (!city.unlocked || !city.businesses) return;
                  Object.values(city.businesses).forEach(biz => {
                    if (biz.type === r.req.business && biz.level > 0) hasBiz = true;
                  });
                });
              }
              if (!hasBiz) return false;
            }
          }
          return true;
        });
        if (candidates.length === 0) { SGame.DEBUG && console.log('[DIAG] autoHire 批量: 候选池为空, stage=' + getGameStage() + ', emp=' + G.employees.length + ', money=' + G.money); break; }
        chosenRole = candidates[Math.floor(Math.random() * candidates.length)];
      }
      // 生成带属性的员工
      const newEmp = S.generateEmployeeWithAttributes(chosenRole, G);
      // 扣除招聘费用（与 batchHireDept 对齐：2倍月薪）
      const actualSalary = calcActualSalary(chosenRole.baseSalary, G);
      const hireCost = actualSalary * WAN * 2;
      if (G.money < hireCost) { SGame.DEBUG && console.log('[DIAG] autoHire 批量停止: 资金不足 money=' + G.money + ' hireCost=' + hireCost); break; }
      G.money -= hireCost;
      G.employees.push(newEmp);

      // 尝试用 LLM 生成员工背景（异步，不阻塞）
      if (typeof LLM !== 'undefined' && LLM.generateEmployeeBackground) {
        LLM.generateEmployeeBackground(chosenRole.name).then(function(bg) {
          if (bg) { newEmp.background = bg; S.save(); }
        }).catch(function(e) { if (SGame.DEBUG) SGame.DEBUG && console.error("[core] employee background gen failed:", e && e.message); });
      }

      bLog('招聘 ' + newEmp.name + '（' + chosenRole.name + '）');
      SGame.DEBUG && console.log('[DIAG] autoHire 成功: 招聘 ' + newEmp.name + ' (' + chosenRole.name + '), cost=' + hireCost + ', emp总数=' + (G.employees.length));
      if (G.autoStats) G.autoStats.employeesHired++;
      batchHired++;
    }
    if (batchHired > 0) {
      S.save();
      if (typeof UI !== 'undefined' && UI.markDirty) {
        UI.markDirty('dashboard');
        UI.markDirty('employees');
      }
    }
  }

  function autoFireStrategy(bLog) {
    if (!G || G.employees.length <= 2) return;
    if (S.isHRManaged()) return;
    const threshold = G.autoMode.fireThreshold || 20;
    const toFire = G.employees.filter(e => e.loyalty < threshold);
    if (toFire.length === 0) return;
    toFire.sort((a, b) => a.loyalty - b.loyalty);
    const emp = toFire[0];
    const actualSalary = calcActualSalary(emp.baseSalary || emp.salary, G);
    const effectiveSalary = S.calcInternSalary(emp, actualSalary);
    const comp = effectiveSalary * 3 * WAN;
    if (G.money < comp) return;
    G.money -= comp;
    G.employees = G.employees.filter(e => e.id !== emp.id);
    G.employeesFired = (G.employeesFired || 0) + 1;
    bLog('解雇 ' + emp.name + '（忠诚' + emp.loyalty.toFixed(0) + '）');
    if (G.autoStats) G.autoStats.employeesFired++;
  }

  function autoResearchStrategy(bLog) {
    if (!G || G.activeResearch) { SGame.DEBUG && console.log('[DIAG] autoResearch 跳过: ' + (G && G.activeResearch ? '已有研发进行中' : 'G不存在')); return; }
    // === 智能路线选择：根据游戏阶段和需求动态排序 ===
    const stage = getGameStage();
    let routes = ['digital', 'ai', 'blockchain'];
    // 现金流紧张 → 优先数字化（降薪）
    if (stage === 'early' || G.money < (G.moneyPeak || G.money) * 0.3) {
      routes = ['digital', 'ai', 'blockchain'];
    } else if (stage === 'mid') {
      // 中期均衡推进
      routes = ['digital', 'blockchain', 'ai'];
    } else {
      // 后期优先 AI（全收入加成）
      routes = ['ai', 'digital', 'blockchain'];
    }
    // 技术属性高时提升区块链优先级
    if (G.stats && G.stats.tech >= 6) {
      routes = ['blockchain'].concat(routes.filter(function(r) { return r !== 'blockchain'; }));
    }
    for (let i = 0; i < routes.length; i++) {
      let rid = routes[i];
      const tree = TECH_TREE[rid];
      if (!tree || !tree.levels) continue;
      const curLevel = G.completedResearch[rid] || 0;
      if (curLevel >= tree.levels.length) continue;
      const nextLvl = tree.levels[curLevel];
      if (G.rpt >= nextLvl.rptCost && G.money >= nextLvl.moneyCost * 1.5) {
        window.SGame.startResearch(rid);
        bLog('研发 ' + tree.name + ' Lv' + (curLevel+1));
        if (G.autoStats) G.autoStats.researchesStarted++;
        return;
      }
    }
    SGame.DEBUG && console.log('[DIAG] autoResearch 跳过: 所有路线资源不足, rpt=' + (G.rpt||0) + ' money=' + (G.money||0));
  }

  function autoInvestStrategy(bLog) {
    if (!G) return;
    const budget = G.money * (G.autoMode.investBudget || 0.1);
    // 阶段自适应预算阈值：早期降低门槛，让小额资金也能入市
    var _invStage = getGameStage();
    var _invBudgetMin = _invStage === 'early' ? 3000 : _invStage === 'mid' ? 7000 : 10000;
    if (budget < _invBudgetMin) { SGame.DEBUG && console.log('[DIAG] autoInvest 跳过: 预算不足, budget=' + budget + ' min=' + _invBudgetMin); return; }
    const stage = getGameStage();

    // === 卖出：考虑近期趋势，不止看涨幅 ===
    Object.entries(G.stocks).forEach(([sid, holding]) => {
      if (!holding || holding.shares <= 0) return;
      const price = G.stockPrices[sid] || STOCKS[sid]?.basePrice || 0;
      if (holding.avgCost <= 0) return;
      const profitPct = (price - holding.avgCost) / holding.avgCost;
      // 阶段自适应卖出阈值：早期见好就收(15%)，后期持有更久(30%)
      const sellThreshold = stage === 'early' ? 0.15 : stage === 'mid' ? 0.25 : 0.35;
      // 检查近期趋势：如果还在涨就不急着卖
      const recentChange = G.stockChangeLog && G.stockChangeLog[sid] ? G.stockChangeLog[sid] : 0;
      const stillRising = recentChange > 1; // 最近一次波动涨幅 > 1%

      if (profitPct >= sellThreshold && !stillRising) {
        const revenue = price * holding.shares;
        G.money += revenue;
        G.stockProfitTotal = (G.stockProfitTotal || 0) + (revenue - holding.avgCost * holding.shares);
        delete G.stocks[sid];
        bLog('卖出 ' + (STOCKS[sid]?.name || sid) + ' +' + (profitPct * 100).toFixed(1) + '%');
        if (G.autoStats) G.autoStats.stocksSold++;
      }
    });

    // === 买入：更严格的折价要求 + 行业分散 ===
    const alreadyHeld = Object.keys(G.stocks).length;
    const maxStocks = stage === 'early' ? 2 : stage === 'mid' ? 4 : 6;
    if (alreadyHeld >= maxStocks) return;

    const cheapStocks = [];
    Object.entries(STOCKS).forEach(([sid, stock]) => {
      // 跳过已持有的股票，避免过度集中
      if (G.stocks[sid] && G.stocks[sid].shares > 0) return;
      const price = G.stockPrices[sid] || stock.basePrice;
      // 阶段自适应买入阈值：早期更谨慎
      const buyDiscount = stage === 'early' ? 0.90 : stage === 'mid' ? 0.93 : 0.97;
      if (price < stock.basePrice * buyDiscount) {
        cheapStocks.push({ sid, name: stock.name, price, discount: (stock.basePrice - price) / stock.basePrice, industry: stock.industry || 'other' });
      }
    });
    if (cheapStocks.length === 0) return;
    cheapStocks.sort((a, b) => b.discount - a.discount);

    // 行业分散：优先选不同行业的股票
    const pickedIndustries = {};
    const picks = [];
    for (const s of cheapStocks) {
      if (picks.length >= 3) break;
      if (pickedIndustries[s.industry] && picks.length < cheapStocks.length) continue; // 已有同行业，跳过
      picks.push(s);
      pickedIndustries[s.industry] = true;
    }
    if (picks.length === 0) return;
    const perBudget = budget / picks.length;
    picks.forEach(p => {
      const shares = Math.floor(perBudget / p.price);
      if (shares >= 10 && G.money >= p.price * shares) {
        window.SGame.buyStock(p.sid, shares);
        if (G.autoStats) G.autoStats.stocksBought++;
      }
    });
  }

  function autoGiftStrategy(bLog) {
    if (!G || !G.npcFavor) return;
    // 阶段自适应送礼资金门槛：早期低门槛鼓励社交，后期恢复原值
    var _giftStage = getGameStage();
    var _giftMult = _giftStage === 'early' ? 0.5 : _giftStage === 'late' ? 1.5 : 1.0;
    if (G.money < (G.autoMode.giftBudget || 50000) * _giftMult) { SGame.DEBUG && console.log('[DIAG] autoGift 跳过: 资金不足, money=' + G.money + ' required=' + ((G.autoMode.giftBudget || 50000) * _giftMult)); return; }
    // 按好感度排序，只考虑今天还没送过的 NPC
    let candidates = [];
    Object.entries(G.npcFavor).forEach(function(entry) {
      let npcId = entry[0], favor = entry[1];
      let npc = NPCS[npcId];
      if (!npc || (npc.actUnlock || 0) > G.act) return;
      // 检查每日冷却（通过 NPC 系统）
      if (typeof NPCSystem !== 'undefined' && !NPCSystem.canGiftToday(npcId)) return;
      candidates.push({ npcId: npcId, npc: npc, favor: favor });
    });
    if (candidates.length === 0) return;
    candidates.sort(function(a, b) { return a.favor - b.favor; });
    let target = candidates[0];
    if (target.favor >= 80) return; // 好感够高了，不送

    // 根据 NPC 偏好选择礼物类型
    let prefs = target.npc.giftPreferences || {};
    let giftTypes = ['wine', 'book', 'art', 'tech', 'luxury'];
    let chosenGift = null;
    // 优先选最爱的，其次喜欢的
    if (prefs.love && prefs.love.length > 0) chosenGift = prefs.love[0];
    else if (prefs.like && prefs.like.length > 0) chosenGift = prefs.like[0];
    else chosenGift = giftTypes[Math.floor(Math.random() * giftTypes.length)];

    // 调用 NPC 系统的送礼方法（含每日冷却、偏好计算、联动传播）
    if (typeof NPCSystem !== 'undefined' && typeof NPCSystem.giveGift === 'function') {
      let result = NPCSystem.giveGift(target.npcId, chosenGift);
      if (result.ok) {
        bLog('送礼 ' + target.npc.name);
        if (G.autoStats) G.autoStats.giftsGiven++;
      }
    }
  }

  function autoLoanStrategy(bLog) {
    if (!G || G.loans.length >= 3) return;
    const totalSalary = G.employees.reduce((s, e) => s + calcActualSalary(e.baseSalary || e.salary, G) * WAN, 0);
    // 阶段自适应：早期更保守，仅在被逼无奈时贷款
    const stage = getGameStage();
    const loanThreshold = stage === 'early' ? 1.5 : stage === 'mid' ? 2.5 : 2.0;
    if (G.money > totalSalary * loanThreshold) return;
    const totalAssets = G.money + (typeof window.SGame.getStockPortfolioValue === 'function' ? window.SGame.getStockPortfolioValue() : 0);
    // 早期少借，后期可以借更多
    const loanRatio = stage === 'early' ? 0.08 : stage === 'mid' ? 0.12 : 0.18;
    const loanAmt = Math.floor(totalAssets * loanRatio);
    if (loanAmt < 50000) return;
    S.applyLoan(loanAmt, 60);
    bLog('贷款 ' + S.formatMoney(loanAmt));
    if (G.autoStats) G.autoStats.loansTaken++;
  }

  // 自动休息策略：疲劳>60的员工自动休息，每10tick检查
  function autoRestStrategy(bLog) {
    if (!G) return;
    let rested = [];
    G.employees.forEach(function(emp) {
      if ((emp.fatigue || 0) > 60 && G.money >= 5000) {
        G.money -= 5000;
        emp.fatigue = Math.max(0, (emp.fatigue || 0) - 30);
        emp.happiness = Math.min(100, (emp.happiness || 50) + 10);
        rested.push(emp.name);
      }
    });
    if (rested.length > 0) {
      bLog('😴 休息 ' + rested.join('、'));
    }
  }

  // 自动拉项目策略：与UI按钮逻辑完全同步，CD归零即触发（wall-clock判断）
  function autoManualWorkStrategy() {
    SGame.DEBUG && console.log('[DIAG] autoManualWorkStrategy 入口, money=' + (G ? G.money : 'null') + ' cdRemain=' + (G ? S.getManualWorkCdRemain() : 'null') + ' autoManualWork=' + (G && G.autoMode ? G.autoMode.autoManualWork : 'null'));
    if (!G) return;
    if (!G.autoMode || !G.autoMode.autoManualWork) return;
    // 直接调用 manualWork()，它内部会检查 manualWorkCdUntil 并设置新 CD
    // 此时 S.getManualWorkCdRemain() === 0 已由上层保证，等同于按钮可点击
    const result = S.manualWork();
    SGame.DEBUG && console.log('[DIAG] autoManualWork result:', JSON.stringify(result));
    if (result && result.success && result.earn > 0) {
      if (G.autoStats) { G.autoStats.manualWorks++; G.autoStats.totalIncome += result.earn; }
      S.addLog('[托管] 🤝 自动拉项目 +' + S.formatMoney(result.earn));
      if (typeof UI !== 'undefined' && UI.markDirty) { UI.markDirty('dashboard'); }
      if (typeof UI !== 'undefined' && UI.renderManualButton) {
        try { UI.renderManualButton(); } catch(e) { SGame.DEBUG && console.warn('[SGame] autoMode: renderManualButton failed:', e.message || e); }
      }
      if (typeof UI !== 'undefined' && UI.startCdTimer) {
        try { UI.startCdTimer(); } catch(e) { SGame.DEBUG && console.warn('[SGame] autoMode: startCdTimer failed:', e.message || e); }
      }
    }
  }

  // 托管：自动NPC商务约谈（每60 tick检查一次，与高好感NPC谈判获取收益）
  function autoNegotiateStrategy(bLog) {
    if (!G || !G.npcFavor) return;
    // 阶段自适应好感门槛：早期低门槛鼓励约谈，后期提高防止刷关系
    var _negoStage = getGameStage();
    var _negoThreshold = _negoStage === 'early' ? 15 : _negoStage === 'mid' ? 30 : 50;
    let eligibleNpcIds = Object.entries(G.npcFavor)
      .filter(function(e) { return e[1] > _negoThreshold; })
      .map(function(e) { return e[0]; });
    if (eligibleNpcIds.length === 0) { SGame.DEBUG && console.log('[DIAG] autoNegotiate 跳过: 无NPC好感>' + _negoThreshold); return; }
    let npcId = eligibleNpcIds[Math.floor(Math.random() * eligibleNpcIds.length)];
    if (typeof NPCSystem !== 'undefined' && typeof NPCSystem.negotiate === 'function') {
      NPCSystem.negotiate(npcId, 'business');
      _npcBonusDirty = true;
      let npcName = (NPCS[npcId] && NPCS[npcId].name) || npcId;
      bLog('💼 与' + npcName + '商务约谈');
    }
  }



  // ===================================================
  //  联动：新闻→股票
  // ===================================================
  // ========== 挂载到 SGame ==========
  S.getGameStage = getGameStage;
  S.toggleAutoMode = toggleAutoMode;
  S.setAutoPreference = setAutoPreference;
  S.autoDecide = autoDecide;
  S.autoManager = autoManager;
  S.autoAssetBuyStrategy = autoAssetBuyStrategy;
  S.autoAssetPawnStrategy = autoAssetPawnStrategy;
  S.autoRepayStrategy = autoRepayStrategy;
  S.autoUnlockRegionStrategy = autoUnlockRegionStrategy;
  S.autoOpenBusinessStrategy = autoOpenBusinessStrategy;
  S.autoUpgradeStrategy = autoUpgradeStrategy;
  S.autoHireStrategy = autoHireStrategy;
  S.autoFireStrategy = autoFireStrategy;
  S.autoResearchStrategy = autoResearchStrategy;
  S.autoInvestStrategy = autoInvestStrategy;
  S.autoGiftStrategy = autoGiftStrategy;
  S.autoLoanStrategy = autoLoanStrategy;
  S.autoRestStrategy = autoRestStrategy;
  S.autoManualWorkStrategy = autoManualWorkStrategy;
  S.autoNegotiateStrategy = autoNegotiateStrategy;
})();
