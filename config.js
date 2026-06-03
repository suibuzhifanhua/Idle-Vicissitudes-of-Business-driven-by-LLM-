// ===================================================
// config.js — 常量、出身、区域、业务、员工、技能、成就
// ===================================================

// ---- 游戏参数 ----
const CONFIG = {
  TICK_MS: 30000,          // 30秒/Tick
  LLM_BASE: 'http://localhost:11434',
  LLM_MODEL: 'qwen3.5:4b',
  LLM_CHECK_TIMEOUT: 3000,    // LLM 检测超时(ms)
  LLM_GENERATE_TIMEOUT: 15000, // LLM 生成超时(ms)
  LLM_MAX_CONCURRENT: 2,       // LLM 最大并发请求数
  LLM_FAILURE_COOLDOWN: 60000, // 连续失败后冷却时间(ms)
  LLM_MAX_FAILURES: 3,         // 连续失败多少次进入冷却
  EVENT_CHECK_INTERVAL: 6, // 事件检查间隔（秒），约每 Tick 触发 0~5 次（概率判定）
  EVENT_BASE_PROB: 0.25,
  MAX_PENDING_DECISIONS: 5, // 事件队列增大
  MAX_OFFLINE_HOURS: 24,    // 离线收益上限24小时
  BANKRUPTCY_THRESHOLD: -500000,
  BANKRUPTCY_TICKS: 8,     // 破产容忍tick增加
  SAVE_INTERVAL: 8,
  MANUAL_WORK_CD: 20,
  MANUAL_WORK_BAD_PROB: 0.08,
  STRESS_NATURAL_DECAY: 0.05,
  LOYALTY_DECAY: 0.17,
  REPUTATION_DECAY: 0.08,
  MAX_CONNECTIONS: 100,        // 人脉上限
  CONNECTIONS_GAIN_SCALE: 0.45, // 人脉获取比例缩放（降低以避免过快满值）
  // ---- 维护成本 ----
  MAINTENANCE_BASE_RATE: 0.02,   // 每Tick维护成本 = 业务收入 × 此比例
  MAINTENANCE_LEVEL_SCALE: 0.005, // 每级额外增加0.5%
  OPERATIONAL_RISK_BASE: 0.003,   // 每Tick运营事故概率
  // ---- 市场份额 ----
  MARKET_SHARE_DECAY: 0.1,       // 对手每tick抢占份额概率
  MARKET_SHARE_RECOVERY: 0.05,   // 玩家每tick恢复份额概率
  // ---- 供应链 ----
  SUPPLY_CHAIN_RISK: 0.008,       // 供应链断裂概率/tick
  SUPPLY_CHAIN_RECOVER_TICKS: 6,  // 供应链恢复tick数
  // ---- 员工深度 ----
  EMP_FATIGUE_RATE: 0.15,         // 疲劳增长/tick（净增=此值-衰减）
  EMP_FATIGUE_DECAY: 0.08,        // 疲劳自然恢复/tick
  EMP_TRAINING_COST_BASE: 20000,  // 培训基础费用
  EMP_SKILL_MAX: 5,               // 技能最高5级
  // ---- 实习生转正 ----
  INTERN_SALARY_RATIO: 0.5,         // 实习期工资为正式工资的50%
  INTERN_TICKS_TO_CONVERT: 20,      // 实习期持续20 tick（约10分钟）
  INTERN_CONVERT_ATTR_BONUS: 10,    // 转正时属性提升幅度
  INTERN_CONVERT_LOYALTY_BONUS: 15, // 转正时忠诚度加成
  // ---- HR 统管 ----
  HR_THRESHOLD_DEFAULT: 8,        // 无HR时进入统管的最低员工数
  HR_THRESHOLD_WITH_HR: 5,        // 有HR时进入统管的最低员工数
  HR_HIRE_DISCOUNT: 0.8,          // HR批量招聘成本折扣
  HR_TRAIN_DISCOUNT: 0.7,         // HR部门培训成本折扣
  HR_SALARY_DISCOUNT: 0.85,       // HR总工资折扣
  HR_AUTO_FATIGUE_REDUCTION: 0.8, // HR每Tick自动降疲劳值
  // ---- 离线收益 ----
  OFFLINE_EFFICIENCY: 0.7,        // 离线收益效率70%
  // ---- 资产系统 ----
  ASSET_REFRESH_TICKS: 12,        // 资产市场刷新间隔(tick)
  ASSET_MARKET_SIZE: 8,           // 市场同时展示资产数
  ASSET_AUCTION_MIN_TICKS: 3,     // 拍卖最短等待
  ASSET_AUCTION_MAX_TICKS: 8,     // 拍卖最长等待
  ASSET_PAWN_RATIO_MIN: 0.38,     // 典当最低回款比例
  ASSET_PAWN_RATIO_MAX: 0.55,     // 典当最高回款比例
  ASSET_MAX_SLOTS: 20,            // 资产槽位上限
};

// ---- 时间系统 ----
const TIME = {
  DAY_CYCLE_TICKS: 24,     // 24个Tick = 一个游戏日
  DAWN_START: 5,           // 5:00 黎明
  DAY_START: 7,            // 7:00 白天
  DUSK_START: 17,          // 17:00 黄昏
  NIGHT_START: 19,         // 19:00 夜晚
};

// ---- 气候系统 ----
const WEATHERS = {
  sunny:    { name:'晴天',   incomeMod: 1.0,   eventMod: 'neutral',  desc: '阳光明媚' },
  cloudy:   { name:'多云',   incomeMod: 1.0,   eventMod: 'neutral',  desc: '多云转阴' },
  rainy:    { name:'雨天',   incomeMod: 0.95,  eventMod: 'negative', desc: '阴雨连绵' },
  storm:    { name:'暴风雨', incomeMod: 0.85,  eventMod: 'crisis',   desc: '狂风暴雨' },
  foggy:    { name:'雾天',   incomeMod: 0.9,   eventMod: 'neutral',  desc: '大雾弥漫' },
  snow:     { name:'雪天',   incomeMod: 0.88,  eventMod: 'neutral',  desc: '大雪纷飞' },
  heatwave: { name:'高温',   incomeMod: 0.92,  eventMod: 'negative', desc: '酷热难耐' },
};

