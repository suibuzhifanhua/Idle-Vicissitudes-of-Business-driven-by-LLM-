// ===================================================
// config.js — 常量、出身、区域、业务、员工、技能、成就
// ===================================================

// ---- 游戏参数 ----
const CONFIG = {
  TICK_MS: 30000,          // 30秒/Tick
  LLM_BASE: '',  // Ollama 代理路径（留空走 /api/ollama 代理）
  LLM_MODEL: 'qwen3.5:4b',
  LLM_CHECK_TIMEOUT: 3000,    // LLM 检测超时(ms)
  LLM_GENERATE_TIMEOUT: 15000, // LLM 生成超时(ms)
  LLM_MAX_TOKENS: 1024,         // LLM 最大生成 token 数（需 >400，否则 qwen3.5 thinking 吃光）
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
  // ---- 商业并购（M&A）系统 ----
  MA_BASE_COST_MULT: 1.0,       // 并购基础成本倍数
  MA_FAVOR_DISCOUNT_MAX: 0.5,  // 好感满分时折扣（50% off）
  MA_LIQUID_BONUS_RATIO: 0.15,  // 并购后一次性现金奖励 = 成本 × 此比例
  MA_REVENUE_RATIO: 0.008,      // 并购后每Tick收入 = NPC价值 × 此比例
  MA_COOLDOWN_TICKS: 50,         // 同一NPC 并购冷却（tick）
  // ---- 周期/间隔参数 ----
  NPC_FAVOR_DECAY_INTERVAL: 3,   // NPC好感衰减检查间隔(tick)
  STOCK_UPDATE_INTERVAL: 5,      // 股价更新间隔(tick)
  RIVAL_UPDATE_INTERVAL: 12,     // 竞争对手更新间隔(tick)
  // ---- 概率参数 ----
  NPC_VISIT_BASE_PROB: 0.08,     // NPC随机来访基础概率/tick
  LLM_DYNAMIC_EVENT_PROB: 0.3,   // LLM动态事件基础概率/tick
};

// NPC 商业价值（用于并购系统）
const NPC_BUSINESS_VALUE = {
  zhaolei:     5000000,   // 赵磊：科技公司
  lichu:        2000000,   // 李处：政策资源
  zhangye:      4000000,   // 张野：媒体网络
  chenzong:    10000000,   // 陈总：海天集团
  xiaoc:        8000000,   // 小C：资本平台
  sujie:        1500000,   // 苏姐：人力资源
  jinhangzhang: 6000000,   // 金行长：信贷网络
  qianlaoban:   3000000,   // 钱老板：拍卖行
  sunmishu:     1800000,   // 孙秘书：区域政策
  wujiaolian:   1200000,   // 吴教练：管理培训
  linjiaoshou:  4500000,   // 林教授：研究中心
  majizhe:       2000000,   // 马记者：媒体资源
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
  sunny:    { name:'晴天',   desc:'阳光明媚，万物复苏',     incomeMod: 1.0,   eventMod: 'neutral'},
  cloudy:   { name:'多云',   desc:'云层低垂，空气沉闷',     incomeMod: 1.0,   eventMod: 'neutral'},
  rainy:    { name:'雨天',   desc:'细雨绵绵，出行不便',     incomeMod: 0.95,  eventMod: 'negative'},
  storm:    { name:'暴风雨', desc:'狂风骤雨，电闪雷鸣',     incomeMod: 0.85,  eventMod: 'crisis'},
  foggy:    { name:'雾天',   desc:'浓雾弥漫，视线模糊',     incomeMod: 0.9,   eventMod: 'neutral'},
  snow:     { name:'雪天',   desc:'大雪纷飞，银装素裹',     incomeMod: 0.88,  eventMod: 'neutral'},
  heatwave: { name:'高温',   desc:'烈日炎炎，酷暑难耐',     incomeMod: 0.92,  eventMod: 'negative'}};

