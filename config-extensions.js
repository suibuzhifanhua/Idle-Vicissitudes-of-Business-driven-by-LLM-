// ==================================================
// config-extensions.js - 新增经营系统的可调参数
// 这些数值会进入新模块，不修改既有业务、贷款和股票常数。
// ==================================================
const EXTENSION_CONFIG = {
  CAMPAIGN: {
    LEAD_TICKS: 6,
    ACTIVE_TICKS: 24,
    PLAN_COST_RATIOS: { stock: 0.08, marketing: 0.05, staffing: 0.03 },
    RESULT_TICKS: 12,
  },
  FAVOR_DEBT: {
    MAX_PER_NPC: 2,
    EARN_THRESHOLD: 8,
    DUE_TICKS: 30,
    DEFAULT_BREACH_FAVOR: -18,
  },
  RIVAL_TELEGRAPH: {
    LOOKAHEAD_TICKS: 3,
    INTEL_COST_BASE: 120000,
    INTEL_COST_SCALE: 0.0006,
    COUNTER_COST_BASE: 180000,
  },
  CONTRACT: {
    OFFER_COUNT: 3,
    INTERVAL_TICKS: 48,
    EXPIRE_TICKS: 18,
    ACTIVE_LIMIT: 4,
    PREPAY_RATIOS: [0.10, 0.20, 0.35],
    DURATION_TICKS: [60, 120, 240],
    VOLUME_TICKS: [10, 20, 40],
    PENALTY_RATIOS: [0.05, 0.10, 0.18],
  },
  PRODUCT: {
    RESEARCH_TICKS: 12,
    PRICE_BANDS: { budget: 0.82, balanced: 1.0, premium: 1.28 },
    POSITION_EFFECTS: {
      value: { share: 1.14, brand: 0.88, margin: 0.90, research: 0.80 },
      premium: { share: 0.78, brand: 1.32, margin: 1.36, research: 1.10 },
      technology: { share: 0.96, brand: 1.08, margin: 1.08, research: 1.55 },
    },
  },
  SUPPLY_GROUPS: {
    ACTIVE_LIMIT: 2,
    ALLOC_STEP: 10,
    SAFETY_STOCK_MAX_TICKS: 24,
    INVENTORY_UNIT: 25000,
  },
  CHARTER: {
    CYCLE_TICKS: 72,
    REPORT_LIMIT: 12,
    CHARTERS: {
      cashCow: { dividend: 0.45, reinvest: 0.15, risk: 0.18 },
      growth: { dividend: 0.12, reinvest: 0.55, risk: 0.62 },
      research: { dividend: 0.20, reinvest: 0.30, risk: 0.38 },
      balanced: { dividend: 0.28, reinvest: 0.32, risk: 0.34 },
    },
  },
  BOARD: {
    TERMS: [168, 336],
    GOAL_LIMIT: 2,
    TABOO_LIMIT: 1,
    CONFIDENCE_MIN: 0,
    CONFIDENCE_MAX: 100,
    ENABLED_BY_DEFAULT: false,
  },
  TODO: {
    WARNING_TICKS: 8,
    CRITICAL_TICKS: 3,
    LIMIT: 24,
  },
  DECISION_REVIEW: {
    SNAPSHOTS: [6, 12],
    LIMIT: 30,
  },
  AUTO_SIM: {
    LOOKAHEAD_TICKS: 10,
    CASH_RESERVE_MULTIPLIER: 8,
  },
  LLM_TEMPLATE: {
    SCHEMA_VERSION: 1,
    MAX_PARAMETERS: 12,
    CONFIDENCE_FLOOR: 0.18,
  },
};

// 每个系统只允许选择已注册模板，LLM 不能自行发明结算字段。
const EXTENSION_TEMPLATES = {
  campaignPlans: [
    { id: 'stock_lock', label: '备货锁价', target: 'supply' },
    { id: 'marketing_push', label: '营销冲量', target: 'brand' },
    { id: 'elastic_staffing', label: '弹性排班', target: 'employees' },
  ],
  favorRequests: [
    { id: 'bank_refinance', npc: 'jinhangzhang', target: 'loan' },
    { id: 'journalist_intel', npc: 'majizhe', target: 'rival' },
    { id: 'headhunter_shield', npc: 'sujie', target: 'employee' },
    { id: 'group_supplier', npc: 'chenzong', target: 'supply' },
  ],
  rivalIntents: [
    { id: 'poach_star', label: '高薪挖角', target: 'employee' },
    { id: 'price_offensive', label: '区域价格战', target: 'market' },
  ],
  contractArchetypes: [
    { id: 'steady_low_margin', label: '稳定长单', margin: 0.78, reliability: 1.16 },
    { id: 'high_risk_spot', label: '现货高毛利', margin: 1.34, reliability: 0.72 },
    { id: 'strategic_anchor', label: '战略锚定客户', margin: 0.92, reliability: 1.24 },
  ],
  productSegments: [
    { id: 'value', label: '性价比' },
    { id: 'premium', label: '高端品牌' },
    { id: 'technology', label: '技术领先' },
  ],
  supplierArchetypes: [
    { id: 'low_cost_local', label: '低价本地', price: 0.84, leadTime: 1, stability: 0.72 },
    { id: 'regional_stable', label: '区域稳定', price: 1.08, leadTime: 2, stability: 1.32 },
    { id: 'quality_premium', label: '优质供应商', price: 1.26, leadTime: 2, stability: 1.48 },
  ],
  boardDirectors: [
    { id: 'operator', label: '运营董事' },
    { id: 'technologist', label: '技术董事' },
    { id: 'capital', label: '资本董事' },
    { id: 'risk', label: '风控董事' },
  ],
};

// 顶层 const 不会自动成为 window 属性；跨脚本使用显式挂载。
window.EXTENSION_CONFIG = EXTENSION_CONFIG;
window.EXTENSION_TEMPLATES = EXTENSION_TEMPLATES;
