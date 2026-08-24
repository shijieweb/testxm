# 踩坑经验与进度汇总

> 版本：v1.0  
> 生成日期：2026-08-24  
> 项目：AI 多 Agent 协作 PRD 生成系统

---

## 一、角色提示词（全部在内）

每个 Agent 的 `SYSTEM_PROMPT` 均定义在对应文件中，完整内容如下：

### 1. PRD Agent — 产品经理「许清楚」
**文件：** `backend/app/agents/prd_agent.py`

```
你是一位资深产品经理，代号"许清楚"。
你的职责是将用户的自然语言需求转化为结构化的产品需求文档（PRD）。

【工作流程】
1. 深入理解用户需求
2. 识别目标用户群体（至少3类）
3. 提炼核心功能（至少3个）
4. 描绘关键使用场景（至少3个）
5. 生成优化的项目简介（200字以内）
6. 按5维度自评，低于80分时列出需要用户澄清的问题

【评分维度】
- 背景清晰度（满分15）：需求背景是否清晰
- 价值定义（满分20）：收益和衡量指标是否明确
- 解决方案完整性（满分25）：方案描述是否详细
- 验收标准（满分25）：是否可测试、可验收
- 影响范围（满分15）：是否说明涉及改动范围

【输出格式】返回纯 JSON（不要 markdown 代码块）
```

### 2. Architect Agent — 架构师「高见远」
**文件：** `backend/app/agents/architect_agent.py`

```
你是一位资深技术架构师，代号"高见远"。
你的职责是根据 PRD 设计技术方案，选择技术栈，规划项目目录结构。

【输出格式】techStack / architecture / directoryTree / keyDecisions / risks
```

### 3. Engineer Agent — 工程师「寇豆码」
**文件：** `backend/app/agents/engineer_agent.py`

```
你是一位全栈开发工程师，代号"寇豆码"。
你的职责是根据技术方案批量实现代码，并做全局一致性审查。

【输出格式】files_generated / api_endpoints / consistency_check / summary
```

### 4. QA Agent — 质检工程师「严过关」
**文件：** `backend/app/agents/qa_agent.py`

```
你是一位资深 QA 工程师，代号"严过关"。
你的职责是对代码实现进行质量审查，找出 Bug、安全漏洞、性能问题。

【审查维度】功能正确性 / 安全性 / 性能 / 代码质量
【输出格式】bugs[] / overall_quality / summary
```

---

## 二、踩坑经验

### 坑1：Mock patch 顺序错误导致 httpx.ConnectError

**现象：** 运行 `test_full_execution_returns_completed` 时报 `httpx.ConnectError: [Errno 11001] getaddrinfo failed`，说明有 Agent 调用了真实的 LLM 接口。

**原因分析：**
Python 装饰器执行顺序是从内到外（先执行的写在最下面）。当用 `@patch.object(QAAgent, "_call_ai")` 时，QAAgent 在模块加载时已经通过 MRO（方法解析顺序）绑定了对应的方法引用，patch 时机不对，导致实际调用未被拦截。

**解决方案：**
```python
# 错误写法 — 子类 patch 不生效
@patch.object(QAAgent, "_call_ai")   # inner — 先执行，失效
@patch.object(EngineerAgent, "_call_ai")
@patch.object(ArchitectAgent, "_call_ai")
@patch.object(PRDAgent, "_call_ai")
def test_xxx(mock_prd, mock_arch, mock_eng, mock_qa): ...

# 正确写法 — 在 BaseAgent 层统一 patch，放在最外层（最后执行）
@patch.object(BaseAgent, "_call_ai")  # outer — 最后执行，覆盖所有子类
@patch.object(PRDAgent, "_call_ai")
@patch.object(ArchitectAgent, "_call_ai")
@patch.object(EngineerAgent, "_call_ai")
def test_xxx(mock_eng, mock_arch, mock_prd, mock_base): ...
```

**经验总结：** 当多个子类共享基类方法且基类方法被继承调用时，patch 基类比 patch 子类更可靠；装饰器顺序从下到上执行，最外层（最后声明）的 patch 最先生效。

---

### 坑2：BugRefuxRequest 字段缺失导致 AttributeError

**现象：** 测试 `test_bug_reflux_integration` 时报 `AttributeError: 'TeamExecutionResponse' object has no attribute 'bug_reflux'`。

