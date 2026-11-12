// Author: Fisheep.L
// ==================================================
// data-venture.js — 风投线数据（天使→PE→IPO）：14 家 NPC 初创公司 + 系统配置
// ==================================================

// ---- 风投目标公司（估值随机游走，成长率随估值规模衰减） ----
// baseVal: 基础估值(元)  growth: 基础成长率/tick  vol: 波动率  moat: 护城河(0-1，抑制波动)
var VENTURE_COMPANIES = [
  // 天使轮（估值 100万-1500万：高成长、高波动）
  { id:'v_mooncat',    name:'月猫互娱',     icon:'🐱', industry:'游戏',     baseVal:8e6,   growth:0.014, vol:0.09, moat:0.2, desc:'独立游戏工作室，爆款有机会百倍，扑街概率九成。' },
  { id:'v_freshbox',   name:'鲜盒子',       icon:'🥬', industry:'本地生活', baseVal:5e6,   growth:0.012, vol:0.08, moat:0.3, desc:'社区团购配送，现金流稳但增长看配送半径。' },
  { id:'v_starcode',   name:'星码科技',     icon:'💻', industry:'SaaS',     baseVal:12e6,  growth:0.013, vol:0.08, moat:0.4, desc:'垂直行业 SaaS，客户获取成本低，续约率是命门。' },
  { id:'v_petlink',    name:'宠联',         icon:'🐶', industry:'消费互联网', baseVal:3e6, growth:0.015, vol:0.10, moat:0.1, desc:'宠物社交，流量涨得快，变现模式还没跑通。' },
  // A 轮（估值 3000万-1亿）
  { id:'v_neurofit',   name:'脑域智能',     icon:'🧠', industry:'AI',       baseVal:60e6,  growth:0.011, vol:0.07, moat:0.5, desc:'大模型推理优化，估值坐过山车的技术明星。' },
  { id:'v_greenev',    name:'绿能车联',     icon:'🔋', industry:'新能源',   baseVal:45e6,  growth:0.010, vol:0.06, moat:0.6, desc:'固态电池新秀，量产是估值分水岭。' },
  { id:'v_medscan',    name:'医象智能',     icon:'🩻', industry:'医疗健康', baseVal:80e6,  growth:0.009, vol:0.05, moat:0.7, desc:'AI 医疗影像，拿证进度决定估值节奏。' },
  { id:'v_cloudport',  name:'云港物流',     icon:'📦', industry:'智慧物流', baseVal:30e6,  growth:0.011, vol:0.06, moat:0.5, desc:'跨境履约网络，重资产但护城河深。' },
  // B 轮（估值 5亿-12亿）
  { id:'v_quantix',    name:'量子资本',     icon:'📈', industry:'金融科技', baseVal:400e6, growth:0.008, vol:0.05, moat:0.6, desc:'量化基金，策略好但一次黑天鹅就能回吐全年。' },
  { id:'v_chipsilk',   name:'芯丝绸半导体', icon:'🔬', industry:'半导体',   baseVal:700e6, growth:0.007, vol:0.06, moat:0.8, desc:'芯片设计，研发壁垒极深，估值跟着周期与融资走。' },
  { id:'v_aerolink',   name:'空联无人机',   icon:'🛸', industry:'先进制造', baseVal:550e6, growth:0.008, vol:0.05, moat:0.6, desc:'低空经济无人机网络，政策周期是最大变量。' },
  { id:'v_biogenix',   name:'碧源生物',     icon:'🧬', industry:'生物医药', baseVal:1.2e9, growth:0.006, vol:0.04, moat:0.9, desc:'基因疗法管线公司，临近上市，管线失败归零风险。' },
  // PE 轮 / 拟上市
  { id:'v_dataharbor', name:'数港云',       icon:'🗄️', industry:'数据服务', baseVal:1.8e9, growth:0.005, vol:0.04, moat:0.7, desc:'数据基础设施，IPO 材料已递，估值即将重定价。' },
  { id:'v_solaris',    name:'曦和能源',     icon:'☀️', industry:'清洁能源', baseVal:9e8,   growth:0.006, vol:0.04, moat:0.8, desc:'光伏电站运营商，现金流已转正，上市只差窗口。' },
];

// ---- 风投系统配置 ----
var VENTURE_CFG = {
  IPO_THRESHOLD: 1e9,          // 达标线：估值 10亿
  IPO_PROB: 0.02,              // 达标公司每 tick 宣布 IPO 的概率
  IPO_FORCE_FACTOR: 2,         // 估值超过达标线 2 倍 → 强制 IPO（防止估值无限膨胀）
  IPO_BUMP_MIN: 1.8,           // IPO 一次性估值倍率下限
  IPO_BUMP_MAX: 2.5,           // IPO 一次性估值倍率上限
  IPO_CORRECT_TICKS: 30,       // IPO 后未卖出，N tick 后估值回落
  IPO_CORRECT_FACTOR: 0.6,     // 回落系数
  BANKRUPT_LINE: 0.2,          // 估值跌破入场价 20% 进入破产风险区
  BANKRUPT_PROB: 0.03,         // 风险区内每 tick 破产概率
  MAX_HOLD_PCT: 0.49,          // 单家持股上限 49%（不做控股）
  MAX_POSITIONS: 5,            // 同时持有上限
  EXIT_DISCOUNT: 0.8,          // 非 IPO 退出折价 20%
  IPO_EXIT_PREMIUM: 1.2,       // IPO 窗口退出溢价 20%
  UNLOCK_MONEY: 10e6,          // 现金 1000万 解锁风投
  FLOOR_FACTOR: 0.05,          // 估值下限：基础估值 5%（破产除外不归零）
  CHANGE_WINDOW: 60,           // 涨跌幅快照窗口(tick)
};
