/**
 * 项目 API 客户端
 * 调用后端 /api/projects 接口
 */
import type { Project, CreateProjectInput } from '../types'

const API_BASE = '/api/projects'

/**
 * 获取所有项目列表
 * GET /api/projects
 */
export async function fetchProjects(): Promise<Project[]> {
  const response = await fetch(API_BASE)
  if (!response.ok) {
    throw new Error(`获取项目列表失败: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

/**
 * 创建新项目
 * POST /api/projects
 */
export async function createProjectAPI(
  input: CreateProjectInput
): Promise<Project> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw new Error(`创建项目失败: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

/**
 * 删除项目
 * DELETE /api/projects/{id}
 */
export async function deleteProjectAPI(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok && response.status !== 204) {
    throw new Error(`删除项目失败: ${response.status} ${response.statusText}`)
  }
}