// ---- 所有区域（跨城市） ----
const REGIONS = {
  // ========== 新海市（初始城市） ==========
  yongning: {
    id:'yongning', name:'永宁区', type:'老城区', cityId:'xinhai',
    unlocked:true, unlockCond:null,
    bonus:{ retail:1.05, cost:0.92, disasterProb:1.1, desc:'运营成本-8%，灾害事件+10%' },
    actUnlock:0, npcFrom:'小老板、厨师、社区大妈',
  },
  xinghai: {
    id:'xinghai', name:'星海区', type:'科技创新区', cityId:'xinhai',
    unlocked:false, unlockCond:{ money:15000000 },
    bonus:{ tech:1.15, burnoutProb:1.1, rdBonus:1.15, desc:'科技类研发速度+15%，员工Burnout+10%' },
    actUnlock:1, npcFrom:'程序员、产品经理、CTO、天使投资人',
  },
  jinwan: {
    id:'jinwan', name:'金湾区', type:'金融中心区', cityId:'xinhai',
    unlocked:false, unlockCond:{ money:25000000 },
    bonus:{ finance:1.08, negativeEventProb:1.12, desc:'金融类收益+8%，负面事件+12%' },
    actUnlock:2, npcFrom:'投行家、基金经理、证券分析师',
  },
  jinxiu: {
    id:'jinxiu', name:'锦绣区', type:'商业文化区', cityId:'xinhai',
    unlocked:false, unlockCond:{ money:25000000 },
    bonus:{ repGain:1.08, rumorSpread:1.2, desc:'声誉获取+8%，负面舆论传播+20%' },
    actUnlock:2, npcFrom:'广告总监、KOL、媒体记者',
  },
  yunding: {
    id:'yunding', name:'云顶区', type:'高端住宅区', cityId:'xinhai',
    unlocked:false, unlockCond:{ reputation:80 },
    bonus:{ connGain:1.25, socialCost:1.1, desc:'人脉获取+25%，社交成本+10%' },
    actUnlock:3, npcFrom:'企业二代、私人银行家、高端名流',
  },
  tiexi: {
    id:'tiexi', name:'铁西区', type:'工业物流区', cityId:'xinhai',
    unlocked:false, unlockCond:{ money:50000000 },
    bonus:{ opsCost:0.9, policyEventProb:1.15, desc:'运营类成本-10%，政策合规事件+15%' },
    actUnlock:3, npcFrom:'工厂经理、物流总监、环保局官员',
  },
  guangming: {
    id:'guangming', name:'光明区', type:'政务中心区', cityId:'xinhai',
    unlocked:false, unlockCond:{ act:1 },
    bonus:{ policyInfo:true, desc:'政府NPC关系好可获得政策信息提前量' },
    actUnlock:0, npcFrom:'处长、科员、窗口办事员',
  },

  // ========== 京都市（500万解锁） ==========
  jd_cbd: {
    id:'jd_cbd', name:'中央商务区', type:'CBD', cityId:'jingdu',
    unlocked:false, unlockCond:{ money:50000000, cityId:'jingdu' },
    bonus:{ finance:1.07, desc:'金融收益+7%' },
    actUnlock:1, npcFrom:'央企高管、部委官员',
  },
  jd_tech: {
    id:'jd_tech', name:'高新园区', type:'科技园', cityId:'jingdu',
    unlocked:false, unlockCond:{ reputation:40, cityId:'jingdu' },
    bonus:{ tech:1.1, rdBonus:1.1, desc:'科技研发+10%' },
    actUnlock:2, npcFrom:'中科院研究员、AI科学家',
  },
  jd_culture: {
    id:'jd_culture', name:'文化街区', type:'文创区', cityId:'jingdu',
    unlocked:false, unlockCond:{ reputation:50, cityId:'jingdu' },
    bonus:{ repGain:1.08, desc:'声誉获取+8%' },
    actUnlock:2, npcFrom:'艺术家、策展人、文化官员',
  },
  jd_tongzhou: {
    id:'jd_tongzhou', name:'通州区', type:'副中心', cityId:'jingdu',
    unlocked:false, unlockCond:{ money:20000000, cityId:'jingdu' },
    bonus:{ opsCost:0.93, desc:'运营成本-7%' },
    actUnlock:3, npcFrom:'规划局局长、建筑承包商',
  },

  // ========== 深港市（2000万解锁） ==========
  sg_ftz: {
    id:'sg_ftz', name:'前海自贸区', type:'自贸区', cityId:'shengang',
    unlocked:false, unlockCond:{ money:20000000, cityId:'shengang' },
    bonus:{ trade:1.08, desc:'贸易类收益+8%' },
    actUnlock:1, npcFrom:'外贸经理、海关官员',
  },
  sg_finance: {
    id:'sg_finance', name:'福田金融港', type:'金融区', cityId:'shengang',
    unlocked:false, unlockCond:{ money:50000000, cityId:'shengang' },
    bonus:{ finance:1.1, desc:'金融类收益+10%' },
    actUnlock:2, npcFrom:'基金经理、证券分析师',
  },
  sg_shekou: {
    id:'sg_shekou', name:'蛇口港区', type:'物流区', cityId:'shengang',
    unlocked:false, unlockCond:{ money:15000000, cityId:'shengang' },
    bonus:{ logistics:1.08, opsCost:0.93, desc:'物流效率+8%，运营成本-7%' },
    actUnlock:1, npcFrom:'物流总监、港口调度员',
  },
  sg_nanshan: {
    id:'sg_nanshan', name:'南山科技园', type:'科技园区', cityId:'shengang',
    unlocked:false, unlockCond:{ reputation:60, cityId:'shengang' },
    bonus:{ tech:1.12, desc:'科技收益+12%' },
    actUnlock:3, npcFrom:'CTO、创投合伙人',
  },

  // ========== 蓉城市（5000万解锁） ==========
  rc_gaoxin: {
    id:'rc_gaoxin', name:'高新区', type:'科技新区', cityId:'rongcheng',
    unlocked:false, unlockCond:{ money:50000000, cityId:'rongcheng' },
    bonus:{ tech:1.08, rdBonus:1.05, desc:'科技研发+8%' },
    actUnlock:2, npcFrom:'工程师、项目经理',
  },
  rc_chunxi: {
    id:'rc_chunxi', name:'春熙商圈', type:'商业区', cityId:'rongcheng',
    unlocked:false, unlockCond:{ money:30000000, cityId:'rongcheng' },
    bonus:{ retail:1.1, desc:'零售收益+10%' },
    actUnlock:1, npcFrom:'品牌经理、加盟商',
  },
  rc_tianfu: {
    id:'rc_tianfu', name:'天府新区', type:'新区', cityId:'rongcheng',
    unlocked:false, unlockCond:{ money:100000000, cityId:'rongcheng' },
    bonus:{ opsCost:0.92, desc:'运营成本-8%' },
    actUnlock:3, npcFrom:'规划局官员、地产开发商',
  },

  // ========== 杭江市（1亿解锁） ==========
  hj_binjiang: {
    id:'hj_binjiang', name:'滨江数字谷', type:'数字经济区', cityId:'hangjiang',
    unlocked:false, unlockCond:{ money:100000000, cityId:'hangjiang' },
    bonus:{ tech:1.2, rdBonus:1.15, desc:'数字科技收益+20%' },
    actUnlock:2, npcFrom:'产品经理、AI工程师',
  },
  hj_xihu: {
    id:'hj_xihu', name:'西湖文创区', type:'文创区', cityId:'hangjiang',
    unlocked:false, unlockCond:{ reputation:70, cityId:'hangjiang' },
    bonus:{ repGain:1.2, desc:'声誉获取+20%' },
    actUnlock:3, npcFrom:'MCN创始人、网红KOL',
  },
  hj_xiaoshan: {
    id:'hj_xiaoshan', name:'萧山智造区', type:'制造区', cityId:'hangjiang',
    unlocked:false, unlockCond:{ money:80000000, cityId:'hangjiang' },
    bonus:{ manufacturing:1.08, opsCost:0.93, desc:'制造成本-7%，效率+8%' },
    actUnlock:2, npcFrom:'工厂厂长、供应链经理',
  },

  // ========== 新加坡（5亿 + 第4幕） ==========
  xjp_marina: {
    id:'xjp_marina', name:'滨海湾金融中心', type:'金融区', cityId:'xinjiapo',
    unlocked:false, unlockCond:{ money:500000000, cityId:'xinjiapo' },
    bonus:{ finance:1.08, desc:'金融收益+8%' },
    actUnlock:4, npcFrom:'私人银行家、基金经理',
  },
  xjp_jurong: {
    id:'xjp_jurong', name:'裕廊工业园', type:'工业区', cityId:'xinjiapo',
    unlocked:false, unlockCond:{ money:300000000, cityId:'xinjiapo' },
    bonus:{ opsCost:0.88, desc:'运营成本-12%' },
    actUnlock:4, npcFrom:'供应链总监、物流经理',
  },
  xjp_orchard: {
    id:'xjp_orchard', name:'乌节路商圈', type:'商业区', cityId:'xinjiapo',
    unlocked:false, unlockCond:{ reputation:75, cityId:'xinjiapo' },
    bonus:{ retail:1.08, desc:'零售收益+8%' },
    actUnlock:4, npcFrom:'奢侈品经理、零售商',
  },

  // ========== 东京（10亿 + 第4幕） ==========
  dj_marunouchi: {
    id:'dj_marunouchi', name:'丸之内金融街', type:'金融区', cityId:'dongjing',
    unlocked:false, unlockCond:{ money:1000000000, cityId:'dongjing' },
    bonus:{ finance:1.25, desc:'金融收益+25%' },
    actUnlock:4, npcFrom:'投行家、财阀代表',
  },
  dj_shinjuku: {
    id:'dj_shinjuku', name:'新宿商业区', type:'商业区', cityId:'dongjing',
    unlocked:false, unlockCond:{ money:600000000, cityId:'dongjing' },
    bonus:{ retail:1.08, desc:'零售收益+8%' },
    actUnlock:4, npcFrom:'商社经理、连锁店长',
  },
  dj_akihabara: {
    id:'dj_akihabara', name:'秋叶原科技区', type:'科技区', cityId:'dongjing',
    unlocked:false, unlockCond:{ reputation:80, cityId:'dongjing' },
    bonus:{ tech:1.3, rdBonus:1.2, desc:'科技收益+30%，研发+20%' },
    actUnlock:4, npcFrom:'CTO、游戏公司CEO',
  },

  // ========== 纽约（20亿 + 第5幕） ==========
  ny_wallstreet: {
    id:'ny_wallstreet', name:'华尔街', type:'金融区', cityId:'niuyue',
    unlocked:false, unlockCond:{ money:2000000000, cityId:'niuyue' },
    bonus:{ finance:1.12, desc:'金融收益+12%' },
    actUnlock:5, npcFrom:'投行CEO、对冲基金经理',
  },
  ny_brooklyn: {
    id:'ny_brooklyn', name:'布鲁克林创意区', type:'文创区', cityId:'niuyue',
    unlocked:false, unlockCond:{ reputation:80, cityId:'niuyue' },
    bonus:{ repGain:1.08, desc:'声誉获取+8%' },
    actUnlock:5, npcFrom:'品牌总监、创意人',
  },
  ny_silicon: {
    id:'ny_silicon', name:'硅巷科技区', type:'科技区', cityId:'niuyue',
    unlocked:false, unlockCond:{ money:1500000000, cityId:'niuyue' },
    bonus:{ tech:1.12, desc:'科技收益+12%' },
    actUnlock:5, npcFrom:'VC合伙人、CTO',
  },

  // ========== 伦敦（30亿 + 第5幕） ==========
  ld_city: {
    id:'ld_city', name:'伦敦金融城', type:'金融区', cityId:'lundun',
    unlocked:false, unlockCond:{ money:3000000000, cityId:'lundun' },
    bonus:{ finance:1.25, desc:'金融收益+25%' },
    actUnlock:5, npcFrom:'投行MD、私募大佬',
  },
  ld_canary: {
    id:'ld_canary', name:'金丝雀码头', type:'贸易区', cityId:'lundun',
    unlocked:false, unlockCond:{ money:2000000000, cityId:'lundun' },
    bonus:{ trade:1.1, desc:'贸易收益+10%' },
    actUnlock:5, npcFrom:'贸易商、物流总监',
  },
  ld_shoreditch: {
    id:'ld_shoreditch', name:'肖迪奇科技城', type:'科技区', cityId:'lundun',
    unlocked:false, unlockCond:{ reputation:85, cityId:'lundun' },
    bonus:{ tech:1.1, desc:'科技收益+10%' },
    actUnlock:5, npcFrom:'科技创始人、VC',
  },

  // ========== 迪拜（50亿 + 第5幕） ==========
  db_difc: {
    id:'db_difc', name:'迪拜国际金融中心', type:'金融区', cityId:'dibai',
    unlocked:false, unlockCond:{ money:5000000000, cityId:'dibai' },
    bonus:{ finance:1.12, desc:'金融收益+12%' },
    actUnlock:5, npcFrom:'石油资本代表、基金经理',
  },
  db_marina: {
    id:'db_marina', name:'迪拜码头贸易区', type:'贸易区', cityId:'dibai',
    unlocked:false, unlockCond:{ money:3000000000, cityId:'dibai' },
    bonus:{ trade:1.1, desc:'贸易收益+10%' },
    actUnlock:5, npcFrom:'国际贸易商、船运公司',
  },
  db_freezone: {
    id:'db_freezone', name:'杰贝阿里免税区', type:'免税区', cityId:'dibai',
    unlocked:false, unlockCond:{ money:4000000000, cityId:'dibai' },
    bonus:{ opsCost:0.8, desc:'运营成本-20%（免税）' },
    actUnlock:5, npcFrom:'税务顾问、自贸区官员',
  },
};

