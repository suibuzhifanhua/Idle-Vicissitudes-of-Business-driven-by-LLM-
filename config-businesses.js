// Author: Fisheep.L
// Auto-split from config.js by File Agent

// ---- REGIONS ----
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


// ---- CITIES ----
// ---- 城市定义 ----
const CITIES = {
  xinhai: {
    id:'xinhai', name:'新海市', icon:'🏙️', desc:'新海市，你的起点。这座滨海城市充满了机遇与挑战，每一个街角都在讲述创业者的故事。', isInternational:false,
    unlockMoney:0, minAct:0,
    cityBonus:{desc:'全局收入+3%', incomeMult:1.03 },
    regionIds:['yongning','xinghai','jinwan','jinxiu','yunding','tiexi','guangming'],
    sortOrder:0},
  jingdu: {
    id:'jingdu', name:'京都市', icon:'🏛️', desc:'京都市，千年古都的现代脉动。政策资源和总部经济在这里交汇，是通往全国市场的门户。', isInternational:false,
    unlockMoney:150000000, minAct:1,
    cityBonus:{desc:'政策红利+8%', policyBonus:1.08 },
    regionIds:['jd_cbd','jd_tech','jd_culture','jd_tongzhou'],
    sortOrder:1},
  shengang: {
    id:'shengang', name:'深港市', icon:'🌉', desc:'深港市，大湾区引擎。金融、贸易、科技在这里撞出最炫目的火花。', isInternational:false,
    unlockMoney:500000000, minAct:2,
    cityBonus:{desc:'金融收益+5%', financeBonus:1.05 },
    regionIds:['sg_ftz','sg_finance','sg_shekou','sg_nanshan'],
    sortOrder:2},
  rongcheng: {
    id:'rongcheng', name:'蓉城市', icon:'🐼', desc:'蓉城市，天府之国的商业新中心。悠闲外表下藏着最快的经济增速。', isInternational:false,
    unlockMoney:1200000000, minAct:2,
    cityBonus:{desc:'运营成本-5%', opsCostReduction:0.95 },
    regionIds:['rc_gaoxin','rc_chunxi','rc_tianfu'],
    sortOrder:3},
  hangjiang: {
    id:'hangjiang', name:'杭江市', icon:'🏯', desc:'杭江市，数字经济的潮头。互联网基因深入每一条街巷，新商业物种在这里诞生。', isInternational:false,
    unlockMoney:2500000000, minAct:3,
    cityBonus:{desc:'科技收益+5%', techBonus:1.05 },
    regionIds:['hj_binjiang','hj_xihu','hj_xiaoshan'],
    sortOrder:4},
  xinjiapo: {
    id:'xinjiapo', name:'新加坡', icon:'🇸🇬', desc:'新加坡，东南亚金融枢纽。从这里出发，你的商业可以辐射整个亚太。', isInternational:true,
    unlockMoney:3000000000, minAct:4,
    cityBonus:{desc:'金融收益+8%·运营成本-3%', financeBonus:1.08, opsCostReduction:0.97 },
    regionIds:['xjp_marina','xjp_jurong','xjp_orchard'],
    sortOrder:5},
  dongjing: {
    id:'dongjing', name:'东京', icon:'🇯🇵', desc:'东京，科技与传统的极致融合。在这里站稳脚跟，意味着进入全球顶级商业俱乐部。', isInternational:true,
    unlockMoney:6000000000, minAct:4,
    cityBonus:{desc:'科技收益+10%', techBonus:1.10 },
    regionIds:['dj_marunouchi','dj_shinjuku','dj_akihabara'],
    sortOrder:6},
  niuyue: {
    id:'niuyue', name:'纽约', icon:'🇺🇸', desc:'纽约，世界资本的心脏。华尔街的钟声为每一个征服者而鸣。', isInternational:true,
    unlockMoney:12000000000, minAct:5,
    cityBonus:{desc:'金融收益+12%', financeBonus:1.12 },
    regionIds:['ny_wallstreet','ny_brooklyn','ny_silicon'],
    sortOrder:7},
  lundun: {
    id:'lundun', name:'伦敦', icon:'🇬🇧', desc:'伦敦，老牌金融中心的底蕴。泰晤士河畔的办公室里，全球生意从未停歇。', isInternational:true,
    unlockMoney:18000000000, minAct:5,
    cityBonus:{desc:'全局收入+5%', incomeMult:1.05 },
    regionIds:['ld_city','ld_canary','ld_shoreditch'],
    sortOrder:8},
  dibai: {
    id:'dibai', name:'迪拜', icon:'🇦🇪', desc:'迪拜，沙漠中崛起的奇迹之城。零税率、自由港、无限可能。', isInternational:true,
    unlockMoney:30000000000, minAct:5,
    cityBonus:{desc:'运营成本-15%·贸易收益+10%', opsCostReduction:0.85, tradeBonus:1.10 },
    regionIds:['db_difc','db_marina','db_freezone'],
    sortOrder:9},
};


// ---- GIFT_TYPES ----
const GIFT_TYPES = {
  wine:   { name:'名酒',     cost:8000},
  book:   { name:'书籍',     cost:5000},
  art:    { name:'艺术品',   cost:20000},
  tech:   { name:'科技产品', cost:15000},
  luxury: { name:'奢侈品',   cost:50000}};

// ========== 来自 data.js 拆分后剩余内容 ==========
;


// ---- ASSET_TEMPLATES ----
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

