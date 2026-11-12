// ==================================================
// balance-simulation.mjs — 经济平衡模拟（v2.0，真跑 doTick）
// ==================================================
// 架构：
// - 在 vm 沙箱（假 DOM + 手动定时器 + LLM 整体打桩 + 种子化 PRNG + 可推进假时钟）中
//   装载完整游戏脚本，逐 tick 手动驱动 interval，真跑 doTick
//   （事件/衰减/品牌/员工/供应链/财报/NPC 全管线），而非纯算术近似。
// - 同 SEED 双场景对照：
//   scheduled：每游戏小时块执行升级（回本贪心，走真实 upgradeBusinessMax）+ 招聘（真实 batchHire），逼近上界；
//   passive：  零干预，仅被动收入 + 事件随机损益，作为下界对照。
// - v1.1 的"简化算术上界模型"已退役：其收入口径与游戏真实结算脱节（不乘科技/协同/员工加成），
//   24h 即亏损破产，delta 无参考意义。双场景同引擎对照才是有效基线。
//
// 输出 JSON：{ ok, seed, wallSeconds, scheduled, passive, delta }
//   scheduled/passive: { horizons, rankTimes, offline24h, haltedAt, errors }
//   delta: 各观察点 scheduled/passive 的资金与净收益比（>1 = 主动经营增益）
//
// 环境变量：
//   SEED=n             随机种子（默认 1；经沙箱内 Math.random 生效，SEED 不同则事件流不同）
//   SIM_HOURS=1,24,72  观察点小时（默认 1,24,72,720；720h 全量 in-script ≈ 20s，
//                      但本环境有 ≈9× in-script 的进程退出滞留，墙钟约 3.5 分钟/全量）
//   SIM_ONLY=sched|passive  只跑单场景（性能实验/诊断用）
//   SIM_PROBE=1        逐 tick 详细探针日志（诊断用，显著变慢，默认关）
//   SIM_LOG=path       同步文件日志路径（异常恒记；逐 tick 行仅 SIM_PROBE=1 时写）
//   SIM_SENTINEL=path  完成哨兵（进程死亡前对外不可见，仅作备份信号）
//   SIM_DIAG=1         退出时间线诊断日志（C:/Users/A1/AppData/Local/Temp/bs-diag.log）
//
// 关键环境约定（踩坑记录，勿改）：
// 1. setTimeout 桩 = 立即执行回调（手动时钟语义），但 llm.js 的 check() 失败重试链
//    setTimeout(() => check(), 10000) 会因此递归爆栈 → LLM 桩必须在 main.js 加载前生效。
// 2. G.businesses 是活视图（多城市统一数据源），禁止整体赋值，只能改字段。
// 3. 探针开关必须用 process.env.SIM_PROBE === '1' 精确比较（Boolean('0') 为 true，曾致全量误开）。
// 4. 本沙箱环境的同步 fs 写入经 WorkBuddy broker 中转（~0.4ms/次、零 node CPU），
//    逐 tick 写日志会把 720h 模拟拖到 10 分钟以上——正常路径不写盘。
// 5. 种子 PRNG（mulberry32）必须真的 return [0,1) 浮点：曾漏 return 致 Math.random() 恒为
//    undefined，全部随机分支静默禁用，三 SEED 结果完全一致（假稳定）。
// 6. 假 DOM 的 firstChild/lastChild 必须是活 getter：游戏有 while (el.firstChild) removeChild 清空
//    模式，静态属性在 removeChild 后不更新 = 死循环（tick 839 首张事件卡片渲染卡死根因）。
// 7. 本环境 node 进程退出滞留 ≈ 9 × in-script（120/240/480/720h 线性验证，与 heap 无关，
//    拆分进程无效）；且进程死亡前 fs/重定向 stdout 对外均不可见 → 哨兵与输出标记只能作备份。
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const GAME_DIR = process.argv[2]
  ? path.resolve(process.argv[2]) + path.sep
  : path.dirname(fileURLToPath(import.meta.url)) + '/';

