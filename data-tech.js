// ==================================================
// data-tech.js — 科技研发树 + RPT 比例
// ==================================================


// ========== 科技研发树 ==========
var TECH_TREE = {
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
var TECH_RPT_RATES = { tech:1.5, media:1.0, fund:0.8, office:0.3, food_chain:0.3, new_energy:0.6 };
