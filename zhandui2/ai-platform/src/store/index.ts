import { create } from 'zustand'

export interface AiModelConfig {
  apiUrl: string
  apiKey: string
  modelName: string
}

export interface PromptTemplate {
  id: string
  name: string
  purpose: string
  content: string
  enabled: boolean
}

export interface TreeNode {
  name: string
  type: 'folder' | 'file'
  children?: TreeNode[]
}

export interface Architecture {
  frontend: string
  backend: string
  database: string
  testing: string
  deployment: string
  directoryTree: TreeNode[]
}

export interface Project {
  id: string
  name: string
  description: string
  targetUsers: string[]
  coreFunctions: string[]
  keyScenarios: string[]
  createdAt: string
  architectureSnapshot: Architecture
}

interface AppState {
  // Settings
  aiModel: AiModelConfig
  prompts: PromptTemplate[]
  architecture: Architecture
  setAiModel: (config: AiModelConfig) => void
  updateAiModel: (partial: Partial<AiModelConfig>) => void
  testConnection: () => Promise<{ success: boolean; message: string }>

  // Projects
  projects: Project[]
  currentProject: Project | null
  setCurrentProject: (p: Project | null) => void
  addProject: (project: Project) => void
  deleteProject: (id: string) => void

  // UI State
  isDarkMode: boolean
  toggleDarkMode: () => void
}

const defaultArchitecture: Architecture = {
  frontend: 'React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Framer Motion + Zustand',
  backend: 'Python + FastAPI',
  database: 'SQLite（固定）',
  testing: '前端 Vitest，后端 pytest',
  deployment: '本地调试',
  directoryTree: [
    {
      name: 'frontend',
      type: 'folder',
      children: [
        { name: 'src', type: 'folder', children: [
          { name: 'components', type: 'folder' },
          { name: 'pages', type: 'folder' },
          { name: 'lib', type: 'folder' },
          { name: 'hooks', type: 'folder' },
          { name: 'store', type: 'folder' },
          { name: 'types', type: 'folder' },
          { name: 'App.tsx', type: 'file' },
          { name: 'main.tsx', type: 'file' },
        ]},
        { name: 'package.json', type: 'file' },
      ],
    },
    {
      name: 'backend',
      type: 'folder',
      children: [
        { name: 'app', type: 'folder', children: [
          { name: 'api', type: 'folder' },
          { name: 'core', type: 'folder' },
          { name: 'models', type: 'folder' },
          { name: 'schemas', type: 'folder' },
          { name: 'services', type: 'folder' },
          { name: 'main.py', type: 'file' },
        ]},
        { name: 'tests', type: 'folder' },
        { name: 'requirements.txt', type: 'file' },
      ],
    },
    { name: '.gitignore', type: 'file' },
    { name: 'README.md', type: 'file' },
  ],
}

const defaultPrompts: PromptTemplate[] = [
  {
    id: '1',
    name: '项目描述优化提示词',
    purpose: '创建项目时，根据用户填写的项目名称、简介、基础用户设想，优化生成更完整的项目介绍、目标用户、核心功能、关键场景。',
    content: `你是一个项目需求分析师。用户正在创建新项目，提供了项目名称、项目简介和基础用户设想。
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
3. 保持中文，除非用户使用英文。`,
    enabled: true,
  },
  {
    id: '2',
    name: '故事扩展提示词',
    purpose: '用户输入一句话需求，AI 扩展成完整用户故事（标题、角色、描述、验收标准）。',
    content: `你是需求分析师。用户输入了一句简单的需求描述，请将其扩展为一个完整的用户故事。

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
3. 保持中文。`,
    enabled: true,
  },
  {
    id: '3',
    name: '开发文档生成提示词',
    purpose: '根据完整故事生成开发文档，包含模块概述、接口定义、数据模型、TDD 测试用例、自测命令等。',
    content: `你是资深开发工程师。请根据提供的用户故事和项目上下文，生成一份详细的开发设计文档。

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
- 所有测试命令必须可执行。`,
    enabled: true,
  },
  {
    id: '4',
    name: '测试文档生成提示词',
    purpose: '根据故事和开发文档生成测试文档，包含测试范围、测试用例、预计通过标准等。',
    content: `你是测试工程师。请根据提供的用户故事和开发文档，生成一份详细的测试文档。

文档必须包含以下章节：
1. 测试范围
2. 测试环境
3. 测试用例清单（每个用例包含：编号、前置条件、步骤、输入数据、预期结果）
4. 预计通过标准
5. 测试数据准备说明

要求：
- 测试用例必须覆盖正常流程和异常流程。
- 信息不足时，不得编造，必须列出缺失项并给出补充建议。
- 输出为 Markdown 格式。`,
    enabled: true,
  },
  {
    id: '5',
    name: '验收文档生成提示词',
    purpose: '根据故事和测试文档生成验收文档，包含验收标准清单、验收步骤、通过准则等。',
    content: `你是产品验收负责人。请根据提供的用户故事和测试文档，生成一份验收文档。

文档必须包含以下章节：
1. 验收标准清单（逐条列出，可勾选）
2. 验收步骤（用户如何验证功能）
3. 验收环境要求
4. 通过准则

要求：
- 验收标准必须与用户故事的验收标准一致。
- 信息不足时，不得编造，必须列出缺失项并给出补充建议。
- 输出为 Markdown 格式。`,
    enabled: true,
  },
  {
    id: '6',
    name: '完整性检查提示词',
    purpose: '生成文档前，检查故事信息是否完整，如果不完整，列出缺失项和补充建议。',
    content: `你是需求完整性检查员。在生成文档之前，请检查提供的用户故事信息是否完整。

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
- 不得因为信息不足而强行通过检查。`,
    enabled: true,
  },
  {
    id: '7',
    name: '架构初始化提示词',
    purpose: '创建项目后，根据默认架构生成完整的项目骨架文件内容。',
    content: `你是项目架构初始化助手。根据以下默认技术栈和目录结构，为项目 {project_name} 生成完整的项目骨架文件内容。
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
4. 不生成任何业务代码，只生成基础骨架和配置。`,
    enabled: true,
  },
]

export const useStore = create<AppState>((set, get) => ({
  aiModel: { apiUrl: '', apiKey: '', modelName: '' },
  prompts: defaultPrompts,
  architecture: defaultArchitecture,
  projects: [],
  currentProject: null,
  isDarkMode: false,

  setAiModel: (config) => set({ aiModel: config }),

  updateAiModel: (partial) =>
    set((state) => ({
      aiModel: { ...state.aiModel, ...partial },
    })),

  testConnection: async () => {
    const { aiModel } = get()
    if (!aiModel.apiUrl || !aiModel.apiKey || !aiModel.modelName) {
      return { success: false, message: '请先填写完整的 API 配置' }
    }
    // Simulated test - in real app would call the API
    await new Promise((r) => setTimeout(r, 800))
    return { success: true, message: '连接成功' }
  },

  setCurrentProject: (project) => set({ currentProject: project }),

  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),

  deleteProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    })),

  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
}))
