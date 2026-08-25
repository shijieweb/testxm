```markdown
# AI驱动需求管理与研发协作平台（第一版）前端设计方案

## 1. 总体说明

本平台采用 **AI 主导、开箱即用、最小化落地** 原则。用户首次使用只需配置一个 AI 模型，其余全部使用默认架构和内置提示词。创建项目时，AI 自动优化用户输入，并展示默认架构目录，创建后自动初始化项目结构。

### 1.1 核心原则
- 单一数据源：提示词、架构目录只在全局设置中定义一次，其他页面引用模板名称，不重复书写内容。
- 全流程闭环：从配置 AI 模型 → 创建项目 → 自动初始化架构 → 进入故事列表，每一步都有明确数据来源和触发逻辑。
- 移动端优先，桌面端自适应。
- 界面美观，具备合理动效。

### 1.2 本次设计范围
- 设置页面（全局配置中心）
- 创建项目页面
- 项目架构初始化标准（目录结构、技术栈配置、README模板、初始化提示词）

后续功能（创建故事、生成文档等）暂不在本设计文档内，但提示词模板已提前定义，确保后续开发可无缝衔接。

---

## 2. 设置页面（全局配置中心）

设置页面是全局配置中心，所有项目默认继承。页面包含三个区域：AI 模型配置、默认架构技术栈、提示词模板。其中只有 AI 模型配置可编辑，其余只读展示。

### 2.1 页面布局

**移动端**
- 顶部标题栏：标题“设置”
- 内容区卡片流：
  1. AI 模型配置卡片（可编辑）
  2. 默认架构技术栈卡片（只读）
  3. 提示词模板卡片（只读）
- 背景灰白，卡片间距 16px

**桌面端**
- 左侧固定侧栏：显示“设置”导航项，当前高亮
- 右侧工作区：内容最大宽度 900px，卡片单列或两列网格

### 2.2 AI 模型配置（可编辑）

字段：
- API 地址（输入框）
- API Key（密码框，可切换显示）
- 模型名称（输入框，例如 `gpt-4o`、`deepseek-chat`）

交互：
- 点击“测试连接”：发送一个极简请求到模型，验证连通性，显示“连接成功/失败”
- 点击“保存配置”：保存到全局配置，后续所有 AI 功能使用该模型
- 若未配置，其他页面使用 AI 功能时提示“请先配置 AI 模型”

### 2.3 默认架构技术栈（只读展示）

展示以下信息，让用户清楚默认架构：

| 层 | 默认值 |
|----|--------|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Framer Motion + Zustand |
| 后端 | Python + FastAPI |
| 数据库 | SQLite（固定） |
| 测试 | 前端 Vitest，后端 pytest |
| 部署 | 本地调试 |

**目录结构**（树形只读，可展开/折叠）
```
project-root/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── lib/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   ├── tests/
│   └── requirements.txt
└── README.md
```

### 2.4 提示词模板（只读展示，直接列出完整内容）

每个模板卡片包含：模板名称、用途、完整提示词内容。以下为全部模板定义，后续所有 AI 功能均引用这些模板名称。

#### 模板 1：项目描述优化提示词

**用途**：创建项目时，根据用户填写的项目名称、简介、基础用户设想，优化生成更完整的项目介绍、目标用户、核心功能、关键场景。

**完整内容**：
```
你是一个项目需求分析师。用户正在创建新项目，提供了项目名称、项目简介和基础用户设想。
请基于这些信息，生成一份更完整、更专业的项目介绍和功能设想，帮助用户明确项目目标、目标用户、核心功能和关键场景。

输出格式为 JSON：
{
  "project_description": "项目完整介绍，2-4句话",
  "target_users": ["目标用户角色1", "目标用户角色2"],
  "core_functions": ["核心功能1", "核心功能2", "核心功能3"],
  "key_scenarios": ["关键使用场景1", "关键使用场景2"]
}

要求：
1. 如果用户输入信息不足，不要编造，可以基于常见模式合理推断，但尽量贴合用户描述。
2. 输出要具体、可操作，避免空泛描述。
3. 保持中文，除非用户使用英文。
```

#### 模板 2：故事扩展提示词

**用途**：用户输入一句话需求，AI 扩展成完整用户故事（标题、角色、描述、验收标准）。

**完整内容**：
```
你是需求分析师。用户输入了一句简单的需求描述，请将其扩展为一个完整的用户故事。

