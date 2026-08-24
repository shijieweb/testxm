---
title: ASKB HTTP API 使用指南
scope: tools
tags: [askb, api, http]
verified: true
---

# ASKB HTTP API 使用指南

## 基础信息
- 服务地址：`http://localhost:8765`
- 协议：REST over HTTP
- 数据格式：JSON（请求/响应）
- 字符编码：UTF-8

## 接口列表

| 接口 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/api/init` | POST | 初始化 Agent 上下文 |
| `/api/knowledge/query` | POST | 查询知识 |
| `/api/knowledge/list` | GET | 枚举所有知识 |
| `/api/report` | POST | 提交经验报告 |

## 调用示例（Python）

```python
import urllib.request, json

BASE = 'http://localhost:8765'

# 健康检查
resp = urllib.request.urlopen(f'{BASE}/health').read()
print(json.loads(resp))

# 初始化
data = json.dumps({'agent': 'workbuddy', 'persona': 'strict', 'role': 'director'}).encode()
req = urllib.request.Request(f'{BASE}/api/init', data=data, headers={'Content-Type': 'application/json'})
resp = urllib.request.urlopen(req).read()
print(json.loads(resp)['context'])

# 查询
data = json.dumps({'query': 'TDD', 'role': 'director'}).encode()
req = urllib.request.Request(f'{BASE}/api/knowledge/query', data=data, headers={'Content-Type': 'application/json'})
resp = urllib.request.urlopen(req).read()
print(json.loads(resp))

# 提交经验
data = json.dumps({'agent': 'workbuddy', 'role': 'director', 'content': '修复了搜索 bug'}).encode()
req = urllib.request.Request(f'{BASE}/api/report', data=data, headers={'Content-Type': 'application/json'})
resp = urllib.request.urlopen(req).read()
print(json.loads(resp))
```

## 调用示例（curl）

```bash
# 健康检查
curl http://localhost:8765/health

# 初始化
curl -X POST http://localhost:8765/api/init \
  -H "Content-Type: application/json" \
  -d '{"agent":"workbuddy","persona":"strict","role":"director"}'

# 查询
curl -X POST http://localhost:8765/api/knowledge/query \
  -H "Content-Type: application/json" \
  -d '{"query":"TDD","role":"director"}'

# 提交经验
curl -X POST http://localhost:8765/api/report \
  -H "Content-Type: application/json" \
  -d '{"agent":"workbuddy","role":"director","content":"发现了新的最佳实践"}'
```
