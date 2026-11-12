// Author: Fisheep.L
// ==================================================
// core-venture.js — 风投线（天使→PE→IPO）：14 家 NPC 初创公司估值 tick 结算 + 投资/退出
// 模式与 core-stock.js 一致：IIFE 初始化，API 直接挂到 SGame
// ==================================================
(function initCoreVenture() {
  'use strict';
  const S = window.SGame;
  if (!S) return;
  const G = () => S.G;

  function _cfg() { return (typeof VENTURE_CFG !== 'undefined') ? VENTURE_CFG : null; }
  function _cos() { return (typeof VENTURE_COMPANIES !== 'undefined') ? VENTURE_COMPANIES : []; }
  function _co(cid) { for (let i = 0; i < _cos().length; i++) if (_cos()[i].id === cid) return _cos()[i]; return null; }

  // 防御式初始化（兼容旧存档：SAVE_VERSION 不变，字段缺失时补齐）
  function initVentures() {
    const g = G(); if (!g) return;
    g.ventures = g.ventures || {};
    g.ventureValuations = g.ventureValuations || {};
    g.ventureProfitTotal = g.ventureProfitTotal || 0;
    g.ventureIpos = g.ventureIpos || 0;
    g.ventureInvestCount = g.ventureInvestCount || 0;
    g.ventureIpoExits = g.ventureIpoExits || 0;
    g._ventureSnap = g._ventureSnap || { tick: 0, vals: {} };
    g._ventureIpoAnnounced = g._ventureIpoAnnounced || {}; // 未持仓公司的 IPO 宣布记录（防重复宣布→估值反复倍增爆炸）
    g._ventureScale = g._ventureScale || 1; // v1.7 当前估值档位乘数（富豪等级跃升时统一重定价用）
    _cos().forEach(c => {
      if (g.ventureValuations[c.id] === undefined) {
        const lg = S.getLateGameCostScale ? S.getLateGameCostScale() : 1;
        g.ventureValuations[c.id] = c.baseVal * lg;
      }
    });
  }

  // 估值 → 轮次徽章
  function ventureStageOf(val, baseVal) {
    const cfg = _cfg();
    if (!cfg) return '-';
    if (val >= cfg.IPO_THRESHOLD) return '拟上市';
    const r = baseVal > 0 ? val / baseVal : 1;
    if (r < 1.5) return '天使轮';
    if (r < 4) return 'A 轮';
    if (r < 12) return 'B 轮';
    return 'PE 轮';
  }

  // 涨跌幅（相对 CHANGE_WINDOW tick 前快照）
  function ventureChange(cid) {
    const g = G(); if (!g || !g.ventureValuations) return 0;
    const snap = g._ventureSnap || { vals: {} };
    const prev = snap.vals[cid];
    const val = g.ventureValuations[cid];
    if (!prev || prev <= 0 || !Number.isFinite(val)) return 0;
    return (val - prev) / prev;
  }

  // 每 tick 结算：估值随机游走（成长随规模衰减）+ IPO + 破产
  S.updateVentures = function() {
    const g = G(); const cfg = _cfg();
    if (!g || !cfg) return;
    initVentures();

    // v1.7 后期档位重定价：富豪等级跃升后，存量估值一次性 ×(新档/旧档)。
    // 纯确定性缩放（不消耗随机数）；不重定价则风投系统在 500亿+ 资产量级下萎缩为 0.01% 零头。
    const lgScale = S.getLateGameCostScale ? S.getLateGameCostScale() : 1;
    if (lgScale !== g._ventureScale) {
      const ratio = lgScale / g._ventureScale;
      Object.keys(g.ventureValuations).forEach(id => {
        const v = g.ventureValuations[id];
        if (Number.isFinite(v) && v > 0) g.ventureValuations[id] = v * ratio;
      });
      g._ventureScale = lgScale;
      S.addLog('📊 后期档位生效：风投市场估值整体 ×' + (ratio === 1 ? '1' : ratio));
    }

    // 快照滚动（UI/托管策略用）
    if ((g.tickCount || 0) - (g._ventureSnap.tick || 0) >= cfg.CHANGE_WINDOW) {
      g._ventureSnap = { tick: g.tickCount || 0, vals: Object.assign({}, g.ventureValuations) };
    }

    Object.keys(g.ventureValuations).forEach(cid => {
      const c = _co(cid);
      if (!c) return;
      let val = g.ventureValuations[cid];
      if (!Number.isFinite(val) || val <= 0) return; // 已破产
      const held = g.ventures[cid];
      const isIpo = !!(held && held.ipo);

      // 成长衰减：估值越大越接近 IPO 线，成长越小
      const room = Math.max(0, 1 - val / (cfg.IPO_THRESHOLD * 3));
      const growth = c.growth * (0.4 + room);
      const noise = (Math.random() * 2 - 1) * c.vol * (1 - c.moat * 0.5);
      val = val * (1 + growth + noise);
      val = Math.max(val, c.baseVal * lgScale * cfg.FLOOR_FACTOR); // 估值下限（破产除外不归零，v1.7 随档位缩放）

      // IPO：达标公司小概率宣布；超过达标线 2 倍强制 IPO；只宣布一次（防重复 bump 爆炸）
      // 注意：宣布标记必须用 undefined 语义判断——记录值可能为 0（tickCount=0 的测试环境），
      // 用 truthy 判断会把"tick 0 宣布"误判为未宣布 → 每 tick 重复 bump
      const announced = held ? !!held.ipo : (g._ventureIpoAnnounced[cid] !== undefined);
      const announcedTick = held ? (held.ipoTick || 0) : (g._ventureIpoAnnounced[cid] || 0);
      if (!announced && val >= cfg.IPO_THRESHOLD) {
        const prob = val >= cfg.IPO_THRESHOLD * cfg.IPO_FORCE_FACTOR ? 1 : cfg.IPO_PROB;
        if (Math.random() < prob) {
          const bump = cfg.IPO_BUMP_MIN + Math.random() * (cfg.IPO_BUMP_MAX - cfg.IPO_BUMP_MIN);
          val *= bump;
          g.ventureIpos = (g.ventureIpos || 0) + 1;
          if (held) { held.ipo = true; held.ipoTick = g.tickCount || 0; }
          else { g._ventureIpoAnnounced[cid] = g.tickCount || 0; }
          S.addLog('🚀 ' + c.name + ' 宣布 IPO！估值跳升至 ' + S.formatMoney(val) + (held ? '，你的持仓可按溢价退出' : '。'));
        }
      }
      // IPO 后修正：30 tick 未卖出则估值回落（持仓一次性 ×0.6；未持仓持续缓降回基础估值附近）
      if (announced && (g.tickCount || 0) - announcedTick >= cfg.IPO_CORRECT_TICKS) {
        if (held && !held.ipoCorrected) {
          val = val * cfg.IPO_CORRECT_FACTOR;
          held.ipoCorrected = true;
          S.addLog('📉 ' + c.name + ' 上市后估值修正：回落至 ' + S.formatMoney(val));
        } else if (!held) {
          val = Math.max(val * 0.9, c.baseVal * lgScale * 0.5);
        }
      }
      // 破产：持仓按入场价、空仓按基础估值为基准，跌破基准 20% 进入风险区（v1.7 基础估值随档位缩放）
      const ref = held && held.entryVal > 0 ? held.entryVal : c.baseVal * lgScale;
      if (val < ref * cfg.BANKRUPT_LINE && Math.random() < cfg.BANKRUPT_PROB) {
        val = 0;
        S.addLog('💥 ' + c.name + ' 破产！估值归零。' + (held ? ' 你的投资血本无归。' : ''));
        if (held) delete g.ventures[cid];
      }
      g.ventureValuations[cid] = val;
    });
  };

  // 投资：按当前估值入股价；单家 ≤49%，同时持有 ≤5 家
  S.investVenture = function(cid, amount) {
    const g = G(); const cfg = _cfg();
    if (!g || !cfg) return { ok: false, msg: '风投系统未就绪' };
    initVentures();
    const c = _co(cid);
    if (!c) return { ok: false, msg: '公司不存在' };
    const val = g.ventureValuations[cid];
    if (!val || val <= 0) return { ok: false, msg: c.name + ' 已破产，无法投资' };
    const held = g.ventures[cid];
    if (held && held.ipo) return { ok: false, msg: c.name + ' 已上市，不再接受私募投资' };
    amount = Math.floor(Number(amount) || 0);
    if (amount <= 0) return { ok: false, msg: '投资金额需大于 0' };
    if (g.money < amount) return { ok: false, msg: '资金不足（需要 ' + S.formatMoney(amount) + '）' };
    const addPct = amount / val;
    if (held) {
      if ((held.pct || 0) + addPct > cfg.MAX_HOLD_PCT) return { ok: false, msg: '持股将超过 ' + Math.round(cfg.MAX_HOLD_PCT * 100) + '% 上限' };
    } else {
      if (Object.keys(g.ventures).length >= cfg.MAX_POSITIONS) return { ok: false, msg: '最多同时持有 ' + cfg.MAX_POSITIONS + ' 家公司' };
      if (addPct > cfg.MAX_HOLD_PCT) return { ok: false, msg: '单笔投资将超过 ' + Math.round(cfg.MAX_HOLD_PCT * 100) + '% 上限' };
    }
    g.money -= amount;
    if (!g.ventures[cid]) g.ventures[cid] = { entryVal: val, entryTick: g.tickCount || 0, cost: 0, pct: 0 };
    g.ventures[cid].cost += amount;
    g.ventures[cid].pct += addPct;
    g.ventureInvestCount = (g.ventureInvestCount || 0) + 1;
    S.addLog('🎯 投资 ' + c.name + ' ' + S.formatMoney(amount) + '（约 ' + (g.ventures[cid].pct * 100).toFixed(1) + '%，估值 ' + S.formatMoney(val) + '）');
    return { ok: true, msg: '已投资 ' + c.name };
  };

  // 退出：按当前估值折算市值；IPO 窗口 +20% 溢价，其余 -20% PE 折价
  S.liquidateVenture = function(cid) {
    const g = G(); const cfg = _cfg();
    if (!g || !cfg) return { ok: false, msg: '风投系统未就绪' };
    const h = g.ventures && g.ventures[cid];
    if (!h) return { ok: false, msg: '未持有该公司' };
    const c = _co(cid);
    const name = c ? c.name : cid;
    const val = g.ventureValuations[cid] || 0;
    let proceeds = h.cost * (h.entryVal > 0 ? val / h.entryVal : 0);
    let tag = '';
    const wasIpo = !!(h.ipo && !h.ipoCorrected);
    if (wasIpo) { proceeds *= cfg.IPO_EXIT_PREMIUM; tag = '（IPO 溢价）'; }
    else { proceeds *= cfg.EXIT_DISCOUNT; tag = '（PE 折价）'; }
    proceeds = Math.floor(proceeds);
    g.money += proceeds;
    const profit = proceeds - h.cost;
    g.ventureProfitTotal = (g.ventureProfitTotal || 0) + profit;
    if (wasIpo) g.ventureIpoExits = (g.ventureIpoExits || 0) + 1;
    delete g.ventures[cid];
    S.addLog('📤 退出 ' + name + tag + '：到手 ' + S.formatMoney(proceeds) + '（盈亏 ' + (profit >= 0 ? '+' : '-') + S.formatMoney(Math.abs(profit)) + '）');
    return { ok: true, msg: '已退出 ' + name, proceeds: proceeds, profit: profit, wasIpo: wasIpo };
  };

  // 持仓总览（UI 头部用）
  S.getVentureStats = function() {
    const g = G();
    if (!g) return { cost: 0, value: 0, profit: 0, held: 0, total: 0 };
    initVentures();
    let cost = 0, value = 0, held = 0;
    Object.keys(g.ventures).forEach(cid => {
      const h = g.ventures[cid];
      if (!h) return;
      held++;
      cost += h.cost;
      value += h.cost * ((g.ventureValuations[cid] || 0) / (h.entryVal > 0 ? h.entryVal : 1));
    });
    return { cost: cost, value: value, profit: value - cost, held: held, total: g.ventureProfitTotal || 0 };
  };

  S.ventureStageOf = ventureStageOf;
  S.ventureChange = ventureChange;
  S.initVentures = initVentures;
})();
