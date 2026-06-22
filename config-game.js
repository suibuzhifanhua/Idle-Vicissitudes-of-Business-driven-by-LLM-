// Author: Fisheep.L
// Auto-split from config.js by File Agent

// ---- 基础配置 ----

// ---- 通用换算常量 ----
const WAN = 10000;  // 万元换算
const YI = 100000000;  // 亿换算
const QIANWAN = 10000000;  // 千万

// ---- 关键数值常量（避免魔法数字散布各处） ----
const DEFAULT_AUTO_GIFT_BUDGET = 50000;     // 托管送礼默认预算
const DEFAULT_ASSET_SALE_MIN = 50000;        // 资产挂售最低价
const DEFAULT_MA_COST_BASE = 100000;         // 并购基础费用
const MS_PER_SEC = 1000;                     // 毫秒/秒

// ---- 游戏参数 ----
const CONFIG = {
  TICK_MS: 30000,          // 30秒/Tick
  LLM_BASE: '',  // Ollama 代理路径（留空走 /api/ollama 代理）
  LLM_MODEL: 'qwen3.5:4b',
  LLM_CHECK_TIMEOUT: 10000,   // LLM 检测超时(ms)，LM Studio 首次响应可能较慢
  LLM_GENERATE_TIMEOUT: 120000, // LLM 生成超时(ms)，本地 qwen3.5 推理较慢需足够耐心
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
  SUPPLY_MAX_LEVEL: 10,           // 供应商等级上限
  SUPPLY_UPGRADE_COST_BASE: 50000,// 供应商升级基础费用
  SUPPLY_QUALITY_LEVELS: ['劣质','普通','良好','优质','极品'], // 供应品质
  // ---- 员工深度 ----
  EMP_FATIGUE_RATE: 0.15,         // 疲劳增长/tick（净增=此值-衰减）
  EMP_FATIGUE_DECAY: 0.08,        // 疲劳自然恢复/tick
  EMP_TRAINING_COST_BASE: 20000,  // 培训基础费用
  EMP_SKILL_MAX: 10,              // 技能最高10级
  EMP_SPEC_MAX: 5,                // 专精最高5级
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



// ---- TIME ----
// ---- 时间系统 ----
const TIME = {
  DAY_CYCLE_TICKS: 24,     // 24个Tick = 一个游戏日
  DAWN_START: 5,           // 5:00 黎明
  DAY_START: 7,            // 7:00 白天
  DUSK_START: 17,          // 17:00 黄昏
  NIGHT_START: 19,         // 19:00 夜晚
};


// ---- WEATHERS ----
// ---- 气候系统 ----
const WEATHERS = {
  sunny:    { name:'晴天',   desc:'阳光明媚，万物复苏',     incomeMod: 1.0,   eventMod: 'neutral'},
  cloudy:   { name:'多云',   desc:'云层低垂，空气沉闷',     incomeMod: 1.0,   eventMod: 'neutral'},
  rainy:    { name:'雨天',   desc:'细雨绵绵，出行不便',     incomeMod: 0.95,  eventMod: 'negative'},
  storm:    { name:'暴风雨', desc:'狂风骤雨，电闪雷鸣',     incomeMod: 0.85,  eventMod: 'crisis'},
  foggy:    { name:'雾天',   desc:'浓雾弥漫，视线模糊',     incomeMod: 0.9,   eventMod: 'neutral'},
  snow:     { name:'雪天',   desc:'大雪纷飞，银装素裹',     incomeMod: 0.88,  eventMod: 'neutral'},
  heatwave: { name:'高温',   desc:'烈日炎炎，酷暑难耐',     incomeMod: 0.92,  eventMod: 'negative'}};


// ---- RANK_TIERS ----
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



// ---- MILESTONES ----
const MILESTONES = [
  // money, repMin, bizSumMin（所有城市业务等级总和）, act, ...
  { money: 1000000,      repMin: 15, bizSumMin: 3,  act: 1, name: '第一桶金',   icon:'💰', desc:'资产突破百万，你捞到了商海中的第一桶金。', eventId: 'milestone_1m'},
  { money: 10000000,     repMin: 30, bizSumMin: 8,  act: 2, name: '小有成就',   icon:'📈', desc:'千万身家，你已经不是无名之辈。业界开始关注你的动作。', eventId: 'milestone_10m'},
  { money: 100000000,    repMin: 50, bizSumMin: 15, act: 3, name: '事业有成',   icon:'🏢', desc:'亿万身家在手，但你深知这只是一个开始。更大的棋局还在后面。', eventId: 'milestone_100m'},
  { money: 1000000000,   repMin: 65, bizSumMin: 25, act: 4, name: '商业帝国',   icon:'👑', desc:'十亿级企业集团已经成形。你的名字正在被写进本地商业史。', eventId: 'milestone_1b'},
  { money: 10000000000,  repMin: 80, bizSumMin: 40, act: 5, name: '传奇人物',   icon:'🏆', desc:'百亿商业帝国，你已经成为一个时代的符号。', eventId: 'milestone_10b'},
];


// ---- DIFFICULTY_PRESETS ----
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

// ========== 节日配置 ==========
// dayOfYear → holidayKey 映射（游戏内 360 天/年）
const HOLIDAYS = [
  { day: 1,   key: 'spring_festival' },
  { day: 1,   key: 'newyear' },
  { day: 15,  key: 'lantern' },
  { day: 95,  key: 'qingming' },
  { day: 121, key: 'labor' },
  { day: 145, key: 'dragon_boat' },
  { day: 188, key: 'qixi' },
  { day: 227, key: 'mid_autumn' },
  { day: 274, key: 'national' },
  { day: 315, key: 'double11' },
  { day: 346, key: 'double12' },
  { day: 359, key: 'christmas' },
  { day: 360, key: 'newyear' },
];

