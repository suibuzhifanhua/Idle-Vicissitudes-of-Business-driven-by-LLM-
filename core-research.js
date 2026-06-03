// ==================================================
// core-research.js — 科技研发系统
// ==================================================

(function initCoreResearch() {
  var S = window.SGame;
  if (!S) { setTimeout(initCoreResearch, 10); return; }

  // 生成研发点数
  S.generateRPT = function() {
    var G = S.G;
    if (!G) return;
    var rptGain = 0;
    Object.values(G.cities || {}).forEach(function(city) {
      if (!city.unlocked) return;
      Object.entries(city.businesses || {}).forEach(function(entry) {
        var bizId = entry[0], biz = entry[1];
        if (biz.level > 0 && TECH_RPT_RATES[bizId]) {
          rptGain += biz.level * TECH_RPT_RATES[bizId];
        }
      });
    });
    // AI自动化加成
    if (G.completedResearch && G.completedResearch.ai >= 3) rptGain *= 1.3;
    var achRewards = typeof S.calcAchievementRewards === 'function' ? S.calcAchievementRewards() : {};
    if (achRewards.rdBonus) rptGain *= (1 + achRewards.rdBonus);
    // 出身加成：技术极客 techRdSpeed
    if (G.originBonus && G.originBonus.techRdSpeed) rptGain *= G.originBonus.techRdSpeed;
    // 联动：马记者好感 > 40 → RPT 获取 +20%（舆论情报加速研发）
    if ((G.npcFavor && G.npcFavor.majizhe) > 40) rptGain *= 1.20;
    // 联动：林教授好感 > 40 → RPT 获取 +15%（学术资源）
    if ((G.npcFavor && G.npcFavor.linjiaoshou) > 40) rptGain *= 1.15;
    // 区域加成：rdBonus 研发速度加成（遍历有业务的区域）
    var rdRegionMul = 1.0;
    Object.values(G.cities || {}).forEach(function(city) {
      if (!city.unlocked) return;
      Object.entries(city.businesses || {}).forEach(function(entry) {
        var biz = entry[1];
        if (!biz || biz.level <= 0 || !biz.region) return;
        var reg = REGIONS[biz.region];
        if (reg && reg.bonus.rdBonus) rdRegionMul *= reg.bonus.rdBonus;
      });
    });
    if (rdRegionMul > 1.0) rptGain *= rdRegionMul;
    G.rpt += rptGain;
    G.rpt = Math.round(G.rpt * 100) / 100;
  };

  // 开始研发
  S.startResearch = function(techId) {
    var G = S.G;
    if (!G) return { ok: false, msg: '游戏未开始' };
    var tree = Object.values(TECH_TREE).find(function(t) { return t.id === techId; });
    if (!tree) return { ok: false, msg: '未知研发路线' };
    var curLevel = G.completedResearch[techId] || 0;
    if (curLevel >= 5) return { ok: false, msg: '该路线已研发完成' };
    var nextLvl = tree.levels[curLevel];
    if (G.activeResearch) return { ok: false, msg: '已有研发项目在进行中' };
    if (G.rpt < nextLvl.rptCost) return { ok: false, msg: '研发点数不足（需要' + nextLvl.rptCost + '，当前' + Math.round(G.rpt) + '）' };
    if (G.money < nextLvl.moneyCost) return { ok: false, msg: '资金不足（需要' + S.formatMoney(nextLvl.moneyCost) + '）' };
    G.rpt -= nextLvl.rptCost;
    G.money -= nextLvl.moneyCost;
    G.activeResearch = {
      techId: techId, name: nextLvl.name, level: curLevel + 1,
      remainingTicks: nextLvl.tickCost, totalTicks: nextLvl.tickCost
    };
    S.addLog('🔬 开始研发：' + tree.name + ' Lv' + (curLevel+1) + '「' + nextLvl.name + '」消耗 ' + S.formatMoney(nextLvl.moneyCost) + ' + ' + nextLvl.rptCost + ' RPT');
    S.save();
    return { ok: true, msg: nextLvl.name + ' 研发启动' };
  };

  // 检查研发进度
  S.checkResearchProgress = function() {
    var G = S.G;
    if (!G || !G.activeResearch) return;
    G.activeResearch.remainingTicks--;
    if (G.activeResearch.remainingTicks <= 0) {
      var ar = G.activeResearch;
      var tree = Object.values(TECH_TREE).find(function(t) { return t.id === ar.techId; });
      G.completedResearch[ar.techId] = (G.completedResearch[ar.techId] || 0) + 1;
      G.activeResearch = null;
      S.addLog('✅ 研发完成：' + tree.name + ' Lv' + ar.level + '「' + ar.name + '」');
      if (typeof UI !== 'undefined' && UI.showToast) {
        UI.showToast('研发完成：' + tree.name + ' Lv' + ar.level + '「' + ar.name + '」');
      }
      S.save();
    }
  };

  // 获取科技加成
  S.getTechBonus = function() {
    var G = S.G;
    if (!G) return { allRevenue:0, salaryReduction:0, fundBonus:0, autoRecruit:false };
    var bonus = { allRevenue:0, salaryReduction:0, fundBonus:0, autoRecruit:false };
    Object.entries(TECH_TREE).forEach(function(entry) {
      var key = entry[0], tree = entry[1];
      var lvl = G.completedResearch[key] || 0;
      for (var i = 0; i < lvl; i++) {
        var b = tree.levels[i].bonus;
        bonus.allRevenue += (b.allRevenue || 0);
        bonus.salaryReduction += (b.salaryReduction || 0);
        bonus.fundBonus += (b.fundBonus || 0);
        if (b.autoRecruit) bonus.autoRecruit = true;
      }
    });
    return bonus;
  };
})();