// ---- 所有区域（跨城市） ----
const REGIONS = {
  // ========== 新海市（初始城市） ==========
  yongning: {
    id:'yongning', name:'永宁区', type:'老城区', cityId:'xinhai',
    unlocked:true, unlockCond:null,
    bonus:{ retail:1.05, cost:0.92, disasterProb:1.1},
    actUnlock:0, npcFrom:'小老板、厨师、社区大妈'},
  xinghai: {
    id:'xinghai', name:'星海区', type:'科技创新区', cityId:'xinhai',
    unlocked:false, unlockCond:{ money:15000000 },
    bonus:{ tech:1.15, burnoutProb:1.1, rdBonus:1.15},
    actUnlock:1, npcFrom:'程序员、产品经理、CTO、天使投资人'},
  jinwan: {
    id:'jinwan', name:'金湾区', type:'金融中心区', cityId:'xinhai',
    unlocked:false, unlockCond:{ money:25000000 },
    bonus:{ finance:1.08, negativeEventProb:1.12},
    actUnlock:2, npcFrom:'投行家、基金经理、证券分析师'},
  jinxiu: {
    id:'jinxiu', name:'锦绣区', type:'商业文化区', cityId:'xinhai',
    unlocked:false, unlockCond:{ money:25000000 },
    bonus:{ repGain:1.08, rumorSpread:1.2},
    actUnlock:2, npcFrom:'广告总监、KOL、媒体记者'},
  yunding: {
    id:'yunding', name:'云顶区', type:'高端住宅区', cityId:'xinhai',
    unlocked:false, unlockCond:{ reputation:80 },
    bonus:{ connGain:1.25, socialCost:1.1},
    actUnlock:3, npcFrom:'企业二代、私人银行家、高端名流'},
  tiexi: {
    id:'tiexi', name:'铁西区', type:'工业物流区', cityId:'xinhai',
    unlocked:false, unlockCond:{ money:50000000 },
    bonus:{ opsCost:0.9, policyEventProb:1.15},
    actUnlock:3, npcFrom:'工厂经理、物流总监、环保局官员'},
  guangming: {
    id:'guangming', name:'光明区', type:'政务中心区', cityId:'xinhai',
    unlocked:false, unlockCond:{ act:1 },
    bonus:{ policyInfo:true},
    actUnlock:0, npcFrom:'处长、科员、窗口办事员'},

  // ========== 京都市（500万解锁） ==========
  jd_cbd: {
    id:'jd_cbd', name:'中央商务区', type:'CBD', cityId:'jingdu',
    unlocked:false, unlockCond:{ money:50000000, cityId:'jingdu' },
    bonus:{ finance:1.07},
    actUnlock:1, npcFrom:'央企高管、部委官员'},
  jd_tech: {
    id:'jd_tech', name:'高新园区', type:'科技园', cityId:'jingdu',
    unlocked:false, unlockCond:{ reputation:40, cityId:'jingdu' },
    bonus:{ tech:1.1, rdBonus:1.1},
    actUnlock:2, npcFrom:'中科院研究员、AI科学家'},
  jd_culture: {
    id:'jd_culture', name:'文化街区', type:'文创区', cityId:'jingdu',
    unlocked:false, unlockCond:{ reputation:50, cityId:'jingdu' },
    bonus:{ repGain:1.08},
    actUnlock:2, npcFrom:'艺术家、策展人、文化官员'},
  jd_tongzhou: {
    id:'jd_tongzhou', name:'通州区', type:'副中心', cityId:'jingdu',
    unlocked:false, unlockCond:{ money:20000000, cityId:'jingdu' },
    bonus:{ opsCost:0.93},
    actUnlock:3, npcFrom:'规划局局长、建筑承包商'},

  // ========== 深港市（2000万解锁） ==========
  sg_ftz: {
    id:'sg_ftz', name:'前海自贸区', type:'自贸区', cityId:'shengang',
    unlocked:false, unlockCond:{ money:20000000, cityId:'shengang' },
    bonus:{ trade:1.08},
    actUnlock:1, npcFrom:'外贸经理、海关官员'},
  sg_finance: {
    id:'sg_finance', name:'福田金融港', type:'金融区', cityId:'shengang',
    unlocked:false, unlockCond:{ money:50000000, cityId:'shengang' },
    bonus:{ finance:1.1},
    actUnlock:2, npcFrom:'基金经理、证券分析师'},
  sg_shekou: {
    id:'sg_shekou', name:'蛇口港区', type:'物流区', cityId:'shengang',
    unlocked:false, unlockCond:{ money:15000000, cityId:'shengang' },
    bonus:{ logistics:1.08, opsCost:0.93},
    actUnlock:1, npcFrom:'物流总监、港口调度员'},
  sg_nanshan: {
    id:'sg_nanshan', name:'南山科技园', type:'科技园区', cityId:'shengang',
    unlocked:false, unlockCond:{ reputation:60, cityId:'shengang' },
    bonus:{ tech:1.12},
    actUnlock:3, npcFrom:'CTO、创投合伙人'},

  // ========== 蓉城市（5000万解锁） ==========
  rc_gaoxin: {
    id:'rc_gaoxin', name:'高新区', type:'科技新区', cityId:'rongcheng',
    unlocked:false, unlockCond:{ money:50000000, cityId:'rongcheng' },
    bonus:{ tech:1.08, rdBonus:1.05},
    actUnlock:2, npcFrom:'工程师、项目经理'},
  rc_chunxi: {
    id:'rc_chunxi', name:'春熙商圈', type:'商业区', cityId:'rongcheng',
    unlocked:false, unlockCond:{ money:30000000, cityId:'rongcheng' },
    bonus:{ retail:1.1},
    actUnlock:1, npcFrom:'品牌经理、加盟商'},
  rc_tianfu: {
    id:'rc_tianfu', name:'天府新区', type:'新区', cityId:'rongcheng',
    unlocked:false, unlockCond:{ money:100000000, cityId:'rongcheng' },
    bonus:{ opsCost:0.92},
    actUnlock:3, npcFrom:'规划局官员、地产开发商'},

  // ========== 杭江市（1亿解锁） ==========
  hj_binjiang: {
    id:'hj_binjiang', name:'滨江数字谷', type:'数字经济区', cityId:'hangjiang',
    unlocked:false, unlockCond:{ money:100000000, cityId:'hangjiang' },
    bonus:{ tech:1.2, rdBonus:1.15},
    actUnlock:2, npcFrom:'产品经理、AI工程师'},
  hj_xihu: {
    id:'hj_xihu', name:'西湖文创区', type:'文创区', cityId:'hangjiang',
    unlocked:false, unlockCond:{ reputation:70, cityId:'hangjiang' },
    bonus:{ repGain:1.2},
    actUnlock:3, npcFrom:'MCN创始人、网红KOL'},
  hj_xiaoshan: {
    id:'hj_xiaoshan', name:'萧山智造区', type:'制造区', cityId:'hangjiang',
    unlocked:false, unlockCond:{ money:80000000, cityId:'hangjiang' },
    bonus:{ manufacturing:1.08, opsCost:0.93},
    actUnlock:2, npcFrom:'工厂厂长、供应链经理'},

  // ========== 新加坡（5亿 + 第4幕） ==========
  xjp_marina: {
    id:'xjp_marina', name:'滨海湾金融中心', type:'金融区', cityId:'xinjiapo',
    unlocked:false, unlockCond:{ money:500000000, cityId:'xinjiapo' },
    bonus:{ finance:1.08},
    actUnlock:4, npcFrom:'私人银行家、基金经理'},
  xjp_jurong: {
    id:'xjp_jurong', name:'裕廊工业园', type:'工业区', cityId:'xinjiapo',
    unlocked:false, unlockCond:{ money:300000000, cityId:'xinjiapo' },
    bonus:{ opsCost:0.88},
    actUnlock:4, npcFrom:'供应链总监、物流经理'},
  xjp_orchard: {
    id:'xjp_orchard', name:'乌节路商圈', type:'商业区', cityId:'xinjiapo',
    unlocked:false, unlockCond:{ reputation:75, cityId:'xinjiapo' },
    bonus:{ retail:1.08},
    actUnlock:4, npcFrom:'奢侈品经理、零售商'},

  // ========== 东京（10亿 + 第4幕） ==========
  dj_marunouchi: {
    id:'dj_marunouchi', name:'丸之内金融街', type:'金融区', cityId:'dongjing',
    unlocked:false, unlockCond:{ money:1000000000, cityId:'dongjing' },
    bonus:{ finance:1.25},
    actUnlock:4, npcFrom:'投行家、财阀代表'},
  dj_shinjuku: {
    id:'dj_shinjuku', name:'新宿商业区', type:'商业区', cityId:'dongjing',
    unlocked:false, unlockCond:{ money:600000000, cityId:'dongjing' },
    bonus:{ retail:1.08},
    actUnlock:4, npcFrom:'商社经理、连锁店长'},
  dj_akihabara: {
    id:'dj_akihabara', name:'秋叶原科技区', type:'科技区', cityId:'dongjing',
    unlocked:false, unlockCond:{ reputation:80, cityId:'dongjing' },
    bonus:{ tech:1.3, rdBonus:1.2},
    actUnlock:4, npcFrom:'CTO、游戏公司CEO'},

  // ========== 纽约（20亿 + 第5幕） ==========
  ny_wallstreet: {
    id:'ny_wallstreet', name:'华尔街', type:'金融区', cityId:'niuyue',
    unlocked:false, unlockCond:{ money:2000000000, cityId:'niuyue' },
    bonus:{ finance:1.12},
    actUnlock:5, npcFrom:'投行CEO、对冲基金经理'},
  ny_brooklyn: {
    id:'ny_brooklyn', name:'布鲁克林创意区', type:'文创区', cityId:'niuyue',
    unlocked:false, unlockCond:{ reputation:80, cityId:'niuyue' },
    bonus:{ repGain:1.08},
    actUnlock:5, npcFrom:'品牌总监、创意人'},
  ny_silicon: {
    id:'ny_silicon', name:'硅巷科技区', type:'科技区', cityId:'niuyue',
    unlocked:false, unlockCond:{ money:1500000000, cityId:'niuyue' },
    bonus:{ tech:1.12},
    actUnlock:5, npcFrom:'VC合伙人、CTO'},

  // ========== 伦敦（30亿 + 第5幕） ==========
  ld_city: {
    id:'ld_city', name:'伦敦金融城', type:'金融区', cityId:'lundun',
    unlocked:false, unlockCond:{ money:3000000000, cityId:'lundun' },
    bonus:{ finance:1.25},
    actUnlock:5, npcFrom:'投行MD、私募大佬'},
  ld_canary: {
    id:'ld_canary', name:'金丝雀码头', type:'贸易区', cityId:'lundun',
    unlocked:false, unlockCond:{ money:2000000000, cityId:'lundun' },
    bonus:{ trade:1.1},
    actUnlock:5, npcFrom:'贸易商、物流总监'},
  ld_shoreditch: {
    id:'ld_shoreditch', name:'肖迪奇科技城', type:'科技区', cityId:'lundun',
    unlocked:false, unlockCond:{ reputation:85, cityId:'lundun' },
    bonus:{ tech:1.1},
    actUnlock:5, npcFrom:'科技创始人、VC'},

  // ========== 迪拜（50亿 + 第5幕） ==========
  db_difc: {
    id:'db_difc', name:'迪拜国际金融中心', type:'金融区', cityId:'dibai',
    unlocked:false, unlockCond:{ money:5000000000, cityId:'dibai' },
    bonus:{ finance:1.12},
    actUnlock:5, npcFrom:'石油资本代表、基金经理'},
  db_marina: {
    id:'db_marina', name:'迪拜码头贸易区', type:'贸易区', cityId:'dibai',
    unlocked:false, unlockCond:{ money:3000000000, cityId:'dibai' },
    bonus:{ trade:1.1},
    actUnlock:5, npcFrom:'国际贸易商、船运公司'},
  db_freezone: {
    id:'db_freezone', name:'杰贝阿里免税区', type:'免税区', cityId:'dibai',
    unlocked:false, unlockCond:{ money:4000000000, cityId:'dibai' },
    bonus:{ opsCost:0.8},
    actUnlock:5, npcFrom:'税务顾问、自贸区官员'},
};

