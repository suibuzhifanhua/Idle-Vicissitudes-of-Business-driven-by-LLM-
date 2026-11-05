// Author: Fisheep.L
// ==================================================
// data-origins.js — 出身/角色定义（深化版）
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
    // 深化：专属事件线 + 限定
    exclusiveEvents: [
      'elite_old_colleague',   // 前同事求助/合作事件线
      'elite_tech_circle',     // 技术圈人脉事件线
      'elite_vest_stock',      // 大厂期权变现事件线
    ],
    restrictedBiz: [],           // 不限制业务
    bonusBiz: ['tech'],          // 加成业务
    bonusResearch: ['ai'],       // 加成研发路线
    npcBonus: { zhaolei: 15 },   // 初始NPC好感加成
  },
  {
    id:'sales', name:'销售奇才', icon:'🤝',
    money:500000, reputation:40, stress:15, connections:30,
    stats:{ management:3, tech:1, social:5, finance:2 },
    bonus:{ retailIncome:1.25, hireSpeed:1.2 },
    special:'零售类业务收益+25%，员工招聘速度+20%',
    desc:'你是某知名快消品公司的王牌销售，手握大量客户资源。与老板分红分歧后，带着客户名单自立门户。',
    defaultName:'陈明',
    exclusiveEvents: [
      'sales_client_list',      // 客户名单争夺事件线
      'sales_franchise',        // 加盟扩展事件线
      'sales_trade_war',        // 商业攻防事件线
    ],
    restrictedBiz: [],
    bonusBiz: ['retail','food_chain'],
    bonusResearch: ['digital'],
    npcBonus: { sujie: 10, zhangye: 10 },
  },
  {
    id:'tech', name:'技术极客', icon:'🔬',
    money:400000, reputation:20, stress:25, connections:8,
    stats:{ management:2, tech:5, social:1, finance:2 },
    bonus:{ techRdSpeed:1.3, burnoutProb:0.9 },
    special:'科技类研发速度+30%，员工Burnout概率-10%',
    desc:'你是新海市AI研究院的研究员，手握多项专利。看到研究成果被商业化剥削后，决定自己创业。',
    defaultName:'苏翼',
    exclusiveEvents: [
      'tech_patent_dispute',    // 专利纠纷事件线
      'tech_breakthrough',      // 技术突破事件线
      'tech_open_source_choice',// 开源vs闭源抉择事件线
    ],
    restrictedBiz: [],           // 不限制业务
    bonusBiz: ['tech','new_energy'],
    bonusResearch: ['ai'],
    npcBonus: { zhaolei: 20, linjiaoshou: 10 },
  },
  {
    id:'rich2nd', name:'富二代', icon:'💎',
    money:2000000, reputation:10, stress:35, connections:40,
    stats:{ management:2, tech:1, social:4, finance:3 },
    bonus:{ unlockCost:0.8, repGain:0.7 },
    special:'所有业务解锁价格-20%，但声誉获取速度-30%',
    desc:'你出身新海市商业世家，父亲是海天集团创始人陈志远的老朋友。带着200万启动资金，证明自己不靠家族。',
    defaultName:'陈思远',
    exclusiveEvents: [
      'rich2_family_shadow',    // 家族阴影事件线
      'rich2_inheritance',      // 继承权博弈事件线
      'rich2_prove_self',       // 证明自己事件线
    ],
    restrictedBiz: [],
    bonusBiz: ['office','fund'],
    bonusResearch: ['blockchain'],
    npcBonus: { chenzong: 10, qianlaoban: 15, jinhangzhang: 10 },
  },
]

