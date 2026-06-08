// ==================================================
// data-origins.js — 出身/角色定义
// ==================================================

// ---- 出身 ----
var ORIGINS = [
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
]
