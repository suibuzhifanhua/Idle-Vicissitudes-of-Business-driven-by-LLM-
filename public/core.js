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
      connections: o.connections,
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
        cooldowns: {},
      },
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
    // 初始化业务
    BUSINESS_DEFS.forEach(b => {
      G.businesses[b.id] = { level: 0, region: null, unlocked: b.unlockMoney === 0 };
    });
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
      const states = ['boom','stable','stable','recession','recession','crisis'];
      G.economicState = states[Math.floor(Math.random() * states.length)];
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
    // 2. 自然衰减
    const achRewards2 = typeof calcAchievementRewards === 'function' ? calcAchievementRewards() : {};
    const stressDecayBonus = 1.0 + (achRewards2.stressDecay || 0);
    G.stress = Math.max(0, G.stress - CONFIG.STRESS_NATURAL_DECAY * stressDecayBonus);
    G.reputation = Math.max(0, Math.min(100, G.reputation - (Math.random() < 0.1 ? CONFIG.REPUTATION_DECAY : 0)));
    // 3. 计算收益
    const income = calcTotalIncome();
    G.money += income;
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
    // 4. 发工资（实际工资 = baseSalary × 规模系数，单位转为元）
    let totalSalary = 0;
    G.employees.forEach(emp => {
      const actualSalary = calcActualSalary(emp.baseSalary || emp.salary, G);
      totalSalary += actualSalary * 10000;
      // 忠诚度衰减
      emp.loyalty = Math.max(0, emp.loyalty - CONFIG.LOYALTY_DECAY + (emp.happiness || 0));
      // 压力影响
      if (G.stress > 70) emp.happiness = Math.max(0, (emp.happiness || 50) - 2);
      // 疲劳度变化
      emp.fatigue = Math.min(100, (emp.fatigue || 0) + CONFIG.EMP_FATIGUE_RATE);
      emp.fatigue = Math.max(0, emp.fatigue - CONFIG.EMP_FATIGUE_DECAY);
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
    // 4.5 自动存档（每20 tick到slot_1）
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
    // 8. 员工离开检查
    checkEmployeeLeave();
    // 9. 技能效果应用
    applySkillEffects();
    // 10. 研发点数产出
    generateRPT();
    // 11. 研发进度检查
    checkResearchProgress();
    // 12. 股市波动（每5tick）
    if (G.tickCount % 5 === 0) updateStockPrices();
    // 13. 贷款利息处理
    processLoans();
    // 14. 节日检查
    checkHoliday();
    // 14.5 托管主循环
    if (G.autoMode && G.autoMode.enabled) autoManager();
    // 17.5 竞争对手AI（每12 tick）
    if (G.tickCount % 12 === 0) updateRivals();
    // 17.6 新闻生成（每10 tick）
    if (G.tickCount % 10 === 0) generateNews();
    // 17.7 子公司自动运营
    manageSubsidiaries();
    // 17.8 结局检查 — 已禁用（长期放置游戏无结局），改为里程碑记录
    checkMilestonesAdvanced();
    // 15. 破产检查
    checkBankruptcy();
    // 16. HR 统管自动维护
    hrAutoTick();
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
    // 王律师好感 > 40：负面事件法律损失 -30%（不直接影响收入，但降低 stress）
    // 林教授好感 > 40：研发 RPT 获取 +20%（在 generateRPT 中处理）
    // 马记者好感 > 40：声誉获取 +15%（在事件中处理）
    // 李处好感 > 50：政府补贴事件概率翻倍（在事件中处理）
    // 张野好感 > 40：媒体类业务收益 +8%
    if (favor('zhangye') > 40) bonus.media = (bonus.media || 0) + 0.08;
    // 陈总好感 > 50：基金类收益 +10%
    if (favor('chenzong') > 50) bonus.fund = (bonus.fund || 0) + 0.10;
    // 小C好感 > 40：员工效率微量提升（等效收入加成）
    if (favor('xiaoc') > 40) { Object.keys(bonus).forEach(k => { bonus[k] += 0.02; }); }
    // 赵磊好感 > 40：零售/餐饮 +5%
    if (favor('zhaolei') > 40) { bonus.retail = (bonus.retail || 0) + 0.05; bonus.food_chain = (bonus.food_chain || 0) + 0.05; }
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

    let grandTotal = 0;

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

        // 区域加成
        if (bState.region && REGIONS[bState.region]) {
          const r = REGIONS[bState.region];
          if (r.bonus.retail && bDef.id === 'retail') income *= r.bonus.retail;
          if (r.bonus.tech && bDef.id === 'tech') income *= r.bonus.tech;
          if (r.bonus.finance && (bDef.id === 'fund' || bDef.id === 'office')) income *= r.bonus.finance;
          if (r.bonus.repGain) income *= (1 + (r.bonus.repGain - 1) * 0.3);
        }

        // 员工加成
        const empMul = calcEmployeeMultiplier(bDef.id);
        income *= empMul;
        const empBonus = calcEmployeeIncomeBonus();
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

    // 增强压力修正
    if (sy.stressMod && sy.stressMod !== 0) {
      grandTotal *= (1 + sy.stressMod);
    }

    // 增强声誉修正
    if (sy.repMod && sy.repMod !== 0) {
      grandTotal *= (1 + sy.repMod);
    }

    // 竞争对手扩张/危机即时效果
    if (G._rivalExpansionPenalty) grandTotal *= (1 - G._rivalExpansionPenalty);
    if (G._rivalCrisisBonus) grandTotal *= (1 + G._rivalCrisisBonus);

    // 成就奖励全局收入加成
    grandTotal *= achIncomeMult;
    // 成就奖励运营成本减免（等效收入加成）
    if (achOpCost < 1.0) grandTotal *= (1.0 + (1.0 - achOpCost) * 0.5);
    
    // 清除缓存
    G._synergyCache = null;

    return grandTotal;
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
    G.employees.forEach(emp => {
      if (emp.role === 'manager') mul += 0.12;
      if (emp.role === 'developer' && bizId === 'tech') mul += 0.06;
      if (emp.role === 'sales' && (bizId === 'retail' || bizId === 'media')) mul += 0.08;
      if (emp.role === 'marketer') mul += 0.15;
      if (emp.loyalty < 20) mul *= 0.5; // 低忠诚减产
      // 员工技能加成
      if (emp.skill && emp.skill > 1) mul += (emp.skill - 1) * 0.03;
    });
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
    if (b.techRdSpeed && bizId === 'tech') return b.techRdSpeed;
    if (b.unlockCost) return 1.0; // unlockCost doesn't affect income
    if (b.hireSpeed) return 1.0; // hireSpeed doesn't affect income
    return 1.0;
  }

  // ========== 区域解锁 ==========
  function checkRegionUnlocks() {
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
        if (r.unlockCond.money && G.money >= r.unlockCond.money) unlockRegion(r.id);
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
    Object.values(CITIES).forEach(city => {
      if (city.unlockMoney === 0 && city.minAct === 0) return; // 初始城市跳过
      if (G.cities[city.id] && G.cities[city.id].unlocked) return;
      if (G.money >= city.unlockMoney && G.act >= city.minAct) {
        G.cities[city.id] = { unlocked: true, businesses: {}, unlockedRegions: [] };
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
        G.businesses[bDef.id] = { level: 0, region: null, unlocked: bDef.unlockMoney === 0 };
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
      let state = G.businesses[b.id];
      if (!state) { G.businesses[b.id] = { level: 0, region: null, unlocked: false }; state = G.businesses[b.id]; }
      if (state.unlocked) return;
      if (b.unlockMoney > 0 && G.money >= b.unlockMoney) {
        state.unlocked = true;
        addLog(`🔓 解锁新业务：${b.icon} ${b.name}！`);
      }
    });
  }

  // ========== 里程碑检查 ==========
  function checkMilestones() {
    const milestones = [1000000, 10000000, 100000000, 1000000000, 10000000000];
    const milestoneActs = [1, 2, 3, 4, 5];
    const milestoneNames = ['第一桶金', '小有成就', '事业有成', '商业帝国', '传奇人物'];
    const milestoneEventIds = ['milestone_1m', 'milestone_10m', 'milestone_100m', 'milestone_1b', 'milestone_10b'];
    milestones.forEach((m, i) => {
      if (G.money >= m && G.milestone === i) {
        G.milestone = i + 1;
        const oldAct = G.act;
        G.act = Math.max(G.act, milestoneActs[i]);
        addLog(`🎉 里程碑达成：${milestoneNames[i]}！资产突破${formatMoney(m)}！`);
        showAchievement('🏆', milestoneNames[i]);
        if (typeof AudioFX !== 'undefined') AudioFX.playAchievement();
        // 触发幕次事件
        triggerActEvent(G.act);
        // 幕次推进时奖励技能点
        if (G.act > oldAct) {
          const pts = G.act; // 第N幕奖励N点
          G.statPoints = (G.statPoints || 0) + pts;
          addLog(`📚 进入第${G.act}幕，获得 ${pts} 技能点！`);
          if (typeof UI !== 'undefined' && UI.showMilestone) {
            UI.showMilestone('🎉 第 ' + G.act + ' 幕 · ' + milestoneNames[i]);
          }
        }
        // 触发里程碑叙事事件
        const msEvent = EVENTS.find(e => e.id === milestoneEventIds[i]);
        if (msEvent) {
          setTimeout(() => {
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

  function checkAchievementCond(a) {
    switch (a.cond.type) {
      case 'money': return G.money >= a.cond.value;
      case 'money_never_low': return (G.moneyLowest || Infinity) >= (calcTotalIncome() * 3);
      case 'emp_count': return G.employees.length >= a.cond.count;
      case 'biz_count': return Object.values(G.businesses).filter(b => b.level > 0).length >= a.cond.count;
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
      case 'biz_level': {
        const biz = G.businesses[a.cond.bizId];
        return biz && biz.level >= a.cond.level;
      }
      case 'biz_in_region': {
        const regionCount = {};
        BUSINESS_DEFS.forEach(bDef => {
          const bState = G.businesses[bDef.id];
          if (!bState || bState.level === 0 || !bState.region) return;
          regionCount[bState.region] = (regionCount[bState.region] || 0) + 1;
        });
        return Object.values(regionCount).some(c => c >= a.cond.count);
      }
      case 'npc_favor_high': return Object.values(G.npcFavor).filter(f => f >= (a.cond.value||50)).length >= a.cond.count;
      case 'negative_events': return (G.negativeEventsSurvived || 0) >= a.cond.count;
      case 'grew_in_recession': return G.grewInRecession === true;
      case 'senior_emp_count': return G.employees.filter(e => e.role !== 'intern').length >= a.cond.count;
      case 'stress_never_above': return (G.stressMax || 0) <= a.cond.value && G.tickCount > 50;
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

    G.employees = G.employees.filter(emp => {
      if (emp.loyalty <= 0) {
        addLog(`😢 ${emp.name}（${EMP_ROLES.find(r=>r.id===emp.role).name}）因忠诚度过低离职了。`);
        return false;
      }
      // 随机事件离开（应用联动翻倍）
      if (Math.random() < 0.002 * finalMultiplier && emp.loyalty < 30) {
        addLog(`🚪 ${emp.name}找到了更好的机会，离职了。`);
        return false;
      }
      // 联动：CTO/总监级忠诚度<20，可能带走客户
      if (['cto','director','manager'].includes(emp.role) && emp.loyalty < 20) {
        if (Math.random() < 0.005 * finalMultiplier) {
          addLog(`⚠️ ${emp.name}（${EMP_ROLES.find(r=>r.id===emp.role).name}）带走了一批客户资源！`);
          // 随机一条业务线下滑
          if (G.businesses) {
            const bizKeys = Object.keys(G.businesses).filter(k => G.businesses[k].level > 0);
            if (bizKeys.length > 0) {
              const hit = bizKeys[Math.floor(Math.random() * bizKeys.length)];
              G.businesses[hit].level = Math.max(1, G.businesses[hit].level - 1);
              addLog(`  业务「${BUSINESS_DEFS.find(b=>b.id===hit).name}」受到冲击，降级。`);
            }
          }
        }
      }
      return true;
    });
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
    // 检查条件
    if (G.unlockedSkills.includes(sk.id)) return false;
    // 简化：条件检查在 UI 层做
    return true;
  }

  // ========== 多槽存档系统 ==========
  function save(slot) {
    try {
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
        pendingDecisions = data.pendingDecisions || [];
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
        pendingDecisions = data.pendingDecisions || [];
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
            G.cities[cid].businesses[bDef.id] = { level: 0, region: null, unlocked: bDef.unlockMoney === 0 };
          }
        });
      }
    });
    // 确保当前城市的businesses也初始化
    if (!G.businesses || Object.keys(G.businesses).length === 0) {
      G.businesses = {};
      BUSINESS_DEFS.forEach(bDef => {
        G.businesses[bDef.id] = { level: 0, region: null, unlocked: bDef.unlockMoney === 0 };
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
        cooldowns: {},
      };
    }
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
    if (!G.rpt) G.rpt = { active: false, days: 0, cost: 0 };
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
  function calcOfflineIncome() {
    if (!G || !G.saveTime) return 0;
    const now = Date.now();
    const elapsed = (now - G.saveTime) / 1000; // 秒
    const maxSec = CONFIG.MAX_OFFLINE_HOURS * 3600;
    const validSec = Math.min(elapsed, maxSec);
    if (validSec < CONFIG.TICK_MS / 1000) return 0;
    const ticks = Math.floor(validSec / (CONFIG.TICK_MS / 1000));
    // 简化：按当前速率估算
    const perTick = calcTotalIncome();
    return perTick * Math.min(ticks, maxSec / (CONFIG.TICK_MS / 1000));
  }

  // ========== 事件检查 ==========
  function startEventCheck() {
    if (eventTimer) clearInterval(eventTimer);
    eventTimer = setInterval(() => {
      if (isPaused) return;
      if (pendingDecisions.length >= CONFIG.MAX_PENDING_DECISIONS) return;
      if (Math.random() < CONFIG.EVENT_BASE_PROB) {
        tryFireEvent();
      }
    }, CONFIG.EVENT_CHECK_INTERVAL * 1000);
  }

  function tryFireEvent() {
    // 按权重选事件
    const available = EVENTS.filter(e => {
      if (e.acts && !e.acts.includes(G.act)) return false;
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
    // 托管模式：自动决策（每个事件独立计时，互不干扰）
    if (G.autoMode && G.autoMode.enabled && G.autoMode.eventDecide && event.choices && event.choices.length > 0) {
      setTimeout(() => {
        autoDecide(event);
      }, 1500);
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
    if (n >= 1e9) return (n / 1e9).toFixed(1) + '亿';
    if (n >= 1e4) return (n / 1e4).toFixed(1) + '万';
    return n.toFixed(0);
  }

  function getEmpMax() {
    if (!G || !G.stats) return 5;
    let base = 3 + Math.floor((G.stats.management || 0) / 2);
    // 每个产业+1上限
    if (G.businesses) {
      base += Object.values(G.businesses).filter(b => b.level > 0).length;
    }
    // 每个已解锁区域+1上限
    if (G.unlockedRegions) {
      base += G.unlockedRegions.length;
    }
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
    const baseIncome = Math.max(1000, G.money * 0.05);
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
        cooldowns: {},
      };
    }
    G.autoMode.enabled = !G.autoMode.enabled;
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

    // 评分每个选项
    const scored = choices.map((c, i) => {
      const eff = c.effect || {};
      let score = 0;

      // 资金效果
      if (eff.money) {
        if (eff.money > 1) score += (eff.money - 1) * 80;
        else if (eff.money < 1 && eff.money > 0) score -= (1 - eff.money) * 60;
      }
      if (eff.moneyAbs) {
        score += eff.moneyAbs / 10000;
      }

      // 声誉
      if (eff.reputation) score += eff.reputation * 2;
      if (eff.reputationMul) {
        if (eff.reputationMul > 1) score += 15;
        else score -= 15;
      }

      // 压力（负面）
      if (eff.stress) score -= eff.stress * 2.5;
      if (eff.stressMul) {
        if (eff.stressMul > 1) score -= 12;
        else score += 6;
      }

      // 人脉
      if (eff.connections) score += eff.connections * 1.5;

      // NPC好感度
      if (eff.npcFavor) {
        Object.values(eff.npcFavor).forEach(delta => {
          score += delta * 0.6;
        });
      }

      // 偏好调整
      switch (G.autoMode.eventPreference) {
        case 'aggressive':
          if (eff.money && eff.money > 1) score *= 1.6;
          if (eff.moneyAbs && eff.moneyAbs > 0) score *= 1.3;
          break;
        case 'conservative':
          if (eff.stress && eff.stress > 0) score -= eff.stress * 3;
          if (eff.stressMul && eff.stressMul > 1) score -= 15;
          break;
        case 'social':
          if (eff.npcFavor) {
            Object.values(eff.npcFavor).forEach(delta => { score += delta * 1.5; });
          }
          if (eff.connections) score += eff.connections * 2;
          break;
        // balanced: no adjustment
      }

      // 触发结局的选项尽量避免
      if (c.ending) score -= 2000;

      return { idx: i, score, text: c.text };
    });

    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];

    // 执行决策
    addLog('[托管] ' + event.title + ' → ' + best.text);

    // 从 pending 中移除（用对象引用而非 id，避免误删同类事件）
    pendingDecisions = pendingDecisions.filter(d => d !== event);

    if (typeof EventSystem !== 'undefined') {
      EventSystem.choose(event.id, best.idx);
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
  function generateRPT() {
    if (!G) return;
    let rptGain = 0;
    Object.entries(G.businesses).forEach(([bizId, biz]) => {
      if (biz.level > 0 && TECH_RPT_RATES[bizId]) {
        rptGain += biz.level * TECH_RPT_RATES[bizId];
      }
    });
    // AI自动化加成
    if (G.completedResearch.ai >= 3) rptGain *= 1.3;
    const achRewards3 = typeof calcAchievementRewards === 'function' ? calcAchievementRewards() : {};
    if (achRewards3.rdBonus) rptGain *= (1 + achRewards3.rdBonus);
    // 联动：林教授好感 > 40 → RPT 获取 +20%
    if ((G.npcFavor && G.npcFavor.linjiaoshou) > 40) rptGain *= 1.20;
    G.rpt += rptGain;
    G.rpt = Math.round(G.rpt * 100) / 100;
  }

  function startResearch(techId) {
    if (!G) return { ok: false, msg: '游戏未开始' };
    const tree = Object.values(TECH_TREE).find(t => t.id === techId);
    if (!tree) return { ok: false, msg: '未知研发路线' };
    const curLevel = G.completedResearch[techId] || 0;
    if (curLevel >= 5) return { ok: false, msg: '该路线已研发完成' };
    const nextLvl = tree.levels[curLevel]; // 0-based
    if (G.activeResearch) return { ok: false, msg: '已有研发项目在进行中' };
    if (G.rpt < nextLvl.rptCost) return { ok: false, msg: `研发点数不足（需要${nextLvl.rptCost}，当前${Math.round(G.rpt)}）` };
    if (G.money < nextLvl.moneyCost) return { ok: false, msg: `资金不足（需要${formatMoney(nextLvl.moneyCost)}）` };
    G.rpt -= nextLvl.rptCost;
    G.money -= nextLvl.moneyCost;
    G.activeResearch = {
      techId, name: nextLvl.name, level: curLevel + 1,
      remainingTicks: nextLvl.tickCost, totalTicks: nextLvl.tickCost
    };
    addLog(`🔬 开始研发：${tree.name} Lv${curLevel+1}「${nextLvl.name}」消耗 ${formatMoney(nextLvl.moneyCost)} + ${nextLvl.rptCost} RPT`);
    save();
    return { ok: true, msg: `${nextLvl.name} 研发启动` };
  }

  function checkResearchProgress() {
    if (!G || !G.activeResearch) return;
    G.activeResearch.remainingTicks--;
    if (G.activeResearch.remainingTicks <= 0) {
      const ar = G.activeResearch;
      const tree = Object.values(TECH_TREE).find(t => t.id === ar.techId);
      G.completedResearch[ar.techId] = (G.completedResearch[ar.techId] || 0) + 1;
      const lvl = tree.levels.find(l => l.level === ar.level);
      G.activeResearch = null;
      addLog(`✅ 研发完成：${tree.name} Lv${ar.level}「${ar.name}」`);
      if (typeof UI !== 'undefined' && UI.showToast) {
        UI.showToast(`研发完成：${tree.name} Lv${ar.level}「${ar.name}」`);
      }
      save();
    }
  }

  function getTechBonus() {
    if (!G) return { allRevenue:0, salaryReduction:0, fundBonus:0, autoRecruit:false };
    let bonus = { allRevenue:0, salaryReduction:0, fundBonus:0, autoRecruit:false };
    Object.entries(TECH_TREE).forEach(([key, tree]) => {
      const lvl = G.completedResearch[key] || 0;
      for (let i = 0; i < lvl; i++) {
        const b = tree.levels[i].bonus;
        bonus.allRevenue += (b.allRevenue || 0);
        bonus.salaryReduction += (b.salaryReduction || 0);
        bonus.fundBonus += (b.fundBonus || 0);
        if (b.autoRecruit) bonus.autoRecruit = true;
      }
    });
    return bonus;
  }

  // ========== 股票投资系统 ==========
  function updateStockPrices() {
    if (!G) return;
    Object.entries(STOCKS).forEach(([sid, stock]) => {
      const change = (Math.random() - 0.48) * 2 * stock.volatility;
      const oldPrice = G.stockPrices[sid] || stock.basePrice;
      const newPrice = Math.max(1, oldPrice * (1 + change));
      G.stockPrices[sid] = parseFloat(newPrice.toFixed(2));
      G.stockChangeLog[sid] = parseFloat((change * 100).toFixed(2));
    });
  }

  function buyStock(stockId, shares) {
    if (!G) return { ok: false, msg: '游戏未开始' };
    const stock = STOCKS[stockId];
    if (!stock) return { ok: false, msg: '未知股票' };
    if (!G.stockPrices[stockId] || G.stockPrices[stockId] <= 0) return { ok: false, msg: '股价异常' };
    const price = G.stockPrices[stockId];
    const cost = price * shares;
    if (G.money < cost) return { ok: false, msg: `资金不足（需要${formatMoney(cost)}）` };
    G.money -= cost;
    if (!G.stocks[stockId]) G.stocks[stockId] = { shares:0, avgCost:0 };
    const totalCost = G.stocks[stockId].avgCost * G.stocks[stockId].shares + cost;
    G.stocks[stockId].shares += shares;
    G.stocks[stockId].avgCost = parseFloat((totalCost / G.stocks[stockId].shares).toFixed(2));
    addLog(`📈 买入 ${stock.name} ×${shares}股 @${formatMoney(price)}`);
    save();
    return { ok: true, msg: `买入 ${stock.name} ${shares}股` };
  }

  function sellStock(stockId, shares) {
    if (!G) return { ok: false, msg: '游戏未开始' };
    const holding = G.stocks[stockId];
    if (!holding || holding.shares <= 0) return { ok: false, msg: '未持有该股票' };
    if (shares > holding.shares) return { ok: false, msg: `持股不足（持有${holding.shares}股）` };
    const price = G.stockPrices[stockId] || STOCKS[stockId].basePrice;
    const revenue = price * shares;
    const costBasis = holding.avgCost * shares;
    const profit = revenue - costBasis;
    G.money += revenue;
    G.stockProfitTotal = (G.stockProfitTotal || 0) + profit;
    holding.shares -= shares;
    if (holding.shares <= 0) delete G.stocks[stockId];
    const sign = profit >= 0 ? '📈' : '📉';
    addLog(`${sign} 卖出 ${STOCKS[stockId].name} ×${shares}股 @${formatMoney(price)} 盈亏 ${formatMoney(profit)}`);
    save();
    return { ok: true, msg: `卖出 ${STOCKS[stockId].name} ${shares}股`, profit };
  }

  function getStockPortfolioValue() {
    if (!G) return 0;
    let total = 0;
    Object.entries(G.stocks).forEach(([sid, holding]) => {
      const price = G.stockPrices[sid] || STOCKS[sid].basePrice;
      total += price * holding.shares;
    });
    return total;
  }

  function getStockCostBasis() {
    if (!G) return 0;
    let total = 0;
    Object.values(G.stocks).forEach(h => { total += h.avgCost * h.shares; });
    return total;
  }

  // ========== 银行贷款系统 ==========
  function applyLoan(amount, duration) {
    if (!G) return { ok: false, msg: '游戏未开始' };
    if (G.loans.length >= 3) return { ok: false, msg: '最多同时3笔贷款' };
    const totalAssets = G.money + getStockPortfolioValue();
    const maxLoan = totalAssets * 0.5;
    if (amount > maxLoan) return { ok: false, msg: `贷款额度上限 ${formatMoney(maxLoan)}（总资产50%）` };
    if (amount < 10000) return { ok: false, msg: '最低贷款金额 10,000' };
    // 利率：声誉越高利率越低（8%-15%）
    const interestRate = Math.max(0.08, 0.15 - (G.reputation / 100) * 0.07);
    const interestPerTick = parseFloat((amount * interestRate / duration).toFixed(2));
    const loan = {
      id: Date.now(), amount, duration, remaining: duration,
      interestRate: parseFloat((interestRate * 100).toFixed(1)),
      interestPerTick, repaid: false
    };
    G.loans.push(loan);
    G.money += amount;
    G.neverLoaned = false;
    addLog(`🏦 获批贷款：${formatMoney(amount)}，利率${loan.interestRate}%，期限${duration}Tick`);
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
  function autoManager() {
    if (!G || !G.autoMode || !G.autoMode.enabled) return;
    const am = G.autoMode;
    am.cooldowns = am.cooldowns || {};
    const now = G.tickCount;
    const cd = (key, interval) => (am.cooldowns[key] && (now - am.cooldowns[key]) < interval);
    const setCd = (key) => { am.cooldowns[key] = now; };

    // 1. 还款检查（每10 tick）
    if (am.autoRepay && !cd('repay', 10)) { autoRepayStrategy(); setCd('repay'); }
    // 2. 区域解锁检查（每30 tick）
    if (am.autoUnlockRegion && !cd('unlock', 30)) { autoUnlockRegionStrategy(); setCd('unlock'); }
    // 3. 业务开设检查（每20 tick）
    if (am.autoOpenBusiness && !cd('openBiz', 20)) { autoOpenBusinessStrategy(); setCd('openBiz'); }
    // 4. 业务升级检查（每20 tick）
    if (am.autoUpgradeBusiness && !cd('upgrade', 20)) { autoUpgradeStrategy(); setCd('upgrade'); }
    // 5. 员工招聘检查（每15 tick）
    if (am.autoHire && !cd('hire', 15)) { autoHireStrategy(); setCd('hire'); }
    // 6. 自动解雇检查（每30 tick）
    if (am.autoFire && !cd('fire', 30)) { autoFireStrategy(); setCd('fire'); }
    // 7. 研发检查（每25 tick）
    if (am.autoResearch && !cd('research', 25)) { autoResearchStrategy(); setCd('research'); }
    // 8. 股票买卖（每20 tick）
    if (am.autoInvest && !cd('invest', 20)) { autoInvestStrategy(); setCd('invest'); }
    // 9. NPC送礼（每24 tick，约每天一次）
    if (am.autoGift && !cd('gift', 24)) { autoGiftStrategy(); setCd('gift'); }
    // 10. 贷款检查（每60 tick）
    if (am.autoLoan && !cd('loan', 60)) { autoLoanStrategy(); setCd('loan'); }
    // 11. 自动拉项目（每3 tick检查一次，CD到了就拉）
    if (!cd('manualWork', 3)) { autoManualWorkStrategy(); setCd('manualWork'); }
  }

  function autoRepayStrategy() {
    if (!G || !G.loans || G.loans.length === 0) return;
    G.loans.forEach(loan => {
      if (loan.repaid) return;
      const totalDue = loan.amount + loan.interestPerTick * loan.remaining;
      if (loan.remaining <= 12 && G.money >= totalDue * 1.2) {
        G.money -= totalDue;
        loan.repaid = true;
        addLog('[托管] 自动还款：' + formatMoney(totalDue));
      }
    });
    G.loans = G.loans.filter(l => !l.repaid);
  }

  function autoUnlockRegionStrategy() {
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
        addLog('[托管] 自动解锁区域：' + r.name);
      }
    });
  }

  function autoOpenBusinessStrategy() {
    if (!G) return;
    const cityId = G.currentCityId;
    const cityDef = CITIES[cityId];
    if (!cityDef) return;
    const cityRegions = cityDef.regionIds || [];
    const unlockedRegions = cityRegions.filter(rid => {
      const r = REGIONS[rid];
      return r && (r.unlocked || G.unlockedRegions.includes(rid));
    });
    if (unlockedRegions.length === 0) return;

    const candidates = [];
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
        candidates.push({ bizId: bDef.id, name: bDef.name, icon: bDef.icon, score: bestScore, region: bestRegion, cost });
      }
    });
    candidates.sort((a, b) => b.score - a.score);
    for (const c of candidates) {
      if (G.money >= c.cost * 2) {
        if (c.cost > 0) G.money -= c.cost;
        G.businesses[c.bizId] = G.businesses[c.bizId] || { level: 0, region: null, unlocked: true };
        G.businesses[c.bizId].level = 1;
        G.businesses[c.bizId].region = c.region;
        G.businesses[c.bizId].unlocked = true;
        addLog('[托管] 自动开业：' + c.icon + ' ' + c.name + ' @' + (REGIONS[c.region]?.name || c.region));
        break;
      }
    }
  }

  function autoUpgradeStrategy() {
    if (!G) return;
    const candidates = [];
    BUSINESS_DEFS.forEach(bDef => {
      const state = G.businesses[bDef.id];
      if (!state || state.level === 0 || state.level >= bDef.levels.length) return;
      const curLv = bDef.levels[state.level - 1];
      const nextLv = bDef.levels[state.level];
      if (!curLv || !nextLv) return;
      const cost = nextLv.cost * 10000;
      const incomeGain = (nextLv.income - curLv.income) * 10000;
      if (cost <= 0) return;
      const roi = incomeGain / cost;
      candidates.push({ bizId: bDef.id, name: bDef.name, icon: bDef.icon, cost, roi, nextLv });
    });
    candidates.sort((a, b) => b.roi - a.roi);
    const threshold = G.autoMode.upgradeThreshold || 0.3;
    for (const c of candidates) {
      let cost = c.cost;
      if (G.origin === 'rich2nd') cost = Math.floor(cost * 0.8);
      if (G.money >= cost / threshold) {
        G.money -= cost;
        G.businesses[c.bizId].level++;
        addLog('[托管] 自动升级：' + c.icon + ' ' + c.name + ' → ' + c.nextLv.name);
        break;
      }
    }
  }

  function autoHireStrategy() {
    if (!G) return;
    // HR 统管模式：不设硬性 maxEmployees 限制，让 getEmpMax() 随公司规模自然增长
    const maxEmp = isHRManaged() ? getEmpMax() : Math.min(G.autoMode.maxEmployees || 8, getEmpMax());
    if (G.employees.length >= maxEmp) return;
    // 盈利判断：收入需覆盖当前工资 1.5 倍以上才招人
    const curTotalSalary = G.employees.reduce((s, e) => s + calcActualSalary(e.baseSalary || e.salary, G) * 10000, 0);
    if (calcTotalIncome() < curTotalSalary * 1.5) return;
    // HR 统管模式：批量招聘补缺部门
    if (isHRManaged()) {
      const depts = calcDeptStats();
      // 优先补充人数最少的部门
      const entries = Object.entries(depts).sort((a, b) => a[1].count - b[1].count);
      for (const [roleId, stats] of entries) {
        const result = batchHireDept(roleId, stats.count + 2);
        if (result.ok && result.hired > 0) return;
      }
      return;
    }
    // 旧逻辑：逐个招聘
    const priorityRoles = ['manager', 'director', 'developer', 'sales', 'analyst', 'marketer', 'designer', 'intern'];
    let chosenRole = null;
    for (const rid of priorityRoles) {
      const def = EMP_ROLES.find(r => r.id === rid);
      if (def) {
        const estimatedSalary = calcActualSalary(def.baseSalary, G);
        if (G.money >= estimatedSalary * 10000 * 3) { chosenRole = def; break; }
      }
    }
    if (!chosenRole) chosenRole = EMP_ROLES[Math.floor(Math.random() * EMP_ROLES.length)];
    const firstNames = ['王','李','张','刘','陈','杨','赵','周','吴','徐'];
    const lastNames = ['明','华','强','伟','磊','静','敏','婷','杰','浩'];
    const name = firstNames[Math.floor(Math.random() * firstNames.length)] + lastNames[Math.floor(Math.random() * lastNames.length)];
    const actualSalary = calcActualSalary(chosenRole.baseSalary, G);
    const loyalty = +(35 + Math.random() * 35).toFixed(0);
    G.empIdCounter++;
    G.employees.push({ id: G.empIdCounter, name, role: chosenRole.id, baseSalary: chosenRole.baseSalary, loyalty, happiness: 50, icon: chosenRole.icon || '👤', fatigue: 0, skill: 1 });
    addLog(`[托管] 自动招聘：${name}（${chosenRole.name}） 工资 ${actualSalary}万/月`);
  }

  function autoFireStrategy() {
    if (!G || G.employees.length <= 2) return;
    // HR 统管模式下跳过（HR 已在维稳忠诚度）
    if (isHRManaged()) return;
    const threshold = G.autoMode.fireThreshold || 20;
    const toFire = G.employees.filter(e => e.loyalty < threshold);
    if (toFire.length === 0) return;
    toFire.sort((a, b) => a.loyalty - b.loyalty);
    const emp = toFire[0];
    const actualSalary = calcActualSalary(emp.baseSalary || emp.salary, G);
    const comp = actualSalary * 3 * 10000;
    G.money -= comp;
    G.employees = G.employees.filter(e => e.id !== emp.id);
    addLog(`[托管] 自动解雇：${emp.name}（忠诚度${emp.loyalty.toFixed(0)} < ${threshold}），支付赔偿 ${formatMoney(comp)}`);
  }

  function autoResearchStrategy() {
    if (!G || G.activeResearch) return;
    const routes = ['digital', 'ai', 'blockchain'];
    for (const rid of routes) {
      const tree = TECH_TREE[rid];
      if (!tree || !tree.levels) continue;
      const curLevel = G.completedResearch[rid] || 0;
      if (curLevel >= tree.levels.length) continue;
      const nextLvl = tree.levels[curLevel];
      if (G.rpt >= nextLvl.rptCost && G.money >= nextLvl.moneyCost * 1.5) {
        startResearch(rid);
        return;
      }
    }
  }

  function autoInvestStrategy() {
    if (!G) return;
    const budget = G.money * (G.autoMode.investBudget || 0.1);
    if (budget < 10000) return;
    // 卖出涨幅超20%的持仓
    Object.entries(G.stocks).forEach(([sid, holding]) => {
      if (!holding || holding.shares <= 0) return;
      const price = G.stockPrices[sid] || STOCKS[sid]?.basePrice || 0;
      if (holding.avgCost <= 0) return;
      const profitPct = (price - holding.avgCost) / holding.avgCost;
      if (profitPct >= 0.20) {
        const revenue = price * holding.shares;
        G.money += revenue;
        G.stockProfitTotal = (G.stockProfitTotal || 0) + (revenue - holding.avgCost * holding.shares);
        delete G.stocks[sid];
        addLog('[托管] 自动卖出：' + (STOCKS[sid]?.name || sid) + ' +' + (profitPct * 100).toFixed(1) + '%');
      }
    });
    // 买入折价股票
    const cheapStocks = [];
    Object.entries(STOCKS).forEach(([sid, stock]) => {
      const price = G.stockPrices[sid] || stock.basePrice;
      if (price < stock.basePrice * 0.95) {
        cheapStocks.push({ sid, name: stock.name, price, discount: (stock.basePrice - price) / stock.basePrice });
      }
    });
    if (cheapStocks.length === 0) return;
    cheapStocks.sort((a, b) => b.discount - a.discount);
    const picks = cheapStocks.slice(0, Math.min(3, cheapStocks.length));
    const perBudget = budget / picks.length;
    picks.forEach(p => {
      const shares = Math.floor(perBudget / p.price);
      if (shares >= 10 && G.money >= p.price * shares) buyStock(p.sid, shares);
    });
  }

  function autoGiftStrategy() {
    if (!G || !G.npcFavor) return;
    const budget = G.autoMode.giftBudget || 50000;
    if (G.money < budget * 2) return;
    let lowestNpc = null, lowestFavor = 999;
    Object.entries(G.npcFavor).forEach(([npcId, favor]) => {
      const npc = NPCS[npcId];
      if (!npc || npc.actUnlock > G.act) return;
      if (favor < lowestFavor) { lowestFavor = favor; lowestNpc = npc; }
    });
    if (!lowestNpc || lowestFavor >= 75) return;
    const giftPrefs = lowestNpc.giftPreferences || {};
    const lovedTypes = giftPrefs.love || [];
    const giftTypeMap = { wine:'名酒', book:'书籍', art:'艺术品', tech:'科技产品', luxury:'奢侈品' };
    const giftItem = lovedTypes.length > 0 ? (giftTypeMap[lovedTypes[0]] || '精品') : '精美礼品';
    G.money -= budget;
    G.npcFavor[lowestNpc.id] = Math.min(100, (G.npcFavor[lowestNpc.id] || 0) + 8);
    addLog('[托管] 自动送礼：' + lowestNpc.name + ' ← ' + giftItem + ' 好感+8');
  }

  function autoLoanStrategy() {
    if (!G || G.loans.length >= 3) return;
    const totalSalary = G.employees.reduce((s, e) => s + calcActualSalary(e.baseSalary || e.salary, G) * 10000, 0);
    if (G.money > totalSalary * 3) return;
    const totalAssets = G.money + getStockPortfolioValue();
    const loanAmt = Math.floor(totalAssets * 0.15);
    if (loanAmt < 50000) return;
    applyLoan(loanAmt, 60);
  }

  // 自动拉项目策略：CD到了就拉，增加被动收入
  function autoManualWorkStrategy() {
    if (!G) return;
    const cdRemain = getManualWorkCdRemain();
    if (cdRemain > 0) return; // CD中，跳过
    const result = manualWork();
    if (result && result.success && result.earn > 0) {
      addLog('[托管] 自动拉项目：' + formatMoney(result.earn));
    }
  }



  // ===================================================
  //  竞争对手AI系统
  // ===================================================
  function updateRivals() {
    if (!G || !G.rivals || G.rivals.length === 0) return;
    G.rivals.forEach(r => {
      r.tickCount = (r.tickCount || 0) + 1;
      const fluctuation = 0.95 + Math.random() * 0.10;
      r.money *= r.growthRate * fluctuation;
      if (Math.random() < 0.08) {
        const evts = ['expansion','crisis','breakthrough','acquisition'];
        const evt = evts[Math.floor(Math.random() * evts.length)];
        switch(evt) {
          case 'expansion': r.money *= 1.15; addLog(`📈 ${r.name}大举扩张，资产增长15%。`); break;
          case 'crisis': r.money *= 0.85; addLog(`📉 ${r.name}遭遇危机，资产缩水15%。`); break;
          case 'breakthrough': r.money *= 1.10; addLog(`💡 ${r.name}取得技术突破。`); break;
          case 'acquisition': r.money *= 1.08; addLog(`🤝 ${r.name}完成并购。`); break;
        }
        // === 联动：竞争对手事件 → 市场影响 ===
        if (evt === 'expansion') {
          // 竞争对手扩张：玩家业务收益 -3%
          G._rivalExpansionPenalty = (G._rivalExpansionPenalty || 0) + 0.03;
          setTimeout(() => { G._rivalExpansionPenalty = (G._rivalExpansionPenalty || 0) - 0.03; }, 60000);
        }
        if (evt === 'crisis') {
          // 竞争对手危机：玩家业务收益 +2%（市场空间释放）
          G._rivalCrisisBonus = (G._rivalCrisisBonus || 0) + 0.02;
          setTimeout(() => { G._rivalCrisisBonus = (G._rivalCrisisBonus || 0) - 0.02; }, 60000);
        }
      }
    });
    // 竞争对手排名变化时触发事件
    const prevRank = G._lastRivalRank || 1;
    const curRank = getRivalRank().rank;
    if (curRank !== prevRank) {
      G._lastRivalRank = curRank;
      // 排名变化：有概率触发相关事件（在tryFireEvent中处理）
    }
  }

  function getRivalRank() {
    if (!G || !G.rivals || G.rivals.length === 0) return { rank: 1, total: 1, list: [] };
    const allEntities = G.rivals.map(r => ({
      name: r.name, boss: r.boss, money: r.money, style: r.style, color: r.color, isPlayer: false
    }));
    allEntities.push({
      name: '你（' + (G.companyName || '公司') + '\u0029', boss: G.name || '你',
      money: G.money, style: '玩家', color: '#00d2ff', isPlayer: true
    });
    allEntities.sort((a, b) => b.money - a.money);
    const playerIndex = allEntities.findIndex(e => e.isPlayer);
    return { rank: playerIndex + 1, total: allEntities.length, list: allEntities };
  }

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
    const playerTotalAssets = G.money + (G._stockValueCache || 0);
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
    let total = 0;
    Object.entries(G.businesses).forEach(([bizId, biz]) => {
      if (!biz || biz.level === 0) return;
      const bDef = BUSINESS_DEFS.find(b => b.id === bizId);
      if (!bDef) return;
      const lv = bDef.levels[biz.level - 1];
      if (!lv) return;
      const baseIncome = lv.income * 10000;
      const rate = CONFIG.MAINTENANCE_BASE_RATE + biz.level * CONFIG.MAINTENANCE_LEVEL_SCALE;
      total += baseIncome * rate;
    });
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
      { id: 'ms_biz_10', name: '满级业务', desc: '任意业务达到10级', icon: '🔥', cond: () => Object.values(G.businesses).some(b => b.level >= 10) },
      { id: 'ms_all_biz_10', name: '全能满级', desc: '所有业务达到10级', icon: '👑', cond: () => BUSINESS_DEFS.every(bDef => G.businesses[bDef.id] && G.businesses[bDef.id].level >= 10) },
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
    if (curSkill >= CONFIG.EMP_SKILL_MAX) return { ok: false, msg: '技能已满级' };
    const cost = CONFIG.EMP_TRAINING_COST_BASE * curSkill * curSkill;
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
          const maxTechLv = Math.max(...Object.values(G.completedResearch || {}));
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
      G.empIdCounter++;
      const name = firstNames[Math.floor(Math.random() * firstNames.length)] + lastNames[Math.floor(Math.random() * lastNames.length)];
      const loyalty = +(35 + Math.random() * 35).toFixed(0);
      G.employees.push({ id: G.empIdCounter, name, role: roleDef.id, baseSalary: roleDef.baseSalary, loyalty, happiness: 50, icon: roleDef.icon || '👤', fatigue: 0, skill: 1 });
      hired++;
    }
    G.money -= totalCost;
    addLog(`👥 批量招聘 ${hired} 名${roleDef.name}，花费 ${formatMoney(totalCost)}`);
    save();
    return { ok: true, msg: `招聘${hired}人`, hired };
  }

  // ========== HR 统管：批量招聘部门 ==========
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
    const firstNames = ['王','李','张','刘','陈','杨','赵','周','吴','徐','孙','马','朱','胡','郭'];
    const lastNames = ['明','华','强','伟','磊','静','敏','婷','杰','浩','飞','洋','芳','军','平'];
    for (let i = 0; i < canHire; i++) {
      G.empIdCounter++;
      const name = firstNames[Math.floor(Math.random() * firstNames.length)] + lastNames[Math.floor(Math.random() * lastNames.length)];
      G.employees.push({ id: G.empIdCounter, name, role: roleDef.id, baseSalary: roleDef.baseSalary, loyalty: +(35 + Math.random() * 35).toFixed(0), happiness: 50, icon: roleDef.icon || '👤', fatigue: 0, skill: 1 });
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
    startResearch, getTechBonus, generateRPT, checkResearchProgress,
    buyStock, sellStock, updateStockPrices, getStockPortfolioValue, getStockCostBasis,
    applyLoan, processLoans, repayLoan,
    getSeason, checkHoliday,
    calcSynergyEffects, getSynergyStatusDisplay,
    // ---- 新增系统 ----
    calcMaintenanceCost,
    upgradeBusinessMax,
    batchHire,
    trainEmployee, restEmployee,
    checkAndShowOfflineIncome,
    // ---- HR 统管 ----
    isHRManaged, calcDeptStats, hrAutoTick,
    batchHireDept, batchTrainDept,
  };
})();
