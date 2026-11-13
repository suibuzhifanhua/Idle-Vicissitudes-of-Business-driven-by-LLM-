# Playtest 报告 v1.11（Phase 6 打磨轮 · T3）

> 基线树：ba862f7（v1.11，死奖励键 12/12 接线 + rdBonus 死引用修复 + 720h 重定基线）
> 执行方式：主理人直执（团队子代理路由故障，见交付报告 §平台故障说明）
> 验证手段：verify-gameplay.mjs（209 断言）+ 720h 真跑 doTick 双场景仿真（balance-simulation.mjs 口径，SEED=1）+ v1.10 worktree 对照跑
> 日期：2026-11-13

## 0. 结论

| 项 | 结果 |
|----|------|
| P0 缺陷 | **0** |
| P1 缺陷 | 1（本轮已修：rdBonus 死引用） |
| P2 遗留 | 4（见 §5，均不阻塞发布） |
| verify 断言 | **209 PASS / 0 FAIL** |
| 720h 确定性（双跑指纹） | **逐字段一致**（A/B 两次全新运行） |
| 720h 运行期错误 | 0（scheduled / 86400 tick） |
| 死奖励键回归 | 12/12 键有专属断言覆盖，全绿 |

## 1. 三轮 Playtest

### Round A — 新存档全流程（正常路径）

**场景**：全新存档（tech 出身 / sprint 难度），首 tick → 成就解锁 → 奖励发放 → 720h 主动经营（升级/招聘调度器）。

| 检查点 | 结果 | 证据 |
|--------|------|------|
| startGame 初始状态（资金 1.8e6 = 400k×3×1.5 NG+） | PASS | verify「v1.10 startGame sprint 初始资金×3」 |
| 首 tick 成就自然解锁（first_biz/skill_1/speed_run） | PASS | verify v1.11 [1] 双 startGame 对照实验 |
| statPoints 一次性授予（净增 3 = 2+1，对照差分精确） | PASS | verify v1.11 [1]：spCtrl/spExp 差分 = 3 |
| startMoney 一次性发放（+500k，对照差分精确 500000） | PASS | verify v1.11 [2]：moneyDelta = 500000 |
| 720h 全管线 0 错误（事件/衰减/品牌/员工/供应链/财报/NPC） | PASS | 仿真 errors=0，haltedAt=null |
| 终值健康（有限、无 NaN、无负资产） | PASS | 44,186,077,984 |
| 排名推进合理（7 档 1h→183h 单调递进） | PASS | rankTimes 见 §3 |

**Round A 判定：PASS。**

### Round B — act≥6 晚期 NPC 路径（最大盲区专项）

v1.10 新增 3 个晚期 NPC（苏明远 act6 / 沈亦东 act7 / 顾璇 act8），720h 仿真窗口最高仅 act5 → 这三条任务线（各 4 线×3 步，含 statPoints 2-3 / money 5e8-3e9 奖励）在仿真内**永不执行**，是项目最大测试盲区。本轮对其做静态 + 半动态审查：

| 检查点 | 结果 | 证据 |
|--------|------|------|
| lazyFavor 延迟建键：新游戏 G.npcFavor 恰 14 键（晚期 NPC 不占键位） | PASS | verify「v1.10 新游戏 G.npcFavor=14 键」×2（普通/sprint） |
| 衰减块随机消耗序列不被扰动（720h 逐位不变性的关键前提） | PASS | v1.10 基线复现成功（47117429292/13322591 逐位命中）；v1.11 双跑逐字段一致 |
| getFavor(晚期 NPC) 解锁前返回 0 | PASS | verify「v1.10 getFavor(晚期NPC) 解锁前返回 0」 |
| changeFavor 为 lazyFavor NPC 自建好感键 | PASS | verify「v1.10 changeFavor 自建好感键 [fav=5]」 |
| 结构完整性（任务线 4×3 步 / 好感阶梯 20/40/60/75 / 对话礼物配置） | PASS | verify「v1.10 晚期 NPC 结构完整」 |
| relations/npcLinks 无悬空引用 | PASS | verify「relations/npcLinks 全部指向存在的 NPC」 |
| actUnlock 门槛（6/7/8）高于 720h 窗口最高幕 5（防误触） | PASS | verify「v1.10 3 晚期 NPC 存在 [6/7/8]」 |
| 任务奖励发放路径（npc.js:701 statPoints / money 消费） | 静态审查 PASS | 奖励消费代码与既有任务路径同函数（npc.js quest 结算），v1.11 未改动该路径；无独立断言（见 P2-3） |

