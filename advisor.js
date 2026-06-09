// Author: Fisheep.L
// ==================================================
// advisor.js — 智能顾问系统：分析游戏状态，调用LLM生成策略建议
// ==================================================

window.Advisor = (function() {

  var _lastAdviceTime = 0;
  var _cooldownTicks = 5;        // 最少间隔5个Tick
  var _lastResult = null;
  var _requesting = false;

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
      pendingDecisions: (typeof pendingDecisions !== 'undefined' ? pendingDecisions : []).length,

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
  async function getAdvice() {
    if (_requesting) {
      return { text: '顾问正在思考中，请稍后再试...', fromLLM: false, error: 'busy' };
    }

    _requesting = true;
    _lastAdviceTime = (typeof SGame !== 'undefined' && SGame.G) ? SGame.G.tickCount : 0;

    try {
      // 检查LLM是否可用（如果检测进行中，等待最多5秒）
      if (typeof LLM === 'undefined') {
        var ruleAdvice = generateRuleBasedAdvice();
        _lastResult = ruleAdvice;
        _requesting = false;
        return { text: ruleAdvice, fromLLM: false, error: null };
      }

      if (!LLM.available && LLM.checking) {
        // check() 正在执行中，等待其完成而非立即降级
        await new Promise(function(resolve) {
          var start = Date.now();
          function poll() {
            if (!LLM.checking || LLM.available || Date.now() - start > 5000) {
              resolve();
            } else {
              setTimeout(poll, 300);
            }
          }
          poll();
        });
      }

      if (!LLM.available) {
        var ruleAdvice = generateRuleBasedAdvice();
        _lastResult = ruleAdvice;
        _requesting = false;
        return { text: ruleAdvice, fromLLM: false, error: null };
      }

      var summary = buildStateSummary();
      if (!summary) {
        _requesting = false;
        return { text: '无法获取游戏状态', fromLLM: false, error: 'no_state' };
      }

      var prompt = buildPrompt(summary);
      if (!prompt) {
        _requesting = false;
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
      var result = await LLM.generate(prompt, 0.7, system);
      _requesting = false;

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
      console.warn('[Advisor] getAdvice error:', e.message || e);
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
            var cost = nextLv.cost * 10000;
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
  };

})();
