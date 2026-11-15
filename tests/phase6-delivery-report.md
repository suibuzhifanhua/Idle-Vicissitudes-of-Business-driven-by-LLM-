# Phase 6 打磨轮 · 交付报告

> 项目：《商海浮沉》（C:/Users/A1/Desktop/shanghaifc）
> 交付日期：2026-11-13 · 评审强度：lean · 语言：简体中文
> 最终树：HEAD bdd625a · 版本 tag v1.11（ba862f7）

## 0. 结论总览

| 任务 | 范围 | 结果 |
|------|------|------|
| T1 死奖励键设计 | 12 键消费点设计 + 720h 安全性论证 | ✅ 完成（design/reward-key-design.md） |
| T2 实现 + 720h 重验 | 7 文件实装 + verify +12 断言 + 双跑确定性 + 新基线 | ✅ 完成（209 PASS / 0 FAIL，双指纹逐字段一致） |
| T3 三轮 Playtest + QA | A 新存档 / B 晚期 NPC 盲区 / C 降级兼容 + P0/P1/P2 | ✅ 完成（tests/playtest-report-v1.11.md，P0=0） |
| T4 版本化 | tag v1.1~v1.11 + CHANGELOG.md | ✅ 完成（12 tag，Keep a Changelog 格式） |
| T5 最终 QA 门 | 最终树 verify + 跨文档一致性 | ✅ 完成（本报告） |

**P0 缺陷 0 · P1 缺陷 1（本轮修复）· P2 遗留 4（不阻塞发布）**

## 1. 平台故障说明（执行方式变更）

本会话团队子代理机制完全不可用：9 个 agent 全部在首次调用即 400 失败（`Unexpected reasoning effort high`——会话 effort 档位 high 被端点拒绝，端点只收 xhigh/medium/low），5 种探针组合（subagent_type × model 值）全部复现，与具体参数无关，判定为平台级故障。Agent 工具无档位参数可改 → **放弃团队机制，由主理人串行直执 T1→T5**，流水线与团队模式同构（设计→设计门→实现→验证→交付），质量口径未降。

## 2. 死奖励键修复（12/12 全部接线，无遗留）

| # | 键 | 涉及成就 | 消费点 | 语义 |
|---|----|----------|--------|------|
| 1 | statPoints | first_biz/skill_1/skill_10/venture_first | checkAchievements（core.js）解锁时刻一次性授予 | +2/+1/+3/+1 技能点 |
| 2 | startMoney | speed_run | checkAchievements 解锁时刻发放 | +50 万「极速奖励金」 |
| 3 | stressCap | stress_never_high | tickDecay clamp | 压力上限 100→90 |
| 4 | loanInterest | rep_80 | applyLoan + 金行长特批贷 | 利率 -2pp（地板 5%） |
| 5 | coopBonus | rep_70 | negotiate 三档 | 约谈收益 +10% |
| 6 | negotiateBonus | npc_max | negotiate 三档 | 约谈收益 +20% |
| 7 | giftEffect | npc_1 | giveGift favorDelta | 送礼好感 +20% |
| 8 | favorGain | npc_3 | changeFavor 正向 | 好感获取 +15%（负向不放大） |
| 9 | decisionBonus | event_100 | applyEffects 正向资金 | 事件资金 +15%（负向不放大） |
| 10 | decisionAnalysis | decision_5 | applyEffects 正向非资金 | rep/conn 正、stress 负 +10% |
| 11 | eventPredict | event_10 | autoDecide 评分放大 | 托管资金评分权重 +5%（确定性 argmax，零新增 RNG） |
| 12 | rdBonus | money_50m/tech_leader/bear_tycoon | core-research.js generateRPT | 研发增速 +10%/+8%/…（**P1 死引用修复后首次生效**） |

**P1 修复**：core-research.js:28 `S.calcAchievementRewards` 死引用（该函数从未挂到 SGame，恒 undefined → 3 成就研发奖励从未生效）→ 改裸全局引用。

实现约束：全部纯算术变换、零新增 Math.random；11/12 键位于 harness 永不执行的路径（autoMode 关闭 / 玩家动作门控），sim 安全性逐键论证见 design/reward-key-design.md §1-§2。

## 3. 720h 基线重定（新旧对照实测）

执行口径：SEED=1 / scheduled（升级回本贪心 + 招聘调度）/ 720h = 86400 tick。旧基线为 **v1.10 worktree 复跑实测**（逐位复现历史值 47117429292/13322591，harness 口径无漂移）。

