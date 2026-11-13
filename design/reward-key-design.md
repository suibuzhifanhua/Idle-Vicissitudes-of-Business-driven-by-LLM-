# 成就死奖励键消费点设计（T1 设计口径，v1.11）

> 产出：主理人直执（团队子代理路由故障，见交付报告）
> 基线：HEAD 131d59c（v1.10）· 本文所有行号均指当前树
> 约束：简体中文；消费点必须明确论证 720h 仿真（balance-simulation.mjs）安全性

## 0. 结论摘要

**12 个键全部可修复**（比原清单多 1 个：调研中发现 `rdBonus` 因错误引用对象成为第 12 个死键，P1 新发现，见 §4）。

| # | 键 | 涉及成就 | 消费点（文件:行） | 语义 | 不变性安全 |
|---|----|----------|-------------------|------|-----------|
| 1 | statPoints | first_biz(+2)/skill_1(+1)/skill_10(+3)/venture_first(+1) | checkAchievements core.js:2492（解锁时刻一次性授予） | 一次性技能点，与任务路径 npc.js:636/681 同语义 | ✓(b) 状态授予，下游 unlockSkill 仅玩家调用，sim 无消费 |
| 2 | startMoney | speed_run(+500k) | checkAchievements core.js:2492（解锁时刻一次性发放） | 解锁即发 +50 万资金 | ✗ **sim 活跃**——唯一改轨迹项，见 §3 重定基线 |
| 3 | loanInterest | rep_80(-2%) | applyLoan core.js:5221 利率减 0.02（地板 0.05）；npc.js:238 金行长特批贷同减 | 贷款利率 -2 个百分点 | ✓(a) applyLoan 无 sim 调用方 |
| 4 | coopBonus | rep_70(+10%) | negotiate() npc.js:459-487 三档收益 ×(1+0.10) | 约谈（合作）收益 +10% | ✓(a) negotiate 无 harness 调用方 |
| 5 | negotiateBonus | npc_max(+20%) | 同上，×(1+0.20)，与 coopBonus 乘性叠加 | 约谈收益 +20% | ✓(a) 同上 |
| 6 | giftEffect | npc_1(+20%) | giveGift npc.js:421-432 favorDelta ×(1+0.20) 四舍五入 | 送礼好感收益 +20% | ✓(a) giveGift 无 harness 调用方 |
| 7 | favorGain | npc_3(+15%)/social_butterfly(+10%) | changeFavor npc.js:32 正向 delta ×(1+Σ) | 一切正向好感获取 +15%/+10%（叠加） | ✓(a) 全部调用方均不在 harness 路径 |
| 8 | decisionBonus | event_100(+15%)/decision_30(+20%) | applyEffects events.js:395 正向资金效果 ×(1+Σ) | 决策的正向资金收益 +15%/+20% | ✓(a) applyEffects 仅 choose/autoDecide 调用 |
| 9 | decisionAnalysis | decision_5(+10%)/decision_10(+15%) | applyEffects events.js:395 正向非资金效果 ×(1+Σ) | 决策的正向非资金效果（声誉/人脉/好感正、压力负）+10%/+15% | ✓(a) 同上 |
| 10 | eventPredict | event_10(+5%)/event_30(+8%) | autoDecide 评分 core-strategy.js:108-114 资金项 ×(1+Σ) | 托管自动决策时资金考量权重 +5%/+8% | ✓(a) autoDecide 仅 autoMode 开启时执行；纯算术无新 RNG |
| 11 | stressCap | stress_never_high(-10) | tickDecay core.js:530 后 clamp `G.stress = min(G.stress, 100-Σ)` | 压力上限 100→90 | ✓(b) sim 全程 stress 远低于 90，clamp 惰性 |
| 12 | rdBonus | money_50m(+10%)/tech_leader(+15%)/bear_tycoon(+8%) | core-research.js:28 修复引用 `S.calcAchievementRewards`→全局 | 研发点数获取 +10/15/8%（P1 死引用修复） | ✓(b) G.rpt 在 sim 无下游消费 |

