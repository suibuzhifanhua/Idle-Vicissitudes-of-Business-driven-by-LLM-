// ===================================================
// core-finance.js — 年度财报系统：财报生成、检查点、股价联动
// 从 core.js 拆分：通过 SGame 全局对象访问共享状态
// ===================================================
(function() {
  var S = window.SGame;
  // G 代理：所有 G.xxx 读写透明转发到 S.G
  var G = new Proxy({}, {
    get: function(_, k) { var g = S.G; return g ? g[k] : undefined; },
    set: function(_, k, v) { var g = S.G; if (g) { g[k] = v; } return true; },
    has: function(_, k) { var g = S.G; return g ? k in g : false; }
  });
  var addLog = function() { return S.addLog.apply(S, arguments); };
  var _formatMoney = function(v) { return S.formatMoney(v); };

  // ========== 年度财报 ==========
  function _countActiveBusinesses() {
    if (!G.businesses) return 0;
    return Object.values(G.businesses).filter(function(b) { return b && b.level > 0; }).length;
  }

  function _calcStockTotalValue() {
    if (!G.stocks || G.stockPrices == null) return 0;
    var total = 0;
    Object.keys(G.stocks).forEach(function(sym) {
      var shares = G.stocks[sym] || 0;
      var price = G.stockPrices[sym] || 0;
      if (shares > 0) total += shares * price;
    });
    return total;
  }

  function _checkAnnualReport() {
    if (!G._annualCheckpoint) {
      G._annualCheckpoint = { tick: G.tickCount, money: G.money, employees: G.employees ? G.employees.length : 0, businesses: _countActiveBusinesses(), totalIncomeEarned: G.totalIncomeEarned || 0, totalExpense: G.totalExpense || 0 };
      return;
    }
    var elapsed = G.tickCount - G._annualCheckpoint.tick;
    if (elapsed < 365) return;

    var cp = G._annualCheckpoint;
    var report = {
      id: (G.financialReports ? G.financialReports.length : 0) + 1,
      startTick: cp.tick,
      endTick: G.tickCount,
      startMoney: cp.money,
      endMoney: G.money,
      totalRevenue: (G.totalIncomeEarned || 0) - (cp.totalIncomeEarned || 0),
      totalExpenses: (G.totalExpense || 0) - (cp.totalExpense || 0),
      netProfit: ((G.totalIncomeEarned || 0) - (cp.totalIncomeEarned || 0)) - ((G.totalExpense || 0) - (cp.totalExpense || 0)),
      startEmployees: cp.employees,
      endEmployees: G.employees ? G.employees.length : 0,
      startBusinesses: cp.businesses,
      endBusinesses: _countActiveBusinesses(),
      totalAssets: G.assets ? G.assets.length : 0,
      stockValue: _calcStockTotalValue(),
      reputation: G.reputation || 0,
      stress: G.stress || 0,
      economicState: G.economicState || 'stable',
      rank: G.rank || '未知',
      generatedAt: Date.now()
    };
    if (!G.financialReports) G.financialReports = [];
    G.financialReports.push(report);

    // 重置检查点
    G._annualCheckpoint = {
      tick: G.tickCount,
      money: G.money,
      employees: G.employees ? G.employees.length : 0,
      businesses: _countActiveBusinesses(),
      totalIncomeEarned: G.totalIncomeEarned || 0,
      totalExpense: G.totalExpense || 0
    };

    // 日志提示
    if (typeof addLog === 'function') {
      var netStr = report.netProfit >= 0 ? '+' + S.formatMoney(report.netProfit) : '-' + S.formatMoney(-report.netProfit);
      S.addLog('📊 第 ' + report.id + ' 年财报已生成 | 净利润: ' + netStr + ' | 排名: ' + report.rank);
    }
    // Toast 提示
    if (typeof UI !== 'undefined' && UI.showToast) {
      UI.showToast('📊', '年度财报', '第 ' + report.id + ' 年度财报已生成，点击"财报"面板查看');
    }
    // 财报 → 市场/股价/声望联动
    _applyFinancialReportImpact(report);
  }

  // ========== 财报联动：市场情绪 / 股价 / 声望 ==========
  function _applyFinancialReportImpact(report) {
    var revenue = report.totalRevenue || 0;
    var netProfit = report.netProfit || 0;
    var profitMargin = (revenue > 0) ? netProfit / revenue : 0;

    // ---- 1. 市场情绪联动 ----
    var sentimentDelta = 0;
    if (netProfit > 0 && revenue > 0) {
      sentimentDelta = Math.round(Math.min(8, 2 + profitMargin * 20));
    } else if (netProfit < 0) {
      var lossRatio = revenue > 0 ? Math.abs(netProfit) / revenue : 0.3;
      sentimentDelta = -Math.round(Math.min(8, 3 + lossRatio * 15));
    }
    if (sentimentDelta !== 0) {
      G.marketSentiment = Math.min(100, Math.max(0, (G.marketSentiment || 50) + sentimentDelta));
    }

    // ---- 2. 股价联动 ----
    if (typeof STOCKS !== 'undefined' && G.stockPrices) {
      var stockShock = 0;
      if (profitMargin > 0.20) {
        stockShock = Math.min(0.08, profitMargin * 0.30);
      } else if (profitMargin > 0.05) {
        stockShock = profitMargin * 0.25;
      } else if (profitMargin > 0) {
        stockShock = profitMargin * 0.10;
      } else if (netProfit < 0) {
        stockShock = Math.max(-0.06, profitMargin * 0.40);
      }
      if (stockShock !== 0) {
        Object.keys(STOCKS).forEach(function(sid) {
          if (G.stockPrices[sid]) {
            var oldPrice = G.stockPrices[sid];
            var newPrice = parseFloat((oldPrice * (1 + stockShock)).toFixed(2));
            G.stockPrices[sid] = Math.max(1, newPrice);
            G.stockChangeLog[sid] = parseFloat((stockShock * 100).toFixed(2));
          }
        });
      }
    }

    // ---- 3. 声望联动 ----
    var repDelta = 0;
    if (profitMargin > 0.20) repDelta = 3;
    else if (profitMargin > 0.10) repDelta = 2;
    else if (profitMargin > 0.05) repDelta = 1;
    else if (netProfit < 0 && profitMargin < -0.15) repDelta = -2;
    else if (netProfit < 0) repDelta = -1;
    if (repDelta !== 0) {
      G.reputation = Math.min(200, Math.max(0, (G.reputation || 0) + repDelta));
    }

    // ---- 4. 事件日志 ----
    var parts = [];
    if (netProfit > 0) {
      parts.push('净利润 +' + S.formatMoney(netProfit));
      if (profitMargin > 0.20) parts.push('远超市场预期，投资者信心大增');
      else if (profitMargin > 0.10) parts.push('表现强劲，市场反应积极');
      else if (profitMargin > 0.05) parts.push('符合预期，市场反应平稳');
    } else if (netProfit < 0) {
      parts.push('净亏损 -' + S.formatMoney(-netProfit));
      parts.push('市场担忧情绪上升');
    }
    var sign = sentimentDelta >= 0 ? '↑' : '↓';
    if (sentimentDelta !== 0) parts.push('市场情绪 ' + sign + Math.abs(sentimentDelta));
    if (repDelta > 0) parts.push('声望 +' + repDelta);
    else if (repDelta < 0) parts.push('声望 ' + repDelta);
    if (typeof addLog === 'function') S.addLog('📊 年度财报发布 | ' + parts.join(' | '));

    // ---- 5. UI 脏标记 ----
    if (typeof UI !== 'undefined' && UI.markDirty) {
      UI.markDirty('dashboard');
      UI.markDirty('charts');
    }
  }

  function _repairAnnualCheckpoint() {
    if (!G._annualCheckpoint || G._annualCheckpoint.tick == null) {
      G._annualCheckpoint = {
        tick: G.tickCount,
        money: G.money,
        employees: G.employees ? G.employees.length : 0,
        businesses: _countActiveBusinesses(),
        totalIncomeEarned: G.totalIncomeEarned || 0,
        totalExpense: G.totalExpense || 0
      };
    }
  }

  // ========== 挂载到 SGame ==========
  S._countActiveBusinesses = _countActiveBusinesses;
  S._calcStockTotalValue = _calcStockTotalValue;
  S._checkAnnualReport = _checkAnnualReport;
  S._applyFinancialReportImpact = _applyFinancialReportImpact;
  S._repairAnnualCheckpoint = _repairAnnualCheckpoint;
})();