// ========== 出身专属事件定义 ==========
var ORIGIN_EVENTS = {
  // 大厂精英专属
  elite_old_colleague: [
    { actMin:1, text:'你的前同事小王找到你，说他被裁员了想加入你的公司。', choices:[{text:'欢迎加入',effect:{empAdd:'developer'}},{text:'婉拒',effect:{stress:-3}}] },
    { actMin:2, text:'前公司HR打来电话，想高价挖你回去当总监。', choices:[{text:'拒绝（+声誉）',effect:{reputation:5}},{text:'考虑一下（-压力）',effect:{stress:-5}}] },
    { actMin:3, text:'前同事赵磊邀请你参加技术圈年度聚会，认识了不少大佬。', choices:[{text:'积极参加',effect:{connections:8,reputation:5}}] },
  ],
  elite_tech_circle: [
    { actMin:1, text:'技术社区里有人讨论你的产品，获得了不少关注。', effect:{reputation:3,techIncome:0.02,duration:10} },
    { actMin:2, text:'你受邀在技术大会上做分享，台下坐满了投资人。', choices:[{text:'重点讲技术',effect:{reputation:5,connections:3}},{text:'重点讲商业',effect:{money:80000,connections:5}}] },
  ],
  elite_vest_stock: [
    { actMin:1, text:'前公司期权到期，你可以选择变现。', choices:[{text:'立即变现（+50万）',effect:{money:500000}},{text:'继续持有等涨',effect:{money:800000,risk:0.3}}] },
    { actMin:3, text:'前公司准备IPO，你的期权价值暴涨！', effect:{money:1000000,reputation:10} },
  ],

  // 销售奇才专属
  sales_client_list: [
    { actMin:1, text:'老东家发现你带走了客户名单，发来了律师函。', choices:[{text:'请王律师处理',effect:{money:-50000,reputation:3}},{text:'归还名单',effect:{connections:-10}}] },
    { actMin:2, text:'几个大客户主动联系你，说更愿意跟着你合作。', effect:{money:100000,connections:5} },
  ],
  sales_franchise: [
    { actMin:2, text:'有人想加盟你的品牌开分店。', choices:[{text:'开放加盟',effect:{money:200000,retailIncome:0.05}},{text:'坚持直营',effect:{reputation:5}}] },
    { actMin:3, text:'加盟店出了品质问题，影响品牌声誉。', choices:[{text:'严查整顿',effect:{money:-80000,reputation:5}},{text:'赔偿了事',effect:{money:-150000,reputation:-3}}] },
  ],
  sales_trade_war: [
    { actMin:2, text:'竞争对手在核心客户面前抹黑你。', choices:[{text:'正面回应',effect:{reputation:5,stress:8}},{text:'用业绩说话',effect:{money:100000}}] },
  ],

  // 技术极客专属
  tech_patent_dispute: [
    { actMin:1, text:'你发现有人侵犯了你的专利技术。', choices:[{text:'起诉维权',effect:{money:-30000,risk:0.4,sucEffect:{money:200000,reputation:8}}},{text:'技术升级甩开',effect:{rpt:5}}] },
    { actMin:3, text:'专利诉讼赢了！行业对你的技术更加敬畏。', effect:{reputation:15,techIncome:0.05} },
  ],
  tech_breakthrough: [
    { actMin:2, text:'你在实验室里取得了意外突破！', choices:[{text:'立即商业化',effect:{money:200000,techIncome:0.08}},{text:'继续研究',effect:{rpt:15}}] },
  ],
  tech_open_source_choice: [
    { actMin:2, text:'你的核心技术面临开源还是闭源的抉择。', choices:[{text:'开源聚人气',effect:{connections:10,competitorImitation:0.1}},{text:'闭源保壁垒',effect:{techIncome:0.1,reputation:5}}] },
  ],

  // 富二代专属
  rich2_family_shadow: [
    { actMin:1, text:'媒体曝光了你的家世背景，质疑你是否靠实力。', effect:{reputation:-5,stress:10} },
    { actMin:2, text:'家族长辈暗示可以帮你打通关系。', choices:[{text:'接受帮助',effect:{connections:15,reputation:-8}},{text:'婉言谢绝',effect:{reputation:10,stress:5}}] },
  ],
  rich2_inheritance: [
    { actMin:2, text:'家族内部对继承权产生了分歧，你需要表态。', choices:[{text:'争取继承',effect:{money:500000,stress:15}},{text:'放弃继承专注事业',effect:{reputation:15}}] },
    { actMin:3, text:'无论结果如何，你已经在商界站稳了脚跟。', effect:{reputation:20,money:300000} },
  ],
  rich2_prove_self: [
    { actMin:1, text:'陈总公开说"不靠家族的年轻人更值得尊敬"。', effect:{reputation:5} },
    { actMin:2, text:'你独立完成的商业项目获得了行业大奖。', effect:{reputation:15,money:200000,connections:8} },
  ],
};
