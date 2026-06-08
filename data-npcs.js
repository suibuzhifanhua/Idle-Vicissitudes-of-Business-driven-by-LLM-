// ==================================================
// data-npcs.js — NPC 数据定义
// ==================================================

var NPC_DEFAULTS = {
  favorLevels: ['敌对','冷淡','中立','友好','亲密'],
};

var NPCS = {
  zhaolei: {
    id:'zhaolei', name:'赵磊', title:'星辰科技创始人',
    actUnlock:0, initFavor:30,
    desc:'35岁，技术理想主义+逐渐现实，前同事',
    ...NPC_DEFAULTS,
    dialogTypes:['greeting','request','cooperation','betray','final'],
    giftPreferences: { love:['tech','book'], like:['art'], neutral:['wine','luxury'] },
    giftQuote: '老赵对科技产品和新书总是爱不释手。',
    questLines: [
      {
        id: 'zhaolei_q1', name: '旧同事的重逢', desc: '赵磊想拉你一起做项目',
        reqFavor: 20,
        steps: [
          { text: '赵磊找到你，说有个技术合作的机会', reward: { money: 50000 } },
          { text: '项目进展顺利，赵磊对你刮目相看', reward: { npcFavor: { zhaolei: 10 } } },
          { text: '合作完成，赵磊推荐你进入技术圈', reward: { connections: 5, npcFavor: { zhaolei: 15 } } },
        ]
      },
      {
        id: 'zhaolei_q2', name: '技术难题求助', desc: '赵磊遇到技术瓶颈，需要你的帮助',
        reqFavor: 35,
        steps: [
          { text: '赵磊深夜打电话，说系统出了大问题', reward: { stress: 5 } },
          { text: '你帮忙排查了三天，终于定位到bug', reward: { npcFavor: { zhaolei: 15 }, reputation: 3 } },
          { text: '赵磊请你吃饭表示感谢，透露了行业内部消息', reward: { connections: 3, money: 20000 } },
        ]
      },
      {
        id: 'zhaolei_q3', name: '创业路演邀请', desc: '赵磊邀请你参加创业路演活动',
        reqFavor: 50,
        steps: [
          { text: '赵磊发来路演邀请函，希望你去当评委', reward: { reputation: 5 } },
          { text: '你在路演上认识了多位投资人', reward: { connections: 8, reputation: 5 } },
          { text: '一个创业者对你的公司很感兴趣，想谈合作', reward: { money: 100000, connections: 5 } },
        ]
      },
      {
        id: 'zhaolei_q4', name: '星辰科技的危机', desc: '赵磊的公司遭遇竞争对手恶意攻击',
        reqFavor: 65,
        steps: [
          { text: '赵磊告诉你有人在网上散布关于星辰科技的谣言', reward: { stress: 10 } },
          { text: '你动用人脉帮他澄清了事实', reward: { npcFavor: { zhaolei: 20 }, reputation: 8 } },
          { text: '赵磊表示欠你一个人情，承诺未来全力支持', reward: { connections: 10, npcFavor: { zhaolei: 10 } } },
        ]
      },
    ],
      relations: [
    {npcId:'qianlaoban',type:'ally',intensity:1.0},
    {npcId:'linjiaoshou',type:'ally',intensity:0.8},
    {npcId:'chenzong',type:'rival',intensity:0.7},
    {npcId:'zhangye',type:'neutral',intensity:0.5}
  ],
      relations: [
    {npcId:'majizhe',type:'ally',intensity:1.2},
    {npcId:'chenzong',type:'neutral',intensity:0.8},
    {npcId:'zhaolei',type:'neutral',intensity:0.5},
    {npcId:'qianlaoban',type:'neutral',intensity:0.6}
  ],
      relations: [
    {npcId:'zhaolei',type:'rival',intensity:1.0},
    {npcId:'xiaoc',type:'rival',intensity:0.9},
    {npcId:'lichu',type:'ally',intensity:0.6},
    {npcId:'qianlaoban',type:'neutral',intensity:0.7}
  ],
      relations: [
    {npcId:'chenzong',type:'rival',intensity:0.9},
    {npcId:'linjiaoshou',type:'ally',intensity:0.7},
    {npcId:'zhangye',type:'neutral',intensity:0.5}
  ],
      relations: [
    {npcId:'zhaolei',type:'ally',intensity:0.8},
    {npcId:'xiaoc',type:'ally',intensity:0.7},
    {npcId:'sunmishu',type:'neutral',intensity:0.6}
  ],
      relations: [
    {npcId:'zhangye',type:'ally',intensity:1.2},
    {npcId:'chenzong',type:'rival',intensity:0.6}
  ],
      relations: [
    {npcId:'jinhangzhang',type:'rival',intensity:0.8},
    {npcId:'zhaolei',type:'ally',intensity:1.0},
    {npcId:'chenzong',type:'neutral',intensity:0.7}
  ],
      relations: [
    {npcId:'lichu',type:'ally',intensity:0.8},
    {npcId:'linjiaoshou',type:'neutral',intensity:0.6}
  ],
    npcLinks: { zhangye: 0.3, linjiaoshou: 0.2 },
  },
  lichu: {
    id:'lichu', name:'李处', title:'商务局科长',
    actUnlock:0, initFavor:0,
    desc:'48岁，规则守护者、偶尔通融',
    ...NPC_DEFAULTS,
    dialogTypes:['greeting','approval','subsidy','inspect','info'],
    giftPreferences: { love:['wine','book'], like:['art'], neutral:['tech','luxury'] },
    giftQuote: '李处清廉半生，只对好酒和好书网开一面。',
    questLines: [
      {
        id: 'lichu_q1', name: '初次登门拜访', desc: '你需要去商务局办理公司注册相关手续',
        reqFavor: 10,
        steps: [
          { text: '来到商务局大厅，排队等待', reward: { stress: 5 } },
          { text: '终于见到李处，他态度公事公办', reward: { npcFavor: { lichu: 5 } } },
          { text: '手续顺利办完，李处暗示以后有事可以找他', reward: { connections: 2, npcFavor: { lichu: 8 } } },
        ]
      },
      {
        id: 'lichu_q2', name: '政策补贴申请', desc: '符合条件的企业可以申请创业补贴',
        reqFavor: 30,
        steps: [
          { text: '李处告诉你最近有科技创新补贴名额', reward: {} },
          { text: '你准备了大量材料提交申请', reward: { stress: 8 } },
          { text: '审批通过！拿到补贴款', reward: { money: 200000, npcFavor: { lichu: 12 } } },
        ]
      },
      {
        id: 'lichu_q3', name: '合规检查风波', desc: '公司面临突击合规检查',
        reqFavor: 45,
        steps: [
          { text: '接到通知，明天商务局要来检查', reward: { stress: 15 } },
          { text: '你连夜整理材料，确保一切规范', reward: { stress: 5 } },
          { text: '检查顺利通过，李处私下给你提了些建议', reward: { reputation: 5, npcFavor: { lichu: 15 } } },
        ]
      },
      {
        id: 'lichu_q4', name: '招商引资推介会', desc: '李处邀请你参加市里招商活动',
        reqFavor: 60,
        steps: [
          { text: '收到正式邀请函，参加市招商引资大会', reward: { reputation: 8 } },
          { text: '会上你做了简短发言，获得关注', reward: { connections: 6, reputation: 5 } },
          { text: '会后多位领导对你表示认可，李处引荐了关键人物', reward: { connections: 10, money: 50000 } },
        ]
      },
    ],
      relations: [
    {npcId:'wanglvshi',type:'rival',intensity:0.9},
    {npcId:'chenzong',type:'ally',intensity:0.6},
    {npcId:'sunmishu',type:'ally',intensity:0.8},
    {npcId:'jinhangzhang',type:'neutral',intensity:0.5}
  ],
      relations: [
    {npcId:'lichu',type:'rival',intensity:0.9},
    {npcId:'liukuaiji',type:'ally',intensity:0.8},
    {npcId:'chenzong',type:'neutral',intensity:0.6}
  ],
      relations: [
    {npcId:'qianlaoban',type:'rival',intensity:0.8},
    {npcId:'liukuaiji',type:'ally',intensity:0.9},
    {npcId:'lichu',type:'neutral',intensity:0.5}
  ],
      relations: [
    {npcId:'wanglvshi',type:'ally',intensity:0.8},
    {npcId:'jinhangzhang',type:'ally',intensity:0.9}
  ],
    npcLinks: { chenzong: 0.2, wanglvshi: 0.25 },
  },
  zhangye: {
    id:'zhangye', name:'张野', title:'永安传媒创始人',
    actUnlock:1, initFavor:10,
    desc:'40岁，八面玲珑、信息贩子，唯一可花钱买好感',
    ...NPC_DEFAULTS,
    dialogTypes:['greeting','dealing','hype','buyInfo'],
    giftPreferences: { love:['luxury','art'], like:['wine'], neutral:['tech','book'] },
    giftQuote: '张野这人，奢侈品和艺术品送到心坎上，什么都好谈。',
    questLines: [
      {
        id: 'zhangye_q1', name: '信息贩子的第一笔交易', desc: '张野说有独家消息想卖给你',
        reqFavor: 15,
        steps: [
          { text: '张野神神秘秘地找到你："有个人想买你的公司信息"', reward: { stress: 5 } },
          { text: '你花了一笔钱买了下来，发现是陈总在暗中调查你', reward: { money: -30000, npcFavor: { zhangye: 8 } } },
          { text: '有了准备，你成功化解了陈总的第一次试探', reward: { reputation: 5, npcFavor: { chenzong: 3 } } },
        ]
      },
      {
        id: 'zhangye_q2', name: '媒体曝光危机公关', desc: '有人要爆你公司的黑料，张野可以帮忙压下去',
        reqFavor: 30,
        steps: [
          { text: '张野告诉你有人在收集你公司的负面材料', reward: { stress: 10 } },
          { text: '他开价帮你处理这件事', reward: { money: -50000 } },
          { text: '事情摆平了，张野表示以后这类事找他打八折', reward: { reputation: 5, npcFavor: { zhangye: 12 } } },
        ]
      },
      {
        id: 'zhangye_q3', name: '商业情报网络', desc: '张野想拉你进入他的信息共享圈子',
        reqFavor: 50,
        steps: [
          { text: '张野邀请你加入一个私密商业信息群', reward: {} },
          { text: '群里经常分享有价值的行业动态', reward: { connections: 5, reputation: 3 } },
          { text: '你在群里获得了一条关键投资信息', reward: { money: 150000, connections: 8 } },
        ]
      },
      {
        id: 'zhangye_q4', name: '永安传媒的合作提案', desc: '张野提出用他的媒体资源为你做推广',
        reqFavor: 70,
        steps: [
          { text: '张野提出一个互惠互利的媒体合作方案', reward: {} },
          { text: '你投入了推广费用', reward: { money: -80000 } },
          { text: '效果显著，公司知名度大幅提升', reward: { reputation: 15, connections: 10, money: 200000 } },
        ]
      },
    ],
    npcLinks: { zhaolei: 0.2, majizhe: 0.4, chenzong: 0.15 },
  },
  chenzong: {
    id:'chenzong', name:'陈总', title:'海天集团董事长',
    actUnlock:1, initFavor:0,
    desc:'58岁，城府极深、利益导向、表面和善',
    ...NPC_DEFAULTS,
    dialogTypes:['greeting','threat','oliveBranch','cooperation','secret','heir'],
    giftPreferences: { love:['art','luxury'], like:['wine'], neutral:['tech','book'] },
    giftQuote: '陈总阅尽千帆，只有顶级艺术品和奢侈品能入他法眼。',
    questLines: [
      {
        id: 'chenzong_q1', name: '橄榄枝', desc: '陈总主动约你见面，表面客气',
        reqFavor: 15,
        steps: [
          { text: '收到海天集团的正式邀请函', reward: { stress: 8 } },
          { text: '在豪华会客室见到陈总，他笑容可掬', reward: { npcFavor: { chenzong: 5 } } },
          { text: '陈总提出收购意向，你委婉拒绝但保持联系', reward: { reputation: 5, connections: 3 } },
        ]
      },
      {
        id: 'chenzong_q2', name: '暗流涌动', desc: '发现陈总在背后搞小动作',
        reqFavor: 30,
        steps: [
          { text: '你的一个关键供应商突然断供，线索指向海天集团', reward: { stress: 15, money: -50000 } },
          { text: '你收集证据准备应对', reward: { stress: 5 } },
          { text: '你直接找陈总摊牌，他否认但你展示了证据', reward: { npcFavor: { chenzong: -10 }, reputation: 5 } },
          { text: '陈总暂时收手，但你们的关系彻底变了', reward: {} },
        ]
      },
      {
        id: 'chenzong_q3', name: '利益交换', desc: '在某些项目上与陈总既竞争又合作',
        reqFavor: 50,
        steps: [
          { text: '市政府招标一个大项目，你和海天都在竞标', reward: { stress: 10 } },
          { text: '陈总私下找到你提议各退一步，分区合作', reward: {} },
          { text: '谈判成功，双方各得一块业务', reward: { money: 300000, connections: 5 } },
        ]
      },
      {
        id: 'chenzong_q4', name: '继承人之谜', desc: '关于陈总继承人的传闻引发行业震动',
        reqFavor: 70,
        steps: [
          { text: '张野告诉你陈总身体出了问题，正在选继承人', reward: {} },
          { text: '各方势力开始蠢蠢欲动', reward: { stress: 10, connections: 5 } },
          { text: '陈总公开宣布继承人决定，结果出人意料', reward: { reputation: 10, npcFavor: { chenzong: 15 } } },
        ]
      },
    ],
    npcLinks: { zhangye: 0.2, lichu: 0.15, xiaoc: 0.25 },
  },
  xiaoc: {
    id:'xiaoc', name:'小C', title:'神秘投资人代表',
    actUnlock:2, initFavor:0,
    desc:'28岁，冷静、神秘、专业，好感只能通过正确决策提升',
    ...NPC_DEFAULTS,
    dialogTypes:['greeting','offer','condition','final'],
    giftPreferences: { love:['book','tech'], like:['art'], neutral:['wine','luxury'] },
    giftQuote: '小C欣赏聪明人，好书和前沿科技比钱更能打动TA。',
    questLines: [
      {
        id: 'xiaoc_q1', name: '神秘来电', desc: '一个自称小C的人联系了你',
        reqFavor: 10,
        steps: [
          { text: '收到一封匿名邮件，约你在咖啡厅见面', reward: { stress: 5 } },
          { text: '见到小C，TA开门见山说代表一个投资基金', reward: { npcFavor: { xiaoc: 5 } } },
          { text: '小C表示会持续关注你的表现', reward: { connections: 3, reputation: 5 } },
        ]
      },
      {
        id: 'xiaoc_q2', name: '投资条款谈判', desc: '小C提出正式的投资意向',
        reqFavor: 30,
        steps: [
          { text: '小C发来一份投资意向书，条件很苛刻', reward: { stress: 10 } },
          { text: '你逐条研究，准备了反提案', reward: {} },
          { text: '多轮谈判后达成一致', reward: { money: 500000, connections: 8 } },
        ]
      },
      {
        id: 'xiaoc_q3', name: '尽职调查', desc: '投资方要对你的公司做全面调查',
        reqFavor: 50,
        steps: [
          { text: '小C通知你尽职调查团队即将进驻', reward: { stress: 15 } },
          { text: '一周的审查，每个细节都被翻了个遍', reward: { stress: 10 } },
          { text: '调查通过！投资款到账', reward: { money: 1000000, reputation: 10, connections: 10 } },
        ]
      },
      {
        id: 'xiaoc_q4', name: '董事会的暗战', desc: '作为被投企业，你需要应对投资人层面的博弈',
        reqFavor: 70,
        steps: [
          { text: '小C告诉你基金内部对公司方向有分歧', reward: { stress: 10 } },
          { text: '你需要站队表态，这会影响后续资源分配', reward: {} },
          { text: '你的选择获得了更多支持，公司获得追加投资', reward: { money: 800000, reputation: 15 } },
        ]
      },
    ],
    npcLinks: { chenzong: 0.2, linjiaoshou: 0.15, zhangye: 0.1 },
  },
  wanglvshi: {
    id:'wanglvshi', name:'王律师', title:'正和法律事务所合伙人',
    actUnlock:1, initFavor:5,
    desc:'42岁，精明务实的商业律师，好感度高可减少负面事件法律影响',
    ...NPC_DEFAULTS,
    dialogTypes:['greeting','consult','warn','defend'],
    giftPreferences: { love:['book','wine'], like:['tech'], neutral:['art','luxury'] },
    giftQuote: '王律师是文化人，精装典籍和年份好酒最合他心意。',
    dialogs:{
      greeting:['王律师推了推眼镜："林总，最近商场上不太平啊，有什么需要我帮忙的吗？"','王律师正在翻阅文件，抬头看到你："来得正好，有几份合同需要你过目。"'],
      consult:['"从法律角度看，这个条款对你不利。建议修改第3条和第7条。"','"这个案子我有七成把握，但需要你提供更多证据材料。"'],
      warn:['"我收到风声，有人在背后搞小动作。林总你得小心了。"','"合规问题不能拖，越拖越麻烦。现在处理还来得及。"'],
    },
    questLines: [
      {
        id: 'wanglvshi_q1', name: '第一份合同', desc: '公司成立初期需要法律咨询',
        reqFavor: 10,
        steps: [
          { text: '通过朋友介绍认识了王律师', reward: { connections: 2 } },
          { text: '王律师帮你审阅了公司章程和首份合同', reward: { npcFavor: { wanglvshi: 8 } } },
          { text: '王律师发现合同里的几个隐患条款，帮你规避了风险', reward: { reputation: 3, npcFavor: { wanglvshi: 10 } } },
        ]
      },
      {
        id: 'wanglvshi_q2', name: '劳动纠纷', desc: '前员工提起劳动仲裁',
        reqFavor: 30,
        steps: [
          { text: '收到仲裁通知书，一个离职员工告公司违法辞退', reward: { stress: 15, money: -20000 } },
          { text: '王律师帮你整理证据准备应诉', reward: {} },
          { text: '调解成功，以较小代价解决', reward: { money: -30000, npcFavor: { wanglvshi: 12 } } },
        ]
      },
      {
        id: 'wanglvshi_q3', name: '知识产权保卫战', desc: '竞争对手抄袭你的核心技术',
        reqFavor: 50,
        steps: [
          { text: '发现市面上一款产品高度疑似抄袭你的技术', reward: { stress: 10 } },
          { text: '王律师建议先发律师函，同时收集证据', reward: {} },
          { text: '对方主动求和，达成授权协议', reward: { money: 200000, reputation: 8, npcFavor: { wanglvshi: 15 } } },
        ]
      },
      {
        id: 'wanglvshi_q4', name: '并购法律顾问', desc: '公司进入并购谈判阶段，需要顶级法律支持',
        reqFavor: 70,
        steps: [
          { text: '有公司提出收购要约，你请王律师担任首席法律顾问', reward: {} },
          { text: '复杂的尽职调查和条款博弈持续了一个月', reward: { stress: 15 } },
          { text: '交易完成，王律师的团队功不可没', reward: { money: 500000, reputation: 15, connections: 8 } },
        ]
      },
    ],
    npcLinks: { lichu: 0.3, chenzong: 0.15, zhangye: 0.1 },
  },
  linjiaoshou: {
    id:'linjiaoshou', name:'林教授', title:'新海商学院副院长',
    actUnlock:2, initFavor:15,
    desc:'55岁，桃李满天下，好感度高可获得技能点加成指导',
    ...NPC_DEFAULTS,
    dialogTypes:['greeting','lecture','mentor','recommend'],
    giftPreferences: { love:['book','art'], like:['wine'], neutral:['tech','luxury'] },
    giftQuote: '林教授书房里全是书和字画，送这些准没错。',
    dialogs:{
      greeting:['林教授在办公室看书，见你来微微一笑："小林啊，最近在商场上摸爬滚打，有什么感悟？"','"来来来，坐。我刚好在研究新海市最新的商业案例，你的公司也在其中。"'],
      lecture:['"经商和做人一样，急不得。你看那些做得久的，都是稳扎稳打。"','"我给你讲个案例：十年前有个年轻人，和你现在一模一样……"'],
      recommend:['"我有个学生在做风投，我觉得你们可以聊聊。对你有帮助。"','"新海市最近有个政策动向，我觉得你该关注一下。要不要我帮你引荐几个人？"'],
    },
    questLines: [
      {
        id: 'linjiaoshou_q1', name: '师门渊源', desc: '林教授听说你也姓林，对你另眼相看',
        reqFavor: 15,
        steps: [
          { text: '在一次商业论坛上偶遇林教授，他对你很感兴趣', reward: { npcFavor: { linjiaoshou: 8 } } },
          { text: '林教授邀请你去他办公室喝茶聊天', reward: { connections: 3 } },
          { text: '林教授表示愿意做你的商业导师', reward: { reputation: 5, npcFavor: { linjiaoshou: 12 } } },
        ]
      },
      {
        id: 'linjiaoshou_q2', name: 'EMBA课程推荐', desc: '林教授推荐你参加商学院高级研修班',
        reqFavor: 35,
        steps: [
          { text: '林教授建议你去读EMBA，扩展人脉圈', reward: {} },
          { text: '你在班上认识了各行各业的精英', reward: { connections: 10, reputation: 5 } },
          { text: '毕业项目获得优秀评价，林教授亲自颁奖', reward: { connections: 5, reputation: 8, npcFavor: { linjiaoshou: 15 } } },
        ]
      },
      {
        id: 'linjiaoshou_q3', name: '学术讲座邀请', desc: '林教授请你去商学院给学员做分享',
        reqFavor: 55,
        steps: [
          { text: '林教授邀请你作为创业代表在商学院做演讲', reward: { stress: 8, reputation: 5 } },
          { text: '演讲反响热烈，多位学员想和你深入交流', reward: { connections: 8, reputation: 8 } },
          { text: '有企业家听了你的分享后提出合作意向', reward: { money: 150000, connections: 5 } },
        ]
      },
      {
        id: 'linjiaoshou_q4', name: '智库顾问聘书', desc: '林教授推荐你成为市政府智库成员',
        reqFavor: 75,
        steps: [
          { text: '林教授告诉你市政府正在组建企业咨询智库', reward: {} },
          { text: '经过层层筛选，你成功入选', reward: { reputation: 15, connections: 12 } },
          { text: '你的建议被写入政策文件，影响力大增', reward: { reputation: 20, money: 100000, npcFavor: { linjiaoshou: 20 } } },
        ]
      },
    ],
    npcLinks: { zhaolei: 0.2, xiaoc: 0.15, lichu: 0.1 },
  },
  majizhe: {
    id:'majizhe', name:'马记者', title:'新海财经周刊首席记者',
    actUnlock:1, initFavor:10,
    desc:'33岁，笔锋犀利，好感度影响声誉获取效率',
    ...NPC_DEFAULTS,
    dialogTypes:['greeting','interview','tip','expose'],
    giftPreferences: { love:['tech','book'], like:['art'], neutral:['wine','luxury'] },
    giftQuote: '马记者对新科技产品和独家资料没有抵抗力。',
    dialogs:{
      greeting:['马记者拿着录音笔走过来："林总，方便聊几句吗？最近你的公司在业内口碑不错。"','"嗨，又见面了。我今天不是来采访的，就是想跟你随便聊聊。"'],
      interview:['"读者想知道：你的公司凭什么在新海市站稳脚跟？"','"有传闻说你和陈总有些摩擦？方便回应一下吗？"'],
      tip:['"有个消息提前告诉你：下期我们要做一个行业专题，如果你愿意配合，我可以把你放在正面案例里。"','"最近有人在媒体上黑你，我听到了风声。要不要我帮你查查是谁？"'],
    },
    questLines: [
      {
        id: 'majizhe_q1', name: '首次采访', desc: '马记者想采访你这个新兴创业者',
        reqFavor: 15,
        steps: [
          { text: '马记者发来采访邀约，想做一期创业者专题', reward: { stress: 5 } },
          { text: '你准备了采访提纲和公司材料', reward: {} },
          { text: '文章刊出后反响不错，更多人知道了你的公司', reward: { reputation: 8, connections: 3, npcFavor: { majizhe: 10 } } },
        ]
      },
      {
        id: 'majizhe_q2', name: '负面新闻危机', desc: '网上出现关于你公司的负面帖文',
        reqFavor: 30,
        steps: [
          { text: '一篇匿名文章在网上疯传，指控你的产品质量有问题', reward: { stress: 15, reputation: -5, money: -30000 } },
          { text: '马记者主动联系你，表示可以帮你调查来源', reward: {} },
          { text: '查清是有竞争对手在背后操作，马记者帮你发了澄清报道', reward: { reputation: 10, npcFavor: { majizhe: 15 } } },
        ]
      },
      {
        id: 'majizhe_q3', name: '行业年度人物评选', desc: '新海财经周刊举办年度商业人物评选',
        reqFavor: 50,
        steps: [
          { text: '马记者通知你入选年度商业人物候选名单', reward: { reputation: 5 } },
          { text: '你需要准备参选材料和公众展示', reward: { stress: 8 } },
          { text: '最终获奖！颁奖典礼上发表了感言', reward: { reputation: 20, money: 50000, connections: 8, npcFavor: { majizhe: 12 } } },
        ]
      },
      {
        id: 'majizhe_q4', name: '深度报道合作', desc: '马记者想做一个关于创业生态的深度系列',
        reqFavor: 70,
        steps: [
          { text: '马记者提出以你为主角做一组深度报道', reward: { stress: 5 } },
          { text: '持续两周的跟踪采访，深入公司每个角落', reward: { stress: 10 } },
          { text: '系列文章引发广泛关注，投资人和客户主动找上门', reward: { reputation: 25, money: 200000, connections: 15 } },
        ]
      },
    ],
    npcLinks: { zhangye: 0.35, chenzong: 0.1, xiaoc: 0.1 },
  },

  // ===== 第二轮新增 NPC（6位）=====
  sujie: {
    id:'sujie', name:'苏姐', title:'锐思猎头合伙人',
    actUnlock:0, initFavor:10,
    desc:'45岁，新海最顶尖的猎头，人脉极广，能用三句话判断一个人值不值',
    ...NPC_DEFAULTS,
    dialogTypes:['greeting','headhunt','talent','recommend'],
    giftPreferences: { love:['luxury','art'], like:['book'], neutral:['wine','tech'] },
    giftQuote: '苏姐阅人无数，奢侈品和艺术品味是你唯一能让她正眼相看的东西。',
    dialogs:{
      greeting:['苏姐一边翻简历一边抬头："小林啊，你公司缺人吗？我手上正好有几个好苗子。"','"来得正好，最近市场上有几个大厂高管在找工作，你要不要先看看？"'],
      headhunt:['"这个人的简历我看了三遍，如果是我自己开公司，第一个挖他。"','"我不卖人，我介绍缘分。但缘分也是有价格的。"'],
      talent:['"你公司现在缺的是技术还是管理？思路不一样，人选也不一样。"','"这批候选人底子都不错，但有一个特别适合你现在的发展阶段。"'],
    },
    questLines: [
      {
        id: 'sujie_q1', name: '初次委托', desc: '苏姐想帮你物色第一批员工',
        reqFavor: 10,
        steps: [
          { text: '苏姐约你在咖啡厅见面，聊了聊公司的人才需求', reward: { npcFavor: { sujie: 8 } } },
          { text: '她推荐了一份精心筛选的候选人名单', reward: { connections: 3 } },
          { text: '你面试了其中几位，录用了两个不错的人才', reward: { money: 30000, npcFavor: { sujie: 10 } } },
        ]
      },
      {
        id: 'sujie_q2', name: '高管挖角', desc: '帮你从竞争对手那里挖来一位核心高管',
        reqFavor: 30,
        steps: [
          { text: '苏姐神神秘秘地告诉你，XX公司的CTO有跳槽意向', reward: { stress: 8 } },
          { text: '她安排了秘密会面，过程惊心动魄', reward: { money: -80000 } },
          { text: '挖角成功！新CTO给公司带来了技术突破', reward: { reputation: 8, connections: 5, money: 150000 } },
        ]
      },
      {
        id: 'sujie_q3', name: '人才储备计划', desc: '苏姐提议帮你建立长期人才储备库',
        reqFavor: 50,
        steps: [
          { text: '苏姐建议你趁现在提前储备未来可能需要的人才', reward: {} },
          { text: '她帮你建立了人才数据库和评估体系', reward: { connections: 8 } },
          { text: '几个月后，当公司急需扩张时，你的人才库派上了大用场', reward: { money: 200000, reputation: 10, connections: 5 } },
        ]
      },
      {
        id: 'sujie_q4', name: '行业猎头联盟', desc: '苏姐邀请你加入她的人脉联盟',
        reqFavor: 70,
        steps: [
          { text: '苏姐透露她正在组建一个跨行业的猎头联盟', reward: { reputation: 5 } },
          { text: '作为首批合作企业，你获得了优先选人权', reward: { connections: 10 } },
          { text: '你的公司在人才市场打出了口碑，求职者主动投递', reward: { reputation: 15, connections: 12, money: 100000 } },
        ]
      },
    ],
      relations: [
    {npcId:'zhangye',type:'ally',intensity:0.7},
    {npcId:'wujiaolian',type:'ally',intensity:0.9},
    {npcId:'zhaolei',type:'neutral',intensity:0.5}
  ],
      relations: [
    {npcId:'sujie',type:'ally',intensity:0.9},
    {npcId:'zhaolei',type:'ally',intensity:0.6}
  ],
    npcLinks: { zhaolei: 0.15, zhangye: 0.2, chenzong: 0.1, wujiaolian: 0.25 },
  },

  jinhangzhang: {
    id:'jinhangzhang', name:'金行长', title:'新海商业银行行长',
    actUnlock:1, initFavor:0,
    desc:'52岁，谨慎而精明的银行家，对数字极其敏感，好感度高可享受贷款优惠',
    ...NPC_DEFAULTS,
    dialogTypes:['greeting','loan','invest','warn'],
    giftPreferences: { love:['art','book'], like:['wine'], neutral:['tech','luxury'] },
    giftQuote: '金行长是收藏家，古籍善本和名家字画最能打动他。',
    dialogs:{
      greeting:['金行长从一堆财务报表中抬起头："小林啊，最近资金周转怎么样？"','"来坐。我刚看了你公司上个季度的报表，增长不错。"'],
      loan:['"利率的事好商量。关键是你得让我看到清晰的还款计划。"','"基于你的信用记录，我可以给你一个比市场低1个点的利率。"'],
      invest:['"我不只是贷款给你，我看好你的企业。要不要考虑让我以个人身份参一股？"','"银行的资金是冰冷的，但我对你这家公司是有信心的。"'],
    },
    questLines: [
      {
        id: 'jinhangzhang_q1', name: '第一笔贷款', desc: '公司扩张需要资金，金行长愿意给你机会',
        reqFavor: 15,
        steps: [
          { text: '你带着商业计划书敲开了金行长的办公室', reward: { stress: 5 } },
          { text: '金行长认真看完计划书，问了几个尖锐的问题', reward: { npcFavor: { jinhangzhang: 8 } } },
          { text: '贷款获批！金行长说："好好干，我相信你的判断。"', reward: { money: 200000, npcFavor: { jinhangzhang: 10 } } },
        ]
      },
      {
        id: 'jinhangzhang_q2', name: '信用评级提升', desc: '金行长帮你提高企业信用等级',
        reqFavor: 35,
        steps: [
          { text: '金行长通知你行里的信用评级系统即将更新', reward: { stress: 5 } },
          { text: '你按照他的建议整理了财务报表和经营数据', reward: {} },
          { text: '信用评级提升至AA级！未来贷款额度翻倍', reward: { reputation: 8, connections: 3, money: 50000 } },
        ]
      },
      {
        id: 'jinhangzhang_q3', name: '供应链金融', desc: '金行长提议帮你做供应链金融',
        reqFavor: 55,
        steps: [
          { text: '金行长介绍了银行的供应链金融方案', reward: {} },
          { text: '你的供应商和客户都接入了这套系统', reward: { connections: 8, money: 100000 } },
          { text: '现金流得到极大改善，运营效率大幅提升', reward: { money: 300000, reputation: 10 } },
        ]
      },
      {
        id: 'jinhangzhang_q4', name: '银企战略合作', desc: '与银行建立深度战略合作关系',
        reqFavor: 75,
        steps: [
          { text: '金行长亲自带队来公司做战略调研', reward: { stress: 10, reputation: 5 } },
          { text: '双方签署了战略合作协议，你获得了专属金融服务', reward: { connections: 12 } },
          { text: '银行成为你最坚实的后盾，资金不再是瓶颈', reward: { money: 500000, reputation: 15, connections: 10 } },
        ]
      },
    ],
    npcLinks: { lichu: 0.3, chenzong: 0.2, wanglvshi: 0.15, liukuaiji: 0.2 },
  },

  qianlaoban: {
    id:'qianlaoban', name:'钱老板', title:'新海拍卖行董事长',
    actUnlock:1, initFavor:5,
    desc:'60岁，古董鉴赏家+精明商人，掌握着新海最顶级的资产交易渠道',
    ...NPC_DEFAULTS,
    dialogTypes:['greeting','auction','appraisal','collect'],
    giftPreferences: { love:['art','wine'], like:['luxury'], neutral:['tech','book'] },
    giftQuote: '钱老板是玩家，好酒配好画，人生才完整。',
    dialogs:{
      greeting:['钱老板正用放大镜看一件瓷器："小林来看看，这件东西妙不妙？"','"拍卖行最近收了批好东西，我想着你可能有兴趣。"'],
      auction:['"这件资产底价两百万，但我估计成交价能到三百万。你要不要入场？"','"拍卖这东西，三分看眼力，七分看运气。"'],
      appraisal:['"你这件资产我帮你估个价。保守估计能翻三倍，但得等市场热起来。"','"好东西不急着出手。放在手里捂一捂，价格自然就上去了。"'],
    },
    questLines: [
      {
        id: 'qianlaoban_q1', name: '初入拍场', desc: '钱老板邀请你参加首次拍卖会',
        reqFavor: 15,
        steps: [
          { text: '收到一张烫金请柬：新海秋季艺术品拍卖会', reward: { stress: 5 } },
          { text: '在拍卖会上你见识了真正的资本游戏', reward: { connections: 5 } },
          { text: '你以低于市场价拍到了一件不错的资产', reward: { money: 50000, npcFavor: { qianlaoban: 10 } } },
        ]
      },
      {
        id: 'qianlaoban_q2', name: '捡漏高手', desc: '钱老板教你辨别资产价值',
        reqFavor: 30,
        steps: [
          { text: '钱老板私下告诉你一件被低估的资产即将上拍', reward: { npcFavor: { qianlaoban: 8 } } },
          { text: '你按照他的指点做了研究，确认了价值', reward: {} },
          { text: '成功以低价拿到，转手翻了五倍', reward: { money: 250000, reputation: 5, npcFavor: { qianlaoban: 12 } } },
        ]
      },
      {
        id: 'qianlaoban_q3', name: 'VIP俱乐部', desc: '钱老板邀请你进入顶级藏家圈子',
        reqFavor: 50,
        steps: [
          { text: '钱老板告诉你有一个私人拍卖俱乐部，只有少数人能进', reward: { stress: 8 } },
          { text: '你缴纳了会费，获得了进入圈子的资格', reward: { money: -100000 } },
          { text: '在俱乐部里你接触到了顶级资产和人脉', reward: { connections: 15, reputation: 10, money: 200000 } },
        ]
      },
      {
        id: 'qianlaoban_q4', name: '专属拍卖会', desc: '钱老板为你举办专场资产推介会',
        reqFavor: 70,
        steps: [
          { text: '钱老板提议为你办一场个人资产专场推介会', reward: { reputation: 10 } },
          { text: '你精心挑选了手中的优质资产进行展示', reward: { stress: 10 } },
          { text: '推介会大获成功，资产估值翻了几倍', reward: { money: 500000, reputation: 20, connections: 15 } },
        ]
      },
    ],
    npcLinks: { chenzong: 0.25, jinhangzhang: 0.2, xiaoc: 0.15, zhangye: 0.1 },
  },

  sunmishu: {
    id:'sunmishu', name:'孙秘书', title:'新海市府办副主任',
    actUnlock:1, initFavor:0,
    desc:'35岁，年轻有为的体制内精英，掌握着城市规划和政策的第一手信息',
    ...NPC_DEFAULTS,
    dialogTypes:['greeting','policy','region','tip'],
    giftPreferences: { love:['book','tech'], like:['art'], neutral:['wine','luxury'] },
    giftQuote: '孙秘书是读书人出身，好书和前沿科技报告最能打开话题。',
    dialogs:{
      greeting:['孙秘书从公文堆中抬起头："林总，最近市里有几个新规划，你可能感兴趣。"','"你那个片区的规划调整方案已经批下来了，我提前跟你说一声。"'],
      policy:['"这个政策文件下个月才公开，但我可以给你看一个摘要版。"','"市里在考虑调整高新区的税收优惠，你们企业符合条件的话要抓紧申请。"'],
      region:['"永宁区那边的配套马上要升级了，现在入场时机正好。"','"蛇口港区要扩建保税仓，你的物流业务可以考虑往那边布局。"'],
    },
    questLines: [
      {
        id: 'sunmishu_q1', name: '政策咨询', desc: '孙秘书帮你解读最新的招商政策',
        reqFavor: 15,
        steps: [
          { text: '你约孙秘书在茶馆见面，了解最新的优惠政策', reward: { npcFavor: { sunmishu: 8 } } },
          { text: '他详细介绍了几个你可能符合条件的补贴项目', reward: { connections: 2 } },
          { text: '你按照他的建议提交了申请，获批了一笔补贴', reward: { money: 80000, npcFavor: { sunmishu: 10 } } },
        ]
      },
      {
        id: 'sunmishu_q2', name: '区域拓展情报', desc: '孙秘书透露了几个优质区域的发展规划',
        reqFavor: 30,
        steps: [
          { text: '孙秘书私下告诉你，某片区即将被划为自贸区', reward: { stress: 5 } },
          { text: '你提前去考察了一圈，发现确实很有潜力', reward: {} },
          { text: '你抢在规划公布前低价拿下了几个优质铺位', reward: { money: 150000, connections: 3, npcFavor: { sunmishu: 12 } } },
        ]
      },
      {
        id: 'sunmishu_q3', name: '招商引资推荐', desc: '孙秘书推荐你参加市政府招商团',
        reqFavor: 50,
        steps: [
          { text: '市里要组织一个企业家代表团去外地招商，孙秘书推荐了你', reward: { reputation: 8 } },
          { text: '考察期间你结识了多位外地企业家和政府官员', reward: { connections: 12 } },
          { text: '你谈成了几个跨区域合作项目', reward: { money: 200000, reputation: 10, connections: 8 } },
        ]
      },
      {
        id: 'sunmishu_q4', name: '市企合作顾问', desc: '孙秘书邀请你加入市政府企业顾问团',
        reqFavor: 70,
        steps: [
          { text: '市政府要组建企业顾问团，孙秘书提名了你', reward: { reputation: 15 } },
          { text: '你在顾问团中为中小企业发声，获得广泛认可', reward: { connections: 15, reputation: 10 } },
          { text: '你的建议被采纳写入了招商政策文件', reward: { reputation: 25, money: 100000, connections: 10 } },
        ]
      },
    ],
    npcLinks: { lichu: 0.35, linjiaoshou: 0.15, jinhangzhang: 0.1 },
  },

  wujiaolian: {
    id:'wujiaolian', name:'吴教练', title:'卓越企管培训创始人',
    actUnlock:1, initFavor:15,
    desc:'42岁，前500强HR总监转型创业培训师，擅长把平庸团队打造成王牌之师',
    ...NPC_DEFAULTS,
    dialogTypes:['greeting','train','coach','team'],
    giftPreferences: { love:['book','tech'], like:['art'], neutral:['wine','luxury'] },
    giftQuote: '吴教练是方法论狂人，专业书籍和效率工具是他的精神食粮。',
    dialogs:{
      greeting:['吴教练正在白板上画组织架构图："小林，你公司最近士气怎么样？"','"我刚从一家上市公司做完团队培训回来，感触很深。要不要聊聊？"'],
      train:['"你的团队我看了一圈，潜力很大，但方法论需要升级。"','"不是员工不行，是培训没到位。给我两周，我帮你扭转局面。"'],
      coach:['"企业家和经理人的区别，就是后者只会管，前者懂得激发。"','"你的管理风格偏温和，这对初创期是优势，但从长期看需要适当调整。"'],
    },
    questLines: [
      {
        id: 'wujiaolian_q1', name: '团队诊断', desc: '吴教练给你的团队做一次全面评估',
        reqFavor: 15,
        steps: [
          { text: '吴教练花了一天时间观察你的团队工作状态', reward: { stress: 5 } },
          { text: '他给每个人写了一份能力评估报告', reward: { npcFavor: { wujiaolian: 10 } } },
          { text: '根据评估结果，他给出了几条价值很高的建议', reward: { connections: 3, npcFavor: { wujiaolian: 8 } } },
        ]
      },
      {
        id: 'wujiaolian_q2', name: '集中培训营', desc: '吴教练带你的核心团队做封闭培训',
        reqFavor: 30,
        steps: [
          { text: '吴教练设计了一套两周的强化培训方案', reward: { money: -50000 } },
          { text: '培训期间团队高强度磨合，虽然累但脱胎换骨', reward: { stress: 15 } },
          { text: '培训结束后，团队战斗力明显提升', reward: { reputation: 8, connections: 5, money: 100000 } },
        ]
      },
      {
        id: 'wujiaolian_q3', name: '领导力教练', desc: '吴教练做你的私人领导力教练',
        reqFavor: 50,
        steps: [
          { text: '吴教练说："作为创始人，你的天花板就是公司的天花板"', reward: { npcFavor: { wujiaolian: 10 } } },
          { text: '每周一次的一对一辅导持续了三个月', reward: { stress: 8 } },
          { text: '你的管理能力得到质的飞跃，员工对你的评价大幅上升', reward: { reputation: 15, connections: 8 } },
        ]
      },
      {
        id: 'wujiaolian_q4', name: '王牌之师', desc: '吴教练帮你打造行业顶尖团队',
        reqFavor: 70,
        steps: [
          { text: '吴教练提出一个雄心勃勃的计划：帮你打造行业最强团队', reward: { reputation: 5 } },
          { text: '他亲自驻场三个月，重新设计了整个组织架构和激励体系', reward: { money: -200000, stress: 15 } },
          { text: '你的公司被评选为"最佳雇主"，团队成为行业标杆', reward: { reputation: 25, money: 300000, connections: 15 } },
        ]
      },
    ],
    npcLinks: { sujie: 0.25, zhaolei: 0.15, linjiaoshou: 0.1 },
  },

  liukuaiji: {
    id:'liukuaiji', name:'刘会计', title:'诚达会计师事务所合伙人',
    actUnlock:1, initFavor:5,
    desc:'50岁，老派财务专家，一辈子跟数字打交道，能帮你合法省下大笔税费',
    ...NPC_DEFAULTS,
    dialogTypes:['greeting','tax','audit','save'],
    giftPreferences: { love:['wine','book'], like:['tech'], neutral:['art','luxury'] },
    giftQuote: '刘会计只认两样东西：好酒和精准的账本。酒到位了，账就好谈。',
    dialogs:{
      greeting:['刘会计放下老花镜："小林啊，你这季度的报表我看了，有几个地方可以优化。"','"来得正好，我刚研究了一个新的税务筹划方案，能帮你省不少。"'],
      tax:['"合理避税和逃税是两回事。我教你的是前者，完全合法。"','"这个抵扣项很多人不知道，但你们公司完全符合条件。"'],
      audit:['"我帮你看看上个月的账……嗯，这里有个合规风险，建议立刻整改。"','"审计不是来找你麻烦的，是帮你提前发现问题的。"'],
    },
    questLines: [
      {
        id: 'liukuaiji_q1', name: '财务体检', desc: '刘会计免费帮你做一次财务体检',
        reqFavor: 10,
        steps: [
          { text: '刘会计说新客户都有一次免费财务体检', reward: { npcFavor: { liukuaiji: 8 } } },
          { text: '他发现了几个账务处理上的小问题', reward: { stress: 5 } },
          { text: '修正之后，你的财务管理规范了很多', reward: { npcFavor: { liukuaiji: 10 }, money: 30000 } },
        ]
      },
      {
        id: 'liukuaiji_q2', name: '税务筹划', desc: '刘会计帮你制定年度税务优化方案',
        reqFavor: 30,
        steps: [
          { text: '刘会计拿出了一份详细的分析报告', reward: { npcFavor: { liukuaiji: 8 } } },
          { text: '他指出了几个可以合法优化的税务节点', reward: {} },
          { text: '按照方案执行后，当年税费降低了三成', reward: { money: 150000, reputation: 5, npcFavor: { liukuaiji: 12 } } },
        ]
      },
      {
        id: 'liukuaiji_q3', name: '上市辅导', desc: '刘会计建议你开始做上市前的财务规范',
        reqFavor: 50,
        steps: [
          { text: '刘会计说："如果你想上市，现在就得开始规范财务了。"', reward: { stress: 10 } },
          { text: '他带领团队花了两个月帮你梳理财务体系', reward: { money: -100000, stress: 8 } },
          { text: '财务体系焕然一新，为未来融资和上市扫清障碍', reward: { reputation: 12, connections: 10, money: 200000 } },
        ]
      },
      {
        id: 'liukuaiji_q4', name: '财务战略顾问', desc: '刘会计成为你的长期财务战略顾问',
        reqFavor: 70,
        steps: [
          { text: '刘会计正式接受担任你公司独立财务顾问的邀请', reward: { reputation: 8 } },
          { text: '他从战略高度帮你重新设计了财务架构和成本体系', reward: {} },
          { text: '公司运营成本持续下降，利润率大幅提升', reward: { money: 400000, reputation: 15, connections: 8 } },
        ]
      },
    ],
    npcLinks: { jinhangzhang: 0.25, wanglvshi: 0.2, chenzong: 0.1, lichu: 0.1 },
  },

};