输出格式为 JSON：
{
  "title": "故事标题",
  "role": "目标用户角色",
  "description": "详细需求描述，2-4句话",
  "acceptance_criteria": ["验收标准1", "验收标准2", "验收标准3"],
  "priority": "高/中/低"
}

要求：
1. 如果用户描述过于模糊，请基于常见场景合理推断，但不要偏离原意。
2. 验收标准必须具体、可验证。
3. 保持中文。
```

#### 模板 3：开发文档生成提示词

**用途**：根据完整故事生成开发文档，包含模块概述、接口定义、数据模型、TDD 测试用例、自测命令等。

**完整内容**：
```
你是资深开发工程师。请根据提供的用户故事和项目上下文，生成一份详细的开发设计文档。

文档必须包含以下章节：
1. 模块概述与职责边界
2. 技术方案与目录结构
3. 接口定义（每个接口必须包含：方法、路径、请求参数、响应结构、异常码、校验规则、业务规则）
4. 数据模型定义
5. TDD 测试用例（每个接口至少包含：正常用例、异常用例，包含测试命令和预计通过标准）
6. 开发步骤（严格按 TDD 顺序：先写测试 → 运行失败 → 实现 → 运行通过）

要求：
- 信息不足时，不得编造，必须列出缺失项并给出补充建议。
- 输出为 Markdown 格式。
- 所有测试命令必须可执行。
```

#### 模板 4：测试文档生成提示词

**用途**：根据故事和开发文档生成测试文档，包含测试范围、测试用例、预计通过标准等。

**完整内容**：
```
你是测试工程师。请根据提供的用户故事和开发文档，生成一份详细的测试文档。

文档必须包含以下章节：
1. 测试范围
2. 测试环境
3. 测试用例清单（每个用例包含：编号、前置条件、步骤、输入数据、预期结果）
4. 预计通过标准
5. 测试数据准备说明

要求：
- 测试用例必须覆盖正常流程和异常流程。
- 信息不足时，不得编造，必须列出缺失项并给出补充建议。
- 输出为 Markdown 格式。
```

#### 模板 5：验收文档生成提示词

**用途**：根据故事和测试文档生成验收文档，包含验收标准清单、验收步骤、通过准则等。

**完整内容**：
```
你是产品验收负责人。请根据提供的用户故事和测试文档，生成一份验收文档。

文档必须包含以下章节：
1. 验收标准清单（逐条列出，可勾选）
2. 验收步骤（用户如何验证功能）
3. 验收环境要求
4. 通过准则

要求：
- 验收标准必须与用户故事的验收标准一致。
- 信息不足时，不得编造，必须列出缺失项并给出补充建议。
- 输出为 Markdown 格式。
```

#### 模板 6：完整性检查提示词

**用途**：生成文档前，检查故事信息是否完整，如果不完整，列出缺失项和补充建议。

**完整内容**：
```
你是需求完整性检查员。在生成文档之前，请检查提供的用户故事信息是否完整。

检查项：
- 标题是否明确
- 角色是否清晰
- 描述是否足够详细
- 验收标准是否可验证
- 必要上下文（如模块、技术约束）是否具备

输出格式为 JSON：
{
  "is_complete": true/false,
  "missing_items": ["缺失项1", "缺失项2"],
  "suggestions": ["建议补充1", "建议补充2"]
}

要求：
- 如果信息不足，必须明确列出缺失项和具体建议。
- 不得因为信息不足而强行通过检查。
```

#### 模板 7：架构初始化提示词

**用途**：创建项目后，根据默认架构生成完整的项目骨架文件内容。

**完整内容**：
```
你是项目架构初始化助手。根据以下默认技术栈和目录结构，为项目 {project_name} 生成完整的项目骨架文件内容。
默认技术栈：
- 前端：React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Framer Motion + Zustand
- 后端：Python + FastAPI + SQLAlchemy
- 数据库：SQLite
- 测试：前端 Vitest，后端 pytest
- 部署：本地调试

必须生成的文件：
- frontend/ 目录及其所有子目录和基础文件
- backend/ 目录及其所有子目录和基础文件
- README.md 使用标准模板，填写项目名称和简介
- .gitignore

