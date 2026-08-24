import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  fetchProjects,
  createProjectAPI,
  deleteProjectAPI,
} from '../../src/lib/projectApi'

describe('projectApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    global.fetch = vi.fn()
  })

  describe('fetchProjects', () => {
    it('TC-003-06: returns parsed project array', async () => {
      const mockData = [
        { id: 'p1', name: 'A', description: '', targetUsers: [], coreFunctions: [], keyScenarios: [], createdAt: '2026-01-01T00:00:00Z' },
      ]
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      } as Response)

      const result = await fetchProjects()
      expect(result).toEqual(mockData)
      expect(global.fetch).toHaveBeenCalledWith('/api/projects')
    })

    it('TC-003-07: throws on non-ok response', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response)

      await expect(fetchProjects()).rejects.toThrow('获取项目列表失败: 500')
    })
  })

  describe('createProjectAPI', () => {
    it('TC-003-08: returns created project with required fields', async () => {
      const mock = {
        id: 'proj-abc',
        name: 'New Project',
        description: 'A new project',
        targetUsers: [],
        coreFunctions: [],
        keyScenarios: [],
        createdAt: '2026-01-01T00:00:00Z',
      }
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mock),
      } as Response)

      const result = await createProjectAPI({ name: 'New Project', description: 'A new project' })
      expect(result.id).toBe('proj-abc')
      expect(result.name).toBe('New Project')
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/projects',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'New Project', description: 'A new project' }),
        })
      )
    })

    it('TC-003-09: throws on non-ok response', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      } as Response)

      await expect(
        createProjectAPI({ name: 'Bad' })
      ).rejects.toThrow('创建项目失败: 400')
    })
  })

  describe('deleteProjectAPI', () => {
    it('TC-003-10: succeeds on 204 response', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 204,
      } as Response)

      await expect(deleteProjectAPI('proj-xyz')).resolves.toBeUndefined()
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/projects/proj-xyz',
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('TC-003-11: throws on non-ok non-204 response', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response)

      await expect(deleteProjectAPI('missing-id')).rejects.toThrow('删除项目失败: 404')
    })
  })
})