// ---- 城市定义 ----
const CITIES = {
  xinhai: {
    id:'xinhai', name:'新海市', icon:'🏙️', isInternational:false,
    desc:'你的起点，一个充满活力的沿海城市。从这里开始你的商业传奇。',
    unlockMoney:0, minAct:0,
    cityBonus:{ desc:'故乡加成：所有业务基础收益+3%', incomeMult:1.03 },
    regionIds:['yongning','xinghai','jinwan','jinxiu','yunding','tiexi','guangming'],
    sortOrder:0,
  },
  jingdu: {
    id:'jingdu', name:'京都市', icon:'🏛️', isInternational:false,
    desc:'政治文化中心，政策资源丰富，央企云集。',
    unlockMoney:150000000, minAct:1,
    cityBonus:{ desc:'政策加成：政府相关收益+8%', policyBonus:1.08 },
    regionIds:['jd_cbd','jd_tech','jd_culture','jd_tongzhou'],
    sortOrder:1,
  },
  shengang: {
    id:'shengang', name:'深港市', icon:'🌉', isInternational:false,
    desc:'改革开放前沿，金融与科技并重，跨境贸易活跃。',
    unlockMoney:500000000, minAct:2,
    cityBonus:{ desc:'金融加成：金融类收益+5%', financeBonus:1.05 },
    regionIds:['sg_ftz','sg_finance','sg_shekou','sg_nanshan'],
    sortOrder:2,
  },
  rongcheng: {
    id:'rongcheng', name:'蓉城市', icon:'🐼', isInternational:false,
    desc:'西部核心城市，生活成本低，产业政策优厚。',
    unlockMoney:1200000000, minAct:2,
    cityBonus:{ desc:'西部大开发：运营成本-5%', opsCostReduction:0.95 },
    regionIds:['rc_gaoxin','rc_chunxi','rc_tianfu'],
    sortOrder:3,
  },
  hangjiang: {
    id:'hangjiang', name:'杭江市', icon:'🏯', isInternational:false,
    desc:'数字经济高地，电商直播之都，互联网氛围浓厚。',
    unlockMoney:2500000000, minAct:3,
    cityBonus:{ desc:'数字经济：科技收益+5%', techBonus:1.05 },
    regionIds:['hj_binjiang','hj_xihu','hj_xiaoshan'],
    sortOrder:4,
  },
  xinjiapo: {
    id:'xinjiapo', name:'新加坡', icon:'🇸🇬', isInternational:true,
    desc:'东南亚金融枢纽，税率友好，连接东西方市场。',
    unlockMoney:3000000000, minAct:4,
    cityBonus:{ desc:'离岸优势：金融收益+8%，运营成本-3%', financeBonus:1.08, opsCostReduction:0.97 },
    regionIds:['xjp_marina','xjp_jurong','xjp_orchard'],
    sortOrder:5,
  },
  dongjing: {
    id:'dongjing', name:'东京', icon:'🇯🇵', isInternational:true,
    desc:'亚洲最大都市圈，科技与文化并重，动漫产业发达。',
    unlockMoney:6000000000, minAct:4,
    cityBonus:{ desc:'科技领先：科技收益+10%', techBonus:1.10 },
    regionIds:['dj_marunouchi','dj_shinjuku','dj_akihabara'],
    sortOrder:6,
  },
  niuyue: {
    id:'niuyue', name:'纽约', icon:'🇺🇸', isInternational:true,
    desc:'全球金融心脏，华尔街所在，商业帝国必争之地。',
    unlockMoney:12000000000, minAct:5,
    cityBonus:{ desc:'华尔街效应：金融收益+12%', financeBonus:1.12 },
    regionIds:['ny_wallstreet','ny_brooklyn','ny_silicon'],
    sortOrder:7,
  },
  lundun: {
    id:'lundun', name:'伦敦', icon:'🇬🇧', isInternational:true,
    desc:'欧洲金融门户，百年商业底蕴，高端品牌云集。',
    unlockMoney:18000000000, minAct:5,
    cityBonus:{ desc:'欧洲门户：全业务收益+5%', incomeMult:1.05 },
    regionIds:['ld_city','ld_canary','ld_shoreditch'],
    sortOrder:8,
  },
  dibai: {
    id:'dibai', name:'迪拜', icon:'🇦🇪', isInternational:true,
    desc:'中东财富中心，免税政策优厚，石油资本雄厚。',
    unlockMoney:30000000000, minAct:5,
    cityBonus:{ desc:'免税天堂：运营成本-15%，贸易收益+10%', opsCostReduction:0.85, tradeBonus:1.10 },
    regionIds:['db_difc','db_marina','db_freezone'],
    sortOrder:9,
  },
};

// ---- 富豪等级体系（12级） ----
const RANK_TIERS = [
  { name:'个体户',        icon:'🛒',  minMoney:0,           desc:'一人一店，白手起家' },
  { name:'小老板',        icon:'🏪',  minMoney:2000000,     desc:'有了第一家像样的门店' },
  { name:'区域龙头',      icon:'🏢',  minMoney:20000000,    desc:'在这片区域，没人不知道你的名字' },
  { name:'城市新贵',      icon:'🏗️',  minMoney:100000000,   desc:'新海市的商业版图上，你是一颗冉冉升起的新星' },
  { name:'省级大亨',      icon:'🏆',  minMoney:500000000,   desc:'跨城布局，省级市场尽在掌握' },
  { name:'全国百强',      icon:'🌏',  minMoney:2000000000,  desc:'你的名字出现在福布斯中国榜单上' },
  { name:'亚洲巨擘',      icon:'👑',  minMoney:10000000000, desc:'亚洲商界，你说了算' },
  { name:'全球富豪',      icon:'🏛️',  minMoney:50000000000, desc:'华尔街和伦敦金融城都在关注你的动向' },
  { name:'商业教父',      icon:'💎',  minMoney:200000000000,desc:'一代人的商业偶像' },
  { name:'千亿帝国',      icon:'🌟',  minMoney:1000000000000,desc:'你的商业帝国横跨五大洲' },
  { name:'万亿财阀',      icon:'🔥',  minMoney:10000000000000,desc:'富可敌国' },
  { name:'永恒商神',      icon:'⭐',  minMoney:100000000000000,desc:'你的名字已经写进了商业史' },
];