## 1. 不变性安全框架（先于逐键设计）

### 1.1 720h harness 实际执行面（balance-simulation.mjs 实测口径）

- 执行：doTick 全管线（经济/衰减/事件触发/员工/供应链/财报/NPC 衰减块）+ 场景调度器（upgradeBusinessMax/batchHire）+ startTick。
- **不执行**：`G.autoMode.enabled = false`（harness:194）→ core-strategy.js 全部托管策略（autoNegotiate/autoGift/autoDecide/autoResearch/autoLoan/autoManualWork…）均不运行；决策事件只触发不解决（choose/autoDecide 零调用，applyEffects 零调用）；无任何 UI 动作（unlockSkill/applyLoan/giveGift/negotiate/giveGift 零调用）。
- `checkAchievements` 每 tick 执行（core.js:795）→ 成就解锁时点与真实游戏一致。
- harness 预置：money=500k、rep=90、研发满级、14 键好感全 100、全业务 Lv1 已解锁。

### 1.2 推论：harness 内必然解锁的受影响成就

| 成就 | 解锁依据 | 消费点在 harness 是否活跃 |
|------|----------|--------------------------|
| first_biz / npc_max / npc_1 / npc_3 / social_butterfly / rep_70 / rep_80 | 预置条件 tick 1 即满足 | 否（negotiate/giveGift/changeFavor/applyLoan 均无 harness 调用方）→ 惰性 |
| event_10/30/50/100 | 720h 事件量必然破百 | 否（applyEffects/autoDecide 零调用）→ 惰性 |
| money_50m（rdBonus） | 资产增长必然达 5000 万 | 否（G.rpt 无下游消费，无研发启动）→ 惰性 |
| stress_never_high | stress 全程 ≤60 则 tick 51 解锁 | 解锁与否均惰性（stress 远低于 clamp 线 90）→ 惰性 |
| **speed_run** | 500k→1e6 必在 120 tick（1h）内达成 | **是**：解锁即 G.money += 500000 → 轨迹改变 |
| skill_1/10、decision_5/10/30、venture_first | 需玩家动作（学技能/做决策/风投） | harness 永不解锁 |

### 1.3 v1.11 不变性方针（重定基线）

v1.10 的"720h 逐位对齐 v1.9 基线（47117429292 / 13322591）"约束适用于**不打算改 gameplay 的增量内容**。v1.11 的本意就是让宣传奖励生效——其中 speed_run 的 +50 万在 sim 窗口内必然发放，逐位不变性在逻辑上不可保持。

**决定：12 键全部按宣传语义实装，接受 sim 轨迹平移，720h 验收改为三条：**
1. **确定性**：两次全新 720h 运行双指纹（money / randCalls）逐位一致；
2. **合理性**：终值有限、无 NaN、rankTimes 合理（1e10 仍在 720h 内达成）；
3. **回归**：verify-gameplay.mjs 全绿（197+N PASS / 0 FAIL）。

新指纹记录为 v1.11 基线（写入记忆与交付报告）。可回滚性：单个 commit，`git revert` 即恢复旧轨迹。

### 1.3a v1.11 新基线（2026-11-13 实测，SEED=1 / scheduled / 720h / 86400 tick）

**验收三条全过**：① 确定性——两次全新 720h 运行双指纹逐字段一致（money/randCalls/maxStress/speedRunTick/statPoints/achievements/rankTimes，唯一差异 wallSeconds 为墙钟环境量）；② 合理性——终值 4.42e10 有限无 NaN，1e10（亚洲巨擘）183h 达成仍在窗口内，maxStress=25 远低于 clamp 线 90（stressCap 惰性成立）；③ 回归——verify-gameplay.mjs 209 PASS / 0 FAIL。

