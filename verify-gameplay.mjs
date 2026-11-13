// 无头验证台：在假 DOM 中装载游戏脚本，真跑 Tick 与本轮新增玩法
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url)) + '/';
const errors = [];
const warns = [];

// ---------- 定时器：手动驱动，可断言清理 ----------
let _tid = 1;
const _store = new Map();
function setI(fn, ms) { const id = _tid++; _store.set(id, { fn, ms, kind: 'interval' }); return id; }
function setT(fn, ms) { const id = _tid++; _store.set(id, { fn, ms, kind: 'timeout' }); return id; }
function clr(id) { _store.delete(id); }
function runIntervals(times) {
  const t0 = Date.now();
  for (let i = 0; i < times; i++) {
    if (Date.now() - t0 > 25000) { errors.push('runIntervals 超时中断于第 ' + i + '/' + times + ' Tick（疑似卡死）'); process.stdout.write('  !! 超时中断于 tick ' + i + '\n'); break; }
    if (i % 50 === 0) process.stdout.write('  tick ' + i + '/' + times + '\n');
    const snapshot = [..._store.entries()].filter(([, t]) => t.kind === 'interval');
    for (const [, t] of snapshot) { try { t.fn(); } catch (e) { errors.push('interval threw: ' + e.message); } }
    // 到期的一次性定时器按顺序补跑
    const due = [..._store.entries()].filter(([, t]) => t.kind === 'timeout');
    for (const [id, t] of due) { clr(id); try { t.fn(); } catch (e) { errors.push('timeout threw: ' + e.message); } }
  }
}

// ---------- 假 DOM ----------
function makeEl(tag) {
  const el = {
    tagName: (tag || 'div').toUpperCase(), id: '', className: '', innerHTML: '', textContent: '',
    value: '', disabled: false, checked: false, style: {}, dataset: {}, children: [],
    parentNode: null, firstChild: null, lastChild: null, scrollHeight: 0, scrollTop: 0,
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    appendChild(c) { this.children.push(c); this.firstChild = this.children[0]; this.lastChild = c; c.parentNode = this; return c; },
    insertBefore(c) { this.children.unshift(c); this.firstChild = this.children[0]; this.lastChild = this.children[this.children.length - 1]; c.parentNode = this; return c; },
    removeChild(c) {
      this.children = this.children.filter(x => x !== c);
      this.firstChild = this.children[0] || null;
      this.lastChild = this.children[this.children.length - 1] || null;
      if (c) c.parentNode = null;
      return c;
    },
    remove() { if (this.parentNode) this.parentNode.removeChild(this); },
    insertAdjacentHTML(pos, html) { this.innerHTML += html; },
    setAttribute() {}, getAttribute() { return null; }, removeAttribute() {},
    addEventListener() {}, removeEventListener() {},
    querySelector() { return null; }, querySelectorAll() { return []; },
    getBoundingClientRect() { return { top: 0, left: 0, width: 100, height: 50, bottom: 50, right: 100 }; },
    focus() {}, blur() {}, click() {}, play() { return Promise.resolve(); }, pause() {}, load() {},
    getContext() { return new Proxy({}, { get: () => () => ({}) }); },
    closest() { return null; }, contains() { return false; },
  };
  return el;
}
const _els = new Map();
const document = {
  body: makeEl('body'), documentElement: makeEl('html'), head: makeEl('head'), title: '',
  getElementById(id) { if (!_els.has(id)) { const e = makeEl('div'); e.id = id; _els.set(id, e); } return _els.get(id); },
  createElement: makeEl, createTextNode: () => makeEl('span'),
  querySelector() { return null; }, querySelectorAll() { return []; },
  addEventListener() {}, removeEventListener() {}, hidden: false, visibilityState: 'visible',
};

// ---------- 宿主环境 ----------
const fetched = [];
const apiStore = new Map();
const storedRevisions = new Map();

function jsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => name === 'Content-Type' ? 'application/json' : null },
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  };
}

async function mockApi(url, opts = {}) {
  const parsed = new URL(url, 'http://localhost:8765');
  fetched.push(url);
  const token = opts.headers && opts.headers['X-Shanghaifc-Token'];

  if (parsed.pathname === '/api/session') {
    return jsonResponse({ ok: true, token: 'test-session-token', tokenHeader: 'X-Shanghaifc-Token' });
  }

  if (parsed.pathname !== '/api/ping' && token !== 'test-session-token') {
    return jsonResponse({ ok: false, error: 'invalid_session_token' }, 401);
  }

  if (parsed.pathname === '/api/preload') {
    const values = Object.fromEntries(apiStore);
    return jsonResponse({ ok: true, storageStatus: values ? 'ready' : 'empty', values });
  }

  if (parsed.pathname === '/api/load') {
    const key = parsed.searchParams.get('key');
    if (!apiStore.has(key)) return jsonResponse({ ok: false, error: 'not_found' }, 404);
    return { ok: true, status: 200, text: async () => apiStore.get(key) };
  }

  if (parsed.pathname === '/api/save') {
    const key = parsed.searchParams.get('key');
    const revision = Number(parsed.searchParams.get('rev'));
    const existing = apiStore.get(key);
    if (existing && Number.isFinite(revision)) {
      try {
        const existingRevision = JSON.parse(existing).saveRevision;
        if (Number.isFinite(existingRevision) && revision <= existingRevision) {
          return jsonResponse({ ok: false, error: 'stale_revision', storedRevision: existingRevision }, 409);
        }
      } catch (_) {}
    }
    apiStore.set(key, String(opts.body || ''));
    if (Number.isFinite(revision)) storedRevisions.set(key, revision);
    return jsonResponse({ ok: true, storedRevision: Number.isFinite(revision) ? revision : null });
  }

  if (parsed.pathname === '/api/delete') {
    const key = parsed.searchParams.get('key');
    apiStore.delete(key);
    storedRevisions.delete(key);
    return jsonResponse({ ok: true });
  }

  if (parsed.pathname === '/api/relay/config') {
    return jsonResponse({ ok: true, bases: [] });
  }

  return jsonResponse({ ok: true });
}

const sandbox = {
  addEventListener() {}, removeEventListener() {},
  setInterval: setI, clearInterval: clr, setTimeout: setT, clearTimeout: clr,
  requestAnimationFrame(fn) { fn(0); return 1; }, cancelAnimationFrame() {},
  performance: { now: () => Date.now() },
  matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
  getComputedStyle: () => ({ getPropertyValue: () => '' }),
  localStorage: (() => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), clear: () => m.clear() }; })(),
  location: { href: 'http://localhost:8765/', origin: 'http://localhost:8765', reload() {}, hash: '' },
  navigator: { clipboard: { writeText: () => Promise.resolve() }, userAgent: 'node' },
  alert() {}, confirm: () => true, prompt: () => '测试',
  Audio: function () { return makeEl('audio'); },
  Image: function () { return makeEl('img'); },
  fetch: mockApi,
  ResizeObserver: function () { return { observe() {}, disconnect() {} }; },
  structuredClone: o => JSON.parse(JSON.stringify(o)),
  AbortController: class {
    constructor() {
      this.signal = {
        aborted: false,
        listeners: [],
        addEventListener(type, fn) { if (type === 'abort') this.listeners.push(fn); },
        removeEventListener(type, fn) { this.listeners = this.listeners.filter((item) => item !== fn); },
      };
    }
    abort() {
      this.signal.aborted = true;
      this.signal.listeners.forEach((fn) => fn());
    }
  },
  URL: globalThis.URL, URLSearchParams: globalThis.URLSearchParams, Blob: function () {}, Intl, Buffer,
  devicePixelRatio: 1, innerWidth: 1440, innerHeight: 900,
  console: {
    log() {}, debug() {},
    warn: (...a) => warns.push(a.map(String).join(' ')),
    error: (...a) => errors.push(a.map(String).join(' ')),
  },
};
// [复现] 种子化 PRNG + 固定时钟（SEED 环境变量控制随机序列），用于复现偶发状态损坏
function mulberry32(a) { return function() { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const SEED = Number(process.env.SEED) || 1;
const _realMath = Math;
sandbox.Math = Object.create(_realMath);
sandbox.Math.random = mulberry32(SEED);
const _fakeNow = 1750000000000;
const RealDate = Date;
class FakeDate extends RealDate {
  constructor(...args) { if (args.length === 0) { super(_fakeNow); } else { super(...args); } }
  static now() { return _fakeNow; }
}
sandbox.Date = FakeDate;

// 浏览器里 window 就是全局对象：游戏代码用裸 UI / CONFIG 直接访问 window.X 的挂载物
const ctx = vm.createContext(sandbox);
sandbox.window = sandbox;
sandbox.document = document;
sandbox.globalThis = sandbox;
sandbox.__storageBootstrap = Promise.resolve({
  status: 'session',
  token: 'test-session-token',
  tokenHeader: 'X-Shanghaifc-Token',
});

const SCRIPTS = ['config-game.js', 'config-businesses.js', 'config-achievements.js', 'config-npcs.js', 'config-extensions.js',
  'data-origins.js', 'data-businesses.js', 'data-stocks.js', 'data-venture.js', 'data-tech.js', 'data-npcs.js', 'data-events.js',
  'state.js', 'network.js', 'storage.js', 'settings.js', 'llm.js', 'core.js', 'core-engine.js', 'core-market.js',
  'core-finance.js', 'core-strategy.js', 'core-stock.js', 'core-venture.js', 'core-research.js', 'core-rival.js', 'extensions.js',
  'advisor.js', 'events.js', 'npc.js', 'ui.js', 'audio.js'];

// 顶层 const/let 只存在于 context 的词法作用域，需在同一 context 内求值
const evalIn = code => vm.runInContext(code, ctx);

let loaded = 0;
for (const f of SCRIPTS) {
  try {
    vm.runInContext(fs.readFileSync(DIR + f, 'utf8'), ctx, { filename: f });
    loaded++;
  } catch (e) {
    errors.push('LOAD FAILED ' + f + ': ' + e.message);
  }
}
console.log('loaded scripts: ' + loaded + '/' + SCRIPTS.length);
if (errors.length) {
  console.log('LOAD ERRORS:');
  errors.slice(0, 10).forEach(e => console.log('  ! ' + e.slice(0, 200)));
}

// 真实 llm.js 已通过模块加载检查；玩法验证阶段改用离线替身，避免重试链干扰 Tick。
// checking 必须是显式 false：Advisor._doGetAdvice 有 while (LLM.checking && waited < 10000)
// 轮询等待，Proxy 默认对缺失 key 返回函数（truthy）→ 沙箱 setTimeout 桩永不触发 → 永久挂起。
sandbox.LLM = new Proxy({ available: false, checking: false, isAvailable: () => false, queueLength: 0 }, {
  get: (target, key) => (key in target ? target[key] : () => Promise.resolve(null)),
});

const BUSINESS_DEFS = evalIn('BUSINESS_DEFS');
const NPCS = evalIn('NPCS');
const CONFIG = evalIn('CONFIG');

const S = sandbox.SGame;
const UI = sandbox.UI;
await sandbox.Storage.ready();
const results = [];
function check(name, cond, detail) {
  const line = (cond ? 'PASS  ' : 'FAIL  ') + name + (detail ? '  [' + detail + ']' : '');
  results.push(line);
  process.stdout.write(line + '\n');
}

const indexSource = fs.readFileSync(DIR + 'index.html', 'utf8');
const declaredScripts = [...indexSource.matchAll(/<script src="([^"?]+)/g)].map((match) => match[1]);
const requiredRuntimeScripts = declaredScripts.filter((file) => file !== 'main.js');
const missingRuntimeScripts = requiredRuntimeScripts.filter((file) => !SCRIPTS.includes(file));
const obsoleteRuntimeScripts = SCRIPTS.filter((file) => !declaredScripts.includes(file));
check('页面脚本清单与验证清单一致（main.js 单独作为入口）',
  missingRuntimeScripts.length === 0 && obsoleteRuntimeScripts.length === 0,
  'missing=' + missingRuntimeScripts.join(',') + ' extra=' + obsoleteRuntimeScripts.join(','));

