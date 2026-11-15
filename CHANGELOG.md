# Changelog

《商海浮沉》版本变更记录。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号与 git tag 一一对应。

## [1.12] — 2026-11-15

**修复轮：幕 9 真结局可达 + 托管任务线 + 子公司打平。** 全量修复（设计分析 →「全修」授权）。

### Fixed
- **P1**：幕 9「永恒商神」`bizSumMin: 80` 超出系统硬上限（7 业务 × 10 级 = 70），真结局数学上不可达；双仿真证实 4320h / 1.98e14 资产下仍卡幕 8。降为 **70**（语义 = 全部业务满级）。4320h SEED=1 自然仿真实测真结局达成、0 错误（`tests/act9-4320h-sim-v1.12.md`）
- **P2**：子公司纯现金流净亏（让出 20~40% 单城收入 vs 免维护约值 7%）→ `SUBSIDIARY_SHARE_BASE` 0.60→**0.65**（玩家保留 65~80%）、`SUBSIDIARY_GROUP_INCOME_BONUS` 0.02→**0.03**（全局协同 2%→3%/家），「让分成换托管」模型收窄至打平

### Added
- **托管任务线** `autoQuest` 策略（默认开）：托管时自动开启/推进 NPC 任务线——每 NPC 在跑任务 ≤1、尊重 `autoAdvanced`、步奖励为负资金且付不起时跳过；成功计入 `autoStats.questsStarted/questsAdvanced`
- `balance-simulation.mjs` 增加 `actTimes`（act → 首次达成 tick/h 时）逐场景追踪，供终局可达性验收
- `verify-gameplay.mjs` 新增 6 条 v1.12 断言（幕 9 门槛 ≤70 / 子公司参数 / 分成率下限 / 新档 40 tick 真跑托管任务线：q1 完成 + q2 推进 + 统计计数）→ **215 PASS / 0 FAIL**

### Verified
- 720h SEED=1 scheduled 终值 **44,186,077,984 与 v1.11 基线逐位一致**（三改动对前段全为 no-op：autoQuest 需托管开、sim 未开；sim 未设子公司；bizSumMin 仅影响 late-game）
- 4320h SEED=1 自然仿真：**act 9 @ 3792h**、rank=永恒商神 @ 3790h、4320h 终值 **179,461,989,555,922**（~1.79e14）、bizSum=70、`errors: []`、`haltedAt: null`（`tests/act9-4320h-sim-v1.12.md`）

### Decisions（记录为显式决策，不视为缺陷）
- 并购回本期**保持现状**：回本 ~120h 相对晚期资产量级健康，无通胀风险
- 全托管薄资金新档 ~33 tick 破产（`TimerManager.clearAll` 冻结 tick）为既有经济行为，列为 P2 观察项（候选「最低现金守卫」策略），本轮不改

## [1.11] — 2026-11-13（ba862f7）

成就死奖励键完整接线 + P1 死引用修复 + 720h 经济基线重定。**Phase 6 打磨轮交付。**

### Added
- 成就奖励 12 个死键全部按宣传语义实装（纯算术变换、零新增 Math.random）：
  - **一次性授予键**（checkAchievements 解锁时刻发放）：`statPoints`（first_biz +2 / skill_1 +1 / skill_10 +3 / venture_first +1）、`startMoney`（speed_run +50 万「极速奖励金」）
  - **tick clamp 键**：`stressCap`（stress_never_high → 压力上限 100→90，tickDecay 内 clamp）
  - **玩家/托管动作键**：`loanInterest`（rep_80 贷款利率 -2pp，地板 5%，含金行长特批贷）、`coopBonus`（rep_70 约谈收益 +10%）、`negotiateBonus`（npc_max 约谈收益 +20%）、`giftEffect`（npc_1 送礼好感 +20%）、`favorGain`（npc_3 正向好感获取 +15%）、`decisionBonus`（event_100 事件正向资金 +15%）、`decisionAnalysis`（decision_5 事件正向非资金 +10%）、`eventPredict`（event_10 托管自动决策资金评分权重 +5%）
- `design/reward-key-design.md`：T1 设计口径（12 键消费地图 + 720h 不变性安全框架 + 重定基线方针 + §1.3a 新基线实测数据）
- `tests/playtest-report-v1.11.md`：三轮 Playtest + 死奖励键回归轮（12/12 断言对照）+ P0/P1/P2 清单
- verify-gameplay.mjs 新增 12 条 v1.11 断言（含双 startGame 对照实验隔离既有 SP 路径）→ **209 PASS / 0 FAIL**
- git tag 全量补齐：v1.1 ~ v1.11 + 本 CHANGELOG

### Fixed
- **P1**：`core-research.js:28` `S.calcAchievementRewards` 死引用——函数从未挂到 SGame 恒 undefined，致 money_50m/tech_leader/bear_tycoon 的 `rdBonus` 研发奖励从未生效；改裸全局引用（与 core.js 5 处既有引用一致）

