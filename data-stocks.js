// ==================================================
// data-stocks.js — 股票市场定义（深化版）
// ==================================================

// ========== 股票市场（12只，4行业板块联动） ==========
var STOCKS = {
  // ---- 科技板块 ----
  stk_tech:      { name:'星辰科技',   sector:'科技', basePrice:25, volatility:0.15, actUnlock:1 },
  stk_ai:        { name:'深脑科技',   sector:'科技', basePrice:60, volatility:0.22, actUnlock:2 },
  stk_semi:      { name:'华芯半导体', sector:'科技', basePrice:45, volatility:0.18, actUnlock:2 },
  // ---- 金融板块 ----
  stk_bank:      { name:'新海银行',   sector:'金融', basePrice:45, volatility:0.08, actUnlock:1 },
  stk_insurance: { name:'安泰保险',   sector:'金融', basePrice:30, volatility:0.10, actUnlock:1 },
  stk_fund:      { name:'景顺资管',   sector:'金融', basePrice:55, volatility:0.12, actUnlock:2 },
  // ---- 消费板块 ----
  stk_retail:    { name:'万客隆',     sector:'消费', basePrice:18, volatility:0.12, actUnlock:0 },
  stk_food:      { name:'味鲜达',     sector:'消费', basePrice:15, volatility:0.11, actUnlock:0 },
  stk_luxury:    { name:'恒耀奢品',   sector:'消费', basePrice:80, volatility:0.14, actUnlock:3 },
  // ---- 能源/工业板块 ----
  stk_energy:    { name:'绿能控股',   sector:'能源', basePrice:32, volatility:0.18, actUnlock:1 },
  stk_estate:    { name:'金地集团',   sector:'地产', basePrice:55, volatility:0.10, actUnlock:1 },
  stk_media:     { name:'光线传媒',   sector:'媒体', basePrice:22, volatility:0.14, actUnlock:2 },
}

// ========== 行业联动矩阵（同板块涨跌联动概率） ==========
var STOCK_SECTOR_CORR = {
  '科技': 0.35,  // 科技股联动性强
  '金融': 0.25,
  '消费': 0.20,
  '能源': 0.30,
  '地产': 0.20,
  '媒体': 0.15,
};

// ========== 做空机制 ==========
var SHORT_SELL_CONFIG = {
  enabled: true,
  marginRate: 0.30,     // 做空保证金比例 30%
  maxLossRate: 0.50,    // 最大亏损比例 50% 自动平仓
  feeRate: 0.02,        // 做空手续费 2%
  interestPerTick: 0.005, // 每Tick借股利息 0.5%
};