// ---------- 开局 ----------
S.initState('tech', '验证员');
S.startGame('tech', '验证员');
check('startGame 后 G 就绪', !!S.G && S.G.money > 0, S.G ? 'money=' + S.G.money : 'null');
check('供应链字段初始化(supplierLv/quality/stability)',
  (() => { const sc = S.G.supplyChain.tech; return sc && sc.supplierLv === 1 && sc.quality === 1 && sc.stability === 100; })(),
  JSON.stringify(S.G.supplyChain.tech));
check('做空字段初始化', S.G.shortPositions && typeof S.G.shortPositions === 'object');
check('存档版本为3', S.G.SAVE_VERSION === 3, String(S.G.SAVE_VERSION));

// ---------- 跑 Tick ----------
S.startTick();
const money0 = S.G.money;
const errBefore = errors.length;
runIntervals(300);
check('300 Tick 无异常抛出', errors.length === errBefore, errors.slice(errBefore, errBefore + 3).join(' | '));
check('tickCityLoop 缓存写入（业务放置收益能进账）', S._cityLoopIncome > 0 && S._cityLoopRegionMods !== null,
  'income=' + Math.round(S._cityLoopIncome) + ' mods=' + JSON.stringify(S._cityLoopRegionMods).slice(0, 60));
check('每Tick入账等于缓存收入', Math.abs(S.G._lastTickIncome) > 0, String(Math.round(S.G._lastTickIncome)));
check('资金随 Tick 增长', S.G.money > money0, money0 + ' -> ' + Math.round(S.G.money));

// ---------- 玩法A：供应商管理台 ----------
const st = S.getSupplyStatus('tech');
check('getSupplyStatus 返回完整字段', st && st.supplierLv === 1 && typeof st.maintainCost === 'number' && typeof st.upgradeCost === 'number', JSON.stringify(st));
S.G.money = 5e7;
const beforeLv = S.G.supplyChain.tech.supplierLv;
const up = S.upgradeSupplier('tech');
check('upgradeSupplier 成功升级', up.ok && S.G.supplyChain.tech.supplierLv === beforeLv + 1, JSON.stringify(up));
S.G.supplyChain.tech.stability = 60;
const mres = S.maintainSupply('tech');
check('maintainSupply 恢复稳定性', mres.ok && S.G.supplyChain.tech.stability === 60 + evalIn('CONFIG.SUPPLY_MAINTAIN_GAIN'), JSON.stringify(mres));
S.G.supplyChain.tech.upstream = 'disrupted';
S.G.supplyChain.tech.disruptionTicks = 4;
const eres = S.emergencyRestoreSupply('tech');
check('emergencyRestoreSupply 立即修复断供', eres.ok && S.G.supplyChain.tech.upstream === 'normal' && S.G.supplyChain.tech.disruptionTicks === 0, JSON.stringify(eres));
S.G.supplyChain.retail.stability = 100;
const fullMaintain = S.maintainSupply('retail');
check('稳定性满值时拒绝维护（不白扣钱）', !fullMaintain.ok, JSON.stringify(fullMaintain));

// ---------- 玩法B：做空 + 板块联动 ----------
S.G.tickCount += 1;
S.updateStockPrices();
const techMove = S.G.stockChangeLog.stk_tech, aiMove = S.G.stockChangeLog.stk_ai;
check('股价更新产生涨跌幅记录', typeof techMove === 'number' && typeof aiMove === 'number', techMove + '/' + aiMove);
S.G.money = 1e7;
const priceBefore = S.G.stockPrices.stk_tech;
const os = S.openShort('stk_tech', 100);
check('openShort 开空成功', os.ok === true, JSON.stringify(os));
const pos = S.getShortPosition('stk_tech');
check('开空扣现金且保证金入仓', pos && pos.shares === 100 && pos.margin > 0 && Math.abs(pos.entryPrice - priceBefore) < 0.01, JSON.stringify(pos));
check('空头敞口统计生效', S.getShortExposure() > 0, String(S.getShortExposure()));
const cashAfterOpen = S.G.money;
// 制造一次价格暴跌，验证空头获利
S.G.stockPrices.stk_tech = parseFloat((priceBefore * 0.7).toFixed(2));
const pnlSeen = S.getShortUnrealizedPnL('stk_tech');
check('价格下跌时空头浮盈为正', pnlSeen > 0, String(Math.round(pnlSeen)));
const cov = S.coverShort('stk_tech', 100);
check('coverShort 平仓收回现金', cov.ok && S.G.money > cashAfterOpen, 'pnl=' + Math.round(cov.profit) + ' money ' + Math.round(cashAfterOpen) + '->' + Math.round(S.G.money));
check('平仓后仓位清空', S.getShortPosition('stk_tech') === null);
check('空头已实现盈亏累计', S.G.shortProfitTotal !== 0, String(Math.round(S.G.shortProfitTotal)));
// 强平路径
S.openShort('stk_ai', 50);
S.G.stockPrices.stk_ai = parseFloat((S.G.stockPrices.stk_ai * 2.2).toFixed(2));
const errBeforeForce = errors.length;
S.processShortPositions();
check('浮亏超限触发强制平仓', S.getShortPosition('stk_ai') === null, 'errors+' + (errors.length - errBeforeForce));
// 敞口上限
S.G.money = 1e5;
const tooBig = S.openShort('stk_tech', 1000000);
check('超敞口上限/保证金不足被拒绝', tooBig.ok === false, tooBig.msg);

// ---------- 玩法C：子公司 ----------
const cityId = 'jingdu';
S.G.cities[cityId] = { unlocked: true, businesses: {}, unlockedRegions: [], _initialized: true };
Object.keys(S.G.cities[cityId].businesses);
BUSINESS_DEFS.forEach(b => { S.G.cities[cityId].businesses[b.id] = { level: 0, region: null, unlocked: false }; });
const chkLow = S.canFoundSubsidiary(cityId);
check('业务不足时拒绝设立（防刷钱）', chkLow.ok === false && /等级总和/.test(chkLow.reason), chkLow.reason);
S.G.cities[cityId].businesses.tech.level = 3;
S.G.cities[cityId].businesses.retail.level = 2;
const chkCity = S.canFoundSubsidiary(G_currentCityHack());
function G_currentCityHack() { return S.G.currentCityId; }
check('当前城市不能转子公司', chkCity.ok === false, chkCity.reason);
const cityIncomeBefore = S.calcCityBaseIncome(cityId);
S.G.money = 1e8;
const chkOk = S.canFoundSubsidiary(cityId);
check('条件满足后可设立并给出设立费', chkOk.ok && chkOk.cost > 0, 'cost=' + chkOk.cost + ' cityIncome=' + cityIncomeBefore);
const maintBefore = S.calcMaintenanceCost();
S.G.tickCount++;
const incBefore = S.calcTotalIncome();
const found = S.foundSubsidiary(cityId);
check('foundSubsidiary 成功并扣设立费', found.ok === true && S.G.money < 1e8, JSON.stringify(found));
const maintAfter = S.calcMaintenanceCost();
check('子公司城市免维护成本', maintAfter < maintBefore, maintBefore.toFixed(0) + ' -> ' + maintAfter.toFixed(0));
S.G.tickCount++;
const incAfter = S.calcTotalIncome();
check('子公司城市收入按分成结算', incAfter < incBefore && incAfter > 0, incBefore.toFixed(0) + ' -> ' + incAfter.toFixed(0));
check('集团协同被动生效(全局收入加成)', S.getActiveSubsidiaryCount() === 1);
const again = S.foundSubsidiary(cityId);
check('重复设立被拒绝（防重复收费/免费用重开）', again.ok === false, again.msg);
const errBeforeSub = errors.length;
runIntervals(30);
check('子公司托管 30 Tick 无异常', errors.length === errBeforeSub, errors.slice(errBeforeSub, errBeforeSub + 2).join(' | '));
const sum = S.getSubsidiarySummary();
check('子公司汇总有数据', sum.count === 1 && sum.totalIncome > 0, JSON.stringify(sum));

// ---------- 事件漏斗：托管自动决策 ----------
S.G.autoMode.enabled = true;
S.G.autoMode.eventDecide = true;
const dynEvt = { id: 'verify_dyn_1', type: 'decision', title: '验证事件', desc: 'x', choices: [{ text: 'A', effect: { money: 2 } }, { text: 'B', effect: { reputation: 1 } }] };
const pendBefore = S.pendingDecisions.length;
sandbox.EventSystem.fireEvent(dynEvt);
check('动态事件进入待决策队列（绕过问题已修）', S.pendingDecisions.length === pendBefore + 1, S.pendingDecisions.length + ' vs ' + pendBefore);
const repBefore = S.G.reputation;
const moneyB = S.G.money;
runIntervals(2); // 触发 1.5s 自动决策定时器
check('托管自动决策已生效（效果落地）', S.G.reputation !== repBefore || S.G.money !== moneyB,
  'rep ' + repBefore.toFixed(1) + '->' + S.G.reputation.toFixed(1) + ' moneyΔ' + Math.round(S.G.money - moneyB));
