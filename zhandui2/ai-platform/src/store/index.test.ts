import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useStore } from '../store'

describe('useStore', () => {
  beforeEach(() => {
    useStore.setState({
      aiModel: { apiUrl: '', apiKey: '', modelName: '' },
      isDarkMode: false,
      projects: [],
      currentProject: null,
    })
  })

  afterEach(() => {
    // Restore real timers after each test
    vi.restoreAllMocks()
  })

  describe('aiModel', () => {
    it('should have empty aiModel by default', () => {
      const { aiModel } = useStore.getState()
      expect(aiModel.apiUrl).toBe('')
      expect(aiModel.apiKey).toBe('')
      expect(aiModel.modelName).toBe('')
    })

    it('setAiModel should replace the entire config', () => {
      const { setAiModel } = useStore.getState()
      setAiModel({ apiUrl: 'https://api.test.com', apiKey: 'sk-test', modelName: 'gpt-4o' })
      const { aiModel } = useStore.getState()
      expect(aiModel.apiUrl).toBe('https://api.test.com')
      expect(aiModel.apiKey).toBe('sk-test')
      expect(aiModel.modelName).toBe('gpt-4o')
    })

    it('updateAiModel should partially update', () => {
      const { setAiModel, updateAiModel } = useStore.getState()
      setAiModel({ apiUrl: 'https://api.test.com', apiKey: 'sk-test', modelName: 'gpt-4o' })
      updateAiModel({ modelName: 'gpt-4o-mini' })
      const { aiModel } = useStore.getState()
      expect(aiModel.apiUrl).toBe('https://api.test.com')
      expect(aiModel.apiKey).toBe('sk-test')
      expect(aiModel.modelName).toBe('gpt-4o-mini')
    })
  })

  describe('testConnection', () => {
    it('should return success when all fields are filled', async () => {
      const { setAiModel, testConnection } = useStore.getState()
      setAiModel({ apiUrl: 'https://api.test.com', apiKey: 'sk-test', modelName: 'gpt-4o' })
      const result = await testConnection()
      expect(result.success).toBe(true)
      expect(result.message).toBe('连接成功')
    })

    it('should return failure when apiUrl is missing', async () => {
      const { setAiModel, testConnection } = useStore.getState()
      setAiModel({ apiUrl: '', apiKey: 'sk-test', modelName: 'gpt-4o' })
      const result = await testConnection()
      expect(result.success).toBe(false)
    })

    it('should return failure when apiKey is missing', async () => {
      const { setAiModel, testConnection } = useStore.getState()
      setAiModel({ apiUrl: 'https://api.test.com', apiKey: '', modelName: 'gpt-4o' })
      const result = await testConnection()
      expect(result.success).toBe(false)
    })

    it('should return failure when modelName is missing', async () => {
      const { setAiModel, testConnection } = useStore.getState()
      setAiModel({ apiUrl: 'https://api.test.com', apiKey: 'sk-test', modelName: '' })
      const result = await testConnection()
      expect(result.success).toBe(false)
    })
  })

  describe('dark mode', () => {
    it('should start in light mode', () => {
      expect(useStore.getState().isDarkMode).toBe(false)
    })

    it('toggleDarkMode should switch from false to true', () => {
      const { toggleDarkMode } = useStore.getState()
      toggleDarkMode()
      expect(useStore.getState().isDarkMode).toBe(true)
    })

    it('toggleDarkMode should switch from true to false', () => {
      const { toggleDarkMode } = useStore.getState()
      toggleDarkMode()
      toggleDarkMode()
      expect(useStore.getState().isDarkMode).toBe(false)
    })
  })

  describe('projects', () => {
    it('should have no projects by default', () => {
      expect(useStore.getState().projects).toEqual([])
    })

    it('addProject should add a new project', () => {
      const { addProject } = useStore.getState()
      addProject({
        id: '1', name: 'Test Project', description: 'A test',
        targetUsers: [], coreFunctions: [], keyScenarios: [],
        createdAt: '2026-01-01T00:00:00Z',
        architectureSnapshot: useStore.getState().architecture,
      })
      expect(useStore.getState().projects).toHaveLength(1)
      expect(useStore.getState().projects[0].name).toBe('Test Project')
    })

    it('deleteProject should remove a project by id', () => {
      const { addProject, deleteProject } = useStore.getState()
      addProject({
        id: '1', name: 'Project A', description: 'A',
        targetUsers: [], coreFunctions: [], keyScenarios: [],
        createdAt: '2026-01-01T00:00:00Z',
        architectureSnapshot: useStore.getState().architecture,
      })
      addProject({
        id: '2', name: 'Project B', description: 'B',
        targetUsers: [], coreFunctions: [], keyScenarios: [],
        createdAt: '2026-01-01T00:00:00Z',
        architectureSnapshot: useStore.getState().architecture,
      })
      deleteProject('1')
      expect(useStore.getState().projects).toHaveLength(1)
      expect(useStore.getState().projects[0].id).toBe('2')
    })

    it('setCurrentProject should set the current project', () => {
      const { setCurrentProject } = useStore.getState()
      setCurrentProject({
        id: '1', name: 'Current', description: '',
        targetUsers: [], coreFunctions: [], keyScenarios: [],
        createdAt: '2026-01-01T00:00:00Z',
        architectureSnapshot: useStore.getState().architecture,
      })
      expect(useStore.getState().currentProject).toBeTruthy()
      expect(useStore.getState().currentProject!.name).toBe('Current')
    })

    it('setCurrentProject(null) should clear the current project', () => {
      const { setCurrentProject } = useStore.getState()
      setCurrentProject(null)
      expect(useStore.getState().currentProject).toBeNull()
    })
  })

  describe('prompts', () => {
    it('should have 7 default prompt templates', () => {
      const { prompts } = useStore.getState()
      expect(prompts).toHaveLength(7)
    })

    it('each prompt should have required fields', () => {
      const { prompts } = useStore.getState()
      prompts.forEach((p) => {
        expect(p.id).toBeDefined()
        expect(p.name).toBeTruthy()
        expect(p.purpose).toBeTruthy()
        expect(p.content).toBeTruthy()
        expect(typeof p.enabled).toBe('boolean')
      })
    })

    it('prompt with id 1 should be the project description optimizer', () => {
      const { prompts } = useStore.getState()
      const p = prompts.find((pr) => pr.id === '1')
      expect(p).toBeDefined()
      expect(p!.name).toContain('项目描述优化')
    })
  })

  describe('architecture', () => {
    it('should have a default architecture with all tech layers', () => {
      const { architecture } = useStore.getState()
      expect(architecture.frontend).toBeTruthy()
      expect(architecture.backend).toBeTruthy()
      expect(architecture.database).toBeTruthy()
      expect(architecture.testing).toBeTruthy()
      expect(architecture.deployment).toBeTruthy()
      expect(architecture.directoryTree.length).toBeGreaterThan(0)
    })
  })
})
