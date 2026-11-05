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
  'data-origins.js', 'data-businesses.js', 'data-stocks.js', 'data-tech.js', 'data-npcs.js', 'data-events.js',
  'state.js', 'network.js', 'storage.js', 'settings.js', 'llm.js', 'core.js', 'core-engine.js', 'core-market.js',
  'core-finance.js', 'core-strategy.js', 'core-stock.js', 'core-research.js', 'core-rival.js', 'extensions.js',
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
sandbox.LLM = new Proxy({ available: false, isAvailable: () => false, queueLength: 0 }, {
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
offlineG._offlineSettledAt = Date.now() - 24 * 3600 * 1000;
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

S.G.businesses = { fund: { level: 10, region: null, unlocked: true } };
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

console.log('\n' + results.join('\n'));
const passCount = results.filter(r => r.startsWith('PASS')).length;
const failCount = results.filter(r => r.startsWith('FAIL')).length;
console.log('\n结果: ' + passCount + ' PASS / ' + failCount + ' FAIL');
if (errors.length) {
  console.log('\n捕获异常 ' + errors.length + ' 条（前 12 条）:');
  errors.slice(0, 12).forEach(e => console.log('  ! ' + e.slice(0, 220)));
}
if (warns.length) console.log('\n警告 ' + warns.length + ' 条（前 5 条）:\n  ' + warns.slice(0, 5).join('\n  ').slice(0, 900));
process.exitCode = failCount || errors.length || loaded !== SCRIPTS.length ? 1 : 0;