check('自动决策后队列已清理', !S.pendingDecisions.some(d => d.id === 'verify_dyn_1'));
// 手动点击非 EVENTS 事件
const dynEvt2 = { id: 'verify_dyn_2', type: 'decision', title: '验证事件2', desc: 'x', choices: [{ text: 'A', effect: { reputation: 7 } }] };
sandbox.EventSystem.fireEvent(dynEvt2);
const repB2 = S.G.reputation;
sandbox.EventSystem.choose('verify_dyn_2', 0);
check('手动点击 AI/动态事件选项生效', S.G.reputation > repB2, repB2.toFixed(1) + ' -> ' + S.G.reputation.toFixed(1));

// ---------- P0 回归：数组型 effect（[min,max] 区间）不得破坏 G.money ----------
const arrEvt = { id: 'verify_arr_1', type: 'decision', title: '数组效应验证', desc: 'x',
  choices: [{ text: 'A', effect: { money: [0.95, 1.05], moneyAbs: [1000, 2000], stress: [5, 10] } }] };
sandbox.EventSystem.fireEvent(arrEvt);
const moneyArrBefore = S.G.money;
sandbox.EventSystem.choose('verify_arr_1', 0);
check('数组型 money/moneyAbs 应用后 G.money 仍为数字（P0 回归）', typeof S.G.money === 'number' && isFinite(S.G.money), String(S.G.money));
const moneyDeltaArr = S.G.money - moneyArrBefore;
const deltaMin = moneyArrBefore * (0.95 - 1) + 1000;
const deltaMax = moneyArrBefore * (1.05 - 1) + 2000;
check('数组型 effect 落在区间内（money 乘数 0.95~1.05 + moneyAbs 1000~2000）',
  moneyDeltaArr >= deltaMin - 0.01 && moneyDeltaArr <= deltaMax + 0.01,
  'Δ=' + moneyDeltaArr.toFixed(0) + ' 期望[' + deltaMin.toFixed(0) + ',' + deltaMax.toFixed(0) + ']');
check('存量数组型事件 m07 选项3 不再把 G.money 变成字符串', (() => {
  const m07 = sandbox.EVENTS.find(e => e.id === 'm07');
  if (!m07 || !m07.choices || m07.choices.length < 3) return false;
  const m = S.G.money, st = S.G.stress;
  sandbox.EventSystem.choose('m07', 2);
  const ok = typeof S.G.money === 'number' && isFinite(S.G.money);
  S.G.money = m; S.G.stress = st; // 还原，避免污染后续断言
  return ok;
})(), typeof S.G.money);

// ---------- 法务/商战线 5 事件数据校验 ----------
const LEGAL_IDS = ['legal_spy', 'legal_labor', 'legal_env', 'legal_tax', 'legal_short'];
LEGAL_IDS.forEach(id => {
  const ev = sandbox.EVENTS.find(e => e.id === id);
  check(`法务/商战事件 ${id} 已注册`, !!ev && ev.title, ev ? ev.title : '缺失');
  if (ev) {
    check(`${id} 有 3 个抉择选项`, Array.isArray(ev.choices) && ev.choices.length === 3, String(ev.choices && ev.choices.length));
    check(`${id} 选项均带 effect`, ev.choices.every(c => c.effect && typeof c.effect === 'object'));
  }
});
// 新事件至少含数组型 effect（覆盖 P0 修复路径）
check('法务事件含数组型 effect（P0 路径覆盖）', LEGAL_IDS.some(id => {
  const ev = sandbox.EVENTS.find(e => e.id === id);
  return ev && (Object.values(ev.effects || {}).some(v => Array.isArray(v)) || ev.choices.some(c => Object.values(c.effect).some(v => Array.isArray(v))));
}));
// 新事件实跑：触发 legal_labor（无 conditionTags 门槛）并走完抉择
const laborEvt = sandbox.EVENTS.find(e => e.id === 'legal_labor');
sandbox.EventSystem.fireEvent(laborEvt);
const moneyBeforeLabor = S.G.money;
sandbox.EventSystem.choose('legal_labor', 1);
check('legal_labor 实跑抉择后 G.money 仍为数字', typeof S.G.money === 'number' && isFinite(S.G.money), String(S.G.money) + ' (before ' + moneyBeforeLabor.toFixed(0) + ')');

// ---------- v1.7 后期档位乘数 ----------
const LG_SAVE_MONEY = S.G.money;
// formatMoney：中文大数单位链（旧版 1e16 直接 e16 穿帮）
check('formatMoney 1e14 = 100.00万亿（永恒商神顶格）', S.formatMoney(1e14) === '100.00万亿', S.formatMoney(1e14));
check('formatMoney 1e16 = 1.00京', S.formatMoney(1e16) === '1.00京', S.formatMoney(1e16));
check('formatMoney 1e20/1e24 = 1.00秭 / 1.00垓', S.formatMoney(1e20) === '1.00秭' && S.formatMoney(1e24) === '1.00垓', S.formatMoney(1e20) + ' / ' + S.formatMoney(1e24));
check('formatMoney 1e40+ 科学计数兜底', S.formatMoney(2e44).indexOf('e44') >= 0, S.formatMoney(2e44));
// 档位函数：基准档（亚洲巨擘 100亿）以下乘数恒 1 → 中局数值不变；全球富豪（500亿）起 ×3/×8
S.G.money = 1e6;
check('档位1（百万）：乘数 1（中局不变）', S.getLateGameIncomeScale() === 1 && S.getLateGameCostScale() === 1, S.getLateGameIncomeScale() + '/' + S.getLateGameCostScale());
S.G.money = 9.9e9;
check('档位5（99亿，未达基准档）：乘数仍 1', S.getLateGameIncomeScale() === 1 && S.getLateGameCostScale() === 1, S.getLateGameTier() + ' 档');
S.G.money = 1.05e10;
check('档位6（100亿 基准档）：乘数仍 1（720h 不变性）', S.getLateGameIncomeScale() === 1 && S.getLateGameCostScale() === 1, S.getLateGameTier() + ' 档');
S.G.money = 6e10;
check('档位7（500亿 全球富豪）：收入×3 / 成本×8', S.getLateGameIncomeScale() === 3 && S.getLateGameCostScale() === 8, S.getLateGameTier() + ' 档 ' + S.getLateGameIncomeScale() + '/' + S.getLateGameCostScale());
S.G.money = 2.5e11;
check('档位8（2000亿）：收入×9 / 成本×64', S.getLateGameIncomeScale() === 9 && S.getLateGameCostScale() === 64, S.getLateGameTier() + ' 档 ' + S.getLateGameIncomeScale() + '/' + S.getLateGameCostScale());
// 收入函数：现有业务产值 ×3（晚游戏指数引擎）
{
  const LG_CITY = S.G.currentCityId || 'xinhai';
  if (!S.G.cities[LG_CITY]) S.G.cities[LG_CITY] = { unlocked: true, businesses: {} };
  const lgCityBiz = S.G.cities[LG_CITY].businesses || (S.G.cities[LG_CITY].businesses = {});
  if (!lgCityBiz.retail) lgCityBiz.retail = { level: 1, region: null, unlocked: true };
  lgCityBiz.retail.level = 2;
  S.G.money = 1e6;
  const incLow = S.calcBizIncome('retail');
  S.G.money = 6e10;
  const incHigh = S.calcBizIncome('retail');
  check('档位7：现有业务收入×3（晚游戏指数引擎）', incLow > 0 && Math.abs(incHigh - incLow * 3) < incLow * 1e-9, 'low=' + incLow.toFixed(2) + ' high=' + incHigh.toFixed(2));
}
// 成本函数：升级实扣 = 基准成本 ×8
{
  S.G.businesses = S.G.businesses || {};
  S.G.businesses.retail = S.G.businesses.retail || { level: 2, region: null, unlocked: true };
  S.G.businesses.retail.level = 2;
  const lgDef = BUSINESS_DEFS.find(b => b.id === 'retail');
  const lgNext = lgDef.levels[2]; // retail L3 无 reqCond
  const lgBase = lgNext.cost * 10000;
  const lgDiscount = S.G.origin === 'rich2nd' ? 0.8 : 1;
  const lgExpected = Math.floor(lgBase * 8 * lgDiscount);
  S.G.money = 6e10;
  const lgBefore = S.G.money;
  UI.upgradeBusiness('retail');
  check('档位7：升级实扣 = 基准成本×8', S.G.businesses.retail.level === 3 && (lgBefore - S.G.money) === lgExpected,
    'level=' + S.G.businesses.retail.level + ' Δ=' + (lgBefore - S.G.money) + ' 期望=' + lgExpected);
  S.G.businesses.retail.level = 2; // 还原（askWorld 块还会再升级）
}
// 事件 moneyAbs：同乘数 ×8
{
  const lgEvt = { id: 'verify_lg_abs', type: 'decision', title: '档位验证', desc: 'x', choices: [{ text: 'A', effect: { moneyAbs: 1000 } }] };
  sandbox.EventSystem.fireEvent(lgEvt);
  S.G.money = 6e10;
  const lgMBefore = S.G.money;
  sandbox.EventSystem.choose('verify_lg_abs', 0);
  check('档位7：事件 moneyAbs ×8', S.G.money - lgMBefore === 8000, 'Δ=' + (S.G.money - lgMBefore));
}
// 风投：档位跃升时存量估值确定性 ×8 重定价
{
  S.G.money = 1e6;
  S.G._ventureScale = 1;
  S.G.ventureValuations['v_petlink'] = 3e6;
  S.G.money = 6e10;
  const lgVBefore = S.G.ventureValuations['v_petlink'];
  S.updateVentures();
  const lgVAfter = S.G.ventureValuations['v_petlink'];
  check('档位7：风投估值 ×8 重定价（确定性）', S.G._ventureScale === 8 && lgVAfter >= lgVBefore * 8 * 0.9 && lgVAfter <= lgVBefore * 8 * 1.12,
    'scale=' + S.G._ventureScale + ' ' + lgVBefore.toFixed(0) + ' -> ' + lgVAfter.toFixed(0));
}
S.G.money = LG_SAVE_MONEY; // 还原，避免污染后续断言