// ---- 城市定义 ----
const CITIES = {
  xinhai: {
    id:'xinhai', name:'新海市', icon:'🏙️', isInternational:false,
    unlockMoney:0, minAct:0,
    cityBonus:{incomeMult:1.03 },
    regionIds:['yongning','xinghai','jinwan','jinxiu','yunding','tiexi','guangming'],
    sortOrder:0},
  jingdu: {
    id:'jingdu', name:'京都市', icon:'🏛️', isInternational:false,
    unlockMoney:150000000, minAct:1,
    cityBonus:{policyBonus:1.08 },
    regionIds:['jd_cbd','jd_tech','jd_culture','jd_tongzhou'],
    sortOrder:1},
  shengang: {
    id:'shengang', name:'深港市', icon:'🌉', isInternational:false,
    unlockMoney:500000000, minAct:2,
    cityBonus:{financeBonus:1.05 },
    regionIds:['sg_ftz','sg_finance','sg_shekou','sg_nanshan'],
    sortOrder:2},
  rongcheng: {
    id:'rongcheng', name:'蓉城市', icon:'🐼', isInternational:false,
    unlockMoney:1200000000, minAct:2,
    cityBonus:{opsCostReduction:0.95 },
    regionIds:['rc_gaoxin','rc_chunxi','rc_tianfu'],
    sortOrder:3},
  hangjiang: {
    id:'hangjiang', name:'杭江市', icon:'🏯', isInternational:false,
    unlockMoney:2500000000, minAct:3,
    cityBonus:{techBonus:1.05 },
    regionIds:['hj_binjiang','hj_xihu','hj_xiaoshan'],
    sortOrder:4},
  xinjiapo: {
    id:'xinjiapo', name:'新加坡', icon:'🇸🇬', isInternational:true,
    unlockMoney:3000000000, minAct:4,
    cityBonus:{financeBonus:1.08, opsCostReduction:0.97 },
    regionIds:['xjp_marina','xjp_jurong','xjp_orchard'],
    sortOrder:5},
  dongjing: {
    id:'dongjing', name:'东京', icon:'🇯🇵', isInternational:true,
    unlockMoney:6000000000, minAct:4,
    cityBonus:{techBonus:1.10 },
    regionIds:['dj_marunouchi','dj_shinjuku','dj_akihabara'],
    sortOrder:6},
  niuyue: {
    id:'niuyue', name:'纽约', icon:'🇺🇸', isInternational:true,
    unlockMoney:12000000000, minAct:5,
    cityBonus:{financeBonus:1.12 },
    regionIds:['ny_wallstreet','ny_brooklyn','ny_silicon'],
    sortOrder:7},
  lundun: {
    id:'lundun', name:'伦敦', icon:'🇬🇧', isInternational:true,
    unlockMoney:18000000000, minAct:5,
    cityBonus:{incomeMult:1.05 },
    regionIds:['ld_city','ld_canary','ld_shoreditch'],
    sortOrder:8},
  dibai: {
    id:'dibai', name:'迪拜', icon:'🇦🇪', isInternational:true,
    unlockMoney:30000000000, minAct:5,
    cityBonus:{opsCostReduction:0.85, tradeBonus:1.10 },
    regionIds:['db_difc','db_marina','db_freezone'],
    sortOrder:9},
};

