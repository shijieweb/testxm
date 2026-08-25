# 文件索引（按需加载）

> 创建日期：2026-08-15 ｜ 维护者：军师（每次整理时更新大小）
> 用途：军师开工时先读本文件（<3KB），按任务需要选择性加载文件，不全量加载7个文件
> 原则：日常执行只读「必读」文件，meta-audit时额外读「按需」文件

---

## 军师必读文件（日常执行）

| 文件 | 大小 | 用途 | 何时读 |
|---|---|---|---|
| `memory/js-cognitive-framework.md` | 40KB | 角度清单（24个角度+候选） | 每次执行 |
| `memory/js-cognitive-rules.md` | 44KB | 管理规则（4域35小节，v2.19精简：去重+历史移changelog+模板引用+二级分组） | 每次执行 |
| `memory/js-cognitive-rules-ext.md` | 0.5KB | 管理规则扩展（新增独立主题规则，增长纪律：rules.md只减不增） | 整理时按需读 |
| `memory/js-cognitive-charter.md` | 18KB | 章程附件（第十章职责+第十一章进化引擎） | 每次执行 |
| `memory/js-cognitive.md` | 8KB | 短期记忆（20条一句话） | 每次执行 |
| `memory/js-cognitive-longterm.md` | 6KB | 长期记忆（6个主题） | 每次执行 |

## 军师按需读取文件

| 文件 | 大小 | 用途 | 何时读 |
|---|---|---|---|
| `status/js-self-review.md` | 31KB | 自回顾记录+DET检测项 | 执行前读DET，执行后写自回顾 |
| `status/js-dispatch-counter.md` | 6KB | 调用计数器+活动日志 | 收工时+1，meta-audit时读 |
| `CONSTITUTION.md` | 52KB | 系统章程（9章，不含已拆分的第十/十一章） | 仅需查协作流程/角色定义时 |
| `status/dashboard.md` | 3KB | 看板（角色状态+引擎健康） | 老板要看时 |
| `status/issues.md` | 10KB | 问题追踪 | 有未解决问题时 |
| `status/coverage-gaps.md` | 0.5KB | 覆盖缺口记录 | 闭环2覆盖检查时 |
| `status/angle-proposals.md` | 0.5KB | 角度提案 | 闭环3提案时 |
| `status/angle-feedback.md` | 0.5KB | 角度效果反馈 | 闭环6反馈时 |
| `status/standard-changes.md` | 2KB | 验证标准变更历史 | 验证角度时 |
| `status/gray-areas.md` | 1KB | 灰色地带记录 | 碰到模糊场景时 |
| `status/ms-standin-review.md` | 0.3KB | 秘书自审记录 | 闭环1自审时 |

## 模板文件（创建角色时读一次）

| 文件 | 大小 | 用途 |
|---|---|---|
| `templates/ps.md` | 3KB | 秘书模板 |
| `templates/js.md` | 3KB | 军师模板 |
| `templates/cp.md` | 2KB | PM模板 |
| `templates/cs.md` | 2KB | 测试模板 |
| `templates/hd.md` | 2KB | 后端模板 |
| `templates/qd.md` | 2KB | 前端模板 |
| `templates/yw.md` | 2KB | 运维模板 |

## 归档文件（很少读）

| 文件 | 大小 | 用途 |
|---|---|---|
| `.archive/CONSTITUTION-changelog.md` | 10KB | 章程变更归档 |
| `memory/.archive/js-cognitive-framework-changelog.md` | 16KB | 角度库变更归档 |
| `memory/.archive/js-archived-angles.md` | 0.5KB | 归档角度 |
| `status/.archive/js-self-review-archive.md` | 69KB | 自回顾归档 |

## 脚本文件

| 文件 | 大小 | 用途 |
|---|---|---|
| `scripts/js-start.sh` | 17KB | 军师开工脚本（v2.2：含git检查+缓存校验） |
| `scripts/js-end.sh` | 12KB | 军师收工脚本（v2.2：含git自动提交+缓存生成） |

## 缓存目录（不入git，可重新生成）

| 目录 | 用途 |
|---|---|
| `.cache/` | 运行时缓存（角度库摘要等），js-end.sh收工时生成，js-start.sh开工时校验hash后使用。不入git（.gitignore排除） |

## 文件大小预警阈值

- **绿色**（<32KB）：正常
- **黄色**（32-48KB）：关注，下次整理时评估是否拆分
- **红色**（>48KB）：必须拆分，下次整理时执行

当前超阈值文件：`js-cognitive-framework.md`（40KB，黄色）、`js-cognitive-rules.md`（44KB，黄色）、`js-self-review.md`（31KB，绿色边缘）
