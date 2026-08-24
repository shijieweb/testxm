# Backend — FastAPI 多 Agent 协作引擎

## 快速启动

```bash
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

访问 `http://localhost:8000/docs` 查看 Swagger API 文档。

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `API_URL` | LLM API 地址 | `""`（必填） |
| `API_KEY` | LLM API Key | `""`（必填） |
| `MODEL_NAME` | 模型名称 | `gpt-4o-mini` |

可通过 `/api/team/workflows/execute` 请求体传入，或设置 `.env` 文件。

## API 路由

### 执行团队协作工作流

```
POST /api/team/workflows/execute
```

请求体：
```json
{
  "user_request": "帮我做一个电商平台",
  "project_name": "ShopX",
  "api_url": "https://api.openai.com/v1",
  "api_key": "sk-xxx",
  "model_name": "gpt-4o-mini",
  "max_clarification_rounds": 3,
  "max_bug_fix_rounds": 2
}
```

响应：
```json
{
  "task_id": "a1b2c3d4",
  "status": "needs_clarification | needs_bug_fix | completed | failed",
  "steps": [...],
  "clarification": { "questions": [...], "round": 1 },
  "bug_reflux": { "bugs": [...], "overall_quality": "needs_fix" },
  "final_output": { "prd": {...}, "architecture": {...}, ... },
  "round": 1
}
```

### 获取工作流角色列表

```
GET /api/team/workflows
```

返回 4 个 Agent 角色信息。

## 测试

```bash
python -m pytest -v
```

预期结果：75/75 通过。