// ---- 富豪等级体系（12级） ----
const RANK_TIERS = [
  { name:'个体户',        icon:'🛒',  minMoney:0},
  { name:'小老板',        icon:'🏪',  minMoney:2000000},
  { name:'区域龙头',      icon:'🏢',  minMoney:20000000},
  { name:'城市新贵',      icon:'🏗️',  minMoney:100000000},
  { name:'省级大亨',      icon:'🏆',  minMoney:500000000},
  { name:'全国百强',      icon:'🌏',  minMoney:2000000000},
  { name:'亚洲巨擘',      icon:'👑',  minMoney:10000000000},
  { name:'全球富豪',      icon:'🏛️',  minMoney:50000000000},
  { name:'商业教父',      icon:'💎',  minMoney:200000000000},
  { name:'千亿帝国',      icon:'🌟',  minMoney:1000000000000},
  { name:'万亿财阀',      icon:'🔥',  minMoney:10000000000000},
  { name:'永恒商神',      icon:'⭐',  minMoney:100000000000000},
];

;

;


// ---- 员工角色 ----
const EMP_ROLES = [
  { id:'intern',       name:'实习生',   baseSalary:0.10, icon:'🎓', effect:'实习期后可转正为正式员工',                       req:null, incomeBonus:0.005, internConvertTo:['developer','sales','analyst','designer','marketer','hr','finance_emp'], specialization:null },
  { id:'developer',    name:'开发者',   baseSalary:0.80, icon:'💻', effect:'科技+15%',                                   req:{ business:'tech' }, incomeBonus:0.008, specialization:[{ key:'product_innov', name:'产品创新', desc:'自研产品收入倍率', costBase:30000, incomeMultPerLv:0.06, maxLv:3 },{ key:'tech_optim', name:'技术优化', desc:'整体技术产出效率', costBase:25000, incomeMultPerLv:0.04, maxLv:3 }] },
  { id:'designer',     name:'设计师',   baseSalary:0.30, icon:'🎨', effect:'媒体/零售+10%',                                req:null, incomeBonus:0.005, specialization:[{ key:'brand_design', name:'品牌设计', desc:'零售/媒体收入倍率', costBase:20000, incomeMultPerLv:0.05, maxLv:3 },{ key:'ux_exp', name:'UX体验', desc:'科技产品口碑加成', costBase:18000, incomeMultPerLv:0.04, maxLv:3 }] },
  { id:'sales',        name:'销售',     baseSalary:0.60, icon:'🤝', effect:'零售/合作+20%，人脉+2/月',                     req:null, incomeBonus:0.008, specialization:[{ key:'key_account', name:'大客户开发', desc:'大客户合约收入倍率', costBase:35000, incomeMultPerLv:0.07, maxLv:3 },{ key:'channel_mgmt', name:'渠道管理', desc:'全渠道分销效率', costBase:25000, incomeMultPerLv:0.05, maxLv:3 }] },
  { id:'analyst',      name:'分析师',   baseSalary:0.40, icon:'📊', effect:'负面事件-3%/人',                                 req:null, incomeBonus:0.005, specialization:[{ key:'market_analysis', name:'市场分析', desc:'市场事件预警+收入预测', costBase:28000, incomeMultPerLv:0.05, maxLv:3 },{ key:'risk_assess', name:'风险评估', desc:'负面事件伤害减免', costBase:30000, incomeMultPerLv:0.04, maxLv:3 }] },
  { id:'manager',      name:'管理者',   baseSalary:0.80, icon:'📋', effect:'分配业务+30%，忠诚衰减-50%',                   req:{ empCount:5 }, incomeBonus:0.012, specialization:[{ key:'team_lead', name:'团队管理', desc:'团队产出效率提升', costBase:40000, incomeMultPerLv:0.06, maxLv:3 },{ key:'strategic_plan', name:'战略规划', desc:'全业务收入倍率', costBase:50000, incomeMultPerLv:0.05, maxLv:3 }] },
  { id:'lawyer',       name:'律师',     baseSalary:0.55, icon:'⚖️', effect:'监管伤害-50%',                                 req:{ money:5000000 }, incomeBonus:0.005, specialization:[{ key:'compliance', name:'合规法务', desc:'合规成本降低', costBase:35000, incomeMultPerLv:0.04, maxLv:3 },{ key:'litigation', name:'诉讼应对', desc:'诉讼胜率提升', costBase:40000, incomeMultPerLv:0.05, maxLv:3 }] },
  { id:'hr',           name:'HR',       baseSalary:0.35, icon:'👥', effect:'忠诚衰减-50%，招聘成本-20%',                    req:null, incomeBonus:0.005, specialization:[{ key:'talent_acq', name:'人才招募', desc:'招聘质量+培训效率', costBase:22000, incomeMultPerLv:0.04, maxLv:3 },{ key:'culture_build', name:'文化建设', desc:'员工忠诚+幸福度', costBase:20000, incomeMultPerLv:0.03, maxLv:3 }] },
  { id:'finance_emp',  name:'财务',     baseSalary:0.45, icon:'💰', effect:'税务优化+5%，资金周转+10%',                      req:null, incomeBonus:0.005, specialization:[{ key:'tax_plan', name:'税务筹划', desc:'税务减免额度提升', costBase:30000, incomeMultPerLv:0.05, maxLv:3 },{ key:'fund_mgmt', name:'资金管理', desc:'闲置资金收益率', costBase:28000, incomeMultPerLv:0.04, maxLv:3 }] },
  { id:'marketer',     name:'市场',     baseSalary:0.30, icon:'📣', effect:'声誉+15%，产品发布+20%',                        req:null, incomeBonus:0.005, specialization:[{ key:'brand_mkt', name:'品牌营销', desc:'声誉增长+品牌溢价', costBase:25000, incomeMultPerLv:0.05, maxLv:3 },{ key:'digital_mkt', name:'数字营销', desc:'线上渠道转化率', costBase:22000, incomeMultPerLv:0.04, maxLv:3 }] },
  { id:'cto',          name:'CTO',      baseSalary:1.50, icon:'♟', effect:'全局科技+20%',                               req:{ techLv:5, empCount:8 }, incomeBonus:0.025, specialization:[{ key:'tech_arch', name:'技术架构', desc:'研发效率+技术壁垒', costBase:60000, incomeMultPerLv:0.07, maxLv:3 },{ key:'innov_strategy', name:'创新战略', desc:'新产品/技术突破概率', costBase:70000, incomeMultPerLv:0.06, maxLv:3 }] },
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
  // 资产系数：资产超500万开始生效（原1000万），对数增长，上限1.5（原0.5）
  let assetFactor = 0;
  if (totalAssets > 5000000) {
    assetFactor = Math.log10(totalAssets / 5000000) * 0.3;
    assetFactor = Math.min(assetFactor, 1.5);
  }
  // 产业系数：每个产业+15%（原5%），上限1.5（原0.5）
  let bizFactor = Math.min(businessCount * 0.15, 1.5);
  // 人头税：员工数>8时，每多1人+5%总工资成本
  let headcountPenalty = 0;
  if (G.employees && G.employees.length > 8) {
    headcountPenalty = (G.employees.length - 8) * 0.05;
  }
  const scale = 1.0 + assetFactor + bizFactor + headcountPenalty;
  return +(baseSalary * scale).toFixed(1);
}

