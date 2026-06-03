// ===================================================
// core.js — 游戏核心：状态、存档、放置循环、收益计算
// ===================================================

// 挂在 window，供 HTML onclick 使用
window.SGame = (() => {
  // ========== 游戏状态 ==========
  let G = null;
  let tickCount = 0;
  let gameTimer = null;
  let eventTimer = null;
  let isPaused = false;
  let pendingDecisions = [];
  let autoDecideTimer = null;

  // ========== 初始化 ==========
  function initState(origin, playerName) {
    const o = ORIGINS.find(x => x.id === origin);
    G = {
      origin: origin,
      name: playerName || o.defaultName,
      // 基础属性
      money: o.money,
      reputation: o.reputation,
      stress: o.stress,
      connections: Math.min(CONFIG.MAX_CONNECTIONS || 100, o.connections),
      // 技能点
      stats: { management: o.stats.management, tech: o.stats.tech, social: o.stats.social, finance: o.stats.finance },
      statPoints: 0,
      // 游戏进度
      act: 1,
      milestone: 0,
      tickCount: 0,
      totalPlayTime: 0,
      // 业务
      businesses: (() => {
        const biz = {};
        BUSINESS_DEFS.forEach(b => {
          biz[b.id] = { level: 0, region: null, unlocked: b.unlockMoney === 0 };
        });
        return biz;
      })(),
      // 员工
      employees: [],
      empIdCounter: 0,
      // NPC好感
      npcFavor: {},
      npcTriggers: {},
      // 技能
      unlockedSkills: [],
      skillEffects: {},
      // 成就
      unlockedAchievements: [],
      achievementRead: [],
      // 事件冷却
      eventCooldowns: {},
      eventHistory: [],
      decisionHistory: [],
      eventCount: 0,
      decisionCount: 0,
      stressHighTickCount: 0,  // 追踪压力>60的tick数
      stressMax: 0,           // 追踪历史最高压力
      stressLowTickCount: 0, // 追踪压力低位持续tick数
      moneyLowest: Infinity,  // 追踪历史最低资金（初始无穷大）
      // 区域
      unlockedRegions: ['yongning'],
      // 多城市系统
      currentCityId: 'xinhai',
      cities: {
        xinhai: { unlocked: true, businesses: {}, unlockedRegions: ['yongning'] }
      },
      // 富豪等级
      rank: '个体户',
      // 热搜
      hotSearch: JSON.parse(JSON.stringify(INITIAL_HOT_SEARCH)),
      hotIdCounter: 10,
      // 幕次事件触发记录
      actEvents: {},
      // 压力模式
      stressMode: 'normal',  // easy/normal/hard/crisis/collapse
      // 声誉等级
      repLevel: 'unknown',  // infamous/unknown/rising/leader
      // 游戏结束
      ending: null,
      // 竞争对手系统
      rivals: null,
      // 新闻系统
      news: [],
      newsHistory: [],
      newsEffects: {},
      // 破产记录
      hasBankrupted: false,
      bankruptCount: 0,
      comebackFromBankruptcy: false,
      // 子公司自动运营
      subsidiaries: {},
      retireRequested: false,
      autoMode: {
        enabled: false,
        eventDecide: true,
        eventPreference: 'balanced',
        autoOpenBusiness: true,
        autoUpgradeBusiness: true,
        upgradeThreshold: 0.3,
        autoHire: true,
        autoFire: false,
        fireThreshold: 20,
        maxEmployees: 8,
        autoUnlockRegion: true,
        autoResearch: true,
        autoInvest: false,
        investBudget: 0.1,
        autoLoan: false,
        autoRepay: true,
        autoGift: false,
        giftBudget: 50000,
        autoManualWork: true,
        autoRest: true,
        cooldowns: {},
      },
      // LLM 系统
      narrativeContext: [],        // 叙事连续性上下文（最近事件摘要）
      marketSentiment: 50,        // 市场情绪指数 0-100
      newsFeed: [],               // LLM生成的商业新闻
      lastNewsTick: 0,            // 上次生成新闻的tick
      lastRivalReportTick: 0,     // 上次竞争对手报告tick
      lastSentimentTick: 0,       // 上次市场情绪分析tick
      lastDynamicEventTick: 0,    // 上次LLM动态事件tick
      // 托管统计
      autoStats: {
        startedAt: 0,
        totalTicks: 0,
        totalIncome: 0,
        totalExpense: 0,
        decisions: 0,
        businessesOpened: 0,
        businessesUpgraded: 0,
        employeesHired: 0,
        employeesFired: 0,
        regionsUnlocked: 0,
        researchesStarted: 0,
        stocksBought: 0,
        stocksSold: 0,
        giftsGiven: 0,
        loansTaken: 0,
        loansRepaid: 0,
        manualWorks: 0,
      },
      // ---- 资产系统 ----
      assets: [],              // 已购资产 [{id, templateId, name, type, purchasePrice, currentPrice, purchaseTick, rarity}]
      assetAuctionList: [],    // 拍卖行挂牌 [{assetIndex, askPrice, listTick, sellTick}]
      assetMarketListings: [], // 当前市场可选资产 [{templateId, name, type, price, rarity, volatility, trend, desc}]
      lastAssetMarketRefresh: 0,
      gameStartTime: Date.now(),
      // 统计追踪
      totalIncome: 0,
      totalExpense: 0,
      totalEvents: 0,
      totalDecisions: 0,
      // 资产历史（最近60 tick）
      assetHistory: [],
      // 自动存档
      autoSaveEnabled: true,
      // 经济波动系统
      economicState: 'stable',
      economicCycleTicks: 0,
      // 时间与气候系统
      gameHour: 7,
      gameDay: 1,
      currentWeather: 'sunny',
      cityWeathers: {},
      weatherChangeTimer: 0,
      // 新增成就追踪
      negativeEventsSurvived: 0,
      totalIncomeEarned: 0,
      grewInRecession: false,
      lastMoneyBeforeRecession: 0,
      // 科技研发
      rpt: 0,
      activeResearch: null,
      completedResearch: { digital:0, ai:0, blockchain:0 },
      // 股票
      stocks: {},
      stockPrices: {},
      stockChangeLog: {},
      stockProfitTotal: 0,
      // 贷款
      loans: [],
      neverLoaned: true,
      // 送礼冷却
      todayGifted: {},
      // ---- 新增系统状态 ----
      // 供应链系统
      supplyChain: {},
      supplyDisruptions: [],
      // 市场份额系统
      marketShare: {},
      // 员工深度
      empTrainingQueue: [],
      // 离线收益
      lastOnlineTime: Date.now(),
      offlineIncomeClaimed: true,
      // 事件队列（稍后处理）
      eventQueue: [],
      // 里程碑记录（替代结局）
      milestonesAchieved: [],
      // 任务线
      questProgress: {},
      questCompleted: {},
    };
    // 初始化NPC好感
    Object.values(NPCS).forEach(npc => {
      G.npcFavor[npc.id] = npc.initFavor;
      G.npcTriggers[npc.id] = [];
    });
    // 初始化城市天气
    Object.keys(CITIES).forEach(cityId => {
      const weatherKeys = Object.keys(WEATHERS);
      G.cityWeathers[cityId] = weatherKeys[Math.floor(Math.random() * weatherKeys.length)];
    });
    G.currentWeather = G.cityWeathers[G.currentCityId] || 'sunny';
    G.weatherChangeTimer = 6 + Math.floor(Math.random() * 7); // 6-12 tick后首次切换
    // 出身加成存储
    G.originBonus = o.bonus;
    G.skillEffects = {};
    pendingDecisions = [];
    tickCount = 0;
    // 初始化市场份额（每种业务100%归玩家）
    BUSINESS_DEFS.forEach(b => { G.marketShare[b.id] = 1.0; });
    // 初始化供应链（每种业务正常状态）
    BUSINESS_DEFS.forEach(b => { G.supplyChain[b.id] = { upstream: 'normal', downstream: 'normal', disruptionTicks: 0 }; });
  }

  // ========== 出身选择 ==========
  function selectOrigin(originId) {
    G = null;
    document.querySelectorAll('.origin-card').forEach(c => c.classList.remove('selected'));
    document.querySelector(`.origin-card[data-origin="${originId}"]`).classList.add('selected');
    document.getElementById('start-btn').disabled = false;
  }

  function startGame(originId, playerName) {
    initState(originId, playerName);
    // 初始化竞争对手
    if (typeof RIVALS !== 'undefined') {
      G.rivals = RIVALS.map(r => ({
        id: r.id, name: r.name, boss: r.boss, 
        money: r.startMoney * 100000000,
        growthRate: r.growthRate, style: r.style, color: r.color,
        desc: r.desc, tickCount: 0
      }));
    } else { G.rivals = []; }
    G.news = JSON.parse(JSON.stringify(INITIAL_HOT_SEARCH || []));
    G.newsHistory = [];
    G.newsEffects = {};
    G.hasBankrupted = false;
    G.comebackFromBankruptcy = false;
    G.subsidiaries = {};
    G.retireRequested = false;
    document.getElementById('origin-screen').style.display = 'none';
    UI.renderAll();
    startTick();
    startEventCheck();
    save();
    // 首次游戏显示教程
    if (isFirstGame()) {
      setTimeout(() => UI.showTutorial(), 800);
    }
  }

  // ========== 放置循环 ==========
  function startTick() {
    if (gameTimer) clearInterval(gameTimer);
    const interval = CONFIG.TICK_MS;
    gameTimer = setInterval(() => {
      if (isPaused) return;
      tickCount++;
      G.tickCount++;
      G.totalPlayTime += CONFIG.TICK_MS / 1000;
      doTick();
      if (G.tickCount % CONFIG.SAVE_INTERVAL === 0) save();
      UI.renderAll();
    }, interval);
  }

  function doTick() {
    try {
    // 0. 追踪成就数据
    if (G.stress > 60) G.stressHighTickCount = (G.stressHighTickCount || 0) + 1;
    if (G.stress < 20) G.stressLowTickCount = (G.stressLowTickCount || 0) + 1;
    G.stressMax = Math.max(G.stressMax || 0, G.stress);
    if (G.money < (G.moneyLowest || Infinity)) G.moneyLowest = G.money;
    // 时间推进（每Tick 1小时）
    GameTime.advance();
    // 天气切换检查
    GameTime.checkWeather();
    // 经济波动（每30tick ≈ 2.5分钟）
    G.economicCycleTicks = (G.economicCycleTicks || 0) + 1;
    if (G.economicCycleTicks >= 30) {
      G.economicCycleTicks = 0;
      const prevState = G.economicState;
      // 加权随机：倾向从当前状态平滑过渡
      const stateWeights = {
        stable: ['boom', 'stable', 'stable', 'stable', 'stable', 'recession'],
        boom: ['stable', 'stable', 'stable', 'recession', 'boom'],
        recession: ['recession', 'recession', 'stable', 'stable', 'crisis'],
        crisis: ['recession', 'recession', 'stable', 'crisis'],
      };
      const pool = stateWeights[prevState] || stateWeights.stable;
      G.economicState = pool[Math.floor(Math.random() * pool.length)];
      if ((prevState === 'recession' || prevState === 'crisis') && 
          G.lastMoneyBeforeRecession !== undefined && G.money > G.lastMoneyBeforeRecession) {
        G.grewInRecession = true;
      }
      G.lastMoneyBeforeRecession = G.money;
      const stateNames = { boom:'📈繁荣', stable:'➡️平稳', recession:'📉萧条', crisis:'💥危机' };
      addLog('🌐 市场波动：'+stateNames[G.economicState]);
    }
    // 1. 计算压力模式
    updateStressMode();
    // 1.5 预计算 NPC 被动加成（用于声誉衰减/政府补贴等），缓存供其他函数复用
    var npcBonusForTick = typeof calcNpcBonus === 'function' ? calcNpcBonus() : {};
    G._npcBonusCache = npcBonusForTick;
    // 2. 自然衰减
    const achRewards2 = typeof calcAchievementRewards === 'function' ? calcAchievementRewards() : {};
    G._achRewardsCache = achRewards2;
    const stressDecayBonus = 1.0 + (achRewards2.stressDecay || 0);
    G.stress = Math.max(0, G.stress - CONFIG.STRESS_NATURAL_DECAY * stressDecayBonus);
    // 林教授被动：声誉衰减降低
    const repDecayReduction = (npcBonusForTick._repGainPassive) ? npcBonusForTick._repGainPassive : 0;
    const regionModsForTick = getRegionModifiers();
    const rumorSpreadMod = regionModsForTick.rumorSpread || 1.0;
    // 声誉分层衰减：名气越大越难维持
    {
      const rep = G.reputation || 0;
      let repDecayProb = 0;
      let repDecayAmt = 0;
      if (rep > 85) { repDecayProb = 0.13; repDecayAmt = 2; }
      else if (rep > 70) { repDecayProb = 0.09; repDecayAmt = 1; }
      else if (rep > 50) { repDecayProb = 0.05; repDecayAmt = 1; }
      else if (rep > 30) { repDecayProb = 0.03; repDecayAmt = 1; }
      // 高压力下声誉维护困难
      if ((G.stress || 0) > 70) repDecayProb *= 1.4;
      // 林教授科研声誉保护
      if (repDecayReduction > 0) repDecayProb *= (1.0 - repDecayReduction * 0.3);
      // 区域谣言放大
      if (rumorSpreadMod > 1.0) repDecayProb *= rumorSpreadMod;
      // 「品牌管理」技能：衰减概率减半
      if (G.skillEffects && G.skillEffects.repGain && G.skillEffects.repGain > 1.0) repDecayProb *= 0.5;
      // 经济繁荣期声誉自然稳定
      if (G.economicState === 'boom') repDecayProb *= 0.7;
      if (Math.random() < repDecayProb) {
        G.reputation = Math.max(0, (G.reputation || 0) - repDecayAmt);
        if (rep > 80 && G.tickCount % 8 === 0) {
          addLog('📰 声誉自然下滑：公众的记忆是短暂的');
        }
      }
    }
    // 人脉自然衰减：高人气维护成本递增
    {
      const conn = G.connections || 0;
      let connDecayProb = 0;
      if (conn > 85) connDecayProb = 0.12;
      else if (conn > 70) connDecayProb = 0.08;
      else if (conn > 50) connDecayProb = 0.04;
      // 高压力下人脉维护困难
      if ((G.stress || 0) > 70) connDecayProb *= 1.5;
      // 区域谣言传播加速人脉流失
      if (rumorSpreadMod > 1.0) connDecayProb *= rumorSpreadMod;
      // 人脉技能减免：有"人脉网络"技能时衰减减半
      const hasConnSkill = G.skillEffects && G.skillEffects.connGain && G.skillEffects.connGain > 1.0;
      if (hasConnSkill) connDecayProb *= 0.5;
      if (Math.random() < connDecayProb) {
        addConnections(-1);
        if (conn > 80 && G.tickCount % 10 === 0) {
          addLog('📉 人脉自然流失：社交圈需要持续维护');
        }
      }
    }
    // NPC 好感自然衰减：不可能跟所有14位NPC都保持极深关系
    {
      if (G.npcFavor && G.tickCount % 3 === 0) { // 每3 Tick检查一次（节省性能）
        const allNpcIds = Object.keys(G.npcFavor);
        let decayLog = '';
        allNpcIds.forEach(function(nid) {
          const fav = G.npcFavor[nid] || 0;
          let prob = 0;
          if (fav > 85) prob = 0.10;
          else if (fav > 65) prob = 0.06;
          else if (fav > 45) prob = 0.03;
          // 高压力顾不上维护关系
          if ((G.stress || 0) > 70) prob *= 1.3;
          if (Math.random() < prob) {
            G.npcFavor[nid] = Math.max(0, fav - 1);
            const npc = typeof NPCS !== 'undefined' && NPCS[nid] ? NPCS[nid] : null;
            if (npc && fav === 86 && G.tickCount % 15 === 0) {
              // 首次跌破85线时记录（仅偶尔提醒）
              decayLog += (decayLog ? '，' : '') + npc.name;
            }
          }
        });
        if (decayLog) {
          addLog('🤝 关系疏远：' + decayLog + '对你久不联络感到失望');
        }
      }
    }
    // 更新资金峰值
    G.moneyPeak = Math.max(G.moneyPeak || 0, G.money);
    // 3. 计算收益
    const income = calcTotalIncome();
    G.money += income;
    if (income > 0) G.totalIncomeEarned = (G.totalIncomeEarned || 0) + income;
    // 数值溢出保护：硬上限 1e15
    if (G.money > 1e15) G.money = 1e15;
    // 李处被动：政府补贴
    if (npcBonusForTick._govSubsidy) { G.money += npcBonusForTick._govSubsidy; }
    // 3.4 资产被动收入（每Tick产出微量收益）
    if (G.assets && G.assets.length > 0) {
      var assetIncome = 0;
      for (var ai = 0; ai < G.assets.length; ai++) {
        var a = G.assets[ai];
        var inAuction = G.assetAuctionList && G.assetAuctionList.some(function(auc) { return auc.assetId === a.id; });
        if (inAuction) continue;
        // 稀有度越高收益越多：common→20, uncommon→50, rare→120, epic→300
        var rarityYield = { common: 20, uncommon: 50, rare: 120, epic: 300 }[a.rarity] || 20;
        assetIncome += rarityYield;
      }
      G.money += assetIncome;
      if (assetIncome > 0 && G.tickCount % 10 === 0) {
        addLog('🏠 资产收益：' + formatMoney(assetIncome) + '/Tick（持有' + G.assets.length + '项资产）');
      }
    }
    // 3.5 资产历史追踪
    G.assetHistory = G.assetHistory || [];
    G.assetHistory.push(G.money);
    if (G.assetHistory.length > 60) G.assetHistory.shift();
    // 3.6 统计追踪
    G.totalIncome = (G.totalIncome || 0) + (income > 0 ? income : 0);
    // 3.7 维护成本（每Tick）
    const maintenanceCost = calcMaintenanceCost();
    G.money -= maintenanceCost;
    G.totalExpense = (G.totalExpense || 0) + maintenanceCost;
    // 3.8 运营风险事件
    if (Math.random() < CONFIG.OPERATIONAL_RISK_BASE) triggerOperationalRisk();
    // 3.9 供应链检查
    if (G.tickCount % 3 === 0) checkSupplyChain();
    // 3.10 市场份额变化
    if (G.tickCount % 6 === 0) updateMarketShare();
    // 4. 发工资（实际工资 = baseSalary × 规模系数，单位转为元；实习生工资打折）
    let totalSalary = 0;
    G.employees.forEach(emp => {
      let actualSalary = calcActualSalary(emp.baseSalary || emp.salary, G);
      // 实习期工资打折
      actualSalary = calcInternSalary(emp, actualSalary);
      totalSalary += actualSalary * 10000;
      // 忠诚度：基础衰减 + 幸福感正向牵引（happiness缩放0.005）
      var achLoyDecay = (achRewards2.loyaltyDecay) || 1.0;
      emp.loyalty = Math.max(0, Math.min(100, emp.loyalty - CONFIG.LOYALTY_DECAY * achLoyDecay + (emp.happiness || 50) * 0.005));
      // 压力影响
      if (G.stress > 70) emp.happiness = Math.max(0, (emp.happiness || 50) - 2);
      // 疲劳度：净增长 = 增速 - 衰减（受区域 burnonProb 影响）
      var fatigueRate = CONFIG.EMP_FATIGUE_RATE;
      // 员工效率属性降低疲劳增长（每10点效率减少3%疲劳增长）
      if (emp.attrs && emp.attrs.efficiency) {
        fatigueRate *= (1 - (emp.attrs.efficiency / 333));
      }
      var regionMods = getRegionModifiers();
      if (regionMods.burnoutProb > 1.0) fatigueRate *= regionMods.burnoutProb;
      // 苏姐被动：自动疲劳降低 10%
      var npcBonFatigue = typeof calcNpcBonus === 'function' ? calcNpcBonus() : {};
      if (npcBonFatigue._autoFatigueReduction) fatigueRate *= (1 - npcBonFatigue._autoFatigueReduction);
      emp.fatigue = Math.min(100, Math.max(0, (emp.fatigue || 0) + fatigueRate - CONFIG.EMP_FATIGUE_DECAY));
      // 高疲劳影响忠诚
      if (emp.fatigue > 80) emp.loyalty = Math.max(0, emp.loyalty - 0.3);
      // 高疲劳影响效率（等效降收入）
      if (emp.fatigue > 70) emp.happiness = Math.max(0, (emp.happiness || 50) - 1);
    });
    G.money -= totalSalary;
    G.totalExpense = (G.totalExpense || 0) + totalSalary;
    // 4.1 HR 统管：工资折扣（HR 谈判优势）
    if (isHRManaged()) {
      const hrEmp = G.employees.find(e => e.role === 'hr');
      const hrLoyal = hrEmp ? (hrEmp.loyalty || 0) : 50;
      if (hrLoyal >= 30) {
        const rebate = totalSalary * (1 - CONFIG.HR_SALARY_DISCOUNT);
        G.money += rebate;
        G.totalExpense -= rebate;
      }
    }
    // 4.5 实习生转正检查
    checkInternConversion();
    // 4.6 自动存档（每20 tick到slot_1）
    if (G.autoSaveEnabled !== false && G.tickCount % 20 === 0) {
      autoSave();
    }
    // 5. 检查里程碑
    const prevAct = G.act;
    checkMilestones();
    if (G.act > prevAct && typeof UI !== 'undefined' && UI.showMilestone) {
      UI.showMilestone('🎉 第 ' + G.act + ' 幕');
    }
    // 6. 检查成就
    checkAchievements();
    // 7. 区域解锁检查
    checkRegionUnlocks();
    // 7.5 业务解锁检查
    checkBusinessUnlocks();
    // 7.6 城市解锁检查
    checkCityUnlocks();
    // 7.7 等级更新
    updateRank();
    // 7.8 NPC 随机来访事件（每 tick 约 8% 概率 + 人气修正）
    triggerNpcRandomVisit();
    // 8. 员工离开检查
    checkEmployeeLeave();
    // 9. 技能效果应用
    applySkillEffects();
    // 9.5 现金流管理技能：每50tick获得当前收入x3奖励
    if (G.unlockedSkills && G.unlockedSkills.includes('cash_flow') && G.tickCount % 50 === 0) {
      var bonus = calcTotalIncome() * 3;
      if (bonus > 0) {
        G.money += bonus;
        addLog('💰 现金流管理奖励: +' + formatMoney(bonus));
      }
    }
    // 10. 研发点数产出
    window.SGame.generateRPT();
    // 11. 研发进度检查
    window.SGame.checkResearchProgress();
    // 12. 股市波动（每5tick）
    if (G.tickCount % 5 === 0) window.SGame.updateStockPrices();
    // 13. 贷款利息处理
    processLoans();
    // 14. 节日检查
    checkHoliday();
    // 14.5 托管主循环
    if (G.autoMode && G.autoMode.enabled) autoManager();
    // 17.5 竞争对手AI（每12 tick）
    if (G.tickCount % 12 === 0) window.SGame.updateRivals();
    // 17.6 新闻生成（每10 tick）
    if (G.tickCount % 10 === 0) generateNews();
    // 17.6.1 LLM商业新闻生成（每20 tick，#5）
    if (G.tickCount % 20 === 0 && G.tickCount > G.lastNewsTick) generateLLMNews();
    // 17.6.2 LLM竞争对手情报（每30 tick，#7）
    if (G.tickCount % 30 === 0 && G.tickCount > G.lastRivalReportTick) generateLLMRivalReport();
    // 17.6.3 LLM市场情绪分析（每15 tick，#9）
    if (G.tickCount % 15 === 0 && G.tickCount > G.lastSentimentTick) analyzeLLMSentiment();
    // 17.6.4 LLM动态事件（每25 tick，概率触发，#8）
    if (G.tickCount % 25 === 0 && G.tickCount > G.lastDynamicEventTick) triggerLLMDynamicEvent();
    // 17.6.5 资产市场刷新 + 拍卖处理
    processAssetSystem();
    // 17.7 子公司自动运营
    manageSubsidiaries();
    // 17.8 结局检查 — 已禁用（长期放置游戏无结局），改为里程碑记录
    checkMilestonesAdvanced();
    // 15. 破产检查
    checkBankruptcy();
    // 16. HR 统管自动维护
    hrAutoTick();
    // 16.5 同步当前城市业务到多城存储
    syncCityBiz();
    // 11. 音效：收益为正时播放
    if (income > 0 && typeof AudioFX !== 'undefined') AudioFX.playEarn();
    } catch(e) {
      console.error('[商海浮沉] doTick error:', e);
    }
  }

  // ========== 时间与天气系统 ==========
  const GameTime = (() => {
    function getTimeOfDay(hour) {
      const h = hour ?? (G ? G.gameHour : 7);
      if (h >= TIME.DAWN_START && h < TIME.DAY_START) return 'dawn';
      if (h >= TIME.DAY_START && h < TIME.DUSK_START) return 'day';
      if (h >= TIME.DUSK_START && h < TIME.NIGHT_START) return 'dusk';
      return 'night';
    }

    function advance() {
      if (!G) return;
      G.gameHour++;
      if (G.gameHour >= 24) {
        G.gameHour = 0;
        G.gameDay++;
        if (typeof EventSystem !== 'undefined') {
          EventSystem.addLog(`📅 新的一天 — 第 ${G.gameDay} 天`);
        }
      }
      // 天气计时器
      G.weatherChangeTimer--;
    }

    function checkWeather() {
      if (!G) return;
      if (G.weatherChangeTimer <= 0) {
        const cityId = G.currentCityId || 'xinhai';
        const weatherKeys = Object.keys(WEATHERS);
        const weights = weatherKeys.map(k => WEATHERS[k].eventMod === 'crisis' ? 1 : (k === 'sunny' ? 4 : 2));
        const totalW = weights.reduce((a,b)=>a+b,0);
        let r = Math.random() * totalW;
        let idx = 0;
        for (let i = 0; i < weights.length; i++) {
          r -= weights[i];
          if (r <= 0) { idx = i; break; }
        }
        const newWeather = weatherKeys[idx];
        G.cityWeathers[cityId] = newWeather;
        const prevWeather = G.currentWeather;
        G.currentWeather = newWeather;
        // 重置计时器
        G.weatherChangeTimer = 6 + Math.floor(Math.random() * 7); // 6-12 tick
        // 天气变化日志
        if (prevWeather !== newWeather) {
          const w = WEATHERS[newWeather];
          if (typeof EventSystem !== 'undefined') {
            EventSystem.addLog(`🌤️ 天气变化：${w.name} — ${w.desc}`);
          }
        }
        // 极端天气触发特殊事件几率翻倍
        if (newWeather === 'storm') {
          G._stormEventBoost = true;
        } else {
          G._stormEventBoost = false;
        }
      }
    }

    function switchCityWeather(cityId) {
      if (!G || !G.cityWeathers) return;
      if (!G.cityWeathers[cityId]) {
        const weatherKeys = Object.keys(WEATHERS);
        G.cityWeathers[cityId] = weatherKeys[Math.floor(Math.random() * weatherKeys.length)];
      }
      G.currentWeather = G.cityWeathers[cityId];
    }

    return { getTimeOfDay, advance, checkWeather, switchCityWeather };
  })();

  // ========== 压力模式 ==========
  function updateStressMode() {
    if (G.stress >= 90) G.stressMode = 'collapse';
    else if (G.stress >= 70) G.stressMode = 'crisis';
    else if (G.stress >= 40) G.stressMode = 'hard';
    else if (G.stress >= 20) G.stressMode = 'normal';
    else G.stressMode = 'easy';
  }

  function getStressMultiplier() {
    const m = { easy: 1.05, normal: 1.0, hard: 0.85, crisis: 0.6, collapse: 0.3 };
    return m[G.stressMode] || 1.0;
  }

  // ========== 声誉等级 ==========
  function updateRepLevel() {
    if (G.reputation <= 10) G.repLevel = 'infamous';
    else if (G.reputation <= 40) G.repLevel = 'unknown';
    else if (G.reputation <= 70) G.repLevel = 'rising';
    else G.repLevel = 'leader';
  }

  function getRepMultiplier() {
    const m = { infamous: 0.7, unknown: 1.0, rising: 1.08, leader: 1.15 };
    return m[G.repLevel] || 1.0;
  }

  function getEconomicMultiplier() {
    const m = { boom: 1.10, stable: 1.00, recession: 0.85, crisis: 0.70 };
    return (G && G.economicState) ? (m[G.economicState] || 1.0) : 1.0;
  }

  // ===================================================
  //  联动系统 — calcSynergyEffects / 子修正器
  // ===================================================
  function calcSynergyEffects() {
    if (!G) return {};
    return {
      npcBonus: calcNpcBonus(),
      loyaltyBonus: calcLoyaltyBonus(),
      rivalPenalty: calcRivalPenalty(),
      weatherMod: getWeatherModByBiz(),
      holidayMod: getHolidayModByBiz(),
      leaderBonus: calcLeaderBonus(),
      stressMod: calcStressMod(),
      repMod: calcRepMod(),
      economyMod: getEconomicMultiplier(),
      techMod: calcTechBonusMod(),
    };
  }

  // NPC好感度 → 业务加成
  function calcNpcBonus() {
    const bonus = {};
    const favor = (id) => (G.npcFavor && G.npcFavor[id]) || 0;
    // ---- 原有 NPC 被动 ----
    // 王律师好感 > 40：法律保护 → 负面事件概率 -30%（在 isNegativeEvent 中消费）
    if (favor('wanglvshi') > 40) bonus._lawProtect = true;
    // 林教授好感 > 40：声誉获取被动 +5%（在 addReputation 中消费）
    if (favor('linjiaoshou') > 40) bonus._repGainPassive = 0.05;
    // 马记者好感 > 40：RPT 获取 +20%（在 generateRPT 中消费）
    if (favor('majizhe') > 40) bonus._rptBoost = 0.20;
    // 李处好感 > 50：政府补贴（每 tick 小额固定收入，在 doTick 中消费）
    if (favor('lichu') > 50) bonus._govSubsidy = 2500;
    // 张野好感 > 40：媒体类业务收益 +8%
    if (favor('zhangye') > 40) bonus.media = (bonus.media || 0) + 0.08;
    // 陈总好感 > 50：基金类收益 +10%
    if (favor('chenzong') > 50) bonus.fund = (bonus.fund || 0) + 0.10;
    // 小C好感 > 40：员工效率微量提升（等效收入加成）
    if (favor('xiaoc') > 40) { Object.keys(bonus).forEach(k => { if (k.indexOf('_') !== 0) bonus[k] += 0.02; }); }
    // 赵磊好感 > 40：零售/餐饮 +5%
    if (favor('zhaolei') > 40) { bonus.retail = (bonus.retail || 0) + 0.05; bonus.food_chain = (bonus.food_chain || 0) + 0.05; }

    // ---- 新增 NPC 被动 ----
    // 苏姐好感 > 30：招聘成本折扣 15% / > 60：自动疲劳降低 10%
    if (favor('sujie') > 30) bonus._hireDiscount = 0.15;
    if (favor('sujie') > 60) bonus._autoFatigueReduction = 0.10;
    // 金行长好感 > 30：贷款利率 -1.5% / > 60：贷款额度上限 +20%（在 applyLoan 中消费）
    if (favor('jinhangzhang') > 30) bonus._loanRateBonus = 0.015;
    if (favor('jinhangzhang') > 60) bonus._loanCapBonus = 0.20;
    // 钱老板好感 > 30：资产购买折扣 10% / > 60：资产增值加速 5%
    if (favor('qianlaoban') > 30) bonus._assetBuyDiscount = 0.10;
    if (favor('qianlaoban') > 60) bonus._assetAppreciation = 0.05;
    // 孙秘书好感 > 30：区域解锁费用 -15% / > 60：城市解锁门槛降低 10%
    if (favor('sunmishu') > 30) bonus._regionCostDiscount = 0.15;
    if (favor('sunmishu') > 60) bonus._cityUnlockDiscount = 0.10;
    // 吴教练好感 > 30：培训成本 -20% / > 60：技能上限 +1（即 EMP_SKILL_MAX + 1）
    if (favor('wujiaolian') > 30) bonus._trainCostDiscount = 0.20;
    if (favor('wujiaolian') > 60) bonus._skillCapBonus = 1;
    // 刘会计好感 > 30：维护成本 -10% / > 60：全局运营成本 -5%（已在 calcTotalIncome 中消费）
    if (favor('liukuaiji') > 30) bonus._maintenanceDiscount = 0.10;
    if (favor('liukuaiji') > 60) bonus._opsCostReduction = 0.05;

    return bonus;
  }

  // 员工忠诚度 → 业务联动
  function calcLoyaltyBonus() {
    if (!G || !G.employees || G.employees.length === 0) return { global: 0, penalty: false };
    const avgLoyalty = G.employees.reduce((s, e) => s + (e.loyalty || 0), 0) / G.employees.length;
    if (avgLoyalty > 70) return { global: 0.05, penalty: false };
    if (avgLoyalty < 30) return { global: -0.08, penalty: true }; // 离职概率在checkEmployeeLeave中处理
    return { global: 0, penalty: false };
  }

  // 竞争对手 → 市场联动
  function calcRivalPenalty() {
    if (!G || !G.rivals || G.rivals.length === 0) return { global: 0, cityPenalty: {} };
    let globalPenalty = 0;
    const cityPenalty = {};
    const playerMoney = G.money || 0;
    G.rivals.forEach(r => {
      if (r.money > playerMoney * 1.2) globalPenalty -= 0.03;
      // 竞争对手扩张影响（简化：资产>1亿视为扩张影响）
      if (r.money > 100000000) globalPenalty -= 0.02;
    });
    return { global: Math.max(-0.15, globalPenalty), cityPenalty };
  }

  // 天气修正（分业务类型）
  function getWeatherModByBiz() {
    const mods = {};
    if (!G || !G.currentWeather) return mods;
    const w = G.currentWeather;
    switch (w) {
      case 'storm':
        // 暴风雨：物流/零售类 -20%，餐饮 -10%
        mods.retail = -0.20; mods.media = -0.15; mods.food_chain = -0.10;
        mods.office = -0.10; mods.new_energy = -0.20;
        break;
      case 'heatwave':
        // 高温：餐饮 +10%（外卖需求），员工效率 -5%
        mods.food_chain = 0.10; mods.tech = -0.03; mods.media = -0.03;
        break;
      case 'snow':
        // 雪天：地产 +5%（室内需求），交通类 -15%
        mods.office = 0.05; mods.retail = -0.10; mods.food_chain = -0.10;
        mods.new_energy = -0.15; mods.media = -0.05;
        break;
      case 'fog':
        mods.retail = -0.08; mods.food_chain = -0.05; break;
      case 'extreme':
        mods.retail = -0.25; mods.food_chain = -0.20; mods.office = -0.10;
        mods.tech = -0.10; mods.media = -0.10; mods.new_energy = -0.20;
        break;
      case 'sunny':
        mods.retail = 0.05; mods.food_chain = 0.03; mods.media = 0.02; break;
      case 'rainy':
        mods.food_chain = -0.03; mods.retail = -0.05; break;
    }
    return mods;
  }

  // 节日修正（分业务类型）
  function getHolidayModByBiz() {
    const mods = {};
    if (!G || !G._currentHoliday) return mods;
    const h = G._currentHoliday;
    switch (h) {
      case 'spring':
        mods.retail = 0.30; mods.food_chain = 0.20; mods.media = 0.10;
        break;
      case 'double11':
        mods.retail = 0.40; mods.media = 0.15; mods.tech = 0.05;
        break;
      case 'national':
        mods.office = 0.15; mods.retail = 0.10; mods.food_chain = 0.05; mods.new_energy = 0.15;
        break;
      case 'labor':
        mods.retail = 0.20; mods.food_chain = 0.15; break;
      case 'christmas':
        mods.retail = 0.20; mods.media = 0.10; mods.food_chain = 0.10; break;
      case 'dragon':
        mods.retail = 0.10; mods.media = 0.15; break;
      case 'qixi':
        mods.retail = 0.15; mods.food_chain = 0.10; mods.media = 0.05; break;
      case 'midautumn':
        mods.retail = 0.10; mods.food_chain = 0.10; break;
      case 'double12':
        mods.retail = 0.20; mods.media = 0.05; break;
      case 'newyear':
        mods.retail = 0.10; mods.food_chain = 0.05; break;
    }
    return mods;
  }

  // 排名第一龙头溢价
  function calcLeaderBonus() {
    const rankInfo = getRivalRank();
    if (rankInfo && rankInfo.rank === 1 && rankInfo.total >= 2) return 0.05;
    return 0;
  }

  // 压力修正（增强版）
  function calcStressMod() {
    if (!G) return 0;
    if (G.stress > 70) return -0.15;
    if (G.stress > 50) return -0.05;
    if (G.stress < 20) return 0.03;
    return 0;
  }

  // 声誉修正（增强版）
  function calcRepMod() {
    if (!G) return 0;
    if (G.reputation > 80) return 0.08;
    if (G.reputation < 20) return -0.10;
    if (G.reputation < 40) return -0.03;
    return 0;
  }

  // 研发科技 → 业务/员工联动
  function calcTechBonusMod() {
    const mods = {};
    if (!G || !G.completedResearch) return mods;
    // 数字化转型完成（任意等级）：该城市所有业务收入加成
    if (G.completedResearch.digital > 0) {
      const lv = G.completedResearch.digital;
      const bonus = lv * 0.04; // 每级4%
      mods.all = (mods.all || 0) + bonus;
    }
    // AI自动化完成：员工效率等效收入加成
    if (G.completedResearch.ai > 0) {
      const lv = G.completedResearch.ai;
      mods.all = (mods.all || 0) + lv * 0.06;
    }
    // 区块链金融完成：基金类加成
    if (G.completedResearch.blockchain > 0) {
      const lv = G.completedResearch.blockchain;
      mods.fund = (mods.fund || 0) + lv * 0.06;
      mods.office = (mods.office || 0) + lv * 0.03;
    }
    return mods;
  }

  // 获取联动状态显示（供UI使用）
  function getSynergyStatusDisplay() {
    const items = [];
    if (!G) return items;
    const sy = calcSynergyEffects();

    // 天气修正
    if (G.currentWeather && G.currentWeather !== 'sunny') {
      const wNames = { storm: '暴风雨', heatwave: '高温', snow: '雪天', fog: '大雾', extreme: '极端天气', rainy: '雨天' };
      const wName = wNames[G.currentWeather] || G.currentWeather;
      const wMods = sy.weatherMod || {};
      const hasPenalty = Object.values(wMods).some(v => v < 0);
      const hasBonus = Object.values(wMods).some(v => v > 0);
      if (hasPenalty || hasBonus) {
        const summary = Object.entries(wMods).filter(([_,v]) => Math.abs(v) > 0.01).slice(0, 2).map(([k,v]) => {
          const bDef = BUSINESS_DEFS.find(b => b.id === k);
          return (bDef ? bDef.icon : k) + (v >= 0 ? '+' : '') + (v*100).toFixed(0) + '%';
        }).join(' ');
        items.push({ label: wName, value: summary, positive: hasBonus && !hasPenalty });
      }
    }

    // 节日修正
    if (G._currentHoliday) {
      const hNames = { spring: '春节', double11: '双十一', national: '国庆', labor: '劳动节',
        christmas: '圣诞节', dragon: '端午', qixi: '七夕', midautumn: '中秋', double12: '双十二', newyear: '元旦' };
      items.push({ label: hNames[G._currentHoliday] || G._currentHoliday, value: '节日加成', positive: true });
    }

    // 员工忠诚度
    if (sy.loyaltyBonus && sy.loyaltyBonus.global !== 0) {
      const val = sy.loyaltyBonus.global;
      items.push({ label: '员工忠诚', value: (val >= 0 ? '+' : '') + (val * 100).toFixed(0) + '%', positive: val > 0 });
    }

    // 龙头溢价
    if (sy.leaderBonus > 0) {
      items.push({ label: '龙头溢价', value: '+' + (sy.leaderBonus * 100).toFixed(0) + '%', positive: true });
    }

    // 竞争对手压制
    if (sy.rivalPenalty && sy.rivalPenalty.global < 0) {
      items.push({ label: '竞争压制', value: (sy.rivalPenalty.global * 100).toFixed(0) + '%', positive: false });
    }

    // 竞争对手即时效果
    if (G._rivalExpansionPenalty > 0) {
      items.push({ label: '对手扩张', value: '-' + (G._rivalExpansionPenalty * 100).toFixed(0) + '%', positive: false });
    }
    if (G._rivalCrisisBonus > 0) {
      items.push({ label: '对手危机', value: '+' + (G._rivalCrisisBonus * 100).toFixed(0) + '%', positive: true });
    }

    // NPC好感度加成
    if (sy.npcBonus) {
      const npcEffects = [];
      const favor = (id) => (G.npcFavor && G.npcFavor[id]) || 0;
      if (favor('zhangye') > 40) npcEffects.push('张野:媒体+8%');
      if (favor('chenzong') > 50) npcEffects.push('陈总:基金+10%');
      if (favor('zhaolei') > 40) npcEffects.push('赵磊:零售+5%');
      if (favor('linjiaoshou') > 40) npcEffects.push('林教授:RPT+20%');
      if (npcEffects.length > 0) {
        items.push({ label: 'NPC加成', value: npcEffects.join(' '), positive: true });
      }
    }

    // 研发科技
    if (sy.techMod && (sy.techMod.all || Object.keys(sy.techMod).some(k => k !== 'all' && sy.techMod[k] > 0))) {
      let tStr = '';
      if (sy.techMod.all) tStr += '全局+' + (sy.techMod.all * 100).toFixed(0) + '% ';
      if (sy.techMod.fund) tStr += '基金+' + (sy.techMod.fund * 100).toFixed(0) + '%';
      items.push({ label: '研发科技', value: tStr, positive: true });
    }

    // 经济波动
    const econState = G.economicState || 'stable';
    if (econState === 'boom') items.push({ label: '经济繁荣', value: '收入加成', positive: true });
    else if (econState === 'recession') items.push({ label: '经济萧条', value: '收入-15%', positive: false });
    else if (econState === 'crisis') items.push({ label: '经济危机', value: '收入大减', positive: false });

    // 压力/声誉修正
    if (sy.stressMod && sy.stressMod < 0) {
      items.push({ label: '高压力', value: (sy.stressMod * 100).toFixed(0) + '%', positive: false });
    }
    if (sy.repMod && sy.repMod < 0) {
      items.push({ label: '低声誉', value: (sy.repMod * 100).toFixed(0) + '%', positive: false });
    }

    return items;
  }

  // ========== 收益计算 ==========
  function calcTotalIncome() {
    updateRepLevel();
    const stressMul = getStressMultiplier();
    const repMul = getRepMultiplier();
    const originMul = getOriginMultiplier();
    
    // 计算成就奖励加成
    const achRewards = typeof calcAchievementRewards === 'function' ? calcAchievementRewards() : {};
    const achIncomeMult = 1.0 + (achRewards.incomeMult || 0);
    const achOpCost = achRewards.opCost || 1.0;
    // 预计算 NPC 被动用于 calcTotalIncome（优先使用 doTick 缓存）
    var npcBonusForCalc = G._npcBonusCache || (typeof calcNpcBonus === 'function' ? calcNpcBonus() : {});
    var _achRewardsCache = G._achRewardsCache || (typeof calcAchievementRewards === 'function' ? calcAchievementRewards() : {});

    let grandTotal = 0;

    // #4 员工数据预计算：单次遍历，供所有业务复用
    var empSummary = null;
    if (G.employees && G.employees.length > 0) {
      var m = { manager:0, developer:0, sales:0, marketer:0, others:0,
        skillBonus:0, lowLoyalty:0, sumFatigue:0, count: G.employees.length,
        incomeBonusFromRoles: 0, attrBonus: 0 };
      G.employees.forEach(function(emp) {
        var roleDef = EMP_ROLES.find(function(r) { return r.id === emp.role; });
        if (roleDef && roleDef.incomeBonus) m.incomeBonusFromRoles += roleDef.incomeBonus;
        if (emp.role === 'manager') m.manager++;
        else if (emp.role === 'developer') m.developer++;
        else if (emp.role === 'sales') m.sales++;
        else if (emp.role === 'marketer') m.marketer++;
        else m.others++;
        if (emp.loyalty < 20) m.lowLoyalty++;
        if (emp.skill && emp.skill > 1) m.skillBonus += (emp.skill - 1) * 0.03;
        m.sumFatigue += emp.fatigue || 0;
        // 员工属性加成
        if (typeof calcEmpAttrIncomeBonus === 'function') {
          m.attrBonus += calcEmpAttrIncomeBonus(emp);
        }
      });
      // 全局低忠诚度惩罚因子
      var lowRatio = m.lowLoyalty / m.count;
      m.loyaltyPenalty = Math.max(0.5, 1.0 - lowRatio * 0.5);
      // 全局疲劳惩罚因子
      var avgFatigue = m.sumFatigue / m.count;
      m.fatiguePenalty = avgFatigue > 60 ? Math.max(0.7, 1 - (avgFatigue - 60) * 0.005) : 1.0;
      // 成就加成
      var achRewardsEE = _achRewardsCache;
      m.incomeBonus = m.incomeBonusFromRoles + (achRewardsEE.empEfficiency || 0);
      empSummary = m;
    }

    // 遍历所有已解锁城市
    Object.entries(G.cities).forEach(([cityId, cityData]) => {
      if (!cityData || !cityData.unlocked) return;
      const cityDef = CITIES[cityId];
      if (!cityDef) return;

      let cityIncome = 0;
      const cityBiz = cityData.businesses || {};

      BUSINESS_DEFS.forEach(bDef => {
        const bState = cityBiz[bDef.id];
        if (!bState || bState.level === 0) return;
        const lv = bDef.levels[bState.level - 1];
        if (!lv) return;
        let income = lv.income;

        // 市场份额修正
        const share = (G.marketShare && G.marketShare[bDef.id]) || 1.0;
        income *= share;

        // 供应链修正
        const sc = (G.supplyChain && G.supplyChain[bDef.id]) || { upstream:'normal', downstream:'normal' };
        if (sc.upstream === 'disrupted' && sc.downstream === 'disrupted') {
          income *= 0.3; // 双断供，收入只剩30%
        } else if (sc.upstream === 'disrupted') {
          income *= 0.6;  // 上游断供，收入-40%
        } else if (sc.downstream === 'disrupted') {
          income *= 0.7; // 下游断供，收入-30%
        }

        // 区域加成（含 regionBonusDouble 成就翻倍）
        var regionMul = 1.0;
        if (bState.region && REGIONS[bState.region]) {
          const r = REGIONS[bState.region];
          // 已实现：核心业务增益
          if (r.bonus.retail && bDef.id === 'retail') regionMul *= r.bonus.retail;
          if (r.bonus.tech && bDef.id === 'tech') regionMul *= r.bonus.tech;
          if (r.bonus.finance && (bDef.id === 'fund' || bDef.id === 'office')) regionMul *= r.bonus.finance;
          if (r.bonus.repGain) regionMul *= (1 + (r.bonus.repGain - 1) * 0.3);
          // 新增：贸易加成 → retail/food_chain
          if (r.bonus.trade && (bDef.id === 'retail' || bDef.id === 'food_chain')) regionMul *= r.bonus.trade;
          // 新增：制造加成 → new_energy / 制造业统称
          if (r.bonus.manufacturing && (bDef.id === 'new_energy' || bDef.id === 'manufacturing')) regionMul *= r.bonus.manufacturing;
          // 新增：物流效率 → 减弱供应链断裂影响（每级物流+0.02 恢复系数）
          if (r.bonus.logistics) {
            var scState = (G.supplyChain && G.supplyChain[bDef.id]) || { upstream:'normal', downstream:'normal' };
            if (scState.upstream === 'disrupted') {
              // logistics 加成恢复部分中断损失（1.08 恢复约 16%，1.20 恢复约 40%）
              var recovery = Math.min(1.0, 0.6 + (r.bonus.logistics - 1.0) * 2.5);
              income *= recovery;
            }
          }
          // 新增：运营成本降低 → 等效收入加成
          if (r.bonus.opsCost) regionMul *= (1 + (1 - r.bonus.opsCost) * 0.5);
          // 新增：成本倍率 → 等效收入加成
          if (r.bonus.cost && r.bonus.cost < 1) regionMul *= (1 + (1 - r.bonus.cost) * 0.4);
        }
        // 成就：区域霸主 → 区域加成翻倍
        var achRewardsR = _achRewardsCache;
        if (achRewardsR.regionBonusDouble && regionMul > 1.0) {
          regionMul = 1.0 + (regionMul - 1.0) * 2.0;
        }
        income *= regionMul;

        // 员工加成（#4 使用预计算摘要，避免重复遍历）
        var empMul = 1.0;
        var empBonus = 0;
        if (empSummary) {
          // 管理层全局加成（每个manager +12%）
          empMul += empSummary.manager * 0.12;
          // 业务特定加成
          if (bDef.id === 'tech') empMul += empSummary.developer * 0.06;
          if (bDef.id === 'retail' || bDef.id === 'media') {
            empMul += empSummary.sales * 0.08;
            empMul += empSummary.marketer * 0.10;
          } else {
            empMul += empSummary.marketer * 0.04;
          }
          // 技能加成
          empMul += empSummary.skillBonus;
          // 全局惩罚
          empMul *= empSummary.loyaltyPenalty * empSummary.fatiguePenalty;
          empBonus = empSummary.incomeBonus;
          // 员工属性加成：整体收入乘数
          empMul += empSummary.attrBonus || 0;
        }
        income *= empMul;
        income *= (1 + empBonus);

        // 出身业务加成
        const originBizBonus = getOriginBonus(bDef.id);
        income *= originBizBonus;

        // 城市特色加成
        if (cityDef.cityBonus) {
          const cb = cityDef.cityBonus;
          if (cb.incomeMult) income *= cb.incomeMult;
          if (cb.techBonus && bDef.id === 'tech') income *= cb.techBonus;
          if (cb.financeBonus && (bDef.id === 'fund' || bDef.id === 'office')) income *= cb.financeBonus;
          if (cb.policyBonus && (bDef.id === 'office' || bDef.id === 'new_energy')) income *= cb.policyBonus;
          if (cb.tradeBonus && (bDef.id === 'retail' || bDef.id === 'food_chain')) income *= cb.tradeBonus;
          if (cb.opsCostReduction) income *= (1 + (1 - cb.opsCostReduction) * 0.3);
        }

        // 压力/声誉/出身/经济（基础修正）
        income *= stressMul * repMul * originMul * getEconomicMultiplier();

        // === 联动修正：分业务类型 ===
        const synergy = G._synergyCache || calcSynergyEffects();
        G._synergyCache = synergy;

        // 天气分业务修正（替代原来的统一 weather.incomeMod）
        if (synergy.weatherMod && synergy.weatherMod[bDef.id]) {
          income *= (1 + synergy.weatherMod[bDef.id]);
        }

        // 节日分业务修正
        if (synergy.holidayMod && synergy.holidayMod[bDef.id]) {
          income *= (1 + synergy.holidayMod[bDef.id]);
        }

        // NPC好感度分业务修正
        if (synergy.npcBonus && synergy.npcBonus[bDef.id]) {
          income *= (1 + synergy.npcBonus[bDef.id]);
        }

        // 研发科技修正
        if (synergy.techMod) {
          if (synergy.techMod[bDef.id]) income *= (1 + synergy.techMod[bDef.id]);
          if (synergy.techMod.all) income *= (1 + synergy.techMod.all);
        }

        // 技能加成
        const skillMul = getSkillMultiplier();
        income *= skillMul;

        // 新闻效应（单次生效，生效后清除）
        if (G._newsEffectsPending && G.newsEffects && G.newsEffects[bDef.id]) {
          income *= G.newsEffects[bDef.id];
        }

        cityIncome += income * 10000;
      });

      // 城市内业务协同
      const citySynergy = calcCitySynergyMultiplier(cityData);
      cityIncome *= citySynergy;

      // 国际城市物流成本
      if (cityDef.isInternational && cityId !== 'xinhai') {
        cityIncome *= 0.95;
      }

      grandTotal += cityIncome;
    });
    // 新闻效应单次生效后清除
    if (G._newsEffectsPending) {
      G._newsEffectsPending = false;
      G.newsEffects = {};
    }

    // 跨城协同加成
    const cityCount = Object.values(G.cities).filter(c => c && c.unlocked).length;
    if (cityCount >= 5) grandTotal *= 1.06;
    else if (cityCount >= 4) grandTotal *= 1.04;
    else if (cityCount >= 3) grandTotal *= 1.03;
    else if (cityCount >= 2) grandTotal *= 1.02;

    // 国际城市额外加成
    const intlCount = Object.entries(G.cities).filter(([id, c]) =>
      c && c.unlocked && CITIES[id] && CITIES[id].isInternational
    ).length;
    if (intlCount > 0) grandTotal *= (1 + intlCount * 0.03);

    // === 全局联动修正 ===
    const sy = G._synergyCache || calcSynergyEffects();

    // 员工忠诚度全局加成
    if (sy.loyaltyBonus && sy.loyaltyBonus.global !== 0) {
      grandTotal *= (1 + sy.loyaltyBonus.global);
    }

    // 竞争对手压制
    if (sy.rivalPenalty && sy.rivalPenalty.global !== 0) {
      grandTotal *= (1 + sy.rivalPenalty.global);
    }

    // 排名第一龙头溢价
    if (sy.leaderBonus > 0) {
      grandTotal *= (1 + sy.leaderBonus);
    }

    // stress 已通过 getStressMultiplier (0.3~1.05) 在逐业务行 835 应用，此处不再重复
    // sy.stressMod 由 calcStressMod 提供细分阶梯，但不适用于全局二次乘法
    // repMod 已通过 getRepMultiplier() 在各业务中应用，不再全局重复计算

    // 竞争对手扩张/危机即时效果
    if (G._rivalExpansionPenalty) grandTotal *= (1 - G._rivalExpansionPenalty);
    if (G._rivalCrisisBonus) grandTotal *= (1 + G._rivalCrisisBonus);

    // LLM 新闻影响（短暂收入调节）
    if (G._llmNewsBonus) grandTotal *= (1 + G._llmNewsBonus);
    if (G._llmNewsPenalty) grandTotal *= (1 - G._llmNewsPenalty);

    // 成就奖励全局收入加成
    grandTotal *= achIncomeMult;
    // 成就奖励运营成本减免（等效收入加成）
    if (achOpCost < 1.0) grandTotal *= (1.0 + (1.0 - achOpCost) * 0.5);
    // 刘会计被动：运营成本 -5%（等效收入加成）
    if (npcBonusForCalc._opsCostReduction) grandTotal *= (1 + npcBonusForCalc._opsCostReduction * 0.5);
    
    // 清除缓存
    G._synergyCache = null;

    // 递减边际效应：总收入超过阈值时应用衰减系数，防止数值爆炸
    if (grandTotal > 5000000) {
      var overflow = grandTotal / 5000000;
      var damping = 1.0 / (1.0 + Math.log2(overflow) * 0.08);
      grandTotal *= damping;
    }

    return grandTotal;
  }

  // 计算单个业务的实际年收入（供UI显示）
  function calcBizIncome(bizId, gameState) {
    if (!gameState) gameState = G;
    if (!gameState) return 0;
    var bDef = BUSINESS_DEFS.find(function(b) { return b.id === bizId; });
    if (!bDef) return 0;
    // 查找该业务在所有城市中的状态
    var totalIncome = 0;
    if (gameState.cities) {
      Object.entries(gameState.cities).forEach(function([cityId, cityData]) {
        if (!cityData || !cityData.unlocked) return;
        var bizState = cityData.businesses && cityData.businesses[bizId];
        if (!bizState || bizState.level === 0) return;
        var lv = bDef.levels[bizState.level - 1];
        if (!lv) return;
        totalIncome += lv.income;
      });
    }
    // 旧格式兼容
    if (totalIncome === 0 && gameState.businesses) {
      var state = gameState.businesses[bizId];
      if (state && state.level > 0) {
        var lv = bDef.levels[state.level - 1];
        if (lv) totalIncome = lv.income;
      }
    }
    // 应用基础修正系数（简化版，不含全部联动）
    var stressMul = getStressMultiplier();
    var repMul = getRepMultiplier();
    var originMul = getOriginMultiplier();
    totalIncome *= stressMul * repMul * originMul;
    return totalIncome;
  }

  function calcSynergyMultiplier() {
    if (!G || !G.cities) return 1.0;
    var mul = 1.0;
    var cityCount = Object.values(G.cities).filter(function(c) { return c && c.unlocked; }).length;
    if (cityCount >= 5) mul += 0.06;
    else if (cityCount >= 4) mul += 0.04;
    else if (cityCount >= 3) mul += 0.03;
    else if (cityCount >= 2) mul += 0.02;
    var intlCount = Object.entries(G.cities).filter(function(entry) {
      var id = entry[0], c = entry[1];
      return c && c.unlocked && CITIES[id] && CITIES[id].isInternational;
    }).length;
    if (intlCount > 0) mul += intlCount * 0.03;
    return mul;
  }

  function calcCitySynergyMultiplier(cityData) {
    let mul = 1.0;
    if (!cityData || !cityData.businesses) return mul;
    const regionBizCount = {};
    BUSINESS_DEFS.forEach(bDef => {
      const bState = cityData.businesses[bDef.id];
      if (!bState || bState.level === 0 || !bState.region) return;
      regionBizCount[bState.region] = (regionBizCount[bState.region] || 0) + 1;
    });
    Object.values(regionBizCount).forEach(count => {
      if (count >= 4) mul += 0.06;
      else if (count >= 3) mul += 0.04;
      else if (count >= 2) mul += 0.02;
    });
    const hasBiz = (id) => cityData.businesses[id] && cityData.businesses[id].level > 0;
    if (hasBiz('tech') && hasBiz('media')) mul += 0.03;
    if (hasBiz('food_chain') && hasBiz('office')) mul += 0.02;
    if (hasBiz('new_energy') && hasBiz('tech')) mul += 0.03;
    if (hasBiz('retail') && hasBiz('media')) mul += 0.02;
    return mul;
  }

  function calcEmployeeIncomeBonus() {
    if (!G || !G.employees) return 0;
    const achRewards4 = typeof calcAchievementRewards === 'function' ? calcAchievementRewards() : {};
    const empEffBonus = achRewards4.empEfficiency || 0;
    let bonus = empEffBonus;
    G.employees.forEach(emp => {
      const roleDef = EMP_ROLES.find(r => r.id === emp.role);
      if (roleDef && roleDef.incomeBonus) {
        bonus += roleDef.incomeBonus;
      }
    });
    return bonus;
  }

  function calcEmployeeMultiplier(bizId) {
    let mul = 1.0;
    let lowLoyaltyCount = 0;
    G.employees.forEach(emp => {
      if (emp.role === 'manager') mul += 0.12;
      if (emp.role === 'developer' && bizId === 'tech') mul += 0.06;
      if (emp.role === 'sales' && (bizId === 'retail' || bizId === 'media')) mul += 0.08;
      if (emp.role === 'marketer') mul += (bizId === 'retail' || bizId === 'media') ? 0.10 : 0.04;
      if (emp.loyalty < 20) lowLoyaltyCount++;
      // 员工技能加成
      if (emp.skill && emp.skill > 1) mul += (emp.skill - 1) * 0.03;
    });
    // 低忠诚度员工比例惩罚（而非每人独立乘 0.5）
    if (G.employees.length > 0) {
      const lowRatio = lowLoyaltyCount / G.employees.length;
      if (lowRatio > 0) mul *= Math.max(0.5, 1.0 - lowRatio * 0.5);
    }
    // 全局疲劳影响
    if (G.employees.length > 0) {
      const avgFatigue = G.employees.reduce((s, e) => s + (e.fatigue || 0), 0) / G.employees.length;
      if (avgFatigue > 60) mul *= Math.max(0.7, 1 - (avgFatigue - 60) * 0.005);
    }
    return mul;
  }

  function getOriginMultiplier() {
    if (!G || !G.origin) return 1.0;
    switch (G.origin) {
      case 'elite': return 1.05;   // 科技类收益+5%
      case 'sales': return 1.08;   // 零售类收益+8%
      case 'tech':  return 1.03;   // 全局轻微加成
      case 'rich2nd': return 0.90; // 全局收益-10%（富二代效率较低）
      default: return 1.0;
    }
  }

  function getOriginBonus(bizId) {
    if (!G || !G.originBonus) return 1.0;
    const b = G.originBonus;
    if (b.techIncome && bizId === 'tech') return b.techIncome;
    if (b.retailIncome && (bizId === 'retail' || bizId === 'media')) return b.retailIncome;
    // techRdSpeed 只在 generateRPT 中生效，不作为收入倍率
    if (b.unlockCost) return 1.0;
    if (b.hireSpeed) return 1.0;
    return 1.0;
  }

  // ========== 区域解锁 ==========
  function checkRegionUnlocks() {
    var npcBonReg = typeof calcNpcBonus === 'function' ? calcNpcBonus() : {};
    Object.values(REGIONS).forEach(r => {
      if (r.unlocked) return;
      // 检查城市是否已解锁（新城市区域需要对应城市已解锁）
      if (r.unlockCond && r.unlockCond.cityId) {
        const cityState = G.cities[r.unlockCond.cityId];
        if (!cityState || !cityState.unlocked) return;
      }
      // 检查 act 前置
      if (r.actUnlock > 0 && G.act < r.actUnlock) return;
      if (r.unlockCond) {
        // 孙秘书被动：区域解锁资金阈值降低 15%
        var effMoney = r.unlockCond.money ? r.unlockCond.money * (1 - (npcBonReg._regionCostDiscount || 0)) : 0;
        if (r.unlockCond.money && G.money >= effMoney) unlockRegion(r.id);
        if (r.unlockCond.reputation && G.reputation >= r.unlockCond.reputation) unlockRegion(r.id);
        if (r.unlockCond.act && G.act >= r.unlockCond.act) unlockRegion(r.id);
      }
    });
  }

  function unlockRegion(regionId) {
    if (REGIONS[regionId] && !REGIONS[regionId].unlocked) {
      REGIONS[regionId].unlocked = true;
      G.unlockedRegions.push(regionId);
      addLog(`解锁新区域：${REGIONS[regionId].name}！`);
      showAchievement('🗺️', `解锁区域：${REGIONS[regionId].name}`);
    }
  }

  // ========== 城市解锁 ==========
  function checkCityUnlocks() {
    var npcBonCity = typeof calcNpcBonus === 'function' ? calcNpcBonus() : {};
    Object.values(CITIES).forEach(city => {
      if (city.unlockMoney === 0 && city.minAct === 0) return; // 初始城市跳过
      if (G.cities[city.id] && G.cities[city.id].unlocked) return;
      // 孙秘书被动：城市解锁资金阈值降低 10%
      var effUnlockMoney = city.unlockMoney * (1 - (npcBonCity._cityUnlockDiscount || 0));
      if (G.money >= effUnlockMoney && G.act >= city.minAct) {
        G.cities[city.id] = { unlocked: true, businesses: {}, unlockedRegions: [] };
        // 初始化该城市所有业务默认条目
        BUSINESS_DEFS.forEach(bDef => {
          G.cities[city.id].businesses[bDef.id] = bDef.unlockMoney === 0
            ? { level: 1, region: bDef.regions ? bDef.regions[0] : null, unlocked: true }
            : { level: 0, region: null, unlocked: false };
        });
        G.cities[city.id]._initialized = true;
        // 解锁该城市的所有actUnlock=0的区域
        (city.regionIds || []).forEach(rid => {
          const r = REGIONS[rid];
          if (r && r.actUnlock === 0 && !r.unlocked) {
            r.unlocked = true;
            G.unlockedRegions.push(rid);
          }
        });
        addLog(`🌍 解锁新城市：${city.icon} ${city.name}！${city.desc}`);
        showAchievement('🌍', `新城市解锁：${city.name}`);
        if (typeof AudioFX !== 'undefined') AudioFX.playAchievement();
        // 触发城市解锁事件
        const cityEvent = EVENTS.find(e => e.id === 'city_unlock_' + city.id);
        if (cityEvent) {
          setTimeout(() => {
            if (typeof EventSystem !== 'undefined') EventSystem.fireEvent(cityEvent);
          }, 2000);
        }
      }
    });
  }

  // ========== NPC 随机来访事件 ==========
  // 每 tick 有一定概率触发某位 NPC 主动来访，根据好感度产生不同效果
  function triggerNpcRandomVisit() {
    if (!G) return;
    var prob = 0.08; // 基础 8%/tick
    if (G.reputation > 60) prob += 0.03;
    if (G.connections > 50) prob += 0.02;
    if (Math.random() > prob) return;

    // 选择来访 NPC（优先好感度中等的，既不是陌生也不是亲密）
    var eligible = [];
    var allNpcIds = Object.keys(NPCS);
    for (var i = 0; i < allNpcIds.length; i++) {
      var nid = allNpcIds[i];
      var npc = NPCS[nid];
      if (!npc || npc.actUnlock > G.act) continue;
      var fav = (G.npcFavor && G.npcFavor[nid]) || 0;
      if (fav < -20) continue; // 敌对的不会主动来访
      eligible.push({ id: nid, favor: fav, npc: npc });
    }
    if (eligible.length === 0) return;

    // 加权随机（好感度中等优先）
    var totalW = 0;
    for (var j = 0; j < eligible.length; j++) {
      var f = eligible[j].favor;
      // 权重：0分最低，中间最高，100分次高
      if (f <= 0) eligible[j]._w = 1;
      else if (f < 30) eligible[j]._w = 5;
      else if (f < 60) eligible[j]._w = 8;
      else if (f < 80) eligible[j]._w = 5;
      else eligible[j]._w = 3;
      totalW += eligible[j]._w;
    }

    var rand = Math.random() * totalW;
    var acc = 0;
    var visitor = eligible[0];
    for (var k = 0; k < eligible.length; k++) {
      acc += eligible[k]._w;
      if (rand <= acc) { visitor = eligible[k]; break; }
    }

    // 根据好感等级选择来访类型
    var npcName = visitor.npc.name;
    var favor = visitor.favor;
    if (favor < 10) {
      // 陌生人试探：小额互动
      var smallEvents = [
        { text: npcName + '路过顺便进来坐坐，寒暄了几句。', effect: function() { G.npcFavor[visitor.id] = (G.npcFavor[visitor.id] || 0) + 1; } },
        { text: npcName + '听说你最近做得不错，发来一条祝贺消息。', effect: function() { G.npcFavor[visitor.id] = (G.npcFavor[visitor.id] || 0) + 2; } },
        { text: npcName + '在社交平台上转发了你公司的一条动态。', effect: function() { if (typeof addConnections === 'function') addConnections(1); } },
      ];
      var ev = smallEvents[Math.floor(Math.random() * smallEvents.length)];
      addLog('👤 ' + ev.text);
      ev.effect();
    } else if (favor < 40) {
      // 熟人：中等互动
      var midEvents = [
        { text: npcName + '带来了一些行业内部消息。', effect: function() { if (typeof addConnections === 'function') addConnections(2); G.npcFavor[visitor.id] = (G.npcFavor[visitor.id] || 0) + 2; } },
        { text: npcName + '约你喝茶，顺便介绍了一个潜在客户。', effect: function() { G.money += 15000 + Math.floor(Math.random() * 35000); G.npcFavor[visitor.id] = (G.npcFavor[visitor.id] || 0) + 3; } },
        { text: npcName + '提醒你注意一个正在酝酿的行业风险。', effect: function() { G.npcFavor[visitor.id] = (G.npcFavor[visitor.id] || 0) + 2; G.reputation = Math.min(100, (G.reputation || 0) + 2); } },
      ];
      var ev2 = midEvents[Math.floor(Math.random() * midEvents.length)];
      addLog('🤝 ' + ev2.text);
      ev2.effect();
    } else if (favor < 70) {
      // 好友：有价值的互动
      var goodEvents = [
        { text: npcName + '主动提出帮你引荐一个重要人脉。', effect: function() { if (typeof addConnections === 'function') addConnections(5); G.npcFavor[visitor.id] = (G.npcFavor[visitor.id] || 0) + 2; } },
        { text: npcName + '私下给你透露了一个即将出台的政策利好。', effect: function() { G.money += 50000 + Math.floor(Math.random() * 100000); G.reputation = Math.min(100, (G.reputation || 0) + 3); } },
        { text: npcName + '邀请你参加了一个高规格的私人聚会。', effect: function() { if (typeof addConnections === 'function') addConnections(8); G.reputation = Math.min(100, (G.reputation || 0) + 5); } },
      ];
      var ev3 = goodEvents[Math.floor(Math.random() * goodEvents.length)];
      addLog('⭐ ' + ev3.text);
      ev3.effect();
    } else {
      // 亲密：重大收益
      var greatEvents = [
        { text: npcName + '把一个重大商业机会优先给了你。', effect: function() { G.money += 100000 + Math.floor(Math.random() * 200000); if (typeof addConnections === 'function') addConnections(3); } },
        { text: npcName + '力排众议为你争取到了一个独家合作。', effect: function() { G.money += 200000; G.reputation = Math.min(100, (G.reputation || 0) + 8); if (typeof addConnections === 'function') addConnections(5); } },
        { text: npcName + '说了一句：「以后有事直接找我，不用客气。」', effect: function() { G.npcFavor[visitor.id] = Math.min(100, (G.npcFavor[visitor.id] || 0) + 8); G.money += 50000; } },
      ];
      var ev4 = greatEvents[Math.floor(Math.random() * greatEvents.length)];
      addLog('🌟 ' + ev4.text);
      ev4.effect();
    }
  }

  // ========== 区域负面效果聚合 ==========
  // 汇总玩家在所有已拥有业务的区域中承受的负面效果
  function getRegionModifiers() {
    var mods = {
      burnoutProb: 1.0,
      disasterProb: 1.0,
      negativeEventProb: 1.0,
      rumorSpread: 1.0,
      socialCost: 1.0,
      policyEventProb: 1.0,
      connGain: 1.0,
    };
    if (!G || !G.businesses) return mods;
    // 遍历所有城市中的业务，汇总所在区域的负面效果
    Object.values(G.cities || {}).forEach(function(city) {
      if (!city || !city.businesses) return;
      Object.entries(city.businesses).forEach(function(entry) {
        var biz = entry[1];
        if (!biz || biz.level <= 0 || !biz.region) return;
        var r = REGIONS[biz.region];
        if (!r) return;
        if (r.bonus.burnoutProb) mods.burnoutProb *= r.bonus.burnoutProb;
        if (r.bonus.disasterProb) mods.disasterProb *= r.bonus.disasterProb;
        if (r.bonus.negativeEventProb) mods.negativeEventProb *= r.bonus.negativeEventProb;
        if (r.bonus.rumorSpread) mods.rumorSpread *= r.bonus.rumorSpread;
        if (r.bonus.socialCost) mods.socialCost *= r.bonus.socialCost;
        if (r.bonus.policyEventProb) mods.policyEventProb *= r.bonus.policyEventProb;
        if (r.bonus.connGain) mods.connGain *= r.bonus.connGain;
      });
    });
    // 王律师法律保护：每个负面惩罚降低 15%
    var npcBonuses = typeof calcNpcBonus === 'function' ? calcNpcBonus() : {};
    if (npcBonuses._lawProtect) {
      var prot = 0.85;
      if (mods.burnoutProb > 1) mods.burnoutProb = 1 + (mods.burnoutProb - 1) * prot;
      if (mods.disasterProb > 1) mods.disasterProb = 1 + (mods.disasterProb - 1) * prot;
      if (mods.negativeEventProb > 1) mods.negativeEventProb = 1 + (mods.negativeEventProb - 1) * prot;
      if (mods.policyEventProb > 1) mods.policyEventProb = 1 + (mods.policyEventProb - 1) * prot;
    }
    return mods;
  }

  // ========== 城市切换 ==========
  function switchCity(cityId) {
    if (!G.cities[cityId] || !G.cities[cityId].unlocked) return false;
    // 保存当前城市业务状态
    G.cities[G.currentCityId].businesses = JSON.parse(JSON.stringify(G.businesses));
    G.currentCityId = cityId;
    // 加载目标城市业务状态
    if (!G.cities[cityId].businesses) G.cities[cityId].businesses = {};
    G.businesses = JSON.parse(JSON.stringify(G.cities[cityId].businesses));
    // 确保所有业务定义都在businesses中存在
    BUSINESS_DEFS.forEach(bDef => {
      if (!G.businesses[bDef.id]) {
        G.businesses[bDef.id] = bDef.unlockMoney === 0
          ? { level: 1, region: bDef.regions ? bDef.regions[0] : null, unlocked: true }
          : { level: 0, region: null, unlocked: false };
      }
    });
    // 同步天气
    GameTime.switchCityWeather(cityId);
    addLog(`📍 切换到：${CITIES[cityId].icon} ${CITIES[cityId].name}`);
    save();
    return true;
  }

  // ========== 富豪等级 ==========
  function updateRank() {
    if (!RANK_TIERS) return;
    let newRank = '个体户';
    for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
      if (G.money >= RANK_TIERS[i].minMoney) {
        newRank = RANK_TIERS[i].name;
        break;
      }
    }
    if (newRank !== G.rank) {
      const oldRank = G.rank;
      G.rank = newRank;
      if (oldRank) {
        addLog(`🏅 头衔晋升：${oldRank} → ${newRank}`);
        if (typeof UI !== 'undefined' && UI.showToast) {
          UI.showToast(`🏅 ${newRank}`);
        }
      }
    }
  }

  // ========== 业务解锁 ==========
  function checkBusinessUnlocks() {
    BUSINESS_DEFS.forEach(b => {
      // 检查并同步到 G.businesses（旧格式兼容）
      let state = G.businesses[b.id];
      if (!state) { G.businesses[b.id] = b.unlockMoney === 0
        ? { level: 1, region: b.regions ? b.regions[0] : null, unlocked: true }
        : { level: 0, region: null, unlocked: false }; state = G.businesses[b.id]; }
      if (!state.unlocked && b.unlockMoney > 0 && G.money >= b.unlockMoney) {
        state.unlocked = true;
        // 同步到所有已解锁城市的 businesses
        if (G.cities) {
          Object.values(G.cities).forEach(function(cityData) {
            if (!cityData || !cityData.unlocked) return;
            if (!cityData.businesses) return;
            var cityBiz = cityData.businesses[b.id];
            if (cityBiz && !cityBiz.unlocked) {
              cityBiz.unlocked = true;
            }
          });
        }
        addLog(`🔓 解锁新业务：${b.icon} ${b.name}！`);
      }
    });
  }

  // ========== 里程碑检查 ==========
  function checkMilestones() {
    if (typeof MILESTONES === 'undefined') return;
    // 综合评分辅助函数
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
    function getCompositeDesc(m) {
      const parts = [];
      const ok = G.money >= m.money;
      parts.push((ok ? '✅' : '⏳') + '资产 ≥ ' + (m.money / 10000).toFixed(0) + '万');
      const repOk = (G.reputation || 0) >= m.repMin;
      parts.push((repOk ? '✅' : '⏳') + '声誉 ≥ ' + m.repMin);
      const bizSum = getTotalBizLevels();
      const bizOk = bizSum >= m.bizSumMin;
      parts.push((bizOk ? '✅' : '⏳') + '业务总等级 ≥ ' + m.bizSumMin + '（当前' + bizSum + '）');
      return parts.join(' | ');
    }
    MILESTONES.forEach(function(m, i) {
      if (G.money >= m.money && G.milestone === i) {
        // 检查附加条件
        const repOk = (G.reputation || 0) >= m.repMin;
        const bizSum = getTotalBizLevels();
        const bizOk = bizSum >= m.bizSumMin;
        if (!repOk || !bizOk) {
          // 条件不满足，提示当前进度（每30 Tick一次避免刷屏）
          if (G.tickCount % 30 === 0) {
            addLog('🎯 到' + m.name + '还差：' + getCompositeDesc(m));
          }
          return;
        }
        G.milestone = i + 1;
        const oldAct = G.act;
        G.act = Math.max(G.act, m.act);
        addLog('🎉 综合里程碑达成：' + m.name + '！' + m.desc + '！');
        addLog('   ' + getCompositeDesc(m));
        showAchievement('🏆', m.name);
        if (typeof AudioFX !== 'undefined') AudioFX.playAchievement();

        // #10: LLM 里程碑叙事
        if (typeof LLM !== 'undefined') {
          LLM.generateMilestoneNarrative(m.name, m.desc).then(function(narrative) {
            if (narrative) {
              addLog('📜 ' + narrative);
              if (typeof UI !== 'undefined' && UI.showToast) UI.showToast('📜 ' + narrative.substring(0, 40) + '...');
            }
          }).catch(function() {});
        }
        // 触发幕次事件
        triggerActEvent(G.act);
        // 幕次推进时奖励技能点
        if (G.act > oldAct) {
          const pts = G.act;
          G.statPoints = (G.statPoints || 0) + pts;
          addLog('📚 进入第' + G.act + '幕，获得 ' + pts + ' 技能点！');
          if (typeof UI !== 'undefined' && UI.showMilestone) {
            UI.showMilestone('🎉 第 ' + G.act + ' 幕 · ' + m.name);
          }
        }
        // 触发里程碑叙事事件
        var msEvent = EVENTS.find(function(e) { return e.id === m.eventId; });
        if (msEvent) {
          setTimeout(function() {
            if (typeof EventSystem !== 'undefined') EventSystem.fireEvent(msEvent);
          }, 1500);
        }
      }
    });
  }

  // ========== 成就检查 ==========
  function checkAchievements() {
    ACHIEVEMENTS.forEach(a => {
      if (G.unlockedAchievements.includes(a.id)) return;
      if (checkAchievementCond(a)) {
        G.unlockedAchievements.push(a.id);
        showAchievement(a.icon, a.name);
        addLog(`🏅 成就解锁：${a.name}`);
        if (typeof AudioFX !== 'undefined') AudioFX.playAchievement();
      }
    });
  }

  // ========== 多城市业务计数辅助 ==========
  function getAllCitiesBizCount() {
    let count = 0;
    Object.values(G.cities || {}).forEach(city => {
      if (!city.unlocked || !city.businesses) return;
      Object.values(city.businesses).forEach(biz => {
        if (biz.level > 0) count++;
      });
    });
    return count;
  }
  function getAllCitiesBizMaxLevel(bizId) {
    let maxLv = 0;
    Object.values(G.cities || {}).forEach(city => {
      if (!city.unlocked || !city.businesses) return;
      const biz = city.businesses[bizId];
      if (biz && biz.level > maxLv) maxLv = biz.level;
    });
    return maxLv;
  }
  function getAllCitiesRegionCount() {
    const regionCount = {};
    Object.values(G.cities || {}).forEach(city => {
      if (!city.unlocked || !city.businesses) return;
      Object.values(city.businesses).forEach(biz => {
        if (!biz || biz.level === 0 || !biz.region) return;
        regionCount[biz.region] = (regionCount[biz.region] || 0) + 1;
      });
    });
    return regionCount;
  }

  function checkAchievementCond(a) {
    switch (a.cond.type) {
      case 'money': return G.money >= a.cond.value;
      case 'money_never_low': return (G.moneyLowest || Infinity) >= (calcTotalIncome() * 3);
      case 'emp_count': return G.employees.length >= a.cond.count;
      case 'biz_count': return getAllCitiesBizCount() >= a.cond.count;
      case 'region_count': return G.unlockedRegions.length >= a.cond.count;
      case 'regions_all': return G.unlockedRegions.length >= 7;
      case 'reputation': return G.reputation >= a.cond.value;
      case 'npc_favor_max': return Object.values(G.npcFavor).some(f => f >= 80);
      case 'npc_favor': return Object.values(G.npcFavor).some(f => f >= a.cond.value);
      case 'npc_favor_count': return Object.values(G.npcFavor).filter(f => f >= (a.cond.value||20)).length >= a.cond.count;
      case 'skill_count': return G.unlockedSkills.length >= a.cond.count;
      case 'decision_count': return (G.decisionCount || 0) >= a.cond.count;
      case 'event_count': return (G.eventCount || 0) >= a.cond.count;
      case 'stress_low_long': return (G.stressLowTickCount || 0) >= 100;
      case 'stress_never_high': return (G.stressHighTickCount || 0) === 0 && G.tickCount > 50;
      case 'speed_run': {
        const ticksAllowed = Math.floor((a.cond.time || 3600) / (CONFIG.TICK_MS / 1000));
        return G.money >= a.cond.value && G.tickCount <= ticksAllowed;
      }
      case 'endings_all': return (G.seenEndings || []).length >= 5;
      case 'play_time': return (G.totalPlayTime || 0) >= ((a.cond.hours || 24) * 3600);
      case 'paperwork': return (G.readEventIds || []).length >= 50;
      case 'biz_level': return getAllCitiesBizMaxLevel(a.cond.bizId) >= a.cond.level;
      case 'biz_in_region': {
        const regionCount = getAllCitiesRegionCount();
        return Object.values(regionCount).some(c => c >= a.cond.count);
      }
      case 'npc_favor_high': return Object.values(G.npcFavor).filter(f => f >= (a.cond.value||50)).length >= a.cond.count;
      case 'negative_events': return (G.negativeEventsSurvived || 0) >= a.cond.count;
      case 'grew_in_recession': return G.grewInRecession === true;
      case 'senior_emp_count': return G.employees.filter(e => e.role !== 'intern').length >= a.cond.count;
      case 'stress_never_above': return (G.stressMax || 0) <= a.cond.value && G.tickCount > 50;
      case 'stock_profit': return (G.stockProfitTotal || 0) >= a.cond.value;
      case 'never_loan': return (G.loans || []).length === 0 && G.tickCount > 200;
      case 'all_tech_max': return BUSINESS_DEFS.filter(b => b.id === 'tech').every(bDef => getAllCitiesBizMaxLevel(bDef.id) >= a.cond.level);
      case 'total_income_earned': return (G.totalIncomeEarned || 0) >= a.cond.value;
      default: return false;
    }
  }

  // ========== 员工离开 ==========
  function checkEmployeeLeave() {
    const avgLoyalty = G.employees.length > 0
      ? G.employees.reduce((s, e) => s + (e.loyalty || 0), 0) / G.employees.length
      : 50;
    // 联动：低忠诚度离职概率翻倍
    const leaveMultiplier = avgLoyalty < 30 ? 2.0 : (avgLoyalty < 50 ? 1.5 : 1.0);
    // 公司吸引力：资产越大离职率越低
    let companyAppeal = 1.0;
    const totalAssets = G.money || 0;
    if (totalAssets > 10000000) {
      companyAppeal = 1.0 - Math.min(0.5, Math.log10(totalAssets / 10000000) * 0.06);
    }
    const finalMultiplier = leaveMultiplier * companyAppeal;

    const leaving = [];
    const survivors = [];
    G.employees.forEach(emp => {
      if (emp.loyalty <= 0) {
        leaving.push(emp);
        addLog(`😢 ${emp.name}（${(EMP_ROLES.find(r=>r.id===emp.role)||{}).name||emp.role}）因忠诚度过低离职了。`);
        return;
      }
      if (Math.random() < 0.002 * finalMultiplier && emp.loyalty < 30) {
        leaving.push(emp);
        addLog(`🚪 ${emp.name}找到了更好的机会，离职了。`);
        return;
      }
      survivors.push(emp);
    });
    // 高管带走客户：独立处理副作用
    leaving.filter(emp => ['cto','manager'].includes(emp.role) && emp.loyalty < 20).forEach(emp => {
      if (Math.random() < 0.005 * finalMultiplier) {
        addLog(`⚠️ ${emp.name}（${(EMP_ROLES.find(r=>r.id===emp.role)||{}).name||emp.role}）带走了一批客户资源！`);
        if (G.businesses) {
          const bizKeys = Object.keys(G.businesses).filter(k => G.businesses[k].level > 0);
          if (bizKeys.length > 0) {
            const hit = bizKeys[Math.floor(Math.random() * bizKeys.length)];
            const bDef = BUSINESS_DEFS.find(b => b.id === hit);
            G.businesses[hit].level = Math.max(1, G.businesses[hit].level - 1);
            if (bDef) addLog(`  业务「${bDef.name}」受到冲击，降级。`);
          }
        }
      }
    });
    // 单 Tick 内最多影响一条业务线（防止多名高管同时离职导致多个产业降级）
    // 已由 `leaving.filter(...).forEach` 自然实现——副作用独立于主过滤
    G.employees = survivors;
  }

  // ========== HR 统管模式 ==========
  function isHRManaged() {
    if (!G || !G.employees) return false;
    const empCount = G.employees.length;
    const hasHR = G.employees.some(e => e.role === 'hr');
    const threshold = hasHR ? CONFIG.HR_THRESHOLD_WITH_HR : CONFIG.HR_THRESHOLD_DEFAULT;
    return empCount >= threshold;
  }

  function calcDeptStats() {
    if (!G || !G.employees) return {};
    const depts = {};
    G.employees.forEach(emp => {
      const roleId = emp.role;
      if (!depts[roleId]) {
        const def = EMP_ROLES.find(r => r.id === roleId);
        depts[roleId] = { name: def ? def.name : roleId, icon: def ? def.icon : '👤', count: 0, sumLoyalty: 0, sumSkill: 0, sumFatigue: 0, employees: [] };
      }
      depts[roleId].count++;
      depts[roleId].sumLoyalty += emp.loyalty || 0;
      depts[roleId].sumSkill += emp.skill || 1;
      depts[roleId].sumFatigue += emp.fatigue || 0;
      depts[roleId].employees.push(emp);
    });
    // 计算平均值
    Object.values(depts).forEach(d => {
      d.avgLoyalty = +(d.sumLoyalty / d.count).toFixed(1);
      d.avgSkill = +(d.sumSkill / d.count).toFixed(1);
      d.avgFatigue = +(d.sumFatigue / d.count).toFixed(1);
    });
    return depts;
  }

  function hrAutoTick() {
    if (!isHRManaged()) return;
    const hrEmp = G.employees.find(e => e.role === 'hr');
    // HR 忠诚度影响管理效率（<30 则折扣失效）
    const hrLoyalty = hrEmp ? (hrEmp.loyalty || 0) : 50;
    const effective = hrLoyalty >= 30;
    // 自动降疲劳
    G.employees.forEach(emp => {
      emp.fatigue = Math.max(0, (emp.fatigue || 0) - CONFIG.HR_AUTO_FATIGUE_REDUCTION);
    });
    // 稳定忠诚（HR在场时全员忠诚衰减减半）
    if (effective) {
      G.employees.forEach(emp => {
        if (emp.loyalty < 40 && Math.random() < 0.15) emp.loyalty = Math.min(100, (emp.loyalty || 0) + 2);
      });
    }
  }

  // ========== 技能效果 ==========
  function applySkillEffects() {
    // 从 G.unlockedSkills 重新计算效果
    G.skillEffects = {};
    G.unlockedSkills.forEach(skId => {
      // 遍历所有技能树找到效果
      Object.values(SKILL_TREES).forEach(tree => {
        const sk = tree.find(s => s.id === skId);
        if (!sk) return;
        if (sk.effect.opCost) G.skillEffects.opCost = (G.skillEffects.opCost || 1) * sk.effect.opCost;
        if (sk.effect.incomeMult) G.skillEffects.incomeMult = (G.skillEffects.incomeMult || 1) * sk.effect.incomeMult;
        if (sk.effect.empMaxBonus) G.skillEffects.empMaxBonus = (G.skillEffects.empMaxBonus || 0) + sk.effect.empMaxBonus;
        if (sk.effect.negativeImpact) G.skillEffects.negativeImpact = (G.skillEffects.negativeImpact || 1) * sk.effect.negativeImpact;
      });
    });
  }

  function canUnlockSkill(sk) {
    if (G.unlockedSkills.includes(sk.id)) return false;
    if (!sk.cond) return true; // 无条件技能可直接解锁
    
    const c = sk.cond;
    switch (c.type) {
      case 'biz_upgrade': {
        const total = getAllCitiesBizCount();
        return total >= (c.count || 1);
      }
      case 'biz_count': return getAllCitiesBizCount() >= (c.count || 1);
      case 'negative_events': return (G.negativeEventsSurvived || 0) >= (c.count || 1);
      case 'emp_count': return G.employees.length >= (c.count || 1);
      case 'biz_lv': {
        if (c.bizType) {
          return getAllCitiesBizMaxLevel(c.bizType) >= (c.level || 1);
        }
        // 检查是否有任何业务达到指定等级
        let maxLv = 0;
        BUSINESS_DEFS.forEach(b => { maxLv = Math.max(maxLv, getAllCitiesBizMaxLevel(b.id)); });
        return maxLv >= (c.level || 1);
      }
      case 'has_role': return G.employees.filter(e => e.role === c.role).length >= (c.count || 1);
      case 'decision_success': return (G.decisionSuccessCount || 0) >= (c.count || 1);
      case 'connections': return (G.stats && G.stats.connections || 0) >= (c.value || 0);
      case 'event_type': return (G.seenEventTypes || []).includes(c.eventType);
      case 'funding': return (G.fundingCount || 0) >= (c.count || 1);
      case 'npc_favor': {
        const favCount = Object.values(G.npcFavor || {}).filter(f => f >= 60).length;
        return favCount >= (c.count || 1);
      }
      case 'fire_emp': return (G.employeesFired || 0) >= (c.count || 1);
      case 'money_never_below': return (G.moneyLowest || Infinity) >= (calcTotalIncome() * 1);
      case 'insurance': return G.insurance === true;
      case 'loans_repaid': return (G.loansRepaid || 0) >= (c.count || 1);
      case 'money': return G.money >= (c.value || 0);
      default: return true; // 未知条件类型，允许解锁
    }
  }

  // ========== 多槽存档系统 ==========
  // ========== 多城市业务同步 ==========
  function syncCityBiz() {
    if (!G || !G.currentCityId || !G.cities[G.currentCityId]) return;
    G.cities[G.currentCityId].businesses = JSON.parse(JSON.stringify(G.businesses));
  }

  function save(slot) {
    try {
      syncCityBiz(); // 存档前同步当前城市业务
      const s = slot || 1;
      // 防御：防止 NaN 污染存档
      if (typeof G.money !== 'number' || isNaN(G.money)) { console.error('[商海浮沉] save blocked: G.money is NaN'); return; }
      if (typeof G.reputation !== 'number' || isNaN(G.reputation)) G.reputation = 0;
      G.saveTime = Date.now();
      G.saveSlot = s;
      const data = { G, tickCount, pendingDecisions };
      Storage.set('shfc_save_slot_' + s, JSON.stringify(data));
    } catch(e) {
      console.error('[商海浮沉] save error:', e);
    }
  }

  function autoSave() {
    try {
      syncCityBiz(); // 自动存档前同步
      G.saveTime = Date.now();
      G.saveSlot = 1;
      const data = { G, tickCount, pendingDecisions };
      Storage.set('shfc_save_slot_1', JSON.stringify(data));
    } catch(e) {}
  }

  function load(slot) {
    try {
      if (slot) {
        const raw = Storage.get('shfc_save_slot_' + slot);
        console.log('[商海浮沉] load slot', slot, 'raw type:', typeof raw, 'length:', raw ? raw.length : 0);
        if (!raw) return false;
        const data = JSON.parse(raw);
        G = data.G;
        tickCount = data.tickCount || 0;
        pendingDecisions = (data.pendingDecisions || []).filter(d => d && d.id && d.choices && d.choices.length > 0);
        migrateSave();
        if (G.unlockedRegions && Array.isArray(G.unlockedRegions)) G.unlockedRegions.forEach(id => { if (REGIONS[id]) REGIONS[id].unlocked = true; });
        // 检查离线收益
        checkAndShowOfflineIncome();
        return true;
      }
      // 未指定槽位：优先slot_1（自动档），然后slot_2、slot_3
      for (const s of [1, 2, 3]) {
        const raw = Storage.get('shfc_save_slot_' + s);
        if (!raw) continue;
        const data = JSON.parse(raw);
        G = data.G;
        tickCount = data.tickCount || 0;
        pendingDecisions = (data.pendingDecisions || []).filter(d => d && d.id && d.choices && d.choices.length > 0);
        migrateSave();
        if (G.unlockedRegions && Array.isArray(G.unlockedRegions)) G.unlockedRegions.forEach(id => { if (REGIONS[id]) REGIONS[id].unlocked = true; });
        // 检查离线收益
        checkAndShowOfflineIncome();
        return true;
      }
      return false;
    } catch(e) {
      console.error('[商海浮沉] load() exception:', e.message, e.stack);
      return false;
    }
  }

  function checkAndShowOfflineIncome() {
    if (!G) return;
    const offline = calcOfflineIncome();
    if (offline.income > 0 && offline.hours > 0.1) {
      G._pendingOfflineIncome = offline;
      // 通知UI显示离线收益弹窗
      setTimeout(() => {
        if (typeof UI !== 'undefined' && UI.showOfflineIncomePopup) {
          UI.showOfflineIncomePopup(offline);
        }
      }, 1000);
    }
  }

  // ========== 存档版本迁移 ==========
  function migrateSave() {
    if (!G) return;
    // 旧存档没有 cities 字段 → 迁移为单城市模式
    if (!G.cities) {
      G.cities = {
        xinhai: {
          unlocked: true,
          businesses: G.businesses ? JSON.parse(JSON.stringify(G.businesses)) : {},
          unlockedRegions: G.unlockedRegions ? [...G.unlockedRegions] : ['yongning']
        }
      };
      G.currentCityId = 'xinhai';
    }
    // 确保当前城市的businesses已加载
    if (G.currentCityId && G.cities[G.currentCityId] && G.cities[G.currentCityId].businesses) {
      G.businesses = G.cities[G.currentCityId].businesses;
    }
    // 没有 rank → 计算
    if (!G.rank && RANK_TIERS) {
      G.rank = '个体户';
      for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
        if (G.money >= RANK_TIERS[i].minMoney) {
          G.rank = RANK_TIERS[i].name;
          break;
        }
      }
    }
    // 确保所有REGIONS的cityId存在
    Object.keys(REGIONS).forEach(rid => {
      if (!REGIONS[rid].cityId) REGIONS[rid].cityId = 'xinhai';
    });
    // 确保所有已解锁城市的区域cityId存在的区域状态正确
    Object.keys(G.cities).forEach(cid => {
      if (!CITIES[cid]) return;
      if (!(cid in G.cities)) G.cities[cid] = { unlocked: false, businesses: {} };
      // 确保每个城市都有所有BUSINESS_DEFS条目
      if (G.cities[cid].unlocked && G.cities[cid].businesses) {
        BUSINESS_DEFS.forEach(bDef => {
          if (!G.cities[cid].businesses[bDef.id]) {
            G.cities[cid].businesses[bDef.id] = bDef.unlockMoney === 0
              ? { level: 1, region: bDef.regions ? bDef.regions[0] : null, unlocked: true }
              : { level: 0, region: null, unlocked: false };
          }
        });
      }
    });
    // 确保当前城市的businesses也初始化
    if (!G.businesses || Object.keys(G.businesses).length === 0) {
      G.businesses = {};
      BUSINESS_DEFS.forEach(bDef => {
        G.businesses[bDef.id] = bDef.unlockMoney === 0
          ? { level: 1, region: bDef.regions ? bDef.regions[0] : null, unlocked: true }
          : { level: 0, region: null, unlocked: false };
      });
    }
    // 迁移天气系统（旧存档没有天气字段）
    if (G.gameHour === undefined) G.gameHour = 7;
    if (G.gameDay === undefined) G.gameDay = 1;
    if (G.currentWeather === undefined) G.currentWeather = 'sunny';
    if (!G.cityWeathers || Object.keys(G.cityWeathers).length === 0) {
      G.cityWeathers = {};
      Object.keys(CITIES).forEach(cityId => {
        const weatherKeys = Object.keys(WEATHERS);
        G.cityWeathers[cityId] = weatherKeys[Math.floor(Math.random() * weatherKeys.length)];
      });
    }
    if (!G.weatherChangeTimer) G.weatherChangeTimer = 6 + Math.floor(Math.random() * 7);
    // 迁移：旧存档没有 autoMode
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
        cooldowns: {},
      };
    }
    // 迁移：旧存档 autoMode 缺少新增字段
    if (G.autoMode.autoManualWork === undefined) G.autoMode.autoManualWork = true;
    if (G.autoMode.autoRest === undefined) G.autoMode.autoRest = true;
    // 迁移：旧存档没有新系统字段
    if (!G.marketShare) {
      G.marketShare = {};
      BUSINESS_DEFS.forEach(b => { G.marketShare[b.id] = 1.0; });
    }
    if (!G.supplyChain) {
      G.supplyChain = {};
      BUSINESS_DEFS.forEach(b => { G.supplyChain[b.id] = { upstream:'normal', downstream:'normal', disruptionTicks: 0 }; });
    }
    if (!G.milestonesAchieved) G.milestonesAchieved = [];
    if (!G.eventQueue) G.eventQueue = [];
    if (G.lastOnlineTime === undefined) G.lastOnlineTime = Date.now();
    // 迁移：清除旧结局状态
    if (G.ending) G.ending = null;
    if (G.retireRequested) G.retireRequested = false;
    // 迁移：给旧员工添加疲劳和技能
    if (G.employees) {
      G.employees.forEach(emp => {
        if (emp.fatigue === undefined) emp.fatigue = 0;
        if (emp.skill === undefined) emp.skill = 1;
        // 迁移：salary → baseSalary（旧版字段名）
        if (emp.salary !== undefined && emp.baseSalary === undefined) {
          emp.baseSalary = emp.salary;
          delete emp.salary;
        }
        // 迁移：旧员工缺少多属性系统 attrs
        if (!emp.attrs) {
          var roleDef = EMP_ROLES.find(function(r) { return r.id === emp.role; });
          var weights = (roleDef && EMP_ROLE_ATTR_WEIGHTS[roleDef.id]) || { ability: 0.5, efficiency: 0.5, creativity: 0.5, experience: 0.5, charisma: 0.5 };
          emp.attrs = {};
          Object.keys(EMP_ATTRIBUTES).forEach(function(key) {
            var def = EMP_ATTRIBUTES[key];
            var w = weights[key] || 1;
            var base = Math.floor(Math.random() * 20) + 20; // 20-39 基础值
            var bonus = Math.floor(Math.random() * w * 10);  // 角色权重加成
            emp.attrs[key] = Math.min(def.max, Math.max(def.min, base + bonus));
          });
        }
        // 迁移：旧员工缺少实习生字段
        if (emp.isIntern === undefined) emp.isIntern = false;
        if (emp.internTicks === undefined) emp.internTicks = 0;
        if (emp.internConverted === undefined) emp.internConverted = false;
        if (emp.internConvertTarget === undefined) emp.internConvertTarget = null;
      });
    }
    // 迁移：添加任务线字段
    if (!G.questProgress) G.questProgress = {};
    if (!G.questCompleted) G.questCompleted = {};
    // 迁移：缺少的核心字段（旧存档兼容）
    if (!G.stats) G.stats = { management: 5, tech: 5, social: 5, finance: 5 };
    if (G.statPoints === undefined) G.statPoints = 0;
    if (!G.unlockedAchievements) G.unlockedAchievements = [];
    if (!G.achievementRead) G.achievementRead = [];
    if (!G.unlockedSkills) G.unlockedSkills = [];
    if (!G.skillEffects) G.skillEffects = {};
    if (!G.npcFavor) G.npcFavor = {};
    if (!G.npcTriggers) G.npcTriggers = {};
    if (!G.eventCooldowns) G.eventCooldowns = {};
    if (!G.eventHistory) G.eventHistory = [];
    if (!G.decisionHistory) G.decisionHistory = [];
    if (!G.rivals) G.rivals = [];
    if (!G.loans) G.loans = [];
    if (!G.stocks) G.stocks = {};
    if (!G.stockPrices) G.stockPrices = {};
    if (!G.stockChangeLog) G.stockChangeLog = [];
    if (!G.stockProfitTotal) G.stockProfitTotal = 0;
    if (!G.neverLoaned) G.neverLoaned = true;
    if (!G.originBonus) G.originBonus = {};
    if (!G.stressLowTickCount) G.stressLowTickCount = 0;
    if (!G._synergyCache) G._synergyCache = null;
    if (!G.negativeEventsSurvived) G.negativeEventsSurvived = 0;
    if (!G.grewInRecession) G.grewInRecession = false;
    if (!G.lastMoneyBeforeRecession) G.lastMoneyBeforeRecession = G.money;
    // 旧版 rpt 字段为对象 {active,days,cost}，新版为数字累计值
    if (!G.rpt || typeof G.rpt === 'object') G.rpt = 0;
    if (!G.activeResearch) G.activeResearch = {};
    if (!G.completedResearch) G.completedResearch = {};
    if (!G.eventLog) G.eventLog = [];
    if (!G.autoSaveEnabled) G.autoSaveEnabled = true;
    // 防御：确保 rivals 是数组
    if (G.rivals && !Array.isArray(G.rivals)) G.rivals = [];
    if (G.employees && !Array.isArray(G.employees)) G.employees = [];
    if (G.loans && !Array.isArray(G.loans)) G.loans = [];
    // 验证 money 不是 NaN
    if (typeof G.money !== 'number' || isNaN(G.money)) G.money = 0;
  }

  function reset() {
    try { for (let i = 1; i <= 3; i++) Storage.remove('shfc_save_slot_' + i); } catch(e) {}
    G = null;
    if (gameTimer) clearInterval(gameTimer);
    if (eventTimer) clearInterval(eventTimer);
    location.reload();
  }

  function getSaveSlots() {
    const slots = [];
    for (let i = 1; i <= 3; i++) {
      try {
        const raw = Storage.get('shfc_save_slot_' + i);
        if (raw) {
          const data = JSON.parse(raw);
          slots.push({
            slot: i,
            exists: true,
            date: data.G.gameDate || data.G.tickCount || 0,
            money: data.G.money || 0,
            act: data.G.act || 1,
            name: data.G.name || '未知',
            tickCount: data.G.tickCount || 0,
            saveTime: data.G.saveTime || 0,
          });
        } else {
          slots.push({ slot: i, exists: false });
        }
      } catch(e) {
        slots.push({ slot: i, exists: false, error: true });
      }
    }
    return slots;
  }

  function exportSave(slot) {
    try {
      const s = slot || 1;
      const raw = Storage.get('shfc_save_slot_' + s);
      if (!raw) return null;
      return raw;
    } catch(e) { return null; }
  }

  function importSave(slot, jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.G) return false;
      const s = slot || 1;
      const saveData = { G: data.G, tickCount: data.tickCount || 0, pendingDecisions: data.pendingDecisions || [] };
      Storage.set('shfc_save_slot_' + s, JSON.stringify(saveData));
      return true;
    } catch(e) { return false; }
  }

  function deleteSaveSlot(slot) {
    try {
      Storage.remove('shfc_save_slot_' + slot);
      return true;
    } catch(e) { return false; }
  }

  // ========== 离线收益 ==========
  // ========== 事件检查 ==========
  // ========== 事件选择缓存（避免每6秒全量遍历EVENTS） ==========
  let _actEventsCache = null;   // 当前幕次匹配的事件列表
  let _actEventsAct = -1;       // 缓存的幕次

  function getActEvents() {
    if (_actEventsAct === G.act && _actEventsCache) return _actEventsCache;
    _actEventsCache = EVENTS.filter(e => !e.acts || e.acts.includes(G.act));
    _actEventsAct = G.act;
    return _actEventsCache;
  }

  function startEventCheck() {
    if (eventTimer) clearInterval(eventTimer);
    // 幕次可能已变，重置缓存
    _actEventsAct = -1;
    eventTimer = setInterval(() => {
      if (isPaused) return;
      if (pendingDecisions.length >= CONFIG.MAX_PENDING_DECISIONS) return;
      if (Math.random() < CONFIG.EVENT_BASE_PROB) {
        tryFireEvent();
      }
    }, CONFIG.EVENT_CHECK_INTERVAL * 1000);
  }

  function tryFireEvent() {
    // 使用缓存：先筛选当前幕次可用事件（预缓存），再检查冷却
    const actEvents = getActEvents();
    const available = actEvents.filter(e => {
      if (e.cooldown && G.eventCooldowns[e.id] && G.tickCount - G.eventCooldowns[e.id] < e.cooldown) return false;
      return true;
    });
    if (available.length === 0) return;

    // === 联动增强：压力/声誉影响事件概率 ===
    const stressMod = (G.stress || 0) > 70 ? 1.5 : ((G.stress || 0) < 20 ? 0.8 : 1.0);
    const repMod = (G.reputation || 0) < 20 ? 1.3 : ((G.reputation || 0) > 80 ? 0.7 : 1.0);

    // 暴风雨天气下，天气类事件权重翻倍
    const weights = available.map(e => {
      let w = (e.weight || 1);
      if (G._stormEventBoost && e.id && e.id.startsWith('weather_')) w *= 2;
      // 高压力：负面事件权重 +50%，正面事件权重 -30%
      if ((G.stress || 0) > 70) {
        const isNegative = (Array.isArray(e.effects.money) && e.effects.money[1] < 1.0) ||
                          (e.type === 'crisis');
        if (isNegative) w *= 1.5;
      }
      // 低声誉：NPC负面事件概率 +30%
      if ((G.reputation || 0) < 20 && e.id && e.id.startsWith('npc_')) {
        const isNegativeNpc = (Array.isArray(e.effects.reputation) && e.effects.reputation[1] < 0) ||
                               (Array.isArray(e.effects.money) && e.effects.money[1] < 1.0);
        if (isNegativeNpc) w *= 1.3;
      }
      // 王律师被动：法律保护 → 负面事件权重 -30%
      var npcBonEvt = typeof calcNpcBonus === 'function' ? calcNpcBonus() : {};
      if (npcBonEvt._lawProtect) {
        const isCrisis = e.type === 'crisis' || (Array.isArray(e.effects.stress) && e.effects.stress[1] > 0);
        if (isCrisis) w *= 0.7;
      }
      // 区域负面效果：负面事件/政策事件概率增加
      var rMods = typeof getRegionModifiers === 'function' ? getRegionModifiers() : null;
      if (rMods) {
        if (rMods.negativeEventProb > 1.0 && (e.type === 'crisis' || (Array.isArray(e.effects.money) && e.effects.money[1] < 1.0))) {
          w *= rMods.negativeEventProb;
        }
        if (rMods.policyEventProb > 1.0 && e.id && e.id.startsWith('policy_')) {
          w *= rMods.policyEventProb;
        }
      }
      return w;
    });

    const totalW = weights.reduce((s, w) => s + w, 0);
    let r = Math.random() * totalW;
    let chosen = available[0];
    for (let i = 0; i < available.length; i++) {
      r -= weights[i];
      if (r <= 0) { chosen = available[i]; break; }
    }
    fireEvent(chosen);
  }

  function fireEvent(event) {
    // 委托给 EventSystem 完整处理事件卡片渲染、日志、热搜、LLM叙事
    if (typeof EventSystem !== 'undefined' && EventSystem.fireEvent) {
      EventSystem.fireEvent(event);
    } else {
      // fallback: 最少记录
      G.eventCooldowns[event.id] = G.tickCount;
      G.eventHistory.push(event.id);
      G.eventCount = (G.eventCount || 0) + 1;
      if (G.eventHistory.length > 500) G.eventHistory = G.eventHistory.slice(-200);
      addLog(`[事件] ${event.title}`);
    }
    // 决策型事件加入 pending（有 choices 即决策事件）
    if (event.choices && event.choices.length > 0) {
      pendingDecisions.push(event);
    }
    // 追踪负面事件（money倍率上限<1.0视为负面事件）
    if (event.effects && Array.isArray(event.effects.money) && event.effects.money[1] < 1.0) {
      G.negativeEventsSurvived = (G.negativeEventsSurvived || 0) + 1;
    }
    // 托管模式：自动决策（立即执行，不作延迟）
    if (G.autoMode && G.autoMode.enabled && G.autoMode.eventDecide && event.choices && event.choices.length > 0) {
      autoDecide(event);
    }
  }

  // ========== NPC事件触发 ==========
  function triggerActEvent(act) {
    // 按幕次触发NPC对话
    Object.values(NPCS).forEach(npc => {
      if (npc.actUnlock <= act - 1 && !G.npcTriggers[npc.id].includes(`act_${act}`)) {
        G.npcTriggers[npc.id].push(`act_${act}`);
        // 触发对话
        setTimeout(() => {
          NPCSystem.openDialog(npc.id, 'greeting');
        }, 2000);
      }
    });
  }

  // ========== 工具 ==========
  function addLog(text) {
    G.eventLog = G.eventLog || [];
    G.eventLog.unshift({ time: G.tickCount, text });
    if (G.eventLog.length > 200) G.eventLog.length = 200;
  }

  function showAchievement(icon, name) {
    // 调用UI
    UI.showAchievement(icon, name);
  }

  function formatMoney(n) {
    if (n == null || isNaN(n)) return '0';
    const sign = n < 0 ? '-' : '';
    n = Math.abs(n);
    if (n >= 1e16) return sign + (n / 1e16).toFixed(2) + 'e16';
    if (n >= 1e12) return sign + (n / 1e12).toFixed(2) + '万亿';
    if (n >= 1e8) return sign + (n / 1e8).toFixed(1) + '亿';
    if (n >= 1e4) return sign + (n / 1e4).toFixed(1) + '万';
    return sign + n.toFixed(0);
  }

  function getEmpMax() {
    if (!G || !G.stats) return 5;
    let base = 3 + Math.floor((G.stats.management || 0) / 2);
    // 每个产业+2上限（跨所有城市）— 业务越多需要更多人
    if (G.cities) {
      Object.values(G.cities).forEach(city => {
        if (!city.unlocked || !city.businesses) return;
        Object.values(city.businesses).forEach(biz => {
          if (biz.level > 0) base += 2;
        });
      });
    }
    // 每个已解锁区域+2上限
    if (G.unlockedRegions) {
      base += G.unlockedRegions.length * 2;
    }
    // 资产规模加成：每达到一个富豪等级门槛+3
    const moneyMilestones = [2000000, 20000000, 100000000, 500000000, 2000000000, 10000000000, 50000000000, 200000000000, 1000000000000, 10000000000000, 100000000000000];
    moneyMilestones.forEach(m => { if (G.money >= m) base += 3; });
    if (G.skillEffects && G.skillEffects.empMaxBonus) base += G.skillEffects.empMaxBonus;
    return base;
  }

  // ========== 手动工作 ==========
  let manualWorkCdUntil = 0;
  function manualWork() {
    if (!G) return { success: false, msg: '游戏未开始' };
    const now = Date.now();
    if (now < manualWorkCdUntil) {
      const remain = Math.ceil((manualWorkCdUntil - now) / 1000);
      return { success: false, msg: `冷却中 (${remain}秒)` };
    }
    manualWorkCdUntil = now + CONFIG.MANUAL_WORK_CD * 1000;
    // 对数衰减：资金越大边际收益越低，防止富者越富通胀
    const baseIncome = Math.max(1000, Math.sqrt(Math.max(0, G.money)) * 200);
    const variance = 0.5 + Math.random();
    let earn = Math.floor(baseIncome * variance);
    // 小概率负面效果
    if (Math.random() < CONFIG.MANUAL_WORK_BAD_PROB) {
      G.stress = Math.min(100, G.stress + 2);
      earn = Math.floor(earn * 0.3);
      addLog('拉项目时碰了钉子，压力+2，收益大减。');
      return { success: true, earn, msg: `碰了钉子，仅获得 ${formatMoney(earn)}，压力+2` };
    }
    G.money += earn;
    // 拉项目附带人脉奖励（小概率）
    if (Math.random() < 0.25) {
      const conn = Math.random() < 0.5 ? 1 : 2;
      addConnections(conn);
    }
    addLog(`手动拉项目获得 ${formatMoney(earn)} 收益！`);
    return { success: true, earn, msg: `拉项目成功！获得 ${formatMoney(earn)}` };
  }
  function getManualWorkCdRemain() {
    const remain = Math.max(0, Math.ceil((manualWorkCdUntil - Date.now()) / 1000));
    return remain;
  }

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
        cooldowns: {},
      };
    }
    G.autoMode.enabled = !G.autoMode.enabled;
    // 初始化托管统计
    if (G.autoMode.enabled) {
      if (!G.autoStats) G.autoStats = { startedAt: 0, totalTicks:0, totalIncome:0, totalExpense:0, decisions:0, businessesOpened:0, businessesUpgraded:0, employeesHired:0, employeesFired:0, regionsUnlocked:0, researchesStarted:0, stocksBought:0, stocksSold:0, giftsGiven:0, loansTaken:0, loansRepaid:0, manualWorks:0 };
      G.autoStats.startedAt = Date.now();
      // 开启托管时立即处理已有的 pending decisions
      if (G.autoMode.eventDecide && pendingDecisions.length > 0) {
        addLog('[托管] 发现 ' + pendingDecisions.length + ' 个待处理决策，开始自动处理...');
        var toProcess = pendingDecisions.slice();
        toProcess.forEach(function(evt) {
          try { autoDecide(evt); } catch(e) { console.error('[托管] 处理待决策事件异常:', e); }
        });
      }
    }
    addLog(G.autoMode.enabled ? '[托管] 全自动托管已开启' : '[托管] 全自动托管已关闭');
    save();
  }

  function setAutoPreference(pref) {
    if (!G) return;
    G.autoMode.eventPreference = pref;
    const names = { aggressive: '激进型', conservative: '保守型', social: '社交型', balanced: '均衡型' };
    addLog('[托管] 决策偏好切换为：' + (names[pref] || pref));
    save();
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
        score += eff.moneyAbs / 10000;
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
    addLog('[托管] ' + event.title + ' → ' + best.text);

    // 统计
    if (G.autoStats) G.autoStats.decisions++;

    // 从 pending 中移除
    pendingDecisions = pendingDecisions.filter(d => d !== event);

    // 优先用 EventSystem.choose（它会处理效果应用、卡片移除、日志记录）
    if (typeof EventSystem !== 'undefined') {
      // EventSystem.choose 内部用 EVENTS.find 查找，对节日/LLM 事件可能找不到
      // 先尝试调用，如果 choose 无法处理则手动应用
      var foundInEvents = typeof EVENTS !== 'undefined' && EVENTS.find(function(e) { return e.id === event.id; });
      if (foundInEvents) {
        EventSystem.choose(event.id, best.idx);
      } else {
        // 非 EVENTS 事件（节日/LLM 生成），手动应用效果
        var bestChoice = event.choices[best.idx];
        if (bestChoice && bestChoice.effect && typeof EventSystem !== 'undefined' && EventSystem.applyEffects) {
          EventSystem.applyEffects(bestChoice.effect);
        } else if (bestChoice && bestChoice.effect) {
          // fallback：直接应用效果
          var eff = bestChoice.effect;
          if (eff.money) {
            if (eff.money > -1 && eff.money < 1 && eff.money !== 0) G.money *= eff.money;
            else G.money += eff.money;
          }
          if (eff.moneyAbs) G.money += eff.moneyAbs;
          if (eff.reputation) G.reputation = Math.max(0, Math.min(100, G.reputation + eff.reputation));
          if (eff.stress) G.stress = Math.max(0, Math.min(100, G.stress + eff.stress));
          if (eff.connections) {
            var scaled = Math.floor(eff.connections * (CONFIG.CONNECTIONS_GAIN_SCALE || 0.6));
            G.connections = Math.min(CONFIG.MAX_CONNECTIONS || 100, Math.max(0, G.connections + scaled));
          }
          if (eff.reputationMul) G.reputation = Math.max(0, Math.min(100, G.reputation * eff.reputationMul));
          if (eff.stressMul) G.stress = Math.max(0, Math.min(100, G.stress * eff.stressMul));
          if (eff.npcFavor && typeof NPCSystem !== 'undefined') {
            Object.entries(eff.npcFavor).forEach(function(entry) {
              NPCSystem.changeFavor(entry[0], entry[1]);
            });
          }
        }
        // 记录决策
        G.decisionHistory.push({ eventId: event.id, choice: best.text, tick: G.tickCount });
        if (G.decisionHistory.length > 500) G.decisionHistory = G.decisionHistory.slice(-200);
        // 移除事件卡片
        var card = document.getElementById('event-' + event.id);
        if (card) card.remove();
        // 重新渲染UI
        if (typeof UI !== 'undefined' && UI.renderAll) { try { UI.renderAll(); } catch(e) {} }
      }
    }
  }

  // ========== 技能系统 ==========
  function getSkillMultiplier() {
    if (!G || !G.skillEffects) return 1.0;
    let mul = 1.0;
    if (G.skillEffects.incomeMult) mul *= G.skillEffects.incomeMult;
    if (G.skillEffects.opCost) mul *= (2 - G.skillEffects.opCost);
    return mul;
  }

  function unlockSkill(skillId) {
    if (!G || G.unlockedSkills.includes(skillId)) return false;
    // 查找技能定义
    let sk = null;
    Object.values(SKILL_TREES).forEach(tree => {
      const found = tree.find(s => s.id === skillId);
      if (found) sk = found;
    });
    if (!sk) return false;
    
    // 条件检查
    if (!canUnlockSkill(sk)) return false;
    // 成本检查（基础成本 - 成就减免）
    const achRewards = typeof calcAchievementRewards === 'function' ? calcAchievementRewards() : {};
    const costReduction = achRewards.skillCostReduce || 0;
    const effectiveCost = Math.max(1, (sk.cost || 1) - costReduction);
    
    if (G.statPoints < effectiveCost) return false;
    
    // 互斥检查
    if (sk.exclusive && typeof SKILL_EXCLUSIVE !== 'undefined') {
      const exclusiveGroup = SKILL_EXCLUSIVE[sk.exclusive];
      if (exclusiveGroup) {
        const otherSkill = exclusiveGroup.find(id => id !== skillId && G.unlockedSkills.includes(id));
        if (otherSkill) {
          addLog(`⚠️ 互斥技能：已选择${sk.exclusive}路线的另一分支，无法同时学习。`);
          return false;
        }
      }
    }
    
    G.unlockedSkills.push(skillId);
    G.statPoints -= effectiveCost;
    applySkillEffects();
    addLog(`🔧 解锁技能：${sk.name}（消耗${effectiveCost}技能点）`);
    save();
    return true;
  }

  // ========== 科技研发系统 ==========
  // (已提取至 core-research.js)
  function generateRPT() {}
  // (已提取至 core-research.js)
  function startResearch(techId) { return window.SGame.startResearch(techId); }
  // (已提取至 core-research.js)
  function checkResearchProgress() {}
  // (已提取至 core-research.js)
  function getTechBonus() { return window.SGame.getTechBonus(); }

  // ========== 股票投资系统（已提取至 core-stock.js） ==========
  function updateStockPrices() {}
  function buyStock(stockId, shares) { return window.SGame.buyStock(stockId, shares); }
  function sellStock(stockId, shares) { return window.SGame.sellStock(stockId, shares); }
  function getStockPortfolioValue() { return window.SGame.getStockPortfolioValue(); }
  function getStockCostBasis() { return window.SGame.getStockCostBasis(); }

  // ========== 银行贷款系统 ==========
  function applyLoan(amount, duration) {
    if (!G) return { ok: false, msg: '游戏未开始' };
    if (G.loans.length >= 3) return { ok: false, msg: '最多同时3笔贷款' };
    const totalAssets = G.money + getStockPortfolioValue();
    // 金行长被动：贷款额度上限 +20%
    var npcBon = typeof calcNpcBonus === 'function' ? calcNpcBonus() : {};
    var maxLoan = totalAssets * 0.5 * (1 + (npcBon._loanCapBonus || 0));
    if (amount > maxLoan) return { ok: false, msg: `贷款额度上限 ${formatMoney(maxLoan)}（总资产50%${npcBon._loanCapBonus ? '(+金行长加成)' : ''}）` };
    if (amount < 10000) return { ok: false, msg: '最低贷款金额 10,000' };
    // 利率：声誉越高利率越低 / 金行长被动：额外 -1.5%
    const interestRate = Math.max(0.05, 0.15 - (G.reputation / 100) * 0.07 - (npcBon._loanRateBonus || 0));
    const interestPerTick = parseFloat((amount * interestRate / duration).toFixed(2));
    const loan = {
      id: Date.now(), amount, duration, remaining: duration,
      interestRate: parseFloat((interestRate * 100).toFixed(1)),
      interestPerTick, repaid: false
    };
    G.loans.push(loan);
    G.money += amount;
    G.neverLoaned = false;
    addLog(`🏦 获批贷款：${formatMoney(amount)}，总息${loan.interestRate}%（期限${duration}Tick）`);
    save();
    return { ok: true, msg: `贷款${formatMoney(amount)}到账`, loan };
  }

  function processLoans() {
    if (!G || !G.loans.length) return;
    G.loans.forEach((loan, i) => {
      if (loan.repaid) return;
      // 扣除利息
      G.money -= loan.interestPerTick;
      loan.remaining--;
      if (loan.remaining <= 0) {
        // 到期扣本金
        if (G.money >= loan.amount) {
          G.money -= loan.amount;
          addLog(`🏦 贷款到期还本：${formatMoney(loan.amount)}（本息合计 ${formatMoney(loan.amount + loan.interestPerTick * loan.duration)}）`);
        } else {
          addLog(`⚠️ 贷款到期但资金不足！催债方上门...`);
          if (typeof EventSystem !== 'undefined') {
            EventSystem.addLog('🚨 催债！有一笔贷款到期无法偿还，声誉受挫！');
          }
          G.reputation = Math.max(0, G.reputation - 15);
          G.stress += 25;
          G.money = Math.max(0, G.money - loan.amount * 0.3);
        }
        loan.repaid = true;
      }
    });
    // 清理已还贷款
    G.loans = G.loans.filter(l => !l.repaid);
  }

  function repayLoan(loanId) {
    if (!G) return { ok: false, msg: '游戏未开始' };
    const loan = G.loans.find(l => l.id === loanId);
    if (!loan) return { ok: false, msg: '找不到贷款记录' };
    const remainingInterest = loan.interestPerTick * loan.remaining;
    const totalDue = loan.amount + remainingInterest;
    if (G.money < totalDue) return { ok: false, msg: `资金不足（需要${formatMoney(totalDue)}）` };
    G.money -= totalDue;
    loan.repaid = true;
    G.loans = G.loans.filter(l => !l.repaid);
    addLog(`🏦 提前还清贷款：${formatMoney(totalDue)}`);
    save();
    return { ok: true, msg: `已还清贷款 ${formatMoney(totalDue)}` };
  }

  // ========== 季节与节日系统 ==========
  function getSeason() {
    if (!G) return 'spring';
    const dayOfYear = ((G.gameDay - 1) % 360) + 1;
    if (dayOfYear <= 90) return 'spring';
    if (dayOfYear <= 180) return 'summer';
    if (dayOfYear <= 270) return 'autumn';
    return 'winter';
  }

  function checkHoliday() {
    if (!G || !G.gameDay) return;
    const dayOfYear = ((G.gameDay - 1) % 360) + 1;
    const holidayKeys = [];
    // 节日映射
    if (dayOfYear === 1) holidayKeys.push('spring_festival');
    if (dayOfYear === 15) holidayKeys.push('lantern');
    if (dayOfYear === 95) holidayKeys.push('qingming');
    if (dayOfYear === 121) holidayKeys.push('labor');
    if (dayOfYear === 145) holidayKeys.push('dragon_boat');
    if (dayOfYear === 188) holidayKeys.push('qixi');
    if (dayOfYear === 227) holidayKeys.push('mid_autumn');
    if (dayOfYear === 274) holidayKeys.push('national');
    if (dayOfYear === 315) holidayKeys.push('double11');
    if (dayOfYear === 346) holidayKeys.push('double12');
    if (dayOfYear === 1 || dayOfYear === 360) holidayKeys.push('newyear');
    if (dayOfYear === 359) holidayKeys.push('christmas');
    holidayKeys.forEach(hk => {
      const firedKey = 'holiday_' + hk + '_' + G.gameDay;
      if (G.eventCooldowns[firedKey]) return;
      G.eventCooldowns[firedKey] = true;
      if (typeof EventSystem !== 'undefined') {
        EventSystem.fireHolidayEvent(hk);
      }
    });
  }

  // ========== 破产检查 ==========
  function checkBankruptcy() {
    if (!G) return;
    G.bankruptTicks = G.bankruptTicks || 0;
    if (G.money < CONFIG.BANKRUPTCY_THRESHOLD) {
      G.bankruptTicks++;
      if (G.bankruptTicks >= CONFIG.BANKRUPTCY_TICKS) {
        // 触发破产
        if (typeof EventSystem !== 'undefined') EventSystem.addLog('💸 资金链断裂！公司进入破产清算...');
        if (typeof UI !== 'undefined') UI.showBankruptcyPanel();
        if (gameTimer) clearInterval(gameTimer);
        if (eventTimer) clearInterval(eventTimer);
      }
    } else {
      G.bankruptTicks = 0;
    }
  }

  // ========== 教程状态 ==========
  function isFirstGame() {
    try {
      return !Storage.get('shfc_tutorial_done');
    } catch(e) { return true; }
  }
  function markTutorialDone() {
    try {
      Storage.set('shfc_tutorial_done', '1');
    } catch(e) {}
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

  function autoManager() {
    if (!G || !G.autoMode || !G.autoMode.enabled) return;
    const am = G.autoMode;
    // 防御：确保新字段存在
    if (am.autoManualWork === undefined) am.autoManualWork = true;
    if (am.autoRest === undefined) am.autoRest = true;
    am.cooldowns = am.cooldowns || {};
    const now = G.tickCount;
    const cd = (key, interval) => (am.cooldowns[key] && (now - am.cooldowns[key]) < interval);
    const setCd = (key) => { am.cooldowns[key] = now; };

    // 初始化统计
    if (!G.autoStats) G.autoStats = { startedAt:Date.now(), totalTicks:0, totalIncome:0, totalExpense:0, decisions:0, businessesOpened:0, businessesUpgraded:0, employeesHired:0, employeesFired:0, regionsUnlocked:0, researchesStarted:0, stocksBought:0, stocksSold:0, giftsGiven:0, loansTaken:0, loansRepaid:0, manualWorks:0 };
    G.autoStats.totalTicks++;

    // 阶段自适应冷却倍率
    const stage = getGameStage();
    const stageCDMult = stage === 'early' ? 1.5 : stage === 'late' ? 0.7 : 1.0;

    // === 日志批量合并 ===
    var batchLogs = [];

    function bLog(msg) { batchLogs.push(msg); }
    function flushBatch() {
      if (batchLogs.length === 0) return;
      if (batchLogs.length === 1) { addLog(batchLogs[0]); }
      else { addLog('[托管] ' + batchLogs.length + '项操作：' + batchLogs.join('；')); }
      batchLogs = [];
    }

    // 安全执行包装：防止单个策略崩溃阻断后续所有策略
    function safeRun(label, fn) {
      try { fn(); }
      catch(e) { console.error('[托管] ' + label + ' 异常:', e); }
    }

    // 0. 自动处理已有的 pending decisions（每次 tick 最多处理1个，避免洪泛）
    if (am.eventDecide && pendingDecisions.length > 0 && !cd('eventDecide', 1)) {
      safeRun('自动决策', function(){
        var evt = pendingDecisions[0];
        if (evt) { autoDecide(evt); setCd('eventDecide'); }
      });
    }

    // 1. 还款检查（每10 tick）
    if (am.autoRepay && !cd('repay', 10)) { safeRun('还款', function(){ autoRepayStrategy(bLog); setCd('repay'); }); }
    // 2. 区域解锁检查（每30 tick * 阶段倍率）
    if (am.autoUnlockRegion && !cd('unlock', Math.round(30 * stageCDMult))) { safeRun('区域解锁', function(){ autoUnlockRegionStrategy(bLog); setCd('unlock'); }); }
    // 3. 业务开设检查（每20 tick）
    if (am.autoOpenBusiness && !cd('openBiz', Math.round(20 * stageCDMult))) { safeRun('业务开设', function(){ autoOpenBusinessStrategy(bLog); setCd('openBiz'); }); }
    // 4. 业务升级检查（每20 tick）
    if (am.autoUpgradeBusiness && !cd('upgrade', Math.round(20 * stageCDMult))) { safeRun('业务升级', function(){ autoUpgradeStrategy(bLog); setCd('upgrade'); }); }
    // 5. 员工招聘检查（每15 tick）
    if (am.autoHire && !cd('hire', 15)) { safeRun('招聘', function(){ autoHireStrategy(bLog); setCd('hire'); }); }
    // 6. 自动解雇检查（每30 tick）
    if (am.autoFire && !cd('fire', 30)) { safeRun('解雇', function(){ autoFireStrategy(bLog); setCd('fire'); }); }
    // 7. 研发检查（每25 tick）
    if (am.autoResearch && !cd('research', 25)) { safeRun('研发', function(){ autoResearchStrategy(bLog); setCd('research'); }); }
    // 8. 股票买卖（每20 tick）
    if (am.autoInvest && !cd('invest', 20)) { safeRun('股票', function(){ autoInvestStrategy(bLog); setCd('invest'); }); }
    // 9. NPC送礼（每30 tick，阶段自适应）
    if (am.autoGift && !cd('gift', stage === 'late' ? 20 : 30)) { safeRun('送礼', function(){ autoGiftStrategy(bLog); setCd('gift'); }); }
    // 10. 贷款检查（每60 tick）
    if (am.autoLoan && !cd('loan', 60)) { safeRun('贷款', function(){ autoLoanStrategy(bLog); setCd('loan'); }); }
    // 11. 自动拉项目（CD 到了就拉，受设置开关控制）
    if (am.autoManualWork) { safeRun('拉项目', function(){ autoManualWorkStrategy(); }); }
    // 11.5 自动NPC商务约谈（每60 tick，好感>40的NPC）
    if (am.autoNegotiate !== false && !cd('negotiate', 60)) { safeRun('商务约谈', function(){ autoNegotiateStrategy(bLog); setCd('negotiate'); }); }
    // 12. 资产自动投资（每30 tick，资金充裕时购买资产）
    if (am.autoAssetBuy !== false && !cd('assetBuy', 30)) { safeRun('资产投资', function(){ autoAssetBuyStrategy(bLog); setCd('assetBuy'); }); }
    // 13. 资产紧急典当（每10 tick，资金窘迫时检查）
    if (am.autoAssetPawn !== false && !cd('assetPawn', 10)) { safeRun('资产典当', function(){ autoAssetPawnStrategy(bLog); setCd('assetPawn'); }); }
    // 14. 自动休息（每10 tick，疲劳>60的员工安排休息，受设置开关控制）
    if (am.autoRest && !cd('rest', 10)) { safeRun('员工休息', function(){ autoRestStrategy(bLog); setCd('rest'); }); }

    flushBatch();
  }

  // 托管：自动购买资产（资金充裕时）- 改用ID
  function autoAssetBuyStrategy(bLog) {
    if (!G || !G.assetMarketListings || G.assetMarketListings.length === 0) return;
    var slotCap = (typeof CONFIG !== 'undefined' && CONFIG.ASSET_MAX_SLOTS) || 20;
    if (G.assets.length >= slotCap) return;
    // 至少保留30%流动资金
    var reserveRatio = 0.3;
    var totalIncome = typeof calcTotalIncome === 'function' ? calcTotalIncome() : 0;
    var reserve = totalIncome * 10;
    var available = G.money - reserve;
    if (available <= 0) return;
    var bestIdx = -1;
    var bestScore = -1;
    for (var i = 0; i < G.assetMarketListings.length; i++) {
      var l = G.assetMarketListings[i];
      if (l.price > available * 0.5) continue;
      var score = (l.trend || 0.003) * 100 - (l.volatility || 0.05) * 20 + (l.rarity === 'epic' ? 0.3 : l.rarity === 'rare' ? 0.2 : 0);
      if (score > bestScore) { bestScore = score; bestIdx = i; }
    }
    if (bestIdx >= 0 && buyAsset(bestIdx)) {
      var lastAsset = G.assets[G.assets.length - 1];
      bLog('购入资产：' + (lastAsset ? lastAsset.name : '未知'));
    }
  }

  // 托管：紧急典当（资金窘迫时）- 改用ID
  function autoAssetPawnStrategy(bLog) {
    if (!G || G.assets.length === 0) return;
    var totalExpense = typeof calcTotalExpense === 'function' ? calcTotalExpense() : 0;
    if (G.money > totalExpense * 2) return;
    var worstIdx = -1;
    var worstVal = Infinity;
    for (var i = 0; i < G.assets.length; i++) {
      var inAuction = G.assetAuctionList && G.assetAuctionList.some(function(a) { return a.assetId === G.assets[i].id; });
      if (inAuction) continue;
      var cv = G.assets[i].currentPrice || G.assets[i].purchasePrice;
      if (cv < worstVal) { worstVal = cv; worstIdx = i; }
    }
    if (worstIdx >= 0) {
      var ast = G.assets[worstIdx];
      if (pawnAsset(ast.id)) {
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
        bLog('还款 ' + formatMoney(totalDue));
        if (G.autoStats) G.autoStats.loansRepaid++;
      }
    });
    G.loans = G.loans.filter(l => !l.repaid);
  }

  function autoUnlockRegionStrategy(bLog) {
    if (!G) return;
    const cityId = G.currentCityId;
    const cityDef = CITIES[cityId];
    if (!cityDef) return;
    Object.values(REGIONS).forEach(r => {
      if (r.unlocked || G.unlockedRegions.includes(r.id)) return;
      if (r.cityId !== cityId) return;
      if (r.actUnlock > 0 && G.act < r.actUnlock) return;
      if (r.unlockCond && r.unlockCond.money && G.money >= r.unlockCond.money) {
        unlockRegion(r.id);
        bLog(r.icon + ' 解锁 ' + r.name);
        if (G.autoStats) G.autoStats.regionsUnlocked++;
      }
    });
  }

  function autoOpenBusinessStrategy(bLog) {
    if (!G) return;

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
          let cost = (lv1.cost || 0) * 10000;
          if (G.origin === 'rich2nd') cost = Math.floor(cost * 0.8);
          candidates.push({ bizId: bDef.id, name: bDef.name, icon: bDef.icon, score: bestScore, region: bestRegion, cost, cityId });
        }
      });
    });

    // 同时兼容旧 G.businesses 格式
    if (G.businesses && Object.keys(G.cities || {}).length === 0) {
      const cityId = G.currentCityId;
      const cityDef = CITIES[cityId];
      const cityRegions = cityDef ? (cityDef.regionIds || []) : [];
      const unlockedRegions = cityRegions.filter(rid => {
        const r = REGIONS[rid];
        return r && (r.unlocked || G.unlockedRegions.includes(rid));
      });
      BUSINESS_DEFS.forEach(bDef => {
        const state = G.businesses[bDef.id];
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
          let cost = (lv1.cost || 0) * 10000;
          if (G.origin === 'rich2nd') cost = Math.floor(cost * 0.8);
          candidates.push({ bizId: bDef.id, name: bDef.name, icon: bDef.icon, score: bestScore, region: bestRegion, cost, cityId: cityId || 'xinhai' });
        }
      });
    }

    candidates.sort((a, b) => b.score - a.score);
    for (const c of candidates) {
      if (G.money >= c.cost * 2) {
        if (c.cost > 0) G.money -= c.cost;
        // 在对应城市中开业
        var targetCity = G.cities && G.cities[c.cityId];
        if (targetCity && targetCity.businesses) {
          targetCity.businesses[c.bizId] = targetCity.businesses[c.bizId] || { level: 0, region: null, unlocked: true };
          targetCity.businesses[c.bizId].level = 1;
          targetCity.businesses[c.bizId].region = c.region;
          targetCity.businesses[c.bizId].unlocked = true;
        }
        // 兼容旧格式
        if (G.businesses) {
          G.businesses[c.bizId] = G.businesses[c.bizId] || { level: 0, region: null, unlocked: true };
          G.businesses[c.bizId].level = 1;
          G.businesses[c.bizId].region = c.region;
          G.businesses[c.bizId].unlocked = true;
        }
        bLog(c.icon + ' 开业 ' + c.name);
        if (G.autoStats) G.autoStats.businessesOpened++;
        break;
      }
    }
  }

  function autoUpgradeStrategy(bLog) {
    if (!G) return;
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
          const cost = nextLv.cost * 10000;
          const incomeGain = (nextLv.income - curLv.income) * 10000;
          if (cost <= 0) return;
          const roi = incomeGain / cost;
          candidates.push({ bizId: bDef.id, name: bDef.name, icon: bDef.icon, cost, roi, nextLv, cityId });
        });
      });
    }
    // 兼容旧格式
    if (candidates.length === 0 && G.businesses) {
      BUSINESS_DEFS.forEach(function(bDef) {
        const state = G.businesses[bDef.id];
        if (!state || state.level === 0 || state.level >= bDef.levels.length) return;
        const curLv = bDef.levels[state.level - 1];
        const nextLv = bDef.levels[state.level];
        if (!curLv || !nextLv) return;
        const cost = nextLv.cost * 10000;
        const incomeGain = (nextLv.income - curLv.income) * 10000;
        if (cost <= 0) return;
        const roi = incomeGain / cost;
        candidates.push({ bizId: bDef.id, name: bDef.name, icon: bDef.icon, cost, roi, nextLv, cityId: G.currentCityId || 'xinhai' });
      });
    }

    candidates.sort((a, b) => b.roi - a.roi);
    const stage = getGameStage();
    // 阶段自适应阈值：早期更保守（留更多现金），后期更激进
    const baseThreshold = G.autoMode.upgradeThreshold || 0.3;
    const stageMult = stage === 'early' ? 0.7 : stage === 'late' ? 1.3 : 1.0;
    const threshold = baseThreshold * stageMult;

    for (const c of candidates) {
      let cost = c.cost;
      if (G.origin === 'rich2nd') cost = Math.floor(cost * 0.8);
      if (G.money >= cost / threshold) {
        G.money -= cost;
        // 升级对应城市的业务
        var targetCity = G.cities && G.cities[c.cityId];
        if (targetCity && targetCity.businesses && targetCity.businesses[c.bizId]) {
          targetCity.businesses[c.bizId].level++;
        }
        // 兼容旧格式
        if (G.businesses && G.businesses[c.bizId]) {
          G.businesses[c.bizId].level++;
        }
        bLog(c.icon + ' 升级 ' + c.name + '→' + c.nextLv.name);
        if (G.autoStats) G.autoStats.businessesUpgraded++;
        break;
      }
    }
  }

  function autoHireStrategy(bLog) {
    if (!G) return;
    const maxEmp = isHRManaged() ? getEmpMax() : Math.min(G.autoMode.maxEmployees || 8, getEmpMax());
    if (G.employees.length >= maxEmp) return;
    const curTotalSalary = G.employees.reduce((s, e) => s + calcActualSalary(e.baseSalary || e.salary, G) * 10000, 0);
    // 放宽招聘条件：只要收入 >= 工资的1.0倍即可招聘（而非1.5倍），避免招聘只开局触发
    const totalIncome = calcTotalIncome();
    if (totalIncome < curTotalSalary * 1.0 && G.money < curTotalSalary * 12) return;
    // HR 统管模式
    if (isHRManaged()) {
      const depts = calcDeptStats();
      const entries = Object.entries(depts).sort((a, b) => a[1].count - b[1].count);
      for (const [roleId, stats] of entries) {
        const result = batchHireDept(roleId, stats.count + 2);
        if (result.ok && result.hired > 0) {
          if (G.autoStats) G.autoStats.employeesHired += result.hired;
          bLog('招聘 ' + result.hired + '人');
          return;
        }
      }
      return;
    }
    // 逐个招聘：根据游戏阶段智能选择角色
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
      }
      const estimatedSalary = calcActualSalary(def.baseSalary, G);
      // 实习生实习期工资打折，降低招人门槛
      var salaryForCheck = (def.id === 'intern') ? estimatedSalary * (CONFIG.INTERN_SALARY_RATIO || 0.5) : estimatedSalary;
      if (G.money >= salaryForCheck * 10000 * 3) { chosenRole = def; break; }
    }
    if (!chosenRole) {
      const candidates = EMP_ROLES.filter(r => {
        if (r.req) {
          if (r.req.empCount && G.employees.length < r.req.empCount) return false;
          if (r.req.money && G.money < r.req.money) return false;
        }
        const estSalary = calcActualSalary(r.baseSalary, G);
        return G.money >= estSalary * 10000 * 3;
      });
      if (candidates.length === 0) return;
      chosenRole = candidates[Math.floor(Math.random() * candidates.length)];
    }
    // 生成带属性的员工
    const newEmp = generateEmployeeWithAttributes(chosenRole, G);
    G.employees.push(newEmp);

    // 尝试用 LLM 生成员工背景（异步，不阻塞）
    if (typeof LLM !== 'undefined' && LLM.generateEmployeeBackground) {
      LLM.generateEmployeeBackground(chosenRole.name).then(function(bg) {
        if (bg) { newEmp.background = bg; save(); }
      }).catch(function() {});
    }

    bLog('招聘 ' + newEmp.name + '（' + chosenRole.name + '）');
    if (G.autoStats) G.autoStats.employeesHired++;
  }

  function autoFireStrategy(bLog) {
    if (!G || G.employees.length <= 2) return;
    if (isHRManaged()) return;
    const threshold = G.autoMode.fireThreshold || 20;
    const toFire = G.employees.filter(e => e.loyalty < threshold);
    if (toFire.length === 0) return;
    toFire.sort((a, b) => a.loyalty - b.loyalty);
    const emp = toFire[0];
    const actualSalary = calcActualSalary(emp.baseSalary || emp.salary, G);
    const effectiveSalary = calcInternSalary(emp, actualSalary);
    const comp = effectiveSalary * 3 * 10000;
    if (G.money < comp) return;
    G.money -= comp;
    G.employees = G.employees.filter(e => e.id !== emp.id);
    G.employeesFired = (G.employeesFired || 0) + 1;
    bLog('解雇 ' + emp.name + '（忠诚' + emp.loyalty.toFixed(0) + '）');
    if (G.autoStats) G.autoStats.employeesFired++;
  }

  function autoResearchStrategy(bLog) {
    if (!G || G.activeResearch) return;
    // === 智能路线选择：根据游戏阶段和需求动态排序 ===
    const stage = getGameStage();
    var routes = ['digital', 'ai', 'blockchain'];
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
    for (var i = 0; i < routes.length; i++) {
      var rid = routes[i];
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
  }

  function autoInvestStrategy(bLog) {
    if (!G) return;
    const budget = G.money * (G.autoMode.investBudget || 0.1);
    if (budget < 10000) return;
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
    if (G.money < (G.autoMode.giftBudget || 50000) * 1.5) return;
    // 按好感度排序，只考虑今天还没送过的 NPC
    var candidates = [];
    Object.entries(G.npcFavor).forEach(function(entry) {
      var npcId = entry[0], favor = entry[1];
      var npc = NPCS[npcId];
      if (!npc || (npc.actUnlock || 0) > G.act) return;
      // 检查每日冷却（通过 NPC 系统）
      if (typeof NPCSystem !== 'undefined' && !NPCSystem.canGiftToday(npcId)) return;
      candidates.push({ npcId: npcId, npc: npc, favor: favor });
    });
    if (candidates.length === 0) return;
    candidates.sort(function(a, b) { return a.favor - b.favor; });
    var target = candidates[0];
    if (target.favor >= 80) return; // 好感够高了，不送

    // 根据 NPC 偏好选择礼物类型
    var prefs = target.npc.giftPreferences || {};
    var giftTypes = ['wine', 'book', 'art', 'tech', 'luxury'];
    var chosenGift = null;
    // 优先选最爱的，其次喜欢的
    if (prefs.love && prefs.love.length > 0) chosenGift = prefs.love[0];
    else if (prefs.like && prefs.like.length > 0) chosenGift = prefs.like[0];
    else chosenGift = giftTypes[Math.floor(Math.random() * giftTypes.length)];

    // 调用 NPC 系统的送礼方法（含每日冷却、偏好计算、联动传播）
    if (typeof NPCSystem !== 'undefined' && typeof NPCSystem.giveGift === 'function') {
      var result = NPCSystem.giveGift(target.npcId, chosenGift);
      if (result.ok) {
        bLog('送礼 ' + target.npc.name);
        if (G.autoStats) G.autoStats.giftsGiven++;
      }
    }
  }

  function autoLoanStrategy(bLog) {
    if (!G || G.loans.length >= 3) return;
    const totalSalary = G.employees.reduce((s, e) => s + calcActualSalary(e.baseSalary || e.salary, G) * 10000, 0);
    // 阶段自适应：早期更保守，仅在被逼无奈时贷款
    const stage = getGameStage();
    const loanThreshold = stage === 'early' ? 1.5 : stage === 'mid' ? 2.5 : 2.0;
    if (G.money > totalSalary * loanThreshold) return;
    const totalAssets = G.money + (typeof getStockPortfolioValue === 'function' ? getStockPortfolioValue() : 0);
    // 早期少借，后期可以借更多
    const loanRatio = stage === 'early' ? 0.08 : stage === 'mid' ? 0.12 : 0.18;
    const loanAmt = Math.floor(totalAssets * loanRatio);
    if (loanAmt < 50000) return;
    applyLoan(loanAmt, 60);
    bLog('贷款 ' + formatMoney(loanAmt));
    if (G.autoStats) G.autoStats.loansTaken++;
  }

  // 自动休息策略：疲劳>60的员工自动休息，每10tick检查
  function autoRestStrategy(bLog) {
    if (!G) return;
    var rested = [];
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

  // 自动拉项目策略：CD到了就拉，同时刷新UI按钮状态
  function autoManualWorkStrategy() {
    if (!G) return;
    if (!G.autoMode || !G.autoMode.autoManualWork) return;
    const cdRemain = getManualWorkCdRemain();
    if (cdRemain > 0) return;
    const result = manualWork();
    if (result && result.success && result.earn > 0) {
      if (G.autoStats) { G.autoStats.manualWorks++; G.autoStats.totalIncome += result.earn; }
      addLog('[托管] 🤝 自动拉项目 +' + formatMoney(result.earn));
      if (typeof UI !== 'undefined' && UI.renderManualButton) {
        try { UI.renderManualButton(); } catch(e) {}
      }
      if (typeof UI !== 'undefined' && UI.startCdTimer) {
        try { UI.startCdTimer(); } catch(e) {}
      }
    }
  }

  // 托管：自动NPC商务约谈（每60 tick检查一次，与高好感NPC谈判获取收益）
  function autoNegotiateStrategy(bLog) {
    if (!G || !G.npcFavor) return;
    // 筛选好感度>40的NPC，随机选一个进行商务约谈
    var eligibleNpcIds = Object.entries(G.npcFavor)
      .filter(function(e) { return e[1] > 40; })
      .map(function(e) { return e[0]; });
    if (eligibleNpcIds.length === 0) return;
    var npcId = eligibleNpcIds[Math.floor(Math.random() * eligibleNpcIds.length)];
    if (typeof NPCSystem !== 'undefined' && typeof NPCSystem.negotiate === 'function') {
      NPCSystem.negotiate(npcId, 'business');
      var npcName = (NPCS[npcId] && NPCS[npcId].name) || npcId;
      bLog('💼 与' + npcName + '商务约谈');
    }
  }



  // ===================================================
  //  竞争对手AI系统
  // ===================================================
  // (已提取至 core-rival.js)
  function updateRivals() {}
  // (已提取至 core-rival.js)
  function getRivalRank() { return window.SGame.getRivalRank(); }

  // ===================================================
  //  联动：新闻→股票
  // ===================================================
  function applyNewsStockEffect(category, isPositive, sector) {
    if (!G || typeof STOCKS === 'undefined') return;
    // 行业→股票风格映射
    const sectorToStyle = {
      '科技': 'tech', '金融': 'finance', '地产': 'real_estate',
      '零售': 'retail', '能源': 'energy', '医药': 'health',
      '物流': 'logistics', 'AI': 'tech', '区块链': 'finance',
      '新能源': 'energy', '5G': 'tech', '量子计算': 'tech',
    };
    const style = sectorToStyle[sector] || 'tech';
    const changePct = isPositive
      ? 0.05 + Math.random() * 0.10   // 利好：+5%~+15%
      : -(0.05 + Math.random() * 0.10); // 利空：-5%~-15%
    // 影响对应风格股票（遍历 STOCKS 定义，修改 G.stockPrices）
    Object.entries(STOCKS).forEach(([sid, stock]) => {
      if (stock.style === style) {
        const oldPrice = G.stockPrices[sid] || stock.basePrice;
        G.stockPrices[sid] = Math.max(1, +(oldPrice * (1 + changePct)).toFixed(2));
        G.stockChangeLog[sid] = parseFloat((changePct * 100).toFixed(2));
      }
    });
    // 竞争对手相关新闻：影响对应风格股票
    if (category === '财经' || category === '科技') {
      const extra = isPositive ? 0.02 : -0.02;
      Object.entries(STOCKS).forEach(([sid, stock]) => {
        if (stock.style === style) {
          const oldPrice = G.stockPrices[sid] || stock.basePrice;
          G.stockPrices[sid] = Math.max(1, +(oldPrice * (1 + extra)).toFixed(2));
        }
      });
    }
  }

  // ===================================================
  //  新闻生成系统
  // ===================================================
  function generateNews() {
    if (!G || typeof NEWS_TEMPLATES === 'undefined' || typeof NEWS_CATEGORIES === 'undefined') return;
    const category = NEWS_CATEGORIES[Math.floor(Math.random() * NEWS_CATEGORIES.length)];
    const catTemplates = NEWS_TEMPLATES.find(ct => ct.category === category);
    if (!catTemplates) return;
    const template = catTemplates.templates[Math.floor(Math.random() * catTemplates.templates.length)];
    const companies = ['鼎盛','恒通','新世纪','蓝天','远洋','星辰','海天','腾跃','华远','峰云'];
    const sectors = ['科技','金融','地产','零售','能源','医药','物流'];
    const fillVars = {
      company: companies[Math.floor(Math.random()*companies.length)],
      sector: sectors[Math.floor(Math.random()*sectors.length)],
      amount: Math.floor(Math.random()*90+10),
      quarter: Math.floor(Math.random()*4+1),
      growth: Math.floor(Math.random()*60+10),
      rate: (Math.random()*2+0.25).toFixed(1),
      num: Math.floor(Math.random()*900+100),
      round: ['天使','A','B','C','D'][Math.floor(Math.random()*5)],
      technology: ['5G','AI','区块链','量子计算','生物医药','新能源'][Math.floor(Math.random()*6)],
      project: ['TensorFlow','React','Vue','PyTorch','Docker','K8s'][Math.floor(Math.random()*6)],
      event: ['世界人工智能大会','达沃斯论坛','CES','MWC','进博会'][Math.floor(Math.random()*5)],
      city: ['杭州','深圳','成都','武汉','南京'][Math.floor(Math.random()*5)],
      policy: ['数字经济促进条例','营商环境优化方案','高新技术企业认定办法'][Math.floor(Math.random()*3)],
      platform: ['微博','抖音','快手','小红书'][Math.floor(Math.random()*4)],
      celebrity: ['张某某','李某某','王某','刘某'][Math.floor(Math.random()*4)],
      brand: ['华为','苹果','蔚来','小米','京东'][Math.floor(Math.random()*5)],
      change: ['持平','上涨0.1%','下降0.2%'][Math.floor(Math.random()*3)],
      country: ['美国','日本','德国','法国','韩国'][Math.floor(Math.random()*5)],
      action: ['加息','降息','维持'][Math.floor(Math.random()*3)],
      cpi: (Math.random()*4+1).toFixed(1),
    };
    let text = template;
    Object.keys(fillVars).forEach(k => { text = text.replace('{'+k+'}', fillVars[k]); });
    const isPositive = Math.random() > 0.35;
    const newsItem = {
      id: 'news_' + (G.newsHistory.length + 1),
      text, category, isPositive,
      timestamp: G.tickCount,
      heat: Math.floor(Math.random() * 9000 + 1000)
    };
    G.newsHistory.push(newsItem);
    if (G.newsHistory.length > 100) G.newsHistory.shift();
    G.news.unshift(newsItem);
    if (G.news.length > 10) G.news = G.news.slice(0, 10);
    // 业务影响
    if (typeof NEWS_BIZ_EFFECTS !== 'undefined') {
      const effects = NEWS_BIZ_EFFECTS[category];
      if (effects) {
        Object.keys(effects).forEach(bizId => {
          const range = effects[bizId];
          const mult = range[0] + Math.random() * (range[1] - range[0]);
          G.newsEffects[bizId] = 1 + mult;
        });
      }
    }
    // 竞争对手关联新闻
    if (Math.random() < 0.3 && G.rivals && G.rivals.length > 0) {
      const rival = G.rivals[Math.floor(Math.random() * G.rivals.length)];
      const rivalNews = {
        id: 'news_rival_' + (G.newsHistory.length + 1),
        text: `${rival.name}（${rival.boss}）宣布进军${fillVars.sector}领域，业界关注。`,
        category: '财经', isPositive: Math.random() > 0.4,
        timestamp: G.tickCount, heat: Math.floor(Math.random() * 8000 + 2000)
      };
      G.newsHistory.push(rivalNews);
      G.news.unshift(rivalNews);
      if (G.news.length > 10) G.news = G.news.slice(0, 10);
    }
    G._newsEffectsPending = true;

    // === 联动：新闻→股票 ===
    applyNewsStockEffect(category, isPositive, fillVars.sector);
  }

  function applyNewsEffects(incomeObj) {
    if (!G || !G.newsEffects || !G._newsEffectsPending) return incomeObj;
    const result = {};
    Object.keys(incomeObj).forEach(bizId => {
      result[bizId] = incomeObj[bizId];
      if (G.newsEffects[bizId]) result[bizId] *= G.newsEffects[bizId];
    });
    G._newsEffectsPending = false;
    G.newsEffects = {};
    return result;
  }

  // ===================================================
  //  子公司自动运营
  // ===================================================
  function manageSubsidiaries() {
    if (!G || !G.subsidiaries) return;
    let totalSubIncome = 0;
    // 联动：子公司收益比例随母公司规模提升
    const playerTotalAssets = G.money + getStockPortfolioValue();
    const scaleBonus = Math.min(0.20, Math.floor(playerTotalAssets / 10000000) * 0.02); // 每1000万+2%
    const incomeRate = 0.60 + scaleBonus; // 基础60%，最高80%

    Object.keys(G.subsidiaries).forEach(cityId => {
      const sub = G.subsidiaries[cityId];
      if (!sub || !sub.enabled) return;
      sub.tickCount = (sub.tickCount || 0) + 1;
      const cityDef = (typeof CITIES !== 'undefined' && CITIES[cityId]) ? CITIES[cityId] : null;
      if (!cityDef) return;
      // 联动：子公司所在城市天气影响
      let weatherMod = 1.0;
      if (G.cityWeathers && G.cityWeathers[cityId]) {
        const w = WEATHERS[G.cityWeathers[cityId]];
        if (w) weatherMod = w.incomeMod;
      }
      // 联动：经济波动影响子公司
      const econMod = getEconomicMultiplier();
      const baseIncome = 50000 + Math.random() * 200000;
      const income = Math.floor(baseIncome * incomeRate * weatherMod * econMod * (0.8 + Math.random() * 0.4));
      sub.totalIncome = (sub.totalIncome || 0) + income;
      totalSubIncome += income;
      G.money += income;
      sub.lastIncome = income;
      // 联动：子公司偶尔触发独立事件
      if (Math.random() < 0.005) {
        const subEvents = [
          { text: `${sub.cityName}子公司签下大客户！`, bonus: Math.floor(baseIncome * 3) },
          { text: `${sub.cityName}子公司遭遇税务稽查，罚款。`, bonus: -Math.floor(baseIncome * 2) },
          { text: `${sub.cityName}子公司获得政府补贴。`, bonus: Math.floor(baseIncome * 2) },
          { text: `${sub.cityName}子公司员工集体加薪。`, bonus: -Math.floor(baseIncome * 1.5) },
        ];
        const evt = subEvents[Math.floor(Math.random() * subEvents.length)];
        G.money += evt.bonus;
        totalSubIncome += evt.bonus;
        addLog(`🏢 ${evt.text} ${evt.bonus > 0 ? '+' + formatMoney(evt.bonus) : formatMoney(evt.bonus)}`);
      }
    });
    if (totalSubIncome > 0 && G.tickCount % 5 === 0) {
      const subCount = Object.values(G.subsidiaries).filter(s => s.enabled).length;
      addLog(`🏢 ${subCount}家子公司贡献 ${formatMoney(totalSubIncome)}（分成${(incomeRate*100).toFixed(0)}%）`);
    }
  }

  function toggleSubsidiary(cityId) {
    if (!G || !G.subsidiaries) return false;
    if (!G.subsidiaries[cityId]) {
      const cityDef = (typeof CITIES !== 'undefined' && CITIES[cityId]) ? CITIES[cityId] : { name: cityId };
      G.subsidiaries[cityId] = {
        enabled: true, cityName: cityDef.name || cityId,
        tickCount: 0, totalIncome: 0, lastIncome: 0
      };
      addLog(`🏢 ${cityDef.name || cityId}转为子公司自动运营（60%收益）。`);
      return true;
    }
    G.subsidiaries[cityId].enabled = !G.subsidiaries[cityId].enabled;
    const cityDef = (typeof CITIES !== 'undefined' && CITIES[cityId]) ? CITIES[cityId] : { name: cityId };
    const status = G.subsidiaries[cityId].enabled ? '转为子公司运营（60%收益）' : '恢复手动管理（100%收益）';
    addLog(`🔄 ${cityDef.name || cityId}${status}`);
    return G.subsidiaries[cityId].enabled;
  }

  function getSubsidiarySummary() {
    if (!G || !G.subsidiaries) return { count: 0, totalIncome: 0 };
    let count = 0, totalIncome = 0;
    Object.values(G.subsidiaries).forEach(s => {
      if (s.enabled) { count++; totalIncome += (s.totalIncome || 0); }
    });
    return { count, totalIncome };
  }

  // ===================================================
  //  维护成本系统
  // ===================================================
  function calcMaintenanceCost() {
    if (!G) return 0;
    var npcBon = typeof calcNpcBonus === 'function' ? calcNpcBonus() : {};
    let total = 0;
    // 遍历所有已解锁城市
    Object.values(G.cities || {}).forEach(city => {
      if (!city.unlocked) return;
      Object.entries(city.businesses || {}).forEach(([bizId, biz]) => {
        if (!biz || biz.level === 0) return;
        const bDef = BUSINESS_DEFS.find(b => b.id === bizId);
        if (!bDef) return;
        const lv = bDef.levels[biz.level - 1];
        if (!lv) return;
        const baseIncome = lv.income * 10000;
        const rate = CONFIG.MAINTENANCE_BASE_RATE + biz.level * CONFIG.MAINTENANCE_LEVEL_SCALE;
        total += baseIncome * rate;
      });
    });
    // 刘会计被动：维护成本 -10%
    if (npcBon._maintenanceDiscount) total *= (1 - npcBon._maintenanceDiscount);
    // 刘会计临时buff：税务优化（持续多个tick的额外折扣）
    if (G._taxOptBuff && G._taxOptBuff.remaining > 0) {
      total *= (1 - G._taxOptBuff.discount);
      G._taxOptBuff.remaining--;
      if (G._taxOptBuff.remaining <= 0) addLog('税务优化期已结束。');
    }
    return total;
  }

  // ===================================================
  //  运营风险系统
  // ===================================================
  function triggerOperationalRisk() {
    if (!G) return;
    const risks = [
      { text: '消防检查发现隐患，罚款', moneyLoss: 0.02, repLoss: 2 },
      { text: '税务抽查，需补缴', moneyLoss: 0.03, repLoss: 0 },
      { text: '员工工伤事故', moneyLoss: 0.01, stressAdd: 5, repLoss: 3 },
      { text: '供应商临时涨价', moneyLoss: 0.015, repLoss: 0 },
      { text: '客户投诉，声誉受损', moneyLoss: 0.005, repLoss: 5 },
      { text: '设备故障维修', moneyLoss: 0.02, repLoss: 0 },
      { text: '竞争对手挖角', moneyLoss: 0, repLoss: 2, loyaltyHit: true },
    ];
    const risk = risks[Math.floor(Math.random() * risks.length)];
    const loss = G.money * risk.moneyLoss;
    G.money -= loss;
    if (risk.repLoss) G.reputation = Math.max(0, G.reputation - risk.repLoss);
    if (risk.stressAdd) G.stress = Math.min(100, G.stress + risk.stressAdd);
    if (risk.loyaltyHit && G.employees.length > 0) {
      const emp = G.employees[Math.floor(Math.random() * G.employees.length)];
      emp.loyalty = Math.max(0, emp.loyalty - 10);
    }
    addLog(`⚠️ ${risk.text}，损失 ${formatMoney(loss)}`);
  }

  // ===================================================
  //  供应链系统
  // ===================================================
  function checkSupplyChain() {
    if (!G || !G.supplyChain) return;
    Object.entries(G.supplyChain).forEach(([bizId, sc]) => {
      // 恢复计时
      if (sc.disruptionTicks > 0) {
        sc.disruptionTicks--;
        if (sc.disruptionTicks <= 0) {
          if (sc.upstream === 'disrupted') { sc.upstream = 'normal'; addLog(`🔗 ${BUSINESS_DEFS.find(b=>b.id===bizId)?.name || bizId} 上游供应链恢复`); }
          if (sc.downstream === 'disrupted') { sc.downstream = 'normal'; addLog(`🔗 ${BUSINESS_DEFS.find(b=>b.id===bizId)?.name || bizId} 下游销售链恢复`); }
        }
        return;
      }
      // 随机断供
      if (Math.random() < CONFIG.SUPPLY_CHAIN_RISK) {
        const isUpstream = Math.random() < 0.5;
        const key = isUpstream ? 'upstream' : 'downstream';
        sc[key] = 'disrupted';
        sc.disruptionTicks = CONFIG.SUPPLY_CHAIN_RECOVER_TICKS + Math.floor(Math.random() * 4);
        const bizName = BUSINESS_DEFS.find(b => b.id === bizId)?.name || bizId;
        const what = isUpstream ? '上游供应断裂' : '下游销售渠道中断';
        addLog(`🔗 ${bizName} ${what}！预计${sc.disruptionTicks}Tick恢复`);
      }
    });
  }

  // ===================================================
  //  市场份额系统
  // ===================================================
  function updateMarketShare() {
    if (!G || !G.marketShare || !G.rivals) return;
    Object.keys(G.marketShare).forEach(bizId => {
      if (!G.marketShare[bizId]) G.marketShare[bizId] = 1.0;
      // 对手蚕食
      G.rivals.forEach(r => {
        if (Math.random() < CONFIG.MARKET_SHARE_DECAY * 0.1) {
          G.marketShare[bizId] = Math.max(0.3, G.marketShare[bizId] - 0.005);
        }
      });
      // 玩家恢复（声誉高恢复快）
      if (G.marketShare[bizId] < 1.0 && Math.random() < CONFIG.MARKET_SHARE_RECOVERY) {
        const repBonus = G.reputation > 60 ? 0.01 : 0.005;
        G.marketShare[bizId] = Math.min(1.0, G.marketShare[bizId] + repBonus);
      }
    });
  }

  // ===================================================
  //  高级里程碑系统（替代结局）
  // ===================================================
  function checkMilestonesAdvanced() {
    if (!G) return;
    const advMilestones = [
      { id: 'ms_1b', name: '十亿资产', desc: '资产突破10亿', icon: '🏆', cond: () => G.money >= 1000000000 },
      { id: 'ms_10b', name: '百亿资产', desc: '资产突破100亿', icon: '💎', cond: () => G.money >= 10000000000 },
      { id: 'ms_100b', name: '千亿资产', desc: '资产突破1000亿', icon: '🌟', cond: () => G.money >= 100000000000 },
      { id: 'ms_1t', name: '万亿资产', desc: '资产突破1万亿', icon: '⭐', cond: () => G.money >= 1000000000000 },
      { id: 'ms_all_cities', name: '全球版图', desc: '解锁所有城市', icon: '🌏', cond: () => Object.keys(CITIES).every(cid => G.cities[cid] && G.cities[cid].unlocked) },
      { id: 'ms_biz_10', name: '满级业务', desc: '任意业务达到10级', icon: '🔥', cond: () => BUSINESS_DEFS.some(bDef => getAllCitiesBizMaxLevel(bDef.id) >= 10) },
      { id: 'ms_all_biz_10', name: '全能满级', desc: '所有业务达到10级', icon: '👑', cond: () => BUSINESS_DEFS.every(bDef => getAllCitiesBizMaxLevel(bDef.id) >= 10) },
      { id: 'ms_tech_max', name: '科技全满', desc: '三条研发路线全满', icon: '🔬', cond: () => G.completedResearch && Object.values(G.completedResearch).every(v => v >= 5) },
      { id: 'ms_rank_1', name: '榜首', desc: '竞争对手排名中位列第一', icon: '🥇', cond: () => getRivalRank().rank === 1 && getRivalRank().total >= 2 },
      { id: 'ms_comeback', name: '东山再起', desc: '破产后资产重返千万', icon: '🔥', cond: () => G.comebackFromBankruptcy && G.money >= 10000000 },
    ];
    advMilestones.forEach(ms => {
      if (G.milestonesAchieved.includes(ms.id)) return;
      if (ms.cond()) {
        G.milestonesAchieved.push(ms.id);
        addLog(`🏅 里程碑达成：${ms.icon} ${ms.name} — ${ms.desc}`);
        if (typeof UI !== 'undefined' && UI.showToast) UI.showToast(`🏅 ${ms.name}`);
        // 奖励技能点
        G.statPoints = (G.statPoints || 0) + 2;
        addLog(`📚 获得 2 技能点！`);

        // #10: LLM 里程碑叙事
        if (typeof LLM !== 'undefined') {
          (function(msName, msDesc) {
            LLM.generateMilestoneNarrative(msName, msDesc).then(function(narrative) {
              if (narrative) {
                addLog('📜 ' + narrative);
                if (typeof UI !== 'undefined' && UI.showToast) UI.showToast('📜 ' + narrative.substring(0, 40) + '...');
              }
            }).catch(function() {});
          })(ms.name, ms.desc);
        }
      }
    });
  }

  // ===================================================
  //  员工培训系统
  // ===================================================
  function trainEmployee(empId) {
    if (!G) return { ok: false, msg: '游戏未开始' };
    const emp = G.employees.find(e => e.id === empId);
    if (!emp) return { ok: false, msg: '员工不存在' };
    const curSkill = emp.skill || 1;
    // 吴教练被动：技能上限 +1
    var npcBon = typeof calcNpcBonus === 'function' ? calcNpcBonus() : {};
    var maxSkill = (typeof CONFIG !== 'undefined' ? CONFIG.EMP_SKILL_MAX : 5) + (npcBon._skillCapBonus || 0);
    if (curSkill >= maxSkill) return { ok: false, msg: '技能已满级' };
    // 吴教练被动：培训成本 -20%
    var cost = CONFIG.EMP_TRAINING_COST_BASE * curSkill * curSkill * (1 - (npcBon._trainCostDiscount || 0));
    cost = Math.round(cost);
    if (G.money < cost) return { ok: false, msg: `培训费不足（需要${formatMoney(cost)}）` };
    G.money -= cost;
    emp.skill = curSkill + 1;
    emp.loyalty = Math.min(100, (emp.loyalty || 0) + 5);
    addLog(`📚 ${emp.name} 培训完成，技能升至 ${emp.skill} 级`);
    save();
    return { ok: true, msg: `${emp.name} 技能升至 ${emp.skill} 级` };
  }

  // ===================================================
  //  员工休息（降疲劳）
  // ===================================================
  function restEmployee(empId) {
    if (!G) return { ok: false, msg: '游戏未开始' };
    const emp = G.employees.find(e => e.id === empId);
    if (!emp) return { ok: false, msg: '员工不存在' };
    const cost = 5000;
    if (G.money < cost) return { ok: false, msg: '资金不足' };
    G.money -= cost;
    emp.fatigue = Math.max(0, (emp.fatigue || 0) - 30);
    emp.happiness = Math.min(100, (emp.happiness || 50) + 10);
    addLog(`😴 ${emp.name} 休息恢复，疲劳-30`);
    save();
    return { ok: true, msg: `${emp.name} 疲劳恢复` };
  }

  // ===================================================
  //  离线收益增强系统
  // ===================================================
  function calcOfflineIncome() {
    if (!G || !G.saveTime) return { income: 0, ticks: 0, hours: 0 };
    const now = Date.now();
    const elapsed = (now - G.saveTime) / 1000; // 秒
    const maxSec = CONFIG.MAX_OFFLINE_HOURS * 3600;
    const validSec = Math.min(elapsed, maxSec);
    if (validSec < CONFIG.TICK_MS / 1000) return { income: 0, ticks: 0, hours: 0 };
    const ticks = Math.floor(validSec / (CONFIG.TICK_MS / 1000));
    // 按当前速率估算 × 离线效率
    const perTick = calcTotalIncome();
    const efficiency = CONFIG.OFFLINE_EFFICIENCY;
    const totalIncome = perTick * Math.min(ticks, maxSec / (CONFIG.TICK_MS / 1000)) * efficiency;
    const hours = Math.floor(validSec / 3600 * 10) / 10;
    return { income: totalIncome, ticks, hours };
  }

  function claimOfflineIncome() {
    if (!G) return 0;
    const offline = calcOfflineIncome();
    if (offline.income <= 0) return 0;
    G.money += offline.income;
    G.lastOnlineTime = Date.now();
    G.offlineIncomeClaimed = true;
    addLog(`💤 离线收益到账：${formatMoney(offline.income)}（离线${offline.hours}小时，效率${(CONFIG.OFFLINE_EFFICIENCY * 100).toFixed(0)}%）`);
    save();
    return offline.income;
  }

  // ===================================================
  //  一键升级业务
  // ===================================================
  function upgradeBusinessMax(bizId) {
    if (!G) return { ok: false, msg: '游戏未开始', levels: 0 };
    const bDef = BUSINESS_DEFS.find(b => b.id === bizId);
    if (!bDef) return { ok: false, msg: '未知业务', levels: 0 };
    const state = G.businesses[bizId];
    if (!state || state.level === 0) return { ok: false, msg: '业务未开设', levels: 0 };
    let upgraded = 0;
    while (state.level < bDef.levels.length) {
      const nextLv = bDef.levels[state.level];
      if (!nextLv) break;
      // 检查前置条件
      if (nextLv.reqCond) {
        if (nextLv.reqCond.techLv) {
          const maxTechLv = Math.max(0, ...Object.values(G.completedResearch || {}));
          if (maxTechLv < nextLv.reqCond.techLv) break;
        }
        if (nextLv.reqCond.rep && G.reputation < nextLv.reqCond.rep) break;
        if (nextLv.reqCond.npcFavor) {
          let pass = true;
          Object.entries(nextLv.reqCond.npcFavor).forEach(([npcId, minFavor]) => {
            if ((G.npcFavor[npcId] || 0) < minFavor) pass = false;
          });
          if (!pass) break;
        }
      }
      const cost = nextLv.cost * 10000;
      if (G.money < cost) break;
      G.money -= cost;
      state.level++;
      upgraded++;
    }
    if (upgraded > 0) {
      addLog(`⬆️ ${bDef.icon} ${bDef.name} 一键升级 ${upgraded} 级 → Lv${state.level}`);
      save();
      return { ok: true, msg: `升级${upgraded}级`, levels: upgraded };
    }
    return { ok: false, msg: '无法升级（资金不足或前置条件未满足）', levels: 0 };
  }

  // ===================================================
  //  批量招聘
  // ===================================================
  function batchHire(roleId, count) {
    if (!G) return { ok: false, msg: '游戏未开始', hired: 0 };
    const roleDef = EMP_ROLES.find(r => r.id === roleId);
    if (!roleDef) return { ok: false, msg: '未知角色', hired: 0 };
    const maxEmp = getEmpMax();
    const canHire = Math.min(count, maxEmp - G.employees.length);
    if (canHire <= 0) return { ok: false, msg: '员工已满', hired: 0 };
    const actualSalary = calcActualSalary(roleDef.baseSalary, G);
    const totalCost = actualSalary * 10000 * canHire * 2;
    if (G.money < totalCost) return { ok: false, msg: `资金不足（需要${formatMoney(totalCost)}）`, hired: 0 };
    let hired = 0;
    const firstNames = ['王','李','张','刘','陈','杨','赵','周','吴','徐','孙','马','朱','胡','郭'];
    const lastNames = ['明','华','强','伟','磊','静','敏','婷','杰','浩','飞','洋','芳','军','平'];
    for (let i = 0; i < canHire; i++) {
      var newEmp = generateEmployeeWithAttributes(roleDef, G);
      G.employees.push(newEmp);
      hired++;
    }
    G.money -= totalCost;
    addLog(`👥 批量招聘 ${hired} 名${roleDef.name}，花费 ${formatMoney(totalCost)}`);
    save();
    return { ok: true, msg: `招聘${hired}人`, hired };
  }

  // ========== HR 统管：批量招聘部门 ==========
  // ===================================================
  //  员工属性系统
  // ===================================================
  // 员工属性定义：每个属性有范围[min, max]和初始随机区间
  const EMP_ATTRIBUTES = {
    ability:     { name: '能力',   icon: '💪', min: 1, max: 100, desc: '综合工作能力，直接影响收入加成' },
    efficiency:  { name: '效率',   icon: '⚡', min: 1, max: 100, desc: '工作效率，降低疲劳增长速度' },
    creativity:  { name: '创造力', icon: '💡', min: 1, max: 100, desc: '创新能力，影响科技类和媒体类收益' },
    experience:  { name: '经验',   icon: '📖', min: 1, max: 100, desc: '行业经验，降低负面事件概率' },
    charisma:    { name: '魅力',   icon: '✨', min: 1, max: 100, desc: '社交魅力，影响销售和NPC交互效果' },
  };

  // 各角色属性倾向权重（生成时加权随机）
  const EMP_ROLE_ATTR_WEIGHTS = {
    intern:      { ability: 0.3, efficiency: 0.4, creativity: 0.5, experience: 0.1, charisma: 0.3 },
    developer:   { ability: 0.7, efficiency: 0.6, creativity: 0.9, experience: 0.5, charisma: 0.2 },
    designer:    { ability: 0.5, efficiency: 0.4, creativity: 1.0, experience: 0.4, charisma: 0.5 },
    sales:       { ability: 0.5, efficiency: 0.6, creativity: 0.3, experience: 0.6, charisma: 1.0 },
    analyst:     { ability: 0.8, efficiency: 0.8, creativity: 0.4, experience: 0.9, charisma: 0.3 },
    manager:     { ability: 0.7, efficiency: 0.7, creativity: 0.4, experience: 0.8, charisma: 0.8 },
    lawyer:      { ability: 0.6, efficiency: 0.5, creativity: 0.3, experience: 1.0, charisma: 0.6 },
    hr:          { ability: 0.4, efficiency: 0.6, creativity: 0.3, experience: 0.6, charisma: 0.9 },
    finance_emp: { ability: 0.7, efficiency: 0.7, creativity: 0.2, experience: 0.9, charisma: 0.4 },
    marketer:    { ability: 0.5, efficiency: 0.5, creativity: 0.8, experience: 0.5, charisma: 0.9 },
    cto:         { ability: 1.0, efficiency: 0.9, creativity: 1.0, experience: 1.0, charisma: 0.6 },
  };

  // 生成带完整属性的员工
  function generateEmployeeWithAttributes(roleDef, gamestate) {
    var firstNames = ['王','李','张','刘','陈','杨','赵','周','吴','徐','孙','马','朱','胡','郭','何','林','罗','高','梁','宋','唐','许','韩','邓','冯','曹','彭','曾','萧','田','董','袁','潘','于','蒋','蔡','余','杜','叶','程','苏','魏','吕','丁','任','沈','姚','卢','姜','崔','钟','谭','陆','汪','范','廖','石','金','贾','夏','龙','万','方','雷','邱','邵','孔','白','段','薛','侯','江','尹','熊','伍'];
    var lastNames = ['明','华','强','伟','磊','静','敏','婷','杰','浩','洋','雪','云','飞','翔','军','平','芳','英','丽','鑫','鹏','辉','宇','涛','博','达','超','波','清','峰','刚','龙','梅','兰','竹','菊','悦','欣','宁','安','然','阳','光','星','月','晨','辰','思','睿','逸','文','武','志','勇','义','信','礼','智','诚','恒','远','宏','建','国','海','天','山','川','林','森','松','柏','荣','盛','昌','福','寿','禄','禧','嘉','瑞','祥','康','健','宁'];
    var name = firstNames[Math.floor(Math.random() * firstNames.length)] + lastNames[Math.floor(Math.random() * lastNames.length)];
    // 有概率生成三字名
    if (Math.random() < 0.3) {
      name += lastNames[Math.floor(Math.random() * lastNames.length)];
    }
    var actualSalary = calcActualSalary(roleDef.baseSalary, gamestate);
    var loyalty = +(30 + Math.random() * 40).toFixed(0);

    // 根据角色倾向生成属性
    var weights = EMP_ROLE_ATTR_WEIGHTS[roleDef.id] || { ability: 0.5, efficiency: 0.5, creativity: 0.5, experience: 0.5, charisma: 0.5 };
    var attrs = {};
    Object.keys(EMP_ATTRIBUTES).forEach(function(attrKey) {
      var w = weights[attrKey] || 0.5;
      // 基础值 = 加权随机，权重越高越可能出高值
      var base = Math.floor(10 + w * 50 + Math.random() * 30 + Math.random() * 10);
      // 资产规模加成：公司越大，能招到的人才平均素质更高
      if (gamestate && gamestate.money > 10000000) {
        var scaleBonus = Math.min(15, Math.log10(gamestate.money / 10000000) * 3);
        base += Math.floor(Math.random() * scaleBonus);
      }
      base = Math.max(EMP_ATTRIBUTES[attrKey].min, Math.min(EMP_ATTRIBUTES[attrKey].max, base));
      attrs[attrKey] = base;
    });

    // 技能初始化受能力影响
    var skill = attrs.ability > 70 ? 2 : 1;

    gamestate.empIdCounter++;
    var emp = {
      id: gamestate.empIdCounter,
      name: name,
      role: roleDef.id,
      baseSalary: roleDef.baseSalary,
      loyalty: loyalty,
      happiness: 50,
      icon: roleDef.icon || '👤',
      fatigue: 0,
      skill: skill,
      attrs: attrs,
    };
    // 实习生专属字段：实习期计数、是否已转正、转正目标角色
    if (roleDef.id === 'intern') {
      emp.isIntern = true;
      emp.internTicks = 0;
      emp.internConverted = false;
      // 生成时即根据属性倾向确定转正方向
      emp.internConvertTarget = null; // 先置空，下面计算
    }
    // 延迟计算 internConvertTarget（需要 emp.attrs 已就绪）
    if (emp.isIntern && !emp.internConvertTarget) {
      var convertCandidates = roleDef.internConvertTo || ['developer', 'sales', 'analyst'];
      var bestRole = null;
      var bestScore = -1;
      convertCandidates.forEach(function(rid) {
        var weights = EMP_ROLE_ATTR_WEIGHTS[rid];
        if (!weights) return;
        var score = 0;
        Object.keys(weights).forEach(function(attrKey) {
          score += (emp.attrs[attrKey] || 0) * weights[attrKey];
        });
        if (score > bestScore) { bestScore = score; bestRole = rid; }
      });
      emp.internConvertTarget = bestRole || convertCandidates[Math.floor(Math.random() * convertCandidates.length)];
    }
    return emp;
  }

  // ========== 实习生转正系统 ==========

  // 获取实习生转正候选角色列表（根据游戏阶段加权选择）
  function getInternConvertTarget(emp) {
    var roleDef = EMP_ROLES.find(function(r) { return r.id === 'intern'; });
    if (!roleDef || !roleDef.internConvertTo) return null;
    var candidates = roleDef.internConvertTo;
    // 根据属性倾向推荐最合适的角色
    if (emp.attrs) {
      var bestRole = null;
      var bestScore = -1;
      candidates.forEach(function(rid) {
        var weights = EMP_ROLE_ATTR_WEIGHTS[rid];
        if (!weights) return;
        var score = 0;
        Object.keys(weights).forEach(function(attrKey) {
          score += (emp.attrs[attrKey] || 0) * weights[attrKey];
        });
        if (score > bestScore) { bestScore = score; bestRole = rid; }
      });
      if (bestRole) return bestRole;
    }
    // 随机选一个
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  // 实习生转正
  function convertIntern(emp) {
    if (!emp || !emp.isIntern || emp.internConverted) return false;
    var targetRoleId = emp.internConvertTarget || getInternConvertTarget(emp);
    if (!targetRoleId) return false;
    var targetRole = EMP_ROLES.find(function(r) { return r.id === targetRoleId; });
    if (!targetRole) return false;

    // 转正：更新角色、薪资、属性加成
    emp.role = targetRoleId;
    emp.baseSalary = targetRole.baseSalary;
    emp.icon = targetRole.icon || '👤';
    emp.internConverted = true;
    emp.isIntern = false;

    // 转正属性提升
    if (emp.attrs) {
      var bonus = CONFIG.INTERN_CONVERT_ATTR_BONUS || 10;
      Object.keys(emp.attrs).forEach(function(key) {
        emp.attrs[key] = Math.min(100, (emp.attrs[key] || 0) + Math.floor(Math.random() * bonus));
      });
    }
    // 转正忠诚度加成
    emp.loyalty = Math.min(100, (emp.loyalty || 50) + (CONFIG.INTERN_CONVERT_LOYALTY_BONUS || 15));
    // 转正幸福度加成
    emp.happiness = Math.min(100, (emp.happiness || 50) + 15);

    addLog('🎓✨ ' + emp.name + ' 实习期满，转正为' + targetRole.name + '！属性提升、薪资调整');
    save();
    return true;
  }

  // 每Tick检查实习生转正
  function checkInternConversion() {
    if (!G || !G.employees) return;
    G.employees.forEach(function(emp) {
      if (!emp.isIntern || emp.internConverted) return;
      emp.internTicks = (emp.internTicks || 0) + 1;
      if (emp.internTicks >= (CONFIG.INTERN_TICKS_TO_CONVERT || 20)) {
        // 转正
        convertIntern(emp);
      }
    });
  }

  // 计算实习生实际工资（实习期为正式工资的50%）
  function calcInternSalary(emp, baseSalary) {
    if (emp.isIntern && !emp.internConverted) {
      return baseSalary * (CONFIG.INTERN_SALARY_RATIO || 0.5);
    }
    return baseSalary;
  }

  // 计算员工属性对收入的总加成
  function calcEmpAttrIncomeBonus(emp) {
    if (!emp || !emp.attrs) return 0;
    var bonus = 0;
    // 能力 → 直接收入加成（每10点+0.67%）
    bonus += (emp.attrs.ability || 50) / 1500;
    // 效率 → 等效收入（每10点+0.33%，但疲劳时惩罚减少）
    bonus += (emp.attrs.efficiency || 50) / 3000;
    // 创造力 → 科技/媒体加成
    if (emp.role === 'developer' || emp.role === 'cto' || emp.role === 'designer') {
      bonus += (emp.attrs.creativity || 50) / 2000;
    }
    if (emp.role === 'marketer') {
      bonus += (emp.attrs.creativity || 50) / 3000;
    }
    // 经验 → 风险降低等效加成（每10点+0.2%）
    bonus += (emp.attrs.experience || 50) / 5000;
    // 魅力 → 销售/HR加成
    if (emp.role === 'sales') {
      bonus += (emp.attrs.charisma || 50) / 2000;
    }
    if (emp.role === 'hr' || emp.role === 'manager') {
      bonus += (emp.attrs.charisma || 50) / 3000;
    }
    return bonus;
  }

  function batchHireDept(roleId, targetCount) {
    if (!G) return { ok: false, msg: '游戏未开始', hired: 0 };
    const roleDef = EMP_ROLES.find(r => r.id === roleId);
    if (!roleDef) return { ok: false, msg: '未知角色', hired: 0 };
    const currentCount = G.employees.filter(e => e.role === roleId).length;
    const need = Math.max(0, targetCount - currentCount);
    if (need <= 0) return { ok: false, msg: `该部门已有${currentCount}人，达到目标`, hired: 0 };
    const maxEmp = getEmpMax();
    const canHire = Math.min(need, maxEmp - G.employees.length);
    if (canHire <= 0) return { ok: false, msg: '员工已满', hired: 0 };
    const actualSalary = calcActualSalary(roleDef.baseSalary, G);
    const totalCost = actualSalary * 10000 * canHire * 2 * CONFIG.HR_HIRE_DISCOUNT; // HR折扣
    if (G.money < totalCost) return { ok: false, msg: `资金不足（需要${formatMoney(totalCost)}）`, hired: 0 };
    let hired = 0;
    for (let i = 0; i < canHire; i++) {
      var newEmp = generateEmployeeWithAttributes(roleDef, G);
      G.employees.push(newEmp);
      hired++;
    }
    G.money -= totalCost;
    addLog(`🏢 [HR统管] 批量招聘 ${hired} 名${roleDef.name}，花费 ${formatMoney(totalCost)}（HR折扣）`);
    save();
    return { ok: true, msg: `招聘${hired}人`, hired };
  }

  // ========== HR 统管：批量培训部门 ==========
  function batchTrainDept(roleId) {
    if (!G) return { ok: false, msg: '游戏未开始', trained: 0 };
    const roleDef = EMP_ROLES.find(r => r.id === roleId);
    if (!roleDef) return { ok: false, msg: '未知角色', trained: 0 };
    const deptEmps = G.employees.filter(e => e.role === roleId);
    if (deptEmps.length === 0) return { ok: false, msg: '该部门无员工', trained: 0 };
    // 计算总成本（按单人培训成本 × 人数 × HR折扣）
    let totalCost = 0;
    let trained = 0;
    deptEmps.forEach(emp => {
      const curSkill = emp.skill || 1;
      if (curSkill >= CONFIG.EMP_SKILL_MAX) return;
      totalCost += CONFIG.EMP_TRAINING_COST_BASE * curSkill * curSkill;
    });
    totalCost *= CONFIG.HR_TRAIN_DISCOUNT;
    if (totalCost <= 0) return { ok: false, msg: '该部门员工均已满级', trained: 0 };
    if (G.money < totalCost) return { ok: false, msg: `培训资金不足（需要${formatMoney(totalCost)}）`, trained: 0 };
    G.money -= totalCost;
    deptEmps.forEach(emp => {
      if ((emp.skill || 1) < CONFIG.EMP_SKILL_MAX) {
        emp.skill = (emp.skill || 1) + 1;
        emp.loyalty = Math.min(100, (emp.loyalty || 0) + 3);
        trained++;
      }
    });
    addLog(`📚 [HR统管] ${roleDef.name}部门培训完成，${trained}人技能提升，花费 ${formatMoney(totalCost)}（团训折扣）`);
    save();
    return { ok: true, msg: `${trained}人技能提升`, trained };
  }

  // ===================================================
  //  禁用结局检查（改为no-op）
  // ===================================================
  function checkEndings() {
    // 已禁用 — 长期放置游戏不设结局
    // 旧存档中有 G.ending 的会被忽略
    if (G && G.ending) {
      // 清除旧存档的结局状态，恢复游戏
      G.ending = null;
      if (!gameTimer) startTick();
      if (!eventTimer) startEventCheck();
      addLog('🔄 继续你的商业旅程，永无止境！');
    }
  }

  // ===================================================
  //  退休改为"暂离"（不再结束游戏）
  // ===================================================
  function retireGame() {
    if (!G) return;
    // 不再触发结局，而是暂停游戏
    isPaused = !isPaused;
    addLog(isPaused ? '⏸️ 游戏已暂停' : '▶️ 游戏继续');
  }

  // ---- 人脉操作（带上限）----
  function addConnections(n) {
    if (!G) return;
    const max = (typeof CONFIG !== 'undefined' && CONFIG.MAX_CONNECTIONS) || 100;
    G.connections = Math.min(max, Math.max(0, (G.connections || 0) + n));
  }

  // ===================================================
  //  LLM 增强功能（#5-#10）
  // ===================================================

  // #5: LLM 商业新闻生成
  function generateLLMNews() {
    if (!G || G.lastNewsTick >= G.tickCount) return;
    if (typeof LLM === 'undefined' || !LLM.available) return;
    G.lastNewsTick = G.tickCount;
    LLM.generateBusinessNews().then(function(news) {
      if (news) {
        if (!G.newsFeed) G.newsFeed = [];
        G.newsFeed.unshift({ tick: G.tickCount, text: news });
        if (G.newsFeed.length > 20) G.newsFeed.length = 20;
        if (typeof UI !== 'undefined' && UI.renderNewsFeed) UI.renderNewsFeed();
        addLog('[快讯] ' + news.substring(0, 60) + (news.length > 60 ? '...' : ''));
        // 分析新闻情感倾向并产生游戏影响
        var isPositive = news.includes('利好') || news.includes('增长') || news.includes('突破') || news.includes('上升');
        var isNegative = news.includes('下滑') || news.includes('危机') || news.includes('下跌') || news.includes('风险');
        if (isPositive && !isNegative) {
          // 利好：短暂收入加成 + 市场情绪微涨
          G._llmNewsBonus = (G._llmNewsBonus || 0) + 0.03;
          G.marketSentiment = Math.min(100, (G.marketSentiment || 50) + 3);
          setTimeout(function() { G._llmNewsBonus = Math.max(0, (G._llmNewsBonus || 0) - 0.03); }, 120000);
        } else if (isNegative && !isPositive) {
          // 利空：短暂收入减少 + 市场情绪微跌
          G._llmNewsPenalty = (G._llmNewsPenalty || 0) + 0.03;
          G.marketSentiment = Math.max(0, (G.marketSentiment || 50) - 3);
          setTimeout(function() { G._llmNewsPenalty = Math.max(0, (G._llmNewsPenalty || 0) - 0.03); }, 120000);
        }
      }
    }).catch(function() {});
  }

  // #7: LLM 竞争对手情报报告
  function generateLLMRivalReport() {
    if (!G || G.lastRivalReportTick >= G.tickCount) return;
    if (typeof LLM === 'undefined' || !LLM.available) return;
    if (!G.rivals || !G.rivals.length) return;
    G.lastRivalReportTick = G.tickCount;
    LLM.generateRivalReport().then(function(report) {
      if (report) {
        if (!G.rivalReportData) G.rivalReportData = [];
        G.rivalReportData.unshift({ tick: G.tickCount, text: report });
        if (G.rivalReportData.length > 10) G.rivalReportData.length = 10;
        if (typeof UI !== 'undefined' && UI.renderRivalReport) UI.renderRivalReport();
      }
    }).catch(function() {});
  }

  // #9: LLM 市场情绪分析
  function analyzeLLMSentiment() {
    if (!G || G.lastSentimentTick >= G.tickCount) return;
    if (typeof LLM === 'undefined' || !LLM.available) return;
    G.lastSentimentTick = G.tickCount;
    LLM.analyzeMarketSentiment().then(function(sentiment) {
      if (sentiment !== null && sentiment !== undefined) {
        // 平滑过渡：新值 = 旧值 * 0.6 + 新值 * 0.4
        var oldSent = G.marketSentiment || 50;
        G.marketSentiment = Math.round(oldSent * 0.6 + sentiment * 0.4);
        if (typeof UI !== 'undefined' && UI.renderMarketSentiment) UI.renderMarketSentiment();
      }
    }).catch(function() {});
  }

  // #8: LLM 动态事件触发
  function triggerLLMDynamicEvent() {
    if (!G || G.lastDynamicEventTick >= G.tickCount) return;
    if (typeof LLM === 'undefined' || !LLM.available) return;
    G.lastDynamicEventTick = G.tickCount;
    // 30% 基础概率触发，市场情绪极端时提高概率
    var prob = 0.3;
    var sent = G.marketSentiment || 50;
    if (sent <= 20 || sent >= 80) prob = 0.5;
    if (Math.random() > prob) return;

    LLM.generateDynamicEvent().then(function(llmEvent) {
      if (llmEvent && llmEvent.title) {
        // 将LLM事件包装为标准事件格式并触发
        var evt = {
          id: llmEvent.id,
          title: llmEvent.title,
          type: llmEvent.type || 'normal',
          desc: llmEvent.desc,
          choices: (llmEvent.choices && llmEvent.choices.length > 0) ? llmEvent.choices.map(function(c, i) {
            return {
              text: c.text,
              effect: parseLLMEffect(c.effectDesc || '')
            };
          }) : [],
          source: 'llm'
        };
        addLog('[AI事件] ' + evt.title);
        if (typeof EventSystem !== 'undefined') EventSystem.fireEvent(evt);
      }
    }).catch(function() {});
  }

  // 解析LLM生成的效果描述为数值效果
  function parseLLMEffect(effectDesc) {
    var eff = {};
    if (!effectDesc) return eff;
    var desc = effectDesc.toLowerCase();
    if ((desc.includes('资金') || desc.includes('金钱') || desc.includes('收入') || desc.includes('盈利')) && (desc.includes('增加') || desc.includes('获得'))) {
      var m = desc.match(/(\d+)\s*万/);
      eff.moneyAbs = m ? parseInt(m[1]) * 10000 : 50000;
    } else if ((desc.includes('资金') || desc.includes('金钱')) && (desc.includes('减少') || desc.includes('损失') || desc.includes('亏损'))) {
      var m2 = desc.match(/(\d+)\s*万/);
      eff.moneyAbs = m2 ? -parseInt(m2[1]) * 10000 : -30000;
    } else if (desc.includes('声誉') && (desc.includes('提升') || desc.includes('增加'))) {
      eff.reputation = desc.match(/(\d+)/) ? parseInt(desc.match(/(\d+)/)[1]) : 5;
    } else if (desc.includes('声誉') && (desc.includes('下降') || desc.includes('减少'))) {
      eff.reputation = desc.match(/(\d+)/) ? -parseInt(desc.match(/(\d+)/)[1]) : -3;
    } else if (desc.includes('压力') && (desc.includes('降低') || desc.includes('减少'))) {
      eff.stress = desc.match(/(\d+)/) ? -parseInt(desc.match(/(\d+)/)[1]) : -5;
    } else if (desc.includes('压力') && (desc.includes('增加') || desc.includes('上升'))) {
      eff.stress = desc.match(/(\d+)/) ? parseInt(desc.match(/(\d+)/)[1]) : 5;
    } else if (desc.includes('人脉') && desc.includes('增加')) {
      eff.connections = desc.match(/(\d+)/) ? parseInt(desc.match(/(\d+)/)[1]) : 1;
    } else {
      // 默认视为小额收益
      eff.moneyAbs = Math.floor(Math.random() * 50000) + 10000;
    }
    return eff;
  }

  // ===================================================
  //  资产购置/拍卖行系统
  // ===================================================

  // 刷新资产市场
  function refreshAssetMarket() {
    if (!G || !ASSET_TEMPLATES) return;
    var templates = ASSET_TEMPLATES;
    var pool = templates.slice(); // 拷贝
    // Fisher-Yates 洗牌
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    var count = Math.min((typeof CONFIG !== 'undefined' && CONFIG.ASSET_MARKET_SIZE) || 8, pool.length);
    var listings = [];
    var sent = G.marketSentiment || 50;
    for (var k = 0; k < count; k++) {
      var t = pool[k];
      // 价格计算：基准价 × 市场情绪因子 × 随机波动
      var sentimentFactor = 0.7 + (sent / 100) * 0.6; // 0.7 ~ 1.3
      var randomJitter = 0.85 + Math.random() * 0.3; // 0.85 ~ 1.15
      var price = Math.round(t.basePrice * sentimentFactor * randomJitter * 10000);
      listings.push({
        templateId: t.id,
        name: t.name,
        type: t.type,
        price: price,
        rarity: t.rarity,
        volatility: t.volatility,
        trend: t.trend,
        desc: t.desc
      });
    }
    G.assetMarketListings = listings;
    G.lastAssetMarketRefresh = G.tickCount;
  }

  // 获取当前市场价格（基于模板波动和当前情绪）
  function getAssetCurrentPrice(asset) {
    if (!G) return asset.currentPrice || 0;
    var tpl = ASSET_TEMPLATES.find(function(t) { return t.id === asset.templateId; });
    if (!tpl) return asset.currentPrice || 0;
    var sent = G.marketSentiment || 50;
    var sentimentFactor = 0.7 + (sent / 100) * 0.6;
    // 基于购买价波动
    var randomDrift = (Math.random() - 0.5) * 2 * (tpl.volatility || 0.05);
    // 趋势漂移（每tick微小变化）
    var ticksHeld = G.tickCount - asset.purchaseTick;
    var trendDrift = (tpl.trend || 0.003) * ticksHeld * (0.5 + Math.random());
    var newPrice = Math.round(asset.purchasePrice * (1 + randomDrift + trendDrift) * sentimentFactor / ((0.7 + (50/100) * 0.6)));
    // 钱老板被动：资产增值加速 5%（持有资产有额外升值）
    var npcBonAsset = typeof calcNpcBonus === 'function' ? calcNpcBonus() : {};
    if (npcBonAsset._assetAppreciation) newPrice = Math.round(newPrice * (1 + npcBonAsset._assetAppreciation * (ticksHeld / 50)));
    // 确保不低于购买的20%
    return Math.max(Math.round(asset.purchasePrice * 0.2), newPrice);
  }

  // 购买资产
  function buyAsset(listingIndex) {
    if (!G) return false;
    var listings = G.assetMarketListings;
    if (!listings || listingIndex < 0 || listingIndex >= listings.length) return false;
    var slotCap = (typeof CONFIG !== 'undefined' && CONFIG.ASSET_MAX_SLOTS) || 20;
    if (G.assets.length >= slotCap) return false;

    var listing = listings[listingIndex];
    // 钱老板被动：资产购买折扣 10%
    var npcBon = typeof calcNpcBonus === 'function' ? calcNpcBonus() : {};
    var actualPrice = Math.round(listing.price * (1 - (npcBon._assetBuyDiscount || 0)));
    if (G.money < actualPrice) return false;

    G.money -= actualPrice;
    var asset = {
      id: 'ast_' + G.tickCount + '_' + G.assets.length,
      templateId: listing.templateId,
      name: listing.name,
      type: listing.type,
      purchasePrice: actualPrice,
      currentPrice: listing.price,
      purchaseTick: G.tickCount,
      rarity: listing.rarity
    };
    G.assets.push(asset);
    // 从市场移除
    G.assetMarketListings.splice(listingIndex, 1);
    addLog('🏠 购入资产：' + listing.name + '（' + formatMoney(actualPrice) + (actualPrice !== listing.price ? '，钱老板友情价' : '') + '）');
    return true;
  }

  // 按ID查找资产
  function findAssetById(assetId) {
    if (!G || !G.assets) return -1;
    for (var i = 0; i < G.assets.length; i++) {
      if (G.assets[i].id === assetId) return i;
    }
    return -1;
  }

  // 挂牌拍卖（改用资产ID，避免索引漂移）
  function listAssetForAuction(assetId, askPrice) {
    if (!G) return false;
    var assetIndex = findAssetById(assetId);
    if (assetIndex < 0) return false;
    var sellTick = G.tickCount + (typeof CONFIG !== 'undefined' ? CONFIG.ASSET_AUCTION_MIN_TICKS : 3)
      + Math.floor(Math.random() * ((typeof CONFIG !== 'undefined' ? CONFIG.ASSET_AUCTION_MAX_TICKS : 8) - (typeof CONFIG !== 'undefined' ? CONFIG.ASSET_AUCTION_MIN_TICKS : 3) + 1));
    // 不能重复挂牌（按ID查重）
    var alreadyListed = G.assetAuctionList.find(function(a) { return a.assetId === assetId; });
    if (alreadyListed) return false;
    G.assetAuctionList.push({
      assetId: assetId,
      askPrice: askPrice,
      listTick: G.tickCount,
      sellTick: sellTick
    });
    addLog('🔨 挂牌拍卖：' + G.assets[assetIndex].name + '，要价' + formatMoney(askPrice));
    return true;
  }

  // 典当（紧急变现，改用资产ID）
  function pawnAsset(assetId) {
    if (!G) return false;
    var assetIndex = findAssetById(assetId);
    if (assetIndex < 0) return false;
    // 取消该资产的拍卖
    G.assetAuctionList = G.assetAuctionList.filter(function(a) { return a.assetId !== assetId; });
    var asset = G.assets[assetIndex];
    var marketPrice = getAssetCurrentPrice(asset);
    var pawnRatio = (typeof CONFIG !== 'undefined' ? CONFIG.ASSET_PAWN_RATIO_MIN : 0.38)
      + Math.random() * ((typeof CONFIG !== 'undefined' ? CONFIG.ASSET_PAWN_RATIO_MAX : 0.55) - (typeof CONFIG !== 'undefined' ? CONFIG.ASSET_PAWN_RATIO_MIN : 0.38));
    var cash = Math.round(marketPrice * pawnRatio);
    G.money += cash;
    addLog('💸 典当：' + asset.name + '，回款' + formatMoney(cash) + '（市场价' + formatMoney(marketPrice) + '的' + Math.round(pawnRatio * 100) + '%）');
    G.assets.splice(assetIndex, 1);
    // 拍卖列表中不会再有引用此资产ID的条目（已在上方过滤）
    return true;
  }

  // 取消拍卖（改用资产ID）
  function cancelAuction(assetId) {
    if (!G) return false;
    var idx = -1;
    for (var i = 0; i < G.assetAuctionList.length; i++) {
      if (G.assetAuctionList[i].assetId === assetId) { idx = i; break; }
    }
    if (idx < 0) return false;
    var auc = G.assetAuctionList[idx];
    var assetIndex = findAssetById(assetId);
    var assetName = (assetIndex >= 0) ? G.assets[assetIndex].name : '未知资产';
    G.assetAuctionList.splice(idx, 1);
    addLog('🔙 取消拍卖：' + assetName);
    return true;
  }

  // 处理资产系统tick（改用资产ID）
  function processAssetSystem() {
    if (!G) return;
    // 首次启动或间隔到了刷新市场
    if (!G.lastAssetMarketRefresh || G.tickCount - G.lastAssetMarketRefresh >= ((typeof CONFIG !== 'undefined' && CONFIG.ASSET_REFRESH_TICKS) || 12)) {
      refreshAssetMarket();
    }
    // #5 资产价格按需计算：移除全量预计算，改为消费者自行调用 getAssetCurrentPrice
    // 处理拍卖成交（按资产ID查找，不再依赖索引）
    var toRemove = [];
    for (var j = G.assetAuctionList.length - 1; j >= 0; j--) {
      var auc = G.assetAuctionList[j];
      if (G.tickCount >= auc.sellTick) {
        var assetIndex = findAssetById(auc.assetId);
        if (assetIndex < 0) { toRemove.push(j); continue; }
        var asset = G.assets[assetIndex];
        var marketPrice = getAssetCurrentPrice(asset); // 按需计算
        var priceRatio = marketPrice > 0 ? auc.askPrice / marketPrice : 1;
        var sellProb = 1.0 - Math.abs(priceRatio - 1) * 1.5;
        sellProb = Math.max(0.15, Math.min(0.95, sellProb));
        if (Math.random() < sellProb) {
          // 成交
          G.money += auc.askPrice;
          addLog('🎉 拍卖成交：' + asset.name + '，成交价' + formatMoney(auc.askPrice) + '（市场价' + formatMoney(marketPrice) + '）');
          G.assets.splice(assetIndex, 1);
          toRemove.push(j);
        } else {
          // 未成交，延长等待并调整价格
          auc.sellTick += 3;
          auc.askPrice = Math.round(auc.askPrice * (0.9 + Math.random() * 0.2));
        }
      }
    }
    // 清理已成交/失效的拍卖记录（从大到小删除，不会影响其他索引）
    for (var r = toRemove.length - 1; r >= 0; r--) {
      G.assetAuctionList.splice(toRemove[r], 1);
    }
  }

  // 获取资产总估值（#5 按需计算）
  function getTotalAssetValue() {
    if (!G || !G.assets) return 0;
    var total = 0;
    for (var i = 0; i < G.assets.length; i++) {
      total += G.assets[i].currentPrice || getAssetCurrentPrice(G.assets[i]) || G.assets[i].purchasePrice || 0;
    }
    return total;
  }

  // 获取资产类型名称
  function getAssetTypeName(type) {
    var map = { estate:'房产', art:'艺术品', jewelry:'珠宝', antique:'古董', equity:'股权' };
    return map[type] || type;
  }

  // 获取稀有度标签
  function getRarityLabel(rarity) {
    var map = { common:'普通', uncommon:'稀有', rare:'珍品', epic:'史诗' };
    return map[rarity] || rarity;
  }

  // ========== 公开API ==========
  return {
    initState, selectOrigin, startGame,
    get G() { return G; },
    set G(v) { G = v; },
    get tickCount() { return tickCount; },
    get pendingDecisions() { return pendingDecisions; },
    set pendingDecisions(v) { pendingDecisions = v; },
    calcTotalIncome, calcOfflineIncome, claimOfflineIncome,
    addLog, showAchievement, formatMoney, getEmpMax,
    addConnections,
    save, load, reset, autoSave, getSaveSlots,
    exportSave, importSave, deleteSaveSlot,
    checkRegionUnlocks, unlockRegion,
    checkCityUnlocks, switchCity, updateRank,
    getStressMultiplier, getRepMultiplier,
    calcEmployeeIncomeBonus,
    startTick,
    applySkillEffects, canUnlockSkill,
    fireEvent, tryFireEvent, startEventCheck,
    updateStressMode, updateRepLevel,
    manualWork, getManualWorkCdRemain,
    getSkillMultiplier, unlockSkill,
    checkBankruptcy,
    updateRivals, getRivalRank,
    generateNews, applyNewsEffects,
    manageSubsidiaries, toggleSubsidiary, getSubsidiarySummary,
    checkEndings, retireGame,
    getTimeOfDay: (h) => GameTime.getTimeOfDay(h),
    isFirstGame, markTutorialDone,
    toggleAutoMode, setAutoPreference, autoDecide,
    getGameStage,
    startResearch, getTechBonus, generateRPT, checkResearchProgress,
    buyStock, sellStock, updateStockPrices, getStockPortfolioValue, getStockCostBasis,
    applyLoan, processLoans, repayLoan,
    getSeason, checkHoliday,
    calcSynergyEffects, getSynergyStatusDisplay, calcSynergyMultiplier,
    // ---- 新增系统 ----
    calcMaintenanceCost,
    upgradeBusinessMax,
    batchHire,
    trainEmployee, restEmployee,
    checkAndShowOfflineIncome,
    // ---- HR 统管 ----
    isHRManaged, calcDeptStats, hrAutoTick,
    batchHireDept, batchTrainDept,
    // ---- 员工属性系统 ----
    EMP_ATTRIBUTES, EMP_ROLE_ATTR_WEIGHTS,
    generateEmployeeWithAttributes, calcEmpAttrIncomeBonus,
    // ---- 实习生转正系统 ----
    convertIntern, getInternConvertTarget, checkInternConversion, calcInternSalary,
    // ---- 业务收入估算（供UI显示） ----
    calcBizIncome,
    // ---- LLM 增强 (#5-#10) ----
    generateLLMNews, generateLLMRivalReport, analyzeLLMSentiment, triggerLLMDynamicEvent,
    // ---- 资产/拍卖系统 ----
    refreshAssetMarket, buyAsset, listAssetForAuction, pawnAsset, cancelAuction,
    processAssetSystem, getTotalAssetValue, getAssetTypeName, getRarityLabel,
    getRegionModifiers,
  };
})();
