# TASK-001: 大规模浏览器自动化操控方案设计

> 派发日期：2026-08-15
> 派发人：秘书
> 任务类型：技术选型/方案设计
> 军师调用次数：第10次（触发meta-audit）

---

## 任务背景

老板需要一个方案：让AI Agent能完美操控本地浏览器（复用登录态/cookies/已装插件），执行大量操作步骤（可能几十步），同时不占用主对话上下文。

### 核心矛盾

1. **操控本地浏览器**：需要连接用户正在使用的Chrome，复用已登录会话
2. **几十步操作**：单次子代理调用无法承载（子代理上下文也会爆）
3. **不占主上下文**：主对话只收结果，不收中间过程

### 老板已确认的约束

- 必须操控本地浏览器（不是云浏览器）
- 步数可能几十步（30-50+）
- 主对话上下文不能被浏览器操作占据
- 需要真实可用，不是理论方案

---

## 秘书调研结果（供军师参考）

### 基础方案：Playwright MCP + Browser Extension

Playwright MCP提供3种连接本地浏览器的方式：
- Extension模式（`--extension`）：连接现有Chrome标签页，复用登录态/cookies/插件 [$TRAE_REF](https://playwright.dev/mcp/configuration/browser-extension)
- CDP channel模式（`--cdp-endpoint=chrome`）：Chrome 136+原生支持，在`chrome://inspect/#remote-debugging`开启
- CDP端口模式（`--cdp-endpoint=http://localhost:9222`）：传统方式

### 上下文优化：Snapshot模式

Playwright MCP默认用accessibility snapshot而非截图 [$TRAE_REF](https://playwright.dev/docs/getting-started-mcp)：
- 一次snapshot约几百token（截图+视觉分析要几千token）
- Agent用ref（如`e5`）操作元素，不需要理解整个DOM

### 几十步场景的核心挑战

**问题**：50步 × ~500token/snapshot = 25,000 token，单个子代理上下文也会爆。

**已知解决方案**（调研发现）：

1. **检查点+断点续传**（Browser Workflow Agent模式）：
   - 每5步自动保存checkpoint.json（当前URL/已提取数据/已完成操作）
   - 崩溃后重启从最后检查点恢复
   - 参考：Browser Workflow Agent，支持30-50+步 [$TRAE_REF](https://github.com/HumbleBee14/Browser_Use_Agent)

2. **历史压缩**（ReSum模式）：
   - 每10步用快速模型（如Haiku）压缩旧历史为FOUND/GAPS/NEXT结构
   - 成本<$0.001/次压缩
   - 动态历史窗口：5-25条近期操作，基于重要性评分

3. **分阶段编排**（Orchestrator模式）：
   - 把50步拆成5-10个阶段，每个阶段一个子代理调用
   - 阶段间保存浏览器状态（storageState）+ 进度数据
   - 主对话只做阶段调度，不接触浏览器操作细节

4. **批量操作**（playwright-mcp-multistep）：
   - 单次MCP调用执行多个浏览器操作
   - 减少API调用次数和token消耗

5. **状态持久化**（Playwright MCP原生）：
   - `browser_save_state`：保存cookies+localStorage+sessionStorage到文件
   - `browser_load_state`：从文件恢复状态
   - 持久化profile模式：登录态自动在会话间保留 [$TRAE_REF](https://playwright.dev/mcp/configuration/user-profile)

6. **错误恢复**（三级升级）：
   - L1（3步停滞）：温和提示换方法
   - L2（5步停滞）：强制要求改变策略+检查点
   - L3（8步停滞）：强制结束+尽力输出

7. **进度可见性**：
   - 每个阶段完成后子代理返回结构化进度（已完成步骤数/剩余步骤数/当前状态）
   - 主对话通过进度判断是否继续/调整/中止

---

## 军师任务

### 分析要求

请军师用角度库审视这个方案，重点回答：

1. **方案完整性**：上述7个已知解决方案是否覆盖了所有关键问题？有没有遗漏的风险点？
2. **架构设计**：分阶段编排（方案3）的具体架构应该怎么设计？阶段间如何传递状态？
3. **可行性评估**：在TRAE环境（sandbox）中，哪些方案可直接落地？哪些需要适配？
4. **风险识别**：几十步操作中可能出现的失败模式有哪些？对应的检测和恢复策略？

### 产出要求

- 产出一份完整的技术方案文档
- 包含架构图（文字描述即可）
- 包含具体配置和代码示例
- 包含风险评估和缓解策略

### 验证标准

- 方案能覆盖30-50+步操作场景
- 主对话上下文消耗控制在每次阶段调度<500 token
- 浏览器状态能在阶段间正确传递
- 有明确的错误恢复路径

---

## 角度库审视清单

军师执行时请用以下角度审视（秘书前置覆盖检查）：

- ANGLE-005（信息完整性）：调研结果是否遗漏了关键方案？
- ANGLE-017（语义一致性）：各方案之间是否有冲突？
- ANGLE-019（可逆性）：浏览器状态回滚机制是否完善？
- ANGLE-022（错误转检测项）：已知失败模式能否转化为DET？

---

## 秘书自审记录（闭环1）

- 日期：2026-08-15
- 场景：派发浏览器自动化方案设计任务给军师
- 使用的角度编号：ANGLE-005, ANGLE-017, ANGLE-019, ANGLE-022
- ANGLE-005问题：调研结果是否覆盖所有关键方案？回答：覆盖了连接/上下文/大规模/状态/错误恢复5个维度，未发现遗漏。结论：通过
- ANGLE-017问题：各方案之间是否有冲突？回答：Extension模式与CDP模式互斥（选其一），分阶段编排与批量操作可组合。结论：通过
- ANGLE-019问题：浏览器状态回滚机制是否完善？回答：storageState save/load + checkpoint提供了两层回滚。结论：通过
- ANGLE-022问题：已知失败模式能否转化为DET？回答：停滞检测/状态丢失/步骤超预算3类可转DET。结论：通过，留给军师在方案中细化

## 覆盖检查记录（闭环2）

- 当前角度库24个角度中，与本任务相关的领域标签：browser/automation/architecture
- 已有角度覆盖情况：ANGLE-005（信息完整性）/ANGLE-017（语义一致性）/ANGLE-019（可逆性）/ANGLE-022（错误转检测项）均覆盖
- 缺口检测：可能缺"大规模操作的状态管理"相关角度，但需军师判断是否值得新增
- 结论：现有角度覆盖充分，暂不提案新角度