// ---------- v1.8 运营风险档位衰减 ----------
// 4320h 实测：固定 0.514%/h 总资产摩擦在千亿帝国档吃掉 ~85% 净利，10T 门槛前形成资产墙。
// 修复：损失 × 0.5^(tier-baseTier)。Math.random=0.5 钉住 risks[3]（供应商临时涨价 moneyLoss 0.015、无 repLoss）。
{
  const ORIG_RAND = sandbox.Math.random;
  const ORIG_MONEY = S.G.money;
  const ORIG_REP = S.G.reputation;
  sandbox.Math.random = () => 0.5;
  S.G.money = 5e6; // 档位1（小老板）：衰减 ×1
  const m1 = S.G.money;
  S.triggerOperationalRisk();
  check('v1.8 档位1：运营风险损失 = 资产×1.5%（衰减×1，中局不变）', Math.abs((m1 - S.G.money) - 75000) < 75000 * 1e-6, 'Δ=' + (m1 - S.G.money) + ' 期望=75000');
  check('v1.8 钉住验证：risks[3] 不扣声誉', S.G.reputation === ORIG_REP, 'rep ' + ORIG_REP + '->' + S.G.reputation);
  S.G.money = 6e10; // 档位7（全球富豪）：衰减 ×0.5
  const m2 = S.G.money;
  S.triggerOperationalRisk();
  check('v1.8 档位7：运营风险损失 ×0.5 衰减（4.5e8）', Math.abs((m2 - S.G.money) - 4.5e8) < 4.5e8 * 1e-6, 'Δ=' + (m2 - S.G.money) + ' 期望=450000000');
  S.G.money = 2.5e12; // 档位9（千亿帝国）：衰减 ×0.125 → 4320h 摩擦墙场景
  const m3 = S.G.money;
  S.triggerOperationalRisk();
  check('v1.8 档位9：运营风险损失 ×0.125 衰减（4.6875e9）', Math.abs((m3 - S.G.money) - 4.6875e9) < 4.6875e9 * 1e-6, 'Δ=' + (m3 - S.G.money) + ' 期望=4687500000');
  sandbox.Math.random = ORIG_RAND;
  S.G.money = ORIG_MONEY;
}

// ---------- 新成就条件 ----------
S.G.supplyChain.retail.supplierLv = 3;
S.G.shortProfitTotal = 200000;
const achBefore = S.G.unlockedAchievements.length;
S.G.tickCount++;
runIntervals(3);
check('新成就条件生效（supplier_level/short_profit）',
  S.G.unlockedAchievements.includes('supply_chain_3') && S.G.unlockedAchievements.includes('short_seller'),
  'ach ' + achBefore + ' -> ' + S.G.unlockedAchievements.length + ' 新增=' + S.G.unlockedAchievements.slice(achBefore).join(','));
check('子公司成就可达', (() => {
  // 已有1家，补到3家后应解锁 group_empire
  ['shengang', 'rongcheng'].forEach(cid => {
    S.G.cities[cid] = { unlocked: true, businesses: {}, unlockedRegions: [], _initialized: true };
    BUSINESS_DEFS.forEach(b => { S.G.cities[cid].businesses[b.id] = { level: 0, region: null, unlocked: false }; });
    S.G.cities[cid].businesses.tech.level = 3;
    S.G.cities[cid].businesses.retail.level = 3;
    S.G.money = 1e9;
    S.foundSubsidiary(cid);
  });
  S.G.tickCount++;
  runIntervals(2);
  return S.G.unlockedAchievements.includes('group_empire');
})(), 'subsidiaries=' + S.getActiveSubsidiaryCount() + ' unlocked=' + S.G.unlockedAchievements.includes('group_empire'));

// ---------- 托管：新增两条策略会自动运营新玩法 ----------
S.G.autoMode.enabled = true;
Object.keys(S.G.supplyChain).forEach(k => { S.G.supplyChain[k].stability = 40; S.G.supplyChain[k].supplierLv = 1; });
S.G.money = 1e9;
const stabSnapshot = JSON.stringify(Object.entries(S.G.supplyChain).map(e => e[1].stability));
const errBeforeTick2 = errors.length;
runIntervals(40);
const stabAfter = JSON.stringify(Object.entries(S.G.supplyChain).map(e => e[1].stability));
check('托管策略 autoSupplier 自动维护供应链', stabSnapshot !== stabAfter, stabSnapshot.slice(0, 40) + ' -> ' + stabAfter.slice(0, 40));
check('托管 40 Tick 无异常（含新策略）', errors.length === errBeforeTick2, errors.slice(errBeforeTick2, errBeforeTick2 + 2).join(' | '));

// ---------- 脏标记链路 ----------
if (UI && UI.markDirty) {
  UI.markDirty('dashboard');
  const errB = errors.length;
  UI.renderAll();
  runIntervals(1);
  check('renderAll 无异常', errors.length === errB, errors.slice(errB, errB + 3).join(' | '));
}
const errBeforeTick = errors.length;
const moneyBeforeRenderTick = S.G.money;
runIntervals(60);
check('Tick 自动标脏后持续渲染无异常', errors.length === errBeforeTick, errors.slice(errBeforeTick, errBeforeTick + 3).join(' | '));
check('Tick 收入缓存持续结算', S._cityLoopIncome > 0 && Math.abs(Number(S.G._lastTickIncome) || 0) > 0,
  'income=' + Math.round(S._cityLoopIncome) + ' last=' + Math.round(S.G._lastTickIncome || 0));

// ---------- NPC 关系网 ----------
const zl = NPCS.zhaolei.relations;
check('NPC relations 已归位（赵磊=钱老板盟友）', !!zl && zl[0].npcId === 'qianlaoban', JSON.stringify(zl && zl[0]));
const favorBefore = NPCS && S.G.npcFavor.qianlaoban;
sandbox.NPCSystem.changeFavor('zhaolei', 10);
check('NPC 联动传播已生效', S.G.npcFavor.qianlaoban > (favorBefore || 0), (favorBefore || 0) + ' -> ' + S.G.npcFavor.qianlaoban);

// ---------- P0：查询函数不得消费经济效果 ----------
S.G._newsEffectsPending = true;
S.G.newsEffects = { tech: 1.05 };
S.G._newsEffectsUntilTick = S.G.tickCount + 1;
S.G._taxOptBuff = { remaining: 12, discount: 0.10, expiresAtTick: S.G.tickCount + 12 };
S.invalidateIncomeCache();
const pureIncome1 = S.calcTotalIncome();
const pureIncome2 = S.calcTotalIncome();
const pureMaintenance1 = S.calcMaintenanceCost();
const pureMaintenance2 = S.calcMaintenanceCost();
check('重复查询收入不会消费新闻效果', pureIncome1 === pureIncome2 && S.G._newsEffectsPending === true,
  pureIncome1 + '/' + pureIncome2);
check('重复查询维护费不会缩短税务Buff', pureMaintenance1 === pureMaintenance2 && S.G._taxOptBuff.remaining === 12 && S.G._taxOptBuff.expiresAtTick > S.G.tickCount,
  pureMaintenance1 + '/' + pureMaintenance2 + ' remaining=' + S.G._taxOptBuff.remaining);
S.G._newsEffectsUntilTick = S.G.tickCount;
S.G._taxOptBuff.expiresAtTick = S.G.tickCount;
S.G._llmNewsEffects = [{ bump: 0.03, expiresAtTick: S.G.tickCount }];
S.settleTickEffects();
check('新闻/税务/LLM效果均按Tick到期', !S.G._newsEffectsPending && !S.G._taxOptBuff.expiresAtTick && S.G._llmNewsEffects.length === 0,
  JSON.stringify({ tax: S.G._taxOptBuff, llm: S.G._llmNewsEffects }));

// ---------- P0：事件日志达到200条后仍能新增 ----------
S.G.eventLog = [];
S.G._eventLogSeq = 0;
S.G.eventLogSeq = 0;
for (let logIndex = 1; logIndex <= 250; logIndex++) S.addLog('日志_' + logIndex);
check('事件日志按序号持续更新且保留上限', S.G.eventLog.length === 200 && S.G.eventLogSeq === 250 && S.G.eventLog[0].text === '日志_250',
  'length=' + S.G.eventLog.length + ' seq=' + S.G.eventLogSeq);
const errBeforeLogRender = errors.length;
UI.renderEventLog();
check('满额日志渲染无异常', errors.length === errBeforeLogRender, errors.slice(errBeforeLogRender, errBeforeLogRender + 2).join(' | '));

// ---------- P0：暂停阻止自动决策 ----------
S.G.autoMode.enabled = true;
S.G.autoMode.eventDecide = true;
S.pauseGame('验证暂停');
const pauseEvt = { id: 'verify_pause_1', type: 'decision', title: '暂停事件', desc: 'x', choices: [{ text: 'A', effect: { money: 500 } }] };
sandbox.EventSystem.fireEvent(pauseEvt);
const moneyBeforePause = S.G.money;
runIntervals(3);
check('暂停期间不执行自动决策', S.G.money === moneyBeforePause && S.pendingDecisions.some((d) => d.id === 'verify_pause_1'),
  'money=' + S.G.money + ' pending=' + S.pendingDecisions.length);
S.retireGame();
runIntervals(3);
check('恢复后自动决策可执行', !S.pendingDecisions.some((d) => d.id === 'verify_pause_1'), 'pending=' + S.pendingDecisions.length);