// ---- 出身 ----
const ORIGINS = [
  {
    id:'elite', name:'大厂精英', icon:'💻',
    money:1000000, reputation:30, stress:20, connections:15,
    stats:{ management:4, tech:2, social:3, finance:2 },
    bonus:{ techIncome:1.1 },
    special:'科技类业务收益+10%，前同事赵磊会作为早期NPC出现',
    desc:'你是新海市头部互联网公司的高级产品经理。经历996压榨后，拿着100万离职创业。',
    defaultName:'林远',
  },
  {
    id:'sales', name:'销售奇才', icon:'🤝',
    money:500000, reputation:40, stress:15, connections:30,
    stats:{ management:3, tech:1, social:5, finance:2 },
    bonus:{ retailIncome:1.25, hireSpeed:1.2 },
    special:'零售类业务收益+25%，员工招聘速度+20%',
    desc:'你是某知名快消品公司的王牌销售，手握大量客户资源。与老板分红分歧后，带着客户名单自立门户。',
    defaultName:'陈明',
  },
  {
    id:'tech', name:'技术极客', icon:'🔬',
    money:400000, reputation:20, stress:25, connections:8,
    stats:{ management:2, tech:5, social:1, finance:2 },
    bonus:{ techRdSpeed:1.3, burnoutProb:0.9 },
    special:'科技类研发速度+30%，员工Burnout概率-10%',
    desc:'你是新海市AI研究院的研究员，手握多项专利。看到研究成果被商业化剥削后，决定自己创业。',
    defaultName:'苏翼',
  },
  {
    id:'rich2nd', name:'富二代', icon:'💎',
    money:2000000, reputation:10, stress:35, connections:40,
    stats:{ management:2, tech:1, social:4, finance:3 },
    bonus:{ unlockCost:0.8, repGain:0.7 },
    special:'所有业务解锁价格-20%，但声誉获取速度-30%',
    desc:'你出身新海市商业世家，父亲是海天集团创始人陈志远的老朋友。带着200万启动资金，证明自己不靠家族。',
    defaultName:'陈思远',
  },
];

// ---- 业务定义 ----
const BUSINESS_DEFS = [
  {
    id:'retail', name:'便利连锁', icon:'🏪', regions:['yongning'],
    unlockMoney:0, unlockAct:0,
    desc:'永宁区的老牌生意，现金流虽薄但稳定，是你事业的起点。街角的灯光永远为夜归人亮着。',
    levels:[
      { level:1, name:'街角小店', income:0.04, cost:0 },
      { level:2, name:'社区便利店', income:0.09, cost:80 },
      { level:3, name:'连锁便利(3家)', income:0.18, cost:280 },
      { level:4, name:'区域品牌(10家)', income:0.35, cost:1200 },
      { level:5, name:'城市配送网络', income:0.60, cost:3000 },
      { level:6, name:'区域配送中心', income:0.80, cost:6000, reqCond:{ techLv:2 } },
      { level:7, name:'智能仓储物流', income:1.00, cost:12000, reqCond:{ techLv:3 } },
      { level:8, name:'全渠道零售', income:1.25, cost:25000, reqCond:{ techLv:3, npcFavor:{ zhaolei:40 } } },
      { level:9, name:'新零售生态', income:1.50, cost:50000, reqCond:{ techLv:4 } },
      { level:10, name:'零售帝国', income:1.80, cost:100000, reqCond:{ techLv:5, rep:70 } },
    ]
  },
  {
    id:'tech', name:'科技工作室', icon:'💻', regions:['xinghai'],
    unlockMoney:2000000, unlockAct:1,
    desc:'星海区的科技创业热土，凌晨三点的写字楼里代码还在编译。高回报伴随高风险。',
    levels:[
      { level:1, name:'独立开发者', income:0.15, cost:0 },
      { level:2, name:'小型工作室(5人)', income:0.25, cost:200 },
      { level:3, name:'产品化运营', income:0.45, cost:600 },
      { level:4, name:'明星产品', income:0.75, cost:2500 },
      { level:5, name:'行业标杆', income:1.2, cost:6000 },
      { level:6, name:'SaaS平台', income:1.6, cost:12000, reqCond:{ techLv:2 } },
      { level:7, name:'AI产品矩阵', income:2.0, cost:25000, reqCond:{ techLv:3 } },
      { level:8, name:'技术生态圈', income:2.5, cost:50000, reqCond:{ techLv:4, npcFavor:{ zhaolei:40 } } },
      { level:9, name:'行业基础设施', income:3.0, cost:100000, reqCond:{ techLv:4 } },
      { level:10, name:'科技帝国', income:3.5, cost:200000, reqCond:{ techLv:5, rep:75 } },
    ]
  },
  {
    id:'office', name:'写字楼租赁', icon:'🏢', regions:['jinwan'],
    unlockMoney:5000000, unlockAct:2,
    desc:'金湾区的钢筋森林，每一层楼都是一个商业故事。被动收入，细水长流。',
    levels:[
      { level:1, name:'单层办公室', income:0.30, cost:0 },
      { level:2, name:'整层租赁', income:0.50, cost:550 },
      { level:3, name:'独立写字楼', income:0.90, cost:1700 },
      { level:4, name:'商务园区', income:1.8, cost:7000 },
      { level:5, name:'城市地标', income:3.2, cost:18000 },
      { level:6, name:'综合商务体', income:4.2, cost:35000, reqCond:{ techLv:2, money:100000000 } },
      { level:7, name:'甲级写字楼群', income:5.5, cost:70000, reqCond:{ techLv:3 } },
      { level:8, name:'城市综合体', income:7.0, cost:140000, reqCond:{ techLv:3, npcFavor:{ chenzong:40 } } },
      { level:9, name:'商业地产帝国', income:8.5, cost:280000, reqCond:{ techLv:4 } },
      { level:10, name:'地标之城', income:10.0, cost:550000, reqCond:{ techLv:5, rep:80 } },
    ]
  },
  {
    id:'fund', name:'量化基金', icon:'📈', regions:['jinwan'],
    unlockMoney:15000000, unlockAct:2,
    desc:'金湾区的金融丛林，数字在屏幕上跳动间就是亿万的博弈。高风险，高智商，更高回报。',
    levels:[
      { level:1, name:'小额试水', income:0.50, cost:0 },
      { level:2, name:'私募基金', income:1.2, cost:2000 },
      { level:3, name:'量化交易系统', income:2.5, cost:5500 },
      { level:4, name:'对冲基金', income:5.0, cost:22000 },
      { level:5, name:'金融帝国', income:10.0, cost:55000 },
      { level:6, name:'量化2.0', income:13.0, cost:110000, reqCond:{ techLv:3 } },
      { level:7, name:'全球配置', income:16.5, cost:220000, reqCond:{ techLv:3, npcFavor:{ chenzong:50 } } },
      { level:8, name:'跨境金融', income:20.0, cost:450000, reqCond:{ techLv:4 } },
      { level:9, name:'衍生品帝国', income:24.0, cost:900000, reqCond:{ techLv:4, rep:75 } },
      { level:10, name:'金融王朝', income:28.0, cost:1800000, reqCond:{ techLv:5, rep:85 } },
    ]
  },
  {
    id:'media', name:'媒体矩阵', icon:'📺', regions:['jinxiu'],
    unlockMoney:50000000, unlockAct:3,
    desc:'锦绣区的舆论战场，一条爆款可以改变一家公司的命运。流量就是新时代的石油。',
    levels:[
      { level:1, name:'自媒体账号', income:1.0, cost:0 },
      { level:2, name:'MCN机构', income:2.5, cost:5500 },
      { level:3, name:'垂直媒体', income:5.5, cost:14000 },
      { level:4, name:'全媒体矩阵', income:12.0, cost:50000 },
      { level:5, name:'媒体帝国', income:22.0, cost:120000 },
      { level:6, name:'直播电商', income:29.0, cost:250000, reqCond:{ techLv:2, npcFavor:{ zhangye:40 } } },
      { level:7, name:'短视频生态', income:36.0, cost:500000, reqCond:{ techLv:3 } },
      { level:8, name:'内容AI工厂', income:44.0, cost:1000000, reqCond:{ techLv:4 } },
      { level:9, name:'文化输出平台', income:52.0, cost:2000000, reqCond:{ techLv:4, rep:70 } },
      { level:10, name:'传媒王朝', income:60.0, cost:4000000, reqCond:{ techLv:5, rep:80 } },
    ]
  },
  {
    id:'food_chain', name:'餐饮连锁', icon:'🍽️', regions:['yongning','jinxiu'],
    unlockMoney:800000, unlockAct:0,
    desc:'从街头小吃到连锁品牌，每一道菜都承载着城市的烟火气。永宁区的老味道，锦绣区的新风尚。',
    levels:[
      { level:1, name:'街头小吃摊', income:0.12, cost:0 },
      { level:2, name:'社区餐厅', income:0.20, cost:140 },
      { level:3, name:'连锁品牌(5家)', income:0.38, cost:550 },
      { level:4, name:'区域餐饮集团', income:0.75, cost:2500 },
      { level:5, name:'城市美食地标', income:1.6, cost:7000 },
      { level:6, name:'中央厨房', income:2.2, cost:15000, reqCond:{ techLv:2 } },
      { level:7, name:'预制菜品牌', income:2.8, cost:30000, reqCond:{ techLv:3 } },
      { level:8, name:'餐饮数字化', income:3.5, cost:60000, reqCond:{ techLv:3, npcFavor:{ zhaolei:40 } } },
      { level:9, name:'美食生态链', income:4.2, cost:120000, reqCond:{ techLv:4 } },
      { level:10, name:'食神帝国', income:5.0, cost:250000, reqCond:{ techLv:5, rep:65 } },
    ]
  },
  {
    id:'new_energy', name:'新能源开发', icon:'⚡', regions:['tiexi','xinghai'],
    unlockMoney:12000000, unlockAct:3,
    desc:'铁西区的烟囱与星海区的光伏板，新旧能源的交汇。政府补贴是这个行业最好的催化剂。',
    levels:[
      { level:1, name:'小型光伏电站', income:0.08, cost:0 },
      { level:2, name:'风电项目', income:0.22, cost:400 },
      { level:3, name:'储能电站', income:0.60, cost:1400 },
      { level:4, name:'区域能源网络', income:1.5, cost:6000 },
      { level:5, name:'绿色能源巨头', income:4.0, cost:18000 },
      { level:6, name:'氢能实验站', income:5.2, cost:38000, reqCond:{ techLv:2 } },
      { level:7, name:'碳交易平台', income:6.5, cost:75000, reqCond:{ techLv:3, rep:50 } },
      { level:8, name:'虚拟电厂', income:8.0, cost:150000, reqCond:{ techLv:4 } },
      { level:9, name:'绿色电网', income:9.5, cost:300000, reqCond:{ techLv:4, npcFavor:{ lichu:40 } } },
      { level:10, name:'能源新纪元', income:11.0, cost:600000, reqCond:{ techLv:5, rep:75 } },
    ]
  },
];


