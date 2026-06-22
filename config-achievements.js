// Author: Fisheep.L
// Auto-split from config.js by File Agent

// ---- ENDINGS ----
// ---- 结局文本（已禁用 — 这是一个长期放置游戏，没有结局） ----
const ENDINGS_DISABLED = true;
const ENDINGS = {
  '商业帝国': { title:'商业帝国', desc:'从零到万亿，你建立了一个横跨全球的商业帝国。无数人仰望你的名字。', icon:'👑' },
  '隐退江湖': { title:'隐退江湖', desc:'功成名就之后，你选择了隐退。江湖上只留下你的传说。', icon:'🌅' },
  '弄巧成拙': { title:'弄巧成拙', desc:'一步走错，满盘皆输。曾经的雄心壮志化为一地鸡毛。', icon:'⚡' },
  '回归平凡': { title:'回归平凡', desc:'繁华散尽，你回到起点。但这不是失败，是另一种选择。', icon:'🏠' },
  '破产清算': { title:'破产清算', desc:'资金链断裂，公司进入破产清算。', icon:'💸' },
  '商界传奇': { title:'商界传奇', desc:'你的名字被写进了商业教科书，一代又一代创业者的偶像。', icon:'🏆' },
  '全球霸主': { title:'全球霸主', desc:'你的商业版图覆盖全球，没有人敢忽视你的存在。', icon:'🌏' },
  '急流勇退': { title:'急流勇退', desc:'在巅峰时刻选择退场，你比谁都清楚什么时候该放手。', icon:'🕊️' },
  '东山再起': { title:'东山再起', desc:'跌倒过，但从未放弃。你的归来比所有人预想的都要耀眼。', icon:'🔥' }};


