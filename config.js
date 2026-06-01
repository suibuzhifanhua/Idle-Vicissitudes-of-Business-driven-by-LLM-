// ===================================================
// config.js — 常量、出身、区域、业务、员工、技能、成就
// ===================================================

// ---- 游戏参数 ----
const CONFIG = {
  TICK_MS: 15000,
  LLM_BASE: 'http://localhost:11434',
  LLM_MODEL: 'qwen3.5:4b',
  EVENT_CHECK_INTERVAL: 6,
  EVENT_BASE_PROB: 0.30,
  MAX_PENDING_DECISIONS: 3,
    MAX_OFFLINE_HOURS: 12,
  BANKRUPTCY_THRESHOLD: -500000,
  BANKRUPTCY_TICKS: 5,
    SAVE_INTERVAL: 10,
  MANUAL_WORK_CD: 20,
  MANUAL_WORK_BAD_PROB: 0.08,
  STRESS_NATURAL_DECAY: 0.05,
  LOYALTY_DECAY: 0.17,
  REPUTATION_DECAY: 0.08,
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
    bonus:{ retail:1.0, cost:0.9, disasterProb:1.1, desc:'运营成本-10%，灾害事件+10%' },
    actUnlock:0, npcFrom:'小老板、厨师、社区大妈',
  },
  xinghai: {
    id:'xinghai', name:'星海区', type:'科技创新区', cityId:'xinhai',
    unlocked:false, unlockCond:{ money:2000000 },
    bonus:{ tech:1.3, burnoutProb:1.1, rdBonus:1.3, desc:'科技类研发速度+30%，员工Burnout+10%' },
    actUnlock:1, npcFrom:'程序员、产品经理、CTO、天使投资人',
  },
  jinwan: {
    id:'jinwan', name:'金湾区', type:'金融中心区', cityId:'xinhai',
    unlocked:false, unlockCond:{ money:5000000 },
    bonus:{ finance:1.2, negativeEventProb:1.15, desc:'金融类收益+20%，负面事件+15%' },
    actUnlock:2, npcFrom:'投行家、基金经理、证券分析师',
  },
  jinxiu: {
    id:'jinxiu', name:'锦绣区', type:'商业文化区', cityId:'xinhai',
    unlocked:false, unlockCond:{ money:10000000 },
    bonus:{ repGain:1.2, rumorSpread:1.25, desc:'声誉获取+20%，负面舆论传播+25%' },
    actUnlock:2, npcFrom:'广告总监、KOL、媒体记者',
  },
  yunding: {
    id:'yunding', name:'云顶区', type:'高端住宅区', cityId:'xinhai',
    unlocked:false, unlockCond:{ reputation:80 },
    bonus:{ connGain:1.5, socialCost:1.2, desc:'人脉获取+50%，社交成本+20%' },
    actUnlock:3, npcFrom:'企业二代、私人银行家、高端名流',
  },
  tiexi: {
    id:'tiexi', name:'铁西区', type:'工业物流区', cityId:'xinhai',
    unlocked:false, unlockCond:{ money:50000000 },
    bonus:{ opsCost:0.85, policyEventProb:1.2, desc:'运营类成本-15%，政策合规事件+20%' },
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
    unlocked:false, unlockCond:{ money:5000000, cityId:'jingdu' },
    bonus:{ finance:1.15, desc:'金融收益+15%' },
    actUnlock:1, npcFrom:'央企高管、部委官员',
  },
  jd_tech: {
    id:'jd_tech', name:'高新园区', type:'科技园', cityId:'jingdu',
    unlocked:false, unlockCond:{ reputation:40, cityId:'jingdu' },
    bonus:{ tech:1.2, rdBonus:1.2, desc:'科技研发+20%' },
    actUnlock:2, npcFrom:'中科院研究员、AI科学家',
  },
  jd_culture: {
    id:'jd_culture', name:'文化街区', type:'文创区', cityId:'jingdu',
    unlocked:false, unlockCond:{ reputation:50, cityId:'jingdu' },
    bonus:{ repGain:1.15, desc:'声誉获取+15%' },
    actUnlock:2, npcFrom:'艺术家、策展人、文化官员',
  },
  jd_tongzhou: {
    id:'jd_tongzhou', name:'通州区', type:'副中心', cityId:'jingdu',
    unlocked:false, unlockCond:{ money:20000000, cityId:'jingdu' },
    bonus:{ opsCost:0.9, desc:'运营成本-10%' },
    actUnlock:3, npcFrom:'规划局局长、建筑承包商',
  },

  // ========== 深港市（2000万解锁） ==========
  sg_ftz: {
    id:'sg_ftz', name:'前海自贸区', type:'自贸区', cityId:'shengang',
    unlocked:false, unlockCond:{ money:20000000, cityId:'shengang' },
    bonus:{ trade:1.2, desc:'贸易类收益+20%' },
    actUnlock:1, npcFrom:'外贸经理、海关官员',
  },
  sg_finance: {
    id:'sg_finance', name:'福田金融港', type:'金融区', cityId:'shengang',
    unlocked:false, unlockCond:{ money:50000000, cityId:'shengang' },
    bonus:{ finance:1.25, desc:'金融类收益+25%' },
    actUnlock:2, npcFrom:'基金经理、证券分析师',
  },
  sg_shekou: {
    id:'sg_shekou', name:'蛇口港区', type:'物流区', cityId:'shengang',
    unlocked:false, unlockCond:{ money:15000000, cityId:'shengang' },
    bonus:{ logistics:1.15, opsCost:0.9, desc:'物流效率+15%，运营成本-10%' },
    actUnlock:1, npcFrom:'物流总监、港口调度员',
  },
  sg_nanshan: {
    id:'sg_nanshan', name:'南山科技园', type:'科技园区', cityId:'shengang',
    unlocked:false, unlockCond:{ reputation:60, cityId:'shengang' },
    bonus:{ tech:1.3, desc:'科技收益+30%' },
    actUnlock:3, npcFrom:'CTO、创投合伙人',
  },

  // ========== 蓉城市（5000万解锁） ==========
  rc_gaoxin: {
    id:'rc_gaoxin', name:'高新区', type:'科技新区', cityId:'rongcheng',
    unlocked:false, unlockCond:{ money:50000000, cityId:'rongcheng' },
    bonus:{ tech:1.15, rdBonus:1.1, desc:'科技研发+15%' },
    actUnlock:2, npcFrom:'工程师、项目经理',
  },
  rc_chunxi: {
    id:'rc_chunxi', name:'春熙商圈', type:'商业区', cityId:'rongcheng',
    unlocked:false, unlockCond:{ money:30000000, cityId:'rongcheng' },
    bonus:{ retail:1.2, desc:'零售收益+20%' },
    actUnlock:1, npcFrom:'品牌经理、加盟商',
  },
  rc_tianfu: {
    id:'rc_tianfu', name:'天府新区', type:'新区', cityId:'rongcheng',
    unlocked:false, unlockCond:{ money:100000000, cityId:'rongcheng' },
    bonus:{ opsCost:0.85, desc:'运营成本-15%' },
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
    bonus:{ manufacturing:1.15, opsCost:0.9, desc:'制造成本-10%，效率+15%' },
    actUnlock:2, npcFrom:'工厂厂长、供应链经理',
  },

  // ========== 新加坡（5亿 + 第4幕） ==========
  xjp_marina: {
    id:'xjp_marina', name:'滨海湾金融中心', type:'金融区', cityId:'xinjiapo',
    unlocked:false, unlockCond:{ money:500000000, cityId:'xinjiapo' },
    bonus:{ finance:1.2, desc:'金融收益+20%' },
    actUnlock:4, npcFrom:'私人银行家、基金经理',
  },
  xjp_jurong: {
    id:'xjp_jurong', name:'裕廊工业园', type:'工业区', cityId:'xinjiapo',
    unlocked:false, unlockCond:{ money:300000000, cityId:'xinjiapo' },
    bonus:{ opsCost:0.8, desc:'运营成本-20%' },
    actUnlock:4, npcFrom:'供应链总监、物流经理',
  },
  xjp_orchard: {
    id:'xjp_orchard', name:'乌节路商圈', type:'商业区', cityId:'xinjiapo',
    unlocked:false, unlockCond:{ reputation:75, cityId:'xinjiapo' },
    bonus:{ retail:1.15, desc:'零售收益+15%' },
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
    bonus:{ retail:1.15, desc:'零售收益+15%' },
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
    bonus:{ finance:1.3, desc:'金融收益+30%' },
    actUnlock:5, npcFrom:'投行CEO、对冲基金经理',
  },
  ny_brooklyn: {
    id:'ny_brooklyn', name:'布鲁克林创意区', type:'文创区', cityId:'niuyue',
    unlocked:false, unlockCond:{ reputation:80, cityId:'niuyue' },
    bonus:{ repGain:1.15, desc:'声誉获取+15%' },
    actUnlock:5, npcFrom:'品牌总监、创意人',
  },
  ny_silicon: {
    id:'ny_silicon', name:'硅巷科技区', type:'科技区', cityId:'niuyue',
    unlocked:false, unlockCond:{ money:1500000000, cityId:'niuyue' },
    bonus:{ tech:1.25, desc:'科技收益+25%' },
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
    bonus:{ trade:1.2, desc:'贸易收益+20%' },
    actUnlock:5, npcFrom:'贸易商、物流总监',
  },
  ld_shoreditch: {
    id:'ld_shoreditch', name:'肖迪奇科技城', type:'科技区', cityId:'lundun',
    unlocked:false, unlockCond:{ reputation:85, cityId:'lundun' },
    bonus:{ tech:1.2, desc:'科技收益+20%' },
    actUnlock:5, npcFrom:'科技创始人、VC',
  },

  // ========== 迪拜（50亿 + 第5幕） ==========
  db_difc: {
    id:'db_difc', name:'迪拜国际金融中心', type:'金融区', cityId:'dibai',
    unlocked:false, unlockCond:{ money:5000000000, cityId:'dibai' },
    bonus:{ finance:1.3, desc:'金融收益+30%' },
    actUnlock:5, npcFrom:'石油资本代表、基金经理',
  },
  db_marina: {
    id:'db_marina', name:'迪拜码头贸易区', type:'贸易区', cityId:'dibai',
    unlocked:false, unlockCond:{ money:3000000000, cityId:'dibai' },
    bonus:{ trade:1.25, desc:'贸易收益+25%' },
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
    cityBonus:{ desc:'故乡加成：所有业务基础收益+5%', incomeMult:1.05 },
    regionIds:['yongning','xinghai','jinwan','jinxiu','yunding','tiexi','guangming'],
    sortOrder:0,
  },
  jingdu: {
    id:'jingdu', name:'京都市', icon:'🏛️', isInternational:false,
    desc:'政治文化中心，政策资源丰富，央企云集。',
    unlockMoney:10000000, minAct:1,
    cityBonus:{ desc:'政策加成：政府相关收益+15%', policyBonus:1.15 },
    regionIds:['jd_cbd','jd_tech','jd_culture','jd_tongzhou'],
    sortOrder:1,
  },
  shengang: {
    id:'shengang', name:'深港市', icon:'🌉', isInternational:false,
    desc:'改革开放前沿，金融与科技并重，跨境贸易活跃。',
    unlockMoney:40000000, minAct:1,
    cityBonus:{ desc:'金融加成：金融类收益+10%', financeBonus:1.10 },
    regionIds:['sg_ftz','sg_finance','sg_shekou','sg_nanshan'],
    sortOrder:2,
  },
  rongcheng: {
    id:'rongcheng', name:'蓉城市', icon:'🐼', isInternational:false,
    desc:'西部核心城市，生活成本低，产业政策优厚。',
    unlockMoney:100000000, minAct:2,
    cityBonus:{ desc:'西部大开发：运营成本-10%', opsCostReduction:0.9 },
    regionIds:['rc_gaoxin','rc_chunxi','rc_tianfu'],
    sortOrder:3,
  },
  hangjiang: {
    id:'hangjiang', name:'杭江市', icon:'🏯', isInternational:false,
    desc:'数字经济高地，电商直播之都，互联网氛围浓厚。',
    unlockMoney:200000000, minAct:2,
    cityBonus:{ desc:'数字经济：科技收益+10%', techBonus:1.10 },
    regionIds:['hj_binjiang','hj_xihu','hj_xiaoshan'],
    sortOrder:4,
  },
  xinjiapo: {
    id:'xinjiapo', name:'新加坡', icon:'🇸🇬', isInternational:true,
    desc:'东南亚金融枢纽，税率友好，连接东西方市场。',
    unlockMoney:1000000000, minAct:4,
    cityBonus:{ desc:'离岸优势：金融收益+15%，运营成本-5%', financeBonus:1.15, opsCostReduction:0.95 },
    regionIds:['xjp_marina','xjp_jurong','xjp_orchard'],
    sortOrder:5,
  },
  dongjing: {
    id:'dongjing', name:'东京', icon:'🇯🇵', isInternational:true,
    desc:'亚洲最大都市圈，科技与文化并重，动漫产业发达。',
    unlockMoney:2000000000, minAct:4,
    cityBonus:{ desc:'科技领先：科技收益+20%', techBonus:1.20 },
    regionIds:['dj_marunouchi','dj_shinjuku','dj_akihabara'],
    sortOrder:6,
  },
  niuyue: {
    id:'niuyue', name:'纽约', icon:'🇺🇸', isInternational:true,
    desc:'全球金融心脏，华尔街所在，商业帝国必争之地。',
    unlockMoney:4000000000, minAct:5,
    cityBonus:{ desc:'华尔街效应：金融收益+25%', financeBonus:1.25 },
    regionIds:['ny_wallstreet','ny_brooklyn','ny_silicon'],
    sortOrder:7,
  },
  lundun: {
    id:'lundun', name:'伦敦', icon:'🇬🇧', isInternational:true,
    desc:'欧洲金融门户，百年商业底蕴，高端品牌云集。',
    unlockMoney:6000000000, minAct:5,
    cityBonus:{ desc:'欧洲门户：全业务收益+10%', incomeMult:1.10 },
    regionIds:['ld_city','ld_canary','ld_shoreditch'],
    sortOrder:8,
  },
  dibai: {
    id:'dibai', name:'迪拜', icon:'🇦🇪', isInternational:true,
    desc:'中东财富中心，免税政策优厚，石油资本雄厚。',
    unlockMoney:10000000000, minAct:5,
    cityBonus:{ desc:'免税天堂：运营成本-25%，贸易收益+20%', opsCostReduction:0.75, tradeBonus:1.20 },
    regionIds:['db_difc','db_marina','db_freezone'],
    sortOrder:9,
  },
};