要求：
1. 所有配置文件必须与标准技术栈匹配。
2. README 必须包含技术栈、目录结构、启动方式、测试命令、TDD 规范。
3. 目录结构必须与默认架构完全一致。
4. 不生成任何业务代码，只生成基础骨架和配置。
```

---

## 3. 创建项目页面

创建项目页面是用户录入初始项目信息的入口。表单包含项目名称、项目简介、基础用户设想，并提供“AI 优化”按钮，让 AI 根据粗略描述完善项目介绍和功能描述。

### 3.1 页面布局

**移动端**
- 顶部标题栏：标题“创建项目”，左侧返回按钮
- 内容区单列卡片流：
  1. 项目名称（输入框）
  2. 项目简介（多行文本）
  3. 基础用户设想（多行文本）
  4. “AI 优化”按钮（主按钮，可一键完善）
- 底部固定操作栏：主按钮“创建项目”，次按钮“取消”

**桌面端**
- 顶部标题栏：同样包含返回
- 内容区：卡片居中，宽度 600px，表单单列

### 3.2 表单字段

| 字段 | 必填 | 说明 |
|------|------|------|
| 项目名称 | 是 | 单行输入框 |
| 项目简介 | 否 | 多行文本，可 AI 优化覆盖 |
| 基础用户设想 | 否 | 多行文本，描述目标用户、核心功能、使用场景等 |

### 3.3 AI 优化区域

- 按钮：“AI 优化项目描述”
- 调用模板：**项目描述优化提示词**（引用设置中的模板名称，不重复写内容）
- 优化结果展示：目标用户、核心功能、关键场景标签列表，可编辑删除
- 项目简介自动填充优化后的 `project_description`

### 3.4 默认架构目录展示

- 只读树形目录，数据直接来自**全局默认架构设置**，不单独重复定义。
- 提示：“该项目将使用全局默认架构，无需手动配置。”

### 3.5 创建项目流程

1. 用户填写项目名称（必填）和可选描述。
2. 点击“AI 优化项目描述”，系统读取设置中的“项目描述优化提示词”模板，传入用户输入，调用 AI。
3. AI 返回结果，自动填充项目简介和标签列表，用户可编辑。
4. 用户确认后点击“创建项目”。
5. 系统创建项目，并自动生成项目快照：项目信息 + 全局默认架构目录（引用设置中的目录结构）。
6. 跳转到该项目的故事列表页（后续功能）。

### 3.6 数据存储（前端 Mock）

项目对象结构：
```ts
interface Project {
  id: string;
  name: string;
  description: string;
  targetUsers: string[];
  coreFunctions: string[];
  keyScenarios: string[];
  createdAt: string;
  architecture: {
    frontend: string;
    backend: string;
    database: string;
    testing: string;
    deployment: string;
    directoryTree: TreeNode[];
  };
}
```

---

## 4. 项目架构初始化标准

### 4.1 初始化时机与触发

- **触发时机**：用户创建项目并点击“创建项目”后，系统自动调用内置 AI，基于默认架构模板生成完整的项目骨架。
- **初始化内容**：项目根目录、前端工程、后端工程、测试目录、基础配置文件、README 文档。
- **数据来源**：默认架构技术栈（设置页只读展示的内容）和内置提示词模板。

### 4.2 初始化目录结构（标准骨架）

```
project-root/
├── frontend/                          # 前端工程
│   ├── src/
│   │   ├── components/                # 通用组件
│   │   ├── pages/                     # 页面组件
│   │   ├── lib/                       # 工具函数、API 客户端
│   │   ├── hooks/                     # 自定义 Hooks
│   │   ├── store/                     # Zustand 全局状态
│   │   ├── types/                     # TypeScript 类型定义
│   │   ├── App.tsx                    # 根组件
│   │   └── main.tsx                   # 入口文件
│   ├── package.json                   # 前端依赖和脚本
│   ├── vite.config.ts                 # Vite 配置
│   ├── tailwind.config.js             # Tailwind 配置
│   ├── tsconfig.json                  # TypeScript 配置
│   └── index.html                     # HTML 入口
├── backend/                           # 后端工程
│   ├── app/
│   │   ├── api/                       # 路由和接口
│   │   ├── core/                      # 核心配置（安全、依赖等）
│   │   ├── models/                    # SQLAlchemy 模型
│   │   ├── schemas/                   # Pydantic 模型
│   │   ├── services/                  # 业务逻辑层
│   │   └── main.py                    # FastAPI 入口
│   ├── tests/                         # 后端测试目录
│   ├── requirements.txt               # Python 依赖
│   └── .env                           # 环境变量（数据库路径等）
├── .gitignore                         # Git 忽略文件
└── README.md                          # 项目说明文档
```

### 4.3 各目录与文件用途说明

| 路径 | 用途 |
|------|------|
| `frontend/src/components/` | 存放可复用 UI 组件 |
| `frontend/src/pages/` | 存放页面级组件，与路由对应 |
| `frontend/src/lib/` | 存放工具函数、API 请求封装、mock 数据 |
| `frontend/src/hooks/` | 自定义 React Hooks |
| `frontend/src/store/` | Zustand 全局状态管理 |
| `frontend/src/types/` | TypeScript 类型定义 |
| `frontend/package.json` | 前端依赖和启动/测试脚本 |
| `frontend/vite.config.ts` | Vite 构建配置，含路径别名 `@/` 指向 `src` |
| `frontend/tailwind.config.js` | Tailwind CSS 配置 |
| `backend/app/api/` | 存放 FastAPI 路由文件，按模块划分 |
| `backend/app/core/` | 配置、安全、依赖注入等 |
| `backend/app/models/` | SQLAlchemy 数据库模型 |
| `backend/app/schemas/` | Pydantic 请求/响应模型 |
| `backend/app/services/` | 业务逻辑层 |
| `backend/app/main.py` | FastAPI 应用入口，挂载路由和 Swagger |
| `backend/tests/` | pytest 测试文件 |
| `backend/requirements.txt` | Python 依赖清单 |
| `backend/.env` | 本地环境变量，如 `DATABASE_URL=sqlite:///./app.db` |
| `README.md` | 项目说明，包含技术栈、启动方式、测试命令等 |