// ---- 员工角色 ----
const EMP_ROLES = [
  { id:'intern',       name:'实习生',   baseSalary:0.03, icon:'🎓', effect:'实习期后可转正为正式员工',                       req:null, incomeBonus:0.003, internConvertTo:['developer','sales','analyst','designer','marketer','hr','finance_emp'] },
  { id:'developer',    name:'开发者',   baseSalary:0.25, icon:'💻', effect:'科技+15%',                                   req:{ business:'tech' }, incomeBonus:0.005 },
  { id:'designer',     name:'设计师',   baseSalary:0.10, icon:'🎨', effect:'媒体/零售+10%',                                req:null, incomeBonus:0.005 },
  { id:'sales',        name:'销售',     baseSalary:0.19, icon:'🤝', effect:'零售/合作+20%，人脉+2/月',                     req:null, incomeBonus:0.005 },
  { id:'analyst',      name:'分析师',   baseSalary:0.12, icon:'📊', effect:'负面事件-3%/人',                                 req:null, incomeBonus:0.005 },
  { id:'manager',      name:'管理者',   baseSalary:0.25, icon:'📋', effect:'分配业务+30%，忠诚衰减-50%',                   req:{ empCount:5 }, incomeBonus:0.008 },
  { id:'lawyer',       name:'律师',     baseSalary:0.17, icon:'⚖️', effect:'监管伤害-50%',                                 req:{ money:5000000 }, incomeBonus:0.005 },
  { id:'hr',           name:'HR',       baseSalary:0.10, icon:'👥', effect:'忠诚衰减-50%，招聘成本-20%',                    req:null, incomeBonus:0.005 },
  { id:'finance_emp',  name:'财务',     baseSalary:0.13, icon:'💰', effect:'税务优化+5%，资金周转+10%',                      req:null, incomeBonus:0.005 },
  { id:'marketer',     name:'市场',     baseSalary:0.09, icon:'📣', effect:'声誉+15%，产品发布+20%',                        req:null, incomeBonus:0.005 },
  { id:'cto',          name:'CTO',      baseSalary:0.50, icon:'♟', effect:'全局科技+20%',                               req:{ techLv:5, empCount:8 }, incomeBonus:0.02 },
];

// ---- 实际工资计算（与资产、产业挂钩） ----
function calcActualSalary(baseSalary, G) {
  if (!baseSalary) return 0;
  if (!G || !G.businesses) return baseSalary;
  const totalAssets = G.money || 0;
  const businessCount = (() => {
    if (!G || !G.cities) return 0;
    let cnt = 0;
    Object.values(G.cities).forEach(city => {
      if (!city.unlocked || !city.businesses) return;
      Object.values(city.businesses).forEach(biz => { if (biz.level > 0) cnt++; });
    });
    return cnt;
  })();
  // 资产系数：资产超1000万开始生效，对数增长，上限0.5
  let assetFactor = 0;
  if (totalAssets > 10000000) {
    assetFactor = Math.log10(totalAssets / 10000000) * 0.1;
    assetFactor = Math.min(assetFactor, 0.5);
  }
  // 产业系数：每个产业+5%，上限0.5
  let bizFactor = Math.min(businessCount * 0.05, 0.5);
  const scale = 1.0 + assetFactor + bizFactor;
  return +(baseSalary * scale).toFixed(1);
}

// ---- 技能树 ----
const SKILL_TREES = {
  management: [
    { id:'lean_mgmt',     name:'精益管理',   desc:'所有业务运营成本-10%',                      tier:1, cost:1, cond:{ type:'biz_upgrade', count:1 },   effect:{ opCost:0.90 } },
    { id:'target_mgmt',   name:'目标管理',   desc:'所有业务收益+10%',                        tier:1, cost:1, cond:{ type:'biz_count', count:2 },      effect:{ incomeMult:1.10 } },
    { id:'crisis_mgmt',   name:'危机管理',   desc:'负面事件影响-25%',                      tier:2, cost:2, cond:{ type:'negative_events', count:3 }, effect:{ negativeImpact:0.75 } },
    { id:'matrix_mgmt',   name:'矩阵管理',   desc:'员工上限+5',                            tier:2, cost:2, cond:{ type:'emp_count', count:8 },       effect:{ empMaxBonus:5 } },
    { id:'change_mgmt',   name:'变革管理',   desc:'升级后额外+20%收益，但压力+1/次',        tier:3, cost:3, cond:{ type:'biz_lv', level:6 },         effect:{ upgradeBonus:1.20, stressPerUpgrade:1 } },
  ],
  tech: [
    { id:'data_driven',   name:'数据驱动',   desc:'事件预判概率+15%',                     tier:1, cost:1, cond:{ type:'has_role', role:'analyst' },      effect:{ eventPredict:1.15 } },
    { id:'tech_barrier',  name:'技术壁垒',   desc:'竞争对手模仿概率-30%',                 tier:1, cost:1, cond:{ type:'biz_lv', level:3, bizType:'tech' }, effect:{ competitorImitation:0.7 } },
    { id:'automation',    name:'自动化',     desc:'管理效率+20%',                        tier:2, cost:2, cond:{ type:'has_role', role:'developer', count:2 }, effect:{ mgmtEfficiency:1.20 } },
    { id:'ai_empower',    name:'AI赋能',     desc:'LLM叙事质量大幅提升，成就奖励额外+50%',   tier:2, cost:2, cond:{ type:'biz_lv', level:7, bizType:'tech' }, effect:{ llmQuality:1.3, achRewardMul:1.5 } },
    // 互斥分支 A vs B
    { id:'open_source',   name:'开源生态',   desc:'[A路线] 科技收益+15%，但护城河降低',     tier:3, cost:3, exclusive:'tech', cond:{ type:'biz_lv', level:8, bizType:'tech' }, effect:{ incomeMult:1.15, competitorImitation:1.15 } },
    { id:'patent_wall',   name:'专利壁垒',   desc:'[B路线] 竞争对手模仿-40%，但研发速度-10%', tier:3, cost:3, exclusive:'tech', cond:{ type:'biz_lv', level:8, bizType:'tech' }, effect:{ competitorImitation:0.6, rdBonus:0.9 } },
  ],
  social: [
    { id:'biz_negotiate', name:'商务谈判',   desc:'合作收益+25%',                        tier:1, cost:1, cond:{ type:'decision_success', count:1 },  effect:{ coopBonus:1.25 } },
    { id:'network',       name:'人脉网络',   desc:'人脉获取速度+25%',                    tier:1, cost:1, cond:{ type:'connections', value:40 },        effect:{ connGain:1.25 } },
    { id:'crisis_pr',     name:'危机公关',   desc:'负面舆论影响-40%',                    tier:2, cost:2, cond:{ type:'event_type', eventType:'media_crisis' }, effect:{ rumorImpact:0.6 } },
    { id:'capital_op',    name:'资本运作',   desc:'融资金额+25%',                      tier:2, cost:2, cond:{ type:'funding', count:1 },          effect:{ fundingMult:1.25 } },
    { id:'shadow_play',   name:'幕后操盘',   desc:'全局收入+15%',                        tier:3, cost:3, cond:{ type:'npc_favor', count:5, level:'亲密' }, effect:{ incomeMult:1.15 } },
  ],
  finance: [
    { id:'cost_ctrl',     name:'成本控制',   desc:'无效支出-15%',                        tier:1, cost:1, cond:{ type:'fire_emp', count:1 },          effect:{ wasteCost:0.85 } },
    { id:'cash_flow',     name:'现金流管理', desc:'每50tick获得现金流奖励（当前收入×3）',   tier:1, cost:1, cond:{ type:'money_never_below', duration:80 }, effect:{ cashFlowBonus:true } },
    { id:'hedge',         name:'风险对冲',   desc:'负面事件损失-30%',                    tier:2, cost:2, cond:{ type:'insurance' },                effect:{ lossReduce:0.7 } },
    // 互斥分支 C vs D
    { id:'leverage',      name:'杠杆运营',   desc:'[C路线] 收入+20%，但贷款成本+15%',      tier:2, cost:2, exclusive:'finance', cond:{ type:'funding', count:1 }, effect:{ incomeMult:1.20, loanCost:1.15 } },
    { id:'conservative',  name:'保守经营',   desc:'[D路线] 运营成本-15%，但扩张速度-10%',   tier:2, cost:2, exclusive:'finance', cond:{ type:'loans_repaid', count:2 }, effect:{ opCost:0.85, expandSpeed:0.9 } },
    { id:'capital_shark', name:'资本大鳄',   desc:'解锁IPO事件线，融资能力+30%',            tier:3, cost:3, cond:{ type:'money', value:500000000 },  effect:{ ipo:true, fundingMult:1.30 } },
  ],
};