// ---- ACHIEVEMENTS + REWARDS ----
// ---- 成就 ----
const ACHIEVEMENTS = [
  // ---- 资产里程碑（更密集） ----
  { id:'money_1w',    name:'小有积蓄',         icon:'💰', desc:'累计资产达到1万', cond:{ type:'money',           value:10000 } },
  { id:'money_10w',   name:'十万小老板',        icon:'💵', desc:'累计资产达到10万', cond:{ type:'money',           value:100000 } },
  { id:'first_income',  name:'第一桶金',  icon:'🪙', desc:'累计赚取第一笔收入突破万元', cond:{ type:'total_income_earned', value:10000 } },
  { id:'money_1m',      name:'百万小老板',        icon:'💎', desc:'累计资产达到100万', cond:{ type:'money',           value:1000000 } },
  { id:'money_3m',      name:'三百万资产',        icon:'🏅', desc:'累计资产达到300万', cond:{ type:'money',           value:3000000 } },
  { id:'money_10m',     name:'千万富翁',      icon:'🌟', desc:'累计资产达到1000万', cond:{ type:'money',           value:10000000 } },
  { id:'money_50m',     name:'五千万资产',      icon:'💎', desc:'累计资产达到5000万', cond:{ type:'money',           value:50000000 } },
  { id:'money_100m',    name:'亿万富翁',         icon:'🔥', desc:'累计资产达到1亿', cond:{ type:'money',           value:100000000 } },
  { id:'money_300m',    name:'亿万大佬',         icon:'👑', desc:'累计资产达到3亿', cond:{ type:'money',           value:300000000 } },
  { id:'money_1b',      name:'商业大佬',         icon:'🏆', desc:'累计资产达到10亿', cond:{ type:'money',           value:1000000000 } },
  { id:'money_10b',     name:'商界传奇',        icon:'🏆', desc:'累计资产达到100亿', cond:{ type:'money',           value:10000000000 } },

  // ---- 员工/团队 ----
  { id:'first_employee', name:'创业伙伴',       icon:'👥', desc:'拥有1名或以上员工', cond:{ type:'emp_count',       count:1 } },
  { id:'emp_3',         name:'小团队',        icon:'👨👩👦', desc:'拥有3名或以上员工', cond:{ type:'emp_count',       count:3 } },
  { id:'emp_5',         name:'五人组',        icon:'🏢', desc:'拥有5名或以上员工', cond:{ type:'emp_count',       count:5 } },
  { id:'emp_10',        name:'管理大师',       icon:'🏭', desc:'拥有10名或以上员工', cond:{ type:'emp_count',       count:10 } },
  { id:'emp_15',        name:'中型公司',       icon:'🏗️', desc:'拥有15名或以上员工', cond:{ type:'emp_count',       count:15 } },
  { id:'emp_20',         name:'商业帝国',       icon:'🌐', desc:'拥有20名或以上员工', cond:{ type:'emp_count',       count:20 } },

  // ---- 业务/区域 ----
  { id:'first_biz',      name:'初次创业',       icon:'🏪', desc:'拥有1个或以上业务', cond:{ type:'biz_count',       count:1 } },
  { id:'biz_2',         name:'业务扩展',       icon:'🏢', desc:'拥有2个或以上业务', cond:{ type:'biz_count',       count:2 } },
  { id:'biz_3',         name:'多元经营',         icon:'🎯', desc:'拥有3个或以上业务', cond:{ type:'biz_count',       count:3 } },
  { id:'biz_4',         name:'跨界大佬',         icon:'🎪', desc:'拥有4个或以上业务', cond:{ type:'biz_count',       count:4 } },
  { id:'biz_all',        name:'全能商人',      icon:'🎯', desc:'拥有7个或以上业务', cond:{ type:'biz_count',       count:7 } },
  { id:'region_2',       name:'走出永宁',       icon:'🗺️', desc:'解锁2个或以上区域', cond:{ type:'region_count',    count:2 } },
  { id:'region_4',       name:'区域大亨',         icon:'🏔️', desc:'解锁4个或以上区域', cond:{ type:'region_count',    count:4 } },
  { id:'region_all',     name:'新海之王',      icon:'👑', desc:'解锁全部区域', cond:{ type:'regions_all' } },

  // ---- 声誉 ----
  { id:'rep_20',         name:'小有名气',          icon:'⭐', desc:'声誉值达到20', cond:{ type:'reputation',      value:20 } },
  { id:'rep_50',        name:'商界新星',          icon:'⭐', desc:'声誉值达到50', cond:{ type:'reputation',      value:50 } },
  { id:'rep_70',         name:'知名商人',          icon:'🌠', desc:'声誉值达到70', cond:{ type:'reputation',      value:70 } },
  { id:'rep_80',        name:'行业领袖',          icon:'🌠', desc:'声誉值达到80', cond:{ type:'reputation',      value:80 } },
  { id:'rep_95',         name:'商界传说',          icon:'✨', desc:'声誉值达到95', cond:{ type:'reputation',      value:95 } },

  // ---- 技能 ----
  { id:'skill_1',       name:'技能入门',       icon:'📚', desc:'解锁1个或以上技能', cond:{ type:'skill_count',      count:1 } },
  { id:'skill_5',       name:'技能进阶',         icon:'📘', desc:'解锁5个或以上技能', cond:{ type:'skill_count',      count:5 } },
  { id:'skill_10',      name:'技能大师',        icon:'🎓', desc:'解锁10个或以上技能', cond:{ type:'skill_count',      count:10 } },
  { id:'skill_15',      name:'宗师境界',        icon:'🏅', desc:'解锁15个或以上技能', cond:{ type:'skill_count',      count:15 } },

  // ---- 事件/决策 ----
  { id:'event_10',      name:'初见世面',        icon:'📜', desc:'经历10个事件', cond:{ type:'event_count',     count:10 } },
  { id:'event_30',      name:'阅历丰富',        icon:'📖', desc:'经历30个事件', cond:{ type:'event_count',     count:30 } },
  { id:'event_50',      name:'见证历史',        icon:'📜', desc:'经历50个事件', cond:{ type:'event_count',     count:50 } },
  { id:'event_100',     name:'沧桑商人',       icon:'📚', desc:'经历100个事件', cond:{ type:'event_count',     count:100 } },
  { id:'decision_5',    name:'初学决策',         icon:'⚡', desc:'做出5次决策', cond:{ type:'decision_count',  count:5 } },
  { id:'decision_10',   name:'决策老手',        icon:'⚡', desc:'做出10次决策', cond:{ type:'decision_count',  count:10 } },
  { id:'decision_30',   name:'决策高手',        icon:'🎯', desc:'做出30次决策', cond:{ type:'decision_count',  count:30 } },

  // ---- NPC/人脉 ----
  { id:'npc_1',         name:'初识贵人', icon:'💬', desc:'与任意NPC好感度达到20', cond:{ type:'npc_favor',       value:20 } },
  { id:'npc_3',         name:'人脉初成',  icon:'🤝', desc:'与3位NPC好感度均达到20', cond:{ type:'npc_favor_count', count:3, value:20 } },
  { id:'npc_max',       name:'人脉巅峰', icon:'💎', desc:'与所有NPC好感度达到最高', cond:{ type:'npc_favor_max' } },

  // ---- 压力/特殊 ----
  { id:'stress_0',      name:'佛系老板',icon:'🧘', desc:'连续保持低压力状态', cond:{ type:'stress_low_long' } },
  { id:'stress_never_high', name:'从容不迫',    icon:'😌', desc:'从未让压力过高', cond:{ type:'stress_never_high' } },
  { id:'no_debt',       name:'现金为王', icon:'💵', desc:'从未出现资金紧张', cond:{ type:'money_never_low' } },
  { id:'speed_run',     name:'极速传说',    icon:'⚡', desc:'快速积累百万资产', cond:{ type:'speed_run',      value:1000000, time:3600 } },
  { id:'play_24h',   name:'商海老手',      icon:'🎬', desc:'累计游戏时间超过24小时', cond:{ type:'play_time', hours:24 } },

  // ---- 新增成就 (10) ----
  { id:'region_dominator',name:'区域霸主',     icon:'🏰', desc:'在同一区域拥有3个业务', cond:{ type:'biz_in_region', count:3 } },
  { id:'social_butterfly',name:'社交达人',   icon:'🦋', desc:'与3位NPC好感度达到50', cond:{ type:'npc_favor_high', count:3, value:50 } },
  { id:'crisis_survivor', name:'危机管理者',         icon:'🛡️', desc:'成功应对5次负面事件', cond:{ type:'negative_events', count:5 } },
  { id:'comeback_king',   name:'逆风翻盘',     icon:'🚀', desc:'在经济萧条期实现逆势增长', cond:{ type:'grew_in_recession' } },
  { id:'top_team',        name:'顶级团队',       icon:'👑', desc:'拥有5名或以上高级员工', cond:{ type:'senior_emp_count', count:5 } },
  { id:'invest_master',   name:'投资大师',          icon:'📈', desc:'量化基金达到5级', cond:{ type:'biz_level', bizId:'fund', level:5 } },
  { id:'real_estate_king',name:'地产大亨',        icon:'🏢', desc:'写字楼租赁达到5级', cond:{ type:'biz_level', bizId:'office', level:5 } },
  { id:'tech_pioneer',    name:'科技先锋',        icon:'💻', desc:'科技工作室达到5级', cond:{ type:'biz_level', bizId:'tech', level:5 } },
  { id:'stress_master',   name:'压力管理大师',             icon:'🧘', desc:'压力从未超过40', cond:{ type:'stress_never_above', value:40 } },
  { id:'stock_trader',    name:'股市老手',           icon:'📊', desc:'股票盈利超过50万', cond:{ type:'stock_profit', value:500000 } },
  { id:'debt_free',       name:'无债一身轻',             icon:'🏦', desc:'从未申请过贷款', cond:{ type:'never_loan' } },
  { id:'tech_leader',     name:'科技领袖',           icon:'🔬', desc:'所有科技研发达到满级', cond:{ type:'all_tech_max' } },
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
      if (typeof v === 'boolean') total[k] = total[k] || v;
      // 乘法类奖励（<1.0表示减免/衰减，累乘更合理）
      else if (k === 'opCost' || k === 'loyaltyDecay') total[k] = (total[k] || 1) * v;
      else if (typeof v === 'number') total[k] = (total[k] || 0) + v;
    }
  });
  return total;
}