const SEED = Number(process.env.SEED) || 1;
const HORizons = process.env.SIM_HOURS
  ? process.env.SIM_HOURS.split(',').map(Number).filter((n) => Number.isFinite(n) && n > 0)
  : [1, 24, 72, 720];
const PROBE_ON = process.env.SIM_PROBE === '1';
// 完成哨兵：结果写完后同步落盘退出码。本沙箱环境中 node 进程脚本结束后可能滞留 ~3 分钟才真正退出
// （规模越大越明显，零 CPU）；外部 harness 可轮询本文件后立即 kill 进程，不受滞留影响。
const SENTINEL = process.env.SIM_SENTINEL || 'C:/Users/A1/AppData/Local/Temp/balance-sim.done';
const writeSentinel = (code) => { try { fs.writeFileSync(SENTINEL, String(code) + '\n'); } catch (_) {} };
const LOGFILE = process.env.SIM_LOG || (PROBE_ON ? 'C:/Users/A1/AppData/Local/Temp/balance-sim.log' : '');
function slog(line) {
  if (!LOGFILE) return;
  try { fs.appendFileSync(LOGFILE, String(line) + '\n'); } catch (_) {}
}
if (LOGFILE) { try { fs.writeFileSync(LOGFILE, ''); } catch (_) {} }
slog(`SIM-START seed=${SEED} hours=${HORizons.join(',')} probe=${PROBE_ON} dir=${GAME_DIR}`);

