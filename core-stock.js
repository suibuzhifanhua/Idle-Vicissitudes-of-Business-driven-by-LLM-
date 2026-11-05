// Author: Fisheep.L
// ===================================================
// core-stock.js — 股票投资系统：现货多空 + 板块联动
// ===================================================

(function initCoreStock() {
  var S = window.SGame;
  if (!S) { setTimeout(initCoreStock, 10); return; }

  // ========== 内部工具 ==========
  function _priceOf(G, sid) {
    return (G.stockPrices && G.stockPrices[sid]) || STOCKS[sid].basePrice;
  }

  function _shortPosition(G, sid) {
    return (G.shortPositions && G.shortPositions[sid]) || null;
  }

  // 空头未实现盈亏：开仓价与现价之差 × 股数（价格下跌为盈利）
  function _shortUnrealizedPnL(G, sid) {
    var pos = _shortPosition(G, sid);
    if (!pos) return 0;
    return (pos.entryPrice - _priceOf(G, sid)) * pos.shares;
  }

  // ========== 更新股价（联动市场情绪 + 板块相关性） ==========
  S.updateStockPrices = function() {
    var G = S.G;
    if (!G) return;
    // 市场情绪影响波动偏向：情绪>60偏涨，<40偏跌
    var sent = G.marketSentiment || 50;
    var sentBias = (sent - 50) / 100; // -0.5 ~ +0.5

    // 第一遍：情绪驱动的单只基础涨跌幅，并汇总各板块均值
    var baseChanges = {};
    var sectorSum = {};
    var sectorCount = {};
    Object.entries(STOCKS).forEach(function(entry) {
      var sid = entry[0], stock = entry[1];
      var rawChange = (Math.random() - 0.50) * 2 * stock.volatility;
      // 乘法方向偏向模型：情绪偏多时乘以上涨因子，偏空时乘以下跌因子
      var directionBias = 1.0;
      if (sentBias > 0) { directionBias = 1.0 + sentBias * 0.5; }
      else if (sentBias < 0) { directionBias = 1.0 + sentBias * 0.8; }
      var ch = rawChange * 0.7 * directionBias;
      baseChanges[sid] = ch;
      var sec = stock.sector;
      sectorSum[sec] = (sectorSum[sec] || 0) + ch;
      sectorCount[sec] = (sectorCount[sec] || 0) + 1;
    });

    // 第二遍：叠加板块联动项（同板块其余成员的平均涨跌 × 相关系数）
    var pricesChanged = false;
    Object.entries(STOCKS).forEach(function(entry) {
      var sid = entry[0], stock = entry[1];
      var sec = stock.sector;
      var corr = (typeof STOCK_SECTOR_CORR !== 'undefined' && STOCK_SECTOR_CORR[sec]) || 0;
      var peerChange = sectorCount[sec] > 1
        ? (sectorSum[sec] - baseChanges[sid]) / (sectorCount[sec] - 1)
        : 0;
      var change = baseChanges[sid] + peerChange * corr;
      var oldPrice = _priceOf(G, sid);
      var newPrice = Math.max(1, oldPrice * (1 + change));
      if (G.stockPrices[sid] !== newPrice) pricesChanged = true;
      G.stockPrices[sid] = parseFloat(newPrice.toFixed(2));
      G.stockChangeLog[sid] = parseFloat((change * 100).toFixed(2));
    });

    // 空头利息与强平由 tickEvents 每Tick 驱动（SHORT_SELL_CONFIG 定义为每Tick计息）

    // 股价变动后标记仪表盘为脏，确保 UI 实时刷新
    if (pricesChanged && typeof UI !== 'undefined' && UI.markDirty) {
      UI.markDirty('dashboard');
    }
  };

  // ========== 买入股票（多头） ==========
  S.buyStock = function(stockId, shares) {
    var G = S.G;
    if (!G) return { ok: false, msg: '游戏未开始' };
    var stock = STOCKS[stockId];
    if (!stock) return { ok: false, msg: '未知股票' };
    if (!G.stockPrices[stockId] || G.stockPrices[stockId] <= 0) return { ok: false, msg: '股价异常' };
    var price = G.stockPrices[stockId];
    var cost = price * shares;
    if (G.money < cost) return { ok: false, msg: '资金不足（需要' + S.formatMoney(cost) + '）' };
    // 单股持仓上限：不超过总资产的50%
    var totalAssets = G.money + (typeof S.getStockPortfolioValue === 'function' ? S.getStockPortfolioValue() : 0);
    var existingValue = (G.stocks[stockId] ? G.stocks[stockId].shares : 0) * price;
    var newPositionValue = existingValue + cost;
    if (newPositionValue > totalAssets * 0.5) {
      return { ok: false, msg: '单股持仓不能超过总资产的50%（当前持仓' + S.formatMoney(existingValue) + '，买入后将达' + S.formatMoney(newPositionValue) + '）' };
    }
    G.money -= cost;
    if (!G.stocks[stockId]) G.stocks[stockId] = { shares:0, avgCost:0 };
    var totalCost = G.stocks[stockId].avgCost * G.stocks[stockId].shares + cost;
    G.stocks[stockId].shares += shares;
    G.stocks[stockId].avgCost = parseFloat((totalCost / G.stocks[stockId].shares).toFixed(2));
    S.addLog('📈 买入 ' + stock.name + ' ×' + shares + '股 @' + S.formatMoney(price));
    S.save();
    return { ok: true, msg: '买入 ' + stock.name + ' ' + shares + '股' };
  };

  // ========== 卖出股票（平多） ==========
  S.sellStock = function(stockId, shares) {
    var G = S.G;
    if (!G) return { ok: false, msg: '游戏未开始' };
    var holding = G.stocks[stockId];
    if (!holding || holding.shares <= 0) return { ok: false, msg: '未持有该股票' };
    if (shares > holding.shares) return { ok: false, msg: '持股不足（持有' + holding.shares + '股）' };
    var price = _priceOf(G, stockId);
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

  // ========== 做空：借入并卖出，价格下跌时获利 ==========
  // 现金占用 = 保证金（市值 × marginRate）+ 手续费（市值 × feeRate）
  S.openShort = function(stockId, shares) {
    var G = S.G;
    if (!G) return { ok: false, msg: '游戏未开始' };
    var cfg = (typeof SHORT_SELL_CONFIG !== 'undefined') ? SHORT_SELL_CONFIG : null;
    if (!cfg || !cfg.enabled) return { ok: false, msg: '做空功能未开放' };
    var stock = STOCKS[stockId];
    if (!stock) return { ok: false, msg: '未知股票' };
    if (!(G.stockPrices[stockId] > 0)) return { ok: false, msg: '股价异常' };
    if (!(shares > 0)) return { ok: false, msg: '数量必须为正' };

    var price = _priceOf(G, stockId);
    var gross = price * shares;
    var margin = gross * cfg.marginRate;
    var fee = gross * cfg.feeRate;
    var need = margin + fee;
    if (G.money < need) {
      return { ok: false, msg: '保证金不足（需要' + S.formatMoney(need) + '，含手续费' + S.formatMoney(fee) + '）' };
    }

    // 总敞口限制：空头市值不得超过总资产 × SHORT_EXPOSURE_MAX_RATIO
    var exposureCap = (G.money + S.getStockPortfolioValue() + S.getShortBookValue()) * CONFIG.SHORT_EXPOSURE_MAX_RATIO;
    var currentExposure = S.getShortExposure();
    if (currentExposure + gross > exposureCap) {
      return { ok: false, msg: '超出空头敞口上限（总资产' + Math.round(CONFIG.SHORT_EXPOSURE_MAX_RATIO * 100) + '%，当前已用' + S.formatMoney(currentExposure) + '）' };
    }

    G.money -= need;
    if (!G.shortPositions) G.shortPositions = {};
    var pos = G.shortPositions[stockId];
    if (pos) {
      // 加仓：加权平均开仓价，保证金累加
      var totalShares = pos.shares + shares;
      pos.entryPrice = parseFloat(((pos.entryPrice * pos.shares + price * shares) / totalShares).toFixed(2));
      pos.shares = totalShares;
      pos.margin = parseFloat((pos.margin + margin).toFixed(2));
    } else {
      G.shortPositions[stockId] = {
        shares: shares,
        entryPrice: parseFloat(price.toFixed(2)),
        margin: parseFloat(margin.toFixed(2)),
        openTick: G.tickCount
      };
    }
    S.addLog('📉 做空 ' + stock.name + ' ×' + shares + '股 @' + S.formatMoney(price) + '（占用保证金' + S.formatMoney(need) + '）');
    if (typeof UI !== 'undefined' && UI.markDirty) UI.markDirty('dashboard');
    S.save();
    return { ok: true, msg: '做空 ' + stock.name + ' ' + shares + '股' };
  };

  // ========== 平仓：买回股票归还，结清保证金与盈亏 ==========
  S.coverShort = function(stockId, shares, isForced) {
    var G = S.G;
    if (!G) return { ok: false, msg: '游戏未开始' };
    var pos = _shortPosition(G, stockId);
    if (!pos) return { ok: false, msg: '没有该股票的空头仓位' };
    if (shares > pos.shares) shares = pos.shares;
    var stock = STOCKS[stockId];
    var price = _priceOf(G, stockId);
    var ratio = shares / pos.shares;
    var pnl = (pos.entryPrice - price) * shares;
    var releasedMargin = pos.margin * ratio;
    // 亏损先吃保证金，最多亏光这笔保证金（券已还，不再追缴）
    var cashBack = Math.max(0, releasedMargin + pnl);

    G.money += cashBack;
    G.shortProfitTotal = (G.shortProfitTotal || 0) + pnl;
    pos.margin = parseFloat((pos.margin - releasedMargin).toFixed(2));
    pos.shares -= shares;
    if (pos.shares <= 0) { delete G.shortPositions[stockId]; pos = null; }

    var sign = pnl >= 0 ? '📉' : '📈';
    S.addLog(sign + ' ' + (isForced ? '强制平仓 ' : '平仓 ') + stock.name + ' 空头 ×' + shares +
      '股 @' + S.formatMoney(price) + ' 盈亏 ' + S.formatMoney(pnl) + '，收回' + S.formatMoney(cashBack));
    if (typeof UI !== 'undefined' && UI.markDirty) UI.markDirty('dashboard');
    if (!isForced) S.save();
    return { ok: true, msg: '平仓 ' + stock.name + ' 空头 ' + shares + '股', profit: pnl };
  };

  // ========== 每Tick 结算：借券利息 + 亏损达上限强制平仓 ==========
  S.processShortPositions = function() {
    var G = S.G;
    if (!G || !G.shortPositions) return;
    var cfg = (typeof SHORT_SELL_CONFIG !== 'undefined') ? SHORT_SELL_CONFIG : null;
    if (!cfg) return;
    Object.keys(G.shortPositions).forEach(function(sid) {
      var pos = G.shortPositions[sid];
      if (!pos || pos.shares <= 0) { delete G.shortPositions[sid]; return; }
      var price = _priceOf(G, sid);
      var gross = price * pos.shares;
      // 借券利息按当前市值计提，直接侵蚀保证金
      if (cfg.interestPerTick) {
        pos.margin = parseFloat((pos.margin - gross * cfg.interestPerTick).toFixed(2));
      }
      // 浮亏达到开仓市值的 maxLossRate → 强制平仓
      var entryGross = pos.entryPrice * pos.shares;
      var unrealized = (pos.entryPrice - price) * pos.shares;
      if (unrealized < 0 && -unrealized >= entryGross * cfg.maxLossRate) {
        S.addLog('⚠️ ' + STOCKS[sid].name + ' 空头亏损触及强平线，券商强制平仓。');
        S.coverShort(sid, pos.shares, true);
        return;
      }
      // 保证金被利息耗尽 → 同样强平
      if (pos.margin <= 0) {
        S.addLog('⚠️ ' + STOCKS[sid].name + ' 空头保证金被借券利息耗尽，券商强制平仓。');
        pos.margin = 0;
        S.coverShort(sid, pos.shares, true);
      }
    });
  };

  // ========== 多头持仓市值 ==========
  S.getStockPortfolioValue = function() {
    var G = S.G;
    if (!G) return 0;
    var total = 0;
    Object.entries(G.stocks).forEach(function(entry) {
      var sid = entry[0], holding = entry[1];
      total += _priceOf(G, sid) * holding.shares;
    });
    return total;
  };

  // ========== 空头相关统计 ==========
  S.getShortExposure = function() {
    var G = S.G;
    if (!G || !G.shortPositions) return 0;
    var total = 0;
    Object.entries(G.shortPositions).forEach(function(entry) {
      total += _priceOf(G, entry[0]) * entry[1].shares;
    });
    return total;
  };

  // 空头账面价值 = 锁定的保证金 + 未实现盈亏
  S.getShortBookValue = function() {
    var G = S.G;
    if (!G || !G.shortPositions) return 0;
    var total = 0;
    Object.entries(G.shortPositions).forEach(function(entry) {
      total += entry[1].margin + _shortUnrealizedPnL(G, entry[0]);
    });
    return total;
  };

  S.getShortPosition = function(stockId) {
    var G = S.G;
    if (!G) return null;
    return _shortPosition(G, stockId);
  };

  S.getShortUnrealizedPnL = function(stockId) {
    var G = S.G;
    if (!G) return 0;
    return _shortUnrealizedPnL(G, stockId);
  };

  // ========== 股票成本基础 ==========
  S.getStockCostBasis = function() {
    var G = S.G;
    if (!G) return 0;
    var total = 0;
    Object.values(G.stocks).forEach(function(h) { total += h.avgCost * h.shares; });
    return total;
  };
})();
