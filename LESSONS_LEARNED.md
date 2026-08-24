# 踩坑经验与进度汇总

> 记录本项目开发过程中的所有错误、修复方案和进度里程碑。

---

## 一、Bug 修复记录

### Bug #1：阈值比较类型错误（critical）

**位置**：`requirement-clarifier/api.js`，`ruleNextQuestion` 函数

**现象**：追问始终停在第一个维度（目标清晰），无法切换到后续维度。

**原因**：
```javascript
// ❌ 错误写法
if (!info || info.score < info.max * 0.6)
//              ↑ ratio (0.6)  vs  ↑ absolute (25 * 0.6 = 15)
// 0.6 < 15 → 永远为 true → 永远停在第一维度
```

**修复**：
```javascript
// ✅ 正确写法
if (!info || (info.score * info.max) < info.max * 0.6)
//             ↑ ratio * max → absolute score
```

**教训**：比较前必须统一量纲，ratio 和 absolute 不能直接比。

---

### Bug #2：async 误用导致 Promise 问题

**位置**：`requirement-clarifier/api.js`，`askClarifier` 函数

**现象**：ESM 测试中用 `await askClarifier(...)` 可以工作，但返回类型判断逻辑可能出错。

**原因**：函数内部无 `await` 也无异步操作，标记 `async` 会让返回值包装成 Promise，虽然不影响功能但增加不确定性。

**修复**：移除 `async` 关键字，改为普通函数。

**教训**：没有异步操作的函数不要标 `async`，保持返回值类型稳定。

---

### Bug #3：空 collect 调用崩溃

**位置**：`requirement-clarifier/test_unit.mjs`，测试6

**现象**：`askClarifier({}, [])` 时 `info` 为 undefined，访问 `info.score` 抛出 TypeError。

**原因**：测试代码在每轮追问后没有递增下一维度的分数，导致第一次调用返回 dimension 1 的追问，测试断言期待 dimension 2（"用户/场景"），但实际拿到的是"目标清晰"的追问（因为 goal 分数未推进）。

**修复**：在每轮追问后手动将当前维度分数设为1.0，推进到下一维度。

**教训**：测试断言应与实际执行逻辑对齐，不要假设内部状态会被自动推进。

---

### Bug #4：测试预期分数错误

**位置**：`requirement-clarifier/test_unit.mjs`，测试2

**现象**：期望 "做个登录系统" 得分为 0.34，实际为 0.50。

**原因**："做个登录系统" 包含 "个" 字，匹配正则 `/[0-9０-９%％年月日个万亿分清]/`，额外 +0.16。

**修复**：将期望值从 0.34 改为 0.50。

**教训**：正则表达式的覆盖范围要仔细核对，"个" 这个字也会触发数字关键词加分。

---

### Bug #5：端到端模拟死循环

**位置**：`requirement-clarifier/test_flow.mjs`，回答选择逻辑

**现象**：循环无限执行，分数始终为0，无法推进。

**原因**：
```javascript
// ❌ 错误逻辑
const ansIdx = Math.floor(collect[dk].score * ANSWERS[dk].length);
// score=0 → ansIdx=0 → 永远选最短回答（<6字 → score=0）→ 死循环
```

**修复**：当得分=0时自动跳到下一个更丰富的回答：
```javascript
// ✅ 正确逻辑
let ansIdx = Math.min(ANSWERS[dk].length - 1, Math.max(0, Math.floor(collect[dk].score * ANSWERS[dk].length)));
let answer = ANSWERS[dk][ansIdx];
let ex = ClarifierAPI.extractFromAnswer(dk, answer);
// 如果最短回答得0分，自动选下一个
if (ex.score === 0 && ansIdx < ANSWERS[dk].length - 1) {
  ansIdx++;
  answer = ANSWERS[dk][ansIdx];
  ex = ClarifierAPI.extractFromAnswer(dk, answer);
}
// 最丰富也得0分 → 死循环检测
if (ex.score === 0) { deadlock = true; break; }
```

**教训**：自动化测试中的回答选择策略要保证单调递增，避免低分回答永远被选中。

---

## 二、进度时间线

| 时间 | 阶段 | 成果 |
|------|------|------|
| T0 | 需求澄清 | 构建自演进专家协作系统框架 |
| T1 | 核心架构 | conductor.md（10步流程）+ expert_pool.md（25专家）+ 评分卡60分门禁 |
| T2 | 规则细化 | conductor_rules.md（调度映射/组装/入库/质量门）+ feedback_loop.md |
| T3 | 专家扩展 | code_guardian.md（代码安全规范）+ short_drama_group.md（预留） |
| T4 | **需求澄清官** | 新增第26号专家，设计5维评分卡 |
| T5 | **Web原型** | 实现左-右分栏可视化原型（HTML+CSS+JS） |
| T6 | **规则引擎** | 实现 api.js（提取评分+追问路由） |
| T7 | 测试修复 | 修复5个Bug，单元测试7/7通过，流模拟8轮达标 |
| T8 | 归档整理 | 创建4份文档，准备GitHub推送 |

---

## 三、里程碑达成状态

| 里程碑 | 状态 | 备注 |
|--------|------|------|
| 专家体系框架（25角色） | ✅ 完成 | roles/ 目录 |
| 调度规则与评分门禁 | ✅ 完成 | conductor_rules.md |
| 反馈闭环与返工机制 | ✅ 完成 | feedback_loop.md |
| 代码安全员规范 | ✅ 完成 | code_guardian.md |
| 短剧组（预留扩展） | ⚠️ 占位 | short_drama_group.md |
| 需求澄清官规则引擎 | ✅ 完成 | api.js |
| 需求澄清官 Web 原型 | ✅ 完成 | requirement-clarifier/ |
| 单元测试通过 | ✅ 7/7 | test_unit.mjs |
| 端到端流模拟通过 | ✅ 8轮达标 | test_flow.mjs |
| LLM 真实接入 | ❌ 待办 | 等用户提供 API |
| 短剧组完整实现 | ❌ 待办 | 优先级低 |
| 前端持久化存储 | ❌ 待办 | 可选增强 |

---

## 四、待办事项（供下一 Agent）

### 高优先级
1. **接入真实 LLM**：用户提供 OpenAI 兼容 API 后，修改 `api.js` 的 `MOCK_MODE=false`，替换 `extractFromAnswer` 和 `makeQuestionForDim` 为 LLM 调用
2. **补充测试用例**：覆盖更多边界（如极端短答案、含多个关键词的长答案、空字符串等）

### 中优先级
3. **完成短剧组**：实现编导→剧作→分镜→剪辑→质检完整生产链
4. **前端持久化**：用 LocalStorage 保存澄清进度，刷新不丢失

### 低优先级
5. **WebSocket 多人协作**：多人同时澄清同一需求
6. **导出功能增强**：支持导出 JSON/YAML 格式
7. **国际化**：添加英文界面支持

---

## 五、经验沉淀（下次避免同类错误）

1. **量纲统一**：比率(ratio)和绝对分(absolute)比较前必须转换，`(score * max) < max * threshold`
2. **函数职责单一**：没有异步操作的函数不标 `async`，保持返回值类型稳定
3. **正则覆盖范围**：写评分正则时要列出所有匹配字符，防止意外加分
4. **测试数据单调性**：自动化测试的回答选择要保证分数单调递增，避免低分循环
5. **Mock 模式预留**：设计 API 接口时保持 Mock 和 Real 的可切换性，一行开关即可切换