### 4.4 技术栈配置文件标准内容

#### 4.4.1 前端 `package.json`（核心依赖）

```json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint .",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "zustand": "^4.5.4",
    "framer-motion": "^11.3.19",
    "@shadcn/ui": "^0.1.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.3",
    "vite": "^5.4.0",
    "vitest": "^2.0.5",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.4.8",
    "tailwindcss": "^3.4.10",
    "postcss": "^8.4.41",
    "autoprefixer": "^10.4.20",
    "eslint": "^8.57.0",
    "eslint-plugin-react-hooks": "^4.6.2",
    "@typescript-eslint/eslint-plugin": "^7.18.0",
    "@typescript-eslint/parser": "^7.18.0"
  }
}
```

#### 4.4.2 后端 `requirements.txt`

```
fastapi==0.112.0
uvicorn[standard]==0.30.6
sqlalchemy==2.0.32
pydantic==2.8.2
pydantic-settings==2.4.0
python-dotenv==1.0.1
pytest==8.3.2
pytest-cov==5.0.0
httpx==0.27.0
```

### 4.5 README 标准模板

每个初始化项目必须自动生成如下 README 内容，说明技术栈、目录结构、启动方式和 TDD 规范。

```markdown
# {项目名称}

## 项目简介
{项目简介，由 AI 优化生成}

## 技术栈
- 前端：React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Framer Motion + Zustand
- 后端：Python + FastAPI + SQLAlchemy
- 数据库：SQLite
- 测试：前端 Vitest + React Testing Library；后端 pytest + httpx
- 部署：本地调试

## 目录结构
{自动生成目录树}

## 环境要求
- Node.js ≥ 18
- Python ≥ 3.10

## 启动方式

### 前端
```bash
cd frontend
npm install
npm run dev
```
访问 http://localhost:5173

### 后端
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
访问 http://localhost:8000/docs 查看 API 文档。

## 测试命令

### 前端
```bash
cd frontend
npm test
```

### 后端
```bash
cd backend
pytest
```

## TDD 开发规范
本项目严格遵循 TDD（测试驱动开发）流程：
1. 先编写测试用例，运行测试，确认测试失败（红灯）。
2. 编写最小实现代码，运行测试，确认测试通过（绿灯）。
3. 重构代码，保持测试通过。
4. 所有接口和组件必须有对应测试，核心业务代码覆盖率不低于 80%。

## 默认架构说明
- 前端采用移动端优先设计，桌面端自适应。
- 后端提供 RESTful API，自动生成 Swagger 文档。
- 数据库默认使用 SQLite 文件，路径为 `backend/app.db`，可通过环境变量 `DATABASE_URL` 修改。
- 代码目录固定，请勿随意修改结构，以保持 AI 生成代码的一致性。
```