function mulberry32(a) { return function() { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const LLM_STUB = 'window.LLM = new Proxy({ available: false, isAvailable: function(){ return false; }, queueLength: 0 }, { get: function(t, k) { return (k in t) ? t[k] : function(){ return Promise.resolve(null); }; } });';
const SCRIPTS = [
  'config-game.js', 'config-businesses.js', 'config-achievements.js', 'config-npcs.js', 'config-extensions.js',
  'data-origins.js', 'data-businesses.js', 'data-stocks.js', 'data-tech.js', 'data-npcs.js', 'data-events.js',
  'state.js', 'network.js', 'storage.js', 'settings.js', 'llm.js',
  null, // ← LLM_STUB 占位（必须在 main.js 前）
  'core.js', 'core-engine.js', 'core-market.js', 'core-finance.js',
  'core-strategy.js', 'core-stock.js', 'core-research.js', 'core-rival.js', 'extensions.js',
  'advisor.js', 'events.js', 'npc.js', 'ui.js', 'audio.js', 'main.js',
];

// ---------- 场景构造：全新沙箱，隔离双场景状态 ----------
function createScenario(label) {
  let fakeNow = 1750000000000; // 2025-06-15 附近，给年度事件留足余量
  const RealDate = Date;
  class FakeDate extends RealDate {
    constructor(...args) { if (args.length === 0) { super(fakeNow); } else { super(...args); } }
    static now() { return fakeNow; }
  }

  let _tid = 1;
  const _store = new Map();
  const setI = (fn, ms) => { const id = _tid++; _store.set(id, { fn, ms, kind: 'interval' }); return id; };
  const setT = (fn, ms) => { const id = _tid++; _store.set(id, { fn, ms, kind: 'timeout' }); return id; };
  const clr = (id) => { _store.delete(id); };

  function makeElement(tag) {
    const element = {
      tagName: (tag || 'div').toUpperCase(), id: '', className: '', innerHTML: '', textContent: '',
      value: '', disabled: false, checked: false, style: {}, dataset: {}, children: [], parentNode: null,
      scrollHeight: 0, scrollTop: 0,
      // firstChild/lastChild 必须是活 getter：游戏代码有 while (el.firstChild) el.removeChild(el.firstChild)
      // 清空模式，静态属性在 removeChild 后不更新会造成死循环（tick 839 事件卡片渲染卡死根因）
      get firstChild() { return this.children.length ? this.children[0] : null; },
      get lastChild() { return this.children.length ? this.children[this.children.length - 1] : null; },
      get childNodes() { return this.children; },
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      appendChild(child) { this.children.push(child); child.parentNode = this; return child; },
      insertBefore(child) { this.children.unshift(child); child.parentNode = this; return child; },
      removeChild(child) { this.children = this.children.filter((item) => item !== child); return child; },
      remove() {}, insertAdjacentHTML() {}, setAttribute() {}, getAttribute() { return null; }, removeAttribute() {},
      addEventListener() {}, removeEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; },
      getBoundingClientRect() { return { top: 0, left: 0, width: 100, height: 50, bottom: 50, right: 100 }; },
      focus() {}, blur() {}, click() {}, play() { return Promise.resolve(); }, pause() {}, load() {},
      getContext() { return new Proxy({}, { get: () => () => ({}) }); }, closest() { return null; }, contains() { return false; },
    };
    return element;
  }
  const elements = new Map();
  const document = {
    body: makeElement('body'), documentElement: makeElement('html'), head: makeElement('head'), title: '',
    getElementById(id) {
      if (!elements.has(id)) { const element = makeElement('div'); element.id = id; elements.set(id, element); }
      return elements.get(id);
    },
    createElement: makeElement, createTextNode: () => makeElement('span'),
    querySelector() { return null; }, querySelectorAll() { return []; },
    addEventListener() {}, removeEventListener() {}, hidden: false, visibilityState: 'visible',
  };

  const errors = [];
  const sandbox = {
    addEventListener() {}, removeEventListener() {},
    setInterval: setI, clearInterval: clr, setTimeout: setT, clearTimeout: clr,
    requestAnimationFrame(fn) { fn(0); return 1; }, cancelAnimationFrame() {},
    performance: { now: () => fakeNow },
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    localStorage: (() => { const store = new Map(); return { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear() }; })(),
    location: { href: 'http://localhost:8765/', origin: 'http://localhost:8765', reload() {}, hash: '' },
    navigator: { clipboard: { writeText: () => Promise.resolve() }, userAgent: 'node' },
    alert() {}, confirm: () => true, prompt: () => '',
    Audio: function () { return makeElement('audio'); }, Image: function () { return makeElement('img'); },
    fetch: async () => ({ ok: true, status: 200, json: async () => ({}), text: async () => '' }),
    ResizeObserver: function () { return { observe() {}, disconnect() {} }; },
    structuredClone: (value) => JSON.parse(JSON.stringify(value)),
    AbortController: class { constructor() { this.signal = { aborted: false, addEventListener() {}, removeEventListener() {} }; } abort() {} },
    URL, URLSearchParams, Blob: function () {}, Intl, Buffer,
    devicePixelRatio: 1, innerWidth: 1440, innerHeight: 900,
    console: { log() {}, debug() {}, warn() {}, error: (...a) => errors.push(a.map(String).join(' ')) },
  };
  const _realMath = Math;
  sandbox.Math = Object.create(_realMath);
  sandbox.Math.random = mulberry32(SEED);
  sandbox.Date = FakeDate;
  sandbox.window = sandbox;
  sandbox.document = document;
  sandbox.globalThis = sandbox;
  sandbox.__storageBootstrap = Promise.resolve({ status: 'session', token: 'sim-session', tokenHeader: 'X-Shanghaifc-Token' });

  const ctx = vm.createContext(sandbox);
  const evalIn = (code) => vm.runInContext(code, ctx);
  for (const file of SCRIPTS) {
    try {
      if (file === null) { vm.runInContext(LLM_STUB, ctx, { filename: 'llm-stub' }); continue; }
      if (!fs.existsSync(GAME_DIR + file)) continue;
      vm.runInContext(fs.readFileSync(GAME_DIR + file, 'utf8'), ctx, { filename: file });
    } catch (e) {
      errors.push('LOAD FAILED ' + (file || 'llm-stub') + ': ' + e.message);
    }
  }

  const S = sandbox.SGame;
  if (!S) return null;
  S.DEBUG = false;
  S.initState('tech', '模拟器');
  S.startGame('tech', '模拟器');
  const G = S.G;
  const BUSINESS_DEFS = evalIn('BUSINESS_DEFS');
  const NPCS = evalIn('NPCS');
  const RANK_TIERS = evalIn('RANK_TIERS');
  const CONFIG = evalIn('CONFIG');
  const EMP_ROLES = evalIn('EMP_ROLES');

  // 模拟起点：中等身家 + 满研发/满好感（上界口径）
  G.money = 500000;
  G.reputation = 90;
  G.completedResearch = { digital: 9, ai: 9, blockchain: 9 };
  Object.keys(NPCS || {}).forEach((id) => { G.npcFavor[id] = 100; });
  BUSINESS_DEFS.forEach((definition) => {
    G.businesses[definition.id] = { level: 1, region: definition.regions ? definition.regions[0] : null, unlocked: true };
  });
  G.autoMode.enabled = false; // 升级/招聘由场景调度器负责（passive 场景为无操作）
  G.eventLog = [];
  G._saveDirty = false;
  const bootErrors = errors.length; // 启动期（LLM 检测/Storage 预加载）错误不计入运行期判定

  // ---------- 逐 tick 驱动 ----------
  function runTick() {
    const intervals = [..._store.values()].filter((t) => t.kind === 'interval');
    let _i = 0;
    for (const t of intervals) {
      if (PROBE_ON) slog('[' + label + '] c i=' + _i + ' tick=' + G.tickCount + ' ' + t.fn.toString().slice(0, 28));
      const _idx = _i;
      try { const r = t.fn(); if (PROBE_ON) slog('[' + label + '] R i=' + _idx + ' tick=' + G.tickCount + ' ret=' + typeof r); } catch (e) { errors.push('[' + label + '] interval threw: ' + e.message); }
      _i++;
    }
    if (PROBE_ON && sandbox.__probe) { slog('[' + label + '] PROBE>> ' + sandbox.__probe); sandbox.__probe = ''; }
    const due = [..._store.entries()].filter(([, t]) => t.kind === 'timeout');
    let _j = 0;
    for (const [id, t] of due) {
      if (PROBE_ON) slog('[' + label + '] t j=' + _j + ' tick=' + G.tickCount + ' ' + t.fn.toString().slice(0, 28));
      clr(id);
      try { t.fn(); if (PROBE_ON) slog('[' + label + '] Rt j=' + _j + ' tick=' + G.tickCount); } catch (e) { errors.push('[' + label + '] timeout threw: ' + e.message); }
      _j++;
    }
  }

  return { S, G, BUSINESS_DEFS, RANK_TIERS, CONFIG, EMP_ROLES, errors, bootErrors, runTick, advance: () => { fakeNow += CONFIG.TICK_MS; }, now: () => fakeNow };
}

// ---------- 场景运行 ----------
function runScenario(label, withScheduler) {
  const t0 = Date.now();
  const sc = createScenario(label);
  if (!sc) return { ok: false, error: 'SGame unavailable' };
  const { S, G, BUSINESS_DEFS, RANK_TIERS, CONFIG, EMP_ROLES, errors, bootErrors, runTick, advance, now: simNow } = sc;
  const hourTicks = Math.round(3600000 / CONFIG.TICK_MS);
  const finalHorizon = Math.max(...HORizons) * hourTicks;

  const horizons = {};
  const rankTimes = {};

  function refreshEconomy() {
    S.invalidateIncomeCache();
    return { income: S.calcTotalIncome(), expense: S.calcTotalExpense() };
  }

  // 真实 API 升级：走 upgradeBusinessMax（含前置条件/扣钱/日志），按回本周期贪心
  function upgradePass() {
    let guard = 0;
    while (guard++ < 40) {
      const candidates = [];
      BUSINESS_DEFS.forEach((definition) => {
        const state = G.businesses[definition.id];
        if (!state || !state.level) return;
        const next = definition.levels[state.level];
        if (!next) return;
        const cost = Number(next.cost) * 10000;
        const prevIncome = Number(definition.levels[state.level - 1].income) * 10000;
        const nextIncome = Number(next.income) * 10000;
        if (cost > 0 && nextIncome > prevIncome) candidates.push({ id: definition.id, cost, payback: cost / (nextIncome - prevIncome) });
      });
      candidates.sort((a, b) => a.payback - b.payback);
      const reserve = Math.max(200000, S.calcTotalExpense() * 100);
      const chosen = candidates.find((candidate) => G.money - reserve >= candidate.cost);
      if (!chosen) break;
      const res = S.upgradeBusinessMax(chosen.id);
      if (res && res.ok && res.levels > 0) continue;
      break;
    }
  }

  const HIRE_ROLES = ['manager', 'developer', 'sales', 'marketer'];
  function hirePass(netPerTick) {
    if ((G.employees || []).length >= S.getEmpMax()) return;
    const role = EMP_ROLES.find((item) => item.id === HIRE_ROLES[(G.employees || []).length % HIRE_ROLES.length]);
    if (!role) return;
    const wage = Number(role.baseSalary) * 10000;
    if (netPerTick < wage * 4) return;
    if (G.money < Math.max(200000, S.calcTotalExpense() * 120)) return;
    S.batchHire(role.id, 1);
  }

  function record(economy) {
    RANK_TIERS.forEach((tier) => {
      if (!rankTimes[tier.name] && G.money >= tier.minMoney) {
        rankTimes[tier.name] = { tick: G.tickCount, hours: Math.round((G.tickCount / hourTicks) * 10) / 10 };
      }
    });
    HORizons.forEach((hours) => {
      const target = hours * hourTicks;
      if (!horizons[hours] && G.tickCount >= target) {
        horizons[hours] = {
          money: Math.round(G.money),
          incomePerTick: Math.round(economy.income),
          expensePerTick: Math.round(economy.expense),
          netPerTick: Math.round(economy.income - economy.expense),
          rank: G.rank,
          employees: (G.employees || []).length,
          businessLevels: BUSINESS_DEFS.reduce((sum, definition) => sum + ((G.businesses[definition.id] || {}).level || 0), 0),
        };
      }
    });
  }

  S.startTick();
  let haltedAt = null;
  let _progress = 0;
  while (G.tickCount < finalHorizon) {
    const steps = Math.min(hourTicks, finalHorizon - G.tickCount);
    const errAtBlockStart = errors.length;
    for (let i = 0; i < steps; i++) {
      advance();
      runTick();
      if (errors.length > errAtBlockStart) { haltedAt = { tick: G.tickCount, at: i, error: errors.slice(-1)[0].slice(0, 200) }; break; }
    }
    if (haltedAt) break;
    if (!Number.isFinite(G.money) || G.money < 0) G.money = 0;
    if (G.money > 1e15) G.money = 1e15;
    if (S.updateRank) S.updateRank();
    if (withScheduler) {
      upgradePass();
      const eco = refreshEconomy();
      hirePass(eco.income - eco.expense);
      record(eco);
    } else {
      record(refreshEconomy());
    }
    if (LOGFILE && ++_progress % 24 === 0) {
      slog('[' + label + '] ' + (G.tickCount / hourTicks) + 'h money=' + Math.round(G.money));
    }
  }
  const wallSeconds = Math.round((Date.now() - t0) / 100) / 100;

  // 离线 24h 折算（沙箱时钟）
  let offline24h = null;
  if (!haltedAt) {
    const eco = refreshEconomy();
    const net = eco.income - eco.expense;
    G.netIncomeSamples = Array.from({ length: 20 }, () => ({ net }));
    G._offlineSettledAt = simNow() - 24 * 3600 * 1000;
    const offline = S.calcOfflineIncome();
    G.netIncomeSamples = [];
    G._offlineSettledAt = simNow();
    offline24h = { hours: offline.hours, rawTicks: offline.ticks, effectiveTicks: offline.effectiveTicks, income: Math.round(offline.income) };
  }

  return {
    ok: !haltedAt && errors.length === bootErrors,
    label,
    wallSeconds,
    ticks: G.tickCount,
    horizons,
    rankTimes,
    offline24h,
    haltedAt,
    heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1048576),
    errors: errors.slice(bootErrors, bootErrors + 8),
    bootErrors: errors.slice(0, bootErrors).map((e) => e.slice(0, 120)),
  };
}