// ---- 技能树 ----
const SKILL_TREES = {
  management: [
    { id:'lean_mgmt',     name:'精益管理',                      tier:1, cost:1, cond:{ type:'biz_upgrade', count:1 },   effect:{ opCost:0.90 } },
    { id:'target_mgmt',   name:'目标管理',                        tier:1, cost:1, cond:{ type:'biz_count', count:2 },      effect:{ incomeMult:1.10 } },
    { id:'crisis_mgmt',   name:'危机管理',                      tier:2, cost:2, cond:{ type:'negative_events', count:3 }, effect:{ negativeImpact:0.75 } },
    { id:'matrix_mgmt',   name:'矩阵管理',                            tier:2, cost:2, cond:{ type:'emp_count', count:8 },       effect:{ empMaxBonus:5 } },
    { id:'change_mgmt',   name:'变革管理',        tier:3, cost:3, cond:{ type:'biz_lv', level:6 },         effect:{ upgradeBonus:1.20, stressPerUpgrade:1 } },
  ],
  tech: [
    { id:'data_driven',   name:'数据驱动',                     tier:1, cost:1, cond:{ type:'has_role', role:'analyst' },      effect:{ eventPredict:1.15 } },
    { id:'tech_barrier',  name:'技术壁垒',                 tier:1, cost:1, cond:{ type:'biz_lv', level:3, bizType:'tech' }, effect:{ competitorImitation:0.7 } },
    { id:'automation',    name:'自动化',                        tier:2, cost:2, cond:{ type:'has_role', role:'developer', count:2 }, effect:{ mgmtEfficiency:1.20 } },
    { id:'ai_empower',    name:'AI赋能',   tier:2, cost:2, cond:{ type:'biz_lv', level:7, bizType:'tech' }, effect:{ llmQuality:1.3, achRewardMul:1.5 } },
    // 互斥分支 A vs B
    { id:'open_source',   name:'开源生态',     tier:3, cost:3, exclusive:'tech', cond:{ type:'biz_lv', level:8, bizType:'tech' }, effect:{ incomeMult:1.15, competitorImitation:1.15 } },
    { id:'patent_wall',   name:'专利壁垒', tier:3, cost:3, exclusive:'tech', cond:{ type:'biz_lv', level:8, bizType:'tech' }, effect:{ competitorImitation:0.6, rdBonus:0.9 } },
  ],
  social: [
    { id:'biz_negotiate', name:'商务谈判',                        tier:1, cost:1, cond:{ type:'decision_success', count:1 },  effect:{ coopBonus:1.25 } },
    { id:'network',       name:'人脉网络',                    tier:1, cost:1, cond:{ type:'connections', value:40 },        effect:{ connGain:1.25 } },
    { id:'crisis_pr',     name:'危机公关',                    tier:2, cost:2, cond:{ type:'event_type', eventType:'media_crisis' }, effect:{ rumorImpact:0.6 } },
    { id:'capital_op',    name:'资本运作',                      tier:2, cost:2, cond:{ type:'funding', count:1 },          effect:{ fundingMult:1.25 } },
    { id:'shadow_play',   name:'幕后操盘',                        tier:3, cost:3, cond:{ type:'npc_favor', count:5, level:'亲密' }, effect:{ incomeMult:1.15 } },
  ],
  finance: [
    { id:'cost_ctrl',     name:'成本控制',                        tier:1, cost:1, cond:{ type:'fire_emp', count:1 },          effect:{ wasteCost:0.85 } },
    { id:'cash_flow',     name:'现金流管理',   tier:1, cost:1, cond:{ type:'money_never_below', duration:80 }, effect:{ cashFlowBonus:true } },
    { id:'hedge',         name:'风险对冲',                    tier:2, cost:2, cond:{ type:'insurance' },                effect:{ lossReduce:0.7 } },
    // 互斥分支 C vs D
    { id:'leverage',      name:'杠杆运营',      tier:2, cost:2, exclusive:'finance', cond:{ type:'funding', count:1 }, effect:{ incomeMult:1.20, loanCost:1.15 } },
    { id:'conservative',  name:'保守经营',   tier:2, cost:2, exclusive:'finance', cond:{ type:'loans_repaid', count:2 }, effect:{ opCost:0.85, expandSpeed:0.9 } },
    { id:'capital_shark', name:'资本大鳄',            tier:3, cost:3, cond:{ type:'money', value:500000000 },  effect:{ ipo:true, fundingMult:1.30 } },
  ]};

// 技能互斥组（同 exclusive 的只能选一个）
const SKILL_EXCLUSIVE = {
  tech: ['open_source', 'patent_wall'],
  finance: ['leverage', 'conservative']};

// ---- 结局文本（已禁用 — 这是一个长期放置游戏，没有结局） ----
const ENDINGS_DISABLED = true;
const ENDINGS = {
  '商业帝国': { title:'商业帝国', icon:'👑' },
  '隐退江湖': { title:'隐退江湖', icon:'🌅' },
  '弄巧成拙': { title:'弄巧成拙', icon:'⚡' },
  '回归平凡': { title:'回归平凡', icon:'🏠' },
  '破产清算': { title:'破产清算', icon:'💸' },
  '商界传奇': { title:'商界传奇', icon:'🏆' },
  '全球霸主': { title:'全球霸主', icon:'🌏' },
  '急流勇退': { title:'急流勇退', icon:'🕊️' },
  '东山再起': { title:'东山再起', icon:'🔥' }};

