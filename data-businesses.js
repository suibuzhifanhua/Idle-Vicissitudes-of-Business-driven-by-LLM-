// ==================================================
// data-businesses.js — 业务定义
// ==================================================

// ---- 业务定义 ----
var BUSINESS_DEFS = [
  {
    id:'retail', name:'便利连锁', icon:'🏪', regions:['yongning'], techTree:'digital',
    unlockMoney:0, unlockAct:0,
    desc:'永宁区的老牌生意，现金流虽薄但稳定，是你事业的起点。街角的灯光永远为夜归人亮着。',
    levels:[
      { level:1, name:'街角小店', income:0.10, cost:0 },
      { level:2, name:'社区便利店', income:0.22, cost:80 },
      { level:3, name:'连锁便利(3家)', income:0.45, cost:280 },
      { level:4, name:'区域品牌(10家)', income:0.75, cost:1200 },
      { level:5, name:'城市配送网络', income:1.10, cost:3000 },
      { level:6, name:'区域配送中心', income:1.50, cost:6000, reqCond:{ techLv:2 } },
      { level:7, name:'智能仓储物流', income:1.90, cost:12000, reqCond:{ techLv:4 } },
      { level:8, name:'全渠道零售', income:2.30, cost:25000, reqCond:{ techLv:5, npcFavor:{ zhaolei:40 } } },
      { level:9, name:'新零售生态', income:2.70, cost:50000, reqCond:{ techLv:7 } },
      { level:10, name:'零售帝国', income:3.20, cost:100000, reqCond:{ techLv:9, rep:70 } },
    ]
  },
  {
    id:'tech', name:'科技工作室', icon:'💻', regions:['xinghai'], techTree:'ai',
    unlockMoney:2000000, unlockAct:1,
    desc:'星海区的科技创业热土，凌晨三点的写字楼里代码还在编译。高回报伴随高风险。',
    levels:[
      { level:1, name:'独立开发者', income:0.20, cost:0 },
      { level:2, name:'小型工作室(5人)', income:0.35, cost:200 },
      { level:3, name:'产品化运营', income:0.60, cost:600 },
      { level:4, name:'明星产品', income:0.75, cost:2500 },
      { level:5, name:'行业标杆', income:1.2, cost:6000 },
      { level:6, name:'SaaS平台', income:1.6, cost:12000, reqCond:{ techLv:2 } },
      { level:7, name:'AI产品矩阵', income:2.0, cost:25000, reqCond:{ techLv:4 } },
      { level:8, name:'技术生态圈', income:2.5, cost:50000, reqCond:{ techLv:5, npcFavor:{ zhaolei:40 } } },
      { level:9, name:'行业基础设施', income:3.0, cost:100000, reqCond:{ techLv:7 } },
      { level:10, name:'科技帝国', income:3.5, cost:200000, reqCond:{ techLv:9, rep:75 } },
    ]
  },
  {
    id:'office', name:'写字楼租赁', icon:'🏢', regions:['jinwan'], techTree:'digital',
    unlockMoney:5000000, unlockAct:2,
    desc:'金湾区的钢筋森林，每一层楼都是一个商业故事。被动收入，细水长流。',
    levels:[
      { level:1, name:'单层办公室', income:0.30, cost:0 },
      { level:2, name:'整层租赁', income:0.50, cost:550 },
      { level:3, name:'独立写字楼', income:0.90, cost:1700 },
      { level:4, name:'商务园区', income:1.8, cost:7000 },
      { level:5, name:'城市地标', income:3.2, cost:18000 },
      { level:6, name:'综合商务体', income:4.2, cost:35000, reqCond:{ techLv:2, money:100000000 } },
      { level:7, name:'甲级写字楼群', income:5.5, cost:70000, reqCond:{ techLv:4 } },
      { level:8, name:'城市综合体', income:7.0, cost:140000, reqCond:{ techLv:5, npcFavor:{ chenzong:40 } } },
      { level:9, name:'商业地产帝国', income:8.5, cost:280000, reqCond:{ techLv:7 } },
      { level:10, name:'地标之城', income:10.0, cost:550000, reqCond:{ techLv:9, rep:80 } },
    ]
  },
  {
    id:'fund', name:'量化基金', icon:'📈', regions:['jinwan'], techTree:'blockchain',
    unlockMoney:15000000, unlockAct:2,
    desc:'金湾区的金融丛林，数字在屏幕上跳动间就是亿万的博弈。高风险，高智商，更高回报。',
    levels:[
      { level:1, name:'小额试水', income:0.40, cost:0 },
      { level:2, name:'私募基金', income:1.0, cost:2000 },
      { level:3, name:'量化交易系统', income:2.2, cost:5500 },
      { level:4, name:'对冲基金', income:4.5, cost:22000 },
      { level:5, name:'金融帝国', income:8.0, cost:55000 },
      { level:6, name:'量化2.0', income:10.5, cost:110000, reqCond:{ techLv:3 } },
      { level:7, name:'全球配置', income:13.0, cost:220000, reqCond:{ techLv:5, npcFavor:{ chenzong:50 } } },
      { level:8, name:'跨境金融', income:15.5, cost:450000, reqCond:{ techLv:6 } },
      { level:9, name:'衍生品帝国', income:18.0, cost:900000, reqCond:{ techLv:8, rep:75 } },
      { level:10, name:'金融王朝', income:21.0, cost:1800000, reqCond:{ techLv:9, rep:85 } },
    ]
  },
  {
    id:'media', name:'媒体矩阵', icon:'📺', regions:['jinxiu'], techTree:'digital',
    unlockMoney:50000000, unlockAct:3,
    desc:'锦绣区的舆论战场，一条爆款可以改变一家公司的命运。流量就是新时代的石油。',
    levels:[
      { level:1, name:'自媒体账号', income:0.50, cost:0 },
      { level:2, name:'MCN机构', income:1.20, cost:5500 },
      { level:3, name:'垂直媒体', income:2.80, cost:14000 },
      { level:4, name:'全媒体矩阵', income:5.50, cost:50000 },
      { level:5, name:'媒体帝国', income:9.00, cost:120000 },
      { level:6, name:'直播电商', income:11.00, cost:250000, reqCond:{ techLv:2, npcFavor:{ zhangye:40 } } },
      { level:7, name:'短视频生态', income:13.00, cost:500000, reqCond:{ techLv:4 } },
      { level:8, name:'内容AI工厂', income:14.50, cost:1000000, reqCond:{ techLv:5 } },
      { level:9, name:'文化输出平台', income:16.00, cost:2000000, reqCond:{ techLv:7, rep:70 } },
      { level:10, name:'传媒王朝', income:18.00, cost:4000000, reqCond:{ techLv:9, rep:80 } },
    ]
  },
  {
    id:'food_chain', name:'餐饮连锁', icon:'🍽️', regions:['yongning','jinxiu'], techTree:'digital',
    unlockMoney:800000, unlockAct:0,
    desc:'从街头小吃到连锁品牌，每一道菜都承载着城市的烟火气。永宁区的老味道，锦绣区的新风尚。',
    levels:[
      { level:1, name:'街头小吃摊', income:0.18, cost:0 },
      { level:2, name:'社区餐厅', income:0.30, cost:140 },
      { level:3, name:'连锁品牌(5家)', income:0.55, cost:550 },
      { level:4, name:'区域餐饮集团', income:1.0, cost:2500 },
      { level:5, name:'城市美食地标', income:1.8, cost:7000 },
      { level:6, name:'中央厨房', income:2.5, cost:15000, reqCond:{ techLv:2 } },
      { level:7, name:'预制菜品牌', income:3.2, cost:30000, reqCond:{ techLv:4 } },
      { level:8, name:'餐饮数字化', income:4.0, cost:60000, reqCond:{ techLv:5, npcFavor:{ zhaolei:40 } } },
      { level:9, name:'美食生态链', income:5.0, cost:120000, reqCond:{ techLv:7 } },
      { level:10, name:'食神帝国', income:6.0, cost:250000, reqCond:{ techLv:9, rep:65 } },
    ]
  },
  {
    id:'new_energy', name:'新能源开发', icon:'⚡', regions:['tiexi','xinghai'], techTree:'ai',
    unlockMoney:12000000, unlockAct:3,
    desc:'铁西区的烟囱与星海区的光伏板，新旧能源的交汇。政府补贴是这个行业最好的催化剂。',
    levels:[
      { level:1, name:'小型光伏电站', income:0.18, cost:0 },
      { level:2, name:'风电项目', income:0.40, cost:400 },
      { level:3, name:'储能电站', income:0.80, cost:1400 },
      { level:4, name:'区域能源网络', income:1.8, cost:6000 },
      { level:5, name:'绿色能源巨头', income:4.0, cost:18000 },
      { level:6, name:'氢能实验站', income:5.5, cost:38000, reqCond:{ techLv:2 } },
      { level:7, name:'碳交易平台', income:7.0, cost:75000, reqCond:{ techLv:4, rep:50 } },
      { level:8, name:'虚拟电厂', income:8.5, cost:150000, reqCond:{ techLv:5 } },
      { level:9, name:'绿色电网', income:10.0, cost:300000, reqCond:{ techLv:7, npcFavor:{ lichu:40 } } },
      { level:10, name:'能源新纪元', income:11.5, cost:600000, reqCond:{ techLv:9, rep:75 } },
    ]
  },
]
