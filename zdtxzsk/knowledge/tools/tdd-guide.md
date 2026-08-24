---
title: TDD 开发规范
scope: tools
tags: [askb, tdd, testing, pytest]
verified: true
---

# TDD 开发规范

## 核心流程
**RED → GREEN → REFACTOR**

1. **RED**：先写失败的测试用例，描述期望行为
2. **GREEN**：写最少代码让测试通过
3. **REFACTOR**：清理重复代码，提升可读性（不改变行为）

## 规则
- 无测试不禁出代码
- 每个测试只验证一个行为（单断言优先）
- 测试之间完全隔离（每个测试用独立的临时目录）
- 测试失败时先分析是测试问题还是代码 bug
- 修复后更新纠错复盘

## pytest 约定
- 测试文件：`tests/test_*.py`
- Fixture 命名：`test_` 前缀不用，用描述性名称如 `temp_kb`, `app_with_kb`
- 运行命令：`python -m pytest tests/ -v`
- 覆盖率目标：核心函数 ≥ 80%

## 当前测试覆盖
- `TestHealth`：2 用例 — `/health` 端点
- `TestInit`：11 用例 — `/api/init` 完整流程
- `TestQuery`：6 用例 — `/api/knowledge/query` 搜索逻辑
- `TestReport`：9 用例 — `/api/report` 写入+审核日志
- `TestKnowledgeList`：4 用例 — `/api/knowledge/list` 枚举
- `TestFindKnowledgeFiles`：6 用例 — 核心搜索函数
