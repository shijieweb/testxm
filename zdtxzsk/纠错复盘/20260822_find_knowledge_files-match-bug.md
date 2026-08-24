# 纠错复盘：find_knowledge_files 搜索逻辑 Bug

- **日期**：2026-08-22
- **复盘人**：director
- **状态**：已验证

## 问题描述

TDD 测试中发现 `TestFindKnowledgeFiles::test_no_match_outside_200_chars` 失败：
在 `knowledge/common/other-name.md` 中写入 `"a"*250 + "隐藏关键词"`，搜索关键词"隐藏关键词"时应返回 0 结果，但实际返回 1。

## 根因分析

`server.py` 的 `find_knowledge_files()` 函数中，匹配逻辑设置了 `match = False/True`，但 `results.append(...)` 没有受 `if match:` 保护，导致**所有找到的 .md 文件无论是否匹配都追加到结果中**。

```python
# 错误代码（已修复前）
match = False
if query_lower in fpath.name.lower():
    match = True
elif query_text in content[:200]:
    match = True

# 尝试读取 YAML 元数据
...

results.append({...})  # ← 没有 if match: 保护！
```

## 避免方案

1. **TDD RED→GREEN 流程中，GREEN 阶段必须验证结果的语义正确性**，不能只看测试通过与否——要检查返回数据的准确性
2. 编写测试时应覆盖"不应返回"的否定场景（negative tests）
3. 代码审查时重点关注「设置标志变量但忘记使用」的模式

## 补救措施

修复 `server.py` 第 70 行附近，在 `results.append()` 前添加 `if match:` 条件保护：

```python
if match:
    results.append({
        'path': str(fpath.relative_to(KB_ROOT)),
        ...
    })
```

修复后重跑全量测试：**38 passed in 0.61s**。

## 经验沉淀

| 问题 | 原因 | 避免方案 | 补救措施 |
|------|------|----------|----------|
| find_knowledge_files 搜索不过滤 | results.append 未受 match 保护 | TDD 写 negative tests；code review 检查标志变量是否被消费 | 添加 if match: 包裹 append |
