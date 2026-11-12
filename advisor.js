// Author: Fisheep.L
// ==================================================
// advisor.js — 智能顾问系统：分析游戏状态，调用LLM生成策略建议
// ==================================================

window.Advisor = (function() {

  var _lastAdviceTime = 0;
  var _cooldownTicks = 5;        // 最少间隔5个Tick
  var _lastResult = null;
  var _requesting = false;
  var _queueDepth = 0;

  // Promise 链式排队：保证 getAdvice 的 FIFO 顺序执行
  // 每个请求 await 前一个完成后再执行，避免"顾问正忙"被直接丢弃
  var _chainPromise = Promise.resolve();

  // ========== 构建游戏状态摘要 ==========
  function buildStateSummary() {
    if (typeof SGame === 'undefined' || !SGame.G) return null;
    var G = SGame.G;

    var summary = {
      // 基础信息
      money: SGame.formatMoney ? SGame.formatMoney(G.money) : G.money,
      tick: G.tickCount || 0,
      reputation: G.reputation || 0,
      stress: G.stress || 0,
      connections: G.connections || 0,
      origin: G.origin || '未知',

      // 经济环境
      economy: G.economicState || 'stable',
      weather: G.currentWeather || 'sunny',
      act: G.currentAct || 0,

      // 业务信息
      businesses: [],
      totalBizLevel: 0,

      // 员工信息
      employees: [],
      employeeCount: 0,

      // 区域信息
      cities: [],
      regions: [],

      // 已解锁技能
      unlockedSkills: G.unlockedSkills || [],

      // 已解锁成就（最近5个）
      recentAchievements: (G.unlockedAchievements || []).slice(-5),

      // 当前待决策
      pendingDecisions: (typeof SGame !== 'undefined' && SGame.pendingDecisions ? SGame.pendingDecisions.length : 0),

      // 排名
      rankTier: '',
      nextTier: '',

      // 维护成本和收入
      totalIncome: 0,
      maintenanceCost: 0,
      salaryCost: 0,
    };

    // 遍历所有城市和业务
    if (G.cities) {
      Object.entries(G.cities).forEach(function(entry) {
        var cityId = entry[0];
        var cityData = entry[1];
        if (!cityData || !cityData.unlocked) return;
        var cityDef = (typeof CITIES !== 'undefined' && CITIES[cityId]) ? CITIES[cityId] : null;
        summary.cities.push({
          id: cityId,
          name: cityDef ? cityDef.name : cityId,
        });

        if (cityData.businesses) {
          Object.entries(cityData.businesses).forEach(function(bizEntry) {
            var bizId = bizEntry[0];
            var bizData = bizEntry[1];
            if (!bizData || bizData.level === 0) return;
            var bizDef = (typeof BUSINESS_DEFS !== 'undefined') ? BUSINESS_DEFS.find(function(b) { return b.id === bizId; }) : null;
            var lvDef = bizDef && bizDef.levels[bizData.level - 1];
            summary.businesses.push({
              id: bizId,
              name: bizDef ? bizDef.name : bizId,
              level: bizData.level,
              maxLevel: bizDef ? bizDef.levels.length : 10,
              income: lvDef ? lvDef.income : 0,
              city: cityId,
              canUpgrade: bizData.level < (bizDef ? bizDef.levels.length : 10),
              nextCost: (lvDef && bizDef && bizDef.levels[bizData.level]) ? bizDef.levels[bizData.level].cost : 0,
            });
            summary.totalBizLevel += bizData.level;
          });
        }
      });
    }

    // 员工详情
    if (G.employees) {
      summary.employeeCount = G.employees.length;
      G.employees.forEach(function(emp) {
        summary.employees.push({
          role: emp.role || 'unknown',
          loyalty: emp.loyalty || 50,
          fatigue: emp.fatigue || 0,
          skill: emp.skill || 1,
          isIntern: emp.role === 'intern',
        });
      });
      // 统计各角色数量
      var roleCounts = {};
      G.employees.forEach(function(emp) {
        roleCounts[emp.role] = (roleCounts[emp.role] || 0) + 1;
      });
      summary.roleCounts = roleCounts;
    }

    // 区域信息
    if (G.unlockedRegions) {
      summary.regions = G.unlockedRegions.slice(-5);
    }

    // 收入/成本计算
    if (typeof SGame.calcTotalIncome === 'function') {
      summary.totalIncome = SGame.formatMoney ? SGame.formatMoney(SGame.calcTotalIncome()) : SGame.calcTotalIncome();
    }
    if (typeof SGame.calcMaintenanceCost === 'function') {
      summary.maintenanceCost = SGame.formatMoney ? SGame.formatMoney(SGame.calcMaintenanceCost()) : SGame.calcMaintenanceCost();
    }

    // 排名等级
    if (typeof RANK_TIERS !== 'undefined') {
      for (var i = RANK_TIERS.length - 1; i >= 0; i--) {
        if (G.money >= RANK_TIERS[i].minMoney) {
          summary.rankTier = RANK_TIERS[i].name;
          if (i < RANK_TIERS.length - 1) {
            summary.nextTier = RANK_TIERS[i + 1].name + '（需要' + SGame.formatMoney(RANK_TIERS[i + 1].minMoney) + '）';
            summary.nextTierMoney = RANK_TIERS[i + 1].minMoney;
            summary.nextTierGap = RANK_TIERS[i + 1].minMoney - G.money;
          }
          break;
        }
      }
    }

    // 解锁区域条件检查
    if (typeof REGIONS !== 'undefined') {
      summary.unlockableRegions = [];
      Object.values(REGIONS).forEach(function(r) {
        if (r.unlocked) return; // 已解锁
        if (G.unlockedRegions && G.unlockedRegions.includes(r.id)) return; // 已解锁
        if (!r.unlockCond) {
          summary.unlockableRegions.push({ id: r.id, name: r.name, cond: '无' });
          return;
        }
        var met = true;
        var conds = [];
        if (r.unlockCond.money) {
          conds.push('资金≥' + SGame.formatMoney(r.unlockCond.money));
          if (G.money < r.unlockCond.money) met = false;
        }
        if (r.unlockCond.reputation) {
          conds.push('声誉≥' + r.unlockCond.reputation);
          if ((G.reputation || 0) < r.unlockCond.reputation) met = false;
        }
        if (r.unlockCond.act !== undefined) {
          conds.push('幕次≥' + r.unlockCond.act);
          if ((G.currentAct || 0) < r.unlockCond.act) met = false;
        }
        summary.unlockableRegions.push({
          id: r.id,
          name: r.name,
          cond: conds.join('、'),
          met: met,
        });
      });
    }

    return summary;
  }

  // ========== 构建LLM提示词 ==========
  function buildPrompt(summary) {
    if (!summary) return null;

    var lines = [];

    // 强制中文指令放在最前面，防止模型被后续英文地名带偏
    lines.push('【重要】你必须全程使用中文回复，所有分析、建议、理由都必须是中文。不要出现任何英文句子。');
    lines.push('');
    lines.push('你是《商海浮沉》这款放置类商业模拟游戏的战略顾问。');
    lines.push('以下是玩家当前的游戏状态，请分析并给出2-3条具体、可操作的发展建议。');
    lines.push('');
    lines.push('【玩家状态】');
    lines.push('- 资金: ' + summary.money);
    lines.push('- 游戏进度: 第' + summary.tick + 'Tick（第' + summary.act + '幕）');
    lines.push('- 当前排名: ' + summary.rankTier);
    if (summary.nextTier) {
      lines.push('- 下一等级: ' + summary.nextTier + '，差距' + SGame.formatMoney(summary.nextTierGap));
    }
    lines.push('- 声誉: ' + summary.reputation + '  |  压力: ' + summary.stress + '  |  人脉: ' + summary.connections);
    lines.push('- 经济环境: ' + summary.economy + '  |  天气: ' + summary.weather);

    lines.push('');
    lines.push('【已有业务】（共' + summary.totalBizLevel + '级）');
    summary.businesses.forEach(function(b) {
      var upgradeHint = '';
      if (b.canUpgrade && b.nextCost > 0 && summary.money) {
        var rawMoney = (typeof SGame !== 'undefined' && SGame.G) ? SGame.G.money : 0;
        if (rawMoney >= b.nextCost * 10000) {
          upgradeHint = ' [⭐可升级，费用' + SGame.formatMoney(b.nextCost * 10000) + ']';
        }
      }
      lines.push('  ' + b.name + ' Lv.' + b.level + '/' + b.maxLevel + '（' + b.city + '）' + upgradeHint);
    });

    lines.push('');
    lines.push('【团队】（共' + summary.employeeCount + '人）');
    if (summary.roleCounts) {
      Object.entries(summary.roleCounts).forEach(function(entry) {
        lines.push('  ' + entry[0] + ': ' + entry[1] + '人');
      });
    }

    if (summary.unlockableRegions && summary.unlockableRegions.length > 0) {
      lines.push('');
      lines.push('【可解锁区域】');
      summary.unlockableRegions.forEach(function(r) {
        var mark = r.met ? '✅' : '❌';
        lines.push('  ' + mark + ' ' + r.name + '（条件：' + r.cond + '）');
      });
    }

    if (summary.unlockedSkills && summary.unlockedSkills.length > 0) {
      lines.push('');
      lines.push('【已解锁技能】' + summary.unlockedSkills.slice(-5).join('、'));
    }

    if (summary.pendingDecisions > 0) {
      lines.push('');
      lines.push('⚠ 当前有' + summary.pendingDecisions + '个待处理的决策事件。');
    }

    lines.push('');
    lines.push('【请给出建议】');
    lines.push('必须用中文回复，格式如下：');
    lines.push('');
    lines.push('📊 当前评估：[一句话评价当前状态]');
    lines.push('');
    lines.push('💡 建议1：[具体行动，例如"升级XX业务到Lv.X"、"招聘一名XX"、"解锁XX区域"]');
    lines.push('   理由：[为什么这个建议现在最合适，说明预期收益]');
    lines.push('');
    lines.push('💡 建议2：[第二个具体行动]');
    lines.push('   理由：[说明理由]');
    lines.push('');
    lines.push('💡 建议3：[第三个具体行动，如果不需要可写"暂无"]');
    lines.push('   理由：[说明理由]');
    lines.push('');
    lines.push('注意：');
    lines.push('- 必须全部用中文回复，不要出现英文句子');
    lines.push('- 建议要具体、可立即执行（不说"发展业务"要说"升级XX到Lv.3"）');
    lines.push('- 根据当前资金水平给出合理建议（不说需要花1亿的事如果只有10万）');
    lines.push('- 如果压力>70或经济处于危机/萧条，优先建议稳健策略');

    return lines.join('\n');
  }

  // ========== 主函数：获取顾问建议（返回 Promise） ==========
  // 使用 Promise 链式排队：多个并发 getAdvice 调用会依次排队执行，
  // 而非被丢弃返回"顾问正忙"。队列内部超时后降级为规则建议。
  function getAdvice() {
    // 将本次请求链接到队列尾部，保证 FIFO 顺序
    var taskPromise = _chainPromise.then(function() {
      return _doGetAdvice();
    });

    // 更新链尾：即使本次失败也不阻断后续排队
    _chainPromise = taskPromise.catch(function(e) { if (typeof SGame !== "undefined" && SGame.DEBUG) SGame.DEBUG && console.error("[advisor] chain drain:", e && e.message); });

    return taskPromise;
  }

  async function _doGetAdvice() {
    if (_requesting) {
      // 极端情况：_requesting 兜底（理论上 Promise 链已保证不会并发进入）
      SGame.DEBUG && console.warn('[Advisor] _doGetAdvice 检测到并发调用，排队等待中...');
    }
    _requesting = true;
    _queueDepth = (_queueDepth || 0) + 1;
    _lastAdviceTime = (typeof SGame !== 'undefined' && SGame.G) ? SGame.G.tickCount : 0;

    try {
      // 检查LLM是否可用
      if (typeof LLM === 'undefined') {  
        _lastResult = null; 
        _requesting = false;
        return { text: "战略顾问暂时离线，请稍后再试。", fromLLM:false,error:"LLM 未初始化" };
      }

      // 修复：!available 时主动触发盲发探测并轮询等待，与 generate() 保持一致
      if (!LLM.available) {
        if (!LLM.checking) {
          LLM.check(); // 主动触发检测（盲发探测）
        }
        let waited = 0;
        while (LLM.checking && waited < 10000) {
          await new Promise(resolve => setTimeout(resolve, 300));
          waited += 300;
        }
      }

      if (!LLM.available) {
        _requesting = false;
        _queueDepth = Math.max(0, (_queueDepth || 0) - 1);
        var ruleAdvice = generateRuleBasedAdvice();
        _lastResult = ruleAdvice;
        return { text: ruleAdvice, fromLLM: false, error: null };
      }

      var summary = buildStateSummary();
      if (!summary) {
        _requesting = false;
        _queueDepth = Math.max(0, (_queueDepth || 0) - 1);
        return { text: '无法获取游戏状态', fromLLM: false, error: 'no_state' };
      }

      var prompt = buildPrompt(summary);
      if (!prompt) {
        _requesting = false;
        _queueDepth = Math.max(0, (_queueDepth || 0) - 1);
        return { text: '无法构建分析提示', fromLLM: false, error: 'no_prompt' };
      }

      var system = `你是一位中文商业战略顾问。以下规则必须严格遵守：
1. 全程使用简体中文回复，每一个字都必须是中文。
2. 禁止出现任何英文单词、英文短语、英文句子。
3. 禁止出现英文标点符号（只允许使用中文标点：，。！？；：""''（））。
4. 数字和百分号可以使用阿拉伯数字。
5. 你的所有分析、建议、理由都必须是地道的中文表达。
6. 如果用户输入中包含英文概念，你必须用中文翻译后再回复。
违反以上任何一条都会导致输出无效。`;

      // 取消队列中其他等待任务，优先执行战略顾问请求
      // cancelAll 以 null resolve 被取消任务，不影响正在执行的活跃任务
      if (typeof LLM.cancelAll === 'function') {
        SGame.DEBUG && console.log('[Advisor] 战略顾问优先：cancelAll 前 — 活跃任务:', LLM.getActiveCount(), '队列长度:', LLM.getQueueLength());
        LLM.cancelAll('战略顾问优先');
        SGame.DEBUG && console.log('[Advisor] cancelAll 后 — 活跃任务:', LLM.getActiveCount(), '队列长度:', LLM.getQueueLength());
      }

      // LLM 调用：队列内部已有超时机制（enqueue + _drainQueue），
      // 不再叠加外部 Promise.race 超时，避免因队列拥塞导致外部超时先于任务执行触发，
      // 形成"LLM 实际可用但 advisor 提前降级为规则建议"的假阳性。
      // 超时 90s：本地 qwen3.5 处理复杂战略分析 prompt（~2000-4000 字符）需 40-90s，
      // 远低于 CONFIG.LLM_GENERATE_TIMEOUT(120s)，为模型推理留足缓冲。
      SGame.DEBUG && console.log('[Advisor] 开始 LLM.generate，超时90s...');
      var t0 = Date.now();
      var result = await LLM.generate(prompt, 0.7, system, {
        taskType: '战略顾问',
        priority: LLM.PRIORITY ? LLM.PRIORITY.HIGH : 0,
        timeout: 90000
      });
      SGame.DEBUG && console.log('[Advisor] LLM.generate 返回 — 耗时:', ((Date.now() - t0) / 1000).toFixed(1) + 's', '结果:', result ? '有内容(' + result.length + '字)' : 'null');

      // LLM 在线但返回空时重试一次（可能因中英文检测等质量门控或临时拥塞导致假阴性）
      if (!result && LLM.available) {
        SGame.DEBUG && console.warn('[Advisor] LLM在线但首次调用返回空，1.5秒后重试一次');
        await new Promise(function(r) { setTimeout(r, 1500); });
        SGame.DEBUG && console.log('[Advisor] 重试 LLM.generate...');
        result = await LLM.generate(prompt, 0.7, system, {
          taskType: '战略顾问（重试）',
          priority: LLM.PRIORITY ? LLM.PRIORITY.HIGH : 0,
          timeout: 90000
        });
        SGame.DEBUG && console.log('[Advisor] 重试返回 — 结果:', result ? '有内容(' + result.length + '字)' : 'null');
      }

      _requesting = false;
      _queueDepth = Math.max(0, (_queueDepth || 0) - 1);

      if (result) {
        _lastResult = result;
        return { text: result, fromLLM: true, error: null };
      } else {
        var fallback = generateRuleBasedAdvice();
        _lastResult = fallback;
        return { text: fallback, fromLLM: false, error: 'LLM无响应，以下为基于规则的建议' };
      }
    } catch(e) {
      _requesting = false;
      SGame.DEBUG && console.warn('[Advisor] getAdvice error:', e.message || e);
      var fb = generateRuleBasedAdvice();
      _lastResult = fb;
      return { text: fb, fromLLM: false, error: '调用失败：' + (e.message || '未知错误') };
    }
  }

  // ========== 基于规则的建议（LLM不可用时的后备） ==========
  function generateRuleBasedAdvice() {
    if (typeof SGame === 'undefined' || !SGame.G) return '游戏状态不可用';

    var G = SGame.G;
    var advices = [];

    // 1. 经济/压力状态评估
    var assessment = '';
    if (G.stress > 70) {
      assessment = '⚠️ 你当前压力很大(' + G.stress + ')，收入被大幅削减。建议优先降低压力，减少扩张节奏。';
    } else if (G.economicState === 'crisis') {
      assessment = '💥 经济危机中！收入降至正常水平的70%。建议削减开支，等待经济复苏。';
    } else if (G.economicState === 'recession') {
      assessment = '📉 经济萧条期，收入受到15%惩罚。稳健经营，储备现金过冬。';
    } else if (G.economicState === 'boom') {
      assessment = '📈 经济繁荣期！收入额外+10%，这是扩张的好时机。';
    } else {
      assessment = '➡️ 经济平稳运行。当前状态良好，可以按部就班发展。';
    }

    // 2. 检查可升级业务
    var upgradeable = [];
    if (G.cities) {
      Object.entries(G.cities).forEach(function(entry) {
        var cityData = entry[1];
        if (!cityData || !cityData.unlocked) return;
        if (cityData.businesses) {
          Object.entries(cityData.businesses).forEach(function(bizEntry) {
            var bizId = bizEntry[0];
            var bizData = bizEntry[1];
            if (!bizData || bizData.level === 0) return;
            var bizDef = (typeof BUSINESS_DEFS !== 'undefined') ? BUSINESS_DEFS.find(function(b) { return b.id === bizId; }) : null;
            if (!bizDef || bizData.level >= bizDef.levels.length) return;
            var nextLv = bizDef.levels[bizData.level];
            if (!nextLv || nextLv.cost === 0) return;
            var lgCostScale = (typeof SGame !== 'undefined' && SGame.getLateGameCostScale) ? SGame.getLateGameCostScale() : 1;
            var cost = nextLv.cost * 10000 * lgCostScale; // v1.7 后期档位成本
            if (G.money >= cost * 2) { // 有2倍升级费才建议
              upgradeable.push({
                name: bizDef.name,
                nextLevel: bizData.level + 1,
                cost: cost,
                incomeGain: (nextLv.income - bizDef.levels[bizData.level - 1].income) * 10000,
              });
            }
          });
        }
      });
    }

    // 按收益增幅排序
    upgradeable.sort(function(a, b) { return b.incomeGain - a.incomeGain; });

    if (upgradeable.length > 0) {
      var best = upgradeable[0];
      advices.push('💡 升级「' + best.name + '」到Lv.' + best.nextLevel +
        '（费用' + SGame.formatMoney(best.cost) +
        '，每Tick增收' + SGame.formatMoney(best.incomeGain) + '）');
      advices.push('   理由：当前性价比最高的升级，回本周期约' +
        Math.round(best.cost / Math.max(best.incomeGain, 1)) + 'Tick');
    }

    // 3. 检查是否该招聘
    if (G.employees && G.employees.length < 5 && G.money > 100000) {
      advices.push('💡 招聘新员工（当前仅' + G.employees.length + '人，团队扩容空间大）');
      advices.push('   理由：员工提供收入加成和运营效率，小团队阶段投入产出比最高');
    }

    // 4. 检查是否该解锁区域
    if (typeof REGIONS !== 'undefined') {
      var candidates = [];
      Object.values(REGIONS).forEach(function(r) {
        if (G.unlockedRegions && G.unlockedRegions.includes(r.id)) return;
        if (r.actUnlock > (G.currentAct || 0)) return;
        if (r.unlockCond && r.unlockCond.money && G.money >= r.unlockCond.money * 1.5) {
          candidates.push(r);
        }
      });
      if (candidates.length > 0 && advices.length < 2) {
        var r = candidates[0];
        var bonusDesc = r.bonus && r.bonus.desc ? r.bonus.desc : '';
        advices.push('💡 解锁「' + r.name + '」（需要' + SGame.formatMoney(r.unlockCond.money) + '）');
        advices.push('   理由：' + bonusDesc + '，开拓新区域可以解锁更多业务类型');
      }
    }

    // 5. 压力管理
    if (G.stress > 70 && advices.length < 3) {
      advices.push('💡 暂停手动拉项目，等待压力自然衰减');
      advices.push('   理由：高压力下收入降至60%以下，减少主动操作让压力自然回落');
    }

    // 确保至少有2条建议
    if (advices.length < 4) {
      advices.push('💡 维持现有业务运营，积累资金');
      advices.push('   理由：当前资金不足以支撑大规模扩张，稳扎稳打等待机会');
    }

    var result = '📊 当前评估：' + assessment + '\n\n';
    for (var i = 0; i < Math.min(advices.length, 6); i += 2) {
      result += advices[i] + '\n' + (advices[i + 1] || '') + '\n\n';
    }

    return result;
  }

  // ========== 问世界：LLM 自由问答 + 一键执行建议 (#13) ==========
  // 设计：
  // - 玩家任意中文问题 + buildStateSummary 状态快照 + 实时"可执行动作清单"拼 prompt
  // - 回答末尾可选 [ACTIONS] JSON 块（type 白名单：upgrade/open/hire/unlockRegion），
  //   parseActions 解析并校验 target 真实性，UI 渲染"一键执行"按钮
  // - LLM 不可用（available=false / 调用失败 / 返回空）→ ruleBasedAskWorld 本地规则应答，
  //   同样支持 ACTIONS 块，离线也能一键执行
  // - 历史保留最近 10 条于内存（_askWorldHistory），不写入存档
  var _askWorldHistory = [];
  var _askWorldPending = false;

  var ASK_ACTION_META = {
    upgrade: '升级',
    open: '开业',
    hire: '招聘',
    unlockRegion: '解锁区域',
  };

  function _askActionName(type, target) {
    try {
      if (type === 'upgrade' || type === 'open') {
        var b = (typeof BUSINESS_DEFS !== 'undefined' ? BUSINESS_DEFS : []).find(function(x) { return x.id === target; });
        return b ? b.name : target;
      }
      if (type === 'hire') {
        var r = (typeof EMP_ROLES !== 'undefined' ? EMP_ROLES : []).find(function(x) { return x.id === target; });
        return r ? r.name : target;
      }
      if (type === 'unlockRegion') {
        var rg = (typeof REGIONS !== 'undefined' && REGIONS[target]) ? REGIONS[target].name : target;
        return rg;
      }
    } catch (e) { /* 忽略，回退 target */ }
    return target;
  }

  // 汇总"当前真正可执行"的动作清单（prompt 与一键执行共用同一事实来源）
  function buildAvailableActions() {
    var G = (typeof SGame !== 'undefined' && SGame.G) ? SGame.G : null;
    var out = [];
    if (!G || !G.businesses || typeof BUSINESS_DEFS === 'undefined') return out;
    BUSINESS_DEFS.forEach(function(b) {
      var st = G.businesses[b.id];
      var lv = st ? (st.level || 0) : 0;
      if (lv === 0) {
        // 未开业：满足解锁条件才列入
        if ((!b.unlockMoney || G.money >= b.unlockMoney) && (!b.unlockAct || (G.currentAct || 0) >= (b.unlockAct || 0))) {
          var openCost = (b.levels && b.levels[0] && b.levels[0].cost) ? b.levels[0].cost * 10000 : 0;
          out.push({ type: 'open', target: b.id, name: b.name, detail: openCost > 0 ? '开业费 ' + openCost : '免费开业' });
        }
      } else if (lv < b.levels.length) {
        var next = b.levels[lv];
        if (next && next.cost > 0) {
          var lgScale2 = (typeof SGame !== 'undefined' && SGame.getLateGameCostScale) ? SGame.getLateGameCostScale() : 1;
          out.push({ type: 'upgrade', target: b.id, name: b.name, detail: 'Lv.' + lv + '→Lv.' + (lv + 1) + '，费用 ' + next.cost * 10000 * lgScale2 });
        }
      }
    });
    if (typeof EMP_ROLES !== 'undefined' && Array.isArray(G.employees)) {
      EMP_ROLES.forEach(function(r) {
        if (!r.req) out.push({ type: 'hire', target: r.id, name: r.name, detail: '基础月薪 ' + r.baseSalary + ' 万' });
      });
    }
    if (typeof REGIONS !== 'undefined' && Array.isArray(G.unlockedRegions)) {
      Object.keys(REGIONS).forEach(function(rid) {
        if (G.unlockedRegions.indexOf(rid) >= 0) return;
        var rg = REGIONS[rid];
        var cond = (rg && rg.unlockCond) || {};
        var ok = true;
        if (cond.money && G.money < cond.money) ok = false;
        if (cond.reputation && (G.reputation || 0) < cond.reputation) ok = false;
        if (cond.act && (G.currentAct || 0) < cond.act) ok = false;
        if (rg.actUnlock && (G.currentAct || 0) < rg.actUnlock) ok = false;
        if (ok) out.push({ type: 'unlockRegion', target: rid, name: rg.name, detail: '解锁条件已满足' });
      });
    }
    return out;
  }

  // 拼装问世界 prompt：问题 + 状态快照 + 可执行动作清单 + 输出格式约定
  function buildAskWorldPrompt(question, summary) {
    if (!question) return null;
    var avail = buildAvailableActions();
    var lines = [];
    lines.push('【玩家问题】');
    lines.push(question);
    lines.push('');
    lines.push('【游戏状态快照】');
    lines.push(summary || '（无）');
    lines.push('');
    lines.push('【当前可一键执行的动作清单】（target 必须原样使用清单中的 id，禁止编造）');
    if (avail.length === 0) {
      lines.push('（当前没有满足条件的一键动作）');
    } else {
      avail.forEach(function(a) { lines.push('- ' + a.type + ': ' + a.target + '（' + a.name + '，' + a.detail + '）'); });
    }
    lines.push('');
    lines.push('回答要求：');
    lines.push('1. 直接回答玩家的问题，先结论后依据，简明扼要（200字以内为佳）。');
    lines.push('2. 若建议的动作在上述清单中，请在回答末尾附加机器可读块，供玩家一键执行：');
    lines.push('[ACTIONS]');
    lines.push('[{"type":"upgrade","target":"示例id","reason":"简短中文理由"}]');
    lines.push('[/ACTIONS]');
    lines.push('3. 无可执行建议时不要输出[ACTIONS]块；type 只能是 upgrade / open / hire / unlockRegion。');
    return lines.join('\n');
  }

  // 动作目标存在性校验（parseActions 与 executeAction 共用，防止 LLM 幻觉 target 被静默吞掉）
  function _askActionExists(type, target) {
    try {
      if (type === 'upgrade' || type === 'open') {
        return (typeof BUSINESS_DEFS !== 'undefined') && BUSINESS_DEFS.some(function(b) { return b.id === target; });
      }
      if (type === 'hire') {
        return (typeof EMP_ROLES !== 'undefined') && EMP_ROLES.some(function(r) { return r.id === target; });
      }
      if (type === 'unlockRegion') {
        return (typeof REGIONS !== 'undefined') && !!REGIONS[target];
      }
    } catch (e) { /* 忽略 */ }
    return false;
  }

  // 解析回答中的 [ACTIONS] 块：校验 type 白名单 + target 真实存在；块从显示文本中移除
  function parseActions(text) {
    var result = { display: text || '', actions: [] };
    if (!text) return result;
    var m = text.match(/\[ACTIONS\]([\s\S]*?)\[\/ACTIONS\]/);
    if (!m) return result;
    result.display = (text.slice(0, m.index) + text.slice(m.index + m[0].length)).replace(/\n{3,}/g, '\n\n').trim();
    try {
      var arr = JSON.parse(m[1]);
      if (Array.isArray(arr)) {
        arr.forEach(function(a) {
          if (!a || typeof a !== 'object') return;
          if (typeof ASK_ACTION_META[a.type] === 'undefined') return;
          if (typeof a.target !== 'string' || !a.target) return;
          if (!_askActionExists(a.type, a.target)) return;
          result.actions.push({ type: a.type, target: a.target, reason: typeof a.reason === 'string' ? a.reason.slice(0, 60) : '' });
        });
      }
    } catch (e) { /* JSON 损坏：保留显示文本，动作置空 */ }
    return result;
  }

  // LLM 离线时的本地规则问答（关键词路由，可输出 ACTIONS 块走同一条执行管线）
  function ruleBasedAskWorld(question) {
    var G = (typeof SGame !== 'undefined' && SGame.G) ? SGame.G : null;
    if (!G) return '游戏尚未开始，无法回答。';
    var q = String(question || '');
    var ql = q.toLowerCase();
    var has = function() { for (var i = 0; i < arguments.length; i++) if (ql.indexOf(arguments[i].toLowerCase()) >= 0) return true; return false; };
    var fmt = (typeof SGame.formatMoney === 'function') ? SGame.formatMoney : function(v) { return String(v); };
    var avail = buildAvailableActions();
    var body = '';
    var actions = [];

    if (has('升级', '扩张', '投资方向')) {
      var best = null;
      avail.forEach(function(a) {
        if (a.type !== 'upgrade') return;
        var b = BUSINESS_DEFS.find(function(x) { return x.id === a.target; });
        if (!b) return;
        var lv = G.businesses[a.target].level;
        var inc = (b.levels[lv].income - b.levels[lv - 1].income) * 10000;
        var cost = b.levels[lv].cost * 10000;
        if (inc > 0 && G.money >= cost) {
          var payback = cost / inc;
          if (!best || payback < best.payback) best = { a: a, payback: payback };
        }
      });
      if (best) {
        body = '当前性价比最高：' + best.a.detail + '，预计约 ' + Math.ceil(best.payback) + ' 个 Tick 回本。';
        actions.push({ type: 'upgrade', target: best.a.target, reason: '回本周期最短' });
      } else {
        body = '当前没有资金允许的高性价比升级，建议先积累资金再扩张。';
      }
    } else if (has('招聘', '员工', '招人')) {
      var empCount = (G.employees || []).length;
      body = '当前团队 ' + empCount + ' 人。' + (empCount < 5 && G.money > 1000000
        ? '小团队阶段招聘性价比最高，建议扩编。'
        : '团队规模已不小，按需补充即可。');
      if (empCount < 5 && G.money > 1000000 && (typeof EMP_ROLES !== 'undefined') && EMP_ROLES.some(function(r) { return r.id === 'intern'; })) {
        actions.push({ type: 'hire', target: 'intern', reason: '小团队扩编' });
      }
    } else if (has('区域', '解锁')) {
      var rgs = avail.filter(function(a) { return a.type === 'unlockRegion'; });
      body = rgs.length
        ? '已满足条件可解锁：' + rgs.map(function(a) { return a.name; }).join('、') + '。'
        : '暂无满足解锁条件的区域，先提升资金或声誉。';
      if (rgs.length) actions.push({ type: 'unlockRegion', target: rgs[0].target, reason: '条件已满足' });
    } else if (has('经济', '走势', '行情', '股市', '股票')) {
      var econDesc = { boom: '经济繁荣期，扩张窗口', crisis: '经济危机，收入降至70%，收缩过冬', recession: '经济萧条，收入-15%，稳健经营', stable: '经济平稳，按部就班' }[G.economicState] || '经济状态：' + (G.economicState || 'stable');
      body = econDesc + '。现金 ' + fmt(G.money) + '。';
    } else if (has('压力')) {
      body = '当前压力 ' + (G.stress || 0) + '。' + ((G.stress || 0) > 70
        ? '压力偏高，收入被大幅削减，建议减少主动操作，等压力自然回落。'
        : '压力可控，正常经营。');
    } else if (has('风险', '危险', '亏')) {
      body = '主要风险：' + (G.economicState === 'crisis' ? '经济危机是最大威胁，' : '') +
        '现金 ' + fmt(G.money) + '，' + ((G.stress || 0) > 70 ? '压力过高正在侵蚀收入，' : '') +
        '建议保留至少 3 个月维护成本的现金缓冲。';
    } else {
      // 默认：总览 + 顾问推荐一个当前可行动作
      body = '现金 ' + fmt(G.money) + '，声誉 ' + (G.reputation || 0) + '，等级「' + (G.rank || '-') + '」。' +
        (G.economicState === 'boom' ? '正值繁荣，建议扩张。' : '建议稳扎稳打。');
      if (avail.length) {
        var first = avail.find(function(a) { return a.type === 'upgrade'; }) || avail[0];
        actions.push({ type: first.type, target: first.target, reason: '顾问推荐' });
      }
    }
    if (actions.length) {
      body += '\n[ACTIONS]\n' + JSON.stringify(actions) + '\n[/ACTIONS]';
    }
    return body;
  }

  // 问世界主入口（LLM 优先，规则兜底；解析 ACTIONS；记录历史）
  async function askWorld(question) {
    var G = (typeof SGame !== 'undefined' && SGame.G) ? SGame.G : null;
    var q = String(question || '').trim();
    if (!q) return { text: '', actions: [], fromLLM: false, error: 'empty_question' };
    if (!G) return { text: '', actions: [], fromLLM: false, error: '游戏尚未开始' };
    if (_askWorldPending) return { text: '', actions: [], fromLLM: false, error: 'busy' };
    _askWorldPending = true;

    var system = `你是《商海浮沉》游戏内的中文商业顾问，可以回答玩家关于本游戏经营的任何问题（业务升级、招聘、区域扩张、科技研发、股市、经济周期、事件应对等）。以下规则必须严格遵守：
1. 全程使用简体中文回复，每一个字都必须是中文（动作清单中的 id 除外）。
2. 禁止出现任何英文单词、英文短语、英文句子。
3. 只允许使用中文标点（，。！？；：""''（））。
4. 数字和百分号可以使用阿拉伯数字。
5. 回答必须基于给出的游戏状态快照，不要编造快照之外的数据。`;

    var raw = null, fromLLM = false, error = null;
    try {
      var L = (typeof LLM !== 'undefined') ? LLM : (typeof window !== 'undefined' ? window.LLM : null);
      if (L && L.available && typeof L.generate === 'function') {
        var prompt = buildAskWorldPrompt(q, buildStateSummary());
        if (!prompt) throw new Error('no_prompt');
        var result = await L.generate(prompt, 0.6, system, {
          taskType: '问世界',
          priority: L.PRIORITY ? (L.PRIORITY.NORMAL || 0) : 0,
          timeout: 60000
        });
        if (result && String(result).trim()) { raw = String(result); fromLLM = true; }
      }
    } catch (e) {
      error = 'LLM调用失败：' + (e && e.message ? e.message : '未知错误');
    }
    if (!raw) {
      raw = ruleBasedAskWorld(q);
      if (!error) error = 'LLM 不可用，以下为本地规则应答';
    }
    _askWorldPending = false;

    var parsed = parseActions(raw);
    if (!parsed.display) parsed.display = raw;
    _askWorldHistory.push({ q: q.slice(0, 120), a: parsed.display.slice(0, 300), t: G.tickCount || 0, fromLLM: fromLLM });
    if (_askWorldHistory.length > 10) _askWorldHistory = _askWorldHistory.slice(-10);
    return { text: parsed.display, actions: parsed.actions, fromLLM: fromLLM, error: error };
  }

  // 一键执行建议：调用真实游戏 API（UI 层含完整前置校验与日志）
  function executeAction(action) {
    var G = (typeof SGame !== 'undefined' && SGame.G) ? SGame.G : null;
    if (!action || typeof ASK_ACTION_META[action.type] === 'undefined') return { ok: false, msg: '无效动作' };
    if (!G) return { ok: false, msg: '游戏尚未开始' };
    // 预校验 target：UI 层对未知业务是静默 return，不校验会把幻觉 target 误报为"已提交"
    if (!_askActionExists(action.type, action.target)) return { ok: false, msg: '目标不存在或不可用：' + (action.target || '') };
    var U = (typeof UI !== 'undefined') ? UI : null;
    var name = _askActionName(action.type, action.target);
    try {
      if (action.type === 'upgrade') {
        if (U && typeof U.upgradeBusiness === 'function') U.upgradeBusiness(action.target);
        else if (typeof SGame.upgradeBusinessMax === 'function') SGame.upgradeBusinessMax(action.target);
        return { ok: true, msg: '已提交：升级「' + name + '」（结果见日志）' };
      }
      if (action.type === 'open') {
        if (U && typeof U.openBusiness === 'function') U.openBusiness(action.target);
        return { ok: true, msg: '已提交：开业「' + name + '」（结果见日志）' };
      }
      if (action.type === 'hire') {
        var r = (typeof SGame.batchHire === 'function') ? SGame.batchHire(action.target, 1) : { ok: false, msg: '招聘接口不可用' };
        return { ok: !!(r && r.ok), msg: (r && r.msg) || '招聘失败' };
      }
      if (action.type === 'unlockRegion') {
        var rr = (typeof SGame.unlockRegion === 'function') ? SGame.unlockRegion(action.target) : false;
        return { ok: rr !== false, msg: rr === false ? '解锁失败：条件未满足' : '已解锁区域：' + name };
      }
    } catch (e) {
      return { ok: false, msg: '执行失败：' + (e && e.message ? e.message : '未知错误') };
    }
    return { ok: false, msg: '未知动作类型' };
  }

  // ========== 获取上次结果 ==========
  function getLastResult() {
    return _lastResult;
  }

  // ========== 是否可以请求 ==========
  function canRequest() {
    if (_requesting) return false;
    if (typeof SGame === 'undefined' || !SGame.G) return false;
    var ticksSince = SGame.G.tickCount - _lastAdviceTime;
    return ticksSince >= _cooldownTicks || _lastAdviceTime === 0;
  }

  // ========== 获取冷却剩余 ==========
  function getCooldownRemaining() {
    if (typeof SGame === 'undefined' || !SGame.G) return 0;
    var ticksSince = SGame.G.tickCount - _lastAdviceTime;
    return Math.max(0, _cooldownTicks - ticksSince);
  }

  return {
    getAdvice: getAdvice,
    getLastResult: getLastResult,
    generateRuleBasedAdvice: generateRuleBasedAdvice,
    canRequest: canRequest,
    getCooldownRemaining: getCooldownRemaining,
    // ---- 问世界 (#13) ----
    askWorld: askWorld,
    executeAction: executeAction,
    parseActions: parseActions,
    buildAskWorldPrompt: buildAskWorldPrompt,
    buildAvailableActions: buildAvailableActions,
    ruleBasedAskWorld: ruleBasedAskWorld,
    getAskWorldHistory: function() { return _askWorldHistory.slice(); },
    get askWorldPending() { return _askWorldPending; },
  };

})();
