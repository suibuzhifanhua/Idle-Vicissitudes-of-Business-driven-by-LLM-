// ==================================================
// npc.js — NPC系统：好感度、对话、事件链、任务线、NPC联动
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

  // ========== 好感度变化（含NPC联动传播） ==========
  function changeFavor(npcId, delta) {
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
      SGame.G.connections = (SGame.G.connections || 0) + reward.connections;
      EventSystem.addLog(`人脉 ${reward.connections > 0 ? '+' : ''}${reward.connections}`);
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
  };
})();
