# 纠错复盘：pytest 多文件集成时 KB_ROOT 模块级污染

## 日期
2026-08-22

## 问题描述
在 `tests/test_shortdrama_knowledge.py` 单独运行时 15/15 通过，
但与 `tests/test_askb_server.py` 合并运行（`pytest tests/`）时 6 条搜索测试失败，
返回空结果（0 items）。

## 根因分析
`test_askb_server.py` 使用 `app_with_kb` fixture 将 `askb_server.KB_ROOT` 临时替换为
pytest tmp_path 创建的隔离目录，测试结束后恢复。但 Python 的 module import 缓存机制
导致：

1. 两个测试文件都 `import server as askb_server`
2. `test_askb_server.py` 的 fixture 修改了共享的 `askb_server.KB_ROOT`
3. 即使 fixture cleanup 恢复了 KB_ROOT，如果 pytest 执行顺序不确定或 cleanup 失败，
   `test_shortdrama_knowledge.py` 中调用的 `find_knowledge_files()` 仍可能使用
   错误的 KB_ROOT（指向临时目录）
4. 临时目录没有短剧 knowledge 文件 → 搜索返回空

## 修复方案
在每个调用 `find_knowledge_files` 的测试方法中显式调用 `_ensure_kb_root()`，
在函数入口处强制设置 `askb_server.KB_ROOT = KB_ROOT`（本地定义的绝对路径），
确保不因外部 fixture 状态而受影响。

同时在模块加载时做一次初始设置，作为第二道防线。

## 教训
1. **共享模块状态是集成测试的隐患**：多个测试文件共享同一个 `server` 模块对象，
   任何文件修改模块级变量都会影响其他文件
2. **pytest 执行顺序非确定性**：虽然 pytest 默认按文件名排序，但不能依赖
   外部 fixture 的 cleanup 总在自家测试前完成
3. **防御性编程**：每个测试应对自己的前提条件负责，不要假设全局状态
4. **TDD 必须集成运行**：单独测试通过不等于组合测试通过，必须定期 `pytest tests/`
   全量运行

## 修复文件
- `tests/test_shortdrama_knowledge.py`：添加 `_ensure_kb_root()` 辅助函数，
  在所有搜索测试中调用
