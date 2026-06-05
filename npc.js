// ==================================================
// npc.js — NPC系统：好感度、对话、事件链、任务线、NPC联动
// ==================================================

window.NPCSystem = (() => {
  let currentNPC = null;
  let currentActions = [];  // 存储当前渲染的动作回调列表

  // ========== 获取NPC状态 ==========
  function getFavor(npcId) {
    return SGame.G.npcFavor[npcId] || 0;
  }

  function getFavorLevel(npcId) {
    const f = getFavor(npcId);
    if (f <= -20) return 0; // 敌对
    if (f <= 0) return 1;   // 冷淡
    if (f <= 30) return 2;  // 中立
    if (f <= 70) return 3;  // 友好
    return 4;               // 亲密
  }

  function getFavorLabel(npcId) {
    const npc = NPCS[npcId];
    if (!npc) return '';
    const lv = getFavorLevel(npcId);
    return npc.favorLevels[lv] || '中立';
  }

  // ========== 好感度变化（含NPC联动传播） ==========
  function changeFavor(npcId, delta) {
    // 区域人脉加成：connGain 放大正向好感变化
    if (delta > 0 && SGame.G && typeof SGame.getRegionModifiers === 'function') {
      var rm = SGame.getRegionModifiers();
      if (rm && rm.connGain) delta = Math.round(delta * rm.connGain);
    }
    const old = getFavor(npcId);
    SGame.G.npcFavor[npcId] = Math.max(-50, Math.min(100, old + delta));
    const newLv = getFavorLevel(npcId);
    const oldLv = old <= -20 ? 0 : old <= 0 ? 1 : old <= 30 ? 2 : old <= 70 ? 3 : 4;
    if (newLv !== oldLv) {
      const npc = NPCS[npcId];
      EventSystem.addLog(`${npc.name}的好感度变为${npc.favorLevels[newLv]}。`);
    }

    // NPC联动传播：根据npcLinks比例影响关联NPC好感度
    const npc = NPCS[npcId];
    if (npc && npc.npcLinks) {
      const linkDelta = delta > 0 ? Math.max(1, Math.floor(delta * 0.3)) : Math.min(-1, Math.ceil(delta * 0.2));
      for (const [linkedId, ratio] of Object.entries(npc.npcLinks)) {
        if (NPCS[linkedId]) {
          const propagateDelta = Math.round(linkDelta * ratio);
          if (propagateDelta !== 0) {
            const linkedOld = getFavor(linkedId);
            SGame.G.npcFavor[linkedId] = Math.max(-50, Math.min(100, linkedOld + propagateDelta));
            // 联动变化不重复触发挥发提示，但记录到日志
            if (Math.abs(propagateDelta) >= 3) {
              EventSystem.addLog(`${NPCS[linkedId].name}也受到了影响（好感${propagateDelta > 0 ? '+' : ''}${propagateDelta}）。`);
            }
          }
        }
      }
    }
  }

  // ========== 打开NPC对话 ==========
  function openDialog(npcId, dialogType) {
    currentNPC = npcId;
    const npc = NPCS[npcId];
    if (!npc) return;

    const modal = document.getElementById('modal-npc');
    const titleEl = document.getElementById('npc-modal-title');
    const contentEl = document.getElementById('npc-dialog-content');

    titleEl.textContent = `${npc.name} — ${npc.title}`;
    modal.classList.add('active');

    const favor = getFavor(npcId);
    const fLabel = getFavorLabel(npcId);

    // 送礼偏好标签
    let prefTag = '';
    if (npc.giftPreferences && GIFT_TYPES) {
      const loves = npc.giftPreferences.love.map(gid => GIFT_TYPES[gid] ? GIFT_TYPES[gid].name : '').filter(Boolean).join('、');
      if (loves) prefTag = `<span style="font-size:10px;color:var(--accent-gold)">喜好: ${loves}</span>`;
    }

    // 生成对话内容
    let dialogHTML = `
      <div style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:12px;color:var(--text-muted)">${npc.desc} ${prefTag}</span>
        <span style="font-size:11px;padding:2px 8px;border-radius:4px;background:var(--bg-hover)">
          好感度: ${favor} (${fLabel})
        </span>
      </div>
      <div style="font-size:13px;line-height:1.8;color:var(--text-secondary);margin-bottom:16px;min-height:60px;" id="npc-dialog-text">
        <span style="color:var(--text-muted)">正在生成对话...</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;" id="npc-actions"></div>
    `;
    contentEl.innerHTML = dialogHTML;

    // 生成LLM对话
    if (typeof LLM !== 'undefined') {
      LLM.generateNPCDialog(npcId, dialogType, getFavorLevel(npcId)).then(text => {
        const el = document.getElementById('npc-dialog-text');
        if (el) el.textContent = text;
      });
    } else {
      document.getElementById('npc-dialog-text').textContent = `${npc.name}：「最近生意怎么样？」`;
    }

    // 动作按钮：gift 模式直接打开礼物菜单
    if (dialogType === 'gift') {
      openGiftMenu(npcId);
    } else if (dialogType === 'business') {
      negotiate(npcId, 'business');
      closeDialog();
      if (typeof UI !== 'undefined') UI.renderAll();
    } else {
      renderNPCActions(npcId);
    }
  }

  function renderNPCActions(npcId) {
    const npc = NPCS[npcId];
    const container = document.getElementById('npc-actions');
    if (!container) return;

    const actions = [];

    // 通用：送礼
    actions.push({ text: '🎁 送礼（选择礼物）', fn: () => { openGiftMenu(npcId); } });
    // 通用：约谈
    actions.push({ text: '💼 商务约谈', fn: () => { negotiate(npcId, 'business'); closeDialog(); if (typeof UI !== 'undefined') UI.renderAll(); } });

    // 可用任务线
    const availableQuests = getAvailableQuests(npcId);
    availableQuests.forEach(quest => {
      const progress = getQuestProgress(npcId, quest.id);
      if (progress && progress.stepIndex > 0) {
        // 进行中的任务
        actions.push({ text: `📋 ${quest.name}（进行中：第${progress.stepIndex + 1}/${quest.steps.length}步）`, fn: () => { advanceQuest(npcId, quest.id); } });
      } else {
        // 新任务
        actions.push({ text: `📋 ${quest.name}（新任务）`, fn: () => { startQuest(npcId, quest.id); } });
      }
    });

    // NPC特定动作
    // 商业并购（好感≥60 且未并购过）
    var maCost = (SGame && typeof SGame.calculateMACost === 'function') ? SGame.calculateMACost(npcId) : null;
    if (maCost && maCost > 0) {
      var maNpcName = (NPCS && NPCS[npcId]) ? NPCS[npcId].name : npcId;
      actions.push({ text: '🤝 商讨并购事宜', fn: () => { showMAOffer(npcId, maCost); } });
    }
    if (npcId === 'zhaolei') {
      actions.push({ text: '询问行业趋势（人脉+1，好感+2）', fn: () => { changeFavor('zhaolei', 2); addConnections(1); EventSystem.addLog('赵磊分享了一些行业见解。'); } });
      actions.push({ text: '谈合作（需求：资金100万）', fn: () => {
        if (SGame.G.money < 1e6) { EventSystem.addLog('资金不足，无法与赵磊合作。'); return; }
        SGame.G.money -= 1e6; changeFavor('zhaolei', 10); EventSystem.addLog('你与赵磊达成了技术合作。');
      }});
    } else if (npcId === 'lichu') {
      actions.push({ text: '申请政策解读（好感+1）', fn: () => { changeFavor('lichu', 1); EventSystem.addLog('李处帮你解读了最新政策。'); } });
      actions.push({ text: '寻求补贴（需求：声誉>40）', fn: () => {
        if (SGame.G.reputation < 40) { EventSystem.addLog('声誉不够，李处表示无法帮忙。'); return; }
        SGame.G.money += 5e5; changeFavor('lichu', 5); EventSystem.addLog('李处帮你申请到了50万创业补贴！');
      }});
    } else if (npcId === 'zhangye') {
      actions.push({ text: '购买情报（花钱5万换信息）', fn: () => {
        if (SGame.G.money < 5e4) { EventSystem.addLog('钱不够买情报。'); return; }
        SGame.G.money -= 5e4; changeFavor('zhangye', 2); EventSystem.addLog('张野卖给你一条有价值的消息。');
      }});
      actions.push({ text: '打听竞争对手', fn: () => { changeFavor('zhangye', 3); EventSystem.addLog('张野帮你打听到了竞争对手的动向。'); } });
    } else if (npcId === 'chenzong') {
      actions.push({ text: '拜访陈总（好感+1）', fn: () => { changeFavor('chenzong', 1); EventSystem.addLog('你拜访了海天集团董事长陈总。'); } });
      actions.push({ text: '寻求投资（需求：资金>1000万）', fn: () => {
        if (SGame.G.money < 1e7) { EventSystem.addLog('规模太小，陈总不感兴趣。'); return; }
        SGame.G.money += 2e7; changeFavor('chenzong', 8); EventSystem.addLog('陈总注资2000万！');
      }});
    } else if (npcId === 'xiaoc') {
      actions.push({ text: '表达意向', fn: () => { changeFavor('xiaoc', 2); EventSystem.addLog('你向小C表达了投资合作意向。'); } });
    } else if (npcId === 'sujie') {
      actions.push({ text: '推荐人才（人脉+2，好感+2）', fn: () => {
        changeFavor('sujie', 2); SGame.addConnections(2);
        var talentPool = ['资深工程师','产品经理','运营总监','数据分析师','销售主管'];
        var pick = talentPool[Math.floor(Math.random() * talentPool.length)];
        EventSystem.addLog('苏姐推荐了一位' + pick + '候选人来面试。');
      }});
      actions.push({ text: '快速招聘通道（费用5万，立即获得一名员工）', fn: () => {
        if (SGame.G.money < 5e4) { EventSystem.addLog('资金不足，无法使用快速招聘通道。'); closeDialog(); return; }
        if ((SGame.G.employees || []).length >= SGame.getEmpMax()) { EventSystem.addLog('员工已达上限，无法继续招聘。'); closeDialog(); return; }
        SGame.G.money -= 5e4; changeFavor('sujie', 5);
        var roles = ['manager','developer','sales','marketer'];
        var role = roles[Math.floor(Math.random() * roles.length)];
        var roleNames = { manager:'管理者', developer:'研发人员', sales:'销售', marketer:'市场' };
        var emp = {
          id: 'emp_' + Date.now(), name: '新员工' + Date.now().toString(36).slice(-3).toUpperCase(),
          role: role, skill: 2, loyalty: 60, fatigue: 0, happiness: 60
        };
        if (!SGame.G.employees) SGame.G.employees = [];
        SGame.G.employees.push(emp);
        EventSystem.addLog('苏姐帮你物色了一位' + roleNames[role] + '！');
      }});
    } else if (npcId === 'jinhangzhang') {
      actions.push({ text: '咨询贷款方案（好感+1）', fn: () => { changeFavor('jinhangzhang', 1); EventSystem.addLog('金行长给你分析了当前最优的贷款策略。'); } });
      actions.push({ text: '申请特别信贷额度（声誉>50，获得一笔低息贷款）', fn: () => {
        if (SGame.G.reputation < 50) { EventSystem.addLog('声誉不够，金行长表示按规矩不能破例。'); closeDialog(); return; }
        var loanAmt = 500000;
        var loan = { id: Date.now(), amount: loanAmt, duration: 24, remaining: 24, interestRate: 6.0, interestPerTick: Math.round(loanAmt * 0.06 / 24), repaid: false };
        SGame.G.loans.push(loan); SGame.G.money += loanAmt; changeFavor('jinhangzhang', 5);
        SGame.G.neverLoaned = false;
        EventSystem.addLog('金行长特批：' + SGame.formatMoney(loanAmt) + '低息贷款到账！');
      }});
    } else if (npcId === 'qianlaoban') {
      actions.push({ text: '请钱老板估价（随机评估一件持有资产）', fn: () => {
        if (!SGame.G.assets || SGame.G.assets.length === 0) { EventSystem.addLog('你还没有任何资产可以估价。'); closeDialog(); return; }
        var ast = SGame.G.assets[Math.floor(Math.random() * SGame.G.assets.length)];
        var estVal = Math.round(ast.purchasePrice * (0.8 + Math.random() * 1.4));
        changeFavor('qianlaoban', 2);
        EventSystem.addLog('钱老板看了你手中的' + ast.name + '，估价约' + SGame.formatMoney(estVal) + '。');
      }});
      actions.push({ text: '打听拍卖行情（了解当前热门资产）', fn: () => {
        changeFavor('qianlaoban', 3); SGame.addConnections(1);
        var trends = ['艺术品','商业地产','科技专利','矿产权益','古董收藏'];
        var hot = trends[Math.floor(Math.random() * trends.length)];
        EventSystem.addLog('钱老板透露：最近' + hot + '类资产行情看涨。');
      }});
      actions.push({ text: '委托拍卖资产（选择一件资产上拍）', fn: () => {
        if (!SGame.G.assets || SGame.G.assets.length === 0) { EventSystem.addLog('没有资产可以委托拍卖。'); closeDialog(); return; }
        var ast = SGame.G.assets[0];
        var askPrice = Math.round(ast.purchasePrice * (1.1 + Math.random() * 0.5));
        if (!SGame.G.assetAuctionList) SGame.G.assetAuctionList = [];
        SGame.G.assetAuctionList.push({ assetId: ast.id, askPrice: askPrice, sellTick: SGame.G.tickCount + 5 + Math.floor(Math.random() * 10) });
        changeFavor('qianlaoban', 5);
        EventSystem.addLog('已将' + ast.name + '委托拍卖，底价' + SGame.formatMoney(askPrice) + '。');
      }});
    } else if (npcId === 'sunmishu') {
      actions.push({ text: '打听政策动向（人脉+1，好感+1）', fn: () => { changeFavor('sunmishu', 1); SGame.addConnections(1); EventSystem.addLog('孙秘书透露了近期几个政策调整方向。'); } });
      actions.push({ text: '获取区域评估报告（了解最适合业务的区域）', fn: () => {
        changeFavor('sunmishu', 2);
        var recRegions = Object.values(REGIONS).filter(function(r) { return r.unlocked && r.bonus.retail; }).slice(0, 3);
        var names = recRegions.map(function(r) { return r.name; }).join('、');
        if (!names) names = '暂无特别推荐';
        EventSystem.addLog('孙秘书建议重点关注：' + names + '。');
      }});
      actions.push({ text: '协助办理区域入驻手续（费用2万，关键区域提前解锁）', fn: () => {
        if (SGame.G.money < 2e4) { EventSystem.addLog('费用不足。'); closeDialog(); return; }
        SGame.G.money -= 2e4; changeFavor('sunmishu', 4);
        var lockedRegions = Object.values(REGIONS).filter(function(r) { return !r.unlocked && r.actUnlock <= SGame.G.act; });
        if (lockedRegions.length > 0) {
          var r = lockedRegions[0];
          r.unlocked = true; SGame.G.unlockedRegions.push(r.id);
          EventSystem.addLog('孙秘书帮你走了快速通道，' + r.name + '提前解锁！');
        } else {
          EventSystem.addLog('孙秘书表示暂时没有需要特批的区域。');
        }
      }});
    } else if (npcId === 'wujiaolian') {
      actions.push({ text: '团队效率诊断（好感+1）', fn: () => { changeFavor('wujiaolian', 1); EventSystem.addLog('吴教练给你的团队做了一次快速评估，指出了几个改进方向。'); } });
      actions.push({ text: '强化培训（花费3万，随机选一个员工技能+1）', fn: () => {
        if (SGame.G.money < 3e4) { EventSystem.addLog('培训费不足。'); closeDialog(); return; }
        if (!SGame.G.employees || SGame.G.employees.length === 0) { EventSystem.addLog('公司还没有员工。'); closeDialog(); return; }
        SGame.G.money -= 3e4;
        var emp = SGame.G.employees[Math.floor(Math.random() * SGame.G.employees.length)];
        emp.skill = Math.min(5, (emp.skill || 1) + 1);
        emp.loyalty = Math.min(100, (emp.loyalty || 0) + 8);
        changeFavor('wujiaolian', 4);
        EventSystem.addLog('吴教练对' + emp.name + '进行了特训，技能升至' + emp.skill + '级！');
      }});
    } else if (npcId === 'liukuaiji') {
      actions.push({ text: '财务审计（发现漏洞，可能获得退款）', fn: () => {
        changeFavor('liukuaiji', 2);
        var found = Math.floor(Math.random() * 80000) + 10000;
        SGame.G.money += found;
        EventSystem.addLog('刘会计帮你审计后发现了一笔' + SGame.formatMoney(found) + '的多缴款项，已退回。');
      }});
      actions.push({ text: '税务优化咨询（降低当前维护成本10%，持续12Tick）', fn: () => {
        if (SGame.G.money < 3e4) { EventSystem.addLog('咨询费不足。'); closeDialog(); return; }
        SGame.G.money -= 3e4; changeFavor('liukuaiji', 4);
        if (!SGame.G._taxOptBuff) SGame.G._taxOptBuff = { remaining: 0, discount: 0 };
        SGame.G._taxOptBuff.remaining = 12;
        SGame.G._taxOptBuff.discount = 0.10;
        EventSystem.addLog('刘会计帮你优化了税务结构，维护成本临时降低10%（持续12Tick）。');
      }});
    }

    actions.push({ text: '关闭对话', fn: () => { document.getElementById('modal-npc').classList.remove('active'); } });

    // 存储到模块变量供 doAction 引用
    currentActions = actions;

    container.innerHTML = actions.map(a =>
      `<button class="event-choice" onclick="NPCSystem.doAction(${actions.indexOf(a)})">${a.text}</button>`
    ).join('');
  }

  function doAction(idx) {
    const npcId = currentNPC;
    if (!npcId) return;

    // 优先使用闭包回调（支持动态索引，兼容任务线动态插入）
    if (currentActions[idx] && typeof currentActions[idx].fn === 'function') {
      currentActions[idx].fn();
      return;
    }

    // 兜底：兼容旧版硬编码逻辑（仅原有 8 位 NPC）
    // idx 0 总是送礼菜单
    if (idx === 0) { openGiftMenu(npcId); return; }
    // idx 1 总是商务约谈
    if (idx === 1) {
      negotiate(npcId, 'business');
      closeDialog();
      if (typeof UI !== 'undefined') UI.renderAll();
      return;
    }

    if (npcId === 'zhaolei') {
      if (idx === 2) { changeFavor('zhaolei', 2); SGame.addConnections(1); EventSystem.addLog('赵磊分享了一些行业见解。'); }
      else if (idx === 3) {
        if (SGame.G.money < 1e6) { EventSystem.addLog('资金不足，无法与赵磊合作。'); closeDialog(); return; }
        SGame.G.money -= 1e6; changeFavor('zhaolei', 10);
        SGame.addConnections(2);
        EventSystem.addLog('你与赵磊达成了技术合作。');
      }
    } else if (npcId === 'lichu') {
      if (idx === 2) { changeFavor('lichu', 1); EventSystem.addLog('李处帮你解读了最新政策。'); }
      else if (idx === 3) {
        if (SGame.G.reputation < 40) { EventSystem.addLog('声誉不够，李处表示无法帮忙。'); closeDialog(); return; }
        SGame.G.money += 5e5; changeFavor('lichu', 5); EventSystem.addLog('李处帮你申请到了50万创业补贴！');
      }
    } else if (npcId === 'zhangye') {
      if (idx === 2) {
        if (SGame.G.money < 5e4) { EventSystem.addLog('钱不够买情报。'); closeDialog(); return; }
        SGame.G.money -= 5e4; changeFavor('zhangye', 2); EventSystem.addLog('张野卖给你一条有价值的消息。');
      } else if (idx === 3) { changeFavor('zhangye', 3); EventSystem.addLog('张野帮你打听到了竞争对手的动向。'); }
    } else if (npcId === 'chenzong') {
      if (idx === 2) { changeFavor('chenzong', 1); EventSystem.addLog('你拜访了海天集团董事长陈总。'); }
      else if (idx === 3) {
        if (SGame.G.money < 1e7) { EventSystem.addLog('规模太小，陈总不感兴趣。'); closeDialog(); return; }
        SGame.G.money += 2e7; changeFavor('chenzong', 8); EventSystem.addLog('陈总注资2000万！');
      }
    } else if (npcId === 'xiaoc') {
      if (idx === 2) { changeFavor('xiaoc', 2); EventSystem.addLog('你向小C表达了投资合作意向。'); }
    }

    // 关闭对话
    closeDialog();
    if (typeof UI !== 'undefined') UI.renderAll();
  }

  // ========== 送给礼物 ==========
  function giveGift(npcId, giftType) {
    const npc = NPCS[npcId];
    if (!npc) return { ok: false, msg: '未知NPC' };
    const gift = GIFT_TYPES[giftType];
    if (!gift) return { ok: false, msg: '未知礼物类型' };

    // 每日送礼冷却
    const today = SGame.G.gameDay || 1;
    const key = npcId + '_' + today;
    if (SGame.G.todayGifted && SGame.G.todayGifted[key]) {
      return { ok: false, msg: '今天已经给' + npc.name + '送过礼了' };
    }

    if (SGame.G.money < gift.cost) {
      return { ok: false, msg: `资金不足（需要${SGame.formatMoney(gift.cost)}）` };
    }

    // 区域加成：socialCost 增加送礼实际花费
    var actualCost = gift.cost;
    if (typeof SGame.getRegionModifiers === 'function') {
      var rm = SGame.getRegionModifiers();
      if (rm && rm.socialCost > 1.0) actualCost = Math.round(gift.cost * rm.socialCost);
    }
    if (SGame.G.money < actualCost) {
      return { ok: false, msg: `资金不足（需要${SGame.formatMoney(actualCost)}，${gift.name}标价${SGame.formatMoney(gift.cost)}）` };
    }

    SGame.G.money -= actualCost;

    // 根据偏好计算好感
    let favorDelta;
    const prefs = npc.giftPreferences || { love:[], like:[], neutral:[] };
    if (prefs.love.includes(giftType)) {
      favorDelta = 8 + Math.floor(Math.random() * 8); // 8-15
      EventSystem.addLog(`${npc.name}收到${gift.name}后眼睛一亮：「太懂我了！」好感 +${favorDelta}`);
    } else if (prefs.like.includes(giftType)) {
      favorDelta = 3 + Math.floor(Math.random() * 6); // 3-8
      EventSystem.addLog(`${npc.name}微笑着收下${gift.name}：「不错，谢谢。」好感 +${favorDelta}`);
    } else {
      favorDelta = 1 + Math.floor(Math.random() * 3); // 1-3
      EventSystem.addLog(`${npc.name}礼貌地收下了${gift.name}。好感 +${favorDelta}`);
    }

    changeFavor(npcId, favorDelta);
    if (!SGame.G.todayGifted) SGame.G.todayGifted = {};
    SGame.G.todayGifted[key] = true;

    return { ok: true, msg: `送${npc.name}${gift.name}（花费${SGame.formatMoney(gift.cost)}），好感+${favorDelta}` };
  }

  function canGiftToday(npcId) {
    const today = SGame.G.gameDay || 1;
    const key = npcId + '_' + today;
    return !(SGame.G.todayGifted && SGame.G.todayGifted[key]);
  }

  // ========== 商务约谈 ==========
  function negotiate(npcId, dealType) {
    const npc = NPCS[npcId];
    if (!npc) return { ok: false, msg: '未知NPC' };
    const favor = getFavor(npcId);

    if (favor < 0) {
      EventSystem.addLog(`${npc.name}冷冷地看了你一眼：「现在还不是谈合作的时候。」`);
      return { ok: false, msg: '好感度过低，无法约谈' };
    }

    let result;
    if (favor >= 80) {
      // 亲密：永久加成
      SGame.G.money += Math.floor(Math.random() * 50000) + 20000;
      SGame.addConnections(2); // 深度合作，人脉+2
      changeFavor(npcId, 3);
      EventSystem.addLog(`${npc.name}：「咱们是老朋友了，这个项目稳赚！」（获得资金+人脉加成）`);
      result = { ok: true, msg: '深度合作达成，获得大幅加成' };
    } else if (favor >= 60) {
      // 友好：可能解锁特殊业务
      const unlock = Math.random() < 0.4;
      if (unlock) {
        SGame.G.money += Math.floor(Math.random() * 30000) + 10000;
        SGame.G.reputation += 5;
        changeFavor(npcId, 4);
        EventSystem.addLog(`${npc.name}：「我有个特殊项目，要不要一起做？」（解锁特殊收益）`);
        result = { ok: true, msg: '解锁特殊业务机会' };
      } else {
        SGame.G.money += Math.floor(Math.random() * 10000) + 5000;
        changeFavor(npcId, 2);
        EventSystem.addLog(`${npc.name}：「合作愉快！」`);
        result = { ok: true, msg: '合作顺利，获得小额收益' };
      }
    } else if (favor >= 30) {
      // 中立：小收益
      SGame.G.money += Math.floor(Math.random() * 8000) + 3000;
      SGame.addConnections(1);
      changeFavor(npcId, 2);
      EventSystem.addLog(`${npc.name}：「可以试试，但别抱太大期望。」`);
      result = { ok: true, msg: '初步合作，获得小额收益' };
    } else {
      EventSystem.addLog(`${npc.name}：「再处处看吧，现在下结论太早。」`);
      result = { ok: false, msg: '关系还不够深，再培养培养' };
    }

    return result;
  }

  function openGiftMenu(npcId) {
    const container = document.getElementById('npc-actions');
    if (!container) return;
    const npc = NPCS[npcId];

    let html = '';
    Object.entries(GIFT_TYPES).forEach(([gid, gift]) => {
      html += `<button class="event-choice" onclick="NPCSystem._giveGift('${npcId}','${gid}');NPCSystem.closeDialog();if(typeof UI!=='undefined')UI.renderAll();">${gift.name} (${SGame.formatMoney(gift.cost)})</button>`;
    });
    html += `<button class="event-choice" onclick="NPCSystem.renderNPCActions('${npcId}')">← 返回</button>`;
    container.innerHTML = html;
  }

  // 内部用：送礼 + 日志（给 onclick 直接调用）
  function _giveGift(npcId, giftType) {
    const result = giveGift(npcId, giftType);
    if (typeof EventSystem !== 'undefined' && EventSystem.addLog) {
      EventSystem.addLog(result.msg);
    }
  }

  // ========== 任务线系统 ==========

  // 获取NPC可用的任务线列表
  function getAvailableQuests(npcId) {
    const npc = NPCS[npcId];
    if (!npc || !npc.questLines) return [];
    const favor = getFavor(npcId);
    const completed = (SGame.G.questCompleted && SGame.G.questCompleted[npcId]) || [];

    return npc.questLines.filter(q => {
      // 已完成的不显示
      if (completed.includes(q.id)) return false;
      // 好感度不足
      if (favor < q.reqFavor) return false;
      // 检查前置任务（如果有 prerequisite 字段）
      if (q.prerequisite && !completed.includes(q.prerequisite)) return false;
      return true;
    });
  }

  // 获取任务进度
  function getQuestProgress(npcId, questId) {
    if (!SGame.G.questProgress) return null;
    if (!SGame.G.questProgress[npcId]) return null;
    return SGame.G.questProgress[npcId][questId] || null;
  }

  // 开始任务
  function startQuest(npcId, questId) {
    const npc = NPCS[npcId];
    if (!npc) return { ok: false, msg: '未知NPC' };

    const quest = npc.questLines.find(q => q.id === questId);
    if (!quest) return { ok: false, msg: '未知任务' };

    // 检查好感度
    if (getFavor(npcId) < quest.reqFavor) {
      EventSystem.addLog(`${npc.name}：「咱们还不够熟，这件事以后再说吧。」`);
      return { ok: false, msg: '好感度不足' };
    }

    // 初始化任务进度
    if (!SGame.G.questProgress) SGame.G.questProgress = {};
    if (!SGame.G.questProgress[npcId]) SGame.G.questProgress[npcId] = {};

    SGame.G.questProgress[npcId][questId] = { stepIndex: 0, started: true };

    // 执行第一步
    const step = quest.steps[0];
    EventSystem.addLog(`📋 新任务：${quest.name} — ${step.text}`);
    applyQuestReward(step.reward, npcId);

    // 如果只有一步，直接完成
    if (quest.steps.length <= 1) {
      completeQuest(npcId, questId);
    }

    // 刷新NPC对话
    renderNPCActions(npcId);
    return { ok: true, msg: `开始任务：${quest.name}` };
  }

  // 推进任务
  function advanceQuest(npcId, questId) {
    const npc = NPCS[npcId];
    if (!npc) return { ok: false, msg: '未知NPC' };

    const quest = npc.questLines.find(q => q.id === questId);
    if (!quest) return { ok: false, msg: '未知任务' };

    const progress = getQuestProgress(npcId, questId);
    if (!progress) return { ok: false, msg: '任务未开始' };

    const nextIndex = progress.stepIndex + 1;

    if (nextIndex >= quest.steps.length) {
      // 不应该到这里，任务应该已经完成了
      return { ok: false, msg: '任务已完成' };
    }

    // 推进到下一步
    progress.stepIndex = nextIndex;
    const step = quest.steps[nextIndex];

    EventSystem.addLog(`📋 ${quest.name}（第${nextIndex + 1}/${quest.steps.length}步）— ${step.text}`);
    applyQuestReward(step.reward, npcId);

    // 检查是否完成全部步骤
    if (nextIndex >= quest.steps.length - 1) {
      completeQuest(npcId, questId);
    }

    // 刷新NPC对话
    renderNPCActions(npcId);
    return { ok: true, msg: `任务推进：${quest.name}` };
  }

  // 完成任务
  function completeQuest(npcId, questId) {
    const npc = NPCS[npcId];
    if (!npc) return;

    // 记录完成
    if (!SGame.G.questCompleted) SGame.G.questCompleted = {};
    if (!SGame.G.questCompleted[npcId]) SGame.G.questCompleted[npcId] = [];
    if (!SGame.G.questCompleted[npcId].includes(questId)) {
      SGame.G.questCompleted[npcId].push(questId);
    }

    // 清除进度
    if (SGame.G.questProgress && SGame.G.questProgress[npcId]) {
      delete SGame.G.questProgress[npcId][questId];
    }

    const quest = npc.questLines.find(q => q.id === questId);
    EventSystem.addLog(`✅ 任务完成：${quest ? quest.name : questId}！`);

    // 完成任务额外奖励：1技能点
    SGame.G.statPoints = (SGame.G.statPoints || 0) + 1;
    EventSystem.addLog('获得1技能点作为任务完成奖励！');
  }

  // 应用任务奖励
  function applyQuestReward(reward, sourceNpcId) {
    if (!reward) return;

    // 金钱奖励（负值为扣除）
    if (reward.money) {
      SGame.G.money += reward.money;
      if (reward.money > 0) {
        EventSystem.addLog(`获得资金 ${SGame.formatMoney(reward.money)}`);
      } else if (reward.money < 0) {
        EventSystem.addLog(`花费 ${SGame.formatMoney(Math.abs(reward.money))}`);
      }
    }

    // 声誉
    if (reward.reputation) {
      SGame.G.reputation += reward.reputation;
      EventSystem.addLog(`声誉 ${reward.reputation > 0 ? '+' : ''}${reward.reputation}`);
    }

    // 压力
    if (reward.stress) {
      SGame.G.stress = Math.max(0, Math.min(100, (SGame.G.stress || 0) + reward.stress));
      EventSystem.addLog(`压力 ${reward.stress > 0 ? '+' : ''}${reward.stress}`);
    }

    // 人脉
    if (reward.connections) {
      const scaled = Math.floor(reward.connections * ((typeof CONFIG !== 'undefined' && CONFIG.CONNECTIONS_GAIN_SCALE) || 0.6));
      SGame.addConnections(scaled);
      EventSystem.addLog(`人脉 ${scaled > 0 ? '+' : ''}${scaled}`);
    }

    // NPC好感度（含联动传播）
    if (reward.npcFavor) {
      for (const [nid, delta] of Object.entries(reward.npcFavor)) {
        changeFavor(nid, delta);
      }
    }

    // 技能点
    if (reward.statPoints) {
      SGame.G.statPoints = (SGame.G.statPoints || 0) + reward.statPoints;
      EventSystem.addLog(`获得 ${reward.statPoints} 技能点`);
    }
  }

  // 获取所有NPC的任务完成情况（供UI展示）
  function getAllQuestStatus() {
    const result = [];
    for (const [npcId, npc] of Object.entries(NPCS)) {
      if (!npc.questLines) continue;
      const completed = (SGame.G.questCompleted && SGame.G.questCompleted[npcId]) || [];
      const progress = (SGame.G.questProgress && SGame.G.questProgress[npcId]) || {};

      for (const quest of npc.questLines) {
        const isCompleted = completed.includes(quest.id);
        const prog = progress[quest.id];
        result.push({
          npcId,
          npcName: npc.name,
          questId: quest.id,
          questName: quest.name,
          desc: quest.desc,
          reqFavor: quest.reqFavor,
          completed: isCompleted,
          inProgress: !!prog,
          stepIndex: prog ? prog.stepIndex : 0,
          totalSteps: quest.steps.length,
          available: !isCompleted && !prog && getFavor(npcId) >= quest.reqFavor,
        });
      }
    }
    return result;
  }

  // ========== 商业并购确认 ==========
  function showMAOffer(npcId, cost) {
    const npc = NPCS[npcId];
    if (!npc) return;
    const G = SGame.G;
    const favor = getFavor(npcId);
    const bv = typeof NPC_BUSINESS_VALUE !== 'undefined' ? NPC_BUSINESS_VALUE : {};
    const value = bv[npcId] || 0;
    const liquidBonus = Math.round(value * CONFIG.MA_LIQUID_BONUS_RATIO);
    const revenuePerTick = Math.max(1, Math.round(value * CONFIG.MA_REVENUE_RATIO * (favor / 80)));

    const msg =
      `${npc.name}：「我们合作得很愉快，如果你有意整合我的业务，我愿意以${SGame.formatMoney(cost)}的价格将业务并入你的集团。\n\n` +
      `并购后你将一次性获得${SGame.formatMoney(liquidBonus)}现金，且每Tick增加${SGame.formatMoney(revenuePerTick)}的收入。\n\n` +
      `确认并购？」`;

    // 使用游戏内置确认框
    const modal = document.getElementById('modal-npc');
    const contentEl = document.getElementById('npc-dialog-content');
    if (!contentEl) { if (confirm(msg.replace(/\n/g, ''))) doMAConfirm(npcId, cost); return; }

    contentEl.innerHTML = `
      <div style="line-height:2;">
        <p>${npc.name}：「我们合作得很愉快，如果你有意整合我的业务，我愿意以<b>${SGame.formatMoney(cost)}</b>的价格将业务并入你的集团。」</p>
        <p>并购后你将一次性获得<b>${SGame.formatMoney(liquidBonus)}</b>现金，且每Tick增加<b>${SGame.formatMoney(revenuePerTick)}</b>的收入。</p>
        <div style="margin-top:16px;display:flex;gap:10px;justify-content:center;">
          <button class="event-choice" onclick="NPCSystem._doMAConfirm('${npcId}',${cost});">确认并购</button>
          <button class="event-choice" style="background:var(--bg-hover);" onclick="NPCSystem.closeDialog();">再考虑看看</button>
        </div>
      </div>`;
  }

  function _doMAConfirm(npcId, cost) {
    const result = SGame.acquireBusiness(npcId);
    alert(result.msg);
    if (result.ok) {
      closeDialog();
      if (typeof UI !== 'undefined') UI.renderAll();
    }
  }

  // ========== 关闭对话 ==========
  function closeDialog() {
    document.getElementById('modal-npc').classList.remove('active');
    currentNPC = null;
  }

  // ========== 公开API ==========
  return {
    getFavor, getFavorLevel, getFavorLabel,
    changeFavor,
    openDialog, closeDialog, doAction,
    giveGift, _giveGift, canGiftToday, negotiate, openGiftMenu,
    renderNPCActions,
    // 任务线系统
    getAvailableQuests, getQuestProgress, startQuest, advanceQuest,
    completeQuest, applyQuestReward, getAllQuestStatus,
    // 商业并购
    showMAOffer,
  };
})();