| 指标 | v1.10 旧基线（worktree 复跑复现） | v1.11 新基线 | 变化 |
|------|------|------|------|
| 终值 money(720h) | 47,117,429,292 | **44,186,077,984** | -6.2%（早期 +50 万改变事件/RNG 分支路径，随机损益噪声抵消复利） |
| randCalls | 13,322,591 | **13,378,003** | +55,412（+0.42%，条件 RNG 分支位移，与 §1.4 预测一致） |
| maxStress | 25 | 25 | 不变（stress_never_high 解锁后 clamp 90 从未触发，双保险成立） |
| speed_run 解锁 | tick 6（奖励未接线，未发放） | tick 6（发放 +500k） | 唯一轨迹变更源 |
| statPoints(终局) | 26 | 28 | +2 = first_biz 一次性授予（旧版未接线） |
| 成就数(终局) | 49 | 49 | 不变（仅奖励生效，解锁集合相同） |
| rankTimes 区域龙头/城市新贵/省级大亨 | 10h / 24h / 39h | **8h / 20h / 32h** | 中期档位前移 2-7h |
| rankTimes 全国百强/亚洲巨擘(1e10) | 67h / 188h | **72h / 183h** | 百强略后移、1e10 前移 5h |

### 1.4 RNG 序列安全性

全部 12 个消费点均为**纯算术变换**（乘数/加法/clamp），不新增任何 Math.random 调用；且 11/12 位于 harness 永不执行的路径。randCalls 指纹的位移只可能来自 speed_run +500k 引起的分支结果差异（条件 RNG 路径），与重定基线方针一致。

## 2. 逐键设计

### 2.1 statPoints（一次性授予）
- **现状**：calcAchievementRewards 聚合出 statPoints，但无任何授予路径（惰性聚合 ≠ 授予）。任务奖励路径 npc.js:636（完成奖励 +1）与 npc.js:681-683（reward.statPoints）是活机制，成就路径未接线。
- **消费点**：checkAchievements（core.js:2491-2495）push 之后读取 `ACHIEVEMENT_REWARDS[a.id]`，`if (r.statPoints) { G.statPoints = (G.statPoints||0) + r.statPoints; addLog(...); }`。
- **语义**：解锁时刻一次性 +N 技能点。与任务路径同字段（G.statPoints）同语义，无双轨；下游 unlockSkill（core.js:5190-5205）仅玩家点击（ui.js:3100）消费。
- **UI 影响**：ui.js:2397 的 `⭐SP×N` 预览保留（信息展示，非二次授予；聚合值 ≠ 发放动作）。
- **安全**：(b)。harness 中 first_biz tick 1 解锁、+2 SP 授予；SP 在 sim 永不消费 → 状态无害。

### 2.2 startMoney（一次性发放，唯一活跃项）
- **现状**：宣传"初始资金+50万"。speed_run 为后期可达成就（1e6/1h 或 v1.10 同型条件），解锁时游戏已运行，"初始"无法追溯生效。
- **消费点**：同 checkAchievements，`if (r.startMoney) { G.money += r.startMoney; addLog(...); }`。
- **语义**：解锁时刻一次性 +50 万（"极速奖励金"）。
- **安全**：✗ 活跃——harness 内 speed_run 必然早期解锁，+500k 进入轨迹。**按 §1.3 重定基线方针处理**，非缺陷。
- **备注**：sprint_10b（v1.10）与 speed_run 是不同成就（1e10/200h vs 1e6/1h），互不干扰。

### 2.3 loanInterest（贷款利率）
- **消费点 A**：applyLoan（core.js:5221）`interestRate = Math.max(0.05, 0.15 - (G.reputation/100)*0.07 - (npcBon._loanRateBonus||0) - (achRewards.loanInterest||0))`。0.02 = 2 个百分点，受 0.05 地板保护。
- **消费点 B**：金行长特批贷（npc.js:238）固定 6% → `max(0.04, 0.06 - loanInterest)`，interestPerTick 同步重算。
- **调用方审计**：applyLoan 仅 ui.js 玩家动作；npc.js:238 为对话框动作；托管策略键表（core-strategy.js:376）有 autoRepay 无 autoLoan-apply（autoLoan 默认 false 且为独立开关）→ harness 零调用。✓(a)