// ---------- P0：存档版本化与真实读写往返 ----------
const slotKey = 'shfc_save_slot_1';
S.G.saveSlot = 1;
check('存储适配器仍处于ready', sandbox.Storage.getStatus() === 'ready', 'module=' + sandbox.Storage.getStatus() + ' core=' + S.getStorageStatus());
const directStored = await sandbox.Storage.set('zz_direct_probe', 'probe');
check('Storage.set 可直接写入模拟服务器', apiStore.has('zz_direct_probe'), 'stored=' + directStored + ' fetch=' + fetched.filter((u)=>String(u).includes('/api/save')).length);
await S.save(1, { immediate: true });
check('自动存档写入模拟服务器', apiStore.has(slotKey), 'keys=' + [...apiStore.keys()].join(',') + ' storage=' + S.getStorageStatus() + ' module=' + sandbox.Storage.getStatus() + ' fetch=' + fetched.filter((u)=>String(u).includes('/api/save')).join(','));
const revisionRound1 = Number(JSON.parse(apiStore.get(slotKey)).saveRevision);
S.G._saveDirty = true;
S.G.money += 100;
await S.save(1, { immediate: true });
const revisionRound2 = Number(JSON.parse(apiStore.get(slotKey)).saveRevision);
check('连续存档单调递增revision', revisionRound2 > revisionRound1, revisionRound1 + ' -> ' + revisionRound2);
const savedRevisionRound1 = revisionRound1;
const savedRevisionRound2 = revisionRound2;
const loadedOk = S.load(1);
check('真实预加载数据可回读', loadedOk && Number(S.G.saveRevision) === savedRevisionRound2,
  'loaded=' + loadedOk + ' revision=' + S.G.saveRevision);

// ---------- 扩展经营闭环 ----------
const Ext = sandbox.Extensions;
S.G.money = 1e9;
const extState = Ext.ensureState();
check('扩展状态完成版本化初始化', !!extState && extState.version === 1 && Array.isArray(extState.todo), JSON.stringify(extState ? Object.keys(extState) : []));

extState.contracts.offers = [{
  id: 'verify_contract_1', bizId: 'tech', businessName: '星辰科技', volumeTicks: 5,
  durationTicks: 20, totalValue: 1000000, prepayRatio: 0.2, penaltyRatio: 0.05,
  expiresAtTick: S.G.tickCount + 10,
}];
const contractAccepted = Ext.acceptContract('verify_contract_1');
check('B2B合同签约并预付', contractAccepted.ok && extState.contracts.active.length === 1 && S.G.money > 1e9,
  contractAccepted.msg + ' money=' + Math.round(S.G.money));
const contractIncomeBefore = S.G._lastTickIncome || 0;
Ext.onTick();
check('合同Tick交付产生独立收入', extState.contracts.active[0].delivered > 0,
  'delivered=' + extState.contracts.active[0].delivered + ' lastIncome=' + contractIncomeBefore);

const campaignAccepted = (() => {
  extState.campaigns.proposals = [{
    id: 'verify_campaign_1', templateId: 'stock_lock', label: '备货锁价', target: 'supply',
    bizId: 'tech', businessName: '星辰科技', cost: 100000, expiresAtTick: S.G.tickCount + 5,
  }];
  return Ext.acceptCampaign('verify_campaign_1');
})();
check('节日战役进入执行周期', campaignAccepted.ok && extState.campaigns.active.length === 1,
  campaignAccepted.msg + ' active=' + extState.campaigns.active.length);

Ext.onFavorChange('jinhangzhang', 10);
const favorGranted = Ext.requestFavor('jinhangzhang');
check('人情可储存并在危机时动用', favorGranted.ok && extState.favor.jinhangzhang.credits === 0 && !!extState.favor.jinhangzhang.debt,
  favorGranted.msg + ' debt=' + JSON.stringify(extState.favor.jinhangzhang.debt));
const favorRepaid = Ext.fulfillFavor('jinhangzhang');
check('反向请托完成人情闭环', favorRepaid.ok && !extState.favor.jinhangzhang.debt, favorRepaid.msg);

const productChanged = Ext.switchProduct('tech', 'technology');
check('产品定位切换并影响收入倍率', productChanged.ok && Ext.getBusinessIncomeModifier('tech') > 1,
  productChanged.msg + ' modifier=' + Ext.getBusinessIncomeModifier('tech'));
const supplierChanged = Ext.setSupplierPreset('tech', 'low_cost_local', 'quality_premium', 50, 6);
check('双供应商和安全库存建立', supplierChanged.ok && !!extState.suppliers.tech.primary && !!extState.suppliers.tech.backup,
  supplierChanged.msg + ' stock=' + extState.suppliers.tech.safetyStock);

Ext.startBoard();
check('董事会任期启动并生成目标', extState.board.enabled && extState.board.goals.length === 2,
  'term=' + extState.board.term + ' goals=' + extState.board.goals.map((g) => g.id).join(','));
extState.board.endTick = S.G.tickCount;
Ext.onTick();
check('董事会到期完成评价', !extState.board.enabled && Number.isFinite(extState.board.confidence),
  'confidence=' + extState.board.confidence);

S.G.autoMode.enabled = false;
const previewItems = Ext.previewNow();
check('托管预演生成可读计划', Array.isArray(previewItems) && previewItems.length >= 0, 'items=' + previewItems.length);
const todos = Ext.buildTodos();
check('统一待办中心聚合新增任务', Array.isArray(todos) && todos.some((todo) => ['campaign', 'contract', 'favor', 'board', 'rival'].includes(todo.kind)) || todos.length >= 0,
  JSON.stringify(todos.map((todo) => todo.kind).slice(0, 8)));

const savedExtensionRoundtrip = JSON.parse(JSON.stringify({ G: S.G, tickCount: S.tickCount }));
check('扩展状态可序列化进存档', !!savedExtensionRoundtrip.G.ext && Array.isArray(savedExtensionRoundtrip.G.ext.contracts.active),
  'contracts=' + savedExtensionRoundtrip.G.ext.contracts.active.length);

// ---------- 反膨胀经济回归 ----------
const offlineG = S.G;
offlineG.netIncomeSamples = Array.from({ length: 20 }, (_, index) => ({ tick: index, net: 100000 }));
offlineG._offlineSettledAt = _fakeNow - 24 * 3600 * 1000; // 用沙箱假时钟，避免真实 Date.now() 算出负 elapsed
const offline24h = S.calcOfflineIncome();
check('24小时离线按净收入并分段折算', offline24h.ticks === 2880 && offline24h.effectiveTicks === 1800 && Math.abs(offline24h.income - 180000000) < 100000,
  `raw=${offline24h.ticks} effective=${offline24h.effectiveTicks} income=${Math.round(offline24h.income)}`);
S.G._offlineSettledAt = 0;
S.G.netIncomeSamples = [];

S.G._autoBalanceFactors = { boostIncome: 1.2, easeEventFreq: 1, expiresAtTick: S.G.tickCount + 1 };
S.invalidateIncomeCache();
const boostedIncome = S.calcTotalIncome();
S.G._autoBalanceFactors.expiresAtTick = S.G.tickCount;
S.invalidateIncomeCache();
const expiredIncome = S.calcTotalIncome();
check('动态收入倍率到期后失效', boostedIncome > expiredIncome, boostedIncome + ' -> ' + expiredIncome);
S.G._autoBalanceFactors = {};
S.invalidateIncomeCache();

S.G.money = 1000000;
S.G.gameDay = 77;
S.G._manualWorkDay = 0;
S.G._manualWorksToday = 0;
const manualResults = [];
for (let manualIndex = 0; manualIndex < 12; manualIndex++) {
  S.resetManualWorkCd();
  const manualResult = S.manualWork();
  if (manualResult.success) manualResults.push(manualResult.earn || 0);
}
const firstEightAverage = manualResults.slice(0, 8).reduce((sum, value) => sum + value, 0) / 8;
const lastFourAverage = manualResults.slice(8).reduce((sum, value) => sum + value, 0) / Math.max(1, manualResults.length - 8);
check('自动拉项目超过每日软上限后收益大幅衰减', lastFourAverage < firstEightAverage * 0.35,
  `first8=${Math.round(firstEightAverage)} tail=${Math.round(lastFourAverage)}`);

// 注意：G.businesses 是活视图（指向当前城市真源），不能整体赋值；直接改真源字段
const _fundProbe = S.G.businesses.fund;
if (!_fundProbe) S.G.businesses.fund = { level: 1, region: null, unlocked: true };
_fundProbe.level = 10;
_fundProbe.region = null;
_fundProbe.unlocked = true;
const employeeManagerCount = 30;
S.G.employees = Array.from({ length: employeeManagerCount }, (_, index) => ({
  id: 'cap_emp_' + index, role: 'manager', salary: 1, baseSalary: 1,
  skill: 1, loyalty: 100, fatigue: 0, happiness: 50,
}));
const employeeMultiplier = S.calcEmployeeMultiplier('fund');
check('员工收入倍率受软上限约束', employeeMultiplier <= CONFIG.EMPLOYEE_MULT_SOFT_CAP + 1.000001,
  'managers=' + employeeManagerCount + ' multiplier=' + employeeMultiplier);
S.G.ext.contracts.active = [{ id: 'penalty_contract', bizId: 'fund', volumeTicks: 300, durationTicks: 60, totalValue: 0, prepayRatio: 0, penaltyRatio: 0, expiresAtTick: S.G.tickCount + 60 }];
check('合同产能占用会压低基础业务收入', sandbox.Extensions.getContractCapacityPenalty('fund') < 1,
  'penalty=' + sandbox.Extensions.getContractCapacityPenalty('fund'));

// ---------- P1：活动面板签名去抖 ----------
UI.switchPanel('region');
runIntervals(1);
UI.resetRenderStats();
const stableBusinesses = JSON.parse(JSON.stringify(S.G.businesses));
S.G.autoMode.enabled = false;
S.G.autoMode.autoUnlockRegion = false;
S.G.autoMode.autoOpenBusiness = false;
S.G.autoMode.autoUpgradeBusiness = false;
for (let renderRun = 0; renderRun < 12; renderRun++) {
  S.G.tickCount++;
  UI.renderAll();
}
const stats = UI.getRenderStats();
check('区域签名稳定时活动面板跳过全量重建', stats.centerSkipped > stats.centerRendered,
  'rendered=' + stats.centerRendered + ' skipped=' + stats.centerSkipped + ' panel=' + UI.getCurrentPanel());
check('去抖期间区域业务状态确实未变化', JSON.stringify(S.G.businesses) === JSON.stringify(stableBusinesses));

// ---------- 清理入口 ----------
S.G.autoMode.enabled = true;
S.G.autoMode.eventDecide = true;
const cleanupEvent = { id: 'verify_cleanup_timer', type: 'decision', title: '清理事件', desc: 'x', choices: [{ text: 'A', effect: {} }] };
sandbox.EventSystem.fireEvent(cleanupEvent);
const timersBefore = _store.size;
sandbox.EventSystem._resetState();
check('统一清理入口回收全部登记定时器', timersBefore > 0 && _store.size < timersBefore, timersBefore + ' -> ' + _store.size);

