// ==================================================
// npc.js — NPC系统：好感度、对话、事件链
// ==================================================

window.NPCSystem = (() => {
  let currentNPC = null;

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

  // ========== 好感度变化 ==========
  function changeFavor(npcId, delta) {
    const old = getFavor(npcId);
    SGame.G.npcFavor[npcId] = Math.max(-50, Math.min(100, old + delta));
    const newLv = getFavorLevel(npcId);
    const oldLv = old <= -20 ? 0 : old <= 0 ? 1 : old <= 30 ? 2 : old <= 70 ? 3 : 4;
    if (newLv !== oldLv) {
      const npc = NPCS[npcId];
      EventSystem.addLog(`${npc.name}的好感度变为${npc.favorLevels[newLv]}。`);
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

    if (npcId === 'zhaolei') {
      actions.push({ text: '询问行业趋势（人脉+1，好感+2）', fn: () => { changeFavor('zhaolei', 2); SGame.G.connections++; EventSystem.addLog('赵磊分享了一些行业见解。'); } });
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
    }

    actions.push({ text: '关闭对话', fn: () => { document.getElementById('modal-npc').classList.remove('active'); } });

    container.innerHTML = actions.map(a =>
      `<button class="event-choice" onclick="NPCSystem.doAction(${actions.indexOf(a)})">${a.text}</button>`
    ).join('');
  }

  function doAction(idx) {
    const npcId = currentNPC;
    if (!npcId) return;

    // idx 0 总是送礼菜单
    if (idx === 0) { openGiftMenu(npcId); return; }
    // idx 1 总是商务约谈
    if (idx === 1) {
      negotiate(npcId, 'business');
      closeDialog();
      if (typeof UI !== 'undefined') UI.renderAll();
      return;
    }

    // idx 2+ 是各 NPC 特定动作
    if (npcId === 'zhaolei') {
      if (idx === 2) { changeFavor('zhaolei', 2); SGame.G.connections++; EventSystem.addLog('赵磊分享了一些行业见解。'); }
      else if (idx === 3) {
        if (SGame.G.money < 1e6) { EventSystem.addLog('资金不足，无法与赵磊合作。'); closeDialog(); return; }
        SGame.G.money -= 1e6; changeFavor('zhaolei', 10); EventSystem.addLog('你与赵磊达成了技术合作。');
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

    // 关闭对话（关闭按钮 idx 4+ 会落在这里）
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

    SGame.G.money -= gift.cost;

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
      SGame.G.connections += 3;
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
      SGame.G.connections += 1;
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
  };
})();
