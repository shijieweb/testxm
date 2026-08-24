# 纠错复盘：server.py 多处 bare except 吞异常 + audit-log 无并发保护

- **日期**：2026-08-22
- **复盘人**：director
- **状态**：已验证

## 问题描述

TDD 综合审查中发现 server.py 存在两类问题：
1. 多处 `except:` 裸捕获，吞掉所有异常（包括 KeyboardInterrupt、SystemExit），且无日志输出
2. `/api/report` 写入 audit-log.md 无并发保护，多 Agent 同时提交时会互相覆盖

## 根因分析

- bare except 在 Python 中捕获 BaseException，会吞掉系统级异常
- audit-log 的 read+prepend 操作非原子，并发时两个请求可能读到相同内容后各自写入，导致后写入的覆盖先写入的
- 代码审查时只关注了功能正确性，忽略了错误可观测性和并发安全

## 避免方案

1. 所有 except 必须指定异常类型（except Exception as e:），并记录日志
2. 共享写资源（audit-log、reports）使用 threading.Lock 保护
3. TDD 阶段补充并发测试（多线程同时调用 /api/report）

## 补救措施

1. 引入 logging 模块，配置 INFO 级别日志
2. 添加 `_get_lock()` / `_release_lock()` 工具函数，用 dict 管理 per-resource 锁
3. report() 中 audit-log 读写包裹在 lock 内
4. 所有 bare except 替换为具体异常类型 + logger.warning/error
5. config.yaml 增加 server 段配置 lock_timeout / max_context_chars / log_level
6. 创建 start_server.bat / stop_server.py 启停脚本
7. 创建 docs/openapi.yaml API 文档

修复后全量测试：**38 passed in 0.48s**，零回归。

## 经验沉淀

| 问题 | 原因 | 避免方案 | 补救措施 |
|------|------|----------|----------|
| bare except 吞异常 | 未指定异常类型 | 强制 except Exception as e + 日志 | 全面替换为具体异常+logger |
| audit-log 并发覆盖 | read+prepend 非原子操作 | 共享写资源加 threading.Lock | 添加 _get_lock/_release_lock |
| 无启停脚本 | V1 手动 python server.py | 提供 .bat/.py 快捷脚本 | 创建 start_server.bat + stop_server.py |
| 无 API 文档 | 协议仅靠代码理解 | OpenAPI 规范先行 | 创建 docs/openapi.yaml |