**Round B 判定：PASS（带 P2 遗留）** —— 机制层（lazyFavor/建键/门槛）全绿；任务奖励的运行时执行样本缺失（需 4320h+ 长仿真或人工晚局 playtest 覆盖）。

### Round C — 降级与兼容（异常路径）

| 检查点 | 结果 | 证据 |
|--------|------|------|
| LLM 整体不可用（stub）时游戏全管线不中断 | PASS | 720h 仿真 LLM 桩全程 0 错误 |
| Storage 不可用降级（settings 键抑制） | PASS | verify 环境警告 1 条（已知，不影响玩法） |
| doPrestige NG+（2 点 / 第 1 纪元 / G 重置 / ×1.5 初始资金 / ×1.2 收入） | PASS | verify v1.9 块 9 条断言 |
| sprint 边界（24000 tick 整 200h 解锁 / 24001 不解锁） | PASS | verify「v1.10 speed_run 边界 [at=true over=false]」 |
| 存档损坏容错（load 失败回退新档） | PASS | verify 既有断言（load 异常分支） |
| 离线 24h 收益折算（沙箱时钟） | PASS | 仿真 offline24h 字段正常产出（hours/effectiveTicks 有限） |
| 事件坏 JSON / 非法 target / 空问题 | PASS | verify「问世界」块 5 条（坏 JSON 不抛错、非法 target ok:false 等） |

**Round C 判定：PASS。**

## 2. 死奖励键回归轮（12 键 × verify 断言对照）

| # | 键 | verify 断言（v1.11 块） | 实测 | 结果 |
|---|----|------------------------|------|------|
| 1 | statPoints | [1] 双 startGame 对照差分 = +3（first_biz 2 + skill_1 1） | 差分精确 3 | PASS |
| 2 | startMoney | [2] speed_run 解锁对照差分 = +500000 | 差分精确 500000 | PASS |
| 3 | loanInterest | [3] rep_80 利率 11.5%→9.5%（地板 0.05） | 11.5→9.5 | PASS |
| 4 | coopBonus+negotiateBonus | [4] negotiate 三档资金 ×1.30（45000→58500，fixRand(0.5)） | 58500 | PASS |
| 5 | giftEffect | [5] love 档送礼好感 12→14（+20% 四舍五入） | 14 | PASS |
| 6 | favorGain | [6] changeFavor 正向 +5→+6 / 负向 -4 不放大 | 6 / -4 | PASS |
| 7 | decisionBonus | [7] 正向资金 100000→115000 / 负向 -100000 不放大 | 115000 / -100000 | PASS |
| 8 | decisionAnalysis | [8] rep 2.2 / conn floor(40×0.45×1.1)=19 / stress -2.2 | 全中 | PASS |
| 9 | eventPredict | [9] autoDecide 评分 +5% 翻转选择 B_rep→A_money（decisionHistory 断言） | B→A | PASS |
| 10 | stressCap | [10] 对照 95→94.9 未触线 / 解锁后 95→恰 90 | 90 | PASS |
| 11 | rdBonus | [11] generateRPT 增速 ×1.10（tech Lv3 保证 rpt>0） | r1=r0×1.1（容差 0.01） | PASS |
| 12 | 聚合不变量 | [12] 15 成就下 12 键求和（statPoints 7 / startMoney 5e5 / 各乘数） | 全中 | PASS |

**回归轮判定：12/12 PASS，无死键遗留。**

## 3. 720h 经济基线对照（v1.10 → v1.11）

执行口径：SEED=1 / scheduled（升级回本贪心 + 招聘调度）/ 720h = 86400 tick / TICK_MS=30s。
v1.10 数值为 **worktree 复跑实测**（HEAD 131d59c），非历史转录，逐位复现了当时记录的 47117429292/13322591，证明 harness 口径无漂移。

