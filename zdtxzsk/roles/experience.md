# Director 经验记录

> 格式：每次新增经验按以下模板追加

---

## 2026-08-22 reports/ 审核纠错复盘

- **场景**：人工审核 reports/ 迁移经验时，发现3个问题需要记录和预防
- **问题汇总**：

| 问题 | 原因 | 避免方案 | 补救措施 |
|------|------|----------|----------|
| audit-log.md 格式混乱 | server.py prepend 写入时未检查文件是否以 `# 审核日志` 开头，导致标题出现在文件中间 | 首次写入时检查 header，格式不对先重写再 prepend；或解析现有内容保持层级正确 | 手动重写 audit-log.md，分段整理提交记录和人工审核记录 |
| knowledge/ 目录始终为空 | V1 架构依赖人工迁移，但开发过程中从未执行过迁移步骤 | server.py 或迁移流程增加提示：query 不带 role 时若 knowledge/ 为空应在文档中标注；或 V1 预填充基础条目 | 本次将 ASKB 验证经验迁入 experience.md；V2 考虑将工具指南类经验迁入 knowledge/tools/ |
| V1 关键词检索命中率低 | 只匹配文件名+内容前200字符，深层内容（如职责详细描述）无法命中 | V2 升级全文检索或向量检索；V1 可在 YAML 元数据中增加 keywords 字段同时匹配 | 已在当前进度.md V2 规划中列出，暂无临时补救 |

- **结论**：reports/ → experience.md 的迁移流程需要在 server.py 层面增加自动化检查和提示，避免知识断层
- **验证次数**：1
- **状态**：已验证

---

## 2026-08-22 ASKB Skill 端到端集成验证

- **场景**：将 ASKB 接入 WorkBuddy Skill，验证 init→query→report 完整流程
- **问题**：V1 关键词检索仅匹配文件名和前200字符，查询"经验沉淀"时无命中；knowledge/ 目录为空（经验待人工迁移）
- **解决**：
  1. 创建 askb plugin（plugin.json + SKILL.md + 3 references + icon）
  2. 端到端测试 6 步全部通过：health→init(2074 chars)→query("短剧"=2条)→query("创意决策"=2条)→list(0条)→report(saved)
  3. 发现 knowledge/ 目录为空，V1 架构经验沉淀路径为 reports/ → 人工审核后迁入
- **关键经验**：
  - ASKB init 上下文加载完整：人格 + 角色 + 项目 + 偏好记录 + 当前进度，一次性注入 2074 字符
  - 关键词检索 V1 限制：只搜文件名+前200字，deep content 查询命中率低；query 不带 role 时只搜 knowledge/ 目录（当前为空）
  - strict 人格的自检规则在任务中自然生效，无需额外触发
- **决策**：reports/ 中简单确认类报告（如"KB搭建成功"）不迁移，保留作为里程碑日志；结构化经验报告才迁入 experience.md
- **结论**：ASKB Skill 可被 TRAE 插件系统识别，下次会话开局可自动调用 /api/init 加载角色上下文
- **验证次数**：1
- **状态**：已验证

---

## 2026-08-22 V1.0 最小闭环完整跑通

- **场景**：按优化方案执行五步，完成 ASKB V1.0 最小可用闭环
- **问题**：需确保三个接口全部可用且能返回正确数据
- **解决**：
  1. 创建10个目录，写入 config.yaml、3个人格文件、2个角色、2个项目
  2. 实现 server.py（Flask，4个路由 + 健康检查）
  3. 测试 /api/init 成功返回人格+角色+项目拼接上下文
  4. 测试 /api/knowledge/query 成功匹配到 director 相关文件（count=2）
  5. 测试 /api/report 成功保存经验报告到 reports/ 并写入 history/audit-log
  6. 额外验证 /health 和 /api/knowledge/list 两个补充接口
- **结论**：V1 最小闭环已跑通，服务器运行在 http://localhost:8765，后续可直接接入 WorkBuddy
- **验证次数**：1
- **状态**：已验证

---

## 2026-08-22 文档驱动 vs 代码驱动

- **场景**：分析 ASKB 文档时发现文档描述和实现存在 gap
- **问题**：文档定义了三个 HTTP 接口但没有后端，HTTP 服务本身不存在
- **解决**：用最小 Python Flask 代码填补这个 gap，3 个路由约 80 行代码
- **结论**：知识库文档应该包含"可运行的最小实现"而非只有设计
- **验证次数**：1
- **状态**：待验证

---

## 2026-08-22 ASKB 最小闭环搭建

- **场景**：老板要求搭建 Agent System Knowledge Base V1.0 的最小可用闭环
- **问题**：文档定义了 API 但没有实现方案，workspace 为空
- **解决**：
  1. 创建完整目录结构（10个目录）
  2. 编写 config.yaml、personas、roles、projects 文件
  3. 实现 Python Flask HTTP 服务器（8765 端口）
  4. 测试 /api/init 接口成功返回结构化上下文
  5. 写入本次经验记录
- **结论**：V1 最小闭环可以在 30 分钟内搭起来，关键是先跑通再完善
- **验证次数**：1
- **状态**：待验证

---
