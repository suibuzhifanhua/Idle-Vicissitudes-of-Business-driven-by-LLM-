# Changelog

《商海浮沉》版本变更记录。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号与 git tag 一一对应。

## [1.14] — 2026-11-16

**功能轮：真结局后事件真空区补齐（永恒篇 ×4）+ 后期事件通道死锁修复。** v1.13 实测暴露：真结局（act 9 @2517h）后至 4320h 的 1803h 窗口内，资产 1e13~1e14+ 区间仅 1e13×2 两条事件可触发，叙事真空。8640h 长仿真进一步暴露根因：幕 6-9 事件池仅 7/9/11/13 条 < 50 槽 dedup 集，后期随机事件通道自幕 6 起即死锁（实测 720h→8640h 仅新增 34 随机事件）。

### Added
- **永恒篇·真结局后专属事件 ×4**（`data-events.js`，事件 202→206，延续帝国篇两档一条的门槛阶梯）：
  - `lg_eternal_council` 世界经济秩序理事会 @30T（acts 8-9）：共签新规则 / 全球公益基金 / 旁观者
  - `lg_eternal_breakthrough` 奇点突破联合体 @50T（acts 8-9）：时代下注 / 授权换筹码 / 灯塔角色
  - `lg_eternal_succession` 接班人 @100T（act 9）：交棒 / 永恒合伙人 / 归还世界
  - `lg_eternal_name` 名字成为历史 @100T（act 9）：初学者 / 点灯 / 留白
- moneyAbs 基准按「~10% 资产」口径校准（经 v1.7 costScale 放大后，1e14 档单选项 ~9200 亿~1.05 万亿）
- `balance-simulation.mjs` horizons 记录新增 `events: G.eventCount`（长仿真正确观测事件流）
- `balance-simulation.mjs` 新增 eternalEvents 触发跟踪（每 tick 采样 `G.eventLog[0]`，零新增 RNG），长仿真直接读四永恒篇标题触发计数
- verify-gameplay.mjs 新增 7 条 v1.14 断言（门槛阶梯 / 结构完整 / 真空区覆盖 2→6 / 前段零扰动 / eventCount 漏斗自增 / 死锁破缺 / 活性不变式）→ **235 PASS / 0 FAIL**

### Fixed
- **P1**：`G.eventCount` 死计数器——此前唯一自增点在 `core.js:3720` 不可达 fallback（`EventSystem.fireEvent` 缺失时），实际漏斗 `EventSystem.fireEvent`（events.js，全项目唯一事件入口）只推 `eventHistory` 从不计数 → 成就 `event_10/30/50/100` 永不可达、`event_100` 的 `decisionBonus` 奖励键（v1.11 奖励表 12 键之一）从未生效、统计面板「总事件数」恒 0。计数收拢到 fireEvent 漏斗（纯状态写入，零新增 Math.random）
- **P1**：后期随机事件通道死锁——`_firedEventIds` 去重集 50 槽 + 幕 6-9 事件池仅 7/9/11/13 条：集被池占满后，加权选单 100% 命中「近期已触发」候选、被 `fireEvent` 静默浪费（微验证：20000 次选单 100% 落空），随机事件流自幕 6 起枯竭（8640h 实测 720h→8640h 仅 34 条、永恒篇 4 条仅触发 3 次）。修复：`EventSystem.getFireable(candidates)` 剔除阻塞候选、**全阻塞时按「最早触发时刻」逐个破缺释放**（调用方已先做 cooldown 过滤，被释放者冷却必已完整过期，重触发安全）；core.js `tryFireEvent` 仅当**候选数 ≤50**（dedup 集容量、死锁必要条件）才走新路径——幕 1-5 池 102/148/168/155/96 恒 >50 走原路径，前段 RNG 逐位不变

### Verified
- **720h SEED=1 双跑（A/B）指纹逐字段一致**（wallSeconds/heapUsedMB 计时字段除外）：scheduled 终值 **83,936,469,154 与 v1.13 基线逐位不变**（eventCount 修复零经济扰动）、rank 全球富豪 @703h / act 5 / 员工 129 / 业务 70；**achievements 49→53**（event_10/30/50/100 四死成就复活，与 720h 实际事件数 1873 吻合）、**events=1873**（计数器此前恒 0）；passive 6,839,952,112 / 全国百强 / act 4 亦逐位不变（events=1998）
- 永恒篇前段零扰动：新事件门槛 ≥3e13 ≫ 720h 终值量级 8.4e10，上条即其实测
- 8640h SEED=1 长仿真（一个游戏年，`errors: []` / `haltedAt: null`）：后期通道复活——720h→8640h 随机事件 **34 → 21,985**（~647×，晚期速率 ~2.78/h 与早期 2.6/h 一致）；永恒篇四条触发 **6/4/5/5** 次（终局尺度冷却，罕见传承收束）；act 9 @2546h（v1.13: 2517h，幕 6 起 RNG 分支漂移属预期内）、终值 999,999,958,257,414（撞 harness 1e15 clamp，仿真工件非游戏上限）、ach=53、endingSeen=midActEcon=true——详见 `tests/eternal-8640h-sim-v1.14.md`

