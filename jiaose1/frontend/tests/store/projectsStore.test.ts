import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useProjectsStore } from '../../src/store/projectsStore'
import { useSettingsStore } from '../../src/store/settingsStore'

function resetStores() {
  useProjectsStore.persist.clearStorage()
  useSettingsStore.persist.clearStorage()
  useProjectsStore.setState({ projects: [] })
  useSettingsStore.setState(useSettingsStore.getState())
}

describe('projectsStore', () => {
  beforeEach(() => {
    resetStores()
    vi.restoreAllMocks()
  })

  it('TC-002-01: initial project list is empty', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) })
    const projects = await useProjectsStore.getState().getProjects()
    expect(projects).toEqual([])
  })

  it('TC-002-02: createProject creates a project with required fields', async () => {
    const mockProject = {
      id: 'proj-1',
      name: 'Test Project',
      description: '',
      targetUsers: [],
      coreFunctions: [],
      keyScenarios: [],
      createdAt: '2026-01-01T00:00:00Z',
    }
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockProject),
    })

    const project = await useProjectsStore.getState().createProject({ name: 'Test Project' })
    expect(project.id).toBe('proj-1')
    expect(project.name).toBe('Test Project')
    expect(project.createdAt).toBeDefined()
    expect(typeof project.createdAt).toBe('string')
  })

  it('TC-002-03: createProject with full input stores all fields', async () => {
    const mockProject = {
      id: 'proj-2',
      name: 'Full Project',
      description: 'A full description',
      targetUsers: ['users'],
      coreFunctions: ['func1'],
      keyScenarios: ['scenario1'],
      createdAt: '2026-01-01T00:00:00Z',
    }
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockProject),
    })

    const project = await useProjectsStore.getState().createProject({
      name: 'Full Project',
      description: 'A full description',
      vision: 'Big vision',
      targetUsers: ['users'],
      coreFunctions: ['func1'],
      keyScenarios: ['scenario1'],
    })
    expect(project.description).toBe('A full description')
    expect(project.targetUsers).toEqual(['users'])
    expect(project.coreFunctions).toEqual(['func1'])
    expect(project.keyScenarios).toEqual(['scenario1'])
  })

  it('TC-002-04: getProjects calls API and populates store', async () => {
    const mockProjects = [
      { id: 'p1', name: 'Project A', description: '', targetUsers: [], coreFunctions: [], keyScenarios: [], createdAt: '2026-01-01T00:00:00Z' },
      { id: 'p2', name: 'Project B', description: '', targetUsers: [], coreFunctions: [], keyScenarios: [], createdAt: '2026-01-01T00:00:00Z' },
    ]
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockProjects),
    })

    const projects = await useProjectsStore.getState().getProjects()
    expect(projects).toEqual(mockProjects)
    expect(projects.length).toBe(2)
  })

  it('TC-002-05: multiple creates generate unique IDs from API', async () => {
    const createMock = (id: string) => vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id, name: `Project ${id}`, description: '', targetUsers: [], coreFunctions: [], keyScenarios: [], createdAt: '2026-01-01T00:00:00Z' }),
    })
    global.fetch = createMock('uuid-1')
    const p1 = await useProjectsStore.getState().createProject({ name: 'Project 1' })
    global.fetch = createMock('uuid-2')
    const p2 = await useProjectsStore.getState().createProject({ name: 'Project 2' })
    expect(p1.id).not.toBe(p2.id)
  })

  it('TC-002-06: deleteProject calls DELETE API', async () => {
    const mockProject = { id: 'del-1', name: 'ToDelete', description: '', targetUsers: [], coreFunctions: [], keyScenarios: [], createdAt: '2026-01-01T00:00:00Z' }
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([mockProject]) })  // getProjects
      .mockResolvedValueOnce({ ok: true, status: 204 })  // delete

    await useProjectsStore.getState().getProjects()
    await useProjectsStore.getState().deleteProject('del-1')

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/projects/del-1',
      expect.objectContaining({ method: 'DELETE' })
    )
    const remaining = await useProjectsStore.getState().getProjects()
    expect(remaining).toEqual([])
  })

  it('TC-002-07: getProjects returns empty when API fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
    })

    const projects = await useProjectsStore.getState().getProjects()
    expect(projects).toEqual([])
    expect(useProjectsStore.getState().error).toContain('获取项目列表失败')
  })

  it('TC-002-08: createProject throws on API failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    })

    await expect(
      useProjectsStore.getState().createProject({ name: 'Fail Project' })
    ).rejects.toThrow('创建项目失败')
  })
})
