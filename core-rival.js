// ==================================================
// core-rival.js — 竞争对手AI系统（策略深化版）
// ==================================================

(function initCoreRival() {
  var S = window.SGame;
  if (!S) { setTimeout(initCoreRival, 10); return; }

  // ========== 更新竞争对手状态 ==========
  S.updateRivals = function() {
    var G = S.G;
    if (!G || !G.rivals || G.rivals.length === 0) return;
    G.rivals.forEach(function(r) {
      r.tickCount = (r.tickCount || 0) + 1;

      // 策略差异化：波动范围不同
      var strategy = r.strategy || 'conservative';
      var fluctuation;
      switch (strategy) {
        case 'aggressive':
          fluctuation = 0.82 + Math.random() * 0.36; // 0.82-1.18
          break;
        case 'specialized':
          fluctuation = 0.90 + Math.random() * 0.20; // 0.90-1.10
          // 专精行业加成：检查玩家是否拥有该行业的业务
          if (r.specIndustry && G.businesses) {
            var hasBiz = Object.values(G.businesses).some(function(b) {
              return b && b.type === r.specIndustry && b.unlocked && b.level > 0;
            });
            if (hasBiz) fluctuation += 0.03; // 专精行业额外+3%
          }
          break;
        default: // conservative
          fluctuation = 0.94 + Math.random() * 0.10; // 0.94-1.04
          break;
      }
      r.money *= r.growthRate * fluctuation;

      // 随机事件（现有逻辑保留）
      if (Math.random() < (typeof CONFIG !== 'undefined' ? CONFIG.NPC_VISIT_BASE_PROB : 0.08)) {
        var evts = ['expansion','crisis','breakthrough','acquisition'];
        var evt = evts[Math.floor(Math.random() * evts.length)];
        switch(evt) {
          case 'expansion': r.money *= 1.15; S.addLog('📈 ' + r.name + '大举扩张，资产增长15%。'); break;
          case 'crisis': r.money *= 0.85; S.addLog('📉 ' + r.name + '遭遇危机，资产缩水15%。'); break;
          case 'breakthrough': r.money *= 1.10; S.addLog('💡 ' + r.name + '取得技术突破。'); break;
          case 'acquisition': r.money *= 1.08; S.addLog('🤝 ' + r.name + '完成并购。'); break;
        }
        if (evt === 'expansion') {
          G._rivalExpansionPenalty = (G._rivalExpansionPenalty || 0) + 0.03;
          setTimeout(function() { G._rivalExpansionPenalty = (G._rivalExpansionPenalty || 0) - 0.03; }, 60000);
        }
        if (evt === 'crisis') {
          G._rivalCrisisBonus = (G._rivalCrisisBonus || 0) + 0.02;
          setTimeout(function() { G._rivalCrisisBonus = (G._rivalCrisisBonus || 0) - 0.02; }, 60000);
        }
      }

      // === 恶意竞争：挖角员工 ===
      _checkPoachEmployee(r, G);

      // === 市场份额抢占 ===
      _checkMarketShareGrab(r, G);
    });

    // 竞争对手排名变化
    var prevRank = G._lastRivalRank || 1;
    var curRank = S.getRivalRank().rank;
    if (curRank !== prevRank) {
      G._lastRivalRank = curRank;
    }
  };

  // ========== 挖角员工 ==========
  function _checkPoachEmployee(rival, G) {
    // 仅在 aggressive 和 specialized 策略时挖角
    var strategy = rival.strategy || 'conservative';
    if (strategy === 'conservative') return;

    var poachProb = strategy === 'aggressive' ? 0.06 : 0.03; // 每tick概率
    if (Math.random() >= poachProb) return;

    // 玩家必须有可被挖的员工
    if (!G.employees || G.employees.length === 0) return;
    var candidates = G.employees.filter(function(e) { return !e.isIntern; });
    if (candidates.length === 0) return;

    var target = candidates[Math.floor(Math.random() * candidates.length)];
    // 成功率 = (100 - 忠诚度) / 100
    var loyalty = target.loyalty || 50;
    var successRate = (100 - loyalty) / 100;
    // HR 存在时成功率减半
    var hasHR = G.employees.some(function(e) { return e.role === 'hr'; });
    if (hasHR) successRate *= 0.5;

    if (Math.random() < successRate) {
      // 挖角成功
      var idx = G.employees.indexOf(target);
      if (idx >= 0) G.employees.splice(idx, 1);
      S.addLog('⚠️ ' + rival.name + '挖走了你的员工「' + target.name + '」！忠诚度过低导致跳槽。');
      // 市场影响
      G._rivalExpansionPenalty = (G._rivalExpansionPenalty || 0) + 0.05;
      setTimeout(function() { G._rivalExpansionPenalty = (G._rivalExpansionPenalty || 0) - 0.05; }, 60000);
    }
    // 无论成功失败，都有日志提示
    else if (Math.random() < 0.5) {
      S.addLog('🔍 ' + rival.name + '试图挖角「' + target.name + '」，但被拒绝了。');
    }
  }

  // ========== 市场份额抢占 ==========
  function _checkMarketShareGrab(rival, G) {
    var strategy = rival.strategy || 'conservative';
    var grabProb = strategy === 'aggressive' ? 0.10 : strategy === 'specialized' ? 0.06 : 0.03;
    if (Math.random() >= grabProb) return;

    G.marketShare = G.marketShare || {};
    // 抢占已有市场的份额
    var keys = Object.keys(G.marketShare);
    if (keys.length === 0) return;
    var key = keys[Math.floor(Math.random() * keys.length)];
    var current = G.marketShare[key] || 0;
    // aggressive 抢 5%，specialized 抢 3%，conservative 抢 1%
    var grabAmount = strategy === 'aggressive' ? 0.05 : strategy === 'specialized' ? 0.03 : 0.01;
    G.marketShare[key] = Math.max(0, current - grabAmount);

    // 收入影响
    var penalty = grabAmount * 2; // 市场份额损失对收入的倍率影响
    G._rivalMarketPenalty = (G._rivalMarketPenalty || 0) + penalty;
    setTimeout(function() { G._rivalMarketPenalty = (G._rivalMarketPenalty || 0) - penalty; }, 60000);

    if (grabAmount >= 0.04) {
      S.addLog('📊 ' + rival.name + '在你的核心市场大举扩张，你的市场份额受到挤压。');
    }
  }

  // ========== 商业情报：获取对手信息 ==========
  S.getRivalIntel = function(rivalId) {
    var G = S.G;
    if (!G || !G.rivals) return { ok: false, msg: '游戏未开始' };

    var cost = 50000 + Math.floor(Math.random() * 50000);
    if (G.money < cost) return { ok: false, msg: '情报费不足（需要' + S.formatMoney(cost) + '）' };

    var rival = G.rivals.find(function(r) { return r.id === rivalId; });
    if (!rival) return { ok: false, msg: '对手不存在' };

    G.money -= cost;
    // 生成情报：包含资产估算、策略、弱点分析
    var assetRange;
    var rMoney = rival.money || 0;
    if (rMoney < 100000) assetRange = '小型企业（<10万）';
    else if (rMoney < 1000000) assetRange = '中型企业（10万-100万）';
    else if (rMoney < 10000000) assetRange = '大型企业（100万-1000万）';
    else assetRange = '巨头（>1000万）';

    var strategyDesc;
    switch (rival.strategy) {
      case 'aggressive': strategyDesc = '激进扩张型：高增长高风险，热衷于挖角和市场掠夺'; break;
      case 'specialized': strategyDesc = '专精细分型：在特定行业（' + (rival.specIndustry || '未知') + '）有显著优势'; break;
      default: strategyDesc = '保守稳健型：增长缓慢但稳定，不易出现重大失误'; break;
    }

    var weakness;
    switch (rival.strategy) {
      case 'aggressive': weakness = '激进策略下资金链脆弱，遭遇危机时容易崩盘'; break;
      case 'specialized': weakness = '过度依赖单一行业，行业政策变化影响巨大'; break;
      default: weakness = '保守策略难以抓住市场风口，可能错失增长机会'; break;
    }

    // 随时间推移情报过期
    if (!G._rivalIntelCache) G._rivalIntelCache = {};
    G._rivalIntelCache[rivalId] = {
      acquiredAt: G.tickCount,
      info: {
        name: rival.name,
        boss: rival.boss,
        style: rival.style,
        strategy: rival.strategy,
        specIndustry: rival.specIndustry,
        assetRange: assetRange,
        strategyDesc: strategyDesc,
        weakness: weakness,
        cost: cost,
        empCount: rival.employees ? rival.employees.length : 0,
        coverageRange: rival.businesses ? rival.businesses.length + '个行业' : '未知'
      }
    };

    S.addLog('🕵️ 获取了' + rival.name + '的商业情报');
    if (typeof save === 'function') save();
    return { ok: true, msg: '情报获取成功', data: G._rivalIntelCache[rivalId].info };
  };

  // ========== 获取排名 ==========
  var _rivalRankCache = null;
  var _rivalRankCacheTick = -1;

  S.getRivalRank = function() {
    var G = S.G;
    if (!G || !G.rivals || G.rivals.length === 0) return { rank: 1, total: 1, list: [] };
    if (_rivalRankCacheTick === G.tickCount && _rivalRankCache) return _rivalRankCache;
    var allEntities = G.rivals.map(function(r) {
      return {
        name: r.name, boss: r.boss, money: r.money, style: r.style, color: r.color,
        strategy: r.strategy, specIndustry: r.specIndustry, isPlayer: false
      };
    });
    allEntities.push({
      name: '你（' + (G.companyName || '公司') + '）', boss: G.name || '你',
      money: G.money, style: '玩家', color: '#00d2ff', isPlayer: true
    });
    allEntities.sort(function(a, b) {
      var ma = (a.money == null || isNaN(a.money)) ? 0 : a.money;
      var mb = (b.money == null || isNaN(b.money)) ? 0 : b.money;
      return mb - ma;
    });
    var playerIndex = allEntities.findIndex(function(e) { return e.isPlayer; });
    if (playerIndex < 0) playerIndex = allEntities.length - 1;
    _rivalRankCache = { rank: playerIndex + 1, total: allEntities.length, list: allEntities };
    _rivalRankCacheTick = G.tickCount;
    return _rivalRankCache;
  };

})();