### Decisions
- 1e14 是 RANK_TIERS 封顶档（永恒商神），更高资产不再设新档/新事件——真结局后定位为「自由经营 + 永恒篇事件 + NG+ 转世」，数值上不追求无穷膨胀
- **永恒篇冷却=终局尺度**（72000/90000/108000/126000 tick = 600/750/900/1050h）：8640h 首跑暴露 cooldown 字段单位是 **tick**（1h=120tick）而非小时——初版 440~520 实为 ~4h 高频循环，四条「一次性传承收束」叙事各触发 870~1016 次，与「终章」定位相悖。改为终局尺度后各 ~5~12 次；既有 8 条帝国篇（280~520 tick）继续承担晚期叙事密度主力。weight 4-5（与帝国篇末档同级）

## [1.13] — 2026-11-16

**功能轮：晚期节奏墙 + 结局体系 + NG+ 成就 + 现金守卫 + 自动轮转。** 基于 4320h 仿真实测数据的设计提升清单（P0 幕8→9 占全程 53% 节奏墙 / P1 传承-真结局分叉 / P1-3 真结局后空窗 / P2-4 全托管 33 tick 破产 / P2-5 纯放置地板过低），「全做」授权全部落地。

### Added
- **50T 新头衔档「寰宇商君」**（RANK_TIERS 12→13，插于万亿财阀与永恒商神之间）：填补 1e13~1e14 事件/头衔真空区；副作用：永恒商神档 step 5→6（1e14 后收入 ×243→×729、成本 ×32768→×262144，仅结局期生效）
- **中期幕事件 `MIDACT_ECON`**：总资产（含股票）≥ **30T**（10T→100T 对数中点）首次触发 → 一次性分红 1000 亿 + 永久收入 ×1.15（棘轮 `G.midActEconDone`，不随资产回落）
- **真结局持久化体系**：幕 9 首达 → `G.endingSeen=true` 写入 legacy 记录，**跨纪元（NG+）持久**，startGame 回读；幕 9 定制 epilogue 叙事（LLM 优先、模板兜底「从此，商海只记得你的名字。」）；传承确认弹窗显示「⭐ 真结局印记将跨纪元保留」
- **NG+ 专属成就 ×4**（成就 78→82）：第二黎明 ng_first_rebirth / 重走老路 ng_act3 / 再造万亿 ng_10t / 永恒神话 ng_act9；`checkAchievementCond` 新增 legacy_gen / legacy_act / legacy_money / legacy_ending 四条件型
- **最低现金守卫**：现金 < max(50万, 10×每 tick 支出) 时仅保留保命策略（事件决策 / 还款 / 资产典当），其余支出策略推迟 5 tick、入/出守卫日志——全托管薄资金新档 33 tick 破产（`TimerManager.clearAll` 冻结）问题关闭
- **业务自动轮转 `tickAutoRotate`**：托管关闭时每 120 tick 选「每成本收入增益」最高业务自动升级（成本 ≤ 现金 40% 才动、reqCond 与 upgradeBusinessMax 同口径）——纯放置常开地板
- verify-gameplay.mjs 新增 7 条 v1.13 断言（新头衔 / MIDACT 参数 / 3.5e13 实触发 ×1.15 + 幂等 / 幕9 endingSeen + legacy 持久化 / doPrestige 4 点携带 + NG+ 成就 / 现金守卫 30 tick 不破产 / 自动轮转 1000 tick 升级）→ **228 PASS / 0 FAIL**

### Changed
- **720h 经济基线重定**（设计方针，非回归）：自动轮转对 sim 双场景（autoMode 均关）常开。新基线（SEED=1 / scheduled / 720h）：终值 44,186,077,984 → **83,936,469,154**（+90%，自动轮转 720h 内 7 业务全满级 70）、rank 全球富豪 @703h、act 5、成就 49；passive 720h 6,839,952,112（act 4，纯放置下限大幅抬升）
- v1.12 托管任务线断言放宽：q2 由「40 tick 推进至 step1」放宽为「40 tick 内开启且在跑」——tick 37 的推进可被 v1.13 现金守卫合法挂起（薄资金托管前期消费推高工资安全线），守卫行为独立在 v1.13 [6] 断言；垫资 2000 万、分成率断言 0.69 口径保持

### Verified
- 720h SEED=1 **双跑（A/B）指纹逐字段一致**（wallSeconds / heapUsedMB 计时字段除外）
- 4320h SEED=1 自然仿真：**act 9 @ 2517h**（v1.12: 3792h，**−33.6%**）、永恒商神 @2517h / 寰宇商君（新档）@2195h、endingSeen=midActEcon=true（两新机制自然触发）、终值 **889,961,146,319,515**（~8.9e14，v1.12: 1.79e14）、bizSum=70、`errors: []`、`haltedAt: null`（`tests/act9-4320h-sim-v1.13.md`）
- 幕节奏曲线（scheduled）：act2@1h / 3@17h / 4@50h / 5@194h / 6@728h / 7@907h / 8@1426h / **9@2517h**——幕 8→9 间隔 2281h → **1091h**

### Decisions
- P1-2「1e13 叙事选择点」简化落地为 endingSeen 跨纪元持久化 + 传承 confirm 印记 + 幕 9 epilogue 定制叙事（真结局叙事重量保留；独立二选一事件未做）
- 现金守卫白名单仅 eventDecide / repay / assetPawn；任务线属业务动作，低现金阶段被守卫挂起、现金恢复自动续跑（非缺陷，属「保命优先」设计）

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