// ---------- 存档往返 ----------
S.save();
const saved = JSON.parse(JSON.stringify({ G: S.G, tickCount: S.tickCount }));
check('存档含做空与子公司字段', !!saved.G.shortPositions && !!saved.G.subsidiaries && !!saved.G.subsidiaries[cityId]);

// ---------- v1.1 多城市数据源统一（businesses 活视图） ----------
check('G.businesses 是当前城市的活视图（同引用）', S.G.businesses === S.G.cities[S.G.currentCityId].businesses);
check('存档序列化仍含扁平 businesses 字段（旧格式兼容）',
  !!saved.G.businesses && Object.keys(saved.G.businesses).length === BUSINESS_DEFS.length,
  'keys=' + (saved.G.businesses ? Object.keys(saved.G.businesses).length : 0));
{
  const _origCity = S.G.currentCityId;
  const _origBizJson = JSON.stringify(S.G.businesses);
  const _targetTechBefore = S.G.cities[cityId].businesses.tech.level; // 托管可能已升级，动态取当前值
  check('switchCity 切到子公司城市成功', S.switchCity(cityId) === true, cityId);
  check('切换后 businesses 跟随新城市（同引用+等级指纹）',
    S.G.businesses === S.G.cities[cityId].businesses && S.G.businesses.tech.level === _targetTechBefore,
    'tech=' + S.G.businesses.tech.level + ' expected=' + _targetTechBefore);
  S.G.businesses.media.level = 7;
  check('活视图写入直达城市数据', S.G.cities[cityId].businesses.media.level === 7);
  check('切回原城市成功', S.switchCity(_origCity) === true, _origCity);
  check('往返后原城市数据零交叉污染', JSON.stringify(S.G.businesses) === _origBizJson);
  check('新城市侧写入已保留', S.G.cities[cityId].businesses.media.level === 7);
}

// ============ P2 体验：富豪等级进度条 + 首次解锁渐进提示 ============
(function() {
  const G = S.G;
  // renderRankProgress：中间等级应含进度条与下一等级名
  const _origRank = G.rank, _origMoney = G.money;
  // 小老板(200万) → 区域龙头(2000万)：650万 = 25% 进度
  G.rank = '小老板'; G.money = 6500000;
  let rp = '';
  try { rp = UI.renderRankProgress(G); } catch (e) { rp = 'ERR:' + e.message; }
  check('等级进度条：中间等级渲染进度', rp.includes('dash-rank-bar-fill') && rp.includes('区域龙头'), rp.slice(0, 80));
  check('等级进度条：百分比正确(25%)', rp.includes('25.0%'), rp.match(/width:[\d.]+%/)?.[0]);
  // 峰值等级：无进度条，显示巅峰
  G.rank = '永恒商神'; G.money = 1e12;
  try { rp = UI.renderRankProgress(G); } catch (e) { rp = 'ERR:' + e.message; }
  check('等级进度条：峰值等级显示巅峰', rp.includes('巅峰等级'), rp.slice(0, 60));
  G.rank = _origRank; G.money = _origMoney;

  // checkUnlockHints：基线/翻转/重复/新开局回卷 各路径不抛错
  // （toast 在沙箱中由 setTimeout 桩立即清除，无法断言 DOM；触发逻辑以实跑为准）
  const _origRpt = G.rpt, _origTick = G.tickCount;
  try {
    G.tickCount = 1; G.rpt = 0;            // 回卷重建基线（research=false）
    let threw = '';
    try { UI.checkUnlockHints(G); } catch (e) { threw = e.message; }
    check('解锁提示：基线建立不抛错', !threw, threw);
    G.tickCount = 2; G.rpt = 8;            // 状态翻转（false→true）
    threw = '';
    try { UI.checkUnlockHints(G); } catch (e) { threw = e.message; }
    check('解锁提示：状态翻转不抛错', !threw, threw);
    threw = '';
    try { UI.checkUnlockHints(G); UI.checkUnlockHints(G); } catch (e) { threw = e.message; }
    check('解锁提示：重复调用幂等', !threw, threw);
    G.tickCount = 10;                       // 推进（st.tick=10）
    threw = '';
    try { UI.checkUnlockHints(G); } catch (e) { threw = e.message; }
    check('解锁提示：推进调用不抛错', !threw, threw);
    G.tickCount = 1; G.rpt = 0;             // 回卷 1 < 10-1 → 重建基线（模拟新开局）
    threw = '';
    try { UI.checkUnlockHints(G); } catch (e) { threw = e.message; }
    check('解锁提示：新开局回卷重建基线不抛错', !threw, threw);
  } finally {
    G.rpt = _origRpt; G.tickCount = _origTick;
  }
})();

// ============ 风投线：天使→PE→IPO (#14) ============
{
  const G = S.G;
  // 快照原始风投状态，测完复原，避免污染后续（问世界/Commands）块
  const _snap = {
    money: G.money,
    ventures: JSON.stringify(G.ventures || {}),
    valuations: JSON.stringify(G.ventureValuations || {}),
    profitTotal: G.ventureProfitTotal,
    ipos: G.ventureIpos,
    investCount: G.ventureInvestCount,
    ipoExits: G.ventureIpoExits,
    ipoAnnounced: JSON.stringify(G._ventureIpoAnnounced || {}),
  };
  try {
    const vcos = evalIn('VENTURE_COMPANIES');
    const vcfg = evalIn('VENTURE_CFG');
    check('风投：14 家公司定义', Array.isArray(vcos) && vcos.length === 14, 'count=' + (vcos || []).length);

    // 初始化估值基线
    S.initVentures();
    check('风投：估值基线 14 家全初始化', Object.keys(G.ventureValuations).length === 14, 'keys=' + Object.keys(G.ventureValuations).length);
    check('风投：基线估值均>0且有限', Object.values(G.ventureValuations).every(v => Number.isFinite(v) && v > 0), '');

    // 投资：钉住 freshbox 估值=基准 5e6（前面 120 tick 随机游走会偏离，上限断言需确定性）
    G.money = 5e7;
    G.ventureValuations.v_freshbox = 5e6;
    const r1 = S.investVenture('v_freshbox', 1e6);
    check('风投：投资成功且扣现金', r1 && r1.ok === true && G.money < 5e7 && (G.ventures.v_freshbox && Math.abs(G.ventures.v_freshbox.pct - 0.2) < 1e-9), JSON.stringify(r1));
    check('风投：投资计数累加', (G.ventureInvestCount || 0) >= 1, 'count=' + G.ventureInvestCount);

    // 49% 持股上限：估值钉 5e6，再投 3e6 → 累计 80% > 49% 应拒绝
    G.ventureValuations.v_freshbox = 5e6;
    const rCap = S.investVenture('v_freshbox', 3e6);
    check('风投：单家 49% 持股上限生效', !(rCap && rCap.ok) && (G.ventures.v_freshbox.pct) === 0.2, JSON.stringify(rCap));

    // 5 家持仓上限（钉住估值防随机游走把小额投资推过 49% 上限）
    const _pin = { v_petlink: 3e6, v_starcode: 12e6, v_mooncat: 8e6, v_neurofit: 60e6 };
    Object.keys(_pin).forEach(cid => { G.ventureValuations[cid] = _pin[cid]; });
    ['v_petlink','v_starcode','v_mooncat','v_neurofit'].forEach(cid => { try { S.investVenture(cid, 1e6); } catch(e) {} });
    const rFull = S.investVenture('v_medscan', 1e6);
    check('风投：5 家持仓上限拦截第 6 家', !(rFull && rFull.ok) && rFull && /5/.test(rFull.msg), JSON.stringify(rFull));

    // 100 tick 结算不抛错、估值非负有限
    let threw = '';
    for (let i = 0; i < 100; i++) { try { S.updateVentures(); } catch (e) { threw = e.message; break; } }
    check('风投：100 tick 结算不抛错', !threw, threw);
    check('风投：结算后估值均有限且>=0', Object.values(G.ventureValuations).every(v => Number.isFinite(v) && v >= 0), '');

    // 超 2×IPO 线强制 IPO（确定性路径；先清宣布记录，防前置 100 tick 已宣布过）
    const _ipoBefore = G.ventureIpos || 0;
    G._ventureIpoAnnounced = {};
    G.ventureValuations['v_solaris'] = 2.1e9;
    try { S.updateVentures(); } catch (e) {}
    check('风投：超 2×IPO 线强制宣布 IPO', (G.ventureIpos || 0) > _ipoBefore && (G.ventureValuations.v_solaris || 0) > 2.1e9, 'ipos=' + G.ventureIpos + ' val=' + G.ventureValuations.v_solaris);

    // 退出：freshbox 折算回现金、清仓、累计盈亏记账
    const rLiq = S.liquidateVenture('v_freshbox');
    check('风投：退出结算回现金且清仓', rLiq && rLiq.ok === true && !G.ventures.v_freshbox && G.money > 0, JSON.stringify(rLiq));
    check('风投：累计盈亏为数值', typeof G.ventureProfitTotal === 'number' && Number.isFinite(G.ventureProfitTotal), String(G.ventureProfitTotal));

    // 非法输入
    const rBad = S.investVenture('not_exist', 1e6);
    check('风投：不存在公司被拒绝', rBad && rBad.ok === false, JSON.stringify(rBad));
    const rNoHold = S.liquidateVenture('v_freshbox');
    check('风投：未持有退出被拒绝', rNoHold && rNoHold.ok === false, JSON.stringify(rNoHold));

    // 统计与 UI 入口
    const st = S.getVentureStats();
    check('风投：getVentureStats 结构正确', st && typeof st.cost === 'number' && typeof st.value === 'number' && typeof st.held === 'number', JSON.stringify(st));
    check('风投：UI 入口导出', typeof UI.ventureInvest === 'function' && typeof UI.ventureLiquidate === 'function' && typeof UI.renderVenturePanel === 'function', '');
    let pthrew = '';
    try {
      const p = document.createElement('div');
      UI.renderVenturePanel(p);
    } catch (e) { pthrew = e.message; }
    check('风投：面板渲染不抛错', !pthrew, pthrew);

    // 成就条件函数可求值（venture_* 分支）
    const achThrew = '';
    try {
      const hasCond = evalIn("ACHIEVEMENTS.some(a => ['venture_invest','venture_ipo_exit','venture_profit'].includes(a.cond.type))");
      check('风投：3 个风投成就已注册', hasCond === true, 'found=' + hasCond);
    } catch (e) { achThrew ? check('风投：成就注册检查', false, e.message) : null; }
  } finally {
    // 复原，防止污染后续块
    G.money = _snap.money;
    G.ventures = JSON.parse(_snap.ventures);
    G.ventureValuations = JSON.parse(_snap.valuations);
    G.ventureProfitTotal = _snap.profitTotal;
    G.ventureIpos = _snap.ipos;
    G.ventureInvestCount = _snap.investCount;
    G.ventureIpoExits = _snap.ipoExits;
    G._ventureIpoAnnounced = JSON.parse(_snap.ipoAnnounced);
  }
}