**原因：** `models.py` 中的 `TeamExecutionResponse` 模型缺少 `bug_reflux` 字段，但 `engine.py` 返回的字典包含了该字段。Pydantic 默认模式下不会报错，但在某些情况下属性访问会失败。

**解决方案：**
在 `models.py` 中补充字段：
```python
class TeamExecutionResponse(BaseModel):
    ...
    bug_reflux: Optional[BugRefuxRequest] = None  # 新增
```

**经验总结：** 始终确保 Pydantic 模型与实际返回数据结构一致；添加新字段后同步更新所有相关模型。

---

### 坑3：WorkflowEngine 缺少 max_bug_fix_rounds 参数传递

**现象：** `execute_team_workflow` 路由调用 `build_default()` 时未传递 `max_bug_fix_rounds`，导致引擎使用的是默认值 1 而非用户传入的值。

**原因：** `engine.py` 的 `build_default` 方法签名更新了，但 `main.py` 的路由代码未同步更新。

**解决方案：**
```python
# main.py 更新
engine = WorkflowEngine.build_default(
    max_clarification_rounds=payload.max_clarification_rounds,
    max_bug_fix_rounds=payload.max_bug_fix_rounds,  # 新增
)
```

**经验总结：** 修改方法签名后，需全局搜索所有调用点并同步更新；使用 IDE 的"查找引用"功能避免遗漏。

---

### 坑4：前端组件引用路径问题

**现象：** 运行 `npm run build` 时报 `Module not found: Can't resolve './store/projectsStore'`。

**原因：** `App.tsx` 中引用了 `./store/projectsStore`，但该模块在 `frontend/src/store/` 目录下，import 路径应为 `../store/projectsStore`。

**解决方案：**
```typescript
// App.tsx 修正 import 路径
import { projectsStore } from '../store/projectsStore';
```

**经验总结：** 多层嵌套目录结构下，相对路径容易出错；建议使用绝对路径（如 `@/store/projectsStore`）配合 tsconfig 的 `baseUrl` 配置。

---

### 坑5：Git 仓库创建冲突

**现象：** 首次推送时报 `error: src refspec main does not match any`，以及 `fatal: Unable to create ... index.lock: File exists`。

**原因：**
1. 本地默认分支名为 `master`，但远端期望 `main`
2. 之前的 git 操作异常中断，留下 `.lock` 文件

**解决方案：**
```bash
git branch -M main
rm -f .git/index.lock
git push -u origin main
```

**经验总结：** 初始化 git 后立即检查默认分支名；异常中断后先清理 `.lock` 文件再重试。

---

## 三、进度汇总

### Phase 1：基础框架（已完成）
- [x] FastAPI 后端骨架
- [x] BaseAgent + PRDAgent 单 Agent
- [x] 5 维评分逻辑
- [x] 前端 PRD 工坊静态原型（待补全追问可视化）

### Phase 2：多 Agent 协作系统（已完成）
- [x] Architect Agent 实现
- [x] Engineer Agent 实现
- [x] QA Agent 实现（含 Bug 回溯逻辑）
- [x] WorkflowEngine 流程引擎
- [x] 澄清闭环（PRD → 追问 → 重评）
- [x] Bug 回溯闭环（QA → BugReport → 修复 → 重审）
- [x] 后端测试（75/75 通过）
- [x] 前端 TeamPage 页面
- [x] 前端测试（142/142 通过）

### Phase 3：PRD Workshop 升级（进行中）
- [x] 左右分栏布局
- [x] 动态追问状态机
- [x] 5 维评分可视化（环形图 + 进度条）
- [x] API 接入预留（AI_CONFIG 对象）
- [ ] 右侧思维导图可视化（待实现）
- [ ] 对接真实 LLM API（待用户提供 key）

### 测试覆盖
| 模块 | 总数 | 通过 | 状态 |
|------|------|------|------|
| backend tests | 75 | 75 | ✅ |
| frontend tests | 142 | 142 | ✅ |
| 端到端集成 | 0 | 0 | ⏳ 待补 |

---

## 四、待办事项

| 优先级 | 任务 | 负责人 | 状态 |
|--------|------|--------|------|
| P0 | 接入真实 LLM API | 用户 | 待办 |
| P1 | 右侧思维导图可视化 | Agent | 待办 |
| P1 | 对话历史持久化（localStorage） | Agent | 待办 |
| P2 | 端到端集成测试 | Agent | 待办 |
| P2 | Docker 部署 | Agent | 待办 |

---

*文档生成时间：2026-08-24*
