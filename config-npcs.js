// Author: Fisheep.L
// Auto-split from config.js by File Agent

// ---- EMP_ROLES ----
// ---- 员工角色 ----
const EMP_ROLES = [
  { id:'intern',       name:'实习生',   baseSalary:0.10, icon:'🎓', effect:'实习期后可转正为正式员工',                       req:null, incomeBonus:0.005, internConvertTo:['developer','sales','analyst','designer','marketer','hr','finance_emp'], specialization:null },
  { id:'developer',    name:'开发者',   baseSalary:0.80, icon:'💻', effect:'科技+15%',                                   req:{ business:'tech' }, incomeBonus:0.008, specialization:[{ key:'product_innov', name:'产品创新', desc:'自研产品收入倍率', costBase:30000, incomeMultPerLv:0.04, maxLv:5 },{ key:'tech_optim', name:'技术优化', desc:'整体技术产出效率', costBase:25000, incomeMultPerLv:0.03, maxLv:5 },{ key:'devops', name:'DevOps', desc:'部署效率+系统稳定性', costBase:28000, incomeMultPerLv:0.025, maxLv:5 }] },
  { id:'designer',     name:'设计师',   baseSalary:0.30, icon:'🎨', effect:'媒体/零售+10%',                                req:null, incomeBonus:0.005, specialization:[{ key:'brand_design', name:'品牌设计', desc:'零售/媒体收入倍率', costBase:20000, incomeMultPerLv:0.035, maxLv:5 },{ key:'ux_exp', name:'UX体验', desc:'科技产品口碑加成', costBase:18000, incomeMultPerLv:0.03, maxLv:5 }] },
  { id:'sales',        name:'销售',     baseSalary:0.60, icon:'🤝', effect:'零售/合作+20%，人脉+2/月',                     req:null, incomeBonus:0.008, specialization:[{ key:'key_account', name:'大客户开发', desc:'大客户合约收入倍率', costBase:35000, incomeMultPerLv:0.05, maxLv:5 },{ key:'channel_mgmt', name:'渠道管理', desc:'全渠道分销效率', costBase:25000, incomeMultPerLv:0.035, maxLv:5 },{ key:'biz_dev', name:'商务拓展', desc:'新业务开拓速度', costBase:30000, incomeMultPerLv:0.03, maxLv:5 }] },
  { id:'analyst',      name:'分析师',   baseSalary:0.40, icon:'📊', effect:'负面事件-3%/人',                                 req:null, incomeBonus:0.005, specialization:[{ key:'market_analysis', name:'市场分析', desc:'市场事件预警+收入预测', costBase:28000, incomeMultPerLv:0.035, maxLv:5 },{ key:'risk_assess', name:'风险评估', desc:'负面事件伤害减免', costBase:30000, incomeMultPerLv:0.03, maxLv:5 }] },
  { id:'manager',      name:'管理者',   baseSalary:0.80, icon:'📋', effect:'分配业务+30%，忠诚衰减-50%',                   req:{ empCount:5 }, incomeBonus:0.012, specialization:[{ key:'team_lead', name:'团队管理', desc:'团队产出效率提升', costBase:40000, incomeMultPerLv:0.04, maxLv:5 },{ key:'strategic_plan', name:'战略规划', desc:'全业务收入倍率', costBase:50000, incomeMultPerLv:0.035, maxLv:5 },{ key:'ops_mgmt', name:'运营管理', desc:'运营成本优化', costBase:35000, incomeMultPerLv:0.03, maxLv:5 }] },
  { id:'lawyer',       name:'律师',     baseSalary:0.55, icon:'⚖️', effect:'监管伤害-50%',                                 req:{ money:5000000 }, incomeBonus:0.005, specialization:[{ key:'compliance', name:'合规法务', desc:'合规成本降低', costBase:35000, incomeMultPerLv:0.03, maxLv:5 },{ key:'litigation', name:'诉讼应对', desc:'诉讼胜率提升', costBase:40000, incomeMultPerLv:0.035, maxLv:5 }] },
  { id:'hr',           name:'HR',       baseSalary:0.35, icon:'👥', effect:'忠诚衰减-50%，招聘成本-20%',                    req:null, incomeBonus:0.005, specialization:[{ key:'talent_acq', name:'人才招募', desc:'招聘质量+培训效率', costBase:22000, incomeMultPerLv:0.03, maxLv:5 },{ key:'culture_build', name:'文化建设', desc:'员工忠诚+幸福度', costBase:20000, incomeMultPerLv:0.025, maxLv:5 }] },
  { id:'finance_emp',  name:'财务',     baseSalary:0.45, icon:'💰', effect:'税务优化+5%，资金周转+10%',                      req:null, incomeBonus:0.005, specialization:[{ key:'tax_plan', name:'税务筹划', desc:'税务减免额度提升', costBase:30000, incomeMultPerLv:0.035, maxLv:5 },{ key:'fund_mgmt', name:'资金管理', desc:'闲置资金收益率', costBase:28000, incomeMultPerLv:0.03, maxLv:5 }] },
  { id:'marketer',     name:'市场',     baseSalary:0.30, icon:'📣', effect:'声誉+15%，产品发布+20%',                        req:null, incomeBonus:0.005, specialization:[{ key:'brand_mkt', name:'品牌营销', desc:'声誉增长+品牌溢价', costBase:25000, incomeMultPerLv:0.035, maxLv:5 },{ key:'digital_mkt', name:'数字营销', desc:'线上渠道转化率', costBase:22000, incomeMultPerLv:0.03, maxLv:5 }] },
  { id:'cto',          name:'CTO',      baseSalary:1.50, icon:'♟', effect:'全局科技+20%',                               req:{ techLv:5, empCount:8 }, incomeBonus:0.025, specialization:[{ key:'tech_arch', name:'技术架构', desc:'研发效率+技术壁垒', costBase:60000, incomeMultPerLv:0.05, maxLv:5 },{ key:'innov_strategy', name:'创新战略', desc:'新产品/技术突破概率', costBase:70000, incomeMultPerLv:0.04, maxLv:5 }] },
];