| 指标 | v1.10 | v1.11 | 变化 | 解读 |
|------|-------|-------|------|------|
| 终值 money | 47,117,429,292 | 44,186,077,984 | **-6.2%** | 早期 +50 万改变事件/RNG 分支路径，随机损益噪声抵消复利；属预期再平衡（单种子观察） |
| randCalls | 13,322,591 | 13,378,003 | +55,412（+0.42%） | 条件 RNG 分支位移，与设计文档 §1.4 预测一致 |
| maxStress | 25 | 25 | 不变 | stress_never_high 解锁后 clamp 90 从未触发 → stressCap 惰性成立（双保险） |
| speed_run 解锁 | tick 6（未发放） | tick 6（发放 +500k） | — | 唯一轨迹变更源 |
| statPoints 终局 | 26 | 28 | +2 | first_biz 一次性授予首次生效 |
| 成就数终局 | 49 | 49 | 不变 | 解锁集合相同，仅奖励生效 |

**rankTimes 对照**：

| 档位 | v1.10 | v1.11 | 变化 |
|------|-------|-------|------|
| 个体户 | 1h | 1h | — |
| 小老板 | 2h | 2h | — |
| 区域龙头 | 10h | **8h** | 前移 2h |
| 城市新贵 | 24h | **20h** | 前移 4h |
| 省级大亨 | 39h | **32h** | 前移 7h |
| 全国百强 | 67h | 72h | 后移 5h（噪声） |
| 亚洲巨擘（1e10） | 188h | **183h** | 前移 5h |

**判定**：中期档位整体前移（+500k 早期注入的复利），1e10 达成仍在 720h 窗口内（183h），终值量级健康（4.4e10）。曲线形态与 v1.10 同构，无断崖/爆炸。

## 4. P1 缺陷（本轮发现并修复）

| 级别 | 位置 | 问题 | 修复 | 验证 |
|------|------|------|------|------|
| P1 | core-research.js:28 | `S.calcAchievementRewards` 死引用——该函数是 config-achievements.js 顶层全局、从未挂到 SGame → 恒 undefined → money_50m/tech_leader/bear_tycoon 的 rdBonus（+10%/+8%/…）研发奖励**从未生效** | 改裸全局引用 `(typeof calcAchievementRewards === 'function') ? calcAchievementRewards() : {}`（与 core.js 5 处既有引用一致） | verify v1.11 [11]：generateRPT 增速 r1 = r0×1.10 |

## 5. P2 遗留（不阻塞发布）

| # | 项 | 说明 | 建议 |
|---|----|------|------|
| 1 | eventPredict 手动模式无收益 | 语义定位「托管助理能力」：仅 autoDecide 评分放大，手动决策无加成 | 文档已明示；后续可升级为「决策前资金倾向提示」UI 能力 |
| 2 | coopBonus 范围仅 NPC 约谈 | 不含 MA 收购系统（最简范围） | 文档已明示；如宣传口径需含 MA，后续版本扩 |
| 3 | 晚期 NPC 任务奖励无运行时执行样本 | 720h 窗口最高 act5，act≥6 任务线（含 statPoints/money 晚期量级奖励）静态审查通过但从未真跑 | 安排 4320h+ 长仿真或人工晚局 playtest（Phase 7 候选） |
| 4 | 720h 终值 -6.2% 为单种子观察 | 事件分支噪声敏感（SEED=1 单样本） | 如需量化再平衡幅度，跑 SEED=1..5 多种子均值对比 |

## 6. 与 v1.10 的不变性关系

- v1.10 的「720h 逐位对齐 v1.9 基线」约束适用于不改 gameplay 的增量内容；v1.11 按设计方针**主动重定基线**（speed_run +500k 在 sim 窗口内必然发放，逐位不变性逻辑上不可保持）。
- 新基线验收三条全过：① 确定性（A/B 双跑逐字段一致）② 合理性（终值有限 / 无 NaN / 1e10 窗口内）③ verify 全绿（209/209）。
- 可回滚性：单 commit ba862f7，`git revert` 即恢复 v1.10 旧轨迹（旧基线已用 worktree 复跑逐位复现，回滚后指纹必然回到 47117429292/13322591）。
