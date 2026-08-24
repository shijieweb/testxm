# 纠错复盘：ASKB V1.0 六项未闭环修复验证

- **日期**：2026-08-22
- **复盘人**：director
- **状态**：已验证

## 问题描述

在 TDD 综合审查阶段识别出 6 项未闭环问题，逐一修复后需真实任务验证确认。

## 根因分析

6 项未闭环的本质原因不同，分两类：

**架构设计缺陷类**（#1 #4）：
- `knowledge/` 为空是 V1 架构设计漏洞：系统提供了 query 接口但没有任何初始化数据填充流程
- audit-log 无并发保护是因为 V1 假设单 Agent 运行，忽略了多 Agent 场景

**工程基础设施缺失类**（#2 #3 #5 #6）：
- 无 init-checklist 是因为开发时依赖人工记忆开局步骤
- bare except 是 Python 常见反模式，缺乏代码规范约束
- 无启停脚本是因为 V1 定位为开发工具，未考虑部署便利性
- 无 API 文档是因为协议简单到认为"代码即文档"

## 避免方案

1. **知识数据初始化**：V2 在 `/api/init` 时检测 knowledge/ 是否为空并给出提示
2. **并发安全**：所有共享写资源统一用 `threading.Lock` 保护
3. **开局检查清单**：强制在偏好记录.md 中维护 init-checklist 引用
4. **代码规范**：CI 中加 pylint/bandit 规则禁止 bare except
5. **基础设施先行**：新模块开发前必须先有启停脚本和 API 文档骨架

## 补救措施

修复后的验证结果：

| 测试维度 | 结果 |
|----------|------|
| TDD 全量测试 | 38 passed in 0.67s |
| E2E 真实任务验证 | 30/30 checks passed |
| knowledge/ 查询（无 role） | count=1（之前=0） |
| knowledge/ 查询（有 project） | count=1（跨项目搜索） |
| 经验提交 + audit-log | 写入成功 |
| 磁盘文件完整性 | 11/11 全部存在 |

## 经验沉淀

| 问题 | 原因 | 避免方案 | 补救措施 |
|------|------|----------|----------|
| knowledge/ 始终为空 | V1 无初始化数据填充 | init 时检测并提示；V2 预填充基础条目 | 补充 7 条知识条目 |
| audit-log 并发覆盖 | read+prepend 非原子 | 共享写资源统一加 Lock | 添加 threading.Lock |
| bare except 吞异常 | 未指定异常类型 | code review + bandit 规则 | 替换为 logging + 具体异常 |
| 无 init-checklist | 开局依赖人工记忆 | 强制读写偏好+进度文件 | 创建 config/init-checklist.md |
| 无启停脚本 | 忽略部署便利性 | 新模块先有脚本再有代码 | 创建 start_server.bat + stop_server.py |
| 无 API 文档 | "代码即文档"误区 | OpenAPI 规范先行 | 创建 docs/openapi.yaml |