| 指标 | v1.10 | v1.11 | 变化 |
|------|-------|-------|------|
| 终值 money | 47,117,429,292 | **44,186,077,984** | -6.2%（事件分支噪声，单种子） |
| randCalls | 13,322,591 | **13,378,003** | +55,412（+0.42%） |
| maxStress | 25 | 25 | stressCap 惰性成立（clamp 90 从未触发） |
| speed_run 解锁 | tick 6（未发放） | tick 6（发放 +500k） | 唯一轨迹变更源 |
| statPoints 终局 | 26 | 28 | first_biz 授予首次生效 |
| rankTimes 1e10（亚洲巨擘） | 188h | **183h** | 前移 5h，仍在窗口内 |
| rankTimes 中期（区域龙头/城市新贵/省级大亨） | 10h/24h/39h | **8h/20h/32h** | 前移 2-7h |

**验收三条全过**：① 确定性——A/B 两次全新 720h 运行双指纹逐字段一致（唯一差异 wallSeconds 为环境量）② 合理性——终值有限无 NaN、1e10 窗口内、曲线同构无断崖 ③ 回归——verify 209 PASS / 0 FAIL。

**可回滚**：单 commit ba862f7，`git revert` 即恢复 v1.10 轨迹。

## 4. Playtest 三轮 + 缺陷分级

- **Round A 新存档全流程**：PASS（首 tick 成就解锁/一次性授予对照差分精确/720h 全管线 0 错误）
- **Round B act≥6 晚期 NPC（最大盲区）**：PASS（lazyFavor 机制层全绿：14 键/建键/门槛 6-7-8；任务奖励运行时执行样本缺失 → P2-3）
- **Round C 降级兼容**：PASS（LLM stub/Storage 降级/doPrestige NG+/sprint 边界/存档损坏容错/坏 JSON 容错）
- **死键回归轮**：12/12 键专属断言全绿

| 级别 | 数量 | 清单 |
|------|------|------|
| P0 | 0 | — |
| P1 | 1（已修） | rdBonus 死引用（core-research.js:28） |
| P2 | 2（遗留）/ 2（已关闭） | ① eventPredict 手动模式无收益（托管定位）② coopBonus 不含 MA 收购；③ 晚期 NPC 任务线无运行时样本 → ✅ 已关闭（2026-11-15 A 项：4320h 自然长仿真 + forced 定向仿真，12 任务线全结算，见 tests/late-npc-sim-report.md）④ 终值 -6.2% 为单种子观察 → ✅ 已关闭（2026-11-15 B 项：SEED=1..5 新旧对照 5×2，真实再平衡 = 均值 +24% / sd ×2.3，见 tests/multi-seed-baseline-v1.11.md） |

## 5. 版本化

- **tag**：v1.0（既有）+ v1.1~v1.11 共 11 个新 tag，轻量 tag 指向已核对 sha（v1.1=509ab2e … v1.10=131d59c，v1.11=ba862f7）
- **CHANGELOG.md**：Keep a Changelog 格式，v1.0（2026-11-05）~ v1.11（2026-11-13）全版本史，v1.11 含 Added/Fixed/Changed/已知限制四节
- **commits（本轮 2 个，未 push）**：ba862f7（feat 12 键 + P1 + 重定基线，8 文件 +488/-18）→ bdd625a（docs CHANGELOG + Playtest 报告）

## 6. 交付物清单

| 文件 | 说明 |
|------|------|
| design/reward-key-design.md | T1 设计口径 + §1.3a 新基线实测 |
| tests/playtest-report-v1.11.md | T3 三轮 Playtest + 死键回归对照 + 新旧基线 |
| tests/phase6-delivery-report.md | 本报告 |
| CHANGELOG.md | v1.0~v1.11 全版本史 |
| core.js / core-research.js / npc.js / events.js / core-strategy.js / config-achievements.js | 12 键消费点 + P1 修复 + 消费地图注释 |
| verify-gameplay.mjs | +12 条 v1.11 断言（209 总） |

## 7. 待办与风险

| 项 | 级别 | 说明 |
|----|------|------|
| ~~push 至 GitHub~~ | ✅ 已关闭（2026-11-13） | 用户授权后执行：先 merge 远端独有 commit 309f314（balance-simulation 相对路径修复，唯一冲突取 path.sep 版本）→ push main（309f314..8556598）+ 12 tag（v1.0~v1.11）；本地/远端 0/0 同步 |
| ~~晚期 NPC 长仿真~~ | ✅ 已关闭（2026-11-15） | A 项：4320h 自然长仿真 + forced 定向仿真，12 任务线 / 36 行动全结算零缺陷，720h 前段基线逐位复现；附带发现 act9 自然不可达与 autoAdvance 死路径（均 P2 观察）；见 tests/late-npc-sim-report.md |
| ~~多种子基线~~ | ✅ 已关闭（2026-11-15） | B 项：SEED=1..5 新旧对照 5×2 跑全 ok，-6.2% 确认为单种子噪声（真实再平衡 = 均值 +24% / sd ×2.3 / 1e10 前移 13.2h / randCalls -0.5%）；见 tests/multi-seed-baseline-v1.11.md |
| 团队子代理平台故障 | 环境 | 会话级 400（effort 档位），建议后续会话先做探针再启用团队模式 |
