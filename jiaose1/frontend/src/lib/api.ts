/**
 * AI 功能 API 客户端
 * 调用后端 /api/ai/* 接口
 */
import type { OptimizedResult } from '../types'

const API_BASE = '/api/ai'

export interface TestConnectionResult {
  success: boolean
  message: string
}

/**
 * 调用后端 AI 优化接口
 * POST /api/ai/optimize-project
 */
export async function callOptimizeProject(
  input: { name: string; description?: string; vision?: string },
  aiConfig?: { apiUrl?: string; apiKey?: string; modelName?: string }
): Promise<OptimizedResult> {
  const body: Record<string, unknown> = {
    name: input.name,
    description: input.description,
    vision: input.vision,
  }
  if (aiConfig?.apiUrl) body.apiUrl = aiConfig.apiUrl
  if (aiConfig?.apiKey) body.apiKey = aiConfig.apiKey
  if (aiConfig?.modelName) body.modelName = aiConfig.modelName

  const response = await fetch(`${API_BASE}/optimize-project`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(`优化请求失败: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

/**
 * 调用后端连接测试接口
 * POST /api/ai/test-connection
 */
export interface TestConnectionConfig {
  apiUrl: string
  apiKey: string
  modelName?: string
}

export async function callTestConnection(
  config: TestConnectionConfig
): Promise<TestConnectionResult> {
  const response = await fetch(`${API_BASE}/test-connection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })
  if (!response.ok) {
    throw new Error(`连接测试失败: ${response.status} ${response.statusText}`)
  }
  return response.json()
}
