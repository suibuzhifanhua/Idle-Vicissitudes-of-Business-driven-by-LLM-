// ===================================================
// core-engine.js — Tick管线子函数：城市循环
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
  var calcTotalIncome = S.calcTotalIncome;
  var calcMaintenanceCost = S.calcMaintenanceCost;
  var getRegionModifiers = S.getRegionModifiers;

  function tickCityLoop() {
    if (_cityLoopTick !== G.tickCount) {
      _cityLoopIncome = S.calcTotalIncome();
      _cityLoopMaintenance = S.calcMaintenanceCost();
      _cityLoopRegionMods = S.getRegionModifiers();
      _cityLoopTick = G.tickCount;
    }
  }

  // ========== 挂载到 SGame ==========
  S.tickCityLoop = tickCityLoop;
})();