// ---- 富豪等级体系 ----
const RANK_TIERS = [
  { name:'个体户',        icon:'🛒',  minMoney:0 },
  { name:'区域龙头',      icon:'🏪',  minMoney:500000 },
  { name:'城市新贵',      icon:'🏢',  minMoney:5000000 },
  { name:'省级大亨',      icon:'🏗️',  minMoney:50000000 },
  { name:'全国百强',      icon:'🏆',  minMoney:500000000 },
  { name:'亚洲巨擘',      icon:'🌏',  minMoney:5000000000 },
  { name:'全球富豪',      icon:'👑',  minMoney:50000000000 },
];

// ---- 出身 ----
const ORIGINS = [
  {
    id:'elite', name:'大厂精英', icon:'💻',
    money:500000, reputation:30, stress:20, connections:15,
    stats:{ management:4, tech:2, social:3, finance:2 },
    bonus:{ techIncome:1.1 },
    special:'科技类业务收益+10%，前同事赵磊会作为早期NPC出现',
    desc:'你是新海市头部互联网公司的高级产品经理。经历996压榨后，拿着100万离职创业。',
    defaultName:'林远',
  },
  {
    id:'sales', name:'销售奇才', icon:'🤝',
    money:250000, reputation:40, stress:15, connections:30,
    stats:{ management:3, tech:1, social:5, finance:2 },
    bonus:{ retailIncome:1.15, hireSpeed:1.2 },
    special:'零售类业务收益+15%，员工招聘速度+20%',
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
    money:1000000, reputation:10, stress:35, connections:40,
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
    baseIncome:0.5, unlockMoney:0, unlockAct:0,
    desc:'永宁区的老牌生意，运营成本低，稳定现金流',
    levels:[
      { level:1, name:'街角小店', income:0.12, cost:0 },
      { level:2, name:'社区便利店', income:0.3, cost:16 },
      { level:3, name:'连锁便利(3家)', income:0.78, cost:50 },
      { level:4, name:'区域品牌(10家)', income:1.98, cost:120 },
      { level:5, name:'城市配送网络', income:4.98, cost:300 },
    ]
  },
  {
    id:'tech', name:'科技工作室', icon:'💻', regions:['xinghai'],
    baseIncome:0.8, unlockMoney:1500000, unlockAct:1,
    desc:'星海区的科技创业，研发加速，高收益高风险',
    levels:[
      { level:1, name:'独立开发者', income:0.48, cost:0 },
      { level:2, name:'小型工作室(5人)', income:0.78, cost:30 },
      { level:3, name:'产品化运营', income:1.56, cost:80 },
      { level:4, name:'明星产品', income:3.6, cost:200 },
      { level:5, name:'行业标杆', income:8.58, cost:500 },
    ]
  },
  {
    id:'office', name:'写字楼租赁', icon:'🏢', regions:['jinwan'],
    baseIncome:1.5, unlockMoney:3000000, unlockAct:2,
    desc:'金湾区的地产投资，被动收入稳定',
    levels:[
      { level:1, name:'单层办公室', income:0.9, cost:0 },
      { level:2, name:'整层租赁', income:1.68, cost:80 },
      { level:3, name:'独立写字楼', income:4.08, cost:240 },
      { level:4, name:'商务园区', income:10.08, cost:600 },
      { level:5, name:'城市地标', income:26.1, cost:1600 },
    ]
  },
  {
    id:'fund', name:'量化基金', icon:'📈', regions:['jinwan'],
    baseIncome:3.0, unlockMoney:10000000, unlockAct:2,
    desc:'金湾区的高风险高回报金融业务',
    levels:[
      { level:1, name:'小额试水', income:1.8, cost:0 },
      { level:2, name:'私募基金', income:4.8, cost:300 },
      { level:3, name:'量化交易系统', income:12.6, cost:800 },
      { level:4, name:'对冲基金', income:32.4, cost:2000 },
      { level:5, name:'金融帝国', income:82.8, cost:5000 },
    ]
  },
  {
    id:'media', name:'媒体矩阵', icon:'📺', regions:['jinxiu'],
    baseIncome:5.0, unlockMoney:30000000, unlockAct:3,
    desc:'锦绣区的媒体帝国，声誉加速，舆论力量',
    levels:[
      { level:1, name:'自媒体账号', income:3.0, cost:0 },
      { level:2, name:'MCN机构', income:10.8, cost:800 },
      { level:3, name:'垂直媒体', income:31.2, cost:2000 },
      { level:4, name:'全媒体矩阵', income:81.0, cost:5000 },
      { level:5, name:'媒体帝国', income:201.0, cost:12000 },
    ]
  },
  {
    id:'food_chain', name:'餐饮连锁', icon:'🍽️', regions:['yongning','jinxiu'],
    baseIncome:0.6, unlockMoney:500000, unlockAct:0,
    desc:'永宁区和锦绣区的稳定现金流业务，每级自动增加1个基础员工槽位',
    levels:[
      { level:1, name:'街头小吃摊', income:0.36, cost:0 },
      { level:2, name:'社区餐厅', income:0.6, cost:24 },
      { level:3, name:'连锁品牌(5家)', income:1.38, cost:80 },
      { level:4, name:'区域餐饮集团', income:3.78, cost:240 },
      { level:5, name:'城市美食地标', income:10.8, cost:700 },
    ]
  },
  {
    id:'new_energy', name:'新能源开发', icon:'⚡', regions:['tiexi','xinghai'],
    baseIncome:0.4, unlockMoney:8000000, unlockAct:3,
    desc:'铁西区和星海区的高投入高回报绿色能源业务，3级以上每Tick有概率触发政府补贴',
    levels:[
      { level:1, name:'小型光伏电站', income:0.24, cost:0 },
      { level:2, name:'风电项目', income:0.84, cost:60 },
      { level:3, name:'储能电站', income:2.82, cost:200 },
      { level:4, name:'区域能源网络', income:8.82, cost:600 },
      { level:5, name:'绿色能源巨头', income:26.82, cost:1800 },
    ]
  },
];

