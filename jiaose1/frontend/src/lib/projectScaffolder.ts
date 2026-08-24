import type { DefaultArchitecture, TreeNode } from '../types'

/**
 * 生成项目骨架文件内容
 */
export function generatePackageJson(): string {
  return JSON.stringify(
    {
      name: 'frontend',
      private: true,
      version: '0.0.1',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'tsc && vite build',
        preview: 'vite preview',
        test: 'vitest',
        'test:coverage': 'vitest run --coverage',
        lint: 'eslint .',
        'type-check': 'tsc --noEmit',
      },
      dependencies: {
        react: '^18.3.1',
        'react-dom': '^18.3.1',
        'react-router-dom': '^6.26.0',
        zustand: '^4.5.4',
        'framer-motion': '^11.3.19',
      },
      devDependencies: {
        '@types/react': '^18.3.3',
        '@types/react-dom': '^18.3.0',
        '@vitejs/plugin-react': '^4.3.1',
        typescript: '^5.5.3',
        vite: '^5.4.0',
        vitest: '^2.0.5',
        '@testing-library/react': '^16.0.0',
        '@testing-library/jest-dom': '^6.4.8',
        tailwindcss: '^3.4.10',
        postcss: '^8.4.41',
        autoprefixer: '^10.4.20',
      },
    },
    null,
    2
  )
}

export function generateRequirementsTxt(): string {
  return [
    'fastapi==0.112.0',
    'uvicorn[standard]==0.30.6',
    'sqlalchemy==2.0.32',
    'pydantic==2.8.2',
    'pydantic-settings==2.4.0',
    'python-dotenv==1.0.1',
    'pytest==8.3.2',
    'pytest-cov==5.0.0',
    'httpx==0.27.0',
  ].join('\n')
}

export function generateReadme(projectName: string, description: string): string {
  return `# ${projectName}

## 项目简介
${description || '暂无描述'}

## 技术栈
- **前端**: React 18 + TypeScript + Vite + Tailwind CSS
- **后端**: Python + FastAPI
- **数据库**: SQLite
- **测试**: 前端 Vitest，后端 pytest

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

## 启动方式

### 前端开发
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

### 后端开发
\`\`\`bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
\`\`\`

## TDD 规范
- 前端测试：Vitest + React Testing Library
- 后端测试：pytest
- 覆盖率目标：≥ 85%
`
}

/**
 * 将 TreeNode 数组转换为扁平目录树字符串（用于展示）
 */
export function renderDirectoryTree(tree: TreeNode[], prefix = '', _isLast = true, depth = 0): string {
  let result = ''
  tree.forEach((node, index) => {
    const isLastNode = index === tree.length - 1
    const connector = isLastNode ? '└── ' : '├── '
    result += prefix + connector + node.name + '\n'
    if (node.children && node.children.length > 0) {
      const newPrefix = prefix + (isLastNode ? '    ' : '│   ')
      result += renderDirectoryTree(node.children, newPrefix, isLastNode, depth + 1)
    }
  })
  return result
}

/**
 * 获取默认架构配置（用于快照）
 */
export function getDefaultArchitecture(): DefaultArchitecture {
  return {
    frontend: 'React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Framer Motion + Zustand',
    backend: 'Python + FastAPI',
    database: 'SQLite',
    testing: '前端 Vitest，后端 pytest',
    deployment: '本地调试',
    directoryTree: [
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
                  { id: 'app', name: 'App.tsx' },
                  { id: 'main', name: 'main.tsx' },
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
                  { id: 'api', name: 'api/' },
                  { id: 'core', name: 'core/' },
                  { id: 'models', name: 'models/' },
                  { id: 'schemas', name: 'schemas/' },
                  { id: 'services', name: 'services/' },
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
    ],
  }
}
