import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const GAME_DIR = process.argv[2]
  ? path.resolve(process.argv[2]) + path.sep
  : path.dirname(fileURLToPath(import.meta.url)) + path.sep;

function makeElement(tag) {
  const element = {
    tagName: (tag || 'div').toUpperCase(), id: '', className: '', innerHTML: '', textContent: '',
    value: '', disabled: false, checked: false, style: {}, dataset: {}, children: [], parentNode: null,
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    appendChild(child) { this.children.push(child); child.parentNode = this; return child; },
    insertBefore(child) { this.children.unshift(child); child.parentNode = this; return child; },
    removeChild(child) { this.children = this.children.filter((item) => item !== child); return child; },
    remove() {}, insertAdjacentHTML() {}, setAttribute() {}, getAttribute() { return null; },
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

let simulatedNow = Date.UTC(2026, 10, 4);

const noopPromise = (value) => Promise.resolve(value);
const sandbox = {
  addEventListener() {}, removeEventListener() {},
  setInterval() { return 1; }, clearInterval() {}, setTimeout(fn) { fn(); return 1; }, clearTimeout() {},
  requestAnimationFrame(fn) { fn(0); return 1; }, cancelAnimationFrame() {},
  performance: { now: () => simulatedNow },
  matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
  getComputedStyle: () => ({ getPropertyValue: () => '' }),
  localStorage: (() => { const store = new Map(); return { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear() }; })(),
  location: { href: 'http://localhost:8765/', origin: 'http://localhost:8765', reload() {}, hash: '' },
  navigator: { userAgent: 'node' },
  alert() {}, confirm: () => true, prompt: () => '',
  Audio: function () { return makeElement('audio'); }, Image: function () { return makeElement('img'); },
  fetch: async () => ({ ok: true, status: 200, json: async () => ({}), text: async () => '' }),
  ResizeObserver: function () { return { observe() {}, disconnect() {} }; },
  structuredClone: (value) => JSON.parse(JSON.stringify(value)),
  AbortController: class { constructor() { this.signal = { aborted: false, addEventListener() {}, removeEventListener() {} }; } abort() {} },
  URL, URLSearchParams, Blob: function () {}, Intl, Buffer,
  devicePixelRatio: 1, innerWidth: 1440, innerHeight: 900,
  console: { log() {}, debug() {}, warn() {}, error() {} },
};

sandbox.window = sandbox;
sandbox.document = document;
sandbox.globalThis = sandbox;
sandbox.Storage = {
  isReady: () => true, getStatus: () => 'ready', hasPersistentError: () => false,
  get: () => null, has: () => false,
  set: noopPromise, remove: noopPromise, ready: noopPromise, saveFinal: noopPromise,
};

const ctx = vm.createContext(sandbox);
const evalIn = (code) => vm.runInContext(code, ctx);
const ALL_SCRIPTS = [
  'config-game.js', 'config-businesses.js', 'config-achievements.js', 'config-npcs.js', 'config-extensions.js',
  'data-origins.js', 'data-businesses.js', 'data-stocks.js', 'data-tech.js', 'data-npcs.js', 'data-events.js',
  'state.js', 'settings.js', 'llm.js', 'core.js', 'core-engine.js', 'core-market.js', 'core-finance.js',
  'core-strategy.js', 'core-stock.js', 'core-research.js', 'core-rival.js', 'extensions.js', 'advisor.js',
  'events.js', 'npc.js', 'ui.js', 'audio.js', 'main.js',
];
const scripts = ALL_SCRIPTS.filter((file) => fs.existsSync(GAME_DIR + file));
for (const file of scripts) {
  vm.runInContext(fs.readFileSync(GAME_DIR + file, 'utf8'), ctx, { filename: file });
}
sandbox.LLM = new Proxy({ available: false, isAvailable: () => false, queueLength: 0 }, {
  get: (target, key) => (key in target ? target[key] : () => null),
});

const S = sandbox.SGame;
const BUSINESS_DEFS = evalIn('BUSINESS_DEFS');
const NPCS = evalIn('NPCS');
const RANK_TIERS = evalIn('RANK_TIERS');
const CONFIG = evalIn('CONFIG');

S.DEBUG = false;
S.initState('tech', '模拟器');
S.startGame('tech', '模拟器');
const G = S.G;
G.money = 500000;
G.reputation = 90;
G.completedResearch = { digital: 9, ai: 9, blockchain: 9 };
Object.keys(NPCS || {}).forEach((id) => { G.npcFavor[id] = 100; });
BUSINESS_DEFS.forEach((definition) => {
  G.businesses[definition.id] = { level: 1, region: definition.regions ? definition.regions[0] : null, unlocked: true };
});
G.cities[G.currentCityId].businesses = JSON.parse(JSON.stringify(G.businesses));
G.autoMode.enabled = false;
G.eventLog = [];
G._saveDirty = false;

const HOUR_TICKS = Math.round(3600000 / CONFIG.TICK_MS);
const BLOCK = 50;
const horizonsHours = [1, 24, 72, 720];
const horizons = {};
horizonsHours.forEach((hours) => { horizons[hours] = null; });
const rankTimes = {};
let tick = 0;
let currentIncome = 0;
let currentExpense = 0;
let currentNet = 0;

function refreshEconomy() {
  S.invalidateIncomeCache();
  currentIncome = S.calcTotalIncome();
  currentExpense = S.calcTotalExpense();
  currentNet = currentIncome - currentExpense;
}

function syncCity() {
  G.cities[G.currentCityId].businesses = JSON.parse(JSON.stringify(G.businesses));
}

function canAffordRequirements(nextLevel) {
  const requirement = nextLevel.reqCond;
  if (!requirement) return true;
  if (requirement.techLv && Object.values(G.completedResearch || {}).some((level) => level >= requirement.techLv) === false) return false;
  if (requirement.rep && G.reputation < requirement.rep) return false;
  if (requirement.npcFavor) {
    return Object.entries(requirement.npcFavor).every(([npcId, minimum]) => Number(G.npcFavor[npcId]) >= minimum);
  }
  return true;
}

function attemptUpgrades() {
  let changed = true;
  let guard = 0;
  while (changed && guard++ < 80) {
    changed = false;
    const candidates = [];
    BUSINESS_DEFS.forEach((definition) => {
      const state = G.businesses[definition.id];
      if (!state || !state.level) return;
      const next = definition.levels[state.level];
      if (!next || !canAffordRequirements(next)) return;
      const cost = Number(next.cost) * 10000;
      const incomeGain = (Number(next.income) - Number(definition.levels[state.level - 1].income)) * 10000;
      if (cost > 0 && incomeGain > 0) candidates.push({ state, cost, payback: cost / incomeGain });
    });
    candidates.sort((left, right) => left.payback - right.payback);
    const reserve = Math.max(200000, currentExpense * 100);
    const chosen = candidates.find((candidate) => G.money - reserve >= candidate.cost);
    if (!chosen) break;
    G.money -= chosen.cost;
    chosen.state.level++;
    syncCity();
    changed = true;
  }
}

const EMP_ROLES = evalIn('EMP_ROLES');

function maybeHire() {
  const employeeCount = (G.employees || []).length;
  if (employeeCount >= S.getEmpMax()) return;
  const roles = ['manager', 'developer', 'sales', 'marketer'];
  const role = EMP_ROLES.find((item) => item.id === roles[employeeCount % roles.length]);
  if (!role) return;
  const estimatedWage = Number(role.baseSalary) * 10000;
  if (currentNet < estimatedWage * 4) return;
  if (G.money < Math.max(200000, currentExpense * 120)) return;
  S.batchHire(role.id, 1);
}

refreshEconomy();
const finalHorizon = Math.max(...horizonsHours) * HOUR_TICKS;
while (tick < finalHorizon) {
  const steps = Math.min(BLOCK, finalHorizon - tick);
  G.money += currentNet * steps;
  if (!Number.isFinite(G.money) || G.money < 0) G.money = 0;
  if (G.money > 1e15) G.money = 1e15;
  tick += steps;
  G.tickCount = tick;
  simulatedNow += steps * CONFIG.TICK_MS;
  attemptUpgrades();
  maybeHire();
  if (S.updateRank) S.updateRank();
  refreshEconomy();

  RANK_TIERS.forEach((tier) => {
    if (!rankTimes[tier.name] && G.money >= tier.minMoney) {
      rankTimes[tier.name] = { tick, hours: Math.round((tick / HOUR_TICKS) * 10) / 10 };
    }
  });
  horizonsHours.forEach((hours) => {
    const target = hours * HOUR_TICKS;
    if (!horizons[hours] && tick >= target) {
      horizons[hours] = {
        money: Math.round(G.money),
        incomePerTick: Math.round(currentIncome),
        expensePerTick: Math.round(currentExpense),
        netPerTick: Math.round(currentNet),
        rank: G.rank,
        employees: (G.employees || []).length,
        businessLevels: BUSINESS_DEFS.reduce((sum, definition) => sum + (G.businesses[definition.id] || {}).level, 0),
      };
    }
  });
}

process.stdout.write(JSON.stringify({
  gameDir: GAME_DIR,
  offline24h: (() => {
    const samples = Array.from({ length: 20 }, () => ({ net: currentNet }));
    G.netIncomeSamples = samples;
    G._offlineSettledAt = Date.now() - 24 * 3600 * 1000;
    const offline = S.calcOfflineIncome();
    G.netIncomeSamples = [];
    G._offlineSettledAt = Date.now();
    return { hours: offline.hours, rawTicks: offline.ticks, effectiveTicks: offline.effectiveTicks, income: Math.round(offline.income) };
  })(),
  horizons,
  rankTimes,
}, null, 2) + '\n');