// ---- 员工角色 ----
const EMP_ROLES = [
  { id:'intern',       name:'实习生',   salary:0.3, icon:'🎓', effect:'低成本劳动力',                                   req:null, incomeBonus:0.005 },
  { id:'developer',    name:'开发者',   salary:1.5, icon:'💻', effect:'科技+15%',                                   req:{ business:'tech' }, incomeBonus:0.01 },
  { id:'designer',     name:'设计师',   salary:1.2, icon:'🎨', effect:'媒体/零售+10%',                                req:null, incomeBonus:0.01 },
  { id:'sales',        name:'销售',     salary:1.0, icon:'🤝', effect:'零售/合作+20%，人脉+2/月',                     req:null, incomeBonus:0.01 },
  { id:'analyst',      name:'分析师',   salary:1.3, icon:'📊', effect:'负面事件-3%/人',                                 req:null, incomeBonus:0.01 },
  { id:'manager',      name:'管理者',   salary:2.0, icon:'📋', effect:'分配业务+30%，忠诚衰减-50%',                   req:{ empCount:5 }, incomeBonus:0.015 },
  { id:'lawyer',       name:'律师',     salary:1.8, icon:'⚖️', effect:'监管伤害-50%',                                 req:{ money:5000000 }, incomeBonus:0.01 },
  { id:'hr',           name:'HR',       salary:1.2, icon:'👥', effect:'忠诚衰减-50%，招聘成本-20%',                    req:null, incomeBonus:0.01 },
  { id:'finance_emp',  name:'财务',     salary:1.4, icon:'💰', effect:'税务优化+5%，资金周转+10%',                      req:null, incomeBonus:0.01 },
  { id:'marketer',     name:'市场',     salary:1.1, icon:'📣', effect:'声誉+15%，产品发布+20%',                        req:null, incomeBonus:0.01 },
  { id:'cto',          name:'CTO',      salary:3.0, icon:'♟', effect:'全局科技+20%',                                req:{ techLv:5, empCount:8 }, incomeBonus:0.04 },
];