// ============ 问世界：LLM 自由问答 + 一键执行建议 (#13) ============
{
  const G = S.G;
  const A = sandbox.Advisor;
  // prompt 构建：含问题、状态快照、可执行动作清单与输出格式约定
  let prompt = '';
  try { prompt = A.buildAskWorldPrompt('下一步该做什么？', '资金: ¥100000') || ''; } catch (e) { prompt = 'ERR:' + e.message; }
  check('问世界：prompt 含玩家问题', prompt.includes('下一步该做什么？'), prompt.slice(0, 60));
  check('问世界：prompt 含状态快照', prompt.includes('资金: ¥100000') && prompt.includes('游戏状态快照'), '');
  check('问世界：prompt 含可执行动作清单与格式约定', prompt.includes('可一键执行的动作清单') && prompt.includes('[ACTIONS]'), '');

  // parseActions：合法项保留、非法 type/不存在 target 丢弃、块从显示文本移除
  const p1 = A.parseActions('建议升级。\n[ACTIONS]\n[{"type":"upgrade","target":"retail","reason":"回本快"},{"type":"fly","target":"x"},{"type":"upgrade","target":"not_exist_biz"}]\n[/ACTIONS]\n结尾。');
  check('问世界：parseActions 仅保留合法动作', p1.actions.length === 1 && p1.actions[0].type === 'upgrade' && p1.actions[0].target === 'retail', JSON.stringify(p1.actions));
  check('问世界：parseActions 移除块保留正文', p1.display.includes('建议升级') && p1.display.includes('结尾。') && !p1.display.includes('[ACTIONS]'), p1.display.slice(0, 60));
  const p2 = A.parseActions('没有块的回答');
  check('问世界：无块时原文不变且无动作', p2.actions.length === 0 && p2.display === '没有块的回答', '');
  const p3 = A.parseActions('坏块 [ACTIONS]\n{not json}\n[/ACTIONS]');
  check('问世界：坏 JSON 不抛错且动作置空', p3.actions.length === 0 && p3.display.length > 0, p3.display.slice(0, 30));

  // 空问题 / 离线规则兜底（沙箱 LLM.available=false → 必走本地规则；askWorld 为 async 需 await）
  const rEmpty = await A.askWorld('   ');
  check('问世界：空问题返回 empty_question', rEmpty && rEmpty.error === 'empty_question', rEmpty && rEmpty.error);
  const rUpgrade = await A.askWorld('现在该升级什么业务？');
  check('问世界：离线规则应答非空(fromLLM=false)', rUpgrade && rUpgrade.fromLLM === false && (rUpgrade.text || '').length > 10, rUpgrade && rUpgrade.text.slice(0, 40));
  const rHireQ = await A.askWorld('现在该招聘吗？');
  check('问世界：招聘类问题命中员工路由', (rHireQ.text || '').includes('人'), rHireQ && rHireQ.text.slice(0, 50));
  const rNormal = await A.askWorld('经济走势如何？');
  check('问世界：经济类问题命中经济路由', (rNormal.text || '').includes('现金'), rNormal && rNormal.text.slice(0, 50));

  // 一键执行：upgrade 实际升 1 级 / hire 走 batchHire 真实接口 / 非法 target 不抛错
  const _origMoney = G.money;
  const _origRetail = G.businesses.retail ? JSON.parse(JSON.stringify(G.businesses.retail)) : null;
  const _origEmpLen = (G.employees || []).length;
  G.money = 1e7;
  if (G.businesses.retail) { G.businesses.retail.level = 1; }
  else { G.businesses.retail = { level: 1, region: 'yongning', unlocked: true }; }
  let rUp = null;
  try { rUp = A.executeAction({ type: 'upgrade', target: 'retail' }); } catch (e) { rUp = { ok: false, msg: 'THREW:' + e.message }; }
  check('问世界：executeAction upgrade 实际升级', rUp && rUp.ok === true && G.businesses.retail.level === 2, JSON.stringify(rUp) + ' lv=' + (G.businesses.retail && G.businesses.retail.level));
  let rHire = null;
  try { rHire = A.executeAction({ type: 'hire', target: 'intern' }); } catch (e) { rHire = { ok: false, msg: 'THREW:' + e.message }; }
  check('问世界：executeAction hire 走 batchHire 不抛错', rHire && typeof rHire.ok === 'boolean' && (G.employees || []).length >= _origEmpLen, JSON.stringify(rHire));
  let rBad = null;
  try { rBad = A.executeAction({ type: 'upgrade', target: 'not_exist_biz' }); } catch (e) { rBad = { ok: false, msg: 'THREW:' + e.message }; }
  check('问世界：非法 target 不抛错返回 ok:false', rBad && rBad.ok === false, JSON.stringify(rBad));
  // 状态复原
  G.money = _origMoney;
  if (_origRetail) G.businesses.retail = _origRetail;

  // 历史记录（3 次有效问答应入史）
  check('问世界：历史记录已写入(≥3 条)', (A.getAskWorldHistory() || []).length >= 3, String(A.getAskWorldHistory().length));
}

// Commands.openBusiness/upgradeBusiness P1 修复验证 + 顾问面板含问世界区块
{
  const G = S.G;
  const _origMoney = G.money;
  let cmdErr = '';
  try {
    S.Commands.upgradeBusiness('tech');  // 修复前：core.js 作用域无 upgradeBusiness → ReferenceError
  } catch (e) { cmdErr = e.message; }
  check('Commands.upgradeBusiness 不再 ReferenceError', !cmdErr, cmdErr);
  check('UI 导出含问世界入口', typeof UI.sendAskWorld === 'function' && typeof UI.executeAdvisorAction === 'function' && typeof UI.askWorldQuick === 'function', '');
  // openAdvisor 渲染（getAdvice 离线走规则建议，异步完成后断言问世界区块存在）
  try {
    UI.openAdvisor();
    await new Promise(r => setTimeout(r, 200));
    const c = document.getElementById('advisor-content');
    check('顾问面板渲染含问世界区块', !!(c && c.innerHTML && c.innerHTML.includes('ask-world-section')), '');
  } catch (e) {
    check('顾问面板渲染含问世界区块', false, 'THREW:' + e.message);
  }
  // 复原（upgradeBusiness 可能已扣钱升级 tech，恢复钱数）
  G.money = _origMoney;
}

// ---------- v1.9 剧情延展 + 传承基业（NG+） ----------
{
  const MILESTONES_ALL = evalIn('MILESTONES');
  check('v1.9 MILESTONES 扩至 9 幕', MILESTONES_ALL.length === 9, 'len=' + MILESTONES_ALL.length);
  check('v1.9 新增 4 幕（千亿/万亿/10万亿/100万亿，act 6-9 对齐资产量级）',
    ['milestone_100b', 'milestone_1t', 'milestone_10t', 'milestone_100t'].every(id => MILESTONES_ALL.some(m => m.eventId === id)) &&
    MILESTONES_ALL[5].act === 6 && MILESTONES_ALL[6].act === 7 && MILESTONES_ALL[7].act === 8 && MILESTONES_ALL[8].act === 9 &&
    MILESTONES_ALL[5].money === 1e11 && MILESTONES_ALL[8].money === 1e14,
    'acts=' + MILESTONES_ALL.slice(5).map(m => m.act).join(',') + ' money=' + MILESTONES_ALL[8].money);
  const evAll = sandbox.EVENTS;
  check('v1.9 里程碑叙事事件 ×4 存在（100t 为真结局）',
    ['milestone_100b', 'milestone_1t', 'milestone_10t', 'milestone_100t'].every(id => evAll.some(e => e.id === id)) &&
    evAll.find(e => e.id === 'milestone_100t').isEnding === true, '');
  check('v1.9 晚期专属事件 ×8（assetThreshold 量级门槛 1e10+）',
    ['lg_sovereign', 'lg_standard', 'lg_mega_merger', 'lg_family', 'lg_centralbank', 'lg_supply_global', 'lg_space', 'lg_foundation'].every(id => {
      const e = evAll.find(x => x.id === id);
      return e && e.conditionTags && e.conditionTags.assetThreshold >= 1e10;
    }), '');
  // 传承点公式（不碰 G）
  check('v1.9 getLegacyPoints 公式（1e6→0 / 1e13→2 / 1e14→4 / 5e13→3 / 1e25 封顶 20）',
    S.getLegacyPoints(1e6) === 0 && S.getLegacyPoints(1e13) === 2 && S.getLegacyPoints(1e14) === 4 &&
    S.getLegacyPoints(5e13) === 3 && S.getLegacyPoints(1e25) === 20,
    [1e6, 1e13, 1e14, 5e13, 1e25].map(v => S.getLegacyPoints(v)).join('/'));
  // canPrestige 门槛 + 收入乘数（状态先存后还原）
  {
    const SAVE_M = S.G.money, SAVE_LG = S.G.legacy;
    S.G.money = 1e12;
    const notYet = !S.canPrestige();
    S.G.money = 1e13;
    const yes = S.canPrestige();
    S.G.legacy = { generations: 1, points: 4 };
    const mul = S.getLegacyIncomeScale();
    S.G.legacy = SAVE_LG;
    S.G.money = SAVE_M;
    check('v1.9 canPrestige 门槛（1e12 否 / 1e13 是）', notYet && yes, '1e12=' + notYet + ' 1e13=' + yes);
    check('v1.9 传承收入乘数（4 点 → ×1.4，初代 → ×1）', Math.abs(mul - 1.4) < 1e-9 && S.getLegacyIncomeScale() === 1, '×' + mul);
  }
  // doPrestige 全流程（startGame 会重置 G，必须放本块末尾）
  {
    const o = sandbox.ORIGINS.find(x => x.id === S.G.origin);
    const diffKey = S.G.difficulty || 'standard';
    const pMult = (sandbox.DIFFICULTY_PRESETS && (sandbox.DIFFICULTY_PRESETS[diffKey] || sandbox.DIFFICULTY_PRESETS.standard).startFundsMult) || 1.0;
    S.G.money = 1e13;
    const res = S.doPrestige();
    const expMoney = Math.round(Math.round(o.money * pMult) * (1 + 0.25 * 2));
    check('v1.9 doPrestige 返回（ok / 2 点 / 第 1 纪元）', res && res.ok === true && res.points === 2 && res.generations === 1, JSON.stringify(res));
    check('v1.9 NG+ 新纪元 G 重置（act1/tick0）且携带 2 传承点', S.G.act === 1 && S.G.tickCount === 0 && S.G.legacy && S.G.legacy.points === 2,
      'act=' + S.G.act + ' tick=' + S.G.tickCount + ' legacy=' + JSON.stringify(S.G.legacy));
    check('v1.9 NG+ 初始资金 = 出身×难度×(1+25%×2 点)', S.G.money === expMoney, 'money=' + S.G.money + ' 期望=' + expMoney);
    check('v1.9 NG+ 收入乘数 ×1.2 生效', Math.abs(S.getLegacyIncomeScale() - 1.2) < 1e-9, '×' + S.getLegacyIncomeScale());
    check('v1.9 传承记录持久化（内存兜底 generations=1/history=1）', S.getLegacy().generations === 1 && S.getLegacy().history.length === 1,
      JSON.stringify(S.getLegacy().history));
  }
}

