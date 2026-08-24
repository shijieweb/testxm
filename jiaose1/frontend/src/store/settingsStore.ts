import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GlobalSettings, PromptTemplate, TreeNode } from '../types'

const DEFAULT_PROMPTS: PromptTemplate[] = [
  {
    id: 'prompt-001',
    name: '项目描述优化',
    purpose: '优化用户输入的项目描述，生成结构化的目标用户、核心功能、关键场景',
    content: `你是一个产品架构师。请根据用户提供的项目信息，输出结构化的项目描述。

用户输入：
- 项目名称：{projectName}
- 项目简介：{description}
- 基础用户设想：{vision}

请按以下格式输出JSON：
{
  "targetUsers": ["目标用户1", "目标用户2"],
  "coreFunctions": ["核心功能1", "核心功能2"],
  "keyScenarios": ["关键场景1", "关键场景2"],
  "description": "优化后的项目简介（200字以内）"
}`,
    enabled: true,
  },
  {
    id: 'prompt-002',
    name: '故事扩展',
    purpose: '将用户故事从一句话扩展为完整的验收标准',
    content: `你是一个敏捷产品经理。请将以下用户故事扩展为完整的故事描述，包含背景、验收标准和边界条件。

用户故事：{story}

输出格式：
## 故事背景
[背景说明]

## 验收标准
- [ ] AC-001: [标准1]
- [ ] AC-002: [标准2]

## 边界条件
- [条件1]`,
    enabled: true,
  },
  {
    id: 'prompt-003',
    name: '开发文档生成',
    purpose: '根据需求生成技术实现文档',
    content: `你是一个技术架构师。请根据以下需求生成开发文档。

需求：{requirements}

输出格式：
## 技术方案
[技术选型及理由]

## 模块设计
[模块划分及职责]

## 接口定义
[API接口设计]

## 数据模型
[数据库表结构设计]`,
    enabled: true,
  },
  {
    id: 'prompt-004',
    name: '测试文档生成',
    purpose: '根据需求生成测试用例文档',
    content: `你是一个测试工程师。请根据以下需求生成测试用例文档。

需求：{requirements}

输出格式：
## 测试策略
[测试分层说明]

## 测试用例
| 用例ID | 场景 | 输入 | 预期输出 |
|--------|------|------|----------|
| TC-001 | [场景] | [输入] | [预期] |

## 覆盖率目标
[覆盖率要求]`,
    enabled: true,
  },
  {
    id: 'prompt-005',
    name: '验收文档生成',
    purpose: '生成项目验收标准文档',
    content: `你是一个质量保障工程师。请根据以下需求和实现生成验收文档。

需求：{requirements}
实现摘要：{implementation}

输出格式：
## 验收标准
### 功能验收
- [ ] [功能点1]
- [ ] [功能点2]

### 非功能验收
- [ ] [性能要求]
- [ ] [安全要求]

## 验收结果
[验收结论]`,
    enabled: true,
  },
  {
    id: 'prompt-006',
    name: '完整性检查',
    purpose: '检查需求与实现的完整性',
    content: `你是一个质量审核员。请检查以下需求与实现是否完整。

需求文档：{requirements}
实现文档：{implementation}

检查维度：
1. 功能完整性：所有需求功能是否已实现
2. 边界覆盖：边界条件和异常场景是否覆盖
3. 文档完整性：技术文档、测试文档是否齐全
4. 一致性：实现与设计是否一致

输出格式：
## 检查结果
### 完整性评估
- 功能完整度：[百分比]%
- 边界覆盖率：[百分比]%
- 文档完整度：[百分比]%

### 缺失项
[缺失的功能或文档]

### 建议
[改进建议]`,
    enabled: true,
  },
  {
    id: 'prompt-007',
    name: '架构初始化',
    purpose: '根据项目描述生成标准化的项目目录结构',
    content: `你是一个技术架构师。请根据以下项目描述生成标准化的项目目录结构。

项目描述：{description}
技术栈偏好：{techStack}

输出格式：
## 目录结构
\`\`\`
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
\`\`\`

## 技术栈配置
- 前端：[具体版本]
- 后端：[具体版本]
- 数据库：[具体版本]`,
    enabled: true,
  },
]

const DEFAULT_DIRECTORY_TREE: TreeNode[] = [
  {
    id: 'root',
    name: 'project-root/',
    children: [
      {
        id: 'frontend',
        name: 'frontend/',
        children: [
          {
            id: 'src',
            name: 'src/',
            children: [
              { id: 'components', name: 'components/' },
              { id: 'pages', name: 'pages/' },
              { id: 'lib', name: 'lib/' },
              { id: 'hooks', name: 'hooks/' },
              { id: 'store', name: 'store/' },
              { id: 'types', name: 'types/' },
              { id: 'app-tsx', name: 'App.tsx' },
              { id: 'main-tsx', name: 'main.tsx' },
            ],
          },
          { id: 'package-json', name: 'package.json' },
          { id: 'vite-config', name: 'vite.config.ts' },
          { id: 'tailwind-config', name: 'tailwind.config.js' },
          { id: 'tsconfig', name: 'tsconfig.json' },
          { id: 'index-html', name: 'index.html' },
        ],
      },
      {
        id: 'backend',
        name: 'backend/',
        children: [
          {
            id: 'app-dir',
            name: 'app/',
            children: [
              { id: 'api-dir', name: 'api/' },
              { id: 'core-dir', name: 'core/' },
              { id: 'models-dir', name: 'models/' },
              { id: 'schemas-dir', name: 'schemas/' },
              { id: 'services-dir', name: 'services/' },
              { id: 'main-py', name: 'main.py' },
            ],
          },
          { id: 'tests-dir', name: 'tests/' },
          { id: 'requirements-txt', name: 'requirements.txt' },
          { id: 'env-file', name: '.env' },
        ],
      },
      { id: 'gitignore', name: '.gitignore' },
      { id: 'readme', name: 'README.md' },
    ],
  },
]

const DEFAULT_SETTINGS: GlobalSettings = {
  aiModel: {
    apiUrl: '',
    apiKey: '',
    modelName: '',
  },
  defaultArchitecture: {
    frontend: 'React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Framer Motion + Zustand',
    backend: 'Python + FastAPI',
    database: 'SQLite',
    testing: '前端 Vitest，后端 pytest',
    deployment: '本地调试',
    directoryTree: DEFAULT_DIRECTORY_TREE,
  },
  prompts: DEFAULT_PROMPTS,
  aiBannerDismissed: false,
}

interface SettingsState extends GlobalSettings {
  setAiModel: (apiUrl: string, apiKey: string, modelName: string) => void
  saveSettings: (partial: Partial<GlobalSettings>) => void
  dismissAiBanner: () => void
  resetSettings: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setAiModel: (apiUrl: string, apiKey: string, modelName: string) =>
        set(() => ({
          aiModel: { apiUrl, apiKey, modelName },
        })),

      saveSettings: (partial: Partial<GlobalSettings>) =>
        set((state) => ({
          ...state,
          ...partial,
          aiModel: partial.aiModel ? partial.aiModel : state.aiModel,
          defaultArchitecture: partial.defaultArchitecture
            ? partial.defaultArchitecture
            : state.defaultArchitecture,
          prompts: partial.prompts ? partial.prompts : state.prompts,
        })),

      dismissAiBanner: () =>
        set(() => ({
          aiBannerDismissed: true,
        })),

      resetSettings: () =>
        set({
          ...DEFAULT_SETTINGS,
        }),
    }),
    {
      name: 'ai-requirements-platform-settings',
      version: 1,
    }
  )
)