// 技能互斥组（同 exclusive 的只能选一个）
const SKILL_EXCLUSIVE = {
  tech: ['open_source', 'patent_wall'],
  finance: ['leverage', 'conservative'],
};

// ---- 结局文本（已禁用 — 这是一个长期放置游戏，没有结局） ----
const ENDINGS_DISABLED = true;
const ENDINGS = {
  '商业帝国': { title:'商业帝国', desc:'你的商业版图横跨七大区域，成为了新海市最传奇的企业家。', icon:'👑' },
  '隐退江湖': { title:'隐退江湖', desc:'你选择了功成身退，在新海的夕阳下开启了新的生活。', icon:'🌅' },
  '弄巧成拙': { title:'弄巧成拙', desc:'过度扩张和错误决策让你一败涂地，但东山再起的机会永远都在。', icon:'⚡' },
  '回归平凡': { title:'回归平凡', desc:'你决定放下一切，回到最初的地方，过简单而平静的生活。', icon:'🏠' },
  '破产清算': { title:'破产清算', desc:'资金链断裂，债权人蜂拥而至。你的商业帝国轰然倒塌。但商海浮沉，谁知道明天会不会东山再起？', icon:'💸' },
  '商界传奇': { title:'商界传奇', desc:'你的资产突破100亿大关，业务遍及全国十城，五大产业齐头并进。你的名字已成为这个时代商业的符号。', icon:'🏆' },
  '全球霸主': { title:'全球霸主', desc:'五大国际都市尽在你掌握之中，排行榜上你傲视群雄。从新海到纽约，你的商业帝国跨越了国界和文化的藩篱。', icon:'🌏' },
  '急流勇退': { title:'急流勇退', desc:'在事业的巅峰时刻，你选择了优雅地转身。不恋栈、不贪心，留下了一段商界传奇和无数后辈的敬仰。', icon:'🕊️' },
  '东山再起': { title:'东山再起', desc:'从破产的泥潭中爬起，你用自己的行动证明了真正的企业家不会被失败定义。浴火重生，比以前更强大。', icon:'🔥' },
};

// ---- 成就 ----
const ACHIEVEMENTS = [
  // ---- 资产里程碑（更密集） ----
  { id:'money_1w',    name:'小有积蓄',   desc:'资产达到1万',         icon:'💰', cond:{ type:'money',           value:10000 } },
  { id:'money_10w',   name:'十万小老板', desc:'资产达到10万',        icon:'💵', cond:{ type:'money',           value:100000 } },
  { id:'first_income',  name:'第一桶金',   desc:'通过经营获得首笔收益',  icon:'🪙', cond:{ type:'total_income_earned', value:10000 } },
  { id:'money_1m',      name:'百万小老板', desc:'资产达到100万',        icon:'💎', cond:{ type:'money',           value:1000000 } },
  { id:'money_3m',      name:'三百万资产', desc:'资产达到300万',        icon:'🏅', cond:{ type:'money',           value:3000000 } },
  { id:'money_10m',     name:'千万富翁',   desc:'资产达到1000万',      icon:'🌟', cond:{ type:'money',           value:10000000 } },
  { id:'money_50m',     name:'五千万资产', desc:'资产达到5000万',      icon:'💎', cond:{ type:'money',           value:50000000 } },
  { id:'money_100m',    name:'亿万富翁',   desc:'资产达到1亿',         icon:'🔥', cond:{ type:'money',           value:100000000 } },
  { id:'money_300m',    name:'亿万大佬',   desc:'资产达到3亿',         icon:'👑', cond:{ type:'money',           value:300000000 } },
  { id:'money_1b',      name:'商业大佬',   desc:'资产达到10亿',         icon:'🏆', cond:{ type:'money',           value:1000000000 } },
  { id:'money_10b',     name:'商界传奇',   desc:'资产达到100亿',        icon:'🏆', cond:{ type:'money',           value:10000000000 } },

  // ---- 员工/团队 ----
  { id:'first_employee', name:'创业伙伴',   desc:'招聘第一名员工',       icon:'👥', cond:{ type:'emp_count',       count:1 } },
  { id:'emp_3',         name:'小团队',     desc:'员工数达到3人',        icon:'👨👩👦', cond:{ type:'emp_count',       count:3 } },
  { id:'emp_5',         name:'五人组',             desc:'员工数达到5人',        icon:'🏢', cond:{ type:'emp_count',       count:5 } },
  { id:'emp_10',        name:'管理大师',   desc:'员工数达到10人',       icon:'🏭', cond:{ type:'emp_count',       count:10 } },
  { id:'emp_15',        name:'中型公司',   desc:'员工数达到15人',       icon:'🏗️', cond:{ type:'emp_count',       count:15 } },
  { id:'emp_20',         name:'商业帝国',   desc:'员工数达到20人',       icon:'🌐', cond:{ type:'emp_count',       count:20 } },

  // ---- 业务/区域 ----
  { id:'first_biz',      name:'初次创业',   desc:'解锁第一个业务',       icon:'🏪', cond:{ type:'biz_count',       count:1 } },
  { id:'biz_2',         name:'业务扩展',   desc:'解锁第二个业务',       icon:'🏢', cond:{ type:'biz_count',       count:2 } },
  { id:'biz_3',         name:'多元经营',   desc:'解锁3个业务',         icon:'🎯', cond:{ type:'biz_count',       count:3 } },
  { id:'biz_4',         name:'跨界大佬',   desc:'解锁4个业务',         icon:'🎪', cond:{ type:'biz_count',       count:4 } },
  { id:'biz_all',        name:'全能商人',   desc:'解锁全部7类业务',      icon:'🎯', cond:{ type:'biz_count',       count:7 } },
  { id:'region_2',       name:'走出永宁',   desc:'解锁第二个区域',       icon:'🗺️', cond:{ type:'region_count',    count:2 } },
  { id:'region_4',       name:'区域大亨',   desc:'解锁4个区域',         icon:'🏔️', cond:{ type:'region_count',    count:4 } },
  { id:'region_all',     name:'新海之王',   desc:'解锁所有7大区域',      icon:'👑', cond:{ type:'regions_all' } },

  // ---- 声誉 ----
  { id:'rep_20',         name:'小有名气',   desc:'声誉达到20',          icon:'⭐', cond:{ type:'reputation',      value:20 } },
  { id:'rep_50',        name:'商界新星',   desc:'声誉达到50',          icon:'⭐', cond:{ type:'reputation',      value:50 } },
  { id:'rep_70',         name:'知名商人',   desc:'声誉达到70',          icon:'🌠', cond:{ type:'reputation',      value:70 } },
  { id:'rep_80',        name:'行业领袖',   desc:'声誉达到80',          icon:'🌠', cond:{ type:'reputation',      value:80 } },
  { id:'rep_95',         name:'商界传说',   desc:'声誉达到95',          icon:'✨', cond:{ type:'reputation',      value:95 } },

  // ---- 技能 ----
  { id:'skill_1',       name:'技能入门',   desc:'解锁第一个技能',       icon:'📚', cond:{ type:'skill_count',      count:1 } },
  { id:'skill_5',       name:'技能进阶',   desc:'解锁5个技能',         icon:'📘', cond:{ type:'skill_count',      count:5 } },
  { id:'skill_10',      name:'技能大师',   desc:'解锁10个技能',        icon:'🎓', cond:{ type:'skill_count',      count:10 } },
  { id:'skill_15',      name:'宗师境界',   desc:'解锁15个技能',        icon:'🏅', cond:{ type:'skill_count',      count:15 } },

  // ---- 事件/决策 ----
  { id:'event_10',      name:'初见世面',   desc:'经历10个事件',        icon:'📜', cond:{ type:'event_count',     count:10 } },
  { id:'event_30',      name:'阅历丰富',   desc:'经历30个事件',        icon:'📖', cond:{ type:'event_count',     count:30 } },
  { id:'event_50',      name:'见证历史',   desc:'经历50个事件',        icon:'📜', cond:{ type:'event_count',     count:50 } },
  { id:'event_100',     name:'沧桑商人',   desc:'经历100个事件',       icon:'📚', cond:{ type:'event_count',     count:100 } },
  { id:'decision_5',    name:'初学决策',   desc:'完成5次决策',         icon:'⚡', cond:{ type:'decision_count',  count:5 } },
  { id:'decision_10',   name:'决策老手',   desc:'完成10次决策',        icon:'⚡', cond:{ type:'decision_count',  count:10 } },
  { id:'decision_30',   name:'决策高手',   desc:'完成30次决策',        icon:'🎯', cond:{ type:'decision_count',  count:30 } },

  // ---- NPC/人脉 ----
  { id:'npc_1',         name:'初识贵人',   desc:'任意NPC好感达到相识', icon:'💬', cond:{ type:'npc_favor',       value:20 } },
  { id:'npc_3',         name:'人脉初成',   desc:'3个NPC好感达到相识',  icon:'🤝', cond:{ type:'npc_favor_count', count:3, value:20 } },
  { id:'npc_max',       name:'人脉巅峰',   desc:'任意NPC好感达到亲密', icon:'💎', cond:{ type:'npc_favor_max' } },

  // ---- 压力/特殊 ----
  { id:'stress_0',      name:'佛系老板',   desc:'压力值保持0超过100tick',icon:'🧘', cond:{ type:'stress_low_long' } },
  { id:'stress_never_high', name:'从容不迫', desc:'压力从未超过60',    icon:'😌', cond:{ type:'stress_never_high' } },
  { id:'no_debt',       name:'现金为王',   desc:'资金从未低于运营成本×3', icon:'💵', cond:{ type:'money_never_low' } },
  { id:'speed_run',     name:'极速传说',   desc:'60分钟内达到100万',    icon:'⚡', cond:{ type:'speed_run',      value:1000000, time:3600 } },
  { id:'play_24h',   name:'商海老手',   desc:'游戏时间超过24小时',      icon:'🎬', cond:{ type:'play_time', hours:24 } },

  // ---- 新增成就 (10) ----
  { id:'region_dominator',name:'区域霸主',     desc:'在单个区域拥有3条以上业务',     icon:'🏰', cond:{ type:'biz_in_region', count:3 } },
  { id:'social_butterfly',name:'社交达人',     desc:'与3个以上NPC好感度达到50+',   icon:'🦋', cond:{ type:'npc_favor_high', count:3, value:50 } },
  { id:'crisis_survivor', name:'危机管理者',   desc:'成功度过5次负面事件',         icon:'🛡️', cond:{ type:'negative_events', count:5 } },
  { id:'comeback_king',   name:'逆风翻盘',     desc:'在经济萧条期资产仍实现增长',     icon:'🚀', cond:{ type:'grew_in_recession' } },
  { id:'top_team',        name:'顶级团队',     desc:'拥有5个以上非实习生员工',       icon:'👑', cond:{ type:'senior_emp_count', count:5 } },
  { id:'invest_master',   name:'投资大师',     desc:'量化基金业务达到5级',          icon:'📈', cond:{ type:'biz_level', bizId:'fund', level:5 } },
  { id:'real_estate_king',name:'地产大亨',     desc:'写字楼租赁业务达到5级',        icon:'🏢', cond:{ type:'biz_level', bizId:'office', level:5 } },
  { id:'tech_pioneer',    name:'科技先锋',     desc:'科技工作室业务达到5级',        icon:'💻', cond:{ type:'biz_level', bizId:'tech', level:5 } },
  { id:'stress_master',   name:'压力管理大师', desc:'压力值从未超过40',             icon:'🧘', cond:{ type:'stress_never_above', value:40 } },
  { id:'stock_trader',    name:'股市老手',   desc:'股票交易盈利超过50万',           icon:'📊', cond:{ type:'stock_profit', value:500000 } },
  { id:'debt_free',       name:'无债一身轻', desc:'从未申请过银行贷款',             icon:'🏦', cond:{ type:'never_loan' } },
  { id:'tech_leader',     name:'科技领袖',   desc:'完成全部3条研发路线',           icon:'🔬', cond:{ type:'all_tech_max' } },
];