// ---- 成就 ----
const ACHIEVEMENTS = [
  // ---- 资产里程碑（更密集） ----
  { id:'money_1w',    name:'小有积蓄',         icon:'💰', cond:{ type:'money',           value:10000 } },
  { id:'money_10w',   name:'十万小老板',        icon:'💵', cond:{ type:'money',           value:100000 } },
  { id:'first_income',  name:'第一桶金',  icon:'🪙', cond:{ type:'total_income_earned', value:10000 } },
  { id:'money_1m',      name:'百万小老板',        icon:'💎', cond:{ type:'money',           value:1000000 } },
  { id:'money_3m',      name:'三百万资产',        icon:'🏅', cond:{ type:'money',           value:3000000 } },
  { id:'money_10m',     name:'千万富翁',      icon:'🌟', cond:{ type:'money',           value:10000000 } },
  { id:'money_50m',     name:'五千万资产',      icon:'💎', cond:{ type:'money',           value:50000000 } },
  { id:'money_100m',    name:'亿万富翁',         icon:'🔥', cond:{ type:'money',           value:100000000 } },
  { id:'money_300m',    name:'亿万大佬',         icon:'👑', cond:{ type:'money',           value:300000000 } },
  { id:'money_1b',      name:'商业大佬',         icon:'🏆', cond:{ type:'money',           value:1000000000 } },
  { id:'money_10b',     name:'商界传奇',        icon:'🏆', cond:{ type:'money',           value:10000000000 } },

  // ---- 员工/团队 ----
  { id:'first_employee', name:'创业伙伴',       icon:'👥', cond:{ type:'emp_count',       count:1 } },
  { id:'emp_3',         name:'小团队',        icon:'👨👩👦', cond:{ type:'emp_count',       count:3 } },
  { id:'emp_5',         name:'五人组',        icon:'🏢', cond:{ type:'emp_count',       count:5 } },
  { id:'emp_10',        name:'管理大师',       icon:'🏭', cond:{ type:'emp_count',       count:10 } },
  { id:'emp_15',        name:'中型公司',       icon:'🏗️', cond:{ type:'emp_count',       count:15 } },
  { id:'emp_20',         name:'商业帝国',       icon:'🌐', cond:{ type:'emp_count',       count:20 } },

  // ---- 业务/区域 ----
  { id:'first_biz',      name:'初次创业',       icon:'🏪', cond:{ type:'biz_count',       count:1 } },
  { id:'biz_2',         name:'业务扩展',       icon:'🏢', cond:{ type:'biz_count',       count:2 } },
  { id:'biz_3',         name:'多元经营',         icon:'🎯', cond:{ type:'biz_count',       count:3 } },
  { id:'biz_4',         name:'跨界大佬',         icon:'🎪', cond:{ type:'biz_count',       count:4 } },
  { id:'biz_all',        name:'全能商人',      icon:'🎯', cond:{ type:'biz_count',       count:7 } },
  { id:'region_2',       name:'走出永宁',       icon:'🗺️', cond:{ type:'region_count',    count:2 } },
  { id:'region_4',       name:'区域大亨',         icon:'🏔️', cond:{ type:'region_count',    count:4 } },
  { id:'region_all',     name:'新海之王',      icon:'👑', cond:{ type:'regions_all' } },

  // ---- 声誉 ----
  { id:'rep_20',         name:'小有名气',          icon:'⭐', cond:{ type:'reputation',      value:20 } },
  { id:'rep_50',        name:'商界新星',          icon:'⭐', cond:{ type:'reputation',      value:50 } },
  { id:'rep_70',         name:'知名商人',          icon:'🌠', cond:{ type:'reputation',      value:70 } },
  { id:'rep_80',        name:'行业领袖',          icon:'🌠', cond:{ type:'reputation',      value:80 } },
  { id:'rep_95',         name:'商界传说',          icon:'✨', cond:{ type:'reputation',      value:95 } },

  // ---- 技能 ----
  { id:'skill_1',       name:'技能入门',       icon:'📚', cond:{ type:'skill_count',      count:1 } },
  { id:'skill_5',       name:'技能进阶',         icon:'📘', cond:{ type:'skill_count',      count:5 } },
  { id:'skill_10',      name:'技能大师',        icon:'🎓', cond:{ type:'skill_count',      count:10 } },
  { id:'skill_15',      name:'宗师境界',        icon:'🏅', cond:{ type:'skill_count',      count:15 } },

  // ---- 事件/决策 ----
  { id:'event_10',      name:'初见世面',        icon:'📜', cond:{ type:'event_count',     count:10 } },
  { id:'event_30',      name:'阅历丰富',        icon:'📖', cond:{ type:'event_count',     count:30 } },
  { id:'event_50',      name:'见证历史',        icon:'📜', cond:{ type:'event_count',     count:50 } },
  { id:'event_100',     name:'沧桑商人',       icon:'📚', cond:{ type:'event_count',     count:100 } },
  { id:'decision_5',    name:'初学决策',         icon:'⚡', cond:{ type:'decision_count',  count:5 } },
  { id:'decision_10',   name:'决策老手',        icon:'⚡', cond:{ type:'decision_count',  count:10 } },
  { id:'decision_30',   name:'决策高手',        icon:'🎯', cond:{ type:'decision_count',  count:30 } },

  // ---- NPC/人脉 ----
  { id:'npc_1',         name:'初识贵人', icon:'💬', cond:{ type:'npc_favor',       value:20 } },
  { id:'npc_3',         name:'人脉初成',  icon:'🤝', cond:{ type:'npc_favor_count', count:3, value:20 } },
  { id:'npc_max',       name:'人脉巅峰', icon:'💎', cond:{ type:'npc_favor_max' } },

  // ---- 压力/特殊 ----
  { id:'stress_0',      name:'佛系老板',icon:'🧘', cond:{ type:'stress_low_long' } },
  { id:'stress_never_high', name:'从容不迫',    icon:'😌', cond:{ type:'stress_never_high' } },
  { id:'no_debt',       name:'现金为王', icon:'💵', cond:{ type:'money_never_low' } },
  { id:'speed_run',     name:'极速传说',    icon:'⚡', cond:{ type:'speed_run',      value:1000000, time:3600 } },
  { id:'play_24h',   name:'商海老手',      icon:'🎬', cond:{ type:'play_time', hours:24 } },

  // ---- 新增成就 (10) ----
  { id:'region_dominator',name:'区域霸主',     icon:'🏰', cond:{ type:'biz_in_region', count:3 } },
  { id:'social_butterfly',name:'社交达人',   icon:'🦋', cond:{ type:'npc_favor_high', count:3, value:50 } },
  { id:'crisis_survivor', name:'危机管理者',         icon:'🛡️', cond:{ type:'negative_events', count:5 } },
  { id:'comeback_king',   name:'逆风翻盘',     icon:'🚀', cond:{ type:'grew_in_recession' } },
  { id:'top_team',        name:'顶级团队',       icon:'👑', cond:{ type:'senior_emp_count', count:5 } },
  { id:'invest_master',   name:'投资大师',          icon:'📈', cond:{ type:'biz_level', bizId:'fund', level:5 } },
  { id:'real_estate_king',name:'地产大亨',        icon:'🏢', cond:{ type:'biz_level', bizId:'office', level:5 } },
  { id:'tech_pioneer',    name:'科技先锋',        icon:'💻', cond:{ type:'biz_level', bizId:'tech', level:5 } },
  { id:'stress_master',   name:'压力管理大师',             icon:'🧘', cond:{ type:'stress_never_above', value:40 } },
  { id:'stock_trader',    name:'股市老手',           icon:'📊', cond:{ type:'stock_profit', value:500000 } },
  { id:'debt_free',       name:'无债一身轻',             icon:'🏦', cond:{ type:'never_loan' } },
  { id:'tech_leader',     name:'科技领袖',           icon:'🔬', cond:{ type:'all_tech_max' } },
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
  tech_leader:        { desc:'研发速度+15%',          rdBonus:0.15 }};

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


