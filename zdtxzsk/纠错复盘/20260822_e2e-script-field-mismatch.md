# 纠错复盘：e2e_full_process.py 与 server API 字段名不一致

## 日期
2026-08-22

## 问题描述
`tests/e2e_full_process.py` 作为本地 HTTP 全流程验证脚本，首次运行时 34/40 通过，
6 项失败集中在 API 响应字段名不匹配和 persona 文件缺失。

## 根因分析

| 失败项 | 原因 |
|--------|------|
| `has entries (entries=0)` | `/api/knowledge/list` 返回 `items` 而非 `entries` |
| `report已写入 (saved=)` | `/api/report` 返回 `path`/`filename`，无 `saved` 字段 |
| `audit已记录` | `/api/report` 无 `audit_logged` 字段（审计是副作用，不返回） |
| `最新记录含 WorkBuddy` | 审计日志用原始 agent 名小写存储（`workbuddy`），脚本查找大写 |
| `config/personas/director.md size=0` | 文件不存在（创建 KB 时遗漏了 director persona） |
| `report 文件存在 (found=0)` | glob 模式 `*director*20260822*.md` 要求 director 在日期前，实际文件名日期在前 |

## 修复方案
1. 修正测试脚本中的字段名：`entries` → `items`，`saved` → `path`
2. 移除不存在的 `audit_logged` 断言，改为检查审计日志文件内容
3. 修正大小写匹配：`WorkBuddy` → `workbuddy`（不区分大小写）
4. 补建 `config/personas/director.md`（参考 strict.md 格式）
5. 修正 glob 顺序：`*director*20260822*.md` → `*20260822*director*.md`

## 最终结果
40/40 PASS，涵盖 Health Check、Agent Init、多关键词查询、知识列表、
新知识创建+搜索验证、经验报告提交、审计日志、磁盘完整性、TDD 全量测试。

## 教训
1. **API 契约要文档化**：每个端点的请求/响应字段应在 openapi.yaml 中明确，
   测试脚本据此编写，避免字段名猜测
2. **跨测试文件共享模块状态**：pytest 执行顺序不确定时，每个测试文件应
   独立设置自己的前提条件（如 KB_ROOT）
3. **真实任务驱动测试发现隐藏缺陷**：e2e 脚本通过真实 HTTP 调用发现了
   单元测试覆盖不到的集成问题（如字段名、文件大小为 0 的文件）