// ========== 成就奖励映射（策略核心） ==========
// 每个成就解锁后提供永久加成。这些加成是游戏的核心成长来源。
const ACHIEVEMENT_REWARDS = {
  // 资产类 — 越富有越有杠杆
  first_income: { desc:'员工招聘成本-3%',  hireCost:0.97 },
  money_1w:     { desc:'所有业务收入+2%',  incomeMult:0.02 },
  money_10w:    { desc:'所有业务收入+3%',  incomeMult:0.03 },
  money_1m:     { desc:'运营成本-3%',       opCost:0.97 },
  money_3m:     { desc:'所有业务收入+4%',  incomeMult:0.04 },
  money_10m:    { desc:'员工效率+5%',       empEfficiency:0.05 },
  money_50m:    { desc:'研发速度+10%',      rdBonus:0.10 },
  money_100m:   { desc:'所有业务收入+5%',  incomeMult:0.05 },
  money_300m:   { desc:'运营成本-5%',       opCost:0.95 },
  money_1b:     { desc:'全局收入+8%',       incomeMult:0.08 },
  money_10b:    { desc:'全局收入+10%',      incomeMult:0.10 },
  
  // 员工类 — 团队就是力量
  first_employee:{ desc:'员工忠诚度衰减-20%', loyaltyDecay:0.8 },
  emp_3:        { desc:'员工上限+2',            empMaxBonus:2 },
  emp_5:        { desc:'员工效率+8%',            empEfficiency:0.08 },
  emp_10:       { desc:'员工效率+12%',           empEfficiency:0.12 },
  emp_15:       { desc:'员工忠诚度衰减-15%',     loyaltyDecay:0.85 },
  emp_20:       { desc:'全局收入+6%',            incomeMult:0.06 },
  
  // 业务类 — 多元化带来协同
  first_biz:    { desc:'解锁技能点+2',           statPoints:2 },
  biz_2:        { desc:'业务解锁成本-10%',        unlockCost:0.9 },
  biz_3:        { desc:'城内协同+5%',            citySynergy:0.05 },
  biz_4:        { desc:'跨城协同+3%',            crossCitySynergy:0.03 },
  biz_all:      { desc:'全局收入+8%',            incomeMult:0.08 },
  
  // 区域类
  region_2:     { desc:'区域解锁成本-10%',        regionCost:0.9 },
  region_4:     { desc:'全局收入+5%',            incomeMult:0.05 },
  region_all:   { desc:'全局收入+10%',           incomeMult:0.10 },
  
  // 声誉类
  rep_20:       { desc:'NPC初始好感+5',          npcInitFavor:5 },
  rep_50:       { desc:'负面事件概率-10%',        negativeEventProb:0.9 },
  rep_70:       { desc:'合作收益+10%',           coopBonus:0.10 },
  rep_80:       { desc:'贷款利息-2%',            loanInterest:0.02 },
  rep_95:       { desc:'全局收入+15%',           incomeMult:0.15 },
  
  // 技能类
  skill_1:      { desc:'解锁技能点+1',           statPoints:1 },
  skill_5:      { desc:'技能解锁消耗-1（最低1）',  skillCostReduce:1 },
  skill_10:     { desc:'解锁技能点+3',           statPoints:3 },
  skill_15:     { desc:'全局收入+12%',            incomeMult:0.12 },
  
  // 事件/决策类
  event_10:     { desc:'事件预判+5%',            eventPredict:0.05 },
  event_30:     { desc:'事件预判+8%',            eventPredict:0.08 },
  event_50:     { desc:'负面事件损失-10%',        negativeLoss:0.90 },
  event_100:    { desc:'决策收益+15%',           decisionBonus:0.15 },
  decision_5:   { desc:'决策分析+10%',           decisionAnalysis:0.10 },
  decision_10:  { desc:'决策分析+15%',           decisionAnalysis:0.15 },
  decision_30:  { desc:'决策收益+20%',           decisionBonus:0.20 },
  
  // NPC/人脉类
  npc_1:        { desc:'NPC送礼效果+20%',        giftEffect:0.20 },
  npc_3:        { desc:'NPC好感获取+15%',         favorGain:0.15 },
  npc_max:      { desc:'商务约谈成功+20%',        negotiateBonus:0.20 },
  
  // 特殊类
  stress_0:           { desc:'压力衰减速度+30%',     stressDecay:0.30 },
  stress_never_high:  { desc:'压力上限-10',           stressCap:10 },
  no_debt:            { desc:'运营成本-5%',           opCost:0.95 },
  speed_run:          { desc:'初始资金+50万',          startMoney:500000 },
  play_24h:        { desc:'全局收入+10%',          incomeMult:0.10 },
  
  // 新增成就
  region_dominator:   { desc:'区域加成翻倍',           regionBonusDouble:true },
  social_butterfly:   { desc:'NPC好感获取+10%',       favorGain:0.10 },
  crisis_survivor:    { desc:'危机事件损失-15%',      crisisLoss:0.85 },
  comeback_king:      { desc:'萧条期收入-5%惩罚取消', recessionImmune:true },
  top_team:           { desc:'员工效率+10%',          empEfficiency:0.10 },
  invest_master:      { desc:'基金业务收入+12%',      fundBonus:0.12 },
  real_estate_king:   { desc:'地产业务收入+10%',      officeBonus:0.10 },
  tech_pioneer:       { desc:'科技业务收入+10%',      techBonus:0.10 },
  stress_master:      { desc:'压力自然衰减+20%',      stressDecay:0.20 },
  stock_trader:       { desc:'股票收益+15%',          stockProfit:0.15 },
  debt_free:          { desc:'运营成本-3%',           opCost:0.97 },
  tech_leader:        { desc:'研发速度+15%',          rdBonus:0.15 },
};