// ---- 技能树 ----
const SKILL_TREES = {
  management: [
    { id:'lean_mgmt',     name:'精益管理',   desc:'所有业务运营成本-5%',                       cond:{ type:'biz_upgrade', count:1 },   effect:{ opCost:0.95 } },
    { id:'target_mgmt',   name:'目标管理',   desc:'所有业务收益+5%',                         cond:{ type:'biz_count', count:3 },      effect:{ incomeMult:1.05 } },
    { id:'crisis_mgmt',   name:'危机管理',   desc:'负面事件影响-15%',                       cond:{ type:'negative_events', count:3 }, effect:{ negativeImpact:0.85 } },
    { id:'matrix_mgmt',   name:'矩阵管理',   desc:'员工上限+3',                             cond:{ type:'emp_count', count:10 },     effect:{ empMaxBonus:3 } },
    { id:'change_mgmt',   name:'变革管理',   desc:'升级后额外+10%收益',                     cond:{ type:'biz_lv', level:5 },         effect:{ upgradeBonus:1.1 } },
  ],
  tech: [
    { id:'data_driven',   name:'数据驱动',   desc:'事件预判概率+10%',                      cond:{ type:'has_role', role:'analyst' },     effect:{ eventPredict:1.1 } },
    { id:'tech_barrier',  name:'技术壁垒',   desc:'竞争对手模仿概率-20%',                  cond:{ type:'biz_lv', level:3, bizType:'tech' }, effect:{ competitorImitation:0.8 } },
    { id:'automation',    name:'自动化',     desc:'管理效率+15%',                         cond:{ type:'has_role', role:'developer', count:2 }, effect:{ mgmtEfficiency:1.15 } },
    { id:'ai_empower',    name:'AI赋能',      desc:'LLM叙事质量提升',                        cond:{ type:'biz_lv', level:7, bizType:'tech' }, effect:{ llmQuality:1.2 } },
    { id:'black_tech',    name:'黑科技',     desc:'随机获得一项科技专利',                   cond:{ type:'events', eventType:'tech_breakthrough', count:3 }, effect:{ patent:true } },
  ],
  social: [
    { id:'biz_negotiate', name:'商务谈判',   desc:'合作收益+15%',                         cond:{ type:'decision_success', count:1 },  effect:{ coopBonus:1.15 } },
    { id:'network',       name:'人脉网络',   desc:'人脉获取速度+20%',                     cond:{ type:'connections', value:50 },        effect:{ connGain:1.2 } },
    { id:'crisis_pr',     name:'危机公关',   desc:'负面舆论影响-30%',                     cond:{ type:'event_type', eventType:'media_crisis' }, effect:{ rumorImpact:0.7 } },
    { id:'capital_op',    name:'资本运作',   desc:'融资金额+10%',                       cond:{ type:'funding', count:1 },          effect:{ fundingMult:1.1 } },
    { id:'shadow_play',   name:'幕后操盘',   desc:'解锁隐藏结局',                         cond:{ type:'npc_favor', count:5, level:'亲密' }, effect:{ hiddenEnding:true } },
  ],
  finance: [
    { id:'cost_ctrl',     name:'成本控制',   desc:'无效支出-10%',                         cond:{ type:'fire_emp', count:1 },         effect:{ wasteCost:0.9 } },
    { id:'cash_flow',     name:'现金流管理', desc:'偶尔获得现金流奖励',                     cond:{ type:'money_never_below', duration:100 }, effect:{ cashFlowBonus:true } },
    { id:'hedge',        name:'风险对冲',   desc:'负面事件损失-20%',                     cond:{ type:'insurance' },               effect:{ lossReduce:0.8 } },
    { id:'leverage',      name:'杠杆运营',   desc:'杠杆加成（风险+收益）',                cond:{ type:'funding', count:1 },          effect:{ leverage:true } },
    { id:'capital_shark', name:'资本大鳄',   desc:'解锁IPO事件线',                        cond:{ type:'money', value:1000000000 },  effect:{ ipo:true } },
  ],
};