;

// ========== 配置安全访问辅助函数 ==========
// 统一处理 typeof CONFIG !== 'undefined' 检查，避免 20+ 处重复模式
function cfg(key, defaultVal) {
  if (typeof defaultVal === 'undefined') defaultVal = null;
  return (typeof CONFIG !== 'undefined' && CONFIG && CONFIG[key] !== undefined) ? CONFIG[key] : defaultVal;
}

// ========== 里程碑数据（数据驱动） ==========
const MILESTONES = [
  // money, repMin, bizSumMin（所有城市业务等级总和）, act, ...
  { money: 1000000,      repMin: 15, bizSumMin: 3,  act: 1, name: '第一桶金',   eventId: 'milestone_1m'},
  { money: 10000000,     repMin: 30, bizSumMin: 8,  act: 2, name: '小有成就',   eventId: 'milestone_10m'},
  { money: 100000000,    repMin: 50, bizSumMin: 15, act: 3, name: '事业有成',   eventId: 'milestone_100m'},
  { money: 1000000000,   repMin: 65, bizSumMin: 25, act: 4, name: '商业帝国',   eventId: 'milestone_1b'},
  { money: 10000000000,  repMin: 80, bizSumMin: 40, act: 5, name: '传奇人物',   eventId: 'milestone_10b'},
];

const GIFT_TYPES = {
  wine:   { name:'名酒',     cost:8000},
  book:   { name:'书籍',     cost:5000},
  art:    { name:'艺术品',   cost:20000},
  tech:   { name:'科技产品', cost:15000},
  luxury: { name:'奢侈品',   cost:50000}};

// ========== 来自 data.js 拆分后剩余内容 ==========
;

// ---- 事件总览 ----
// 市场12 + 员工10 + 政策8 + 运营8 + 个人6 + NPC10 + 里程碑5 + 竞争对手事件5 + 人脉危机7 + 声誉危机4 = 75个
// 决策型事件占比约 45%

// ---- 热搜榜初始 ----

// ========== 竞争对手定义 ==========
const RIVALS = [
  { id:'rival_1', name:'鼎盛集团', boss:'刘建国', startMoney:80, growthRate:1.05, style:'激进', color:'#ff6b6b', strategy:'aggressive', specIndustry:null },
  { id:'rival_2', name:'恒通控股', boss:'陈明远', startMoney:100, growthRate:1.04, style:'稳健', color:'#4ecdc4', strategy:'conservative', specIndustry:null },
  { id:'rival_3', name:'新世纪资本', boss:'赵雪琴', startMoney:60, growthRate:1.07, style:'投机', color:'#ffe66d', strategy:'aggressive', specIndustry:null },
  { id:'rival_4', name:'蓝天科技', boss:'孙浩然', startMoney:50, growthRate:1.08, style:'科技', color:'#a29bfe', strategy:'specialized', specIndustry:'tech' },
  { id:'rival_5', name:'远洋国际', boss:'周海燕', startMoney:120, growthRate:1.03, style:'国际化', color:'#fd79a8', strategy:'conservative', specIndustry:null },
];

// ========== 新闻系统 ==========
const NEWS_CATEGORIES = ['财经', '科技', '社会', '国际', '八卦'];
const NEWS_TEMPLATES = [
  { category:'财经', templates:[
    '沪深两市今日大涨，{company}领涨板块',
    '{sector}板块异动，资金流入{amount}亿',
    '{company}发布Q{quarter}财报，营收同比增长{growth}%',
    '央行宣布降准{rate}个百分点，释放流动性{amount}亿',
    '{company}宣布回购计划，金额不超过{amount}亿元',
  ]},
  { category:'科技', templates:[
    '{company}发布新一代AI芯片，算力提升{num}倍',
    '{company}完成{amount}亿美元{round}轮融资',
    '工信部发放{num}张{technology}牌照',
    '{company}开源{project}项目，GitHub星标破{num}万',
    '苹果/谷歌/微软齐聚{event}，讨论{technology}未来',
  ]},
  { category:'社会', templates:[
    '全国高考报名人数达{num}万，再创历史新高',
    '{city}发布人才新政，购房补贴最高{amount}万',
    '国务院发布{policy}，影响{sector}等{num}个行业',
    '{event}引发热议，{platform}话题阅读量破{num}亿',
    '全国居民消费价格同比上涨{cpi}%，环比{change}',
  ]},
  { category:'国际', templates:[
    '美联储{action}利率{num}个基点，全球市场震荡',
    '{country}宣布对华{action}{sector}产品关税{rate}%',
    '{company}在{country}投资{amount}亿建厂，创造就业{num}人',
    'IMF上调全球经济增长预期至{growth}%，中国经济贡献{rate}%',
    '{country}大选结果出炉，{policy}政策或影响中企',
  ]},
  { category:'八卦', templates:[
    '{celebrity}官宣成为{brand}代言人，代言费{amount}万',
    '{celebrity}与{company}老板传出绯闻，双方辟谣',
    '{event}红毯造型引热议，{brand}礼服搜索量暴增',
    '{celebrity}投资{company}，持股{rate}%，称看好{sector}',
    '{company}冠名{event}，{celebrity}作为嘉宾出席',
  ]},
];

