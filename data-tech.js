// Author: Fisheep.L
// ==================================================
// data-tech.js — 科技研发树 + RPT 比例
// ==================================================

// unlockAct: 解锁所需最低幕次（1-5），实现"档位"限制
// 前期（Act1-2）为小老板接地气的技术，后期（Act4-5）才出现前沿科技

var TECH_TREE = {
  digital: {
    id:'digital', name:'数字化转型', icon:'💻',
    desc:'从基础办公工具到量子商业网络，逐步提升全业务线收入',
    levels:[
      { level:1, name:'线上办公',    desc:'基础线上协作工具部署',         unlockAct:1, rptCost:8,   moneyCost:15000,  tickCost:6,  bonus:{ allRevenue:0.04 } },
      { level:2, name:'电子合同',    desc:'无纸化签约与合同管理',         unlockAct:1, rptCost:12,  moneyCost:25000,  tickCost:8,  bonus:{ allRevenue:0.04 } },
      { level:3, name:'客户管理',    desc:'CRM系统，跟踪客户全生命周期',   unlockAct:1, rptCost:18,  moneyCost:40000,  tickCost:10, bonus:{ allRevenue:0.04 } },
      { level:4, name:'数据分析',    desc:'业务数据可视化与基础洞察',     unlockAct:2, rptCost:25,  moneyCost:60000,  tickCost:12, bonus:{ allRevenue:0.04 } },
      { level:5, name:'智能运营',    desc:'AI辅助业务流程优化',           unlockAct:2, rptCost:35,  moneyCost:90000,  tickCost:15, bonus:{ allRevenue:0.04 } },
      { level:6, name:'产业互联',    desc:'打通上下游数字化协同',         unlockAct:3, rptCost:50,  moneyCost:150000, tickCost:18, bonus:{ allRevenue:0.04 } },
      { level:7, name:'数字孪生',    desc:'全业务数字孪生系统',           unlockAct:3, rptCost:70,  moneyCost:250000, tickCost:22, bonus:{ allRevenue:0.04 } },
      { level:8, name:'全链路数字化', desc:'供应链到终端全链路打通',      unlockAct:4, rptCost:100, moneyCost:400000, tickCost:28, bonus:{ allRevenue:0.04 } },
      { level:9, name:'元宇宙商业',   desc:'虚拟空间沉浸式商业体验',      unlockAct:4, rptCost:140, moneyCost:600000, tickCost:35, bonus:{ allRevenue:0.04 } },
      { level:10, name:'量子商业网',  desc:'量子计算驱动的商业决策网络',  unlockAct:5, rptCost:200, moneyCost:1000000,tickCost:45, bonus:{ allRevenue:0.04 } },
    ]
  },
  ai: {
    id:'ai', name:'智能运营', icon:'🤖',
    desc:'从办公自动化到AGI管理中枢，持续降低人力成本',
    levels:[
      { level:1, name:'办公自动化',  desc:'文档自动化处理与模板化',       unlockAct:1, rptCost:10,  moneyCost:20000,  tickCost:8,  bonus:{ salaryReduction:0.03 } },
      { level:2, name:'电子考勤',    desc:'智能考勤与工时统计系统',       unlockAct:1, rptCost:15,  moneyCost:35000,  tickCost:10, bonus:{ salaryReduction:0.03 } },
      { level:3, name:'智能排班',    desc:'基于业务预测的自动排班',       unlockAct:1, rptCost:22,  moneyCost:50000,  tickCost:12, bonus:{ salaryReduction:0.03 } },
      { level:4, name:'流程自动化',  desc:'RPA替代重复性人工操作',        unlockAct:2, rptCost:30,  moneyCost:80000,  tickCost:14, bonus:{ salaryReduction:0.03 } },
      { level:5, name:'AI招聘',      desc:'AI简历筛选与面试初筛',         unlockAct:2, rptCost:42,  moneyCost:120000, tickCost:16, bonus:{ salaryReduction:0.03, autoRecruit:true } },
      { level:6, name:'智能客服',    desc:'7×24 AI客服替代人工坐席',      unlockAct:3, rptCost:60,  moneyCost:180000, tickCost:20, bonus:{ salaryReduction:0.03 } },
      { level:7, name:'预测维护',    desc:'设备故障预测与预防性维护',     unlockAct:3, rptCost:85,  moneyCost:280000, tickCost:25, bonus:{ salaryReduction:0.03 } },
      { level:8, name:'RPA数字员工', desc:'数字员工全面部署替代基础岗位', unlockAct:4, rptCost:120, moneyCost:450000, tickCost:32, bonus:{ salaryReduction:0.03 } },
      { level:9, name:'全AI运营',    desc:'核心业务流程全AI化',           unlockAct:4, rptCost:170, moneyCost:700000, tickCost:40, bonus:{ salaryReduction:0.03 } },
      { level:10, name:'AGI管理中枢', desc:'通用人工智能统筹全局运营',    unlockAct:5, rptCost:240, moneyCost:1200000,tickCost:50, bonus:{ salaryReduction:0.03 } },
    ]
  },
  blockchain: {
    id:'blockchain', name:'金融科技', icon:'💰',
    desc:'从移动支付到央行数字货币，逐步提升金融业务收益',
    levels:[
      { level:1, name:'移动支付',    desc:'接入主流移动支付渠道',         unlockAct:1, rptCost:8,   moneyCost:12000,  tickCost:6,  bonus:{ fundBonus:0.05 } },
      { level:2, name:'电子发票',    desc:'自动化发票开具与税务管理',     unlockAct:1, rptCost:14,  moneyCost:22000,  tickCost:8,  bonus:{ fundBonus:0.05 } },
      { level:3, name:'智能记账',    desc:'AI驱动的财务记账与报表',       unlockAct:1, rptCost:20,  moneyCost:35000,  tickCost:10, bonus:{ fundBonus:0.05 } },
      { level:4, name:'自动理财',    desc:'基于规则的闲钱自动理财',       unlockAct:2, rptCost:28,  moneyCost:55000,  tickCost:12, bonus:{ fundBonus:0.05 } },
      { level:5, name:'智能风控',    desc:'实时欺诈检测与风险评估',       unlockAct:2, rptCost:40,  moneyCost:85000,  tickCost:15, bonus:{ fundBonus:0.05 } },
      { level:6, name:'量化交易',    desc:'算法驱动的自动化交易策略',     unlockAct:3, rptCost:55,  moneyCost:140000, tickCost:18, bonus:{ fundBonus:0.05 } },
      { level:7, name:'区块链结算',  desc:'分布式账本跨境清算',           unlockAct:3, rptCost:80,  moneyCost:220000, tickCost:22, bonus:{ fundBonus:0.05 } },
      { level:8, name:'DeFi平台',    desc:'去中心化金融协议接入',         unlockAct:4, rptCost:115, moneyCost:350000, tickCost:28, bonus:{ fundBonus:0.05 } },
      { level:9, name:'数字银行',    desc:'全线上数字银行业务牌照',       unlockAct:4, rptCost:160, moneyCost:550000, tickCost:35, bonus:{ fundBonus:0.05 } },
      { level:10, name:'央行数字货币', desc:'央行数字货币清算通道',       unlockAct:5, rptCost:230, moneyCost:900000, tickCost:45, bonus:{ fundBonus:0.05 } },
    ]
  }
};

// 哪些业务类型每级产出研发点数
var TECH_RPT_RATES = { tech:1.5, media:1.0, fund:0.8, office:0.3, food_chain:0.3, new_energy:0.6 };