### 2.4 coopBonus + negotiateBonus（约谈收益，共享消费点）
- **消费点**：negotiate()（npc.js:448-494）三档随机收益，在随机数**取出后**乘乘数：
  - favor≥80：`floor(rand*50000)+20000`
  - favor≥60：`floor(rand*30000)+10000` / `floor(rand*10000)+5000`
  - favor≥30：`floor(rand*8000)+3000`
  - 统一：`G.money += Math.floor(base * (1 + coopBonus + negotiateBonus))`
- **语义**：两者均作用于 NPC 商务约谈资金收益（"合作收益"与"约谈成功"在代码上就是同一处），乘性叠加。范围取最简：仅 negotiate 资金，不含 MA/收购系统（acquiredBusinesses）——文档明示，留待后续版本再议。
- **调用方审计**：negotiate 调用方 = npc.js 对话框动作（145/163/350）+ autoNegotiate（core-strategy.js:1054，autoMode 门控）+ ui.js:2314 按钮。harness autoMode 关闭 → 零调用。✓(a)。真实游戏手动/托管均生效（符合放置游戏奖励应作用于托管的预期）。
- **RNG**：乘数作用于已取随机数，序列不变。

### 2.5 giftEffect（送礼好感）
- **消费点**：giveGift（npc.js:421-432）三档 favorDelta 计算后：`favorDelta = Math.round(favorDelta * (1 + giftEffect))`，再走既有 changeFavor。
- **注意**：favorDelta 先经 Math.random 取档（RNG 已消费），乘数为纯算术 → 序列不变。
- **与 favorGain 关系**：giveGift → changeFavor（正向）→ 会再被 favorGain 放大（乘性叠加，符合"送礼效果"与"好感获取"两个独立成就的语义）。
- **调用方审计**：giveGift ← _giveGift（ui.js onclick）+ autoGift（core-strategy 策略，autoMode 门控，默认 false）。harness 零调用。✓(a)

### 2.6 favorGain（好感获取，全局放大）
- **消费点**：changeFavor（npc.js:32）入口，正向 delta 放大：
  ```js
  if (delta > 0) {
    var _ar = (typeof calcAchievementRewards === 'function') ? calcAchievementRewards() : {};
    if (_ar.favorGain) delta = Math.round(delta * (1 + _ar.favorGain));
  }
  ```
  放在既有区域 connGain 放大之前（先成就后区域，顺序固定即确定性固定）。负向 delta（人情债违约 -18、事件负面）不放大。
- **调用方审计（全量）**：events.js:427（决策效果，harness 不解决决策）、npc.js 对话框动作（186-308/357-382）、npc.js:434（giveGift）、npc.js:463-485（negotiate）、npc.js:676（任务奖励 applyQuestReward，玩家推进任务触发）、extensions.js:321（fulfillFavor，玩家完成反向请托）、extensions.js:335（tickFavor 违约，仅在存在人情债时触发——人情债由玩家请托建立，harness 无玩家动作 → 无债 → 不触发）。**harness 零有效调用**。✓(a)
- **联动传播**：relations 传播量基于放大后的 delta 计算（传播是变化的函数，自然继承）；衰减块（core.js:586-612）直写 npcFavor 不走 changeFavor，不受 favorGain 影响（正确：奖励的是"获取"不是"保持"）。

### 2.7 decisionBonus + decisionAnalysis（决策效果，共享消费点）
- **消费点**：applyEffects（events.js:395-442），在 _effVal 解包（RNG 已消费）之后：
  - **decisionBonus**：正向资金效果放大——moneyV 为乘数型（>1 视为增益）或绝对正增量时 `×(1+Σ)`；负向资金（惩罚）不变。moneyAbsV 正增量同样放大（保留既有 lgCost 缩放先乘后放的顺序：`moneyAbsV * lgCost * (1+bonus)`）。
  - **decisionAnalysis**：正向非资金效果放大——reputation 正增量、connections 正增量、npcFavor 各正 delta、stress 负增量（减压是收益）×(1+Σ)；负向不变。
  - 两者乘性独立，与 reward 键一一对应（bonus→钱，analysis→非钱），verify 可分别断言。