// 新闻对业务的影响映射
const NEWS_BIZ_EFFECTS = {
  '财经': { fund:[-0.05, 0.08], tech:[0, 0.03] },
  '科技': { tech:[-0.03, 0.06], media:[0, 0.02] },
  '社会': { retail:[-0.02, 0.04], office:[-0.01, 0.03] },
  '国际': { trade:[-0.06, 0.05], fund:[-0.04, 0.04] },
  '八卦': { media:[-0.01, 0.05], retail:[0, 0.03] }};

// 初始新闻（热搜榜）
const INITIAL_HOT_SEARCH = [
  { rank:1, text:'新海市GDP突破1.8万亿', heat:9999, category:'财经' },
  { rank:2, text:'星辰科技完成新一轮融资', heat:8765, category:'科技' },
  { rank:3, text:'新海人才政策升级', heat:7654, category:'社会' },
  { rank:4, text:'海天集团宣布战略调整', heat:6543, category:'财经' },
  { rank:5, text:'某创业者辞职创业', heat:5432, category:'社会' },
];

// ===================================================
//  资产模板 — ASSET_TEMPLATES
//  用于市场随机生成可购买的资产标的
// ===================================================
const ASSET_TEMPLATES = [
  // ---- 房产 (estate) ----
  { id:'apt_dt', name:'市中心公寓', type:'estate', basePrice:80, volatility:0.03, trend:0.005, rarity:'common'},
  { id:'villa_sub', name:'郊区别墅', type:'estate', basePrice:250, volatility:0.04, trend:0.006, rarity:'uncommon'},
  { id:'office_bld', name:'写字楼整层', type:'estate', basePrice:500, volatility:0.05, trend:0.007, rarity:'rare'},
  { id:'shop_lot', name:'商业旺铺', type:'estate', basePrice:150, volatility:0.04, trend:0.004, rarity:'uncommon'},
  { id:'land_plot', name:'开发地块', type:'estate', basePrice:350, volatility:0.08, trend:0.01, rarity:'rare'},
  { id:'penthouse', name:'顶层复式', type:'estate', basePrice:800, volatility:0.06, trend:0.008, rarity:'epic'},
  // ---- 艺术品 (art) ----
  { id:'oil_painting', name:'当代油画', type:'art', basePrice:30, volatility:0.12, trend:0.003, rarity:'common'},
  { id:'sculpture', name:'现代雕塑', type:'art', basePrice:60, volatility:0.10, trend:0.002, rarity:'uncommon'},
  { id:'ink_painting', name:'名家水墨', type:'art', basePrice:200, volatility:0.08, trend:0.008, rarity:'rare'},
  { id:'calligraphy', name:'书法珍品', type:'art', basePrice:120, volatility:0.09, trend:0.006, rarity:'rare'},
  { id:'digital_art', name:'数字藏品', type:'art', basePrice:15, volatility:0.20, trend:0.001, rarity:'common'},
  { id:'masterpiece', name:'油画巨作', type:'art', basePrice:600, volatility:0.06, trend:0.01, rarity:'epic'},
  // ---- 珠宝 (jewelry) ----
  { id:'gold_watch', name:'限量腕表', type:'jewelry', basePrice:40, volatility:0.05, trend:0.004, rarity:'common'},
  { id:'diamond_ring', name:'钻戒', type:'jewelry', basePrice:90, volatility:0.06, trend:0.003, rarity:'uncommon'},
  { id:'jade_bracelet', name:'翡翠手镯', type:'jewelry', basePrice:180, volatility:0.07, trend:0.006, rarity:'rare'},
  { id:'pearl_necklace', name:'珍珠项链', type:'jewelry', basePrice:55, volatility:0.04, trend:0.002, rarity:'uncommon'},
  { id:'crown_jewel', name:'传世皇冠', type:'jewelry', basePrice:450, volatility:0.08, trend:0.009, rarity:'epic'},
  // ---- 古董 (antique) ----
  { id:'porcelain', name:'青花瓷瓶', type:'antique', basePrice:100, volatility:0.06, trend:0.007, rarity:'rare'},
  { id:'bronze', name:'青铜器', type:'antique', basePrice:300, volatility:0.05, trend:0.008, rarity:'epic'},
  { id:'wood_furniture', name:'紫檀家具', type:'antique', basePrice:160, volatility:0.05, trend:0.005, rarity:'rare'},
  { id:'ancient_coin', name:'古钱币套装', type:'antique', basePrice:25, volatility:0.08, trend:0.003, rarity:'uncommon'},
  { id:'tea_set', name:'紫砂壶', type:'antique', basePrice:50, volatility:0.07, trend:0.004, rarity:'uncommon'},
  // ---- 股权 (equity) ----
  { id:'startup_share', name:'创业公司股权', type:'equity', basePrice:20, volatility:0.18, trend:0.002, rarity:'common'},
  { id:'fund_lp', name:'私募LP份额', type:'equity', basePrice:200, volatility:0.10, trend:0.006, rarity:'rare'},
  { id:'branch_share', name:'连锁品牌股份', type:'equity', basePrice:120, volatility:0.08, trend:0.005, rarity:'uncommon'},
  { id:'mine_right', name:'矿产开采权', type:'equity', basePrice:350, volatility:0.12, trend:0.007, rarity:'epic'},
];

// ==================================================
// 难度预设（第三批新增）
// ==================================================
const DIFFICULTY_PRESETS = {
  fast: {
    name: '快速模式',
    desc: '节奏快、风险高，适合快速体验游戏',
    startFundsMult: 2.0,
    eventFreqMult: 2.0,
    growthMult: 1.5,
    decayMult: 1.0,
  },
  standard: {
    name: '标准模式',
    desc: '均衡的游戏节奏和挑战',
    startFundsMult: 1.0,
    eventFreqMult: 1.0,
    growthMult: 1.0,
    decayMult: 1.0,
  },
  slow: {
    name: '慢速模式',
    desc: '从容发展，事件少，适合慢慢经营',
    startFundsMult: 0.7,
    eventFreqMult: 0.5,
    growthMult: 0.7,
    decayMult: 0.5,
  },
  sandbox: {
    name: '沙盒模式',
    desc: '无限资金，无随机事件，自由建造商业帝国',
    startFundsMult: 100.0,
    eventFreqMult: 0,
    growthMult: 1.0,
    decayMult: 0,
  },
};