### 4.6 架构初始化流程步骤

1. 用户创建项目，填写项目名称和可选描述，点击“创建项目”。
2. 系统创建项目记录，并调用内置 AI，使用“项目初始化模板”生成项目骨架。
3. AI 按默认架构生成完整的目录结构、配置文件、README 内容。
4. 系统将生成的文件打包存入项目存储中（第一版不存储实际代码文件，仅记录架构快照和生成文件列表；实际代码由开发 Agent 后续从 Git 仓库拉取时根据架构快照创建）。
5. 项目创建成功，跳转到故事列表页，同时项目架构初始化完成。
6. 用户可在项目详情中查看架构目录和 README 内容。

---

## 5. 数据模型与引用关系

### 5.1 全局设置数据

```ts
interface GlobalSettings {
  aiModel: {
    apiUrl: string;
    apiKey: string;
    modelName: string;
  };
  defaultArchitecture: {
    frontend: string;
    backend: string;
    database: string;
    testing: string;
    deployment: string;
    directoryTree: TreeNode[];
  };
  prompts: PromptTemplate[];
}
```

### 5.2 提示词模板数据结构

```ts
interface PromptTemplate {
  id: string;
  name: string;
  purpose: string;
  content: string;
  enabled: boolean;
}
```

### 5.3 项目数据结构

```ts
interface Project {
  id: string;
  name: string;
  description: string;
  targetUsers: string[];
  coreFunctions: string[];
  keyScenarios: string[];
  createdAt: string;
  architectureSnapshot: GlobalSettings['defaultArchitecture'];
}
```

---

## 6. UI/UX 规范

### 6.1 移动端（默认）
- 页面容器：单列卡片流，间距 16px，背景色 `bg-gray-50`
- 顶部标题栏：`sticky top-0 z-10`，高度 56px，左侧菜单按钮，中间标题，右侧进度/操作图标
- 底部操作栏：`fixed bottom-0`，高度 64px，包含“保存”“下一步”等按钮，按钮宽度自适应
- 卡片：白底圆角 `rounded-2xl shadow-sm p-4`，卡片间间距 12px
- 表单字段：标签在上方，输入框高度 ≥44px，错误提示红色小字

### 6.2 桌面端
- 布局：左侧固定侧栏 240px，右侧工作区自适应
- 侧栏：显示所有阶段，与移动端抽屉内容一致
- 工作区：内容最大宽度 1200px，居中，卡片可多列网格
- 底部操作栏：改在内容区顶部或右侧，不固定在底部

### 6.3 组件风格
- 按钮：使用 shadcn/ui Button，主按钮 `default`，次按钮 `outline`，危险按钮 `destructive`
- 卡片：使用 Card 组件，卡片标题用 `text-base font-semibold`
- 标签：使用 Badge 组件，状态标签颜色：待开发 `gray`，开发中 `blue`，待测试 `yellow`，测试通过 `green`，重新开发 `red`
- 动效：页面切换用 `AnimatePresence` 淡入淡出，卡片悬停 `hover:shadow-md hover:scale-[1.01]`，按钮点击 `active:scale-95`

---

## 7. 闭环检查清单

- [x] 设置页配置 AI 模型 → 创建项目页使用该模型进行 AI 优化
- [x] 创建项目页展示并应用默认架构目录
- [x] 创建项目后自动初始化项目架构（骨架、配置、README）
- [x] 架构初始化提示词已在设置页定义，创建项目时引用
- [x] 所有提示词模板内容唯一，在设置页集中管理
- [x] 创建项目流程结束进入故事列表页（后续功能，但此处已打通跳转逻辑）
- [x] 无重复定义，无未打通环节

---
