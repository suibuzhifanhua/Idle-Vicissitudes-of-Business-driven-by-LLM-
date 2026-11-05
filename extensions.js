// ==================================================
// extensions.js - 扩展经营闭环（离线规则优先，LLM只做受限选择）
// ==================================================
window.Extensions = (() => {
  const CFG = () => window.EXTENSION_CONFIG || {};
  const TPL = () => window.EXTENSION_TEMPLATES || {};
  const STATE_VERSION = 1;
  let activeTab = 'overview';

  function _G() {
    return typeof SGame !== 'undefined' ? SGame.G : null;
  }

  function _tick() {
    const G = _G();
    return Number(G && G.tickCount) || 0;
  }

  function _safeId(value) {
    return String(value == null ? '' : value).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48);
  }

  function _escape(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function _uid(prefix) {
    return prefix + '_' + _tick() + '_' + Math.random().toString(36).slice(2, 9);
  }

  function _clamp(value, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number)) return min;
    return Math.max(min, Math.min(max, number));
  }

  function _money(value) {
    return Math.max(0, Number(value) || 0);
  }

  function _income() {
    try { return Math.max(0, Number(SGame.calcTotalIncome()) || 0); } catch (_) { return 0; }
  }

  function _businessIncome(bizId) {
    try {
      if (typeof SGame.calcBizIncome === 'function') return Math.max(0, Number(SGame.calcBizIncome(bizId)) || 0);
    } catch (_) {}
    return 0;
  }

  function ensureState() {
    const G = _G();
    if (!G) return null;
    if (!G.ext || typeof G.ext !== 'object') G.ext = {};
    const ext = G.ext;
    ext.version = Number(ext.version) || STATE_VERSION;
    ext.campaigns = ext.campaigns || { proposals: [], active: [], results: [] };
    ext.favor = ext.favor && typeof ext.favor === 'object' ? ext.favor : {};
    ext.intents = Array.isArray(ext.intents) ? ext.intents : [];
    ext.contracts = ext.contracts || { offers: [], active: [] };
    ext.products = ext.products && typeof ext.products === 'object' ? ext.products : {};
    ext.suppliers = ext.suppliers && typeof ext.suppliers === 'object' ? ext.suppliers : {};
    ext.charters = ext.charters && typeof ext.charters === 'object' ? ext.charters : {};
    ext.board = ext.board && typeof ext.board === 'object' ? ext.board : { enabled: false, term: 0 };
    ext.decisions = Array.isArray(ext.decisions) ? ext.decisions : [];
    ext.todo = Array.isArray(ext.todo) ? ext.todo : [];
    ext.simulation = ext.simulation && typeof ext.simulation === 'object' ? ext.simulation : null;
    ext.timers = ext.timers || {};
    ['proposals', 'active', 'results'].forEach((key) => {
      if (!Array.isArray(ext.campaigns[key])) ext.campaigns[key] = [];
    });
    ['offers', 'active'].forEach((key) => {
      if (!Array.isArray(ext.contracts[key])) ext.contracts[key] = [];
    });
    return ext;
  }

  function _log(icon, text) {
    const message = text;
    try {
      if (typeof EventSystem !== 'undefined' && EventSystem.addLog) EventSystem.addLog(icon + ' ' + message);
      else if (typeof SGame.addLog === 'function') SGame.addLog(icon + ' ' + message);
    } catch (_) {}
  }

  function _markDirty() {
    try {
      if (typeof UI !== 'undefined' && UI.markDirty) UI.markDirty('dashboard');
      if (typeof UI !== 'undefined' && UI.markCenterFullRefresh) UI.markCenterFullRefresh();
    } catch (_) {}
  }

  function _spend(amount, reason) {
    const G = _G();
    if (!G) return { ok: false, msg: '游戏未开始' };
    const cost = _money(amount);
    if (G.money < cost) return { ok: false, msg: '资金不足（需要' + SGame.formatMoney(cost) + '）' };
    G.money -= cost;
    G.totalExpense = (G.totalExpense || 0) + cost;
    if (reason) _log('💸', reason + '：-' + SGame.formatMoney(cost));
    G._saveDirty = true;
    return { ok: true, cost };
  }

  function _grant(amount, reason) {
    const G = _G();
    if (!G) return;
    const value = _money(amount);
    G.money += value;
    G.totalIncome = (G.totalIncome || 0) + value;
    if (reason) _log('💰', reason + '：+' + SGame.formatMoney(value));
    G._saveDirty = true;
  }

  // ---------- 受限 LLM 模板选择 ----------
  function _fallbackTemplate(kind, context) {
    const pool = TPL()[kind] || [];
    if (!pool.length) return null;
    const seed = Number(context && context.seed) || _tick();
    const scoreFor = (item) => {
      if (kind === 'campaignPlans') {
        if (item.target === 'supply') return Number(context && context.supplyStability) || 50;
        if (item.target === 'brand') return Number(context && context.brandAwareness) || 50;
        return Number(context && context.employeeHealth) || 50;
      }
      if (kind === 'rivalIntents') return item.target === 'employee' && Number(context && context.lowLoyalty) > 0 ? 90 : 50;
      return pool.indexOf(item) * 2 + seed % 7;
    };
    return pool.slice().sort((a, b) => scoreFor(b) - scoreFor(a))[0];
  }

  function chooseTemplate(kind, candidates, context) {
    const allowed = (TPL()[kind] || []).filter((item) => !candidates || candidates.includes(item.id));
    if (!allowed.length) return Promise.resolve(null);
    const fallback = _fallbackTemplate(kind, context || {});
    if (typeof LLM === 'undefined' || !LLM.available || typeof LLM.generateJson !== 'function') {
      return Promise.resolve(fallback);
    }
    const prompt = [
      '从候选模板中选择最适合当前局势的一项。',
      'schemaVersion:' + ((CFG().LLM_TEMPLATE || {}).SCHEMA_VERSION || 1),
      'kind:' + kind,
      'allowedTemplateIds:' + JSON.stringify(allowed.map((x) => x.id)),
      'context:' + JSON.stringify(context || {}),
      '输出:{schemaVersion,kind,templateId,confidence,rationale}',
    ].join('\n');
    return LLM.generateJson(prompt, '你是经营策略选择器，只能从 allowedTemplateIds 中选择。', {
      taskType: '扩展策略', priority: LLM.PRIORITY ? LLM.PRIORITY.NORMAL : undefined,
    }).then((result) => {
      const templateId = _safeId(result && result.templateId);
      const confidence = _clamp(result && result.confidence, 0, 1);
      if (!templateId || confidence < ((CFG().LLM_TEMPLATE || {}).CONFIDENCE_FLOOR || 0.18)) return fallback;
      return allowed.find((item) => _safeId(item.id) === templateId) || fallback;
    }).catch(() => fallback);
  }

  // ---------- 节日经营战役 ----------
  function _activeBusinesses(limit) {
    const G = _G();
    if (!G || typeof BUSINESS_DEFS === 'undefined') return [];
    return BUSINESS_DEFS.filter((def) => {
      const state = G.businesses && G.businesses[def.id];
      return state && state.level > 0;
    }).slice(0, limit || 7);
  }

  function generateCampaignProposals() {
    const ext = ensureState();
    const G = _G();
    if (!ext || !G) return;
    if (_tick() - (ext.timers.campaign || 0) < 120 || ext.campaigns.proposals.length >= 2) return;
    ext.timers.campaign = _tick();
    const businesses = _activeBusinesses(8);
    if (!businesses.length) return;
    const def = businesses[Math.floor(Math.random() * businesses.length)];
    const supply = (G.supplyChain || {})[def.id] || {};
    chooseTemplate('campaignPlans', null, {
      business: def.id,
      supplyStability: Number(supply.stability) || 50,
      brandAwareness: Number(G.brand && G.brand.awareness) || 50,
      employeeHealth: Math.max(0, 100 - (Number(G.stress) || 50)),
      seed: _tick(),
    }).then((template) => {
      if (!template) return;
      const ratio = ((CFG().CAMPAIGN || {}).PLAN_COST_RATIOS || {})[template.target] || 0.04;
      ext.campaigns.proposals.push({
        id: _uid('camp'),
        templateId: template.id,
        label: template.label,
        target: template.target,
        bizId: def.id,
        businessName: def.name,
        cost: Math.max(20000, Math.round(_income() * 24 * ratio)),
        expiresAtTick: _tick() + 24,
        createdAt: _tick(),
      });
      _log('🗓️', def.name + '出现节日经营窗口，可按“' + template.label + '”备战。');
      _markDirty();
    });
  }

  function acceptCampaign(proposalId) {
    const ext = ensureState();
    const id = _safeId(proposalId);
    const proposal = ext && ext.campaigns.proposals.find((item) => _safeId(item.id) === id);
    if (!proposal || proposal.expiresAtTick <= _tick()) return { ok: false, msg: '经营窗口已结束' };
    const paid = _spend(proposal.cost, proposal.label + '备战金');
    if (!paid.ok) return paid;
    ext.campaigns.proposals = ext.campaigns.proposals.filter((item) => item.id !== proposal.id);
    ext.campaigns.active.push({
      ...proposal,
      startedAt: _tick(),
      endsAt: _tick() + (((CFG().CAMPAIGN || {}).ACTIVE_TICKS) || 24),
      progress: 0,
    });
    _log('🚩', '已开始执行「' + proposal.label + '」，未来经营结果会同时影响供应、员工与品牌。');
    _markDirty();
    return { ok: true, msg: '战役已开始' };
  }

  function tickCampaigns() {
    const ext = ensureState();
    if (!ext) return;
    const G = _G();
    generateCampaignProposals();
    ext.campaigns.proposals = ext.campaigns.proposals.filter((item) => item.expiresAtTick > _tick());
    const keep = [];
    ext.campaigns.active.forEach((campaign) => {
      campaign.progress++;
      const supply = G.supplyChain && G.supplyChain[campaign.bizId];
      if (campaign.target === 'supply' && supply) {
        supply.stability = _clamp((Number(supply.stability) || 50) + 0.12, 0, 100);
      }
      if (campaign.target === 'brand' && G.brand) {
        G.brand.awareness = _clamp((Number(G.brand.awareness) || 50) + 0.05, 0, 100);
      }
      if (campaign.target === 'employees') {
        (G.employees || []).slice(0, 5).forEach((employee) => {
          employee.happiness = _clamp((Number(employee.happiness) || 50) + 0.04, 0, 100);
          employee.fatigue = _clamp((Number(employee.fatigue) || 0) - 0.02, 0, 100);
        });
      }
      if (_tick() >= campaign.endsAt) {
        const quality = _clamp(campaign.progress / Math.max(1, campaign.endsAt - campaign.startedAt), 0, 1);
        const value = _money(_businessIncome(campaign.bizId) * 24 * quality * (campaign.target === 'brand' ? 0.72 : 0.96));
        _grant(value, campaign.label + '履约复盘');
        if (G.brand) G.brand.reputation = _clamp((Number(G.brand.reputation) || 50) + quality * 3, 0, 100);
        ext.campaigns.results.unshift({
          id: campaign.id, label: campaign.label, bizId: campaign.bizId,
          value, quality, tick: _tick(),
        });
        ext.campaigns.results = ext.campaigns.results.slice(0, 12);
        _log('🏁', campaign.label + '复盘：完成度 ' + Math.round(quality * 100) + '%。');
      } else {
        keep.push(campaign);
      }
    });
    ext.campaigns.active = keep;
  }

  // ---------- NPC 人情债 ----------
  function onFavorChange(npcId, delta) {
    const ext = ensureState();
    const G = _G();
    if (!ext || !G || !Number.isFinite(delta)) return;
    const id = _safeId(npcId);
    ext.favor[id] = ext.favor[id] || { credits: 0, debt: null };
    const entry = ext.favor[id];
    if (delta > 0 && !entry.debt) {
      entry.pending = _clamp((Number(entry.pending) || 0) + delta, 0, 100);
      if (entry.pending >= (((CFG().FAVOR_DEBT || {}).EARN_THRESHOLD) || 8)) {
        entry.credits = Math.min(((CFG().FAVOR_DEBT || {}).MAX_PER_NPC) || 2, entry.credits + 1);
        entry.pending = 0;
        _log('🤝', '积累了1点人情，最多可储存' + entry.credits + '点。');
      }
    }
    if (delta <= 0) entry.pending = Math.max(0, Number(entry.pending) || 0);
    _markDirty();
  }

  function requestFavor(npcId) {
    const ext = ensureState();
    const G = _G();
    const id = _safeId(npcId);
    const entry = ext && ext.favor[id];
    if (!entry || entry.credits <= 0) return { ok: false, msg: '当前没有可用的人情' };
    if (entry.debt) return { ok: false, msg: '对方已经欠你一次反向请托，请先完成' };
    const request = (TPL().favorRequests || []).find((item) => _safeId(item.npc) === id);
    if (!request) return { ok: false, msg: '此人暂时帮不上对应的忙' };
    entry.credits--;
    entry.debt = {
      request,
      dueAtTick: _tick() + (((CFG().FAVOR_DEBT || {}).DUE_TICKS) || 30),
    };
    if (request.target === 'loan' && Array.isArray(G.loans)) {
      G.loans.forEach((loan) => { loan.dueTick = (Number(loan.dueTick) || 0) + 30; });
    }
    if (request.target === 'employee') G._favorEmployeeShieldTicks = _tick() + 30;
    if (request.target === 'supply' && Object.keys(G.supplyChain || {}).length) {
      const key = Object.keys(G.supplyChain)[0];
      G.supplyChain[key].stability = 100;
      G.supplyChain[key].upstream = 'normal';
      G.supplyChain[key].disruptionTicks = 0;
    }
    if (request.target === 'rival') revealRivalIntent();
    _log('🎁', '对方动用关系帮你渡过一关；请在到期前完成反向请托。');
    _markDirty();
    return { ok: true, msg: '人情已动用，待办中心已增加回请托任务' };
  }

  function fulfillFavor(npcId) {
    const ext = ensureState();
    const id = _safeId(npcId);
    const entry = ext && ext.favor[id];
    if (!entry || !entry.debt) return { ok: false, msg: '没有待完成的人情债' };
    entry.debt = null;
    entry.credits = Math.min(((CFG().FAVOR_DEBT || {}).MAX_PER_NPC) || 2, entry.credits + 1);
    if (typeof NPCSystem !== 'undefined' && NPCSystem.changeFavor) NPCSystem.changeFavor(id, 6);
    _log('✅', '反向请托已完成，人情网络恢复稳定。');
    _markDirty();
    return { ok: true, msg: '人情债已偿还' };
  }

  function tickFavor() {
    const ext = ensureState();
    if (!ext) return;
    Object.keys(ext.favor).forEach((id) => {
      const entry = ext.favor[id];
      if (entry && entry.debt && _tick() >= entry.debt.dueAtTick) {
        entry.debt = null;
        if (typeof NPCSystem !== 'undefined' && NPCSystem.changeFavor) {
          NPCSystem.changeFavor(id, ((CFG().FAVOR_DEBT || {}).DEFAULT_BREACH_FAVOR) || -18);
        }
        _log('⚠️', '人情债逾期未还，关系出现裂痕。');
      }
    });
  }

  // ---------- 对手意图预告 ----------
  function revealRivalIntent() {
    const ext = ensureState();
    if (!ext) return null;
    const intent = ext.intents.find((item) => !item.revealed);
    if (intent) intent.revealed = true;
    return intent || null;
  }

  function generateRivalIntents() {
    const ext = ensureState();
    const G = _G();
    if (!ext || !G) return;
    if (_tick() - (ext.timers.intent || 0) < 18 || ext.intents.length >= 3) return;
    ext.timers.intent = _tick();
    const rivals = G.rivals || [];
    if (!rivals.length) return;
    const rival = rivals[Math.floor(Math.random() * rivals.length)];
    const lowLoyalty = (G.employees || []).filter((e) => Number(e.loyalty) < 45).length;
    chooseTemplate('rivalIntents', null, {
      rival: rival.name,
      strategy: rival.strategy || 'conservative',
      lowLoyalty,
      marketShare: Number(rival.marketShare) || 0,
    }).then((template) => {
      if (!template) return;
      ext.intents.push({
        id: _uid('intent'),
        rivalId: _safeId(rival.id || rival.name),
        rivalName: rival.name,
        intentId: template.id,
        label: template.label,
        target: template.target,
        intensity: 0.5 + Math.random() * 0.5,
        revealed: false,
        dueAtTick: _tick() + (((CFG().RIVAL_TELEGRAPH || {}).LOOKAHEAD_TICKS) || 3),
      });
      _log('🕵️', rival.name + '方向出现异常征兆。');
      _markDirty();
    });
  }

  function buyRivalIntel(intentId) {
    const ext = ensureState();
    const intent = ext && ext.intents.find((item) => _safeId(item.id) === _safeId(intentId));
    if (!intent || intent.revealed) return { ok: false, msg: '该征兆不可再侦查' };
    const paid = _spend(_income() * 1.2 + (((CFG().RIVAL_TELEGRAPH || {}).INTEL_COST_BASE) || 120000), '对手情报');
    if (!paid.ok) return paid;
    intent.revealed = true;
    _markDirty();
    return { ok: true, msg: '情报已确认：' + intent.label };
  }

  function counterRivalIntent(intentId) {
    const ext = ensureState();
    const G = _G();
    const intent = ext && ext.intents.find((item) => _safeId(item.id) === _safeId(intentId));
    if (!intent) return { ok: false, msg: '征兆已过期' };
    const paid = _spend(_income() * 1.8 + (((CFG().RIVAL_TELEGRAPH || {}).COUNTER_COST_BASE) || 180000), '商战反制');
    if (!paid.ok) return paid;
    intent.countered = true;
    if (intent.target === 'employee') {
      const weakest = (G.employees || []).slice().sort((a, b) => Number(a.loyalty) - Number(b.loyalty))[0];
      if (weakest) weakest.loyalty = _clamp(Number(weakest.loyalty) + 18, 0, 100);
    }
    if (intent.target === 'market') {
      G.marketShare = _clamp((Number(G.marketShare) || 50) + intent.intensity * 4, 0, 100);
      if (G.brand) G.brand.awareness = _clamp((Number(G.brand.awareness) || 50) + 3, 0, 100);
    }
    ext.intents = ext.intents.filter((item) => item.id !== intent.id);
    _log('🛡️', '反制部署完成，成功削弱了' + intent.rivalName + '的行动。');
    _markDirty();
    return { ok: true, msg: '反制已部署' };
  }

  function tickIntents() {
    const ext = ensureState();
    const G = _G();
    if (!ext || !G) return;
    generateRivalIntents();
    const remain = [];
    ext.intents.forEach((intent) => {
      if (_tick() < intent.dueAtTick) {
        remain.push(intent);
        return;
      }
      if (intent.countered) {
        _log('✅', intent.rivalName + '的' + intent.label + '被反制。');
        return;
      }
      if (intent.target === 'employee') {
        const shield = Number(G._favorEmployeeShieldTicks) || 0;
        if (shield > _tick()) {
          _log('🤝', '人情网络挡住了' + intent.rivalName + '的挖角。');
        } else {
          const weakest = (G.employees || []).slice().sort((a, b) => Number(a.loyalty) - Number(b.loyalty))[0];
          if (weakest) weakest.loyalty = _clamp(Number(weakest.loyalty) - intent.intensity * 20, 0, 100);
          _log('⚠️', intent.rivalName + '的挖角行动造成团队动摇。');
        }
      } else {
        G.marketShare = _clamp((Number(G.marketShare) || 50) - intent.intensity * 4, 0, 100);
        _log('📉', intent.rivalName + '的价格战压缩了区域份额。');
      }
    });
    ext.intents = remain.slice(-8);
  }

  // ---------- B2B合同 ----------
  function activeContractBusinessCapacity(bizId) {
    const ext = ensureState();
    const active = ext && ext.contracts.active.filter((item) => item.bizId === bizId);
    const used = active.reduce((sum, item) => sum + (Number(item.volumeTicks) || 0), 0);
    const level = Number(_G().businesses && _G().businesses[bizId] && _G().businesses[bizId].level) || 0;
    return Math.max(0, level * 30 - used);
  }

  function createContractOffers() {
    const ext = ensureState();
    const G = _G();
    if (!ext || !G) return;
    if (_tick() - (ext.timers.contract || 0) < (((CFG().CONTRACT || {}).INTERVAL_TICKS) || 48)) return;
    ext.timers.contract = _tick();
    const businesses = _activeBusinesses(8);
    const count = Math.min(((CFG().CONTRACT || {}).OFFER_COUNT) || 3, businesses.length);
    for (let index = 0; index < count; index++) {
      const def = businesses[index];
      const capacity = activeContractBusinessCapacity(def.id);
      if (capacity <= 0) continue;
      const volume = Math.min(capacity, ((CFG().CONTRACT || {}).VOLUME_TICKS || [10, 20, 40])[Math.floor(Math.random() * 3)]);
      const duration = ((CFG().CONTRACT || {}).DURATION_TICKS || [60, 120, 240])[Math.floor(Math.random() * 3)];
      const prepay = ((CFG().CONTRACT || {}).PREPAY_RATIOS || [0.1, 0.2, 0.35])[Math.floor(Math.random() * 3)];
      const penalty = ((CFG().CONTRACT || {}).PENALTY_RATIOS || [0.05, 0.1, 0.18])[Math.floor(Math.random() * 3)];
      const total = Math.max(50000, _businessIncome(def.id) * volume);
      ext.contracts.offers.push({
        id: _uid('contract'),
        bizId: def.id,
        businessName: def.name,
        volumeTicks: volume,
        durationTicks: duration,
        totalValue: total,
        prepayRatio: prepay,
        penaltyRatio: penalty,
        expiresAtTick: _tick() + (((CFG().CONTRACT || {}).EXPIRE_TICKS) || 18),
      });
    }
    ext.contracts.offers = ext.contracts.offers.slice(-9);
    if (ext.contracts.offers.length) _log('📑', '出现新的B2B长期合同报价。');
    _markDirty();
  }

  function acceptContract(offerId) {
    const ext = ensureState();
    const id = _safeId(offerId);
    const offer = ext && ext.contracts.offers.find((item) => _safeId(item.id) === id);
    if (!offer) return { ok: false, msg: '报价已失效' };
    if (ext.contracts.active.length >= (((CFG().CONTRACT || {}).ACTIVE_LIMIT) || 4)) {
      return { ok: false, msg: '同时执行的合同已达上限' };
    }
    const capacity = activeContractBusinessCapacity(offer.bizId);
    if (capacity < offer.volumeTicks) return { ok: false, msg: '该业务剩余产能不足' };
    ext.contracts.offers = ext.contracts.offers.filter((item) => item.id !== id);
    const contract = {
      ...offer,
      startedAt: _tick(),
      endsAt: _tick() + offer.durationTicks,
      delivered: 0,
      revenue: 0,
      penaltyPaid: 0,
    };
    ext.contracts.active.push(contract);
    _grant(contract.totalValue * contract.prepayRatio, offer.businessName + '合同预付款');
    _log('✍️', '已签订' + offer.businessName + '长期合同：' + offer.volumeTicks + '单位/' + offer.durationTicks + 'Tick。');
    _markDirty();
    return { ok: true, msg: '合同已签署' };
  }

  function declineContract(offerId) {
    const ext = ensureState();
    const id = _safeId(offerId);
    ext.contracts.offers = ext.contracts.offers.filter((item) => _safeId(item.id) !== id);
    _markDirty();
    return { ok: true, msg: '已拒绝报价' };
  }

  function tickContracts() {
    const ext = ensureState();
    const G = _G();
    if (!ext || !G) return;
    createContractOffers();
    ext.contracts.offers = ext.contracts.offers.filter((item) => item.expiresAtTick > _tick());
    const keep = [];
    ext.contracts.active.forEach((contract) => {
      const supply = (G.supplyChain || {})[contract.bizId] || {};
      const stability = _clamp(Number(supply.stability) || 50, 10, 100) / 100;
      const interruption = supply.upstream === 'disrupted' ? 0.35 : 1;
      const perTickRevenue = contract.totalValue / Math.max(1, contract.volumeTicks);
      const units = Math.max(0, stability * interruption);
      contract.delivered += units;
      const income = perTickRevenue * units;
      _grant(income, contract.businessName + '合同交付');
      contract.revenue += income;
      if (_tick() >= contract.endsAt) {
        const fulfillment = _clamp(contract.delivered / Math.max(1, contract.volumeTicks), 0, 1);
        if (fulfillment < 0.9) {
          const penalty = Math.max(0, contract.totalValue * contract.penaltyRatio * (1 - fulfillment));
          const G2 = _G();
          if (G2) {
            G2.money -= penalty;
            contract.penaltyPaid += penalty;
            G2.reputation = _clamp((Number(G2.reputation) || 50) - 4, 0, 200);
          }
          _log('⚖️', contract.businessName + '合同未足额交付，赔付违约金' + SGame.formatMoney(penalty) + '。');
        } else {
          if (G.reputation) G.reputation = _clamp((Number(G.reputation) || 50) + 4, 0, 200);
          _log('🏅', contract.businessName + '合同按约交付，客户续约意愿提升。');
        }
      } else {
        keep.push(contract);
      }
    });
    ext.contracts.active = keep.slice(-12);
  }

  // ---------- 产品定位 ----------
  function getProduct(bizId) {
    const ext = ensureState();
    const id = _safeId(bizId);
    if (!ext || !id) return null;
    if (!ext.products[id]) {
      ext.products[id] = {
        position: 'value',
        priceBand: 'balanced',
        researchBudget: 0.1,
        marketingBudget: 0.1,
        progress: 0,
        active: false,
      };
    }
    return ext.products[id];
  }

  function setProductPlan(bizId, position, priceBand, researchBudget, marketingBudget) {
    const ext = ensureState();
    const product = getProduct(bizId);
    const allowed = (TPL().productSegments || []).map((item) => item.id);
    if (!ext || !product || !allowed.includes(_safeId(position))) return { ok: false, msg: '产品定位无效' };
    const paid = _spend(_businessIncome(bizId) * 6 + 100000, position + '定位研究');
    if (!paid.ok) return paid;
    product.position = _safeId(position);
    product.priceBand = ['budget', 'balanced', 'premium'].includes(_safeId(priceBand)) ? priceBand : 'balanced';
    product.researchBudget = _clamp(researchBudget, 0, 0.35);
    product.marketingBudget = _clamp(marketingBudget, 0, 0.35);
    product.active = true;
    product.progress = 0;
    _log('🧭', '新产品定位进入12Tick市场验证。');
    _markDirty();
    return { ok: true, msg: '产品策略已切换' };
  }

  function getContractCapacityPenalty(bizId) {
    const ext = ensureState();
    if (!ext) return 1;
    const level = Number(_G().businesses && _G().businesses[_safeId(bizId)] && _G().businesses[_safeId(bizId)].level) || 0;
    if (level <= 0) return 1;
    const volume = ext.contracts.active
      .filter((contract) => _safeId(contract.bizId) === _safeId(bizId))
      .reduce((sum, contract) => sum + (Number(contract.volumeTicks) || 0), 0);
    const capacity = level * 30;
    const loadRatio = _clamp(volume / Math.max(1, capacity), 0, 1);
    const cost = _clamp(Number((CFG().CONTRACT || {}).CONTRACT_CAPACITY_COST_RATIO ?? CFG().CONTRACT_CAPACITY_COST_RATIO) || 0.55, 0, 0.85);
    return _clamp(1 - loadRatio * cost, 0.15, 1);
  }

  function getBusinessIncomeModifier(bizId) {
    const ext = ensureState();
    const product = ext && ext.products[_safeId(bizId)];
    if (!product || !product.active) return 1;
    const config = (CFG().PRODUCT || {});
    const position = (config.POSITION_EFFECTS || {})[product.position] || {};
    const price = (config.PRICE_BANDS || {})[product.priceBand] || 1;
    const research = 1 + Number(product.researchBudget || 0) * Number(position.research || 1) * 0.35;
    const marketing = 1 + Number(product.marketingBudget || 0) * 0.45;
    return _clamp(price * (position.share || 1) * research * marketing, 0.55, 1.65);
  }

  function getGlobalIncomeModifier() {
    const ext = ensureState();
    const G = _G();
    if (!ext || !G) return 1;
    let value = 1;
    if (ext.board && ext.board.enabled && Number(ext.board.confidence) > 55) {
      value *= 1 + (_clamp(ext.board.confidence, 0, 100) - 55) * 0.0015;
    }
    Object.keys(ext.charters || {}).forEach((cityId) => {
      if (ext.charters[cityId] && ext.charters[cityId].charter === 'research') value *= 1.004;
    });
    return _clamp(value, 0.85, 1.35);
  }

  function getSubsidiaryShareModifier(cityId) {
    const ext = ensureState();
    const charter = ext && ext.charters && ext.charters[_safeId(cityId)];
    if (!charter) return 1;
    return charter.charter === 'cashCow' ? 1.05 : charter.charter === 'growth' ? 0.92 : 1;
  }

  function tickProducts() {
    const ext = ensureState();
    if (!ext) return;
    Object.keys(ext.products || {}).forEach((id) => {
      const product = ext.products[id];
      if (!product || !product.active) return;
      product.progress = Math.min(((CFG().PRODUCT || {}).RESEARCH_TICKS) || 12, (Number(product.progress) || 0) + 1);
      if (product.progress >= (((CFG().PRODUCT || {}).RESEARCH_TICKS) || 12)) product.settled = true;
    });
  }

  // ---------- 多供应商组合与库存 ----------
  function getSupplierPlan(bizId) {
    const ext = ensureState();
    const id = _safeId(bizId);
    if (!ext || !id) return null;
    if (!ext.suppliers[id]) {
      ext.suppliers[id] = { primary: null, backup: null, allocation: 60, safetyStock: 0, lastFailure: 0 };
    }
    return ext.suppliers[id];
  }

  function setSupplierPlan(bizId, primary, backup, allocation, safetyStock) {
    const ext = ensureState();
    const plan = getSupplierPlan(bizId);
    const pool = TPL().supplierArchetypes || [];
    const resolve = (value) => {
      if (value && typeof value === 'object' && value.id) {
        return pool.find((item) => _safeId(item.id) === _safeId(value.id)) || null;
      }
      return pool.find((item) => _safeId(item.id) === _safeId(value)) || null;
    };
    if (!ext || !plan) return { ok: false, msg: '游戏未开始' };
    const first = resolve(primary);
    const second = resolve(backup);
    if (!first || !second) return { ok: false, msg: '请选择两个不同供应商' };
    if (_safeId(first.id) === _safeId(second.id)) return { ok: false, msg: '主供和备供不能相同' };
    const paid = _spend(80000 + (_businessIncome(bizId) || _income() / 8) * 3, '供应商双源谈判');
    if (!paid.ok) return paid;
    plan.primary = first;
    plan.backup = second;
    plan.allocation = _clamp(allocation, 10, 90);
    plan.safetyStock = _clamp(safetyStock, 0, ((CFG().SUPPLY_GROUPS || {}).SAFETY_STOCK_MAX_TICKS) || 24);
    _log('🧩', '已建立双供应商组合，安全库存可缓冲断供风险。');
    _markDirty();
    return { ok: true, msg: '供应方案已保存' };
  }

  function tickSuppliers() {
    const ext = ensureState();
    if (!ext) return;
    Object.keys(ext.suppliers || {}).forEach((id) => {
      const plan = ext.suppliers[id];
      if (!plan || !plan.primary || !plan.backup) return;
      const cost = plan.safetyStock * (((CFG().SUPPLY_GROUPS || {}).INVENTORY_UNIT) || 25000) * 0.01;
      const G = _G();
      if (G && cost > 0) G.money -= cost;
      const supply = (G && G.supplyChain && G.supplyChain[id]) || null;
      if (!supply) return;
      const blended = (Number(plan.primary.stability) || 1) * (plan.allocation / 100)
        + (Number(plan.backup.stability) || 1) * ((100 - plan.allocation) / 100);
      supply.stability = _clamp((Number(supply.stability) || 50) + (blended - 1) * 0.55, 0, 100);
      if (supply.upstream === 'disrupted') {
        if (plan.safetyStock > 0) {
          plan.safetyStock--;
          supply.disruptionTicks = Math.max(0, (Number(supply.disruptionTicks) || 1) - 1);
          _log('📦', '安全库存自动补位，供应损失被压缩。');
        }
        if (!plan.primary) supply.disruptionTicks = 0;
      }
    });
  }

  function getSupplyIncomeModifier(bizId) {
    const ext = ensureState();
    const plan = ext && ext.suppliers[_safeId(bizId)];
    if (!plan || !plan.primary) return 1;
    const allocation = Number(plan.allocation) / 100;
    const price = _clamp((Number(plan.primary.price) || 1) * allocation
      + (Number(plan.backup && plan.backup.price) || 1) * (1 - allocation), 0.7, 1.45);
    return _clamp(1 / price, 0.72, 1.28);
  }

  // ---------- 子公司章程 ----------
  function setSubsidiaryCharter(cityId, charter, managerNpcId) {
    const ext = ensureState();
    const G = _G();
    const id = _safeId(cityId);
    if (!ext || !G || !G.subsidiaries || !G.subsidiaries[id]) return { ok: false, msg: '该城市还不是子公司' };
    const options = ((CFG().CHARTER || {}).CHARTERS) || {};
    const preset = options[_safeId(charter)];
    if (!preset) return { ok: false, msg: '章程无效' };
    const paid = _spend(_income() * 3 + 300000, '子公司章程重组');
    if (!paid.ok) return paid;
    ext.charters[id] = {
      cityId: id,
      charter: _safeId(charter),
      manager: _safeId(managerNpcId || ''),
      dividend: preset.dividend,
      reinvest: preset.reinvest,
      risk: preset.risk,
      cycleStart: _tick(),
      reports: [],
    };
    _log('🏛️', '子公司已进入新章程周期，经营授权与分红比例已调整。');
    _markDirty();
    return { ok: true, msg: '章程已生效' };
  }

  function tickCharters() {
    const ext = ensureState();
    const G = _G();
    if (!ext || !G) return;
    Object.keys(ext.charters || {}).forEach((id) => {
      const charter = ext.charters[id];
      if (!charter || !G.subsidiaries || !G.subsidiaries[id]) {
        delete ext.charters[id];
        return;
      }
      if (_tick() - Number(charter.cycleStart || 0) < (((CFG().CHARTER || {}).CYCLE_TICKS) || 72)) return;
      charter.cycleStart = _tick();
      const city = G.cities && G.cities[id];
      const actual = city ? Number(SGame.calcCityBaseIncome(id)) || 0 : 0;
      const dividend = actual * charter.dividend;
      const forecast = charter.forecast || actual * (1 + (charter.reinvest - 0.3) * 0.2);
      charter.forecast = actual * (1 + charter.reinvest * 0.1);
      _grant(dividend, '子公司分红（' + id + '）');
      charter.reports.unshift({ tick: _tick(), actual, forecast, dividend });
      charter.reports = charter.reports.slice(0, ((CFG().CHARTER || {}).REPORT_LIMIT || 12));
      if (Math.random() < charter.risk * 0.12) {
        _log('⚠️', '子公司经营偏差增加，建议审计或更换管理者。');
        if (G.reputation) G.reputation = _clamp(Number(G.reputation) - 2, 0, 200);
      }
    });
  }

  // ---------- 董事会任期 ----------
  function _boardGoals() {
    return [
      { id: 'growth', label: '提升收入', taboo: 'newLoan', check: (G) => _income() > Number(G._boardBaseIncome || 0) * 1.04 },
      { id: 'cash', label: '保持现金储备', taboo: 'dividend', check: (G) => Number(G.money) > Number(G._boardBaseMoney || 0) * 1.08 },
      { id: 'research', label: '提高研发产出', taboo: 'marketing', check: (G) => Number(G.rpt) > Number(G._boardBaseRpt || 0) + 12 },
      { id: 'team', label: '稳定员工状态', taboo: 'layoff', check: (G) => (G.employees || []).every((e) => Number(e.loyalty) >= 40) },
      { id: 'share', label: '扩大市场份额', taboo: 'shortRisk', check: (G) => Number(G.marketShare) > Number(G._boardBaseShare || 0) + 1 },
    ];
  }

  function startBoard(termTicks) {
    const ext = ensureState();
    const G = _G();
    if (!ext || !G) return { ok: false, msg: '游戏未开始' };
    if (ext.board.enabled) return { ok: false, msg: '本届董事会仍在任期' };
    const term = _clamp(termTicks || 168, 120, 360);
    const goals = _boardGoals();
    const director = ((TPL().boardDirectors || [])[Math.floor(Math.random() * 4)] || { id: 'operator', label: '运营董事' });
    const goalPool = goals.slice().sort(() => Math.random() - 0.5).slice(0, (((CFG().BOARD || {}).GOAL_LIMIT) || 2));
    ext.board = {
      enabled: true,
      term: Number(ext.board.term || 0) + 1,
      director,
      goals: goalPool.map((goal) => ({ ...goal, achieved: false })),
      taboo: goalPool.length > 1 ? goalPool[0].taboo : 'layoff',
      startTick: _tick(),
      endTick: _tick() + term,
      confidence: 65,
      baseIncome: _income(),
      baseMoney: G.money,
      baseRpt: G.rpt,
      baseShare: G.marketShare,
    };
    _log('📋', director.label + '发起第' + ext.board.term + '届董事会：' + goalPool.map((x) => x.label).join('、') + '。');
    _markDirty();
    return { ok: true, msg: '董事会已开会' };
  }

  function tickBoard() {
    const ext = ensureState();
    const G = _G();
    if (!ext || !G || !ext.board.enabled) return;
    const board = ext.board;
    if (_tick() < board.endTick) {
      const performance = (_income() > board.baseIncome ? 0.03 : 0)
        + (G.money > board.baseMoney ? 0.02 : 0)
        + (Number(G.rpt) > Number(board.baseRpt) ? 0.02 : 0);
      board.confidence = _clamp(Number(board.confidence) + performance - 0.008, 0, 100);
      return;
    }
    board.goals.forEach((goal) => {
      goal.achieved = goal.check({
        ...G,
        _boardBaseIncome: board.baseIncome,
        _boardBaseMoney: board.baseMoney,
        _boardBaseRpt: board.baseRpt,
        _boardBaseShare: board.baseShare,
      });
    });
    const success = board.goals.filter((goal) => goal.achieved).length;
    board.confidence = _clamp(Number(board.confidence) + success * 10 - 12, 0, 100);
    G.reputation = _clamp((Number(G.reputation) || 50) + success * 2 - (board.goals.length - success), 0, 200);
    if (success >= board.goals.length) _grant(_income() * 20, '董事会目标完成奖金');
    else _log('🗳️', '董事会评价：' + success + '/' + board.goals.length + '项目标完成。');
    board.enabled = false;
    _markDirty();
  }

  // ---------- 统一待办中心 ----------
  function buildTodos() {
    const G = _G();
    const ext = ensureState();
    if (!G || !ext) return [];
    const items = [];
    (SGame.pendingDecisions || []).forEach((event) => {
      const remaining = Math.max(0, 200 - (_tick() - Number(event._tickCreated || event.tickCreated || 0)));
      items.push({ kind: 'decision', id: event.id, label: event.title || '待决策事件', remaining, critical: remaining <= 30 });
    });
    (G.loans || []).forEach((loan) => {
      const remaining = Math.max(0, Number(loan.dueTick) - _tick());
      items.push({ kind: 'loan', id: loan.id, label: '贷款到期：' + SGame.formatMoney(loan.amount || 0), remaining, critical: remaining <= 3 });
    });
    ext.campaigns.proposals.forEach((proposal) => {
      items.push({ kind: 'campaign', id: proposal.id, label: proposal.businessName + '节日窗口', remaining: proposal.expiresAtTick - _tick(), critical: proposal.expiresAtTick - _tick() <= 3 });
    });
    ext.contracts.offers.forEach((offer) => {
      items.push({ kind: 'contract', id: offer.id, label: offer.businessName + '合同报价', remaining: offer.expiresAtTick - _tick(), critical: offer.expiresAtTick - _tick() <= 3 });
    });
    ext.intents.forEach((intent) => {
      items.push({ kind: 'rival', id: intent.id, label: intent.rivalName + '：' + intent.label, remaining: intent.dueAtTick - _tick(), critical: true });
    });
    Object.keys(ext.favor || {}).forEach((npcId) => {
      const debt = ext.favor[npcId] && ext.favor[npcId].debt;
      if (debt) items.push({ kind: 'favor', id: npcId, label: '完成人情反向请托', remaining: debt.dueAtTick - _tick(), critical: debt.dueAtTick - _tick() <= 3 });
    });
    Object.keys(ext.charters || {}).forEach((cityId) => {
      const charter = ext.charters[cityId];
      if (charter) items.push({ kind: 'charter', id: cityId, label: '审阅' + cityId + '子公司周期报告', remaining: Math.max(0, Number(charter.cycleStart) + 72 - _tick()), critical: false });
    });
    if (ext.board.enabled) items.push({ kind: 'board', id: 'board', label: '董事会任期评估', remaining: ext.board.endTick - _tick(), critical: ext.board.endTick - _tick() <= 8 });
    return items.filter((item) => Number(item.remaining) >= 0)
      .sort((a, b) => Number(a.critical) - Number(b.critical) || Number(a.remaining) - Number(b.remaining))
      .slice(0, ((CFG().TODO || {}).LIMIT) || 24);
  }

  function refreshTodos() {
    const ext = ensureState();
    if (!ext) return [];
    ext.todo = buildTodos();
    return ext.todo;
  }

  function todoCount() {
    return buildTodos().filter((item) => item.critical).length;
  }

  // ---------- 决策预览与后验 ----------
  function recordDecision(event, choice) {
    const ext = ensureState();
    const G = _G();
    if (!ext || !G || !event || !choice) return;
    ext.decisions.unshift({
      id: _uid('decision'),
      eventId: _safeId(event.id),
      title: String(event.title || event.id || ''),
      choice: String(choice.text || ''),
      tick: _tick(),
      effects: choice.effect || {},
      baseline: {
        money: Number(G.money) || 0,
        income: _income(),
        reputation: Number(G.reputation) || 0,
        stress: Number(G.stress) || 0,
        marketShare: Number(G.marketShare) || 0,
      },
      review: [],
    });
    ext.decisions = ext.decisions.slice(0, ((CFG().DECISION_REVIEW || {}).LIMIT) || 30);
  }

  function tickDecisionReviews() {
    const ext = ensureState();
    const G = _G();
    if (!ext || !G) return;
    const checkpoints = ((CFG().DECISION_REVIEW || {}).SNAPSHOTS) || [6, 12];
    ext.decisions.forEach((decision) => {
      decision.review = decision.review || [];
      checkpoints.forEach((offset) => {
        if (_tick() >= decision.tick + offset && !decision.review.some((item) => item.offset === offset)) {
          decision.review.push({
            offset,
            money: Number(G.money) || 0,
            income: _income(),
            reputation: Number(G.reputation) || 0,
            stress: Number(G.stress) || 0,
            marketShare: Number(G.marketShare) || 0,
          });
        }
      });
    });
  }

  // ---------- 托管预演 ----------
  function previewAutoMode() {
    const ext = ensureState();
    const G = _G();
    if (!ext || !G) return [];
    const heap = Array.isArray(SGame._strategyHeap) ? SGame._strategyHeap : [];
    const reserve = _income() * (((CFG().AUTO_SIM || {}).CASH_RESERVE_MULTIPLIER) || 8);
    const items = heap.slice(0, 8).map((entry) => ({
      name: entry.name || entry.key,
      dueInTicks: Math.max(0, Number(entry.nextTick) - _tick()),
      note: Number(G.money) < reserve ? '现金储备偏低，可能跳过大额动作' : '按当前策略预演',
    }));
    ext.simulation = { tick: _tick(), items };
    _markDirty();
    return items;
  }

  function simulateOfflineReturn() {
    const ext = ensureState();
    const G = _G();
    if (!ext || !G) return [];
    return [
      '收益：按当前收入速率和离线效率结算',
      '合同：已签约合同按既定供应与产品方案结算',
      '董事会/战役：不离线生成新决策，重大行动保持原到期时间',
      '待办：返回后先查看贷款、合同交付和反制到期',
    ];
  }

  // ---------- Tick 调度 ----------
  function onTick() {
    if (!_G()) return;
    tickCampaigns();
    tickFavor();
    tickIntents();
    tickContracts();
    tickProducts();
    tickSuppliers();
    tickCharters();
    tickBoard();
    tickDecisionReviews();
    refreshTodos();
  }

  // ---------- UI ----------
  function renderPanel(panel) {
    const ext = ensureState();
    if (!panel || !ext) return;
    const tabs = ['overview', 'contracts', 'products', 'supply', 'campaigns', 'rival', 'charter', 'board', 'todos'];
    panel.innerHTML = '<div class="extension-panel"><div class="panel-title">🧩 扩展经营</div>' +
      '<div class="extension-tabs">' + tabs.map((tab) =>
        '<button class="btn btn-tab' + (tab === activeTab ? ' active' : '') + '" onclick="Extensions.showTab(\'' + tab + '\')">' + tabLabel(tab) + '</button>'
      ).join('') + '</div><div id="extension-tab-content">' + renderTab(activeTab) + '</div></div>';
  }

  function tabLabel(tab) {
    return {
      overview: '总览', contracts: '合同', products: '产品', supply: '供应', campaigns: '战役',
      rival: '商战', charter: '子公司', board: '董事会', todos: '待办',
    }[tab] || tab;
  }

  function showTab(tab) {
    activeTab = _safeId(tab) || 'overview';
    if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll();
  }

  function renderTab(tab) {
    const G = _G();
    if (!G) return '<div>请先开始游戏。</div>';
    const ext = ensureState();
    if (tab === 'overview') {
      return '<div class="extension-summary">' +
        '<div>活跃合同：' + ext.contracts.active.length + '</div>' +
        '<div>产品定位：' + Object.keys(ext.products).length + '</div>' +
        '<div>双源供应：' + Object.keys(ext.suppliers).length + '</div>' +
        '<div>人情：' + Object.values(ext.favor).reduce((sum, entry) => sum + Number(entry.credits || 0), 0) + '</div>' +
        '<div>对手征兆：' + ext.intents.length + '</div>' +
        '<div>董事会信任：' + Math.round(Number(ext.board.confidence) || 0) + '%</div>' +
        '</div>' +
        '<button class="btn" onclick="Extensions.previewNow()">预演未来10Tick</button>' +
        '<div id="extension-preview">' + renderPreview() + '</div>';
    }
    if (tab === 'contracts') {
      return '<h3>合同报价</h3>' + ext.contracts.offers.map((offer) => {
        const capacity = activeContractBusinessCapacity(offer.bizId);
        return '<div class="extension-card"><b>' + _escape(offer.businessName) + '</b><br>交付 ' + offer.volumeTicks + ' / 周期 ' + offer.durationTicks + ' Tick<br>总额 ' + _money(offer.totalValue) + ' / 预付 ' + Math.round(offer.prepayRatio * 100) + '%<br>可用产能 ' + capacity +
          '<div><button class="btn" onclick="Extensions.acceptContract(\'' + _safeId(offer.id) + '\')">签约</button>' +
          '<button class="btn" onclick="Extensions.declineContract(\'' + _safeId(offer.id) + '\')">拒绝</button></div></div>';
      }).join('') + '<h3>执行中</h3>' + ext.contracts.active.map((contract) =>
        '<div class="extension-card">' + _escape(contract.businessName) + '：已交付 ' + contract.delivered.toFixed(1) + '/' + contract.volumeTicks + '</div>'
      ).join('');
    }
    if (tab === 'products') {
      return _activeBusinesses(12).map((def) => {
        const product = getProduct(def.id);
        return '<div class="extension-card"><b>' + _escape(def.name) + '</b><br>定位：' + _escape(product.position) + ' / 价格：' + _escape(product.priceBand) +
          '<div><button class="btn" onclick="Extensions.switchProduct(\'' + def.id + '\',\'value\')">性价比</button>' +
          '<button class="btn" onclick="Extensions.switchProduct(\'' + def.id + '\',\'premium\')">高端</button>' +
          '<button class="btn" onclick="Extensions.switchProduct(\'' + def.id + '\',\'technology\')">技术</button></div></div>';
      }).join('');
    }
    if (tab === 'supply') {
      return _activeBusinesses(12).map((def) => {
        const plan = getSupplierPlan(def.id);
        return '<div class="extension-card"><b>' + _escape(def.name) + '</b><br>主供：' + _escape(plan.primary ? plan.primary.label : '未设置') +
          '，备供：' + _escape(plan.backup ? plan.backup.label : '未设置') + '<br>主供比例 ' + plan.allocation + '%，库存 ' + plan.safetyStock + ' Tick' +
          '<div><button class="btn" onclick="Extensions.setSupplierPreset(\'' + def.id + '\',\'low_cost_local\',\'regional_stable\',60,4)">成本韧性</button>' +
          '<button class="btn" onclick="Extensions.setSupplierPreset(\'' + def.id + '\',\'regional_stable\',\'quality_premium\',50,8)">稳定优先</button></div></div>';
      }).join('');
    }
    if (tab === 'campaigns') {
      return '<h3>经营窗口</h3>' + ext.campaigns.proposals.map((proposal) =>
        '<div class="extension-card">' + _escape(proposal.businessName) + '：' + _escape(proposal.label) + '<br>成本 ' + _money(proposal.cost) +
        '<button class="btn" onclick="Extensions.acceptCampaign(\'' + _safeId(proposal.id) + '\')">开始备战</button></div>'
      ).join('') + '<h3>执行与复盘</h3>' + ext.campaigns.active.map((campaign) =>
        '<div class="extension-card">' + _escape(campaign.label) + '，剩余 ' + Math.max(0, campaign.endsAt - _tick()) + ' Tick</div>'
      ).join('') + ext.campaigns.results.map((result) =>
        '<div class="extension-card">' + _escape(result.label) + '：完成 ' + Math.round(result.quality * 100) + '%</div>'
      ).join('');
    }
    if (tab === 'rival') {
      return ext.intents.map((intent) =>
        '<div class="extension-card">' + _escape(intent.rivalName) + '：' + _escape(intent.label) + '<br>' + (intent.revealed ? '目标已确认' : '仍可购买情报') +
        '<div><button class="btn" onclick="Extensions.buyIntel(\'' + _safeId(intent.id) + '\')">确认情报</button>' +
        '<button class="btn" onclick="Extensions.counterIntent(\'' + _safeId(intent.id) + '\')">部署反制</button></div></div>'
      ).join('') || '<div>暂无异常征兆。</div>';
    }
    if (tab === 'charter') {
      const cities = Object.keys(G.subsidiaries || {});
      return cities.map((cityId) => {
        const charter = ext.charters[cityId];
        return '<div class="extension-card"><b>' + _escape(cityId) + '</b><br>' + (charter ? '当前章程：' + _escape(charter.charter) : '尚未制定章程') +
          '<div><button class="btn" onclick="Extensions.applyCharter(\'' + cityId + '\',\'cashCow\')">现金牛</button>' +
          '<button class="btn" onclick="Extensions.applyCharter(\'' + cityId + '\',\'growth\')">扩张</button>' +
          '<button class="btn" onclick="Extensions.applyCharter(\'' + cityId + '\',\'research\')">研发</button>' +
          '<button class="btn" onclick="Extensions.applyCharter(\'' + cityId + '\',\'balanced\')">平衡</button></div></div>';
      }).join('') || '<div>至少设立一家子公司后才能制定章程。</div>';
    }
    if (tab === 'board') {
      return ext.board.enabled
        ? '<div class="extension-card">第 ' + ext.board.term + ' 届：' + _escape(ext.board.director.label) + '<br>信任 ' + Math.round(ext.board.confidence) + '%<br>' + ext.board.goals.map((goal) => _escape(goal.label)).join('、') + '</div>'
        : '<button class="btn" onclick="Extensions.startBoard()">开启168Tick任期</button>';
    }
    if (tab === 'todos') {
      return buildTodos().map((todo) =>
        '<div class="extension-card' + (todo.critical ? ' critical' : '') + '">' + _escape(todo.label) + '（剩余 ' + todo.remaining + ' Tick）</div>'
      ).join('') || '<div>暂无紧急待办。</div>';
    }
    return '';
  }

  function renderPreview() {
    const ext = ensureState();
    if (!ext || !ext.simulation) return '<div>尚未预演。</div>';
    return '<ol>' + ext.simulation.items.map((item) =>
      '<li>' + _escape(item.name) + '：' + item.dueInTicks + ' Tick 后 · ' + _escape(item.note) + '</li>'
    ).join('') + '</ol>';
  }

  function previewNow() {
    const items = previewAutoMode();
    if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll();
    return items;
  }

  function switchProduct(bizId, position) {
    const result = setProductPlan(bizId, position, 'balanced', 0.12, 0.1);
    if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll();
    return result;
  }

  function setSupplierPreset(bizId, primary, backup, allocation, safety) {
    const pool = TPL().supplierArchetypes || [];
    const first = pool.find((item) => item.id === primary);
    const second = pool.find((item) => item.id === backup);
    const result = setSupplierPlan(bizId, first, second, allocation, safety);
    if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll();
    return result;
  }

  function applyCharter(cityId, charter) {
    const result = setSubsidiaryCharter(cityId, charter);
    if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll();
    return result;
  }

  function toastResult(result) {
    try {
      if (typeof UI !== 'undefined' && UI.showToast) {
        UI.showToast(result.ok ? 'success' : 'error', result.ok ? '操作成功' : '操作未完成', result.msg || '');
      }
    } catch (_) {}
    return result;
  }

  function publicContractAccept(id) { return toastResult(acceptContract(id)); }
  function publicContractDecline(id) { return toastResult(declineContract(id)); }
  function publicCampaignAccept(id) { return toastResult(acceptCampaign(id)); }
  function publicBuyIntel(id) { return toastResult(buyRivalIntel(id)); }
  function publicCounterIntent(id) { return toastResult(counterRivalIntent(id)); }
  function publicStartBoard() { return toastResult(startBoard()); }
  function publicRequestFavor(npcId) { return toastResult(requestFavor(npcId)); }
  function publicFulfillFavor(npcId) { return toastResult(fulfillFavor(npcId)); }

  return {
    ensureState,
    onTick,
    getBusinessIncomeModifier,
    getSupplyIncomeModifier,
    getContractCapacityPenalty,
    getGlobalIncomeModifier,
    getSubsidiaryShareModifier,
    onFavorChange,
    requestFavor: publicRequestFavor,
    fulfillFavor: publicFulfillFavor,
    renderPanel,
    showTab,
    previewNow,
    switchProduct,
    setSupplierPreset,
    applyCharter,
    acceptContract: publicContractAccept,
    declineContract: publicContractDecline,
    acceptCampaign: publicCampaignAccept,
    buyIntel: publicBuyIntel,
    counterIntent: publicCounterIntent,
    startBoard: publicStartBoard,
    buildTodos,
    todoCount,
    recordDecision,
    simulateOfflineReturn,
    commands: {
      setProductPlan,
      setSupplierPlan,
      setSubsidiaryCharter,
      startBoard,
    },
  };
})();
