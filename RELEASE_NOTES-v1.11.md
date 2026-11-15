# Release Notes — v1.11（Phase 6 打磨轮 · 2026-11-13 · commit ba862f7）

> 本文件供创建 GitHub Release 时复制使用（`gh release create v1.11 --notes-file RELEASE_NOTES-v1.11.md`，
> 或在网页 Releases 页手动粘贴）。逐版本明细见 [CHANGELOG.md](CHANGELOG.md)。

## 《商海浮沉》v1.11 — 成就死奖励键完整接线

### 亮点

- **12 个成就奖励键全部实装**：宣传过但从未生效的成就奖励（技能点一次性授予 / 极速奖励金 / 压力上限 / 贷款利率 / 约谈与送礼 / 事件决策 / 托管评分）全部按语义接线，纯算术变换、零新增 `Math.random`
- **P1 修复**：`rdBonus` 研发奖励死引用（money_50m / tech_leader / bear_tycoon 此前从未生效）
- **验证 209 PASS / 0 FAIL**：verify-gameplay.mjs 新增 12 条 v1.11 断言（含双 startGame 对照实验隔离既有 SP 授予路径）
- **晚期 NPC 零缺陷**：4320h 长仿真覆盖 act6-8 三条任务线 ×12 任务 ×36 行动，全部正常结算（tests/late-npc-sim-report.md）
- **多种子基线**：SEED=1..5 × 新旧版本 5×2 跑，确认单种子 -6.2% 为噪声，真实再平衡 = 均值 +24%（tests/multi-seed-baseline-v1.11.md）

### 720h 经济基线重定（设计方针，非回归）

| 指标 | 旧基线 | 新基线 |
|------|--------|--------|
| 终值（SEED=1 / scheduled / 720h） | 47,117,429,292 | **44,186,077,984** |
| randCalls | 13,322,591 | **13,378,003** |
| 1e10 达成 | 188h | **183h**（多种子均值 177.6h vs 190.8h） |

重定原因：speed_run +50 万「极速奖励金」在仿真窗口内必然发放，逐位不变性逻辑上不可保持。多种子对照：终值均值 52.4e10 → 65.0e9 量级 +24%，分布 sd ×2.3（早期注入放大种子间分化），randCalls -0.5%（无新 RNG 路径）。

### 已知限制（P2，不阻塞发布）

- eventPredict 手动模式无收益（定位「托管助理能力」）
- coopBonus 范围仅 NPC 约谈（不含 MA 收购）
- 第 9 幕「永恒商神」需业务等级总和 ≥80，4320h 自然推进封顶约 70，纯自然经济下不可达（长线出口为传承基业）
- NPC 任务 `autoAdvance` 配置位零使用（checkNPCQuests 死路径）

### 发布检查清单

| # | 项目 | 状态 |
|---|------|------|
| 1 | verify-gameplay.mjs 全绿（209 PASS / 0 FAIL） | ✅ 2026-11-13 |
| 2 | git tag v1.0 ~ v1.11 本地创建 | ✅ 2026-11-13 |
| 3 | main 推送、本地/远端 0/0 同步 | ✅ 2026-11-13（merge 8556598 后推送） |
| 4 | tag 全量推送 | ✅ 2026-11-13（12 tag 已推） |
| 5 | README 同步 v1.11（文档版本 16.0） | ✅ 本提交 |
| 6 | CHANGELOG.md v1.11 条目 | ✅ 2026-11-13（f0a6ea1 前已入库） |
| 7 | 晚期 NPC 4320h 长仿真报告 | ✅ tests/late-npc-sim-report.md |
| 8 | 多种子基线报告 | ✅ tests/multi-seed-baseline-v1.11.md |
| 9 | **GitHub Release 页面创建** | ⬜ 手动（gh CLI 本机不可用） |

**第 9 项手动操作**（二选一）：

```bash
# 方式一：gh CLI
gh release create v1.11 --title "v1.11 — 成就死奖励键完整接线" --notes-file RELEASE_NOTES-v1.11.md

# 方式二：网页
# https://github.com/suibuzhifanhua/Idle-Vicissitudes-of-Business-driven-by-LLM-/releases
# 选 tag v1.11 → 粘贴本文件内容 → Create release
```
