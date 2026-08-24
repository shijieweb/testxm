import { describe, it, expect, vi, beforeEach } from 'vitest'
import { callOptimizeProject, callTestConnection } from '../../src/lib/api'

describe('api', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('callOptimizeProject', () => {
    it('TC-003-01: returns structured OptimizedResult', async () => {
      const mockData = {
        targetUsers: ['User A', 'User B'],
        coreFunctions: ['Func 1', 'Func 2'],
        keyScenarios: ['Scenario 1'],
        description: 'A test project.',
      }
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      })

      const result = await callOptimizeProject({ name: 'TestApp' })
      expect(result.targetUsers).toEqual(['User A', 'User B'])
      expect(result.coreFunctions).toEqual(['Func 1', 'Func 2'])
      expect(result.keyScenarios).toEqual(['Scenario 1'])
      expect(result.description).toBe('A test project.')
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ai/optimize-project',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'TestApp', description: undefined, vision: undefined }),
        })
      )
    })

    it('TC-003-02: handles empty name', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          targetUsers: [],
          coreFunctions: [],
          keyScenarios: [],
          description: '',
        }),
      })

      const result = await callOptimizeProject({ name: '' })
      expect(Array.isArray(result.targetUsers)).toBe(true)
      expect(typeof result.description).toBe('string')
    })

    it('TC-003-03: throws on non-ok response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      await expect(callOptimizeProject({ name: 'Test' })).rejects.toThrow('优化请求失败: 500')
    })
  })

  describe('callTestConnection', () => {
    it('TC-003-04: returns success result with config params', async () => {
      const mockData = { success: true, message: '连接成功！' }
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      })

      const result = await callTestConnection({
        apiUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-test',
        modelName: 'gpt-4o-mini',
      })
      expect(result).toEqual(mockData)
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ai/test-connection',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            apiUrl: 'https://api.openai.com/v1',
            apiKey: 'sk-test',
            modelName: 'gpt-4o-mini',
          }),
        })
      )
    })

    it('TC-003-05: throws on non-ok response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      })

      await expect(
        callTestConnection({ apiUrl: 'https://x', apiKey: 'k', modelName: 'm' })
      ).rejects.toThrow('连接测试失败: 503')
    })
  })
})