// ---------- 主流程 ----------
const wallT0 = Date.now();
process.on('uncaughtException', (e) => {
  slog('UNCAUGHT ' + (e && e.stack ? e.stack : String(e)));
  try { process.stdout.write(JSON.stringify({ ok: false, uncaught: String(e && e.message) }) + '\n'); } catch (_) {}
  writeSentinel(50);
  process.exit(50);
});

// SIM_ONLY=scheduled|passive 可只跑单场景（用于性能实验 / 分进程跑）
const SIM_ONLY = process.env.SIM_ONLY || '';
const scheduled = SIM_ONLY === 'passive' ? null : runScenario('scheduled', true);
const passive = SIM_ONLY === 'scheduled' ? null : runScenario('passive', false);

const delta = {};
if (scheduled && passive) {
  HORizons.forEach((hours) => {
    const s = scheduled.horizons && scheduled.horizons[hours];
    const p = passive.horizons && passive.horizons[hours];
    if (s && p) {
      delta[hours] = {
        moneyRatio: p.money ? Math.round((s.money / p.money) * 1000) / 1000 : null,
        netRatio: p.netPerTick ? Math.round((s.netPerTick / p.netPerTick) * 1000) / 1000 : null,
      };
    }
  });
}

const result = JSON.stringify({
  ok: (!scheduled || scheduled.ok) && (!passive || passive.ok),
  gameDir: GAME_DIR,
  seed: SEED,
  wallSeconds: Math.round((Date.now() - wallT0) / 100) / 100,
  mode: 'real doTick: scheduled (upgrade+hire scheduler) vs passive (no intervention)',
  scheduled,
  passive,
  delta,
}, null, 2);

