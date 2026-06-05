// ==================================================
// data.js — 事件数据库 (80+事件) + NPC对话模板
// ==================================================

// ---- NPC 数据 ----
const NPCS = {
  zhaolei: {
    id:'zhaolei', name:'赵磊', title:'星辰科技创始人',
    actUnlock:0, initFavor:30,
    desc:'35岁，技术理想主义+逐渐现实，前同事',
    favorLevels:['敌对','冷淡','中立','友好','亲密'],
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
    npcLinks: { zhangye: 0.3, linjiaoshou: 0.2 },
  },
  lichu: {
    id:'lichu', name:'李处', title:'商务局科长',
    actUnlock:0, initFavor:0,
    desc:'48岁，规则守护者、偶尔通融',
    favorLevels:['敌对','冷淡','中立','友好','亲密'],
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
    npcLinks: { chenzong: 0.2, wanglvshi: 0.25 },
  },
  zhangye: {
    id:'zhangye', name:'张野', title:'永安传媒创始人',
    actUnlock:1, initFavor:10,
    desc:'40岁，八面玲珑、信息贩子，唯一可花钱买好感',
    favorLevels:['敌对','冷淡','中立','友好','亲密'],
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
    favorLevels:['敌对','冷淡','中立','友好','亲密'],
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
    favorLevels:['敌对','冷淡','中立','友好','亲密'],
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
    favorLevels:['敌对','冷淡','中立','友好','亲密'],
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
    favorLevels:['敌对','冷淡','中立','友好','亲密'],
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
    favorLevels:['敌对','冷淡','中立','友好','亲密'],
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
    favorLevels:['敌对','冷淡','中立','友好','亲密'],
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
    npcLinks: { zhaolei: 0.15, zhangye: 0.2, chenzong: 0.1, wujiaolian: 0.25 },
  },

  jinhangzhang: {
    id:'jinhangzhang', name:'金行长', title:'新海商业银行行长',
    actUnlock:1, initFavor:0,
    desc:'52岁，谨慎而精明的银行家，对数字极其敏感，好感度高可享受贷款优惠',
    favorLevels:['敌对','冷淡','中立','友好','亲密'],
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
    favorLevels:['敌对','冷淡','中立','友好','亲密'],
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
    favorLevels:['敌对','冷淡','中立','友好','亲密'],
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
    favorLevels:['敌对','冷淡','中立','友好','亲密'],
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
    favorLevels:['敌对','冷淡','中立','友好','亲密'],
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

// ---- 事件数据库 ----
// 每个事件：id, type, category, acts(允许幕次), cooldown, weight,
// title, getDesc(), effects, choices[], fallbacks[], milestone?, isEnding?
const EVENTS = [

  // ===== 市场类 (12) =====
  {
    id:'m01', type:'market', category:'narrative',
    acts:[0,1,2], cooldown:0, weight:8,
    title:'风口来了',
    getDesc:()=>{
      const t=['AI绘画工具','中式养生茶饮','宠物经济','沉浸式体验馆','银发科技','国产替代芯片'];
      return `一夜之间，"${t[Math.floor(Math.random()*t.length)]}"在朋友圈刷屏。有人已经all-in，有人还在观望。`;
    },
    effects:{ money:[0.9,1.5], reputation:[5,20], stress:[10,30] },
    choices:[
      { text:'全力押注，转型跟进', effect:{ money:1.5, reputation:20, stress:30 }, label:'激进攻势' },
      { text:'小额试水，保持主业', effect:{ money:1.15, reputation:5, stress:10 }, label:'稳健试水' },
      { text:'冷眼旁观，专注本职', effect:{ money:0.95, reputation:5, stress:0 }, label:'冷静观察' },
    ],
    fallbacks:['朋友圈被一个赛道刷屏了。要不要跟？','风口来了又去，你站在十字路口。'],
  },
  {
    id:'m02', type:'market', category:'narrative',
    acts:[0,1,2,3], cooldown:60, weight:7,
    title:'原材料涨价',
    getDesc:()=>{
      const m=['芯片','咖啡豆','钢材','纸浆','锂电池','冷链物流'];
      return `上游${m[Math.floor(Math.random()*m.length)]}价格突然上涨${5+Math.floor(Math.random()*25)}%。采购发来紧急邮件，财务说这个月毛利要崩。`;
    },
    effects:{ money:[0.8,0.95], reputation:[-10,5], stress:[15,30] },
    choices:[
      { text:'涨价转嫁客户', effect:{ money:0.95, reputation:-10, stress:15 }, label:'硬刚' },
      { text:'自己消化，不发公告', effect:{ money:0.8, reputation:5, stress:30 }, label:'硬扛' },
      { text:'寻找替代供应商', effect:{ money:0.9, reputation:0, stress:20 }, label:'寻路' },
    ],
    fallbacks:['原材料涨价的消息传来，你的毛利在缩水。','供应链的成本压力，终于传导到了你这里。'],
  },
  {
    id:'m03', type:'market', category:'narrative',
    acts:[0,1,2,3], cooldown:40, weight:7,
    title:'竞争对手融资了',
    getDesc:()=>{
      const n=['速途科技','云帆创新','星河互娱','锐意达','蓝海数据'];
      const a=['2000万','5000万','1亿','2亿'];
      return `${n[Math.floor(Math.random()*n.length)]}宣布完成${a[Math.floor(Math.random()*a.length)]}的A轮融资。他们在招人，在打广告，在挖你的墙角。`;
    },
    effects:{ money:[0.85,1.3], reputation:[-5,15], stress:[20,35] },
    choices:[
      { text:'加速自己的融资，正面迎战', effect:{ money:1.3, reputation:15, stress:25 }, label:'正面迎战' },
      { text:'专注产品，不打口水仗', effect:{ money:0.95, reputation:10, stress:10 }, label:'专注产品' },
      { text:'挖回对方的人，报复性挖角', effect:{ money:0.85, reputation:-5, stress:30 }, label:'报复性挖角' },
    ],
    fallbacks:['竞争对手融资的消息刷屏了。','有人在资本助力下开始攻城略地。'],
  },
  {
    id:'m04', type:'market', category:'narrative',
    acts:[1,2,3,4], cooldown:50, weight:5,
    title:'汇率波动',
    getDesc:()=>{
      const dir=Math.random()>0.5?'升值':'贬值';
      return `人民币汇率突然${dir}，幅度约${5+Math.floor(Math.random()*10)}%。财务总监拿着汇兑损益表等你签字。`;
    },
    effects:{ money:[0.75,1.3], reputation:[0,5], stress:[0,30] },
    choices:[
      { text:'用金融工具对冲，锁定汇率', effect:{ money:0.95, stress:0 }, label:'金融对冲' },
      { text:'调整定价/结算货币，转移风险', effect:{ money:1.0, reputation:5, stress:10 }, label:'转移风险' },
      { text:'什么都不做，赌趋势逆转', effect:{ money:[0.9,1.1], stress:[0,10] }, label:'赌一把' },
    ],
    fallbacks:['汇率今天大幅波动，你的外币资产在数字上变了。','财务拿来了最新的汇兑损益表。'],
  },
  {
    id:'m05', type:'market', category:'narrative',
    acts:[1,2,3], cooldown:80, weight:6,
    title:'消费升级浪潮',
    getDesc:()=>'消费者的偏好在悄悄变化：大家开始愿意为品质、设计、品牌故事付溢价。隔壁品牌涨价三倍还卖断货。你的产品，要不要往上走？',
    effects:{ money:[0.7,1.5], reputation:[10,30], stress:[15,25] },
    choices:[
      { text:'全面升级，做高端品牌', effect:{ money:0.7, reputation:30, stress:25 }, label:'品牌升级' },
      { text:'保持性价比，走量不走价', effect:{ money:1.1, reputation:5, stress:5 }, label:'性价比路线' },
      { text:'双品牌战略，高低端并行', effect:{ money:0.8, reputation:15, stress:20 }, label:'双品牌' },
    ],
    fallbacks:['消费升级的声音越来越响。','消费者开始为"感觉"付钱了。'],
  },
  {
    id:'m06', type:'market', category:'narrative',
    acts:[1,2,3,4], cooldown:100, weight:6,
    title:'行业监管收紧',
    getDesc:()=>{
      const r=['数据出境限制','广告合规审查','反垄断调查','环保新规','食品安全法修订'];
      return `监管部门出台新规，${r[Math.floor(Math.random()*r.length)]}被纳入更严格监管。媒体出现了"行业寒冬？"的标题。`;
    },
    effects:{ money:[0.6,0.9], reputation:[-10,25], stress:[30,50] },
    choices:[
      { text:'主动合规，超标完成', effect:{ money:0.6, reputation:25, stress:30 }, label:'主动合规' },
      { text:'最低限度合规，先活下来', effect:{ money:0.85, reputation:5, stress:40 }, label:'底线合规' },
      { text:'游说+公关，试图影响规则', effect:{ money:0.75, reputation:-10, stress:35 }, label:'灰色操作' },
    ],
    fallbacks:['新规出台，行业在震动。','合规的代价不菲，但不合规的代价更大。'],
  },
  {
    id:'m07', type:'market', category:'narrative',
    acts:[2,3,4], cooldown:60, weight:5,
    title:'股市联动效应',
    getDesc:()=>`今天大盘${Math.random()>0.5?'大涨':'大跌'}${5+Math.floor(Math.random()*35)}%。你的公司如果已上市，股价跟着巨幅波动。`,
    effects:{ money:[0.5,2.0], reputation:[-10,15], stress:[20,60] },
    choices:[
      { text:'高位套现一部分，落袋为安', effect:{ money:1.5, reputation:5, stress:-10 }, label:'落袋为安' },
      { text:'发布公告稳定市场预期', effect:{ money:0.95, reputation:15, stress:10 }, label:'稳定军心' },
      { text:'什么都不做，相信长期价值', effect:{ money:[0.7,1.3], stress:[0,20] }, label:'相信价值' },
    ],
    fallbacks:['今天股市大涨/大跌，你的资产在数字上跳跃。','股价波动，有人狂欢，有人煎熬。'],
  },
  {
    id:'m08', type:'market', category:'narrative',
    acts:[0,1,2,3,4], cooldown:120, weight:3,
    title:'黑天鹅事件',
    getDesc:()=>{
      const e=['突发公共卫生危机','某行业巨头突然破产','关键原材料出口国政局动荡','苏伊士运河再次堵塞','极端天气摧毁主要产区'];
      return `一只黑天鹅降临：${e[Math.floor(Math.random()*e.length)]}。你的行业受到严重冲击，一切都不一样了。`;
    },
    effects:{ money:[0.4,1.8], reputation:[-20,30], stress:[40,80] },
    choices:[
      { text:'快速转型，抓住危机中的机会', effect:{ money:1.5, reputation:30, stress:40 }, label:'危机猎手' },
      { text:'收缩战线，全力保现金流', effect:{ money:0.7, reputation:5, stress:60 }, label:'现金为王' },
      { text:'赌一把，逆势扩张抄底', effect:{ money:[0.4,2.5], reputation:[-10,20], stress:80 }, label:'逆势抄底' },
    ],
    fallbacks:['黑天鹅来了，没有人预料到。','危机和机会，往往是一枚硬币的两面。'],
  },
  {
    id:'m09', type:'market', category:'narrative',
    acts:[1,2,3], cooldown:70, weight:5,
    title:'消费者觉醒/舆论转向',
    getDesc:()=>'社交媒体上，消费者开始用放大镜审视你的行业。一条负面评论能在几小时内传遍全网。口碑管理，从未如此重要。',
    effects:{ money:[0.8,1.2], reputation:[-20,20], stress:[10,25] },
    choices:[
      { text:'主动回应，公开透明', effect:{ money:0.9, reputation:20, stress:10 }, label:'透明沟通' },
      { text:'低调处理，冷处理', effect:{ money:1.0, reputation:-10, stress:20 }, label:'冷处理' },
      { text:'借机升级产品', effect:{ money:0.8, reputation:15, stress:25 }, label:'升级换代' },
    ],
    fallbacks:['社交媒体上的舆论，可以成就你，也可以摧毁你。','消费者越来越不好糊弄了。'],
  },
  {
    id:'m10', type:'market', category:'narrative',
    acts:[0,1,2,3], cooldown:90, weight:5,
    title:'供应链中断',
    getDesc:()=>{
      const r=['突然停工','被收购','发生火灾','资金链断裂'];
      return `你的关键供应商${r[Math.floor(Math.random()*4)]}。供应链断了，生产受影响。`;
    },
    effects:{ money:[0.7,0.95], reputation:[-15,5], stress:[20,40] },
    choices:[
      { text:'紧急寻找替代供应商', effect:{ money:0.85, reputation:0, stress:25 }, label:'紧急寻替' },
      { text:'消耗库存，暂缓交付', effect:{ money:0.95, reputation:-15, stress:20 }, label:'消耗库存' },
      { text:'投资/收购供应商', effect:{ money:0.7, reputation:10, stress:40 }, label:'向上游延伸' },
    ],
    fallbacks:['供应链的某个环节断了。','关键供应商出了问题，交付受到威胁。'],
  },
  {
    id:'m11', type:'market', category:'narrative',
    acts:[1,2,3,4], cooldown:80, weight:5,
    title:'新技术突破',
    getDesc:()=>{
      const t=['AI辅助决策','区块链溯源','自动驾驶配送','量子计算加密','生物合成材料'];
      return `行业内出现了一项新技术突破（${t[Math.floor(Math.random()*t.length)]}），可能颠覆现有玩法。`;
    },
    effects:{ money:[0.8,1.4], reputation:[0,20], stress:[10,30] },
    choices:[
      { text:'全力投入研发', effect:{ money:0.8, reputation:20, stress:30 }, label:'技术押注' },
      { text:'保持关注，小步跟进', effect:{ money:1.1, reputation:5, stress:10 }, label:'小步跟进' },
      { text:'维持现状，不改方向', effect:{ money:1.0, reputation:0, stress:5 }, label:'维持现状' },
    ],
    fallbacks:['新技术出现了，有人在押注，有人在观望。','技术变革的浪潮，可能把你推向巅峰，也可能掀翻你的船。'],
  },
  {
    id:'m12', type:'market', category:'narrative',
    acts:[0,1,2,3], cooldown:50, weight:6,
    title:'人才大战',
    getDesc:()=>'行业内爆发人才争夺战。猎头疯狂挖人，薪资水涨船高。你的核心员工被盯上了。',
    effects:{ money:[0.85,1.1], reputation:[0,10], stress:[15,35] },
    choices:[
      { text:'加薪留人', effect:{ money:0.85, reputation:5, stress:15 }, label:'加薪留人' },
      { text:'期权/分红激励', effect:{ money:0.9, reputation:10, stress:10 }, label:'长期激励' },
      { text:'培养备份人选', effect:{ money:1.0, reputation:0, stress:25 }, label:'备胎计划' },
    ],
    fallbacks:['人才大战打响了，你的员工被猎头盯上了。','薪资在涨，人才在流动，你感到了压力。'],
  },

  // ===== 员工类 (10) =====
  {
    id:'e01', type:'employee', category:'narrative',
    acts:[0,1,2,3,4], cooldown:30, weight:6,
    title:'员工创新想法',
    getDesc:()=>{
      const e=(SGame.G&&SGame.G.employees)||[]; const name=e.length>0?e[Math.floor(Math.random()*e.length)].name:'一位员工';
      return `${name}提出了一个创新想法，可能提升业务效率。要支持吗？`;
    },
    effects:{ money:[0.9,1.2], reputation:[5,15], stress:[0,10] },
    choices:[
      { text:'支持，给资源', effect:{ money:0.9, reputation:10, stress:5 }, label:'支持创新' },
      { text:'评估后再决定', effect:{ money:1.0, reputation:5, stress:10 }, label:'谨慎评估' },
      { text:'拒绝，专注主业', effect:{ money:1.05, reputation:0, stress:0 }, label:'拒绝分心' },
    ],
    fallbacks:['员工提出了一个想法，你要支持吗？','创新往往来自一线，但也可能分散精力。'],
  },
  {
    id:'e02', type:'employee', category:'narrative',
    acts:[0,1,2,3], cooldown:40, weight:5,
    title:'员工倦怠（Burnout）',
    getDesc:()=>{
      const e=(SGame.G&&SGame.G.employees)||[]; const name=e.length>0?e[Math.floor(Math.random()*e.length)].name:'一名核心员工';
      return `${name}出现了倦怠迹象，效率下降，可能离职。`;
    },
    effects:{ money:[0.9,1.0], reputation:[0,10], stress:[10,25] },
    choices:[
      { text:'强制休假+团队建设', effect:{ money:0.9, reputation:10, stress:-10 }, label:'人文关怀' },
      { text:'加薪激励', effect:{ money:0.85, reputation:5, stress:5 }, label:'物质激励' },
      { text:'招人备份', effect:{ money:0.95, reputation:0, stress:15 }, label:'备胎计划' },
    ],
    fallbacks:['员工倦怠是创业公司的隐形杀手。','有人撑不住了，你要管吗？'],
  },
  {
    id:'e03', type:'employee', category:'narrative',
    acts:[0,1,2,3,4], cooldown:60, weight:4,
    title:'明星员工被挖',
    getDesc:()=>{
      const e=(SGame.G&&SGame.G.employees)||[]; const name=e.length>0?e[Math.floor(Math.random()*e.length)].name:'你的明星员工';
      return `猎头联系了${name}，开出了双倍薪资。`;
    },
    effects:{ money:[0.8,1.0], reputation:[0,5], stress:[15,30] },
    choices:[
      { text:'匹配报价留住', effect:{ money:0.8, reputation:5, stress:15 }, label:'薪资战' },
      { text:'谈心+愿景留人', effect:{ money:1.0, reputation:10, stress:10 }, label:'情感留人' },
      { text:'放手，祝他前程似锦', effect:{ money:1.0, reputation:0, stress:20 }, label:'体面放手' },
    ],
    fallbacks:['猎头的电话打到了你的员工那里。','有人被挖了，这是创业公司的宿命。'],
  },
  {
    id:'e04', type:'employee', category:'narrative',
    acts:[1,2,3,4], cooldown:50, weight:4,
    title:'团队里程碑',
    getDesc:()=>`你的团队达到了一个里程碑：团队超过${(SGame.G&&SGame.G.employees||[]).length}人。大家士气高涨。`,
    effects:{ money:[0.95,1.1], reputation:[10,20], stress:[-10,0] },
    choices:[
      { text:'举办庆祝活动', effect:{ money:0.95, reputation:15, stress:-10 }, label:'庆祝' },
      { text:'顺势设定更高目标', effect:{ money:1.1, reputation:10, stress:10 }, label:'乘胜追击' },
      { text:'发奖金', effect:{ money:0.9, reputation:20, stress:-5 }, label:'物质奖励' },
    ],
    fallbacks:['团队达成了一个里程碑，值得庆祝。','成功的团队，需要偶尔停下来庆祝。'],
  },
  {
    id:'e05', type:'employee', category:'narrative',
    acts:[0,1,2], cooldown:45, weight:4,
    title:'员工内部矛盾',
    getDesc:()=>'两名核心员工发生了矛盾，影响了团队协作。你需要介入调解。',
    effects:{ money:[0.95,1.05], reputation:[0,10], stress:[10,20] },
    choices:[
      { text:'分别谈心，调解', effect:{ money:1.0, reputation:10, stress:5 }, label:'人文调解' },
      { text:'明确分工，减少交集', effect:{ money:1.05, reputation:0, stress:10 }, label:'制度化解' },
      { text:'请HR介入', effect:{ money:0.95, reputation:5, stress:15 }, label:'专业化处理' },
    ],
    fallbacks:['团队成员之间的矛盾，如果不管，会蔓延。','有人吵架了，团队氛围有点僵。'],
  },
  {
    id:'e06', type:'employee', category:'narrative',
    acts:[0,1,2,3,4], cooldown:20, weight:3,
    title:'员工生日',
    getDesc:()=>{
      const e=(SGame.G&&SGame.G.employees)||[]; const name=e.length>0?e[Math.floor(Math.random()*e.length)].name:'一名员工';
      return `${name}今天生日。团队准备小庆祝一下。`;
    },
    effects:{ money:[0.98,1.0], reputation:[5,10], stress:[-5,0] },
    choices:[
      { text:'送礼物+团队庆祝', effect:{ money:0.98, reputation:10, stress:-5 }, label:'温暖老板' },
      { text:'简单问候就好', effect:{ money:1.0, reputation:5, stress:0 }, label:'低调处理' },
    ],
    fallbacks:['有人生日了，团队气氛不错。','生日是小小的温暖时刻。'],
  },
  {
    id:'e07', type:'employee', category:'decision',
    acts:[1,2,3], cooldown:80, weight:4,
    title:'核心员工提交离职',
    getDesc:()=>{
      const e=(SGame.G&&SGame.G.employees)||[]; const name=e.length>0?e[Math.floor(Math.random()*e.length)].name:'一名核心员工';
      return `${name}提交了离职报告，理由是"个人发展"。你要挽留吗？`;
    },
    effects:{ money:[0.8,1.0], reputation:[-10,10], stress:[20,40] },
    choices:[
      { text:'深谈，了解真实原因', effect:{ money:1.0, reputation:5, stress:20 }, label:'深度沟通' },
      { text:'加薪+晋升挽留', effect:{ money:0.8, reputation:10, stress:25 }, label:'重金挽留' },
      { text:'欣然接受，祝前程', effect:{ money:1.0, reputation:-5, stress:30 }, label:'体面放手' },
    ],
    fallbacks:['有人要走了，创业公司的人才流动。','离职是一面镜子，照出公司的问题。'],
  },
  {
    id:'e08', type:'employee', category:'decision',
    acts:[0,1,2,3], cooldown:100, weight:3,
    title:'员工家庭危机',
    getDesc:()=>{
      const e=(SGame.G&&SGame.G.employees)||[]; const name=e.length>0?e[Math.floor(Math.random()*e.length)].name:'你的员工';
      return `${name}家属生重病，需要请假和资金支持。`;
    },
    effects:{ money:[0.9,1.0], reputation:[10,25], stress:[0,15] },
    choices:[
      { text:'全薪假期+公司捐助', effect:{ money:0.9, reputation:25, stress:0 }, label:'人文关怀' },
      { text:'按规章处理', effect:{ money:1.0, reputation:5, stress:10 }, label:'按章办事' },
      { text:'组织团队募捐', effect:{ money:0.95, reputation:15, stress:5 }, label:'团队互助' },
    ],
    fallbacks:['员工的家庭出了变故，你要怎么回应？','公司不只是赚钱的机器，也是人的集合。'],
  },
  {
    id:'e09', type:'employee', category:'decision',
    acts:[1,2,3,4], cooldown:90, weight:4,
    title:'员工要求股权激励',
    getDesc:()=>{
      const e=(SGame.G&&SGame.G.employees)||[]; const name=e.length>0?e[Math.floor(Math.random()*e.length)].name:'你的核心员工';
      return `${name}要求股权激励，否则可能加入竞争对手。`;
    },
    effects:{ money:[0.85,1.1], reputation:[5,20], stress:[10,30] },
    choices:[
      { text:'给予期权，绑定未来', effect:{ money:0.9, reputation:20, stress:10 }, label:'长期绑定' },
      { text:'给予虚拟股权（分红权）', effect:{ money:0.95, reputation:15, stress:15 }, label:'折中方案' },
      { text:'拒绝，用高薪代替', effect:{ money:0.85, reputation:5, stress:30 }, label:'高薪留人' },
    ],
    fallbacks:['员工想要股权，这是创业公司的经典博弈。','股权激励，给还是不给？'],
  },
  {
    id:'e10', type:'employee', category:'narrative',
    acts:[0,1,2,3,4], cooldown:60, weight:4,
    title:'团队文化建设',
    getDesc:()=>'你的团队规模扩大，需要建立更明确的文化和价值观。这会影响招聘、留人和团队效率。',
    effects:{ money:[0.9,1.05], reputation:[10,20], stress:[-5,10] },
    choices:[
      { text:'制定明确的价值观手册', effect:{ money:0.95, reputation:15, stress:5 }, label:'制度化的文化' },
      { text:'用活动和仪式感建设文化', effect:{ money:0.9, reputation:20, stress:-5 }, label:'体验式文化' },
      { text:'让文化自然生长', effect:{ money:1.05, reputation:10, stress:10 }, label:'自然演进' },
    ],
    fallbacks:['团队文化是需要主动建设的。','文化是公司性格的决定因素。'],
  },

  // ===== 政策类 (8) =====
  {
    id:'p01', type:'policy', category:'narrative',
    acts:[0,1,2,3,4], cooldown:80, weight:5,
    title:'政府补贴申请',
    getDesc:()=>{
      const p=['科技型企业补贴','大学生创业扶持','高新技术企业税收减免','人才引进补贴','数字化转型补贴'];
      return `新海市发布了${p[Math.floor(Math.random()*p.length)]}政策。你可以申请。`;
    },
    effects:{ money:[1.0,1.3], reputation:[5,15], stress:[5,20] },
    choices:[
      { text:'认真准备材料申请', effect:{ money:1.2, reputation:10, stress:15 }, label:'全力申请' },
      { text:'请中介代办', effect:{ money:1.1, reputation:5, stress:5 }, label:'外包搞定' },
      { text:'不申请，专注业务', effect:{ money:1.0, reputation:0, stress:0 }, label:'不凑热闹' },
    ],
    fallbacks:['政府补贴，拿得到是香饽饽，拿不到是浪费时间。','有政策红利，你要不要申请？'],
  },
  {
    id:'p02', type:'policy', category:'narrative',
    acts:[1,2,3,4], cooldown:100, weight:5,
    title:'税务稽查',
    getDesc:()=>'税务局通知要来稽查。你的财务记录基本规范，但有些模糊地带。',
    effects:{ money:[0.8,1.0], reputation:[-15,10], stress:[20,40] },
    choices:[
      { text:'主动配合，补缴模糊部分', effect:{ money:0.85, reputation:10, stress:20 }, label:'主动合规' },
      { text:'请税务师筹划', effect:{ money:0.9, reputation:0, stress:15 }, label:'专业筹划' },
      { text:'利用政策合理性辩护', effect:{ money:0.95, reputation:-5, stress:35 }, label:'法律边界' },
    ],
    fallbacks:['税务局来了，这是每个老板都要面对的。','稽查，有人坦然，有人心虚。'],
  },
  {
    id:'p03', type:'policy', category:'narrative',
    acts:[0,1,2], cooldown:90, weight:4,
    title:'营商环境变化',
    getDesc:()=>`新海市的营商环境${Math.random()>0.5?'改善了':'出现了新挑战'}。${Math.random()>0.5?'审批加速，政府服务提升。':'新增了若干行业准入限制。'}`,

    effects:{ money:[0.95,1.15], reputation:[0,15], stress:[-10,20] },
    choices:[
      { text:'抓住机遇，加速扩张', effect:{ money:1.15, reputation:10, stress:10 }, label:'顺势扩张' },
      { text:'观望，评估风险', effect:{ money:1.05, reputation:5, stress:0 }, label:'谨慎观望' },
      { text:'多参与政府座谈会', effect:{ money:0.95, reputation:15, stress:15 }, label:'政商互动' },
    ],
    fallbacks:['营商环境在变化，有人在受益，有人在抱怨。','政策和市场，永远在博弈。'],
  },
  {
    id:'p04', type:'policy', category:'narrative',
    acts:[1,2,3,4], cooldown:110, weight:4,
    title:'环保检查',
    getDesc:()=>{
      const r=Math.random()>0.5?'有一些需要改进的地方':'基本合规，但检查总是让人紧张';
      return `环保局来检查了。你的业务${r}。`;
    },
    effects:{ money:[0.85,1.05], reputation:[-10,20], stress:[15,35] },
    choices:[
      { text:'主动整改，超标完成', effect:{ money:0.85, reputation:20, stress:15 }, label:'环保先锋' },
      { text:'最低限度合规', effect:{ money:0.95, reputation:0, stress:25 }, label:'及格就好' },
      { text:'请中介协调', effect:{ money:0.9, reputation:-5, stress:20 }, label:'花钱消灾' },
    ],
    fallbacks:['环保检查，这是制造业和物流业都要面对的。','合规的成本不低，但不合规的代价更高。'],
  },
  {
    id:'p05', type:'policy', category:'narrative',
    acts:[1,2,3,4], cooldown:70, weight:4,
    title:'人才政策红利',
    getDesc:()=>'新海市推出新的人才政策：高端人才落户补贴、租房补贴、子女入学便利。你可以利用这个政策吸引更好的人才。',
    effects:{ money:[0.9,1.1], reputation:[10,20], stress:[-5,10], connections:[2,8] },
    choices:[
      { text:'大力招聘高端人才', effect:{ money:0.9, reputation:20, connections:8, stress:5 }, label:'人才战略' },
      { text:'适度利用政策', effect:{ money:1.0, reputation:10, connections:3, stress:0 }, label:'适度利用' },
      { text:'政策太多坑，不凑热闹', effect:{ money:1.1, reputation:0, connections:0, stress:-5 }, label:'冷眼旁观' },
    ],
    fallbacks:['人才政策来了，有人在抢人，有人在观望。','政策红利，抓住了是机遇，抓不住是遗憾。'],
  },
  {
    id:'p06', type:'policy', category:'narrative',
    acts:[1,2,3], cooldown:60, weight:3,
    title:'行业协会入会邀请',
    getDesc:()=>'你被邀请加入新海市商业行业协会。会费不菲，但能接触到行业内部信息和高端人脉。',
    effects:{ money:[0.9,1.05], reputation:[10,25], stress:[0,15], connections:[2,8] },
    choices:[
      { text:'入会，积极参与', effect:{ money:0.9, reputation:25, connections:8, stress:10 }, label:'融入圈子' },
      { text:'入会但不活跃', effect:{ money:0.95, reputation:10, connections:3, stress:5 }, label:'低调入会' },
      { text:'不加入，独立发展', effect:{ money:1.05, reputation:0, connections:0, stress:0 }, label:'独行侠' },
    ],
    fallbacks:['行业协会，入还是不入？','圈子有时候是有用的，有时候是浪费时间。'],
  },
  {
    id:'p07', type:'policy', category:'decision',
    acts:[2,3,4], cooldown:120, weight:4,
    title:'数据安全合规',
    getDesc:()=>'新的数据安全法规出台，你的业务涉及用户数据处理，需要投入合规成本。不合规将面临重罚。',
    effects:{ money:[0.8,0.95], reputation:[10,30], stress:[20,40] },
    choices:[
      { text:'全面合规，打造标杆', effect:{ money:0.8, reputation:30, stress:20 }, label:'合规标杆' },
      { text:'最低限度合规', effect:{ money:0.9, reputation:10, stress:30 }, label:'底线合规' },
      { text:'调整业务模式降低合规压力', effect:{ money:0.95, reputation:15, stress:25 }, label:'模式调整' },
    ],
    fallbacks:['数据安全法规，这是数字经济的必修课。','合规是大势所趋，但成本是实实在在的。'],
  },
  {
    id:'p08', type:'policy', category:'narrative',
    acts:[3,4], cooldown:150, weight:3,
    title:'反垄断预警',
    getDesc:()=>`你的市场份额在扩大，有媒体开始讨论"${(SGame.G&&SGame.G.playerName)||'你'}会不会成为下一个被反垄断的对象"。`,
    effects:{ money:[0.9,1.1], reputation:[-20,20], stress:[20,50] },
    choices:[
      { text:'主动拆分业务，降低市场份额', effect:{ money:0.9, reputation:20, stress:20 }, label:'主动拆降' },
      { text:'加强公关，塑造"创新者"形象', effect:{ money:0.95, reputation:15, stress:30 }, label:'公关先行' },
      { text:'继续扩张，先做大再说了', effect:{ money:1.1, reputation:-10, stress:50 }, label:'激进攻势' },
    ],
    fallbacks:['反垄断的达摩克利斯之剑，悬在每个大玩家头上。','做大之后，你会面临新的游戏规则。'],
  },

  // ===== 运营类 (8) =====
  {
    id:'o01', type:'operation', category:'narrative',
    acts:[0,1,2,3,4], cooldown:40, weight:6,
    title:'媒体曝光',
    getDesc:()=>{
      const m=['新海商报','锦绣网','星海财经','新海日报'];
      const r=['创新模式','高速增长','社会责任','行业地位'];
      return `你的公司被${m[Math.floor(Math.random()*m.length)]}报道了，原因是${r[Math.floor(Math.random()*r.length)]}。`;
    },
    effects:{ money:[0.95,1.2], reputation:[15,35], stress:[-10,10] },
    choices:[
      { text:'趁热打铁，扩大宣传', effect:{ money:0.95, reputation:35, stress:5 }, label:'趁热打铁' },
      { text:'低调处理，继续做事', effect:{ money:1.1, reputation:15, stress:-10 }, label:'低调做事' },
      { text:'接受专访，讲好故事', effect:{ money:1.0, reputation:30, stress:10 }, label:'讲好故事' },
    ],
    fallbacks:['媒体曝光，有人欢喜有人忧。','曝光是双刃剑，用好了是东风，用不好是火焰。'],
  },
  {
    id:'o02', type:'operation', category:'narrative',
    acts:[0,1,2,3], cooldown:50, weight:5,
    title:'供应链优化机会',
    getDesc:()=>'你发现了一个优化供应链的机会，可以降低成本，但需要前期投入。',
    effects:{ money:[0.85,1.15], reputation:[0,15], stress:[5,20] },
    choices:[
      { text:'投资优化', effect:{ money:0.85, reputation:10, stress:15 }, label:'长期投资' },
      { text:'小步测试再决定', effect:{ money:1.0, reputation:5, stress:5 }, label:'小步测试' },
      { text:'不投，维持现状', effect:{ money:1.05, stress:0 }, label:'维持现状' },
    ],
    fallbacks:['供应链优化，投还是不投？','效率的提升，往往来自持续的投入。'],
  },
  {
    id:'o03', type:'operation', category:'decision',
    acts:[1,2,3,4], cooldown:60, weight:5,
    title:'产品升级决策',
    getDesc:()=>'你的主力产品需要一次大版本升级。投入大，但可能带来突破性增长。',
    effects:{ money:[0.7,1.6], reputation:[10,40], stress:[20,50] },
    choices:[
      { text:'全力投入升级', effect:{ money:0.7, reputation:40, stress:50 }, label:'All-in升级' },
      { text:'渐进式升级', effect:{ money:0.9, reputation:20, stress:20 }, label:'渐进升级' },
      { text:'先做MVP测试市场', effect:{ money:1.0, reputation:15, stress:15 }, label:'MVP测试' },
    ],
    fallbacks:['产品升级，这是每个公司都要面对的决策。','升级有风险，不升级有危机。'],
  },
  {
    id:'o04', type:'operation', category:'narrative',
    acts:[0,1,2,3,4], cooldown:70, weight:4,
    title:'客户流失预警',
    getDesc:()=>'数据显示，你的客户流失率在上个月突然上升了。需要找出原因并应对。',
    effects:{ money:[0.85,1.0], reputation:[-20,5], stress:[15,30] },
    choices:[
      { text:'逐一回访流失客户', effect:{ money:0.9, reputation:5, stress:15 }, label:'深度回访' },
      { text:'推出retention优惠', effect:{ money:0.85, reputation:0, stress:20 }, label:'让利留人' },
      { text:'分析数据，优化产品', effect:{ money:0.95, reputation:10, stress:25 }, label:'产品优化' },
    ],
    fallbacks:['客户在流失，有人在离开你。','流失率是企业的体温计，温度不对要赶紧找原因。'],
  },
  {
    id:'o05', type:'operation', category:'decision',
    acts:[1,2,3,4], cooldown:80, weight:5,
    title:'品牌危机',
    getDesc:()=>{
      const r=['产品质量问题','员工维权','环境污染','虚假宣传'];
      return `社交媒体上出现了关于你公司的负面舆论：${r[Math.floor(Math.random()*4)]}。`;
    },
    effects:{ money:[0.8,1.1], reputation:[-30,10], stress:[30,60] },
    choices:[
      { text:'立即公开道歉+整改', effect:{ money:0.85, reputation:10, stress:30 }, label:'坦诚道歉' },
      { text:'找媒体朋友帮忙引导舆论', effect:{ money:0.9, reputation:-5, stress:40 }, label:'舆论引导' },
      { text:'冷处理，等热度过去', effect:{ money:1.1, reputation:-30, stress:50 }, label:'冷处理' },
    ],
    fallbacks:['品牌危机来了，你在风暴中心。','舆论可以成就你，也可以在一天内摧毁你。'],
  },
  {
    id:'o06', type:'operation', category:'decision',
    acts:[1,2,3], cooldown:60, weight:5,
    title:'扩张决策',
    getDesc:()=>{
      const r=['在新海市另一个区开分公司','在另一个城市开分部','收购一家小竞争对手','增加一条产品线'];
      return `你考虑${r[Math.floor(Math.random()*r.length)]}。`;
    },
    effects:{ money:[0.7,1.4], reputation:[5,25], stress:[20,45] },
    choices:[
      { text:'果断扩张', effect:{ money:0.7, reputation:25, stress:45 }, label:'果断扩张' },
      { text:'先做市场调研', effect:{ money:0.9, reputation:10, stress:20 }, label:'谨慎调研' },
      { text:'暂不扩张，专注现有业务', effect:{ money:1.1, reputation:5, stress:5 }, label:'专注现有' },
    ],
    fallbacks:['扩张，是每个成长中公司的诱惑和考验。','做大了就要想：下一步去哪里？'],
  },
  {
    id:'o07', type:'operation', category:'decision',
    acts:[1,2,3,4], cooldown:90, weight:4,
    title:'合作伙伴背叛',
    getDesc:()=>'你的长期合作伙伴突然单方面终止合同，转向了你的竞争对手。损失不小，信任感崩塌。',
    effects:{ money:[0.7,0.95], reputation:[-15,0], stress:[30,60] },
    choices:[
      { text:'法律途径维权', effect:{ money:0.7, reputation:0, stress:40 }, label:'法律维权' },
      { text:'谈判，争取最大利益', effect:{ money:0.85, reputation:-5, stress:30 }, label:'谈判博弈' },
      { text:'快速寻找替代伙伴', effect:{ money:0.9, reputation:5, stress:50 }, label:'快速替代' },
    ],
    fallbacks:['商业世界里，没有永远的朋友，只有永远的利益。','背叛是商业的一部分，关键是你如何应对。'],
  },
  {
    id:'o08', type:'operation', category:'narrative',
    acts:[1,2,3,4], cooldown:100, weight:4,
    title:'技术突破',
    getDesc:()=>{
      const t=['算法效率提升3倍','成本降低40%','用户体验大幅提升','新产品原型验证成功'];
      return `你的研发团队取得了一个技术突破：${t[Math.floor(Math.random()*t.length)]}。`;
    },
    effects:{ money:[0.85,1.3], reputation:[20,40], stress:[-10,20] },
    choices:[
      { text:'快速产品化，抢占市场', effect:{ money:0.85, reputation:40, stress:20 }, label:'快速产品化' },
      { text:'申请专利，构建壁垒', effect:{ money:0.95, reputation:30, stress:5 }, label:'专利壁垒' },
      { text:'开放技术，建立生态', effect:{ money:1.1, reputation:35, stress:-10 }, label:'开放生态' },
    ],
    fallbacks:['技术突破是可遇不可求的。','有了技术，还要有产品化和商业化的能力。'],
  },

  // ===== 个人类 (6) =====
  {
    id:'pers01', type:'personal', category:'narrative',
    acts:[0,1,2,3,4], cooldown:100, weight:3,
    title:'顿悟时刻',
    getDesc:()=>'你在深夜复盘时，突然对公司的战略方向有了全新的认识。这种顿悟感让你兴奋不已。',
    effects:{ money:[1.0,1.1], reputation:[0,10], stress:[-20,0] },
    choices:[
      { text:'立即调整战略方向', effect:{ money:0.9, reputation:10, stress:10 }, label:'战略转型' },
      { text:'深度思考后再决定', effect:{ money:1.0, reputation:5, stress:-10 }, label:'深度思考' },
    ],
    fallbacks:['顿悟时刻，每个创业者都会经历。','深夜的思考，有时候比白天的会议更有价值。'],
  },
  {
    id:'pers02', type:'personal', category:'narrative',
    acts:[0,1,2,3], cooldown:120, weight:3,
    title:'家庭支持',
    getDesc:()=>'你的家人表示支持和理解，在你压力最大的时候给了你温暖。这让你重新充满了能量。',
    effects:{ money:[1.0,1.05], reputation:[0,5], stress:[-20,-10] },
    choices:[
      { text:'多花时间陪伴家人', effect:{ stress:-20 }, label:'平衡生活' },
      { text:'带着家人的支持继续拼搏', effect:{ money:1.05, reputation:5, stress:-10 }, label:'化支持为动力' },
    ],
    fallbacks:['家人的支持，是创业者最坚强的后盾。','在商海浮沉，家是永远的港湾。'],
  },
  {
    id:'pers03', type:'personal', category:'decision',
    acts:[2,3,4], cooldown:200, weight:2,
    title:'是否要放弃？',
    getDesc:()=>'连续几次失败让你开始怀疑：是不是该放弃，去找份稳定工作？这个念头在深夜特别强烈。',
    effects:{ money:[0.9,1.2], reputation:[-20,20], stress:[0,50] },
    choices:[
      { text:'不放弃，调整方向再来', effect:{ money:1.0, reputation:20, stress:20 }, label:'坚持到底' },
      { text:'暂时休息，调整状态', effect:{ money:0.95, reputation:0, stress:-30 }, label:'暂时休整' },
      { text:'放弃，但保留经验和人脉', effect:{ money:1.2, reputation:-20, stress:50 }, label:'体面退出', ending:'回归平凡' },
    ],
    fallbacks:['每个创业者都会在深夜问自己：还要继续吗？','放弃是一种选择，坚持是另一种。'],
    isEnding:true,
  },
  {
    id:'pers04', type:'personal', category:'narrative',
    acts:[1,2,3,4], cooldown:150, weight:3,
    title:'健康警告',
    getDesc:()=>{
      const r=['体检报告有几项异常','深夜加班后晕倒了','医生建议你至少要保证睡眠'];
      return `你的身体发出了警告：${r[Math.floor(Math.random()*3)]}。`;
    },
    effects:{ money:[0.95,1.05], reputation:[0,5], stress:[0,20] },
    choices:[
      { text:'降低工作强度，保重身体', effect:{ money:0.95, reputation:5, stress:-20 }, label:'健康第一' },
      { text:'请私厨/健身教练/体检套餐', effect:{ money:0.9, reputation:0, stress:-10 }, label:'健康管理' },
      { text:'继续拼，身体扛得住', effect:{ money:1.05, reputation:0, stress:20 }, label:'拼命三郎' },
    ],
    fallbacks:['健康是1，其他是0。但没有压力，也很难有动力。','创业者的健康，是个永恒的矛盾。'],
  },
  {
    id:'pers05', type:'personal', category:'narrative',
    acts:[1,2,3], cooldown:180, weight:2,
    title:'传奇导师出现',
    getDesc:()=>'一位行业传奇人物主动联系你，愿意做你的导师。这是千载难逢的机会。',
    effects:{ money:[0.9,1.2], reputation:[20,40], stress:[-10,10], connections:[5,15] },
    choices:[
      { text:'虚心请教，建立长期关系', effect:{ money:0.9, reputation:40, connections:15, stress:-10 }, label:'拜师学艺' },
      { text:'适度交流，保持独立', effect:{ money:1.1, reputation:25, connections:5, stress:5 }, label:'独立交流' },
      { text:'婉拒，不想被影响', effect:{ money:1.2, reputation:10, connections:0, stress:10 }, label:'独立发展' },
    ],
    fallbacks:['传奇导师，这是可遇不可求的机遇。','有人愿意指点你，说明你已经引起了注意。'],
  },
  {
    id:'pers06', type:'personal', category:'narrative',
    acts:[3,4], cooldown:300, weight:2,
    title:'财富自由的真正意义',
    getDesc:()=>`资产已经超过${(SGame.G&&SGame.G.money||0)>1000000000?'10亿':'1亿'}，你开始思考：钱够了之后，什么是真正重要的？`,
    effects:{ money:[0.95,1.05], reputation:[10,30], stress:[-30,0] },
    choices:[
      { text:'转向社会责任和公益', effect:{ money:0.95, reputation:30, stress:-30 }, label:'社会责任' },
      { text:'继续扩张，追求更大目标', effect:{ money:1.05, reputation:15, stress:10 }, label:'继续征途' },
      { text:'写书/演讲/传承经验', effect:{ money:1.0, reputation:25, stress:-20 }, label:'经验传承' },
    ],
    fallbacks:['财富自由之后，什么是真正重要的？','钱够了，人生的意义需要重新定义。'],
  },

  // ===== NPC事件 (10) =====
  {
    id:'npc_zl_1', type:'npc', category:'narrative', npc:'zhaolei',
    acts:[0,1,2], cooldown:80, weight:5,
    title:'赵磊的困境',
    getDesc:()=>'前同事赵磊联系你，他的创业项目遇到了资金困难，想找你聊聊。你们曾经一起在大厂熬夜，关系不错。',
    effects:{ money:[0.9,1.2], reputation:[0,10], stress:[0,15], npcFavor:{ zhaolei:5 } },
    choices:[
      { text:'投资他，帮一把', effect:{ money:0.9, reputation:10, stress:10 }, label:'雪中送炭' },
      { text:'介绍投资人给他', effect:{ money:1.1, reputation:5, stress:5 }, label:'牵线搭桥' },
      { text:'委婉拒绝，专注自己', effect:{ money:1.2, reputation:0, stress:15 }, label:'专注自身' },
    ],
    fallbacks:['前同事找你帮忙，帮还是不帮？','赵磊的困境，也是许多创业者的困境。'],
  },
  {
    id:'npc_lc_1', type:'npc', category:'narrative', npc:'lichu',
    acts:[0,1,2,3], cooldown:100, weight:4,
    title:'李处的审批',
    getDesc:()=>'李处通知你，你的某项业务审批进入了快速通道。这可能是因为你之前帮过他一个小忙。',
    effects:{ money:[1.0,1.15], reputation:[10,20], stress:[-5,5], npcFavor:{ lichu:8 } },
    choices:[
      { text:'表示感谢（适度送礼）', effect:{ money:0.95, reputation:15, stress:0 }, label:'知恩图报' },
      { text:'公事公办，不拉近不疏远', effect:{ money:1.1, reputation:10, stress:5 }, label:'保持距离' },
      { text:'趁势建立长期关系', effect:{ money:1.0, reputation:20, stress:10 }, label:'深度经营' },
    ],
    fallbacks:['审批快了，这是政府关系的价值。','李处的人情，你是要继续经营还是就此打住？'],
  },
  {
    id:'npc_zy_1', type:'npc', category:'narrative', npc:'zhangye',
    acts:[1,2,3,4], cooldown:90, weight:4,
    title:'张野的情报',
    getDesc:()=>'张野告诉你一个内幕消息：有竞争对手打算在媒体上做文章黑你。他可以帮你提前布局防御，但需要你付出一些代价。',
    effects:{ money:[0.85,1.0], reputation:[10,25], stress:[10,30], npcFavor:{ zhangye:10 } },
    choices:[
      { text:'合作，买他的情报和服务', effect:{ money:0.85, reputation:25, stress:15 }, label:'信息战' },
      { text:'自己做好产品，不玩阴的', effect:{ money:1.0, reputation:15, stress:25 }, label:'光明正大' },
      { text:'反向利用，设局反杀', effect:{ money:0.9, reputation:20, stress:30 }, label:'将计就计' },
    ],
    fallbacks:['张野的情报，真还是假？','媒体战，这是商战的另一种形式。'],
  },
  {
    id:'npc_cz_1', type:'npc', category:'decision', npc:'chenzong',
    acts:[1,2,3,4], cooldown:120, weight:4,
    title:'陈总的威胁',
    getDesc:()=>'陈总通过中间人向你传话：你的某个业务"碰了他的蛋糕"，要么合作，要么"后果自负"。',
    effects:{ money:[0.7,1.3], reputation:[-20,30], stress:[30,70], npcFavor:{ chenzong:-15 } },
    choices:[
      { text:'硬刚，应战', effect:{ money:0.7, reputation:30, stress:70 }, label:'正面硬刚' },
      { text:'谈判，寻求合作', effect:{ money:1.1, reputation:10, stress:30 }, label:'化敌为友' },
      { text:'迂回，避开他的核心领域', effect:{ money:1.3, reputation:-20, stress:40 }, label:'战略避让' },
    ],
    fallbacks:['陈总的威胁，这是商战的直白表达。','大佬的餐桌，不是谁都能上座的。'],
  },
  {
    id:'npc_xc_1', type:'npc', category:'narrative', npc:'xiaoc',
    acts:[2,3,4], cooldown:150, weight:3,
    title:'小C的首次会面',
    getDesc:()=>'神秘投资人小C主动约你见面。她代表一个神秘资本集团，对你的公司很感兴趣，但开出的条件很苛刻。',
    effects:{ money:[1.0,1.5], reputation:[20,40], stress:[20,40], npcFavor:{ xiaoc:10 } },
    choices:[
      { text:'接受投资，接受条件', effect:{ money:1.5, reputation:30, stress:20 }, label:'资本助力' },
      { text:'谈判，争取更好条件', effect:{ money:1.2, reputation:40, stress:35 }, label:'强势谈判' },
      { text:'拒绝，保持独立', effect:{ money:1.0, reputation:20, stress:40 }, label:'独立发展' },
    ],
    fallbacks:['小C的条件，接受还是拒绝？','神秘资本，是助力还是陷阱？'],
  },
  // NPC好感提升事件
  {
    id:'npc_zl_2', type:'npc', category:'narrative', npc:'zhaolei',
    acts:[1,2,3], cooldown:100, weight:3,
    title:'赵磊的合作邀请',
    getDesc:()=>'赵磊的公司走上了正轨，他邀请你一起合作一个大项目。这可能是双赢的机会。',
    effects:{ money:[1.1,1.4], reputation:[10,25], stress:[5,20], npcFavor:{ zhaolei:10 } },
    choices:[
      { text:'欣然接受，深度合作', effect:{ money:1.4, reputation:25, stress:20 }, label:'深度合作' },
      { text:'谨慎评估后再决定', effect:{ money:1.2, reputation:15, stress:10 }, label:'谨慎评估' },
      { text:'婉拒，专注自己的路', effect:{ money:1.1, reputation:10, stress:5 }, label:'婉拒' },
    ],
    fallbacks:['前同事变成了合作伙伴，这是最好的结局。','合作有风险，但不合作可能错过机会。'],
  },
  {
    id:'npc_lc_2', type:'npc', category:'narrative', npc:'lichu',
    acts:[1,2,3,4], cooldown:120, weight:3,
    title:'李处的内部信息',
    getDesc:()=>'李处私下告诉你，近期会有新的行业政策出台，你可以提前布局。',
    effects:{ money:[1.2,1.5], reputation:[5,15], stress:[0,10], npcFavor:{ lichu:10 } },
    choices:[
      { text:'提前布局，抢占先机', effect:{ money:1.3, reputation:15, stress:10 }, label:'提前布局' },
      { text:'表示感谢，但不急', effect:{ money:1.2, reputation:10, stress:5 }, label:'表示感谢' },
      { text:'请他吃饭，加深关系', effect:{ money:1.1, reputation:5, stress:0 }, label:'加深关系' },
    ],
    fallbacks:['内部信息，这是政府人脉的真正价值。','李处愿意告诉你，说明好感度已经不低了。'],
  },
  {
    id:'npc_zy_2', type:'npc', category:'decision', npc:'zhangye',
    acts:[2,3,4], cooldown:100, weight:3,
    title:'张野的媒体攻势',
    getDesc:()=>'张野提出可以帮你策划一次大规模的媒体曝光，让你的品牌迅速出圈。费用不菲，但效果可能很惊人。',
    effects:{ money:[0.8,1.6], reputation:[20,50], stress:[15,40], npcFavor:{ zhangye:5 } },
    choices:[
      { text:'全力投入，相信他的能力', effect:{ money:0.8, reputation:35, stress:40 }, label:'相信专业' },
      { text:'小额测试效果', effect:{ money:1.2, reputation:20, stress:15 }, label:'小额测试' },
      { text:'自己做媒体，不靠他', effect:{ money:1.4, reputation:30, stress:25 }, label:'独立自主' },
    ],
    fallbacks:['张野在媒体圈有资源，但要不要花这个钱？','媒体曝光是一把双刃剑。'],
  },
  {
    id:'npc_cz_2', type:'npc', category:'narrative', npc:'chenzong',
    acts:[2,3,4], cooldown:150, weight:3,
    title:'陈总的橄榄枝',
    getDesc:()=>'陈总派人来传话，说上次是误会，他愿意和你在某些业务上合作，条件是你退出他的核心领域。',
    effects:{ money:[1.2,1.8], reputation:[10,30], stress:[10,30], npcFavor:{ chenzong:15 } },
    choices:[
      { text:'接受合作，各取所需', effect:{ money:1.8, reputation:30, stress:30 }, label:'化敌为友' },
      { text:'表面合作，暗中布局', effect:{ money:1.4, reputation:20, stress:20 }, label:'表面文章' },
      { text:'再次拒绝，继续竞争', effect:{ money:1.2, reputation:10, stress:40 }, label:'继续竞争' },
    ],
    fallbacks:['陈总的橄榄枝，是真心的还是另有所图？','大佬的每一个动作，都有深意。'],
  },
  {
    id:'npc_xc_2', type:'npc', category:'decision', npc:'xiaoc',
    acts:[3,4], cooldown:180, weight:2,
    title:'小C的终极条件',
    getDesc:()=>'小C告诉你，她的集团可以给你一笔巨额投资，条件是你要让出控股权。这是创业者的终极抉择：控制权 vs 规模。',
    effects:{ money:[2.0,3.0], reputation:[30,50], stress:[30,60] },
    choices:[
      { text:'接受，用控制权换规模', effect:{ money:3.0, reputation:50, stress:60 }, label:'规模优先' },
      { text:'谈判，保留控制权', effect:{ money:2.0, reputation:40, stress:40 }, label:'控制权优先' },
      { text:'拒绝，独立发展到最后', effect:{ money:1.0, reputation:30, stress:30 }, label:'独立到底' },
    ],
    fallbacks:['控制权和规模，这是每个创业者都要面对的终极抉择。','小C代表的那条路，是捷径，也是放弃。'],
    isEnding:true,
  },

  // ===== 里程碑事件 (5) =====
  {
    id:'milestone_1m', type:'milestone', category:'narrative',
    acts:[0,1], cooldown:0, weight:10,
    title:'里程碑：100万！',
    getDesc:()=>{
      const name=(SGame.G&&SGame.G.playerName)||'你'; return `${name}的资产达到了100万！你从零开始，终于在新海市站稳了脚跟。\n\n第一幕《起航》完成，第二幕《崛起》开启！`;
    },
    effects:{ reputation:[10,20], stress:[-15,-5] },
    choices:[
      { text:'乘胜追击', effect:{ reputation:20, stress:-10 }, label:'乘胜追击' },
      { text:'总结经验', effect:{ reputation:15, stress:-15 }, label:'沉淀思考' },
    ],
    milestone:1000000,
    fallbacks:['100万！你做到了！从零到100万，这是第一步，但也是最重要的一步。'],
  },
  {
    id:'milestone_10m', type:'milestone', category:'narrative',
    acts:[1,2], cooldown:0, weight:10,
    title:'里程碑：1000万！',
    getDesc:()=>{
      const name=(SGame.G&&SGame.G.playerName)||'你'; return `${name}的资产达到了1000万！你已经是新海市商界的新星了。更多的人开始注意到你。\n\n第二幕《崛起》完成，第三幕《入局》开启！`;
    },
    effects:{ reputation:[15,25], stress:[-20,-10], connections:[5,15] },
    choices:[
      { text:'接受挑战', effect:{ reputation:25, connections:15, stress:-10 }, label:'接受挑战' },
      { text:'思考下一步战略', effect:{ reputation:20, stress:-20 }, label:'深度思考' },
    ],
    milestone:10000000,
    fallbacks:['1000万！你不再是小老板了，你是商界新星。'],
  },
  {
    id:'milestone_100m', type:'milestone', category:'narrative',
    acts:[2,3], cooldown:0, weight:10,
    title:'里程碑：1亿！',
    getDesc:()=>{
      const name=(SGame.G&&SGame.G.playerName)||'你'; return `${name}的资产达到了1亿！你正式进入了新海市商界的顶层圈子。大佬们开始把你当回事。\n\n第三幕《入局》完成，第四幕《争霸》开启！`;
    },
    effects:{ reputation:[20,30], stress:[-25,-10], connections:[10,20] },
    choices:[
      { text:'继续征途', effect:{ reputation:30, connections:20, stress:-10 }, label:'继续征途' },
      { text:'思考社会责任', effect:{ reputation:25, stress:-25 }, label:'社会责任' },
    ],
    milestone:100000000,
    fallbacks:['1亿！你是新海市的商业传奇了。'],
  },
  {
    id:'milestone_1b', type:'milestone', category:'narrative',
    acts:[3,4], cooldown:0, weight:10,
    title:'里程碑：10亿！',
    getDesc:()=>{
      const name=(SGame.G&&SGame.G.playerName)||'你'; return `${name}的资产达到了10亿！你站在了新海市商业版图的顶峰。现在的问题是：然后呢？\n\n第四幕《争霸》完成，第五幕《浮沉》开启！`;
    },
    effects:{ reputation:[25,40], stress:[-30,0], connections:[15,30] },
    choices:[
      { text:'继续扩张，走向全国/全球', effect:{ reputation:40, connections:18, stress:0 }, label:'全球征途' },
      { text:'写书/传承，影响更多人', effect:{ reputation:35, stress:-30 }, label:'经验传承' },
    ],
    milestone:1000000000,
    fallbacks:['10亿！你站在了顶峰，然后呢？'],
  },
  {
    id:'milestone_10b', type:'milestone', category:'narrative',
    acts:[4], cooldown:0, weight:10,
    title:'里程碑：100亿！',
    getDesc:()=>{
      const name=(SGame.G&&SGame.G.playerName)||'你'; return `${name}的资产达到了100亿！你已经是商界传奇，新海市的地标建筑有你的名字。但你是否还记得，当初那个在大厂离职后决定创业的自己？\n\n所有幕次完成！`;
    },
    effects:{ reputation:[30,50], stress:[-40,-10] },
    choices:[
      { text:'继续经营（无尽模式）', effect:{}, label:'继续征途' },
      { text:'结束游戏，查看结局', ending:'商业帝国', label:'谢幕' },
    ],
    milestone:10000000000, isEnding:true,
    fallbacks:['100亿！你已经完成了大多数人无法想象的成就。'],
  },

  // ===== 商业竞争 (8) =====
  {
    id:'biz_comp_01', type:'market', category:'narrative',
    acts:[1,2,3,4], cooldown:60, weight:5,
    title:'竞争对手恶意挖人',
    getDesc:()=>{
      const e=(SGame.G&&SGame.G.employees)||[]; const name=e.length>0?e[Math.floor(Math.random()*e.length)].name:'你的核心员工';
      return `竞争对手${['速途科技','云帆创新','海天集团','星河互娱'][Math.floor(Math.random()*4)]}正在暗中接触${name}，开出了更高的薪资和股权。`;
    },
    effects:{ money:[0.8,0.95], reputation:[-10,5], stress:[15,35] },
    choices:[
      { text:'加薪+晋升，全力挽留', effect:{ money:0.8, reputation:5, stress:15 }, label:'重金挽留' },
      { text:'谈心+愿景，情感留人', effect:{ money:0.95, reputation:-5, stress:25 }, label:'情感留人' },
      { text:'让他走，招聘新人', effect:{ money:0.9, reputation:-10, stress:30 }, label:'换血重生' },
    ],
    fallbacks:['猎头在挖你的人，商战无处不在。','核心员工被盯上，考验你留人能力的时候到了。'],
  },
  {
    id:'biz_comp_02', type:'market', category:'decision',
    acts:[1,2,3,4], cooldown:80, weight:5,
    title:'价格战打响',
    getDesc:()=>{
      const rival=['速途科技','云帆创新','蓝海数据'][Math.floor(Math.random()*3)];
      return `${rival}突然大幅降价30%，直接冲击你的市场份额。客户开始动摇，销售团队压力山大。`;
    },
    effects:{ money:[0.6,1.3], reputation:[-10,15], stress:[25,50] },
    choices:[
      { text:'跟进降价，正面硬刚', effect:{ money:0.7, reputation:10, stress:40 }, label:'血战到底' },
      { text:'强化服务价值，差异化竞争', effect:{ money:0.9, reputation:15, stress:25 }, label:'差异化' },
      { text:'收缩战线，保住核心客户', effect:{ money:0.85, reputation:-5, stress:30 }, label:'战略收缩' },
    ],
    fallbacks:['价格战打响了，有人在烧钱抢市场。','降价是最粗暴的竞争手段，但也是最有效的。'],
  },
  {
    id:'biz_comp_03', type:'market', category:'narrative',
    acts:[2,3,4], cooldown:120, weight:4,
    title:'商业间谍疑云',
    getDesc:()=>{
      const biz=Object.values(SGame.G&&SGame.G.businesses||{}).find(b=>b.level>0);
      return `你发现公司的核心数据有被泄露的痕迹。信息部门追踪到了一个可疑的内网访问记录。有人在你眼皮底下偷东西。`;
    },
    effects:{ money:[0.8,1.0], reputation:[-25,5], stress:[25,45] },
    choices:[
      { text:'全面安全审查+报警', effect:{ money:0.85, reputation:5, stress:25 }, label:'严查到底' },
      { text:'内部调查，低调处理', effect:{ money:0.95, reputation:-10, stress:35 }, label:'暗查' },
      { text:'借机升级安全系统', effect:{ money:0.8, reputation:0, stress:30 }, label:'亡羊补牢' },
    ],
    fallbacks:['商业间谍，这可不是电影里的情节。','有人在偷你的东西，而你甚至不知道是谁。'],
  },
  {
    id:'biz_comp_04', type:'market', category:'narrative',
    acts:[1,2,3,4], cooldown:70, weight:5,
    title:'行业展会机会',
    getDesc:()=>{
      const expo=['新海国际创新展','长三角商业博览会','亚洲科技峰会','中国消费品牌大会'];
      return `${expo[Math.floor(Math.random()*4)]}即将开幕。参展费用${20+Math.floor(Math.random()*40)}万，但可能带来品牌曝光和合作机会。`;
    },
    effects:{ money:[0.7,1.3], reputation:[10,30], stress:[5,20], connections:[3,10] },
    choices:[
      { text:'全力参展，搭建豪华展台', effect:{ money:0.7, reputation:30, connections:10, stress:15 }, label:'豪华参展' },
      { text:'标准参展，重在参与', effect:{ money:0.9, reputation:15, connections:5, stress:5 }, label:'标准参展' },
      { text:'不去，省下来的钱做推广', effect:{ money:1.05, reputation:0, connections:0, stress:0 }, label:'不凑热闹' },
    ],
    fallbacks:['行业展会，是烧钱还是投资？','展会是江湖，总有人在那里找到贵人。'],
  },
  {
    id:'biz_comp_05', type:'market', category:'decision',
    acts:[2,3,4], cooldown:100, weight:4,
    title:'专利纠纷',
    getDesc:()=>{
      const company=['速途科技','海天集团','某海外巨头'][Math.floor(Math.random()*3)];
      return `${company}起诉你侵犯其专利权，索赔金额不小。法务团队评估：胜诉概率约${40+Math.floor(Math.random()*30)}%。`;
    },
    effects:{ money:[0.5,1.05], reputation:[-20,15], stress:[30,55] },
    choices:[
      { text:'应诉到底，捍卫清白', effect:{ money:0.5, reputation:15, stress:50 }, label:'应诉到底' },
      { text:'庭外和解，花钱消灾', effect:{ money:0.8, reputation:-10, stress:20 }, label:'庭外和解' },
      { text:'反诉对方，以攻为守', effect:{ money:0.6, reputation:5, stress:55 }, label:'以攻为守' },
    ],
    fallbacks:['专利纠纷是科技公司的必修课。','法庭上的较量，烧的是钱，磨的是心。'],
  },
  {
    id:'biz_comp_06', type:'market', category:'narrative',
    acts:[1,2,3,4], cooldown:90, weight:4,
    title:'关键供应商断供',
    getDesc:()=>{
      const r=['被竞争对手收购','突然涨价三倍','遭遇火灾停产','资金链断裂跑路'];
      return `你的关键供应商${r[Math.floor(Math.random()*4)]}。多条业务线面临停产风险。`;
    },
    effects:{ money:[0.6,0.95], reputation:[-15,5], stress:[25,45] },
    choices:[
      { text:'紧急寻找替代供应商', effect:{ money:0.75, reputation:0, stress:30 }, label:'紧急寻替' },
      { text:'消耗库存+暂缓非核心交付', effect:{ money:0.9, reputation:-15, stress:25 }, label:'消耗库存' },
      { text:'收购该供应商，向上游延伸', effect:{ money:0.6, reputation:10, stress:45 }, label:'向上游延伸' },
    ],
    fallbacks:['供应商断了，你的业务也跟着断。','供应链是商业的血管，血管堵了，人会死。'],
  },
  {
    id:'biz_comp_07', type:'market', category:'decision',
    acts:[2,3,4], cooldown:150, weight:3,
    title:'并购机会降临',
    getDesc:()=>{
      const target=['速途科技','蓝海数据','某区域连锁品牌'][Math.floor(Math.random()*3)];
      const price=500+Math.floor(Math.random()*1500);
      return `${target}因经营不善正在寻求出售，收购价约${price}万。收购后可获得其市场份额和技术团队，在该区域获得20%加成。`;
    },
    effects:{ money:[0.3,1.6], reputation:[15,35], stress:[25,50], connections:[5,15] },
    choices:[
      { text:'果断收购，快速整合', effect:{ money:0.3, reputation:35, connections:15, stress:50 }, label:'果断收购' },
      { text:'谈判压价，争取更好条件', effect:{ money:0.6, reputation:20, connections:10, stress:30 }, label:'谈判压价' },
      { text:'放弃收购，专注自身', effect:{ money:1.0, reputation:5, connections:0, stress:10 }, label:'专注自身' },
    ],
    fallbacks:['并购是弯道超车的机会，也可能是翻车的陷阱。','有人要卖公司，你要不要买？'],
  },
  {
    id:'biz_comp_08', type:'market', category:'narrative',
    acts:[2,3,4], cooldown:90, weight:4,
    title:'匿名举报',
    getDesc:()=>'你收到消息：有人向监管部门匿名举报你的公司存在"不正当竞争"。虽然你没有违规，但调查期间的负面舆论不可避免。',
    effects:{ money:[0.85,1.0], reputation:[-25,10], stress:[20,40] },
    choices:[
      { text:'主动配合调查，发布澄清声明', effect:{ money:0.9, reputation:10, stress:20 }, label:'透明应对' },
      { text:'请公关公司引导舆论', effect:{ money:0.85, reputation:-10, stress:30 }, label:'公关灭火' },
      { text:'低调等调查结束', effect:{ money:1.0, reputation:-25, stress:35 }, label:'冷处理' },
    ],
    fallbacks:['匿名举报，不知道是谁，但影响是真实的。','商场如战场，暗箭难防。'],
  },

  // ===== 人际关系 (6) =====
  {
    id:'relation_01', type:'personal', category:'decision',
    acts:[0,1,2,3], cooldown:80, weight:5,
    title:'老同学求助',
    getDesc:()=>{
      const name=['王磊','李明','张华','刘洋'][Math.floor(Math.random()*4)];
      const reason=['创业急需启动资金','家里出了急事','投资失败急需周转'];
      return `大学同学${name}突然联系你，说${reason[Math.floor(Math.random()*3)]}，想借${5+Math.floor(Math.random()*15)}万。你们毕业后很少联系，但当年关系不错。`;
    },
    effects:{ money:[0.85,1.0], reputation:[5,20], stress:[5,20] },
    choices:[
      { text:'借钱给他，相信同学情谊', effect:{ money:0.85, reputation:20, stress:5 }, label:'仗义相助' },
      { text:'表示关心但不借钱', effect:{ money:1.0, reputation:5, stress:15 }, label:'婉拒' },
      { text:'帮他介绍工作机会', effect:{ money:0.95, reputation:15, stress:10 }, label:'曲线帮忙' },
    ],
    fallbacks:['老同学开口借钱，帮还是不帮？','人情债最是难还，但同学一场，能帮就帮。'],
  },
  {
    id:'relation_02', type:'personal', category:'narrative',
    acts:[1,2,3,4], cooldown:90, weight:4,
    title:'商会年度晚宴',
    getDesc:()=>'新海市商业联合会年度晚宴即将举行。入场券价格不菲，但几乎所有商界名流都会出席。这是拓展人脉的好机会。',
    effects:{ money:[0.85,1.1], reputation:[5,25], stress:[-5,10], connections:[3,12] },
    choices:[
      { text:'购买VIP席位，主动社交', effect:{ money:0.85, reputation:25, connections:12, stress:10 }, label:'VIP社交' },
      { text:'标准席位，低调参与', effect:{ money:0.95, reputation:15, connections:6, stress:0 }, label:'低调参与' },
      { text:'婉拒邀请，线上维系', effect:{ money:1.1, reputation:5, connections:3, stress:-5 }, label:'线上维系' },
    ],
    fallbacks:['商会晚宴，是社交场也是名利场。','在新海市商界，有些关系只能在酒桌上建立。'],
  },
  {
    id:'relation_03', type:'personal', category:'narrative',
    acts:[1,2,3], cooldown:120, weight:3,
    title:'行业前辈指点',
    getDesc:()=>'一位德高望重的行业前辈主动约你喝茶，分享了他几十年的经商心得。这种机会可遇不可求。',
    effects:{ money:[0.95,1.15], reputation:[5,20], stress:[-10,0], connections:[2,8] },
    choices:[
      { text:'虚心请教，建立长期关系', effect:{ money:0.95, reputation:20, connections:8, stress:-10 }, label:'拜师学艺' },
      { text:'适度交流，保持独立判断', effect:{ money:1.1, reputation:10, connections:4, stress:0 }, label:'适度交流' },
      { text:'专注自己的路', effect:{ money:1.15, reputation:5, connections:2, stress:5 }, label:'独立发展' },
    ],
    fallbacks:['前辈的指点，有时候一句话价值千金。','有人愿意指点你，说明你已经引起了注意。'],
  },
  {
    id:'relation_04', type:'personal', category:'decision',
    acts:[1,2,3,4], cooldown:100, weight:4,
    title:'合伙人矛盾激化',
    getDesc:()=>'公司内部出现了严重的分歧：合伙人之间对战略方向产生了根本性分歧，影响了团队士气和员工忠诚度。需要你做出决断。',
    effects:{ money:[0.8,1.1], reputation:[-15,15], stress:[30,55] },
    choices:[
      { text:'召开战略会，坦诚沟通', effect:{ money:0.9, reputation:15, stress:30 }, label:'坦诚沟通' },
      { text:'调整分工，划分权责', effect:{ money:0.95, reputation:5, stress:25 }, label:'制度化解' },
      { text:'协商退出，买断股份', effect:{ money:0.8, reputation:-5, stress:55 }, label:'买断退出' },
    ],
    fallbacks:['合伙人矛盾是创业路上最大的坑。','内部的分歧，比外部的竞争更难处理。'],
  },
  {
    id:'relation_05', type:'personal', category:'narrative',
    acts:[1,2,3,4], cooldown:150, weight:3,
    title:'贵人引荐',
    getDesc:()=>{
      const field=['科技','金融','地产','文化'][Math.floor(Math.random()*4)];
      return `一位朋友引荐你认识了一位${field}领域的重量级人物。对方对你的公司表现出兴趣，可能带来全新的业务机会。`;
    },
    effects:{ money:[0.9,1.3], reputation:[10,30], stress:[-5,15], connections:[5,20] },
    choices:[
      { text:'深入交流，寻求合作', effect:{ money:0.9, reputation:30, connections:20, stress:15 }, label:'深度合作' },
      { text:'保持联系，来日方长', effect:{ money:1.1, reputation:15, connections:10, stress:0 }, label:'细水长流' },
      { text:'婉拒好意，专注自身', effect:{ money:1.3, reputation:10, connections:5, stress:-5 }, label:'专注自身' },
    ],
    fallbacks:['贵人引荐，这是商场上最珍贵的资源。','有人愿意帮你，这是你的运气和实力共同作用的结果。'],
  },
  {
    id:'relation_06', type:'personal', category:'narrative',
    acts:[2,3,4], cooldown:130, weight:3,
    title:'信任破裂',
    getDesc:()=>{
      const npcs=Object.values(NPCS); const n=npcs.length>0?npcs[Math.floor(Math.random()*npcs.length)]:{name:'一位重要伙伴'};
      return `${n.name||'一位重要伙伴'}突然对你冷脸。后来你才知道，有人在中间传话挑拨。信任一旦破裂，修复需要时间和诚意。`;
    },
    effects:{ money:[0.9,1.05], reputation:[-15,5], stress:[20,40] },
    choices:[
      { text:'主动沟通，澄清误会', effect:{ money:0.95, reputation:5, stress:20 }, label:'主动澄清' },
      { text:'给彼此空间，等热度过去', effect:{ money:1.05, reputation:-10, stress:30 }, label:'冷处理' },
      { text:'追查挑拨之人', effect:{ money:0.9, reputation:-15, stress:40 }, label:'追查源头' },
    ],
    fallbacks:['信任一旦破裂，修复需要时间和诚意。','有人在背后挑拨，你要如何处理？'],
  },

  // ===== 随机机遇 (8) =====
  {
    id:'luck_01', type:'policy', category:'narrative',
    acts:[0,1,2,3,4], cooldown:60, weight:6,
    title:'政府专项补贴到账',
    getDesc:()=>{
      const amt=50+Math.floor(Math.random()*200);
      return `好消息！你之前申请的企业扶持补贴获批了，${amt}万元即将到账。这对现金流是极大的补充。`;
    },
    effects:{ money:[1.15,1.4], reputation:[5,10], stress:[-10,0] },
    choices:[
      { text:'用于业务扩张', effect:{ money:1.3, reputation:10, stress:0 }, label:'扩张' },
      { text:'存入备用金，以备不时之需', effect:{ money:1.4, reputation:5, stress:-10 }, label:'保守' },
      { text:'分给员工当奖金', effect:{ money:1.15, reputation:15, stress:-5 }, label:'分享' },
    ],
    fallbacks:['政府补贴到账了，这笔钱怎么花？','补贴是锦上添花，关键是你的核心业务能不能赚钱。'],
  },
  {
    id:'luck_02', type:'market', category:'narrative',
    acts:[0,1,2,3], cooldown:100, weight:4,
    title:'风口降临：行业爆发期',
    getDesc:()=>{
      const sector=['AI应用','绿色能源','消费升级','银发经济'][Math.floor(Math.random()*4)];
      return `${sector}突然成为资本追逐的热点。媒体、投资人和消费者都在关注这个赛道。未来10个Tick内，你的相关业务收益将翻倍！`;
    },
    effects:{ money:[1.3,2.0], reputation:[10,25], stress:[-10,10] },
    choices:[
      { text:'全力押注，趁风口起飞', effect:{ money:2.0, reputation:25, stress:15 }, label:'趁风起飞' },
      { text:'适度加码，保持理性', effect:{ money:1.5, reputation:15, stress:5 }, label:'理性加码' },
      { text:'专注本职，不被风口裹挟', effect:{ money:1.05, reputation:0, stress:-10 }, label:'保持定力' },
    ],
    fallbacks:['风口来了，有人在飞，有人在看。','追风口的人很多，但真正飞起来的没几个。'],
  },
  {
    id:'luck_03', type:'employee', category:'narrative',
    acts:[0,1,2,3,4], cooldown:80, weight:5,
    title:'人才自荐',
    getDesc:()=>{
      const role=EMP_ROLES[Math.floor(Math.random()*EMP_ROLES.length)];
      return `一位资深${role.name}主动联系你，表示非常看好你的公司前景，愿意加入团队，薪资要求合理。`;
    },
    effects:{ money:[0.9,1.1], reputation:[5,15], stress:[-5,10] },
    choices:[
      { text:'立刻录用，欢迎加入', effect:{ money:0.9, reputation:15, stress:-5 }, label:'立刻录用' },
      { text:'面试评估后再决定', effect:{ money:1.0, reputation:10, stress:10 }, label:'面试评估' },
      { text:'婉拒，团队暂不扩编', effect:{ money:1.1, reputation:0, stress:0 }, label:'暂不扩编' },
    ],
    fallbacks:['有人主动来投，这是对你公司的认可。','人才是免费的，但也是最贵的。'],
  },
  {
    id:'luck_04', type:'market', category:'narrative',
    acts:[1,2,3,4], cooldown:120, weight:3,
    title:'意外发现隐藏价值',
    getDesc:()=>'你在复盘业务数据时，意外发现某个被忽视的区域或业务线有巨大的隐藏价值。这是一个被所有人忽略的金矿。',
    effects:{ money:[1.2,1.8], reputation:[5,20], stress:[-10,5], connections:[0,5] },
    choices:[
      { text:'立即投入资源开发', effect:{ money:1.5, reputation:20, stress:10 }, label:'立即开发' },
      { text:'小范围验证后再扩大', effect:{ money:1.3, reputation:10, stress:0 }, label:'先验证' },
      { text:'保持关注，暂不行动', effect:{ money:1.2, reputation:5, stress:-10 }, label:'保持关注' },
    ],
    fallbacks:['发现了一个没人注意的机会，你要抓住吗？','金矿就在那里，但不是每个人都敢挖。'],
  },
  {
    id:'luck_05', type:'operation', category:'narrative',
    acts:[1,2,3,4], cooldown:100, weight:4,
    title:'媒体主动专访邀请',
    getDesc:()=>{
      const media=['新海财经周刊','财经天下','商界杂志','第一财经'][Math.floor(Math.random()*4)];
      return `${media}主动联系你，希望做一期深度专访。这是提升品牌知名度的绝佳机会，但也意味着你要暴露在聚光灯下。`;
    },
    effects:{ money:[0.95,1.2], reputation:[20,40], stress:[0,15] },
    choices:[
      { text:'接受专访，精心准备', effect:{ money:0.95, reputation:40, stress:15 }, label:'精心准备' },
      { text:'接受但控制话题范围', effect:{ money:1.05, reputation:25, stress:5 }, label:'控制话题' },
      { text:'婉拒，保持低调', effect:{ money:1.2, reputation:0, stress:0 }, label:'保持低调' },
    ],
    fallbacks:['媒体专访来了，这是免费的广告。','聚光灯下，你的每一句话都会被放大。'],
  },
  {
    id:'luck_06', type:'market', category:'narrative',
    acts:[1,2,3,4], cooldown:110, weight:4,
    title:'突发：资产遭遇重创',
    getDesc:()=>{
      const p=15+Math.floor(Math.random()*25);
      return `一场突如其来的变故（市场闪崩/政策突变/意外事故）让你的资产缩水了约${p}%。恐慌情绪在团队中蔓延。`;
    },
    effects:{ money:[0.55,0.85], reputation:[-15,5], stress:[30,60] },
    choices:[
      { text:'紧急止损，保住核心资产', effect:{ money:0.75, reputation:5, stress:30 }, label:'紧急止损' },
      { text:'逆势加仓，抄底反弹', effect:{ money:[0.55,1.2], reputation:[-5,15], stress:60 }, label:'逆势抄底' },
      { text:'按兵不动，等待市场恢复', effect:{ money:0.85, reputation:-10, stress:45 }, label:'按兵不动' },
    ],
    fallbacks:['黑天鹅来了，你的资产在缩水。','市场总是会惩罚那些没有准备的人。'],
  },
  {
    id:'luck_07', type:'personal', category:'narrative',
    acts:[0,1,2,3,4], cooldown:300, weight:1,
    title:'意外之财：彩票中奖',
    getDesc:()=>'你随手买的一张彩票居然中了头奖！税后到手一笔不小的钱。这运气也太好了吧？',
    effects:{ money:[1.5,2.5], reputation:[0,5], stress:[-15,0] },
    choices:[
      { text:'全部投入公司发展', effect:{ money:2.5, reputation:5, stress:0 }, label:'投入公司' },
      { text:'部分投入公司，部分存起来', effect:{ money:2.0, reputation:0, stress:-10 }, label:'分散配置' },
      { text:'捐一部分做公益', effect:{ money:1.8, reputation:15, stress:-15 }, label:'回馈社会' },
    ],
    fallbacks:['彩票中奖了！这运气也太好了吧？','意外之财，怎么花是个问题。'],
  },
  {
    id:'luck_08', type:'personal', category:'narrative',
    acts:[2,3,4], cooldown:90, weight:4,
    title:'旧账被翻',
    getDesc:()=>'某个你早已遗忘的过去决策突然被翻了出来。有人在社交媒体上爆料，说你早期有"不光彩的历史"。压力骤增，声誉受损。',
    effects:{ money:[0.9,1.05], reputation:[-25,5], stress:[25,45] },
    choices:[
      { text:'公开回应，承认不完美', effect:{ money:0.95, reputation:5, stress:25 }, label:'坦诚回应' },
      { text:'请公关团队灭火', effect:{ money:0.9, reputation:-5, stress:35 }, label:'公关灭火' },
      { text:'不予回应，冷处理', effect:{ money:1.05, reputation:-25, stress:40 }, label:'冷处理' },
    ],
    fallbacks:['过去的事情被翻出来了，互联网是有记忆的。','旧账被翻，这是每个走到高处的人都要面对的。'],
  },

  // ===== 区域特色 (8) =====
  {
    id:'region_01', type:'market', category:'narrative',
    acts:[0,1,2,3], cooldown:100, weight:4,
    title:'永宁区老城改造计划',
    getDesc:()=>'新海市政府公布了永宁区老城改造计划。大量老旧商铺将被拆除重建，新的商业机会即将涌现。对于已在永宁区扎根的你，这是一个信号。',
    effects:{ money:[0.8,1.4], reputation:[5,15], stress:[5,20] },
    choices:[
      { text:'提前布局，抢占改造后的商铺', effect:{ money:0.8, reputation:15, stress:20 }, label:'提前布局' },
      { text:'观望，等政策落地再说', effect:{ money:1.1, reputation:5, stress:5 }, label:'谨慎观望' },
      { text:'趁改造前低价收购周边物业', effect:{ money:0.7, reputation:10, stress:25 }, label:'抄底物业' },
    ],
    fallbacks:['永宁区要改造了，老城换新颜。','老城改造，是机遇也是挑战。'],
  },
  {
    id:'region_02', type:'market', category:'narrative',
    acts:[1,2,3,4], cooldown:110, weight:4,
    title:'星海区年度科技峰会',
    getDesc:()=>'星海区年度科技峰会即将召开，汇集了全国的科技创业者和投资人。如果你的公司在星海区有业务，参会将带来巨大的技术加成。',
    effects:{ money:[0.85,1.3], reputation:[15,35], stress:[5,20], connections:[5,15] },
    choices:[
      { text:'全力参与，展示技术实力', effect:{ money:0.85, reputation:35, connections:15, stress:20 }, label:'展示实力' },
      { text:'派团队参加，适度参与', effect:{ money:1.05, reputation:20, connections:8, stress:5 }, label:'适度参与' },
      { text:'不参加，专注研发', effect:{ money:1.3, reputation:5, connections:0, stress:10 }, label:'专注研发' },
    ],
    fallbacks:['星海区的科技峰会，这是技术圈的盛会。','科技峰会，有人在找投资，有人在找人才。'],
  },
  {
    id:'region_03', type:'market', category:'narrative',
    acts:[2,3,4], cooldown:100, weight:4,
    title:'金湾区金融风暴预警',
    getDesc:()=>'金湾区传出金融监管收紧的信号。多家基金公司被约谈，市场恐慌情绪蔓延。如果你在金湾区有金融业务，将面临波动。',
    effects:{ money:[0.65,1.2], reputation:[-10,15], stress:[25,50] },
    choices:[
      { text:'提前收缩金融业务，降低风险', effect:{ money:0.85, reputation:5, stress:25 }, label:'降低风险' },
      { text:'逆势加仓，别人恐惧我贪婪', effect:{ money:[0.65,1.5], reputation:[-5,15], stress:50 }, label:'逆势加仓' },
      { text:'维持现状，金融本就波动', effect:{ money:0.95, reputation:0, stress:40 }, label:'维持现状' },
    ],
    fallbacks:['金湾区金融风暴预警，你的基金业务还好吗？','金融的本质是管理风险，而不是回避风险。'],
  },
  {
    id:'region_04', type:'market', category:'narrative',
    acts:[2,3,4], cooldown:105, weight:4,
    title:'锦绣区年度文化节',
    getDesc:()=>'锦绣区一年一度的文化节即将开幕。届时将有大量游客和文化消费者涌入。媒体矩阵和餐饮业务将迎来一波红利。',
    effects:{ money:[1.1,1.5], reputation:[10,25], stress:[-5,10] },
    choices:[
      { text:'赞助文化节，品牌冠名', effect:{ money:0.9, reputation:25, stress:5 }, label:'品牌冠名' },
      { text:'配合文化节做促销活动', effect:{ money:1.2, reputation:15, stress:0 }, label:'借势促销' },
      { text:'不参与，日常经营', effect:{ money:1.5, reputation:0, stress:-5 }, label:'日常经营' },
    ],
    fallbacks:['锦绣区文化节，这是商业和文化的交汇点。','文化搭台，商业唱戏，这个套路永远有效。'],
  },
  {
    id:'region_05', type:'market', category:'narrative',
    acts:[3,4], cooldown:120, weight:3,
    title:'云顶区豪宅市场波动',
    getDesc:()=>'云顶区高端住宅市场出现剧烈波动。豪宅价格大幅震荡，高端客户群体的消费信心受到影响。你的高端业务线和社交关系都将受到波及。',
    effects:{ money:[0.7,1.3], reputation:[-10,20], stress:[20,40], connections:[-5,10] },
    choices:[
      { text:'趁低吸纳高端物业', effect:{ money:0.7, reputation:15, connections:10, stress:40 }, label:'趁低吸纳' },
      { text:'稳住高端客户关系', effect:{ money:1.0, reputation:20, stress:20 }, label:'稳住客户' },
      { text:'暂时退出高端市场', effect:{ money:1.3, reputation:-10, stress:25 }, label:'暂时退出' },
    ],
    fallbacks:['云顶区的豪宅市场在波动，高端客户在观望。','高端市场的波动，影响的是金字塔顶端的人。'],
  },
  {
    id:'region_06', type:'market', category:'narrative',
    acts:[3,4], cooldown:100, weight:4,
    title:'铁西区物流工人罢工',
    getDesc:()=>'铁西区爆发大规模物流工人罢工，多条物流线路瘫痪。如果你在铁西区有工业或物流相关业务，生产运输将受到严重影响。',
    effects:{ money:[0.6,0.95], reputation:[-5,15], stress:[25,45] },
    choices:[
      { text:'临时启用替代物流方案', effect:{ money:0.75, reputation:5, stress:30 }, label:'替代方案' },
      { text:'和罢工代表协商，尽快复工', effect:{ money:0.7, reputation:15, stress:45 }, label:'协商复工' },
      { text:'趁乱收购物流资产', effect:{ money:0.6, reputation:0, stress:40 }, label:'趁乱收购' },
    ],
    fallbacks:['铁西区罢工了，物流瘫痪，你的货出不去。','工人罢工，这是工业区最头疼的问题。'],
  },
  {
    id:'region_07', type:'policy', category:'narrative',
    acts:[0,1,2,3,4], cooldown:90, weight:4,
    title:'光明区政务新政发布',
    getDesc:()=>'光明区发布了最新的政务服务优化政策：审批时限缩短50%，政府关系好的企业可以享受优先通道。这对政务关系强的公司是重大利好。',
    effects:{ money:[1.0,1.2], reputation:[5,20], stress:[-10,5], connections:[3,10] },
    choices:[
      { text:'抓住窗口期，加速审批中的项目', effect:{ money:1.2, reputation:15, connections:5, stress:-5 }, label:'加速项目' },
      { text:'深化与光明区政府的关系', effect:{ money:1.0, reputation:20, connections:10, stress:10 }, label:'深化关系' },
      { text:'按部就班，不受影响', effect:{ money:1.05, reputation:5, connections:3, stress:-10 }, label:'按部就班' },
    ],
    fallbacks:['光明区新政发布，政务关系好的企业笑了。','政策红利，抓住了是机遇，错过了是遗憾。'],
  },
  {
    id:'region_08', type:'market', category:'narrative',
    acts:[2,3,4], cooldown:130, weight:3,
    title:'跨区域合作机会浮现',
    getDesc:()=>{
      const r1=['永宁区','星海区','金湾区'][Math.floor(Math.random()*3)];
      const r2=['锦绣区','云顶区','铁西区'][Math.floor(Math.random()*3)];
      return `${r1}和${r2}之间出现了一个跨区域合作机会。如果你在两个区域都有业务，将获得联动加成。`;
    },
    effects:{ money:[0.9,1.4], reputation:[10,25], stress:[5,20], connections:[5,15] },
    choices:[
      { text:'全力推动跨区域合作', effect:{ money:0.9, reputation:25, connections:15, stress:20 }, label:'推动合作' },
      { text:'小范围试点再决定', effect:{ money:1.2, reputation:15, connections:8, stress:10 }, label:'小试点' },
      { text:'目前精力有限，暂不参与', effect:{ money:1.4, reputation:5, connections:0, stress:5 }, label:'暂不参与' },
    ],
    fallbacks:['跨区域合作，这是做大做强的必经之路。','两个区域联手，会产生1+1>2的效果吗？'],
  },

  // ===== 城市特色事件 =====
  // === 京都市 ===
  {
    id:'city_jingdu_01', type:'policy', category:'narrative',
    acts:[1,2,3,4], cooldown:80, weight:5,
    title:'京都政策红利窗口开启',
    getDesc:()=>'京都市发布了新一轮的产业扶持政策。作为国家级的政策高地，京都市的政务资源为企业提供了独特的政策优势。在京都开设业务的企业可获得额外政策加成。',
    effects:{ money:[1.1,1.4], reputation:[10,25], stress:[-5,10], connections:[5,12] },
    choices:[
      { text:'全力争取政策扶持资金', effect:{ money:1.2, reputation:20, connections:8, stress:10 }, label:'争取扶持' },
      { text:'借助政策快速扩张', effect:{ money:1.4, reputation:15, connections:5, stress:15 }, label:'快速扩张' },
      { text:'观望政策落实再行动', effect:{ money:1.1, reputation:5, connections:10, stress:-5 }, label:'观望等待' },
    ],
    fallbacks:['京都市的政策红利，谁抓住了谁就能起飞。','在京都市经商，政策就是最好的资源。'],
  },
  {
    id:'city_jingdu_02', type:'opportunity', category:'narrative',
    acts:[2,3,4], cooldown:100, weight:3,
    title:'央企战略合作机会',
    getDesc:()=>'一家大型央企正在京都市寻找市场化合作方。这是一次难得的机会，成功合作将获得强大的资源背书和稳定的业务来源。前提是在京都市拥有一定规模的业务。',
    effects:{ money:[1.0,2.0], reputation:[15,35], stress:[10,30], connections:[5,20] },
    choices:[
      { text:'积极洽谈，争取深度合作', effect:{ money:1.5, reputation:35, connections:20, stress:30 }, label:'深度合作' },
      { text:'签订框架协议，小范围试点', effect:{ money:1.2, reputation:25, connections:10, stress:15 }, label:'框架协议' },
      { text:'保持接触，暂不深入', effect:{ money:1.0, reputation:10, connections:5, stress:5 }, label:'保持接触' },
    ],
    fallbacks:['央企抛来橄榄枝，这种机会不是天天有的。','在京都，和央企合作是最好的信用背书。'],
  },

  // === 深港市 ===
  {
    id:'city_shengang_01', type:'market', category:'narrative',
    acts:[2,3,4], cooldown:70, weight:5,
    title:'跨境贸易新航道',
    getDesc:()=>'深港市作为对外开放的前沿阵地，新开通了一条跨境贸易快速通道。在深港有业务的企业可以享受通关便利化和税收优惠，金融和贸易类业务收益大幅提升。',
    effects:{ money:[1.15,1.6], reputation:[5,20], connections:[8,18] },
    choices:[
      { text:'立刻组建跨境业务团队', effect:{ money:1.4, reputation:18, connections:15, stress:15 }, label:'组建团队' },
      { text:'先做市场调研，小规模试水', effect:{ money:1.25, reputation:10, connections:8, stress:5 }, label:'小规模试水' },
      { text:'专注国内业务，暂不参与', effect:{ money:1.1, reputation:5, connections:5, stress:0 }, label:'专注国内' },
    ],
    fallbacks:['深港市跨境贸易新通道开通了。','站在深港看世界，跨境贸易的窗口已经打开。'],
  },
  {
    id:'city_shengang_02', type:'market', category:'narrative',
    acts:[3,4], cooldown:120, weight:3,
    title:'金融牌照拍卖',
    getDesc:()=>'深港市金融办放出一批稀缺金融牌照。拥有牌照的企业可以在深港开展更广泛的金融业务，包括跨境支付、小额贷款等。但牌照价格不菲，竞争激烈。',
    effects:{ money:[0.5,2.5], reputation:[10,40], connections:[10,25], stress:[15,40] },
    choices:[
      { text:'重金竞拍，志在必得', effect:{ money:0.5, reputation:40, connections:25, stress:40 }, label:'志在必得' },
      { text:'谨慎出价，适可而止', effect:{ money:1.3, reputation:20, connections:15, stress:20 }, label:'谨慎出价' },
      { text:'放弃本次竞拍', effect:{ money:2.5, reputation:-5, connections:-5, stress:-5 }, label:'放弃竞拍' },
    ],
    fallbacks:['深港市金融牌照拍卖又开始了。','一张好的金融牌照，价值连城。'],
  },

  // === 蓉城市 ===
  {
    id:'city_rongcheng_01', type:'policy', category:'narrative',
    acts:[3,4], cooldown:80, weight:5,
    title:'西部大开发专项补贴',
    getDesc:()=>'蓉城市作为西部大开发战略的重要支点，国家批复了一批产业专项补贴。在蓉城投资的企业可以获得丰厚的税收返还和土地优惠，尤其利好实体产业。',
    effects:{ money:[1.2,1.6], reputation:[10,25], connections:[5,15], stress:[-10,5] },
    choices:[
      { text:'申请最大额度补贴，扩大规模', effect:{ money:1.5, reputation:20, connections:10, stress:5 }, label:'扩大规模' },
      { text:'合理申请补贴，稳健发展', effect:{ money:1.3, reputation:15, connections:8, stress:-5 }, label:'稳健发展' },
      { text:'补贴手续太复杂，暂不参与', effect:{ money:1.2, reputation:5, connections:-3, stress:-10 }, label:'暂不参与' },
    ],
    fallbacks:['蓉城市新一轮专项补贴下来了。','西部大开发的春风，正在吹遍蓉城大地。'],
  },
  {
    id:'city_rongcheng_02', type:'market', category:'narrative',
    acts:[3,4], cooldown:90, weight:3,
    title:'蓉城美食产业链爆发',
    getDesc:()=>'蓉城市的餐饮消费持续火爆，从火锅、串串到川菜预制菜，整个美食产业链迎来了爆发式增长。在蓉城布局餐饮和文化产业的企业将收获丰厚的回报。',
    effects:{ money:[1.2,1.8], reputation:[15,30], stress:[-5,15] },
    choices:[
      { text:'投资本地知名餐饮品牌', effect:{ money:1.5, reputation:30, stress:10 }, label:'投资品牌' },
      { text:'布局预制菜供应链', effect:{ money:1.8, reputation:15, stress:15 }, label:'布局供应链' },
      { text:'专注自身业务线', effect:{ money:1.1, reputation:10, stress:-5 }, label:'专注自身' },
    ],
    fallbacks:['蓉城的美食经济正在创造新的商业奇迹。','在蓉城，没有什么是一顿火锅解决不了的。'],
  },

  // === 杭江市 ===
  {
    id:'city_hangjiang_01', type:'opportunity', category:'narrative',
    acts:[3,4], cooldown:70, weight:5,
    title:'数字经济风口',
    getDesc:()=>'杭江市数字经济产业规模突破万亿，大量独角兽企业涌现。数字经济相关产业的增长速度和回报率远超传统行业。在杭江布局科技和媒体业务的企业迎来风口。',
    effects:{ money:[1.2,2.0], reputation:[10,30], connections:[10,20], techStat:[1,3] },
    choices:[
      { text:'投资数字产业，全面转型', effect:{ money:1.6, reputation:30, connections:20, techStat:3 }, label:'全面转型' },
      { text:'在数字产业做战略布局', effect:{ money:1.3, reputation:20, connections:15, techStat:2 }, label:'战略布局' },
      { text:'保持传统业务为主', effect:{ money:1.1, reputation:10, connections:5 }, label:'保持传统' },
    ],
    fallbacks:['杭江市的数字经济又创新高了。','数字经济的浪潮，正在重新定义每一个行业。'],
  },
  {
    id:'city_hangjiang_02', type:'market', category:'narrative',
    acts:[3,4], cooldown:90, weight:3,
    title:'电商直播红利',
    getDesc:()=>'杭江市作为电商直播之都，新一波直播带货红利来袭。头部主播和MCN机构纷纷扩招，流量和销售额屡创新高。如果布局了传媒或消费类业务，这波红利不可错过。',
    effects:{ money:[1.1,2.2], reputation:[5,25], connections:[10,25] },
    choices:[
      { text:'签下头部主播，全力押注', effect:{ money:1.4, reputation:25, connections:20, stress:20 }, label:'签下主播' },
      { text:'自建MCN矩阵，培养网红', effect:{ money:1.3, reputation:20, connections:15, stress:15 }, label:'自建MCN' },
      { text:'投放广告，搭便车', effect:{ money:1.15, reputation:15, connections:10, stress:5 }, label:'投放广告' },
    ],
    fallbacks:['杭江市的直播间又卖疯了。','直播带货的下半场，谁能笑到最后？'],
  },

  // === 新加坡 ===
  {
    id:'city_singapore_01', type:'opportunity', category:'narrative',
    acts:[4,5], cooldown:100, weight:4,
    title:'东南亚总部设立',
    getDesc:()=>'你在新加坡的业务发展迅速，现在有一个机会将新加坡业务升级为东南亚区域总部。这需要大量投资，但成功后可以辐射整个东南亚市场，并获得新加坡政府的税收优惠。',
    effects:{ money:[0.5,1.8], reputation:[20,50], connections:[15,30], stress:[10,35] },
    choices:[
      { text:'升级为东南亚总部，放眼东盟', effect:{ money:0.5, reputation:35, connections:18, stress:35 }, label:'升格总部' },
      { text:'保持新加坡分公司定位', effect:{ money:1.3, reputation:25, connections:12, stress:15 }, label:'保持现状' },
      { text:'观望东南亚局势再决定', effect:{ money:1.8, reputation:10, connections:10, stress:5 }, label:'暂时观望' },
    ],
    fallbacks:['新加坡总部升格的机会来了。','在狮城设立东南亚总部，这是走向国际化的关键一步。'],
  },
  {
    id:'city_singapore_02', type:'market', category:'narrative',
    acts:[4,5], cooldown:110, weight:4,
    title:'离岸金融新机遇',
    getDesc:()=>'新加坡金融管理局发布了新的离岸金融政策，大幅降低了跨境资金流动的门槛。在新加坡有业务的企业可以利用离岸金融工具优化全球资产配置，降低税务成本。',
    effects:{ money:[1.2,1.6], reputation:[5,15], financeStat:[1,2], stress:[-5,15] },
    choices:[
      { text:'搭建离岸架构，优化资产', effect:{ money:1.5, reputation:10, financeStat:2, stress:10 }, label:'搭建架构' },
      { text:'咨询专业团队后再决定', effect:{ money:1.2, reputation:15, stress:0 }, label:'咨询再定' },
      { text:'不碰离岸业务，风险太大', effect:{ money:1.15, reputation:5, stress:-5 }, label:'不碰离岸' },
    ],
    fallbacks:['新加坡离岸金融新政出炉了。','全球资产配置，新加坡是最佳枢纽。'],
  },

  // === 东京 ===
  {
    id:'city_tokyo_01', type:'opportunity', category:'narrative',
    acts:[4,5], cooldown:100, weight:4,
    title:'中日科技合作计划',
    getDesc:()=>'日本推出新一轮中日科技合作计划，重点领域包括AI、半导体和精密制造。在东京有业务的企业可以直接参与合作项目，获得技术授权和人才交流机会。',
    effects:{ money:[1.1,1.6], reputation:[15,35], techStat:[2,4], connections:[10,20] },
    choices:[
      { text:'深度参与联合研发', effect:{ money:1.3, reputation:35, techStat:4, connections:20, stress:20 }, label:'联合研发' },
      { text:'引进技术并本土化', effect:{ money:1.5, reputation:25, techStat:2, connections:15, stress:10 }, label:'技术引进' },
      { text:'保持观望', effect:{ money:1.1, reputation:10, connections:5, stress:0 }, label:'保持观望' },
    ],
    fallbacks:['东京的中日科技合作计划吸引了全球目光。','在东京，科技合作是永恒的主题。'],
  },
  {
    id:'city_tokyo_02', type:'market', category:'narrative',
    acts:[4,5], cooldown:110, weight:3,
    title:'动漫文化产业投资',
    getDesc:()=>'东京动漫产业在全球市场持续增长，一部热门IP的授权费用水涨船高。在东京拥有媒体和文化产业布局的企业，可以切入动漫IP授权和衍生品开发的蓝海市场。',
    effects:{ money:[1.0,2.0], reputation:[10,30], connections:[15,30] },
    choices:[
      { text:'拿下头部IP授权', effect:{ money:1.2, reputation:30, connections:15, stress:25 }, label:'头部IP' },
      { text:'投资动漫制作公司', effect:{ money:1.4, reputation:25, connections:18, stress:20 }, label:'投资制作' },
      { text:'开发衍生品渠道', effect:{ money:1.6, reputation:15, connections:15, stress:10 }, label:'衍生品' },
    ],
    fallbacks:['东京秋叶原的动漫产业链正在外溢。','二次元经济学，比想象中更赚钱。'],
  },

  // === 纽约 ===
  {
    id:'city_newyork_01', type:'opportunity', category:'narrative',
    acts:[5], cooldown:120, weight:4,
    title:'华尔街上市之路',
    getDesc:()=>'投行找上门来了：他们认为你的公司已经具备在纽约证券交易所或纳斯达克上市的潜力。IPO可以让你的公司获得巨额融资和国际知名度，但也意味着接受更严格的监管和公众审视。',
    effects:{ money:[1.0,5.0], reputation:[30,80], connections:[20,50], stress:[20,60] },
    choices:[
      { text:'启动IPO，冲击华尔街', effect:{ money:3.0, reputation:55, connections:28, stress:60 }, label:'启动IPO' },
      { text:'先做Pre-IPO私募融资', effect:{ money:2.0, reputation:50, connections:35, stress:30 }, label:'Pre-IPO' },
      { text:'保持私有化，暂不上市', effect:{ money:1.0, reputation:20, connections:15, stress:5 }, label:'保持私有' },
    ],
    fallbacks:['华尔街的投行在敲你的门。','纳斯达克的钟声，是每个企业家的梦想。'],
  },
  {
    id:'city_newyork_02', type:'market', category:'narrative',
    acts:[5], cooldown:130, weight:3,
    title:'并购美国老牌公司',
    getDesc:()=>'一家拥有百年历史的美国公司深陷财务困境，但品牌价值依然巨大。收购它可以在短时间内获得美国市场的渠道和品牌认知。纽约的业务布局将发挥关键作用。',
    effects:{ money:[0.3,2.0], reputation:[20,60], connections:[20,40], stress:[30,60] },
    choices:[
      { text:'蛇吞象，全力收购', effect:{ money:0.3, reputation:42, connections:22, stress:60 }, label:'蛇吞象' },
      { text:'仅收购核心资产', effect:{ money:1.0, reputation:40, connections:18, stress:35 }, label:'收购核心' },
      { text:'风险太高，放弃收购', effect:{ money:2.0, reputation:10, connections:5, stress:-10 }, label:'放弃收购' },
    ],
    fallbacks:['华尔街传来消息：一家百年美企正在寻找买家。','收购一家美国百年老店，这是中国企业家的新高度。'],
  },

  // === 伦敦 ===
  {
    id:'city_london_01', type:'policy', category:'narrative',
    acts:[5], cooldown:100, weight:4,
    title:'欧洲市场准入协议',
    getDesc:()=>'英国脱欧后正积极寻求与非欧盟国家的贸易协定。一份新的中英商贸便利化协议即将签署，在伦敦有业务的企业将成为首批受益者，获得欧洲市场的绿色通道。',
    effects:{ money:[1.3,2.0], reputation:[20,50], connections:[15,40], stress:[5,25] },
    choices:[
      { text:'率先布局欧洲各国', effect:{ money:1.5, reputation:35, connections:22, stress:25 }, label:'全面布局' },
      { text:'先深耕英国市场', effect:{ money:1.3, reputation:35, connections:15, stress:10 }, label:'深耕英国' },
      { text:'等待协议生效再行动', effect:{ money:1.8, reputation:15, connections:10, stress:0 }, label:'等待生效' },
    ],
    fallbacks:['伦敦传来了中英贸易协定的好消息。','借着伦敦的桥头堡，打开整个欧洲市场。'],
  },
  {
    id:'city_london_02', type:'market', category:'narrative',
    acts:[5], cooldown:120, weight:3,
    title:'百年英伦品牌收购',
    getDesc:()=>'一个拥有150年历史的英国奢侈品牌正在出售。品牌在全球拥有极高的知名度和忠实的客户群。收购这个品牌将瞬间提升你公司的国际形象，但这笔交易代价不菲。',
    effects:{ money:[0.2,1.5], reputation:[30,80], connections:[20,40], stress:[25,50] },
    choices:[
      { text:'果断出手，拿下英伦传奇', effect:{ money:0.2, reputation:55, connections:22, stress:50 }, label:'拿下传奇' },
      { text:'只买品牌授权，轻资产运营', effect:{ money:0.8, reputation:45, connections:15, stress:25 }, label:'品牌授权' },
      { text:'品牌溢价太高，不值得', effect:{ money:1.5, reputation:15, connections:10, stress:0 }, label:'不值得' },
    ],
    fallbacks:['一个百年英伦品牌正在拍卖。','买下一个传奇品牌的瞬间，你也买下了一段历史。'],
  },

  // === 迪拜 ===
  {
    id:'city_dubai_01', type:'opportunity', category:'narrative',
    acts:[5], cooldown:90, weight:5,
    title:'石油资本战略合作',
    getDesc:()=>'迪拜的主权财富基金正在全球寻找投资标的。他们对你在中东的业务布局表现出浓厚兴趣，愿意提供巨额战略投资。石油资本的力量足以改变一家公司的命运。',
    effects:{ money:[2.0,5.0], reputation:[20,60], connections:[20,50], stress:[5,30] },
    choices:[
      { text:'接受战略投资，全面合作', effect:{ money:5.0, reputation:35, connections:25, stress:25 }, label:'全面合作' },
      { text:'接受财务投资，保持独立', effect:{ money:3.5, reputation:35, connections:18, stress:15 }, label:'财务投资' },
      { text:'婉拒，保持自主权', effect:{ money:2.0, reputation:10, connections:10, stress:0 }, label:'婉拒合作' },
    ],
    fallbacks:['迪拜的主权基金又出手了。','石油资本的钱，是世界上最聪明的钱之一。'],
  },
  {
    id:'city_dubai_02', type:'policy', category:'narrative',
    acts:[5], cooldown:100, weight:3,
    title:'迪拜免税区优惠政策',
    getDesc:()=>'迪拜政府宣布扩大免税区的覆盖范围，入驻企业享受零企业所得税、零个人所得税和100%外资控股。这是一份极具吸引力的营商环境大礼包。',
    effects:{ money:[1.2,2.0], reputation:[10,25], connections:[10,25], stress:[-15,0] },
    choices:[
      { text:'将中东业务全部迁入免税区', effect:{ money:2.0, reputation:20, connections:20, stress:0 }, label:'全部迁入' },
      { text:'在免税区新设立一家公司', effect:{ money:1.6, reputation:15, connections:15, stress:-5 }, label:'新设公司' },
      { text:'维持现有布局不变', effect:{ money:1.2, reputation:10, connections:10, stress:-15 }, label:'维持不变' },
    ],
    fallbacks:['迪拜免税区又扩大了。','在迪拜免税区，你赚的每一分钱都是自己的。'],
  },

  // ===== 跨城/全球事件 =====
  {
    id:'global_01', type:'opportunity', category:'narrative',
    acts:[2,3,4,5], cooldown:100, weight:4,
    title:'跨城物流网络优化',
    getDesc:()=>'随着你在多个城市开展业务，物流效率成为影响收益的关键因素。一家物流科技公司找你合作，可以为你的跨城业务搭建智能物流网络，降低损耗、提升效率。',
    effects:{ money:[1.05,1.25], connections:[5,15], stress:[-5,5] },
    choices:[
      { text:'全面合作，打造智能物流网', effect:{ money:1.1, connections:15, stress:5 }, label:'智能物流' },
      { text:'小范围试点合作', effect:{ money:1.05, connections:8, stress:0 }, label:'试点合作' },
      { text:'自己组建物流团队', effect:{ money:1.0, connections:5, stress:-5 }, label:'自建物流' },
    ],
    fallbacks:['跨城物流效率，正在成为新的竞争优势。','物流就是现代商业的血管系统。'],
  },
  {
    id:'global_02', type:'policy', category:'narrative',
    acts:[3,4,5], cooldown:90, weight:4,
    title:'全国性营商环境改革',
    getDesc:()=>'国务院发布了新一轮优化营商环境改革方案，全国范围内简化审批、降低税费、保护民营企业家权益。这是一次全国性的政策利好，所有城市的所有业务都将受益。',
    effects:{ money:[1.1,1.3], reputation:[5,20], connections:[5,15], stress:[-10,5] },
    choices:[
      { text:'抓住风口，全国扩张', effect:{ money:1.3, reputation:20, connections:15, stress:5 }, label:'全国扩张' },
      { text:'聚焦优势城市做深做强', effect:{ money:1.2, reputation:15, connections:10, stress:-5 }, label:'聚焦优势' },
      { text:'稳步发展，不激进', effect:{ money:1.1, reputation:10, connections:5, stress:-10 }, label:'稳步发展' },
    ],
    fallbacks:['新一轮营商环境改革方案来了。','政策暖风，正在吹遍大江南北。'],
  },
  {
    id:'global_03', type:'market', category:'narrative',
    acts:[4,5], cooldown:120, weight:3,
    title:'国际汇率剧烈波动',
    getDesc:()=>'全球外汇市场出现剧烈波动，美元、欧元兑人民币汇率大幅震荡。拥有国际业务的企业面临汇率风险，但也存在套利机会。拥有良好金融团队的企业可以化风险为机遇。',
    effects:{ money:[0.7,1.5], reputation:[-5,15], stress:[15,40], financeStat:[1,2] },
    choices:[
      { text:'对冲操作，锁定汇率风险', effect:{ money:1.1, reputation:15, financeStat:2, stress:25 }, label:'对冲风险' },
      { text:'低吸高抛，博取套利', effect:{ money:1.5, reputation:-5, stress:40 }, label:'博取套利' },
      { text:'暂停海外业务，规避风险', effect:{ money:0.7, reputation:5, stress:10 }, label:'暂停海外' },
    ],
    fallbacks:['汇率剧烈波动，全球金融市场一片哀嚎。','在汇率风暴中，有人恐惧，有人贪婪。'],
  },
  {
    id:'global_04', type:'crisis', category:'narrative',
    acts:[5], cooldown:180, weight:2,
    title:'全球金融危机预警',
    getDesc:()=>'全球经济出现系统性风险信号：股市暴跌、信用收缩、消费信心崩溃。所有城市的业务都面临严峻考验。这是一个全球性的风暴，没有人能独善其身。',
    effects:{ money:[0.3,0.7], reputation:[-20,0], stress:[30,70], connections:[-15,5] },
    choices:[
      { text:'现金为王，抛售非核心资产', effect:{ money:0.5, reputation:-10, connections:-10, stress:40 }, label:'现金为王' },
      { text:'逆周期投资，抄底优质资产', effect:{ money:0.3, reputation:0, connections:5, stress:70 }, label:'逆周期抄底' },
      { text:'缩减开支，静待危机过去', effect:{ money:0.45, reputation:-5, connections:-5, stress:25 }, label:'静待危机' },
    ],
    fallbacks:['金融危机来了，没有人能独善其身。','每一次危机，都是一次财富的重新分配。'],
  },
  {
    id:'global_05', type:'opportunity', category:'narrative',
    acts:[4,5], cooldown:140, weight:3,
    title:'一带一路新倡议',
    getDesc:()=>'国家发布新一轮"一带一路"国际合作倡议，重点支持民营企业走出去。在海外有布局的企业可以获得政策、金融和外交的全方位支持，这是一次中国企业家全球化的历史机遇。',
    effects:{ money:[1.2,2.5], reputation:[20,60], connections:[15,40], stress:[5,25] },
    choices:[
      { text:'积极响应，全面出海', effect:{ money:1.8, reputation:42, connections:22, stress:25 }, label:'全面出海' },
      { text:'选择重点国家稳步布局', effect:{ money:1.5, reputation:40, connections:18, stress:15 }, label:'重点布局' },
      { text:'专注国内市场', effect:{ money:1.2, reputation:15, connections:10, stress:0 }, label:'专注国内' },
    ],
    fallbacks:['一带一路新倡议发布了。','中国企业家全球化的时代，已经到来。'],
  },

  // ==== 天气相关事件 ====
  {
    id:'weather_storm_logistics', type:'crisis', category:'narrative',
    acts:[1,2,3,4,5], cooldown:120, weight:6,
    title:'暴风雨导致物流中断',
    getDesc:()=>{
      const w = (SGame.G && SGame.G.currentWeather) ? WEATHERS[SGame.G.currentWeather] : null;
      return '一场突如其来的暴风雨席卷全城，多个物流仓库受淹，配送车队无法正常发车。' + (w ? `当前天气：${w.desc}` : '');
    },
    effects:{ money:[0.6,0.8], reputation:[-8,0], stress:[15,30] },
    choices:[
      { text:'紧急启动备用物流方案', effect:{ money:0.75, reputation:5, stress:25 }, label:'备用方案' },
      { text:'等待天气好转，承受损失', effect:{ money:0.6, reputation:-5, stress:10 }, label:'耐心等待' },
    ],
    fallbacks:['暴风雨来得太猛了，仓库都进水了。','物流中断，好几个订单要延迟了。'],
  },
  {
    id:'weather_heatwave_efficiency', type:'crisis', category:'narrative',
    acts:[1,2,3,4,5], cooldown:100, weight:5,
    title:'高温导致员工效率下降',
    getDesc:()=>{
      const w = (SGame.G && SGame.G.currentWeather) ? WEATHERS[SGame.G.currentWeather] : null;
      return '持续的高温天气让办公室变成了蒸笼，员工们汗流浃背，工作效率大幅下降。' + (w ? `当前天气：${w.desc}` : '');
    },
    effects:{ money:[0.75,0.9], stress:[10,25] },
    choices:[
      { text:'临时加装空调设备', effect:{ money:0.85, expense:5000, stress:5 }, label:'加装空调' },
      { text:'发放高温补贴，让大家坚持', effect:{ money:0.8, expense:3000, stress:20, loyalty:[-3,3] }, label:'高温补贴' },
      { text:'允许居家办公', effect:{ money:0.9, expense:0, stress:5, loyalty:[-5,5] }, label:'居家办公' },
    ],
    fallbacks:['热！太热了！空调都不管用了。','员工们都快中暑了，这样下去不是办法。'],
  },
  {
    id:'weather_snow_traffic', type:'crisis', category:'narrative',
    acts:[1,2,3,4,5], cooldown:130, weight:5,
    title:'大雪致交通瘫痪',
    getDesc:()=>{
      const w = (SGame.G && SGame.G.currentWeather) ? WEATHERS[SGame.G.currentWeather] : null;
      return '大雪封路，高速公路封闭，公交和地铁延误严重，员工通勤困难，城市商业活动几乎停滞。' + (w ? `当前天气：${w.desc}` : '');
    },
    effects:{ money:[0.7,0.85], reputation:[-5,0], stress:[20,35] },
    choices:[
      { text:'暂停非核心业务，确保安全', effect:{ money:0.7, reputation:3, stress:10 }, label:'暂停业务' },
      { text:'组织员工拼车上班', effect:{ money:0.85, expense:2000, stress:30, loyalty:[3,8] }, label:'组织拼车' },
    ],
    fallbacks:['雪下得太大了，门都出不去。','全城交通瘫痪，像按下了暂停键。'],
  },
  {
    id:'weather_sunny_boom', type:'opportunity', category:'narrative',
    acts:[1,2,3,4,5], cooldown:90, weight:6,
    title:'晴好天气消费旺季',
    getDesc:()=>{
      const w = (SGame.G && SGame.G.currentWeather) ? WEATHERS[SGame.G.currentWeather] : null;
      return '连续晴好天气让市民纷纷出门消费，商场、餐饮、娱乐场所人流如织，商业机会来敲门了。' + (w ? `当前天气：${w.desc}` : '');
    },
    effects:{ money:[1.1,1.4], reputation:[5,15], stress:[-5,5] },
    choices:[
      { text:'加大营销投入，抢占市场', effect:{ money:1.4, expense:8000, reputation:15, stress:5 }, label:'加大营销' },
      { text:'维持现有节奏，稳扎稳打', effect:{ money:1.1, reputation:5, stress:-5 }, label:'稳扎稳打' },
    ],
    fallbacks:['天气真好，商场里人山人海。','正是做生意的好时节。'],
  },
  {
    id:'weather_foggy_flight', type:'crisis', category:'narrative',
    acts:[2,3,4,5], cooldown:110, weight:4,
    title:'大雾致航班取消',
    getDesc:()=>{
      const w = (SGame.G && SGame.G.currentWeather) ? WEATHERS[SGame.G.currentWeather] : null;
      return '大雾弥漫，机场能见度不足百米，多个航班被迫取消。重要的商务谈判被迫改期，几个海外客户表示不满。' + (w ? `当前天气：${w.desc}` : '');
    },
    effects:{ money:[0.8,0.95], reputation:[-10,0], connections:[-8,0], stress:[15,25] },
    choices:[
      { text:'改为视频会议，尽快连线客户', effect:{ money:0.95, reputation:-3, connections:-3, stress:10 }, label:'视频会议' },
      { text:'等待复航，亲自前往道歉', effect:{ money:0.8, reputation:0, connections:5, stress:20 }, label:'亲自前往' },
    ],
    fallbacks:['雾太大了，飞机全部停飞。','好不容易约好的客户，这下泡汤了。'],
  },
  {
    id:'weather_extreme_subsidy', type:'opportunity', category:'narrative',
    acts:[3,4,5], cooldown:150, weight:3,
    title:'极端天气专项补贴',
    getDesc:()=>{
      const w = (SGame.G && SGame.G.currentWeather) ? WEATHERS[SGame.G.currentWeather] : null;
      return '由于近期极端天气频发，政府推出针对受影响企业的专项补贴和税收减免政策。作为守法经营的企业，你有资格申请相关扶持资金。' + (w ? `当前天气：${w.desc}` : '');
    },
    effects:{ money:[1.1,1.3], reputation:[10,20], connections:[5,15], stress:[-10,0] },
    choices:[
      { text:'积极申请，争取最大化补贴', effect:{ money:1.3, reputation:20, connections:15, stress:5 }, label:'积极申请' },
      { text:'适度申请，不占公共资源', effect:{ money:1.1, reputation:8, connections:5, stress:-5 }, label:'适度申请' },
      { text:'婉拒补贴，展现企业担当', effect:{ money:1.0, reputation:35, connections:20, stress:-15 }, label:'婉拒补贴' },
    ],
    fallbacks:['政府发放极端天气补贴了。','申请补贴需要准备好相关资料。'],
  },

  // ==== 时间段事件 ====
  {
    id:'time_late_night_overtime', type:'decision', category:'narrative',
    acts:[1,2,3,4,5], cooldown:80, weight:4,
    title:'深夜加班',
    getDesc:()=>{
      const h = (SGame.G) ? SGame.G.gameHour : 0;
      return `此刻已是深夜${h}点，办公室里依然亮着几盏灯。一个紧急项目明天必须交付，你的团队还在埋头苦干。`;
    },
    effects:{ money:[1.05,1.2], stress:[15,35] },
    choices:[
      { text:'陪团队一起加班到天亮', effect:{ money:1.2, stress:35, loyalty:[5,10] }, label:'一起加班' },
      { text:'点宵夜慰问，自己先回去', effect:{ money:1.1, stress:15, loyalty:[-5,5] }, label:'点宵夜' },
      { text:'通知客户延期一天', effect:{ money:0.9, stress:-5, reputation:[-10,0] }, label:'延期交付' },
    ],
    fallbacks:['深夜的写字楼里，键盘声格外清晰。','赶工的夜晚，窗外城市的灯火依然璀璨。'],
  },
  {
    id:'time_morning_news', type:'opportunity', category:'narrative',
    acts:[1,2,3,4,5], cooldown:70, weight:5,
    title:'清晨突发新闻',
    getDesc:()=>{
      const h = (SGame.G) ? SGame.G.gameHour : 7;
      return `早上${h}点，一则突发商业新闻打破宁静：行业龙头宣布战略转向，留下的市场空白引人垂涎。趁着消息还没完全扩散，或许是个先发制人的好机会。`;
    },
    effects:{ money:[1.1,1.5], reputation:[5,20], stress:[-10,10] },
    choices:[
      { text:'立即召开晨会，布局抢占市场', effect:{ money:1.5, reputation:20, stress:10 }, label:'抢占市场' },
      { text:'观望两天，确认消息真实性', effect:{ money:1.0, reputation:5, stress:-10 }, label:'观望' },
      { text:'联系行业内部人士打听', effect:{ money:1.1, reputation:8, connections:[5,10], stress:5 }, label:'打听内幕' },
    ],
    fallbacks:['一大早就有爆炸性新闻。','这个时机太关键了，必须抓住。'],
  },
  {
    id:'time_dusk_social', type:'opportunity', category:'narrative',
    acts:[2,3,4,5], cooldown:60, weight:6,
    title:'黄昏社交酒会',
    getDesc:()=>'黄昏时分，某商会举办的高端社交酒会在城市酒店的顶层举行。觥筹交错间，各路商界精英汇聚一堂。这不仅是社交，更是信息和人脉的战场。',
    effects:{ money:[1.0,1.15], reputation:[5,15], connections:[10,25], stress:[-15,0] },
    choices:[
      { text:'盛装出席，积极社交', effect:{ money:1.05, reputation:15, connections:15, stress:-5 }, label:'积极社交' },
      { text:'低调出席，观察观察', effect:{ money:1.0, reputation:5, connections:10, stress:-15 }, label:'低调观察' },
    ],
    fallbacks:['酒会上的香槟很好，但信息更珍贵。','认识了几位新朋友，交换了名片。'],
  },
  {
    id:'time_noon_lunch', type:'opportunity', category:'narrative',
    acts:[1,2,3,4,5], cooldown:50, weight:6,
    title:'午间商务午餐',
    getDesc:()=>{
      const npcs = Object.values(NPCS);
      const npc = npcs[Math.floor(Math.random() * npcs.length)];
      return `中午时分，你在CBD的一家精致餐厅与${npc ? npc.name : '一位行业伙伴'}共进午餐。轻松的氛围中，聊起了行业近况和未来的合作可能。`;
    },
    effects:{ money:[1.0,1.05], reputation:[3,8], connections:[3,8], stress:[-20,-5] },
    choices:[
      { text:'聊正事，探讨合作机会', effect:{ money:1.05, reputation:8, connections:8, stress:-5, npcFavorAll:[0,3] }, label:'聊合作' },
      { text:'多喝酒，增进私人感情', effect:{ money:1.0, reputation:3, connections:3, stress:-15, npcFavorAll:[2,5] }, label:'增进感情' },
    ],
    fallbacks:['商务午餐，谈笑间定下一桩买卖。','这家的牛排不错，下次可以再来。'],
  },

  // ===== 节日事件 (12个) =====
  {
    id:'holiday_spring', type:'opportunity', category:'narrative',
    acts:[1,2,3,4,5], cooldown:999, weight:99,
    title:'🧧 春节：辞旧迎新',
    getDesc:()=>'爆竹声中一岁除！春节到了，员工们期盼着年终奖和红包。作为老板，你打算如何犒劳团队？这也是拜年社交、巩固人脉的绝佳时机。',
    effects:{ money:[1.0,1.2], reputation:[10,25], stress:[-20,0], connections:[5,15] },
    choices:[
      { text:'发放丰厚年终奖，稳军心', effect:{ money:1.05, reputation:25, stress:-20, expense:30000, loyalty:[8,15] }, label:'丰厚年终' },
      { text:'适度发红包，留钱开年', effect:{ money:1.1, reputation:15, stress:-10, expense:10000, loyalty:[3,8] }, label:'适度红包' },
      { text:'到处拜年，拓展人脉', effect:{ money:1.0, reputation:10, connections:20, stress:0, npcFavorAll:[5,10] }, label:'拜年社交' },
    ],
    fallbacks:['过年了，红包和祝福一样都不能少。','新年的钟声敲响，商场迎来新的轮回。'],
  },
  {
    id:'holiday_lantern', type:'opportunity', category:'narrative',
    acts:[1,2,3,4,5], cooldown:999, weight:99,
    title:'🏮 元宵：商业灯会',
    getDesc:()=>'元宵佳节，全市举办大型商业灯会。各大企业纷纷亮出年度规划，潜在合作伙伴穿梭其中。这不仅是一场文化盛宴，更是投资机会的展销会。',
    effects:{ money:[1.0,1.3], reputation:[5,20], connections:[8,20], stress:[-10,5] },
    choices:[
      { text:'赞助灯会，增加品牌曝光', effect:{ money:1.05, reputation:20, connections:15, expense:15000, stress:0 }, label:'赞助灯会' },
      { text:'在灯会上寻觅投资机会', effect:{ money:1.3, reputation:10, connections:10, stress:5 }, label:'寻觅投资' },
      { text:'陪家人赏灯，享受温馨', effect:{ money:1.0, reputation:5, stress:-20 }, label:'陪家人' },
    ],
    fallbacks:['元宵灯会，花灯璀璨，商机暗藏。','吃碗汤圆，甜的不只是嘴巴。'],
  },
  {
    id:'holiday_qingming', type:'decision', category:'narrative',
    acts:[1,2,3,4,5], cooldown:999, weight:99,
    title:'🌿 清明：缅怀与休整',
    getDesc:()=>'清明时节，细雨纷纷。公司上下节奏放缓，员工们纷纷回乡祭祖。这是一个适合停下来思考的日子——那些离开的人教会了你什么？',
    effects:{ money:[0.95,1.0], stress:[-30,-15], reputation:[0,5] },
    choices:[
      { text:'给全体员工放3天假', effect:{ money:0.95, stress:-30, loyalty:[5,10], reputation:5 }, label:'放假三天' },
      { text:'组织团建踏青', effect:{ money:0.98, stress:-20, loyalty:[3,8], expense:5000 }, label:'团建踏青' },
      { text:'趁假期复盘第一季度', effect:{ money:1.0, stress:-10, connections:3 }, label:'复盘Q1' },
    ],
    fallbacks:['清明时节雨纷纷，断肠人在天涯。','生命无常，且行且珍惜。'],
  },
  {
    id:'holiday_labor', type:'opportunity', category:'narrative',
    acts:[1,2,3,4,5], cooldown:999, weight:99,
    title:'🔧 五一：劳动节促销',
    getDesc:()=>'五一黄金周来了！全民消费热情高涨，各大商场人山人海。你的业务线迎来了年度促销的最佳窗口。',
    effects:{ money:[1.15,1.5], reputation:[5,15], stress:[5,20] },
    choices:[
      { text:'全线促销，抢占市场', effect:{ money:1.5, reputation:15, stress:20, expense:20000 }, label:'全线促销' },
      { text:'精选重点业务打折', effect:{ money:1.3, reputation:8, stress:10, expense:8000 }, label:'精选打折' },
      { text:'给员工双倍加班费冲刺', effect:{ money:1.2, stress:25, loyalty:[5,12], expense:15000 }, label:'双倍加班' },
    ],
    fallbacks:['五一黄金周，不促销等于白过。','劳动最光荣，促销最赚钱。'],
  },
  {
    id:'holiday_dragon', type:'opportunity', category:'narrative',
    acts:[1,2,3,4,5], cooldown:999, weight:99,
    title:'🐲 端午：传统文化投资',
    getDesc:()=>'龙舟竞渡，粽叶飘香。端午节不仅是传统节日，近年来也成为文化产业投资的爆点。文创周边、非遗合作、国潮品牌……风口正劲。',
    effects:{ money:[1.0,1.25], reputation:[10,25], stress:[-5,10], connections:[5,15] },
    choices:[
      { text:'赞助龙舟赛，冠名品牌', effect:{ money:1.05, reputation:25, connections:15, expense:12000, stress:5 }, label:'冠名龙舟' },
      { text:'投资文创周边产品', effect:{ money:1.25, reputation:10, stress:10, expense:20000 }, label:'文创投资' },
      { text:'给员工发粽子礼盒', effect:{ money:1.0, reputation:15, loyalty:[3,8], stress:-10, expense:5000 }, label:'发粽子' },
    ],
    fallbacks:['龙舟划过江面，一年的运势也划开了。','吃粽子的时候，别忘了生意还在继续。'],
  },
  {
    id:'holiday_qixi', type:'opportunity', category:'narrative',
    acts:[2,3,4,5], cooldown:999, weight:99,
    title:'💕 七夕：浪漫商机',
    getDesc:()=>'七夕情人节，整个城市弥漫着浪漫气息。餐厅爆满、花店涨价、珠宝热销——消费欲望在这个夜晚达到高峰。你的社交圈也活跃起来。',
    effects:{ money:[1.05,1.3], connections:[5,15], stress:[-5,10] },
    choices:[
      { text:'举办高端商务联谊酒会', effect:{ money:1.1, connections:20, stress:10, expense:15000 }, label:'商务联谊' },
      { text:'以公司名义送客户礼物', effect:{ money:1.05, connections:15, reputation:10, expense:10000 }, label:'客户送礼' },
      { text:'借机约心仪对象吃饭', effect:{ money:1.0, stress:-15, connections:3 }, label:'约会放松' },
    ],
    fallbacks:['七夕的夜晚，有人在约会，有人在加班。','牛郎织女一年见一次，你和客户多久见一次？'],
  },
  {
    id:'holiday_midautumn', type:'opportunity', category:'narrative',
    acts:[1,2,3,4,5], cooldown:999, weight:99,
    title:'🌕 中秋：团圆与联谊',
    getDesc:()=>'中秋月圆，又到了人情往来的旺季。月饼、礼盒、商务宴请——这个节日的社交含金量全年最高。送对了礼，一年的关系都稳了。',
    effects:{ money:[1.0,1.15], reputation:[10,30], connections:[10,30], stress:[-10,5] },
    choices:[
      { text:'举办中秋商务联谊晚宴', effect:{ money:1.05, reputation:30, connections:15, stress:5, expense:25000 }, label:'联谊晚宴' },
      { text:'给重要关系人送定制礼盒', effect:{ money:1.0, reputation:15, connections:18, stress:0, expense:18000, npcFavorAll:[3,8] }, label:'定制礼盒' },
      { text:'回家陪家人赏月', effect:{ money:1.0, reputation:5, stress:-20 }, label:'陪家人' },
    ],
    fallbacks:['中秋月圆，人亦圆。','送月饼的学问，比做生意还深。'],
  },
  {
    id:'holiday_national', type:'opportunity', category:'narrative',
    acts:[2,3,4,5], cooldown:999, weight:99,
    title:'🇨🇳 国庆：黄金周消费爆发',
    getDesc:()=>'国庆黄金周！全民出游、消费井喷。零售、餐饮、旅游、酒店全线爆满，这是全年最疯狂的消费盛宴。你准备好收割了吗？',
    effects:{ money:[1.3,2.0], reputation:[5,20], stress:[10,30] },
    choices:[
      { text:'全线涨价，收割红利', effect:{ money:2.0, reputation:5, stress:30 }, label:'全线涨价' },
      { text:'薄利多销，抢占口碑', effect:{ money:1.5, reputation:20, stress:15 }, label:'薄利多销' },
      { text:'趁机给员工放长假充电', effect:{ money:1.1, stress:-5, loyalty:[5,12] }, label:'放假充电' },
    ],
    fallbacks:['国庆黄金周，全国人民都在花钱。','街上的人比蚂蚁还多，消费热情比天高。'],
  },
  {
    id:'holiday_double11', type:'opportunity', category:'narrative',
    acts:[3,4,5], cooldown:999, weight:99,
    title:'🛒 双十一：电商促销大战',
    getDesc:()=>'双十一的战鼓擂响了！全平台砸钱补贴、直播带货、限时秒杀——这是一场没有硝烟的流量战争。不参与，就出局。',
    effects:{ money:[1.2,2.5], reputation:[10,30], stress:[15,40] },
    choices:[
      { text:'重金投放，全力参战', effect:{ money:2.0, reputation:30, stress:40, expense:80000 }, label:'全力参战' },
      { text:'精准投放，理性参与', effect:{ money:1.5, reputation:15, stress:20, expense:30000 }, label:'精准投放' },
      { text:'错峰促销，避开高峰', effect:{ money:1.3, reputation:5, stress:10, expense:10000 }, label:'错峰促销' },
    ],
    fallbacks:['双十一的购物车，装满了消费主义的梦想。','流量如潮水，有人冲浪有人溺亡。'],
  },
  {
    id:'holiday_double12', type:'opportunity', category:'narrative',
    acts:[2,3,4,5], cooldown:999, weight:99,
    title:'📦 双十二：年终清仓',
    getDesc:()=>'双十二来了，这是年前最后一波消费热潮。消费者的钱包还没从双十一恢复，但对于"年终清仓""最后一波"的诱惑，谁能抵抗？',
    effects:{ money:[1.1,1.6], reputation:[5,15], stress:[5,20] },
    choices:[
      { text:'清库存，回笼资金', effect:{ money:1.5, stress:15, expense:5000 }, label:'清库存' },
      { text:'推出新年预售套餐', effect:{ money:1.3, reputation:15, stress:10, expense:10000 }, label:'新年预售' },
      { text:'年终盘点，不参与促销', effect:{ money:1.05, stress:-5 }, label:'不参与' },
    ],
    fallbacks:['双十二，最后的狂欢。','清完库存好过年。'],
  },
  {
    id:'holiday_newyear', type:'opportunity', category:'narrative',
    acts:[1,2,3,4,5], cooldown:999, weight:99,
    title:'🎆 元旦：新年规划',
    getDesc:()=>'新的一年开始了。站在新的起点上，过去一年的得失历历在目。这是一个思考战略、重新出发的时刻。你获得了一个免费的技能点——该如何分配？',
    effects:{ money:[1.0,1.1], reputation:[5,10], stress:[-25,-10], bonusStatPoints:1 },
    choices:[
      { text:'制定雄心勃勃的年度计划', effect:{ money:1.1, reputation:10, stress:10, bonusStatPoints:1 }, label:'雄心计划' },
      { text:'稳健规划，步步为营', effect:{ money:1.05, reputation:8, stress:-10, bonusStatPoints:1 }, label:'稳健规划' },
      { text:'给自己放个假，好好休息', effect:{ money:1.0, reputation:5, stress:-25, bonusStatPoints:1 }, label:'休假充电' },
    ],
    fallbacks:['元旦的钟声，是新的起跑线。','新年新气象，老规矩新打法。'],
  },
  {
    id:'holiday_christmas', type:'opportunity', category:'narrative',
    acts:[3,4,5], cooldown:999, weight:99,
    title:'🎄 圣诞：国际业务机会',
    getDesc:()=>'圣诞节的铃声响遍全球。国际市场的消费热潮达到顶峰，海外合作伙伴也纷纷发来问候。如果你有国际业务布局，这是一年中最好的时机。',
    effects:{ money:[1.15,1.8], reputation:[10,25], connections:[10,30], stress:[-5,15] },
    choices:[
      { text:'冲刺海外圣诞促销', effect:{ money:1.8, reputation:20, connections:15, stress:15, expense:25000 }, label:'海外促销' },
      { text:'给海外客户寄圣诞礼物', effect:{ money:1.1, reputation:25, connections:18, stress:-5, expense:15000 }, label:'圣诞礼物' },
      { text:'组织公司圣诞派对', effect:{ money:1.05, reputation:10, loyalty:[5,12], stress:-15, expense:8000 }, label:'圣诞派对' },
    ],
    fallbacks:['圣诞老人的礼物袋，装不下所有商机。','Jingle Bells，商机来敲门。'],
  },

  // ===== 新增随机事件 (15个) =====
  {
    id:'extra_talent_poach', type:'crisis', category:'narrative',
    acts:[2,3,4,5], cooldown:80, weight:5,
    title:'挖角反击战',
    getDesc:()=>'竞争对手对你的核心团队发动了挖角攻势——3名骨干员工同时收到高薪offer。如果不采取措施，你的核心团队将被肢解。',
    effects:{ money:[0.85,1.0], stress:[20,40], loyalty:[-20,-5] },
    choices:[
      { text:'大幅加薪留人', effect:{ money:0.85, stress:25, loyalty:[5,10], expense:20000 }, label:'加薪留人' },
      { text:'签订竞业协议+期权', effect:{ money:0.9, stress:30, loyalty:[-5,5], expense:10000 }, label:'期权绑定' },
      { text:'随他们去，重新招人', effect:{ money:1.0, stress:20, loyalty:[-20,-10], connections:-5 }, label:'重新招人' },
    ],
    fallbacks:['在挖角这件事上，钱不是万能的，但没钱是万万不能的。','你的团队被人盯上了。'],
  },
  {
    id:'extra_angel', type:'opportunity', category:'narrative',
    acts:[1,2,3], cooldown:100, weight:4,
    title:'天使投资人来敲门',
    getDesc:()=>'一位知名天使投资人通过朋友介绍找到你，对你的商业模式非常感兴趣。他愿意投资一笔可观的资金，但想要一定的股权和控制权。',
    effects:{ money:[1.0,2.5], reputation:[15,35], connections:[10,20], stress:[5,20] },
    choices:[
      { text:'接受投资，出让少部分股权', effect:{ money:2.5, reputation:35, connections:20, stress:15 }, label:'出让股权' },
      { text:'只接受可转债融资', effect:{ money:1.8, reputation:15, connections:15, stress:10 }, label:'可转债' },
      { text:'婉拒，保持独立', effect:{ money:1.0, reputation:5, connections:5, stress:0 }, label:'保持独立' },
    ],
    fallbacks:['资本敲门的时候，你得想清楚是开还是不开。','天使投资人，有时候是天使，有时候是……'],
  },
  {
    id:'extra_reg_fine', type:'crisis', category:'narrative',
    acts:[2,3,4,5], cooldown:90, weight:5,
    title:'市场监管罚款',
    getDesc:()=>'市场监管局突击检查，发现你的某条业务线存在合规瑕疵。执法人员开出了一张罚单，并要求限期整改。',
    effects:{ money:[0.7,0.95], reputation:[-20,0], stress:[15,35] },
    choices:[
      { text:'主动认罚，立即整改', effect:{ money:0.85, reputation:-5, stress:20, expense:30000 }, label:'认罚整改' },
      { text:'找王律师申诉减免', effect:{ money:0.8, reputation:-10, stress:30, expense:15000 }, label:'律师申诉' },
      { text:'私下疏通关系', effect:{ money:0.7, reputation:0, stress:25, expense:50000, connections:[3,8] }, label:'私下疏通' },
    ],
    fallbacks:['罚款事小，声誉事大。','监管部门又一次证明了它的存在感。'],
  },
  {
    id:'extra_pr_crisis', type:'crisis', category:'narrative',
    acts:[3,4,5], cooldown:100, weight:4,
    title:'网络舆情危机',
    getDesc:()=>'一条关于你公司的负面消息在微博上炸了锅——"某公司产品质量问题致消费者投诉无门"。话题阅读量迅速破千万，评论区一片骂声。',
    effects:{ money:[0.7,0.9], reputation:[-30,-10], stress:[25,50] },
    choices:[
      { text:'召开新闻发布会道歉', effect:{ money:0.85, reputation:-10, stress:35, expense:20000 }, label:'公开道歉' },
      { text:'启动危机公关+删帖', effect:{ money:0.78, reputation:-15, stress:45, expense:50000 }, label:'危机公关' },
      { text:'冷处理，等热度过去', effect:{ money:0.75, reputation:-30, stress:25 }, label:'冷处理' },
    ],
    fallbacks:['键盘侠的狂欢，企业家的噩梦。','舆论的潮水，来得快去得也快，但留下的水渍很难擦。'],
  },
  {
    id:'extra_celebrity', type:'opportunity', category:'narrative',
    acts:[2,3,4,5], cooldown:80, weight:4,
    title:'明星代言机会',
    getDesc:()=>{
      const celebs=['当红顶流演员','热门综艺常驻嘉宾','国民级歌手','体育奥运冠军'];
      return `一位${celebs[Math.floor(Math.random()*celebs.length)]}的经纪人主动联系你，表示愿意为你的品牌代言。代言费不菲，但带来的品牌效应可能是几何级的。`;
    },
    effects:{ money:[1.0,1.6], reputation:[15,40], stress:[5,20] },
    choices:[
      { text:'签下代言，全渠道投放', effect:{ money:1.2, reputation:40, stress:20, expense:100000 }, label:'签下代言' },
      { text:'只签线上代言，控制预算', effect:{ money:1.1, reputation:25, stress:10, expense:40000 }, label:'线上代言' },
      { text:'风险太大，婉拒', effect:{ money:1.0, reputation:5, stress:-5 }, label:'婉拒' },
    ],
    fallbacks:['明星的流量，有时候是蜜糖，有时候是砒霜。','代言费贵得让人心跳加速。'],
  },
  {
    id:'extra_patent', type:'opportunity', category:'narrative',
    acts:[2,3,4,5], cooldown:110, weight:4,
    title:'技术专利突破',
    getDesc:()=>'你的技术团队在核心算法上取得了重大突破！这项专利如果申请成功，将在行业内建立强大的技术壁垒。但专利申请流程复杂，需要资金和时间投入。',
    effects:{ money:[1.0,1.5], reputation:[20,40], techBonus:[1,3], stress:[5,20] },
    choices:[
      { text:'全力申请PCT国际专利', effect:{ money:1.1, reputation:40, techBonus:3, stress:20, expense:60000 }, label:'国际专利' },
      { text:'先申请国内发明专利', effect:{ money:1.2, reputation:25, techBonus:2, stress:10, expense:25000 }, label:'国内专利' },
      { text:'作为商业机密保护', effect:{ money:1.3, reputation:15, techBonus:1, stress:5 }, label:'商业机密' },
    ],
    fallbacks:['一项好的专利，胜过千军万马。','技术护城河，是商业竞争中最坚固的壁垒。'],
  },
  {
    id:'extra_whistle', type:'crisis', category:'narrative',
    acts:[3,4,5], cooldown:120, weight:4,
    title:'内部举报风波',
    getDesc:()=>'一封匿名举报信送到了你的桌上——某中层管理者涉嫌挪用公款、收受回扣。如果属实，这是严重的内部腐败；如果是诽谤，说明公司内部已经山头林立。',
    effects:{ money:[0.8,1.0], reputation:[-15,5], stress:[20,45], loyalty:[-10,0] },
    choices:[
      { text:'启动内部审计，零容忍', effect:{ money:0.85, reputation:5, stress:35, loyalty:[3,8], expense:10000 }, label:'内部审计' },
      { text:'私下调查，暂不声张', effect:{ money:0.9, stress:25, loyalty:[-5,0] }, label:'私下调查' },
      { text:'冷处理，稳定团队优先', effect:{ money:1.0, reputation:-15, stress:10, loyalty:[-3,3] }, label:'冷处理' },
    ],
    fallbacks:['公司内部的水，比你想象的深。','一封举报信，能揭开潘多拉的盒子。'],
  },
  {
    id:'extra_office_love', type:'decision', category:'narrative',
    acts:[2,3,4,5], cooldown:150, weight:3,
    title:'办公室恋情风波',
    getDesc:()=>'财务部的小王和市场部的小李公开了恋情。两人在公司里甜甜蜜蜜，但其他员工开始议论：这会不会影响工作公正性？更头疼的是，小王手里握着全公司的薪资数据。',
    effects:{ money:[0.95,1.05], loyalty:[-5,5], stress:[5,15] },
    choices:[
      { text:'制定办公室恋情规范，调岗', effect:{ money:1.0, loyalty:[0,5], stress:10 }, label:'制度规范' },
      { text:'睁一只眼闭一只眼', effect:{ money:1.05, loyalty:[-5,0], stress:5 }, label:'放任不管' },
      { text:'私下谈心，让他们低调', effect:{ money:1.0, loyalty:[3,5], stress:15 }, label:'私下提醒' },
    ],
    fallbacks:['恋爱自由，但办公室不是约会场所。','管理者的难题：管还是不管？'],
  },
  {
    id:'extra_industry_std', type:'opportunity', category:'narrative',
    acts:[4,5], cooldown:130, weight:3,
    title:'行业标准制定权',
    getDesc:()=>'行业协会邀请你参与制定下一版行业技术标准。拥有标准制定权意味着你的技术路线将成为全行业的风向标，竞争对手将不得不跟随你的脚步。',
    effects:{ money:[1.1,1.6], reputation:[20,50], connections:[15,30], stress:[10,25] },
    choices:[
      { text:'积极主导标准制定', effect:{ money:1.3, reputation:35, connections:18, stress:25, expense:50000 }, label:'主导制定' },
      { text:'参与但不主导', effect:{ money:1.2, reputation:35, connections:12, stress:15, expense:20000 }, label:'参与制定' },
      { text:'标准制定太累，专注业务', effect:{ money:1.5, reputation:10, connections:5, stress:5 }, label:'专注业务' },
    ],
    fallbacks:['得标准者得天下，这是亘古不变的真理。','坐在标准制定的桌子上，你说了算。'],
  },
  {
    id:'extra_bidding', type:'crisis', category:'narrative',
    acts:[3,4,5], cooldown:70, weight:5,
    title:'竞标大战',
    getDesc:()=>{
      const items=['城市智慧交通系统','政务云平台搭建','大型商业综合体开发','新能源充电桩网络'];
      return `一个${items[Math.floor(Math.random()*items.length)]}的招标公告发布了，标的金额巨大。但竞争对手众多，而且据说有人已经提前运作了关系。`;
    },
    effects:{ money:[0.8,2.0], reputation:[10,30], connections:[5,20], stress:[20,45] },
    choices:[
      { text:'重金公关，志在必得', effect:{ money:0.8, reputation:20, connections:20, stress:45, expense:80000 }, label:'重金公关' },
      { text:'凭实力投标，顺其自然', effect:{ money:1.2, reputation:15, stress:25, expense:15000 }, label:'实力投标' },
      { text:'放弃竞标，不蹚浑水', effect:{ money:1.8, reputation:0, stress:-10 }, label:'放弃竞标' },
    ],
    fallbacks:['竞标是门艺术，比的是实力+关系+运气。','标书厚得像本字典，但决定胜负的往往是薄薄一张关系网。'],
  },
  {
    id:'extra_charity', type:'opportunity', category:'narrative',
    acts:[2,3,4,5], cooldown:90, weight:4,
    title:'慈善晚宴邀请',
    getDesc:()=>'你收到了一张高端慈善晚宴的邀请函。主办方是市工商联，出席的嘉宾非富即贵。晚宴的重头戏是慈善拍卖，拍品的溢价部分将捐给希望工程。',
    effects:{ money:[1.0,1.1], reputation:[15,40], connections:[10,30], stress:[-5,10] },
    choices:[
      { text:'拍下最贵的拍品，一举成名', effect:{ money:1.0, reputation:40, connections:18, stress:10, expense:100000 }, label:'豪掷千金' },
      { text:'适度参与，低调做慈善', effect:{ money:1.05, reputation:25, connections:15, stress:0, expense:20000 }, label:'适度慈善' },
      { text:'只出席不竞拍，社交为主', effect:{ money:1.08, reputation:10, connections:20, stress:-5, expense:2000 }, label:'社交为主' },
    ],
    fallbacks:['慈善晚宴上，每一杯香槟都值千金。','做慈善的最高境界：既帮了别人，又成就了自己。'],
  },
  {
    id:'extra_gov_tender', type:'opportunity', category:'narrative',
    acts:[3,4,5], cooldown:100, weight:4,
    title:'政府采购大单',
    getDesc:()=>'市政府发布了一批政府采购项目，涵盖IT服务、办公用品、物业管理等领域。政府采购订单利润稳定、回款可靠，是所有企业梦寐以求的"铁饭碗"。',
    effects:{ money:[1.15,1.8], reputation:[10,30], connections:[10,25], stress:[5,20] },
    choices:[
      { text:'全力准备投标，务必拿下', effect:{ money:1.3, reputation:30, connections:25, stress:20, expense:30000 }, label:'全力投标' },
      { text:'联合其他企业联合投标', effect:{ money:1.2, reputation:15, connections:20, stress:10, expense:15000 }, label:'联合投标' },
      { text:'政府项目太繁琐，放弃', effect:{ money:1.5, reputation:0, connections:-5, stress:-5 }, label:'放弃' },
    ],
    fallbacks:['政府的单子，利润不一定最高，但一定最稳。','和zf做生意，走的是关系，拼的是资质。'],
  },
  {
    id:'extra_hack', type:'crisis', category:'narrative',
    acts:[3,4,5], cooldown:130, weight:3,
    title:'黑客攻击',
    getDesc:()=>'凌晨3点，你的CTO打来紧急电话：公司服务器遭到了勒索病毒攻击，核心数据被加密。黑客要求支付比特币赎金才能解锁，否则永久删除数据。',
    effects:{ money:[0.6,0.9], reputation:[-20,0], stress:[30,60] },
    choices:[
      { text:'支付赎金，恢复数据', effect:{ money:0.7, reputation:-5, stress:40, expense:50000 }, label:'付赎金' },
      { text:'聘请安全公司，尝试破解', effect:{ money:0.75, reputation:10, stress:55, expense:30000 }, label:'请安全公司' },
      { text:'从备份恢复，加强防护', effect:{ money:0.65, reputation:0, stress:35, expense:10000 }, label:'备份恢复' },
    ],
    fallbacks:['数字时代的土匪，不用刀枪，只靠一行代码。','被黑客盯上的感觉，就像家里进了贼。'],
  },
  {
    id:'extra_talent_return', type:'opportunity', category:'narrative',
    acts:[3,4,5], cooldown:120, weight:4,
    title:'人才回流',
    getDesc:()=>'一位曾在你手下工作的明星员工从海外回国了。他在硅谷大厂积累了3年经验，现在希望重回你的团队。但他在海外的薪资是你目前能给的3倍。',
    effects:{ money:[1.0,1.3], reputation:[5,15], stress:[5,15] },
    choices:[
      { text:'不惜代价聘请，给合伙人待遇', effect:{ money:1.05, reputation:15, stress:10, expense:30000, loyalty:[3,8] }, label:'合伙人待遇' },
      { text:'合理薪酬+期权激励', effect:{ money:1.1, reputation:10, stress:5, expense:15000 }, label:'期权激励' },
      { text:'婉拒，感谢他的认可', effect:{ money:1.3, reputation:5, stress:0 }, label:'婉拒' },
    ],
    fallbacks:['海归人才，带回来的是技术、视野和人脉。','好马也吃回头草，看你怎么喂。'],
  },
  {
    id:'extra_summit', type:'opportunity', category:'narrative',
    acts:[3,4,5], cooldown:100, weight:4,
    title:'行业峰会演讲邀请',
    getDesc:()=>'全国行业峰会的组委会发来邀请：请你作为嘉宾发表主题演讲。台下坐着上千位行业精英和数十家媒体记者。这是提升个人和公司品牌的天赐良机。',
    effects:{ money:[1.0,1.15], reputation:[20,50], connections:[10,30], stress:[10,25] },
    choices:[
      { text:'精心准备，做重磅演讲', effect:{ money:1.05, reputation:35, connections:18, stress:25 }, label:'重磅演讲' },
      { text:'参加圆桌论坛，轻松一些', effect:{ money:1.08, reputation:30, connections:12, stress:15 }, label:'圆桌论坛' },
      { text:'婉拒，让VP代劳', effect:{ money:1.1, reputation:10, connections:5, stress:0 }, label:'VP代劳' },
    ],
    fallbacks:['站上行业峰会的舞台，你就是行业的代言人。','一次好的演讲，比一百次广告还有效。'],
  },


  // ===== 竞争对手事件 (5个) =====
  {
    id:'rival_1_event', type:'crisis', category:'narrative',
    acts:[2,3,4,5], cooldown:120, weight:4,
    title:'鼎盛集团挖角风波',
    getDesc:()=>'鼎盛集团（刘建国）突然从你的团队中挖走了一名核心员工。对方开出了双倍薪资，你的项目进度受到严重影响。',
    effects:{ money:[0.85,0.95], reputation:[-5,5], stress:[20,40], loyalty:[-15,-5] },
    choices:[
      { text:'高薪挽留，正面硬刚', effect:{ money:0.9, reputation:5, stress:30, loyalty:[5,10] }, label:'高薪挽留' },
      { text:'起诉鼎盛，用法律维权', effect:{ money:0.85, reputation:10, stress:40, connections:[3,8] }, label:'法律维权' },
      { text:'接受现实，重新招聘', effect:{ money:0.95, reputation:0, stress:15 }, label:'重新招聘' },
    ],
    fallbacks:['刘建国的手段，一向不按常理出牌。','人才战，永远是商战中最残酷的一环。'],
  },
  {
    id:'rival_2_event', type:'opportunity', category:'narrative',
    acts:[2,3,4,5], cooldown:150, weight:3,
    title:'恒通控股提出合作',
    getDesc:()=>`恒通控股（陈明远）主动找上门来，提出在科技领域展开战略合作。对方态度诚恳，条件看起来不错。`,
    effects:{ money:[1.0,1.5], reputation:[10,25], connections:[5,15], stress:[5,20] },
    choices:[
      { text:'全面合作，深度绑定', effect:{ money:1.3, reputation:25, connections:15, stress:20 }, label:'全面合作' },
      { text:'先签框架协议试点', effect:{ money:1.1, reputation:15, connections:8, stress:5 }, label:'框架协议' },
      { text:'婉拒，保持竞争关系', effect:{ money:1.0, reputation:5, connections:3, stress:-5 }, label:'婉拒' },
    ],
    fallbacks:['陈明远这个人，做事稳扎稳打，合作风险不大。','恒通是少数值得合作的竞争对手。'],
  },
  {
    id:'rival_3_event', type:'opportunity', category:'narrative',
    acts:[3,4,5], cooldown:100, weight:4,
    title:'新世纪资本陷入危机',
    getDesc:()=>'新世纪资本（赵雪琴）的重仓项目暴雷，资金链紧绷，正在寻求接盘方。如果你出手，可以用极低价格收购他们的优质资产。',
    effects:{ money:[0.5,2.0], reputation:[-5,15], stress:[15,40] },
    choices:[
      { text:'低价收购核心资产', effect:{ money:0.7, reputation:5, stress:35 }, label:'低价收购' },
      { text:'提供过桥贷款，拿股权', effect:{ money:0.9, reputation:15, connections:10, stress:20 }, label:'过桥贷款' },
      { text:'不蹚浑水，观望到底', effect:{ money:1.5, reputation:-5, stress:5 }, label:'观望' },
    ],
    fallbacks:['赵雪琴太激进了，迟早要出事。','危机就是机遇，关键是敢不敢出手。'],
  },
  {
    id:'rival_4_event', type:'opportunity', category:'narrative',
    acts:[3,4,5], cooldown:130, weight:3,
    title:'蓝天科技技术突破',
    getDesc:()=>'蓝天科技（孙浩然）宣布在AI领域取得重大突破，相关专利已申请。消息一出，科技板块集体大涨。如果你也布局了科技业务，将受到带动。',
    effects:{ money:[1.1,1.6], reputation:[5,20], techStat:[1,3], stress:[-5,15] },
    choices:[
      { text:'跟进研发，正面竞争', effect:{ money:1.2, reputation:15, techStat:3, stress:20 }, label:'跟进研发' },
      { text:'寻求技术授权合作', effect:{ money:1.4, reputation:20, connections:10, stress:5 }, label:'技术授权' },
      { text:'转向其他赛道避开锋芒', effect:{ money:1.1, reputation:5, stress:-5 }, label:'避开锋芒' },
    ],
    fallbacks:['孙浩然这小子，技术确实有两把刷子。','AI的风口，蓝天科技抢先了一步。'],
  },
  {
    id:'rival_5_event', type:'opportunity', category:'narrative',
    acts:[4,5], cooldown:160, weight:3,
    title:'远洋国际海外上市',
    getDesc:()=>'远洋国际（周海燕）在纽约证券交易所成功上市，募资规模远超预期。上市后，远洋的资金实力和品牌影响力大幅提升，对同行形成压力。',
    effects:{ money:[0.9,1.3], reputation:[-5,10], stress:[10,30] },
    choices:[
      { text:'加速自己的上市计划', effect:{ money:1.1, reputation:10, stress:30 }, label:'加速上市' },
      { text:'与远洋寻求海外合作', effect:{ money:1.2, reputation:15, connections:15, stress:10 }, label:'寻求合作' },
      { text:'专注国内市场，错位竞争', effect:{ money:1.3, reputation:5, stress:-5 }, label:'错位竞争' },
    ],
    fallbacks:['周海燕这步棋走得漂亮，国际化布局领先了。','远洋上市后，竞争格局又要变了。'],
  },


  // ===== 人脉危机事件 (7) =====
  {
    id:'conn_crisis_01', type:'social', category:'decision',
    acts:[0,1,2,3,4,5], cooldown:90, weight:8,
    title:'朋友紧急借钱',
    getDesc:()=>{
      const names=['大学同学老周','前同事阿杰','远房表哥','创业伙伴小刘','老邻居张叔'];
      const reasons=['生意周转不开','家人生病急需医药费','房贷断供','投资踩雷了','公司发不出工资'];
      const n=names[Math.floor(Math.random()*names.length)];
      const r=reasons[Math.floor(Math.random()*reasons.length)];
      return `${n}深夜打来电话，声音焦急："${r}，能不能借我${30+Math.floor(Math.random()*70)}万周转一下？"你知道，这笔钱大概率是有去无回。`;
    },
    effects:{ money:[-300000,50000], connections:[-12,5], stress:[10,30] },
    choices:[
      { text:'爽快借出，不计回报', effect:{ money:-300000, connections:5, stress:10 }, label:'重情重义' },
      { text:'借一半，打好欠条', effect:{ money:-150000, connections:0, stress:15 }, label:'半情半理' },
      { text:'婉拒，推荐贷款渠道', effect:{ money:-10000, connections:-8, stress:25 }, label:'婉拒' },
    ],
    fallbacks:['深夜借钱电话，商场上常见的人情局。','钱和人情，哪个更重要？'],
  },
  {
    id:'conn_crisis_02', type:'social', category:'decision',
    acts:[1,2,3,4,5], cooldown:85, weight:7,
    title:'圈内丑闻波及',
    getDesc:()=>{
      const names=['商会副会长老郑','你的投资人李先生','合作伙伴王总','圈内大佬老马'];
      const scandals=['被曝财务造假','涉嫌内幕交易被调查','卷入权色丑闻','被举报偷税漏税'];
      const n=names[Math.floor(Math.random()*names.length)];
      const s=scandals[Math.floor(Math.random()*scandals.length)];
      return `${n}${s}。媒体深挖后发现你和${n}过往密切，已经有记者联系你求证。你的朋友圈开始有人悄悄取关。`;
    },
    effects:{ reputation:[-15,5], connections:[-15,5], stress:[20,40] },
    choices:[
      { text:'公开划清界限，表明立场', effect:{ reputation:5, connections:-15, stress:30 }, label:'划清界限' },
      { text:'私下沟通但不公开表态', effect:{ reputation:-10, connections:-3, stress:20 }, label:'保持沉默' },
      { text:'力挺朋友，共渡难关', effect:{ reputation:-15, connections:5, stress:40 }, label:'力挺' },
    ],
    fallbacks:['圈子里出了事，你也难独善其身。','你引以为傲的人脉，有时候也是定时炸弹。'],
  },
  {
    id:'conn_crisis_03', type:'social', category:'decision',
    acts:[1,2,3,4,5], cooldown:80, weight:7,
    title:'人情绑架',
    getDesc:()=>{
      const p=['帮你拉过投资的王叔','介绍过关键客户的赵姐','帮你摆平过麻烦的李哥'];
      const fav=['让你投资他儿子的"稳赚"项目','要你给侄子安排高管职位','让你在政府招标中"通融通融"'];
      const pers=p[Math.floor(Math.random()*p.length)];
      const f=fav[Math.floor(Math.random()*fav.length)];
      return `当年${pers}帮过你一个大忙，现在他来找你${f}。你知道这事不靠谱，但欠着人情不还，在圈子里口碑会崩。`;
    },
    effects:{ money:[0.7,1.1], connections:[-10,5], reputation:[-10,10], stress:[20,45] },
    choices:[
      { text:'咬牙答应，还人情债', effect:{ money:0.7, connections:5, reputation:-10, stress:45 }, label:'还人情' },
      { text:'折中：出钱不出力', effect:{ money:0.85, connections:-2, reputation:0, stress:30 }, label:'折中' },
      { text:'委婉拒绝，另找方式补偿', effect:{ money:1.1, connections:-10, reputation:10, stress:20 }, label:'拒绝' },
    ],
    fallbacks:['人情债，是商场最难偿还的东西。','欠人的，迟早要还。'],
  },
  {
    id:'conn_crisis_04', type:'social', category:'decision',
    acts:[0,1,2,3,4,5], cooldown:70, weight:6,
    title:'社交倦怠',
    getDesc:()=>{
      const inst=['"新海商业领袖私董会"晚宴','"青年企业家俱乐部"游艇派对','"创投圈年终盛典"','"长江同学会"高尔夫球局'];
      const e=inst[Math.floor(Math.random()*inst.length)];
      return `本周你收到了${e}的邀请。但你最近已经连续三周在应酬了，疲惫不堪。助理提醒这种场合不去会被圈子遗忘，去了又实在扛不住。`;
    },
    effects:{ connections:[-8,3], stress:[-20,35], reputation:[-5,5] },
    choices:[
      { text:'硬着头皮去，保持曝光', effect:{ connections:3, stress:35, reputation:5 }, label:'硬撑' },
      { text:'派公司高层代为出席', effect:{ connections:-3, stress:-5, reputation:0 }, label:'派人替' },
      { text:'果断拒绝，专心工作', effect:{ connections:-8, stress:-20, reputation:-5 }, label:'拒绝' },
    ],
    fallbacks:['社交也是工作，累了也得撑着。','圈子需要你，你也需要圈子——但这根弦一直在绷着。'],
  },
  {
    id:'conn_crisis_05', type:'social', category:'decision',
    acts:[2,3,4,5], cooldown:100, weight:6,
    title:'商业纠纷惊动圈内',
    getDesc:()=>{
      const biz=Object.values(SGame.G&&SGame.G.businesses||{}).find(b=>b.level>0);
      const bizName=biz&&biz.name||'你的核心业务';
      return `你的${bizName}与供应商发生了严重纠纷。对方在商协群里公开"曝光"你的"不诚信行为"。虽然事实并非如此，但谣言已经传开了。好几个合作方发来信息询问情况。`;
    },
    effects:{ connections:[-20,5], reputation:[-20,10], money:[0.8,1.05], stress:[25,50] },
    choices:[
      { text:'公开回应+律师函+请第三方调查', effect:{ connections:-5, reputation:10, money:0.85, stress:40 }, label:'正面回应' },
      { text:'私下和解，赔偿了事', effect:{ connections:0, reputation:-5, money:0.8, stress:25 }, label:'花钱消灾' },
      { text:'冷处理，等风头过去', effect:{ connections:-20, reputation:-20, money:1.05, stress:50 }, label:'冷处理' },
    ],
    fallbacks:['商业纠纷被公开后，圈内人会重新评估你。','名声和人脉，有时候比钱更脆弱。'],
  },
  {
    id:'conn_crisis_06', type:'social', category:'decision',
    acts:[1,2,3,4,5], cooldown:75, weight:6,
    title:'老友背刺',
    getDesc:()=>{
      const names=['多年的合作伙伴阿明','大学时期的创业搭档小方','曾经一起打天下的CTO老徐'];
      const betrayals=['把你的商业计划泄露给了竞争对手','在你融资关键期散布你的负面消息','挖走了你三个核心团队成员'];
      const n=names[Math.floor(Math.random()*names.length)];
      const b=betrayals[Math.floor(Math.random()*betrayals.length)];
      return `${n}${b}。你不敢相信——你们的关系一直很铁。但商场如战场，利益面前，有些人会选择背叛。`;
    },
    effects:{ connections:[-15,5], stress:[30,60], reputation:[-5,10], money:[0.75,1.0] },
    choices:[
      { text:'公开决裂，以儆效尤', effect:{ connections:-10, stress:30, reputation:10, money:0.9 }, label:'公开决裂' },
      { text:'私下对质，解决问题', effect:{ connections:-5, stress:50, reputation:-5, money:0.85 }, label:'私下对质' },
      { text:'忍着，先稳住局面再计较', effect:{ connections:-15, stress:60, reputation:0, money:0.75 }, label:'忍辱负重' },
    ],
    fallbacks:['你最信任的人，在你背后插了一刀。','背叛，是商场最残酷的一课。'],
  },
  {
    id:'conn_crisis_07', type:'social', category:'decision',
    acts:[2,3,4,5], cooldown:95, weight:5,
    title:'圈子站队',
    getDesc:()=>{
      const factions=['传统实业派（以商会会长老郑为首）','新锐科技派（以AI新贵小陈为首）','资本运作派（以投资人赵雪琴为首）'];
      const f1=factions[Math.floor(Math.random()*factions.length)];
      const others=factions.filter(f=>f!==f1);
      const f2=others[Math.floor(Math.random()*others.length)];
      return `${f1}和${f2}之间爆发了激烈矛盾，双方的圈子都在逼成员"站队"。你的业务横跨两边，两边都有人看着你。无论选哪边，另一边的人脉都会断掉。`;
    },
    effects:{ connections:[-25,8], reputation:[-15,20], stress:[30,55] },
    choices:[
      { text:'公开支持一边，放弃另一边', effect:{ connections:-10, reputation:-15, stress:30 }, label:'站一边' },
      { text:'保持中立，两边都不站', effect:{ connections:-25, reputation:5, stress:45 }, label:'保持中立' },
      { text:'积极调解，做和事佬', effect:{ connections:-5, reputation:20, stress:55 }, label:'调解' },
    ],
    fallbacks:['圈子站队，得罪谁都是损失。','平衡是最难的——站哪边都是输掉一半。'],
  },

  // ===== 声誉危机事件 (4) =====
  {
    id:'rep_crisis_01', type:'social', category:'decision',
    acts:[1,2,3,4,5], cooldown:90, weight:7,
    title:'负面新闻炒作',
    getDesc:()=>{
      const issues=['产品质量投诉被自媒体放大','前员工在脉脉匿名发帖黑你','某消费者协会点名批评你的产品','竞争对手买水军刷差评'];
      const i=issues[Math.floor(Math.random()*issues.length)];
      return `一则关于你的负面消息在社交媒体上发酵：#${i}#话题冲上热搜。尽管事实未必如此，但公众情绪已被点燃。品牌形象正在受损。`;
    },
    effects:{ reputation:[-20,5], money:[0.85,1.05], stress:[20,40] },
    choices:[
      { text:'召开发布会，公开澄清', effect:{ reputation:5, money:0.9, stress:30, expense:30000 }, label:'公开澄清' },
      { text:'请公关公司删除舆情', effect:{ reputation:-5, money:0.95, stress:20, expense:80000 }, label:'舆情管控' },
      { text:'冷处理，让时间证明一切', effect:{ reputation:-20, money:1.05, stress:40 }, label:'冷处理' },
    ],
    fallbacks:['负面新闻来得快，去得也快——如果不处理，可能伤害更大。','公众一旦形成负面印象，很难扭转。'],
  },
  {
    id:'rep_crisis_02', type:'social', category:'decision',
    acts:[2,3,4,5], cooldown:100, weight:6,
    title:'行业口碑危机',
    getDesc:()=>{
      const events=['行业协会发布了年度不诚信企业名单','某媒体深度调查报道了你的行业乱象','你所在行业被央视3·15晚会曝光','供应链环节被曝出环境违规问题'];
      const e=events[Math.floor(Math.random()*events.length)];
      return `${e}。虽然你的公司并非主要问题方，但行业信誉整体受损，客户开始对整个行业持怀疑态度。你的声誉也因此被动下滑。`;
    },
    effects:{ reputation:[-15,8], money:[0.8,1.1], stress:[15,45] },
    choices:[
      { text:'高调宣布整改，树立行业标杆', effect:{ reputation:8, money:0.85, stress:35, expense:50000 }, label:'树标杆' },
      { text:'联合同行成立自律联盟', effect:{ reputation:3, money:0.9, stress:25, expense:20000 }, label:'自律联盟' },
      { text:'低调行事，等风波过去', effect:{ reputation:-15, money:1.1, stress:15 }, label:'低调' },
    ],
    fallbacks:['一个行业的声誉就是你的背景色。','行业口碑下跌，谁也逃不掉。'],
  },
  {
    id:'rep_crisis_03', type:'social', category:'decision',
    acts:[1,2,3,4,5], cooldown:80, weight:6,
    title:'公开场合失言',
    getDesc:()=>{
      const venues=['企业家论坛圆桌讨论','某财经媒体专访','公司年会公开演讲','行业峰会主题分享'];
      const blunders=['随口说了一句\"穷人就应该买廉价产品\"','评论了竞争对手的私生活','不小心透露了下季度的商业机密','在回答提问时失态怼了记者'];
      const v=venues[Math.floor(Math.random()*venues.length)];
      const b=blunders[Math.floor(Math.random()*blunders.length)];
      return `你在${v}上${b}。视频被传到网上后播放量迅速破百万，评论区炸了。你的个人形象——以及公司形象——正在遭受严重打击。`;
    },
    effects:{ reputation:[-20,8], connections:[-10,5], stress:[25,55] },
    choices:[
      { text:'立即录制道歉视频', effect:{ reputation:-5, connections:2, stress:35 }, label:'公开道歉' },
      { text:'发声明说是\"断章取义\"', effect:{ reputation:-12, connections:-3, stress:25 }, label:'否认' },
      { text:'自嘲式幽默回应，化解尴尬', effect:{ reputation:-2, connections:5, stress:55 }, label:'幽默化解' },
    ],
    fallbacks:['在公众场合，一句话可能毁掉十年积累。','公开失言是企业家最大的风险之一。'],
  },
  {
    id:'rep_crisis_04', type:'social', category:'decision',
    acts:[2,3,4,5], cooldown:95, weight:5,
    title:'公益翻车事件',
    getDesc:()=>{
      const charities=['捐建希望小学被曝工程质量问题','公益基金会账目被质疑不透明','慈善晚宴被拍到铺张浪费','捐赠物资被发现过期'];
      const c=charities[Math.floor(Math.random()*charities.length)];
      return `你参与的公益项目${c}被媒体曝光。网友怒骂\"伪善\"\"作秀\"。本是好意，却变成了声誉灾难。公益形象——哪怕是无心的失误——都会被无限放大。`;
    },
    effects:{ reputation:[-25,5], money:[0.9,1.1], stress:[20,50] },
    choices:[
      { text:'全额退赔+公开检讨+引入第三方审计', effect:{ reputation:5, money:0.85, stress:45, expense:150000 }, label:'彻底整改' },
      { text:'发声明解释情况+重新审核流程', effect:{ reputation:-8, money:0.95, stress:30, expense:30000 }, label:'亡羊补牢' },
      { text:'停止项目，不再回应', effect:{ reputation:-25, money:1.1, stress:20 }, label:'中断项目' },
    ],
    fallbacks:['公益翻车比商业失误更伤声誉。','做好事却做成了坏事，这是一种特别的讽刺。'],
  },

];

// ---- 事件总览 ----
// 市场12 + 员工10 + 政策8 + 运营8 + 个人6 + NPC10 + 里程碑5 + 竞争对手事件5 + 人脉危机7 + 声誉危机4 = 75个
// 决策型事件占比约 45%

// ---- 热搜榜初始 ----

// ========== 竞争对手定义 ==========
const RIVALS = [
  { id:'rival_1', name:'鼎盛集团', boss:'刘建国', startMoney:80, growthRate:1.05, style:'激进', color:'#ff6b6b', desc:'老牌地产巨头，作风强硬，擅长资本运作' },
  { id:'rival_2', name:'恒通控股', boss:'陈明远', startMoney:100, growthRate:1.04, style:'稳健', color:'#4ecdc4', desc:'综合型控股集团，业务多元，现金流充裕' },
  { id:'rival_3', name:'新世纪资本', boss:'赵雪琴', startMoney:60, growthRate:1.07, style:'投机', color:'#ffe66d', desc:'PE/VC背景，擅长风口投资，收益波动大' },
  { id:'rival_4', name:'蓝天科技', boss:'孙浩然', startMoney:50, growthRate:1.08, style:'科技', color:'#a29bfe', desc:'AI独角兽出身，技术驱动，年轻化团队' },
  { id:'rival_5', name:'远洋国际', boss:'周海燕', startMoney:120, growthRate:1.03, style:'国际化', color:'#fd79a8', desc:'跨国贸易起家，海外资源丰富，正在转型' },
];

// ========== 新闻系统 ==========
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
  '八卦': { media:[-0.01, 0.05], retail:[0, 0.03] },
};

// 初始新闻（热搜榜）
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
const ASSET_TEMPLATES = [
  // ---- 房产 (estate) ----
  { id:'apt_dt', name:'市中心公寓', type:'estate', basePrice:80, volatility:0.03, trend:0.005, rarity:'common', desc:'新海市中心精装公寓一套，地段优越' },
  { id:'villa_sub', name:'郊区别墅', type:'estate', basePrice:250, volatility:0.04, trend:0.006, rarity:'uncommon', desc:'带花园的独栋别墅，潜力区域' },
  { id:'office_bld', name:'写字楼整层', type:'estate', basePrice:500, volatility:0.05, trend:0.007, rarity:'rare', desc:'CBD核心地段甲级写字楼' },
  { id:'shop_lot', name:'商业旺铺', type:'estate', basePrice:150, volatility:0.04, trend:0.004, rarity:'uncommon', desc:'商圈内的临街商铺' },
  { id:'land_plot', name:'开发地块', type:'estate', basePrice:350, volatility:0.08, trend:0.01, rarity:'rare', desc:'待开发的建设用地，升值空间大' },
  { id:'penthouse', name:'顶层复式', type:'estate', basePrice:800, volatility:0.06, trend:0.008, rarity:'epic', desc:'270°海景复式公寓' },
  // ---- 艺术品 (art) ----
  { id:'oil_painting', name:'当代油画', type:'art', basePrice:30, volatility:0.12, trend:0.003, rarity:'common', desc:'新锐画家的作品，有升值潜力' },
  { id:'sculpture', name:'现代雕塑', type:'art', basePrice:60, volatility:0.10, trend:0.002, rarity:'uncommon', desc:'知名艺术家的限量雕塑' },
  { id:'ink_painting', name:'名家水墨', type:'art', basePrice:200, volatility:0.08, trend:0.008, rarity:'rare', desc:'已故名家的真迹水墨画' },
  { id:'calligraphy', name:'书法珍品', type:'art', basePrice:120, volatility:0.09, trend:0.006, rarity:'rare', desc:'书法大师的传世之作' },
  { id:'digital_art', name:'数字藏品', type:'art', basePrice:15, volatility:0.20, trend:0.001, rarity:'common', desc:'NFT数字艺术品，波动极大' },
  { id:'masterpiece', name:'油画巨作', type:'art', basePrice:600, volatility:0.06, trend:0.01, rarity:'epic', desc:'国际拍卖行认证的大师级油画' },
  // ---- 珠宝 (jewelry) ----
  { id:'gold_watch', name:'限量腕表', type:'jewelry', basePrice:40, volatility:0.05, trend:0.004, rarity:'common', desc:'瑞士限量机械腕表' },
  { id:'diamond_ring', name:'钻戒', type:'jewelry', basePrice:90, volatility:0.06, trend:0.003, rarity:'uncommon', desc:'3克拉D色钻戒' },
  { id:'jade_bracelet', name:'翡翠手镯', type:'jewelry', basePrice:180, volatility:0.07, trend:0.006, rarity:'rare', desc:'老坑冰种翡翠手镯' },
  { id:'pearl_necklace', name:'珍珠项链', type:'jewelry', basePrice:55, volatility:0.04, trend:0.002, rarity:'uncommon', desc:'南海珍珠项链，光泽润美' },
  { id:'crown_jewel', name:'传世皇冠', type:'jewelry', basePrice:450, volatility:0.08, trend:0.009, rarity:'epic', desc:'欧洲皇室流传下来的珠宝皇冠' },
  // ---- 古董 (antique) ----
  { id:'porcelain', name:'青花瓷瓶', type:'antique', basePrice:100, volatility:0.06, trend:0.007, rarity:'rare', desc:'明清时期的青花瓷精品' },
  { id:'bronze', name:'青铜器', type:'antique', basePrice:300, volatility:0.05, trend:0.008, rarity:'epic', desc:'战国时期青铜礼器' },
  { id:'wood_furniture', name:'紫檀家具', type:'antique', basePrice:160, volatility:0.05, trend:0.005, rarity:'rare', desc:'清代紫檀木家具套件' },
  { id:'ancient_coin', name:'古钱币套装', type:'antique', basePrice:25, volatility:0.08, trend:0.003, rarity:'uncommon', desc:'历代古钱币收藏套装' },
  { id:'tea_set', name:'紫砂壶', type:'antique', basePrice:50, volatility:0.07, trend:0.004, rarity:'uncommon', desc:'名家制作的紫砂茶壶' },
  // ---- 股权 (equity) ----
  { id:'startup_share', name:'创业公司股权', type:'equity', basePrice:20, volatility:0.18, trend:0.002, rarity:'common', desc:'初创科技公司的原始股，高风险高回报' },
  { id:'fund_lp', name:'私募LP份额', type:'equity', basePrice:200, volatility:0.10, trend:0.006, rarity:'rare', desc:'顶级私募基金的LP份额' },
  { id:'branch_share', name:'连锁品牌股份', type:'equity', basePrice:120, volatility:0.08, trend:0.005, rarity:'uncommon', desc:'区域性连锁品牌的少数股权' },
  { id:'mine_right', name:'矿产开采权', type:'equity', basePrice:350, volatility:0.12, trend:0.007, rarity:'epic', desc:'稀有矿产的独家开采权' },
];


