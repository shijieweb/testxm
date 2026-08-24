import { describe, it, expect } from 'vitest'
import {
  generatePackageJson,
  generateRequirementsTxt,
  generateReadme,
  renderDirectoryTree,
  getDefaultArchitecture,
} from '../../src/lib/projectScaffolder'
import type { TreeNode } from '../../src/types'

describe('projectScaffolder', () => {
  describe('generatePackageJson', () => {
    it('returns valid JSON string', () => {
      const result = generatePackageJson()
      const parsed = JSON.parse(result)
      expect(parsed.name).toBe('frontend')
      expect(parsed.dependencies.react).toBeDefined()
      expect(parsed.devDependencies.vitest).toBeDefined()
    })
  })

  describe('generateRequirementsTxt', () => {
    it('contains fastapi and uvicorn', () => {
      const result = generateRequirementsTxt()
      expect(result).toContain('fastapi')
      expect(result).toContain('uvicorn')
    })
  })

  describe('generateReadme', () => {
    it('includes project name and description', () => {
      const result = generateReadme('MyProject', 'A test project')
      expect(result).toContain('MyProject')
      expect(result).toContain('A test project')
    })

    it('uses fallback text when description is empty', () => {
      const result = generateReadme('EmptyProject', '')
      expect(result).toContain('EmptyProject')
      expect(result).toContain('暂无描述')
    })
  })

  describe('renderDirectoryTree', () => {
    it('renders tree as string', () => {
      const tree: TreeNode[] = [
        {
          id: 'root',
          name: 'project-root/',
          children: [
            { id: 'f1', name: 'frontend/', children: [] },
            { id: 'b1', name: 'backend/', children: [] },
          ],
        },
      ]
      const result = renderDirectoryTree(tree)
      expect(result).toContain('project-root/')
      expect(result).toContain('frontend/')
      expect(result).toContain('backend/')
    })

    it('uses correct connectors for last vs non-last siblings', () => {
      const tree: TreeNode[] = [
        {
          id: 'root',
          name: 'root/',
          children: [
            { id: 'a', name: 'a/', children: [] },
            { id: 'b', name: 'b/', children: [] },
          ],
        },
      ]
      const result = renderDirectoryTree(tree)
      expect(result).toContain('├── a/')
      expect(result).toContain('└── b/')
    })

    it('recursively renders nested children with proper indentation', () => {
      const tree: TreeNode[] = [
        {
          id: 'root',
          name: 'root/',
          children: [
            {
              id: 'src',
              name: 'src/',
              children: [
                { id: 'comp', name: 'components/', children: [] },
                { id: 'pages', name: 'pages/', children: [] },
              ],
            },
          ],
        },
      ]
      const result = renderDirectoryTree(tree)
      expect(result).toContain('src/')
      expect(result).toContain('├── components/')
      expect(result).toContain('└── pages/')
    })
  })

  describe('getDefaultArchitecture', () => {
    it('returns DefaultArchitecture with directory tree', () => {
      const arch = getDefaultArchitecture()
      expect(arch.frontend).toContain('React')
      expect(arch.backend).toContain('FastAPI')
      expect(arch.directoryTree.length).toBeGreaterThan(0)
    })

    it('returns all required fields', () => {
      const arch = getDefaultArchitecture()
      expect(arch.frontend).toBeDefined()
      expect(arch.backend).toBeDefined()
      expect(arch.database).toBeDefined()
      expect(arch.testing).toBeDefined()
      expect(arch.deployment).toBeDefined()
      expect(arch.directoryTree).toBeDefined()
    })
  })
})