// 计算所有已解锁成就的总奖励
function calcAchievementRewards() {
  const G = window.SGame ? window.SGame.G : null;
  if (!G || !G.unlockedAchievements) return {};
  const total = {};
  G.unlockedAchievements.forEach(aid => {
    const r = ACHIEVEMENT_REWARDS[aid];
    if (!r) return;
    for (const [k, v] of Object.entries(r)) {
      if (k === 'desc') continue;
      if (typeof v === 'boolean') total[k] = v;
      // 乘法类奖励（<1.0表示减免/衰减，累乘更合理）
      else if (k === 'opCost' || k === 'loyaltyDecay') total[k] = (total[k] || 1) * v;
      else if (typeof v === 'number') total[k] = (total[k] || 0) + v;
    }
  });
  return total;
}
// ========== 科技研发树 ==========
const TECH_TREE = {
  digital: {
    id:'digital', name:'数字化转型', icon:'🌐', desc:'推动业务流程数字化，全面提升各业务线收入',
    levels:[
      { level:1, name:'线上办公',  desc:'基础线上协作工具部署',     rptCost:10,  moneyCost:20000,  tickCost:8,  bonus:{ allRevenue:0.08 } },
      { level:2, name:'数据中台',  desc:'构建统一数据平台',          rptCost:20,  moneyCost:50000,  tickCost:12, bonus:{ allRevenue:0.08 } },
      { level:3, name:'智能运营',  desc:'AI辅助业务流程优化',       rptCost:40,  moneyCost:100000, tickCost:16, bonus:{ allRevenue:0.08 } },
      { level:4, name:'产业互联',  desc:'打通上下游数字化协同',     rptCost:70,  moneyCost:200000, tickCost:22, bonus:{ allRevenue:0.08 } },
      { level:5, name:'数字孪生',  desc:'全业务数字孪生系统',       rptCost:120, moneyCost:500000, tickCost:30, bonus:{ allRevenue:0.08 } },
    ]
  },
  ai: {
    id:'ai', name:'AI自动化', icon:'🤖', desc:'引入AI技术降低人力成本，解锁自动招聘',
    levels:[
      { level:1, name:'RPA流程',   desc:'基础流程自动化',           rptCost:15,  moneyCost:30000,  tickCost:10, bonus:{ salaryReduction:0.05 } },
      { level:2, name:'智能客服',  desc:'AI客服替代人工',           rptCost:25,  moneyCost:60000,  tickCost:15, bonus:{ salaryReduction:0.05 } },
      { level:3, name:'AI分析',    desc:'AI数据分析和决策支持',     rptCost:45,  moneyCost:120000, tickCost:18, bonus:{ salaryReduction:0.05, autoRecruit:true } },
      { level:4, name:'机器人员工',desc:'RPA数字员工全面部署',      rptCost:80,  moneyCost:250000, tickCost:25, bonus:{ salaryReduction:0.05 } },
      { level:5, name:'全AI运营',  desc:'核心业务流程全AI化',       rptCost:150, moneyCost:600000, tickCost:35, bonus:{ salaryReduction:0.05 } },
    ]
  },
  blockchain: {
    id:'blockchain', name:'区块链金融', icon:'⛓️', desc:'布局区块链技术，提升金融业务收益',
    levels:[
      { level:1, name:'链上支付',  desc:'区块链支付解决方案',       rptCost:12,  moneyCost:25000,  tickCost:8,  bonus:{ fundBonus:0.12 } },
      { level:2, name:'智能合约',  desc:'智能合约模板库',           rptCost:25,  moneyCost:55000,  tickCost:12, bonus:{ fundBonus:0.12 } },
      { level:3, name:'DeFi平台',  desc:'去中心化金融平台',         rptCost:50,  moneyCost:130000, tickCost:18, bonus:{ fundBonus:0.12 } },
      { level:4, name:'跨境结算',  desc:'区块链跨境清算系统',       rptCost:90,  moneyCost:280000, tickCost:25, bonus:{ fundBonus:0.12 } },
      { level:5, name:'数字银行',  desc:'链上数字银行',             rptCost:160, moneyCost:650000, tickCost:40, bonus:{ fundBonus:0.12 } },
    ]
  }
};

// 哪些业务类型每级产出研发点数
const TECH_RPT_RATES = { tech:1.5, media:1.0, fund:0.8, office:0.3, food_chain:0.3, new_energy:0.6 };

// ========== 股票市场 ==========
const STOCKS = {
  stk_tech:  { name:'星辰科技', sector:'科技', basePrice:25, volatility:0.15 },
  stk_bank:  { name:'新海银行', sector:'金融', basePrice:45, volatility:0.08 },
  stk_retail:{ name:'万客隆',   sector:'零售', basePrice:18, volatility:0.12 },
  stk_energy:{ name:'绿能控股', sector:'能源', basePrice:32, volatility:0.18 },
  stk_media: { name:'光线传媒', sector:'媒体', basePrice:22, volatility:0.14 },
  stk_estate:{ name:'金地集团', sector:'地产', basePrice:55, volatility:0.10 },
  stk_food:  { name:'味鲜达',   sector:'餐饮', basePrice:15, volatility:0.11 },
  stk_ai:    { name:'深脑科技', sector:'AI',   basePrice:60, volatility:0.22 },
};

// ========== 配置安全访问辅助函数 ==========
// 统一处理 typeof CONFIG !== 'undefined' 检查，避免 20+ 处重复模式
function cfg(key, defaultVal) {
  if (typeof defaultVal === 'undefined') defaultVal = null;
  return (typeof CONFIG !== 'undefined' && CONFIG && CONFIG[key] !== undefined) ? CONFIG[key] : defaultVal;
}

// ========== 里程碑数据（数据驱动） ==========
const MILESTONES = [
  // money, repMin, bizSumMin（所有城市业务等级总和）, act, ...
  { money: 1000000,      repMin: 15, bizSumMin: 3,  act: 1, name: '第一桶金',   eventId: 'milestone_1m',  desc: '资产破百万，人脉起步，初具业务雏形' },
  { money: 10000000,     repMin: 30, bizSumMin: 8,  act: 2, name: '小有成就',   eventId: 'milestone_10m', desc: '资产破千万，社交圈拓展，业务扩张中' },
  { money: 100000000,    repMin: 50, bizSumMin: 15, act: 3, name: '事业有成',   eventId: 'milestone_100m',desc: '资产破亿，名利双收，多城布局' },
  { money: 1000000000,   repMin: 65, bizSumMin: 25, act: 4, name: '商业帝国',   eventId: 'milestone_1b',  desc: '资产破十亿，声名鹊起，帝国初现' },
  { money: 10000000000,  repMin: 80, bizSumMin: 40, act: 5, name: '传奇人物',   eventId: 'milestone_10b', desc: '资产破百亿，行业领袖，传奇缔造' },
];

const GIFT_TYPES = {
  wine:   { name:'名酒',     cost:8000,  desc:'一瓶陈年佳酿' },
  book:   { name:'书籍',     cost:5000,  desc:'一套精装典藏书' },
  art:    { name:'艺术品',   cost:20000, desc:'一件限量艺术品' },
  tech:   { name:'科技产品', cost:15000, desc:'最新科技装备' },
  luxury: { name:'奢侈品',   cost:50000, desc:'一件顶级奢侈品' },
};
