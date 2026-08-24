# AI 多 Agent 协作 PRD 生成系统

> 一个由 4 个 AI Agent 组成的协作系统，从用户需求到代码实现的全链路自动化。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.10+-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/react-18+-blue.svg)](https://react.dev)

---

## 项目简介

本系统模拟了一个软件开发团队的完整工作流：

```
用户输入
  ↓
👤 产品经理「许清楚」 — PRD Agent
  评分不足 → 追问循环（最多 3 轮）
  评分达标 → 输出结构化 PRD
  ↓
🏗️ 架构师「高见远」 — Architect Agent
  生成技术选型、目录结构、关键决策
  ↓
💻 工程师「寇豆码」 — Engineer Agent
  生成代码实现计划、API 定义、文件列表
  ↓
🔍 质检工程师「严过关」 — QA Agent
  审查代码质量 → 发现 Bug → 回溯修复循环（最多 2 轮）
  ↓
✅ 最终交付：PRD + 技术方案 + 实现计划 + 质量报告
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | FastAPI + Pydantic + httpx |
| 前端 | React 18 + TypeScript + Tailwind CSS + Zustand |
| 测试 | pytest + Vitest |
| LLM | OpenAI 兼容接口（默认 ollama，可切换） |

---

## 快速开始

### 后端启动

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
# 服务地址: http://localhost:8000
# API 文档: http://localhost:8000/docs
```

### 前端启动

```bash
cd frontend
npm install
npm run dev
# 服务地址: http://localhost:5173
```

### 运行测试

```bash
# 后端
cd backend && python -m pytest

# 前端
cd frontend && npx vitest run
```

---

## 目录结构

```
jiaose1/
├── backend/
│   ├── app/
│   │   ├── agents/          # 4 个 AI Agent
│   │   │   ├── base.py      # 基类：LLM 调用封装
│   │   │   ├── prd_agent.py # 产品经理
│   │   │   ├── architect_agent.py
│   │   │   ├── engineer_agent.py
│   │   │   └── qa_agent.py  # 质检工程师
│   │   ├── workflow/
│   │   │   └── engine.py    # DAG 流程引擎
│   │   ├── main.py          # FastAPI 路由
│   │   └── models.py        # Pydantic 数据模型
│   ├── tests/               # pytest 测试（75/75 通过）
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── TeamPage.tsx           # 专家协作页面
│   │   │   └── prd-interviewer/       # PRD Workshop 静态原型
│   │   ├── components/
│   │   ├── lib/                       # API 客户端
│   │   ├── store/                     # Zustand 状态管理
│   │   └── types/                     # TypeScript 类型定义
│   ├── tests/                         # Vitest 测试（142/142 通过）
│   └── package.json
│
├── docs/
│   ├── HANDOVER.md                    # 项目交接指南
│   ├── SESSION_SUMMARY.md             # 会话汇总报告
│   └── CAVEATS_AND_PROGRESS.md        # 踩坑经验与进度
│
└── .gitignore
```

---

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/team/workflows/execute` | 执行团队协作工作流 |
| GET | `/api/team/workflows` | 获取工作流角色列表 |
| POST | `/api/ai/optimize-project` | AI 优化项目描述 |
| POST | `/api/ai/test-connection` | 测试 AI 连接 |

---

## 配置 AI API

编辑 `backend/.env` 或传入环境变量：

```env
# .env.example
API_URL=https://api.openai.com/v1
API_KEY=sk-your-key-here
MODEL_NAME=gpt-4o-mini
```

或在 `frontend/src/pages/prd-interviewer/index.html` 中修改 `AI_CONFIG`：

```javascript
const AI_CONFIG = {
  endpoint: 'https://api.openai.com/v1/chat/completions',
  apiKey: 'YOUR_API_KEY_HERE',
  model: 'gpt-4o-mini',
};
```

---

## 测试覆盖

- 后端：75/75 通过
- 前端：142/142 通过
- 零回归

---

## 文档

- [HANDOVER.md](docs/HANDOVER.md) — 项目交接指南
- [SESSION_SUMMARY.md](docs/SESSION_SUMMARY.md) — 会话汇总报告
- [CAVEATS_AND_PROGRESS.md](docs/CAVEATS_AND_PROGRESS.md) — 踩坑经验与进度
