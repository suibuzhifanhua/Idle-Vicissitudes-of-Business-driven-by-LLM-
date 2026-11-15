# 晚期 NPC（act≥6）任务线长仿真报告（Phase 7 前置 · A 项）

> 目的：覆盖 v1.10 引入、720h 窗口内从未执行过的代码路径——3 个晚期 NPC（苏明远 act6 / 沈亦东 act7 / 顾璇 act8）的 lazyFavor 建键 + 12 条任务线（4×3 步）的运行时结算。
> 方法：临时探针 harness（balance-simulation v2.0 + 任务调度器，走真实 startQuest/advanceQuest/changeFavor API，零游戏代码改动），两阶段：
> - **Stage 1 natural**：4320h 自然推进（升级/招聘调度器同 720h 基线口径），SEED=1
> - **Stage 2 forced**：720h，预置 1e14 资产 / rep 100 / 全业务 Lv10，定向覆盖全部 12 条任务线结算
> 日期：2026-11-15 · 树：HEAD（v1.11 + A/B/C 前置）

## 0. 结论

| 项 | 结果 |
|----|------|
| P0/P1 缺陷 | **0**（晚期 NPC 路径健康，12 条任务线全部可正常推进/结算） |
| Stage 1（natural 4320h） | PASS：0 错误，act 1→8 全推进，3 NPC 自然解锁，12 任务全完成 |
| Stage 2（forced 720h） | PASS：0 错误，12 任务全完成，奖励结算精确 |
| 附带验证 | 720h 前段与 v1.11 基线**逐位一致**（44,186,077,984），证明任务钩子在 act<6 窗口零扰动 |

## 1. Stage 1：natural 4320h 实测

**act 推进曲线**（首次达成 tick）：

| act | 里程碑 | 时点 |
|-----|--------|------|
| 2/3/4/5 | — | 1.4h / 11.8h / 41.7h / 182.7h |
| **6** | 商业教父（1e11） | **786.7h**（tick 94399） |
| **7** | 千亿帝国（1e12） | **971.5h**（tick 116575） |
| **8** | 万亿财阀（1e13） | **1480h**（tick 177599） |

**晚期 NPC 自然解锁**（lazyFavor triggerActEvent 补建，键位首次探测时点）：

| NPC | actUnlock | 键建立 | 解锁后社交补好感 | 终局好感（含衰减） | 完成任务 |
|-----|-----------|--------|------------------|--------------------|----------|
| 苏明远 | 6 | tick 94416（act6+17tick） | +20 | 47 | 4/4 |
| 沈亦东 | 7 | tick 116592（act7+17tick） | +17 | 49 | 4/4 |
| 顾璇 | 8 | tick 177600（act8+1tick） | +20 | 51 | 4/4 |

键建立时点与 act 推进 tick 精确对齐（+1 探针窗口），**v1.10 核心 lazyFavor 机制在真实推进场景下验证通过**。

**任务调度**：36 次行动（12 任务 × start + 2 advance）全部 ok，0 失败；任务奖励资金净 **+11,250,000,000**（含 q2/q4 的 -5e7/-2e8/-6e8 等负值支出步骤）；完成奖励（每任务 +1 SP）经 completeQuest 路径覆盖。

**经济曲线**（scheduled）：

| 时点 | 资产 | 排名 | 业务总级 | 员工 |
|------|------|------|----------|------|
| 720h | 4.42e10（= v1.11 基线，逐位一致） | 亚洲巨擘 | 70 | 126 |
| 1440h | 9.32e12 | 千亿帝国 | 70 | 135 |
| 2880h | 7.42e13 | 万亿财阀 | 70 | 138 |
| 4320h | **1.98e14** | 永恒商神 | 70 | 141 |

**rankTimes 全档位**（720h 新增段）：全球富豪 761h / 商业教父 844h / 千亿帝国 972h / 万亿财阀 1480h / 永恒商神 3658h（1e14 档在 4320h 窗口内达成）。

## 2. Stage 2：forced 定向覆盖

预置 1e14 后 tick 1 直达 act8（bizSum 70 < 80 未达 act9 条件——**act9 里程碑的 bizSumMin=80 门槛在自然经济下不可达性观察**，见 P2-1）。

- 3 个 NPC 键均于 tick 24 前建好（triggerActEvent(8) 单次批量补建，actUnlock≤8 全触发）
- 12 条任务线 36 次行动全部 ok（首行动 tick 72，末行动 tick 336 ≈ 28 分钟游戏时间）
- 奖励结算与 Stage 1 完全一致（同一任务集合：money 净 +11.25e9、statPoints 含步骤奖励 18 + 完成奖励 12）
- 终局 2.04e14（1e14 预置复利 720h），0 错误

## 3. 验收对照

| # | 验收点 | 结果 | 证据 |
|---|--------|------|------|
| 1 | triggerActEvent 对 lazyFavor NPC 补建键（自然推进） | ✅ | 3 NPC 键建立时点与 act 推进 tick 对齐 |
| 2 | startQuest 好感门槛校验（reqFavor 20/40/60/75） | ✅ | 调度器先补好感再开任务，低好感时 getAvailableQuests 正确返回空 |
| 3 | 3 步任务线推进/完成（questProgress/questCompleted 状态机） | ✅ | 12/12 完成，inProg 终态为空 |
| 4 | 步骤奖励结算（money 含负值/rep/stress/connections/npcFavor 联动/statPoints） | ✅ | money 净 +11.25e9 与配置逐项求和一致 |
| 5 | 完成奖励 +1 SP（completeQuest） | ✅ | statPoints 80 含任务份额 30 |
| 6 | 好感衰减与社交补升共存（晚期 NPC 键进入衰减块） | ✅ | 终局好感 47/49/51（衰减后），非单调 |
| 7 | 全程 0 运行错误 / 无 NaN / 无破产 | ✅ | errors=[]，haltedAt=null，钱恒正 |
| 8 | 任务钩子不扰动 act<6 前段轨迹 | ✅ | 720h 前段 = v1.11 基线逐位一致 |

## 4. 附带发现

| # | 级别 | 发现 | 处置 |
|---|------|------|------|
| P2-1 | 观察 | act9「永恒商神」bizSumMin=80：4320h 自然推进业务总级封顶 70（后期业务升级停滞，回本贪心调度器不再升级），自然路径下 act9 仅靠 money 不可达（forced 阶段同样停在 act8） | 非缺陷（难度设计），但 v1.9 的 act9 真结局在自然经济下 4320h 内不可达；如需可达需调 bizSumMin 或后期业务上限 |
| P2-2 | 观察 | data-npcs.js 中 autoAdvance 配置 0 处 → checkNPCQuests（core.js tick 自动推进钩子）为死路径 | 预留能力未启用，无影响 |
| 备注 | — | 720h 基线在第二个 harness（含任务钩子）下逐位复现，基线鲁棒性再确认 | — |

## 5. 复现命令

```bash
# 临时 harness（本次已删，重建 = balance-simulation.mjs + 任务调度器补丁）
SIM_STAGE=natural SIM_ONLY=scheduled SEED=1 node _latesim.mjs <game_dir>   # 4320h
SIM_STAGE=forced   SIM_ONLY=scheduled SEED=1 node _latesim.mjs <game_dir>   # 720h 预置 1e14
```