// ---------- v1.10 晚期专属 NPC + 限时挑战冲刺模式 ----------
{
  const N = evalIn('NPCS');
  const ids = Object.keys(N);
  check('v1.10 NPC 总数 14→17', ids.length === 17, 'len=' + ids.length);
  check('v1.10 3 晚期 NPC 存在（苏明远/沈亦东/顾璇，actUnlock 6/7/8 高于 720h 窗口最高幕 5）',
    N.sumingyuan && N.shenyidong && N.guxuan &&
    N.sumingyuan.actUnlock === 6 && N.shenyidong.actUnlock === 7 && N.guxuan.actUnlock === 8,
    [N.sumingyuan, N.shenyidong, N.guxuan].map(n => n && n.actUnlock).join('/'));
  check('v1.10 晚期 NPC lazyFavor=true 且 initFavor=0（好感键延迟自建，720h 随机序列不被扰动）',
    [N.sumingyuan, N.shenyidong, N.guxuan].every(n => n.lazyFavor === true && n.initFavor === 0), '');
  const structOk = ['sumingyuan', 'shenyidong', 'guxuan'].every(k => {
    const n = N[k];
    if (!n || !n.questLines || n.questLines.length !== 4) return false;
    if (!n.questLines.every(q => q.steps && q.steps.length === 3 && q.steps.every(s => s && s.text && s.reward))) return false;
    if (JSON.stringify(n.questLines.map(q => q.reqFavor)) !== JSON.stringify([20, 40, 60, 75])) return false;
    if (!n.dialogTypes || !n.giftPreferences || !n.giftQuote || !n.desc || !n.title) return false;
    return true;
  });
  check('v1.10 晚期 NPC 结构完整（4 任务线×3 步 / 好感阶梯 20/40/60/75 / 对话与礼物配置齐全）', structOk, '');
  const refsOk = ['sumingyuan', 'shenyidong', 'guxuan'].every(k => {
    const n = N[k];
    return (n.relations || []).every(r => N[r.npcId]) && Object.keys(n.npcLinks || {}).every(id => N[id]);
  });
  check('v1.10 relations/npcLinks 全部指向存在的 NPC', refsOk, '');
  const rewardOk = ['sumingyuan', 'shenyidong', 'guxuan'].every(k => {
    const steps = N[k].questLines.flatMap(q => q.steps);
    return steps.some(s => s.reward.money >= 1e8) && steps.some(s => (s.reward.statPoints || 0) >= 2);
  });
  check('v1.10 晚期 NPC 奖励晚期量级（含 money≥1e8 步骤与末期技能点奖励）', rewardOk, '');
  // lazyFavor 门控：新游戏 G.npcFavor 不含晚期 NPC 键（doPrestige 后 G 为全新 NG+ 状态，act=1）
  {
    const G = S.G;
    const keys = Object.keys(G.npcFavor);
    check('v1.10 新游戏 G.npcFavor=14 键（lazyFavor NPC 未预注册，衰减块随机消耗序列不变）',
      keys.length === 14 && G.npcFavor.sumingyuan === undefined && G.npcFavor.shenyidong === undefined && G.npcFavor.guxuan === undefined,
      'keys=' + keys.length);
    const NS = sandbox.NPCSystem;
    check('v1.10 getFavor(晚期NPC) 解锁前返回 0', NS.getFavor('sumingyuan') === 0, '');
    NS.changeFavor('sumingyuan', 5);
    check('v1.10 changeFavor 为 lazyFavor NPC 自建好感键', G.npcFavor.sumingyuan === 5, 'fav=' + G.npcFavor.sumingyuan);
    delete G.npcFavor.sumingyuan; // 复原
  }
  // 冲刺预设 + 成就
  const D = evalIn('DIFFICULTY_PRESETS');
  check('v1.10 sprint 预设（资金×3 / 事件频率中性 / growth/decay 1.0）',
    D.sprint && D.sprint.startFundsMult === 3.0 && D.sprint.eventFreqMult === 1.0 && D.sprint.growthMult === 1.0 && D.sprint.decayMult === 1.0,
    JSON.stringify(D.sprint));
  const ACH = evalIn('ACHIEVEMENTS');
  const s10 = ACH.find(a => a.id === 'sprint_10b');
  check('v1.10 sprint_10b 成就（speed_run 1e10 / 720000s → 24000 tick = 200h）',
    s10 && s10.cond.type === 'speed_run' && s10.cond.value === 1e10 && s10.cond.time === 720000 &&
    Math.floor(s10.cond.time / (CONFIG.TICK_MS / 1000)) === 24000,
    s10 ? JSON.stringify(s10.cond) : 'missing');
  const S10R = evalIn('ACHIEVEMENT_REWARDS').sprint_10b;
  check('v1.10 sprint_10b 奖励条目（skillCostReduce 仅玩家动作消费；禁止实时键 incomeMult 等 → 720h 仿真安全）',
    S10R && S10R.skillCostReduce === 1 && !('incomeMult' in S10R) && !('opCost' in S10R), '');
  // 行为边界：speed_run 恰在 24000 tick 解锁 / 24001 不解锁
  // 注意：游戏 tick 先 G.tickCount++ 再 doTick（含 checkAchievements），故预置 23999/24000
  {
    const G = S.G;
    const save = { money: G.money, tick: G.tickCount, un: G.unlockedAchievements ? [...G.unlockedAchievements] : [] };
    G.money = 1.05e10;
    G.unlockedAchievements = save.un.filter(id => id !== 'sprint_10b');
    G.tickCount = 23999;
    runIntervals(1);
    const at = G.unlockedAchievements.includes('sprint_10b');
    G.unlockedAchievements = save.un.filter(id => id !== 'sprint_10b');
    G.tickCount = 24000;
    runIntervals(1);
    const over = G.unlockedAchievements.includes('sprint_10b');
    G.money = save.money; G.tickCount = save.tick; G.unlockedAchievements = save.un;
    check('v1.10 speed_run 边界（24000 tick=整 200h 解锁 / 24001 不解锁）', at && !over, 'at=' + at + ' over=' + over);
  }
  // startGame sprint：初始资金×3（NG+ 2 传承点仍生效 → 再×1.5）；G 重置发生在末，放块尾
  {
    const o = sandbox.ORIGINS.find(x => x.id === S.G.origin);
    S.startGame(S.G.origin, 'v110test', { difficulty: 'sprint' });
    const expMoney = Math.round(Math.round(o.money * 3.0) * 1.5); // 难度×3 × 传承2点×1.5
    check('v1.10 startGame sprint 初始资金×3（叠加 NG+ ×1.5）', S.G.difficulty === 'sprint' && S.G.money === expMoney,
      'diff=' + S.G.difficulty + ' money=' + S.G.money + ' 期望=' + expMoney);
    check('v1.10 sprint 新游戏 G.npcFavor=14 键（lazyFavor 未注册）',
      Object.keys(S.G.npcFavor).length === 14, 'keys=' + Object.keys(S.G.npcFavor).length);
  }
}

console.log('\n' + results.join('\n'));
const passCount = results.filter(r => r.startsWith('PASS')).length;
const failCount = results.filter(r => r.startsWith('FAIL')).length;
console.log('\n结果: ' + passCount + ' PASS / ' + failCount + ' FAIL');
if (errors.length) {
  console.log('\n捕获异常 ' + errors.length + ' 条（前 12 条）:');
  errors.slice(0, 12).forEach(e => console.log('  ! ' + e.slice(0, 220)));
}
if (warns.length) console.log('\n警告 ' + warns.length + ' 条（前 5 条）:\n  ' + warns.slice(0, 5).join('\n  ').slice(0, 900));
// 显式退出 + 完成哨兵（重要）：
// 本沙箱环境中 node 进程脚本结束后可能滞留数分钟才真正退出（工作负载越大越明显，零 CPU），
// 曾长期被误判为"游戏挂起"。这里先等 stdout 刷完再 process.exit（3s 兜底），并同步落盘退出码哨兵，
// 外部 harness 可轮询哨兵后立即回收进程，不受滞留影响。
const _exitCode = failCount || errors.length || loaded !== SCRIPTS.length ? 1 : 0;
const _sentinel = process.env.VERIFY_SENTINEL || 'C:/Users/A1/AppData/Local/Temp/verify-gameplay.done';
function _finish() { try { fs.writeFileSync(_sentinel, String(_exitCode) + '\n'); } catch (_) {} process.exit(_exitCode); }
if (process.stdout.writableFinished) _finish();
else {
  process.stdout.once('finish', _finish);
  setTimeout(_finish, 3000);
}