// ========== 员工配置（从硬编码提取） ==========

// ---- Events header ----
// ---- 事件总览 ----
// 市场12 + 员工10 + 政策8 + 运营8 + 个人6 + NPC10 + 里程碑5 + 竞争对手事件5 + 人脉危机7 + 声誉危机4 = 75个
// 决策型事件占比约 45%


// ---- RIVALS ----
// ---- 热搜榜初始 ----

// ========== 竞争对手定义 ==========
const RIVALS = [
  { id:'rival_1', name:'鼎盛集团', boss:'刘建国', startMoney:80, growthRate:1.05, style:'激进', color:'#ff6b6b', strategy:'aggressive', specIndustry:null },
  { id:'rival_2', name:'恒通控股', boss:'陈明远', startMoney:100, growthRate:1.04, style:'稳健', color:'#4ecdc4', strategy:'conservative', specIndustry:null },
  { id:'rival_3', name:'新世纪资本', boss:'赵雪琴', startMoney:60, growthRate:1.07, style:'投机', color:'#ffe66d', strategy:'aggressive', specIndustry:null },
  { id:'rival_4', name:'蓝天科技', boss:'孙浩然', startMoney:50, growthRate:1.08, style:'科技', color:'#a29bfe', strategy:'specialized', specIndustry:'tech' },
  { id:'rival_5', name:'远洋国际', boss:'周海燕', startMoney:120, growthRate:1.03, style:'国际化', color:'#fd79a8', strategy:'conservative', specIndustry:null },
  { id:'rival_6', name:'星火创投', boss:'李明辉', startMoney:40, growthRate:1.10, style:'风投', color:'#f39c12', strategy:'speculative', specIndustry:null },
  { id:'rival_7', name:'金鼎实业', boss:'王大富', startMoney:150, growthRate:1.02, style:'传统', color:'#e17055', strategy:'conservative', specIndustry:'office' },
  { id:'rival_8', name:'量子基金', boss:'陈丽华', startMoney:90, growthRate:1.06, style:'量化', color:'#6c5ce7', strategy:'specialized', specIndustry:'fund' },
];

// ========== 新闻系统 ==========

// ---- NEWS ----
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

// ---- INITIAL_HOT_SEARCH ----
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

