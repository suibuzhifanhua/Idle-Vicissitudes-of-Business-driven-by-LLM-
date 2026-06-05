// ==================================================
// core-rival.js — 竞争对手AI系统
// ==================================================

(function initCoreRival() {
  var S = window.SGame;
  if (!S) { setTimeout(initCoreRival, 10); return; }

  // 更新竞争对手状态
  S.updateRivals = function() {
    var G = S.G;
    if (!G || !G.rivals || G.rivals.length === 0) return;
    G.rivals.forEach(function(r) {
      r.tickCount = (r.tickCount || 0) + 1;
      var fluctuation = 0.95 + Math.random() * 0.10;
      r.money *= r.growthRate * fluctuation;
      if (Math.random() < 0.08) {
        var evts = ['expansion','crisis','breakthrough','acquisition'];
        var evt = evts[Math.floor(Math.random() * evts.length)];
        switch(evt) {
          case 'expansion': r.money *= 1.15; S.addLog('📈 ' + r.name + '大举扩张，资产增长15%。'); break;
          case 'crisis': r.money *= 0.85; S.addLog('📉 ' + r.name + '遭遇危机，资产缩水15%。'); break;
          case 'breakthrough': r.money *= 1.10; S.addLog('💡 ' + r.name + '取得技术突破。'); break;
          case 'acquisition': r.money *= 1.08; S.addLog('🤝 ' + r.name + '完成并购。'); break;
        }
        // 联动：竞争对手事件 → 市场影响
        if (evt === 'expansion') {
          G._rivalExpansionPenalty = (G._rivalExpansionPenalty || 0) + 0.03;
          setTimeout(function() { G._rivalExpansionPenalty = (G._rivalExpansionPenalty || 0) - 0.03; }, 60000);
        }
        if (evt === 'crisis') {
          G._rivalCrisisBonus = (G._rivalCrisisBonus || 0) + 0.02;
          setTimeout(function() { G._rivalCrisisBonus = (G._rivalCrisisBonus || 0) - 0.02; }, 60000);
        }
      }
    });
    // 竞争对手排名变化
    var prevRank = G._lastRivalRank || 1;
    var curRank = S.getRivalRank().rank;
    if (curRank !== prevRank) {
      G._lastRivalRank = curRank;
    }
  };

  // 获取竞争对手排名
  S.getRivalRank = function() {
    var G = S.G;
    if (!G || !G.rivals || G.rivals.length === 0) return { rank: 1, total: 1, list: [] };
    var allEntities = G.rivals.map(function(r) {
      return {
        name: r.name, boss: r.boss, money: r.money, style: r.style, color: r.color, isPlayer: false
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
    if (playerIndex < 0) playerIndex = allEntities.length - 1; // 兜底：找不到玩家放最后
    return { rank: playerIndex + 1, total: allEntities.length, list: allEntities };
  };
})();