slog('SIM-DONE\n' + result);
const exitCode = (!scheduled || scheduled.ok) && (!passive || passive.ok) ? 0 : 1;
// 显式退出（重要）：本沙箱环境中 node 进程脚本结束后可能长时间不退出（表现为"零 CPU 挂起"）。
// 先等 stdout 刷完再 process.exit，2s 兜底。SIM_DIAG 时间线日志用于定位退出延迟。
const _d0 = Date.now();
const _dpath = 'C:/Users/A1/AppData/Local/Temp/bs-diag.log';
const _dlog = (line) => { if (process.env.SIM_DIAG === '1') { try { fs.appendFileSync(_dpath, line + '\n'); } catch (_) {} } };
_dlog('=== RUN ' + new Date().toISOString() + ' exitCode=' + exitCode + ' ===');
_dlog('E0 pre-write T+0ms');
process.stdout.write(result + '\n');
_dlog('E1 post-write T+' + (Date.now() - _d0) + 'ms writableFinished=' + process.stdout.writableFinished);
function finish() { _dlog('FINISH T+' + (Date.now() - _d0) + 'ms code=' + exitCode); writeSentinel(exitCode); process.exit(exitCode); }
if (process.stdout.writableFinished) finish();
else {
  process.stdout.once('finish', () => { _dlog('STDOUT-FINISH-EVENT T+' + (Date.now() - _d0) + 'ms'); finish(); });
  setTimeout(() => { _dlog('TIMER-FIRED T+' + (Date.now() - _d0) + 'ms'); finish(); }, 2000);
  const _dw = setInterval(() => _dlog('HEARTBEAT T+' + (Date.now() - _d0) + 'ms'), 2000);
  _dw.unref();
}