### Changed
- **720h 经济基线重定**（设计方针，非回归）：speed_run +50 万在仿真窗口内必然发放，逐位不变性逻辑上不可保持。新基线（SEED=1 / scheduled / 720h）：终值 47,117,429,292 → **44,186,077,984**（-6.2%，事件分支噪声）、randCalls 13,322,591 → **13,378,003**、1e10 达成 188h → **183h**、中期档位前移 2-7h。验收三条全过：双跑指纹逐字段一致 / 终值健康 / verify 全绿。单 commit 可 `git revert` 回滚。

### 已知限制（P2，详见 tests/playtest-report-v1.11.md §5）
- eventPredict 手动模式无收益（定位「托管助理能力」）
- coopBonus 范围仅 NPC 约谈（不含 MA 收购）
- act≥6 晚期 NPC 任务线无运行时执行样本（需 4320h+ 长仿真或人工晚局 playtest）

## [1.10] — 2026-11-13（131d59c）

### Added
- 晚期专属 NPC ×3：苏明远（act6）/ 沈亦东（act7）/ 顾璇（act8），各 4 任务线×3 步，奖励晚期量级（含 money ≥1e8 与末期技能点）
- **lazyFavor 延迟好感机制**：晚期 NPC 开局不占 G.npcFavor 键位（act 解锁时由 triggerActEvent 补建）→ 好感衰减块每 3 tick 每键的 Math.random 消耗序列不变 → 720h 逐位不变性保持（新游戏恰 14 键）
- 冲刺挑战模式 sprint：初始资金 ×3、200h 内资产冲 100 亿（sprint_10b 成就，speed_run 1e10/720000s）
- 极速传奇 speed_run 成就（1e6/1h 型，奖励 startMoney +50 万——v1.11 起生效）

## [1.9] — 2026-11-13（fb5e014）

### Added
- 剧情延展至 9 幕：千亿 / 万亿 / 10 万亿 / 100 万亿里程碑叙事（act 6-9 对齐资产量级，100 万亿为真结局）
- 晚期专属事件 ×8（assetThreshold 量级门槛 1e10+）
- **传承基业 Prestige NG+**：资产 1e13 起可转世（getLegacyPoints 1e6→0 / 1e13→2 / 1e14→4 / 5e13→3 / 1e25 封顶 20），新纪元 G 重置并携带传承点：初始资金 ×(1+25%×点)、收入乘数 ×(1+10%×点)，传承记录持久化
- v1.9 起 720h 逐位不变性基线确立（money=47117429292 / randCalls=13322591）

## [1.8] — 2026-11-12（4fb49d1）

### Fixed
- **P1**（#20）：运营风险损失随后期档位 ×0.5 衰减，消除千亿档后的资产摩擦墙（4320h 实测定位）

## [1.7] — 2026-11-12（0ca1c81）

### Added
- 后期档位乘数：500 亿起收入 ×3 / 成本 ×8，风投/事件绝对值跟随（#17/#18）
- 超大数中文单位：京 / 秭 / 垓

## [1.6] — 2026-11-12（15e2755）

### Added
- 法务 / 商战事件线 ×5（#15）

### Fixed
- **P0**：数组型 effect 解包（事件数组型效果此前不生效）
- 风投 IPO 宣布标记改 undefined 语义（#14 补漏：tickCount=0 时防每 tick 重复宣布，1e2dcfc）

## [1.5] — 2026-11-12（0739144）

### Added
- 风投线 MVP：天使 → PE → IPO（#14）

## [1.4] — 2026-11-12（8ee1742）

### Added
- LLM「问世界」自由问答 + 一键执行建议（#13）：招聘/经济等意图路由、executeAction（upgrade/hire）、离线规则应答兜底、坏 JSON 容错

## [1.3] — 2026-11-12（316c338）

### Added
- 富豪等级进度条
- 系统首次解锁渐进提示（P2 体验）

## [1.2] — 2026-11-12（3057ec1）

### Added
- 经济模拟 v2.0：balance-simulation.mjs 真跑 doTick 双场景对照（scheduled 升级/招聘调度 vs passive 零干预），退役 v1.1 简化算术上界模型
- 三件套回归运行器 run-tests.sh（verify + balance + server API，含哨兵/退出码推导机制）

## [1.1] — 2026-11-12（509ab2e）

### Added
- 多城市数据源统一：G.businesses 降级为当前城市活视图（多城市业务同步的基础）

## [1.0] — 2026-11-05（594e132）

### Added
- 模块化重构版首发：IIFE 模块挂 window（SGame/UI/EventSystem/NPCSystem/LLM/Settings/Storage/AudioFX），config/core/ui/data/npc/llm 核心文件 + 员工/多城市/收入 tick 循环
- v1.0 后安全加固：relay SSRF 双闸拦截（f5833c4）；P0 清债：README 数值同步 config 事实源、BGM 压缩 MP3、补 9/F 快捷键（fbe7dfb）