// ---- Salary functions ----
// ---- 实际工资计算（与资产、产业挂钩） ----
function calcActualSalary(baseSalary, G) {
  if (!baseSalary) return 0;
  if (!G || !G.businesses) return baseSalary;
  const totalAssets = G.money || 0;
  const businessCount = (() => {
    if (!G || !G.cities) return 0;
    let cnt = 0;
    Object.values(G.cities).forEach(city => {
      if (!city.unlocked || !city.businesses) return;
      Object.values(city.businesses).forEach(biz => { if (biz.level > 0) cnt++; });
    });
    return cnt;
  })();
  // 资产系数：资产超500万开始生效（原1000万），对数增长，上限1.5（原0.5）
  let assetFactor = 0;
  if (totalAssets > 5000000) {
    assetFactor = Math.log10(totalAssets / 5000000) * 0.3;
    assetFactor = Math.min(assetFactor, 1.5);
  }
  // 产业系数：每个产业+15%（原5%），上限1.5（原0.5）
  let bizFactor = Math.min(businessCount * 0.15, 1.5);
  // 人头税：员工数>8时，每多1人+5%总工资成本
  let headcountPenalty = 0;
  if (G.employees && G.employees.length > 8) {
    headcountPenalty = (G.employees.length - 8) * 0.05;
  }
  const scale = 1.0 + assetFactor + bizFactor + headcountPenalty;
  return +(baseSalary * scale).toFixed(1);
}