- **调用方审计**：applyEffects ← choose（玩家点选）+ autoDecide 手动回退路径（core-strategy.js:191）。harness 两者均零调用。✓(a)

### 2.8 eventPredict（事件预判，托管决策质量）
- **最简可行语义**：autoDecide（core-strategy.js:85-214）为**确定性评分 argmax**（无 RNG）。eventPredict 放大评分中的资金项（eff.money 得分 108-111 行、eff.moneyAbs 得分 112-114 行）`×(1+Σ)`——"预判"= 托管对资金后果的考量更敏锐。
- **为什么不选概率型**：在 argmax 上引入"以 p 概率选最优"会新增 Math.random → 真实游戏 autoMode 的 RNG 序列改变（虽不影响 720h harness，但属不必要的侵入）；且 p=5%/8% 太小，体验不可感。评分放大零 RNG、语义自洽、与 eventPreference 偏好叠加自然。
- **已知取舍**：手动模式（不开托管）玩家无此收益——预判定位为"托管助理能力"。作为 P2 记录，不在本轮扩大范围。
- **调用方审计**：autoDecide ← 策略键 eventDecide（interval 1，autoMode 门控）+ events.js:142（autoMode.eventDecide 计时器）+ toggleAutoMode 补处理（core-strategy.js:69）。harness autoMode 关闭 → 零调用。✓(a)

### 2.9 stressCap（压力上限）
- **消费点**：tickDecay（core.js:525-530）在自然衰减行后：
  ```js
  const _stressCapMax = 100 - (_tickAchRewards.stressCap || 0);
  if (G.stress > _stressCapMax) G.stress = _stressCapMax;
  ```
  复用既有 `_tickAchRewards` 缓存（core.js:527），零额外调用。统一 clamp 一处，覆盖所有 +stress 来源（运营风险 core.js:3986、出身事件 3447、拉项目 3715、贷款违约 5252、事件 416、任务 662）。
- **数值语义**："压力上限-10"= 上限 100→90。stressMode 'collapse' 阈值 ≥90（core.js:967）仍可达（=90），奖励防止 91-100 区间，按字面实装。
- **安全性（双保险）**：
  1. 若 stress_never_high 未解锁（stressHighTickCount>0，阈值 stress>60 见 core.js:482）→ 无 cap，纯惰性；
  2. 若已解锁 → harness 中 stress 的 tick 路径增量源仅运营风险（7 类中 1 类 +5，概率性）+出身事件（一次性），自然衰减每 tick 持续 → 稳态远低于 60，更远低于 90 → clamp 恒为 no-op。
  实现阶段用 720h 探针实测 max(stress) 验证（写入 QA 报告）。

### 2.10 rdBonus（P1 死引用修复，§4）
- **消费点**：core-research.js:28 改为 `var achRewards = (typeof calcAchievementRewards === 'function') ? calcAchievementRewards() : {};`（与 core.js:527/1560/2047/2768/5190 的既有裸全局引用一致）。
- **安全性**：generateRPT 在 tick 路径（RPT 每 tick 累积），harness 内 money_50m 必然解锁 → rdBonus 生效 → G.rpt 增速 +10%；但 G.rpt 在 harness 无下游消费（无 startResearch：玩家动作 + autoResearch 为 autoMode 门控）→ 惰性。✓(b)

## 3. 重定基线操作清单（T2 执行）

