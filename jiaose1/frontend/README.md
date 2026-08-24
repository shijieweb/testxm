# Frontend — React 18 + TypeScript 应用

## 快速启动

```bash
npm install
npm run dev
```

访问 `http://localhost:5173`。

## 页面路由

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | → `/settings` | 重定向到设置页 |
| `/settings` | SettingsPage | AI 模型配置、提示词模板管理 |
| `/projects/create` | CreateProjectPage | 创建项目，调用 AI 优化需求 |
| `/team` | TeamPage | 专家协作（4 Agent 全流程） |
| `/projects` | — | 故事列表（后续功能） |

## PRD Workshop 原型

独立静态页面，无需构建，直接浏览器打开：

```
frontend/src/pages/prd-interviewer/index.html
```

功能：
- 输入项目想法 → AI 评分 → 追问澄清 → 生成 PRD
- 左右分栏布局（左侧追问，右侧可视化评分）
- 预留 `AI_CONFIG` 接口，替换即可接入真实 LLM

## 测试

```bash
npx vitest run           # 运行所有测试
npx vitest run --coverage # 带覆盖率
```

预期结果：142/142 通过。

## 状态管理

使用 Zustand + persist 中间件，数据持久化到 localStorage：

- `store/projectsStore.ts` — 项目列表状态
- `store/settingsStore.ts` — AI 配置与提示词模板

## 构建

```bash
npm run build    # 生产构建 → dist/
npm run preview  # 预览生产构建
```