// ---- SKILL_TREES + EXCLUSIVE ----
// ---- 技能树 ----
const SKILL_TREES = {
  management: [
    { id:'lean_mgmt',     name:'精益管理',     desc:'运营成本 -10%',                      tier:1, cost:1, cond:{ type:'biz_upgrade', count:1 },   effect:{ opCost:0.90 } },
    { id:'target_mgmt',   name:'目标管理',     desc:'全局收入 +10%',                      tier:1, cost:1, cond:{ type:'biz_count', count:2 },      effect:{ incomeMult:1.10 } },
    { id:'crisis_mgmt',   name:'危机管理',     desc:'负面事件影响 -25%',                  tier:2, cost:2, cond:{ type:'negative_events', count:3 }, effect:{ negativeImpact:0.75 } },
    { id:'matrix_mgmt',   name:'矩阵管理',     desc:'员工上限 +5',                        tier:2, cost:2, cond:{ type:'emp_count', count:8 },       effect:{ empMaxBonus:5 } },
    { id:'change_mgmt',   name:'变革管理',     desc:'升级收益 +20%，每次升级压力 +1',      tier:3, cost:3, cond:{ type:'biz_lv', level:6 },         effect:{ upgradeBonus:1.20, stressPerUpgrade:1 } },
    // 互斥分支 E vs F
    { id:'delegation',    name:'放权赋能',     desc:'员工效率 +15%，自动托管更智能',       tier:3, cost:3, exclusive:'mgmt_e', cond:{ type:'emp_count', count:15 }, effect:{ empEfficiency:0.15, autoModeBonus:true } },
    { id:'central_ctrl',  name:'中央集权',     desc:'全局收入 +12%，决策收益 +10%',        tier:3, cost:3, exclusive:'mgmt_e', cond:{ type:'biz_lv', level:8 }, effect:{ incomeMult:1.12, decisionBonus:0.10 } },
  ],
  tech: [
    { id:'data_driven',   name:'数据驱动',     desc:'事件预测准确率 +15%',                tier:1, cost:1, cond:{ type:'has_role', role:'analyst' },      effect:{ eventPredict:1.15 } },
    { id:'tech_barrier',  name:'技术壁垒',     desc:'竞争对手模仿难度 +30%',              tier:1, cost:1, cond:{ type:'biz_lv', level:3, bizType:'tech' }, effect:{ competitorImitation:0.7 } },
    { id:'automation',    name:'自动化',       desc:'管理效率 +20%',                      tier:2, cost:2, cond:{ type:'has_role', role:'developer', count:2 }, effect:{ mgmtEfficiency:1.20 } },
    { id:'ai_empower',    name:'AI赋能',       desc:'LLM交互质量 +30%，成就奖励 +50%',     tier:2, cost:2, cond:{ type:'biz_lv', level:7, bizType:'tech' }, effect:{ llmQuality:1.3, achRewardMul:1.5 } },
    // 互斥分支 A vs B
    { id:'open_source',   name:'开源生态',     desc:'收入 +15%，但易被模仿',               tier:3, cost:3, exclusive:'tech', cond:{ type:'biz_lv', level:8, bizType:'tech' }, effect:{ incomeMult:1.15, competitorImitation:1.15 } },
    { id:'patent_wall',   name:'专利壁垒',     desc:'模仿难度 +40%，研发成本 -10%',        tier:3, cost:3, exclusive:'tech', cond:{ type:'biz_lv', level:8, bizType:'tech' }, effect:{ competitorImitation:0.6, rdBonus:0.9 } },
    // Tier4 高级技能
    { id:'deep_tech',     name:'深度技术',     desc:'科技业务收入 +20%，研发速度 +15%',     tier:4, cost:4, cond:{ type:'biz_lv', level:9, bizType:'tech' }, effect:{ techBonus:0.20, rdBonus:0.15 } },
  ],
  social: [
    { id:'biz_negotiate', name:'商务谈判',     desc:'合作收益 +25%',                      tier:1, cost:1, cond:{ type:'decision_success', count:1 },  effect:{ coopBonus:1.25 } },
    { id:'network',       name:'人脉网络',     desc:'人脉获取速度 +25%',                  tier:1, cost:1, cond:{ type:'connections', value:40 },        effect:{ connGain:1.25 } },
    { id:'crisis_pr',     name:'危机公关',     desc:'负面舆论影响 -40%',                  tier:2, cost:2, cond:{ type:'event_type', eventType:'media_crisis' }, effect:{ rumorImpact:0.6 } },
    { id:'capital_op',    name:'资本运作',     desc:'融资额度 +25%',                      tier:2, cost:2, cond:{ type:'funding', count:1 },          effect:{ fundingMult:1.25 } },
    { id:'shadow_play',   name:'幕后操盘',     desc:'全局收入 +15%',                      tier:3, cost:3, cond:{ type:'npc_favor', count:5, level:'亲密' }, effect:{ incomeMult:1.15 } },
    // 新增
    { id:'influence',     name:'影响力经济',   desc:'NPC好感获取+20%，声誉增长+15%',       tier:3, cost:3, cond:{ type:'connections', value:70 }, effect:{ favorGain:1.20, repGain:1.15 } },
  ],
  finance: [
    { id:'cost_ctrl',     name:'成本控制',     desc:'浪费支出 -15%',                      tier:1, cost:1, cond:{ type:'fire_emp', count:1 },          effect:{ wasteCost:0.85 } },
    { id:'cash_flow',     name:'现金流管理',   desc:'现金流增益（持续80回合现金不低于阈值）', tier:1, cost:1, cond:{ type:'money_never_below', duration:80 }, effect:{ cashFlowBonus:true } },
    { id:'hedge',         name:'风险对冲',     desc:'损失减免 30%',                       tier:2, cost:2, cond:{ type:'insurance' },                effect:{ lossReduce:0.7 } },
    // 互斥分支 C vs D
    { id:'leverage',      name:'杠杆运营',     desc:'收入 +20%，贷款成本 +15%',            tier:2, cost:2, exclusive:'finance', cond:{ type:'funding', count:1 }, effect:{ incomeMult:1.20, loanCost:1.15 } },
    { id:'conservative',  name:'保守经营',     desc:'运营成本 -15%，扩张速度 -10%',         tier:2, cost:2, exclusive:'finance', cond:{ type:'loans_repaid', count:2 }, effect:{ opCost:0.85, expandSpeed:0.9 } },
    { id:'capital_shark', name:'资本大鳄',     desc:'解锁IPO，融资额度 +30%',              tier:3, cost:3, cond:{ type:'money', value:500000000 },  effect:{ ipo:true, fundingMult:1.30 } },
    // 新增
    { id:'macro_cycle',   name:'周期洞察',     desc:'股票收益+20%，经济周期负面影响-25%',   tier:3, cost:3, cond:{ type:'biz_lv', level:7, bizType:'fund' }, effect:{ stockProfit:0.20, cycleImmune:0.25 } },
  ]};

// 技能互斥组（同 exclusive 的只能选一个）
const SKILL_EXCLUSIVE = {
  tech: ['open_source', 'patent_wall'],
  finance: ['leverage', 'conservative'],
  mgmt_e: ['delegation', 'central_ctrl']};


// ---- EMPLOYEE ----
const EMPLOYEE = {
  loyaltyLowThreshold: 30,
  loyaltyMidThreshold: 50,
  loyaltyPenaltyFactor: 0.5,
  fatigueHighThreshold: 60,
  fatigueImpactFactor: 0.005,
};

// ========== 配置安全访问辅助函数 ==========
// 统一处理 typeof CONFIG !== 'undefined' 检查，避免 20+ 处重复模式
function cfg(key, defaultVal) {
  if (typeof defaultVal === 'undefined') defaultVal = null;
  return (typeof CONFIG !== 'undefined' && CONFIG && CONFIG[key] !== undefined) ? CONFIG[key] : defaultVal;
}

// ========== 里程碑数据（数据驱动） ==========