1. 实现 §2 全部消费点（7 个文件：core.js / core-research.js / npc.js / events.js / core-strategy.js，config-achievements.js 仅加注释）。
2. verify-gameplay.mjs 增补 12 项断言（§5）→ 197+N PASS / 0 FAIL。
3. 全部改动文件 `node --check`。
4. 720h 仿真 ×2（同 SEED=1）：双指纹逐位一致（确定性证明）+ 记录新基线 {money, randCalls} + rankTimes 对照旧基线（预期 1e10 时点小幅前移，量级由 +500k 复利决定）+ 探针记录 max(stress) 与 stress_never_high 解锁状态（验证 §2.9 双保险）。
5. 单个 commit（v1.11），不 push。

## 4. 新发现 P1：rdBonus 死引用（调研新增）

- **现象**：core-research.js:28 以 `S.calcAchievementRewards`（SGame 对象属性）引用，但 calcAchievementRewards 是 config-achievements.js 顶层全局函数，**从未挂载到 SGame**（全项目无 `SGame.calcAchievementRewards =` 赋值）→ `typeof` 守卫恒为 'undefined' → achRewards 恒为 `{}` → money_50m/tech_leader/bear_tycoon 三个成就的"研发速度+10/15/8%"宣传奖励**自引入起从未生效**。
- **性质**：与 11 个"无消费点"死键不同的第二类死键——**有消费点、引用对象错误**。
- **修复**：§2.10 一行引用修正。修复后 sim 惰性、真实游戏生效。
- **排查范围确认**：全项目 `S.calcAchievementRewards|SGame.calcAchievementRewards` 仅 core-research.js:28 一处，无同类隐患。

## 5. verify 断言建议（T2 落地，方向级）

| # | 断言 | 方法 |
|---|------|------|
| 1 | statPoints 授予 | 清 unlockedAchievements → 跑 tick（first_biz 条件已满足）→ G.statPoints 增加 2 |
| 2 | startMoney 发放 | G.money=1e6 且 tickCount 在窗内 → 跑 tick → money 增量含 +500000 |
| 3 | loanInterest | 解锁 rep_80 → SGame.applyLoan → loan.interestRate 比对照低 0.02（地板 0.05 用例） |
| 4 | coopBonus+negotiateBonus | 解锁 rep_70+npc_max → 固定 Math.random（沙箱可控）→ NPCSystem.negotiate(favor=80) → money 增量 = floor(base×1.30) |
| 5 | giftEffect | 解锁 npc_1 → 固定 RNG → giveGift(love 档) → favor 增量 = round(base×1.20) |
| 6 | favorGain | 解锁 npc_3 → changeFavor(id, +5) → 实际 +round(5×1.15)；负向不放大用例 |
| 7 | decisionBonus | 解锁 event_100 → EventSystem.applyEffects({moneyAbs:100000, reputation:2}) → money += 100000×1.15（rep 走 #8 系数） |
| 8 | decisionAnalysis | 解锁 decision_5 → 同上断言 reputation 增量 ×1.10、负资金不受 bonus 影响用例 |
| 9 | eventPredict | 静态：autoDecide 源码含 eventPredict 乘数；行为：构造资金项 vs 声誉项对决事件，断言 autoDecide 选中项符合放大后 argmax |
| 10 | stressCap | 解锁 stress_never_high → G.stress=95 → 跑 1 tick → stress ≤ 90；未解锁对照组 95→正常衰减 |
| 11 | rdBonus | 解锁 money_50m → 重置 G.rpt → SGame.generateRPT → 增量比无成就对照 ≈×1.10 |
| 12 | 聚合不变量 | calcAchievementRewards 对 12 键求和正确（数值/布尔语义不变）——防回归 |

## 6. 风险与遗留

| 级别 | 项 | 处置 |
|------|----|------|
| P2 | eventPredict 手动模式无收益（托管导向语义） | 文档明示，留待后续版本再议（可升级为"决策前提示"UI 能力） |
| P2 | coopBonus 范围仅 NPC 约谈（不含 MA 收购系统） | 最简范围，文档明示 |
| P2 | 1e10 达成时点因 +500k 早期注入小幅前移 | 属预期再平衡，rankTimes 对照写入 QA 报告 |
| 无 | 死键遗留 | 12/12 全部接线，无遗留死键 |
