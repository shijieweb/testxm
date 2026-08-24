# 部署指南

## 本地开发

### 后端

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

## 生产部署

### 后端（Docker）

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/app ./app
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
docker build -t prd-platform .
docker run -p 8000:8000 -e API_KEY=your-key prd-platform
```

### 前端（Vercel / Netlify）

```bash
npm run build
# 将 dist/ 目录部署到任意静态主机
```

或直接在 `vercel.json` 配置代理到后端：

```json
{
  "rewrites": [{ "source": "/api/(.*)", "destination": "http://your-backend:8000/api/$1" }]
}
```

## CI/CD

### GitHub Actions（示例）

```yaml
name: Test
on: [push]
jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - run: cd backend && pip install -r requirements.txt
      - run: cd backend && python -m pytest -v
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd frontend && npm install
      - run: cd frontend && npx vitest run
```

## 环境变量清单

| 变量 | 位置 | 说明 |
|------|------|------|
| `API_URL` | backend `.env` 或请求体 | LLM API 地址 |
| `API_KEY` | backend `.env` 或请求体 | LLM API Key |
| `MODEL_NAME` | backend `.env` 或请求体 | 模型名称，默认 `gpt-4o-mini` |
