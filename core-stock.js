// ==================================================
// core-stock.js — 股票投资系统
// ==================================================

(function initCoreStock() {
  var S = window.SGame;
  if (!S) { setTimeout(initCoreStock, 10); return; }

  // 更新股价（联动市场情绪）
  S.updateStockPrices = function() {
    var G = S.G;
    if (!G) return;
    // 市场情绪影响波动偏向：情绪>60偏涨，<40偏跌
    var sent = G.marketSentiment || 50;
    var sentBias = (sent - 50) / 100; // -0.5 ~ +0.5
    Object.entries(STOCKS).forEach(function(entry) {
      var sid = entry[0], stock = entry[1];
      var baseChange = (Math.random() - 0.50) * 2 * stock.volatility;
      // 叠加情绪偏向（减少随机性影响）
      var change = baseChange * 0.7 + sentBias * stock.volatility;
      var oldPrice = G.stockPrices[sid] || stock.basePrice;
      var newPrice = Math.max(1, oldPrice * (1 + change));
      G.stockPrices[sid] = parseFloat(newPrice.toFixed(2));
      G.stockChangeLog[sid] = parseFloat((change * 100).toFixed(2));
    });
  };

  // 买入股票
  S.buyStock = function(stockId, shares) {
    var G = S.G;
    if (!G) return { ok: false, msg: '游戏未开始' };
    var stock = STOCKS[stockId];
    if (!stock) return { ok: false, msg: '未知股票' };
    if (!G.stockPrices[stockId] || G.stockPrices[stockId] <= 0) return { ok: false, msg: '股价异常' };
    var price = G.stockPrices[stockId];
    var cost = price * shares;
    if (G.money < cost) return { ok: false, msg: '资金不足（需要' + S.formatMoney(cost) + '）' };
    G.money -= cost;
    if (!G.stocks[stockId]) G.stocks[stockId] = { shares:0, avgCost:0 };
    var totalCost = G.stocks[stockId].avgCost * G.stocks[stockId].shares + cost;
    G.stocks[stockId].shares += shares;
    G.stocks[stockId].avgCost = parseFloat((totalCost / G.stocks[stockId].shares).toFixed(2));
    S.addLog('📈 买入 ' + stock.name + ' ×' + shares + '股 @' + S.formatMoney(price));
    S.save();
    return { ok: true, msg: '买入 ' + stock.name + ' ' + shares + '股' };
  };

  // 卖出股票
  S.sellStock = function(stockId, shares) {
    var G = S.G;
    if (!G) return { ok: false, msg: '游戏未开始' };
    var holding = G.stocks[stockId];
    if (!holding || holding.shares <= 0) return { ok: false, msg: '未持有该股票' };
    if (shares > holding.shares) return { ok: false, msg: '持股不足（持有' + holding.shares + '股）' };
    var price = G.stockPrices[stockId] || STOCKS[stockId].basePrice;
    var revenue = price * shares;
    var costBasis = holding.avgCost * shares;
    var profit = revenue - costBasis;
    G.money += revenue;
    G.stockProfitTotal = (G.stockProfitTotal || 0) + profit;
    holding.shares -= shares;
    if (holding.shares <= 0) delete G.stocks[stockId];
    var sign = profit >= 0 ? '📈' : '📉';
    S.addLog(sign + ' 卖出 ' + STOCKS[stockId].name + ' ×' + shares + '股 @' + S.formatMoney(price) + ' 盈亏 ' + S.formatMoney(profit));
    S.save();
    return { ok: true, msg: '卖出 ' + STOCKS[stockId].name + ' ' + shares + '股', profit: profit };
  };

  // 股票持仓市值
  S.getStockPortfolioValue = function() {
    var G = S.G;
    if (!G) return 0;
    var total = 0;
    Object.entries(G.stocks).forEach(function(entry) {
      var sid = entry[0], holding = entry[1];
      var price = G.stockPrices[sid] || STOCKS[sid].basePrice;
      total += price * holding.shares;
    });
    return total;
  };

  // 股票成本基础
  S.getStockCostBasis = function() {
    var G = S.G;
    if (!G) return 0;
    var total = 0;
    Object.values(G.stocks).forEach(function(h) { total += h.avgCost * h.shares; });
    return total;
  };
})();
