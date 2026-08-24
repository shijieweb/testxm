# PRD Workshop 项目交接指南

> 版本：v1.0  
> 生成日期：2026-08-24  
> 适用读者：下一个接手此项目的 Agent 或开发者

---

## 一、项目是什么

**PRD Workshop** 是一个「对话式需求澄清 + 自动评分 + PRD 生成」的静态网页原型。

它复刻了 `backend/app/agents/prd_agent.py` 中的核心逻辑：
- 用户输入一个项目想法
- 系统按 5 个维度打分（满分 100）
- 分数 < 80 时触发追问循环（最多 3 轮）
- 达到阈值后输出结构化 PRD

前端用纯 HTML/CSS/JS 单文件实现，零依赖，可直接用浏览器打开，也预留了真实 LLM API 接入点（`AI_CONFIG` 对象）。

---

## 二、目录结构

```
c:\Users\67972\Documents\test\code\
├── backend\                          # FastAPI 后端（原始引擎）
│   ├── app\
│   │   ├── agents\
│   │   │   ├── base.py               # BaseAgent：LLM 调用基类
│   │   │   ├── prd_agent.py          # PRD Agent：评分 + 追问逻辑
│   │   │   ├── architect_agent.py    # 架构师 Agent
│   │   │   ├── engineer_agent.py     # 工程师 Agent
│   │   │   └── qa_agent.py           # 质检 Agent
│   │   ├── workflow\
│   │   │   └── engine.py             # 多 Agent 协作流程引擎
│   │   ├── main.py                   # FastAPI 路由
│   │   └── models.py                 # Pydantic 数据模型
│   └── tests\
│       └── test_team_workflow.py     # 后端测试（75/75 通过）
│
├── frontend\                         # React 前端
│   ├── src\
│   │   ├── pages\
│   │   │   ├── prd-interviewer\
│   │   │   │   └── index.html        # ★ 核心：PRD 工坊单页原型（本次交付）
│   │   │   └── TeamPage.tsx          # 专家协作页面
│   │   ├── types\types.ts
│   │   ├── lib\teamApi.ts
│   │   └── components\layout\index.tsx
│   └── tests\                        # Vitest 前端测试（142/142 通过）
│
└── docs\                             # 本项目文档（本次新增）
    ├── HANDOVER.md                   # 本文件：交接指南
    └── SESSION_SUMMARY.md            # 会话汇总报告
```

---

## 三、关键技术栈

| 层 | 技术 |
|----|------|
| 后端 | FastAPI + Pydantic + httpx + ollama (可换 OpenAI 兼容) |
| 前端 | React 18 + TypeScript + Tailwind CSS + Vitest |
| 原型 | 纯 HTML5 + CSS3 + Vanilla JS（零依赖） |
| 测试 | pytest + vitest |

---

## 四、如何启动

### 4.1 启动原型（最简单）

直接用浏览器打开：
```
file:///c:/Users/67972/Documents/test/code/frontend/src/pages/prd-interviewer/index.html
```
无需服务器，无依赖，离线可用。

### 4.2 启动后端 API

```bash
cd c:\Users\67972\Documents\test\code\backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```
服务地址：`http://localhost:8000`

### 4.3 启动前端开发服务器

```bash
cd c:\Users\67972\Documents\test\code\frontend
npm install
npm run dev
```
服务地址：`http://localhost:5173`

---

## 五、核心逻辑说明

### 5.1 5 维评分（来自 prd_agent.py）

```
背景清晰度    (max: 15)   — 项目背景是否清晰
价值定义      (max: 20)   — 目标用户与价值主张是否明确
解决方案完整性 (max: 25)  — 功能方案是否完整
验收标准      (max: 25)   — 验收条件是否可量化
影响范围      (max: 15)   — 影响面和边界是否清晰
─────────────────────────────────────
总分          (max: 100)  — 阈值为 80
```

### 5.2 澄清循环

- 分数 ≥ 80 → 直接进入 PRD 生成
- 分数 < 80 → 生成追问列表（最多 3 题）
- 用户回答后重新评分，最多 3 轮
- 3 轮后强制提交当前状态

### 5.3 API 接入点（前端 index.html）

搜索代码中的 `AI_CONFIG` 对象，修改以下字段即可接入真实 API：

```javascript
const AI_CONFIG = {
  endpoint: 'https://api.openai.com/v1/chat/completions', // OpenAI 兼容接口
  apiKey: 'YOUR_API_KEY_HERE',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 2048,
};
```

---

## 六、下一步可以做什么

1. **接入真实 API**：在 `index.html` 中找到 `AI_CONFIG`，填入 OpenAI 兼容的 endpoint 和 key
2. **对接后端**：前端调用 `POST /api/team/workflows/execute` 替换 Mock 数据
3. **右侧可视化升级**：当前是评分环形图 + 维度进度条，可加入 mindmap 或功能模块树
4. **持久化**：添加 localStorage 或 IndexedDB 保存对话历史
5. **部署**：直接部署到 Vercel / Netlify（静态文件），后端部署到 Render / Railway

---

## 七、测试覆盖

- 后端：75/75 pytest 通过
- 前端：142/142 vitest 通过
- 原型：纯静态，无需测试框架，手动浏览器测试即可

---

*本文件是"下一个 Agent"的入口文档，读完即知项目全貌、如何启动、如何扩展。*