// ---- 结局文本 ----
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
  { id:'first_income',  name:'第一桶金',   desc:'首次获得收益',         icon:'🪙', cond:{ type:'money',           value:10000 } },
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
  { id:'biz_all',        name:'全能商人',   desc:'解锁所有5类业务',      icon:'🎯', cond:{ type:'biz_count',       count:5 } },
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
  { id:'all_endings',   name:'全结局收集',   desc:'体验所有5个结局',      icon:'🎬', cond:{ type:'endings_all' } },

  // ---- 新增成就 (10) ----
  { id:'diversifying',   name:'多元化经营',   desc:'拥有4条以上不同业务线',       icon:'🎯', cond:{ type:'biz_count', count:4 } },
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
const TECH_RPT_RATES = { tech:1.5, media:1.0, fund:0.8, office:0.3, trade:0.2 };

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

// ========== 礼物类型 ==========
const GIFT_TYPES = {
  wine:   { name:'名酒',     cost:8000,  desc:'一瓶陈年佳酿' },
  book:   { name:'书籍',     cost:5000,  desc:'一套精装典藏书' },
  art:    { name:'艺术品',   cost:20000, desc:'一件限量艺术品' },
  tech:   { name:'科技产品', cost:15000, desc:'最新科技装备' },
  luxury: { name:'奢侈品',   cost:50000, desc:'一件顶级奢侈品' },
};
