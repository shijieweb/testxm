/**
 * 专家协作（Team Workflow）API 客户端
 */
import type { TeamRole, TeamWorkflowResponse, TeamExecutionResponse, BugItem } from '../types'

const TEAM_BASE = '/api/team'

export interface TeamTaskInput {
  user_request: string
  project_name?: string
  api_url?: string
  api_key?: string
  model_name?: string
  clarification_context?: ClarificationContext
  max_clarification_rounds?: number
  max_bug_fix_rounds?: number
}

export interface ClarificationContext {
  clarification?: {
    questions: string[]
    score?: number
    needs_clarification?: boolean
  }
  bug_reflux?: {
    bugs: BugItem[]
    bugs_summary: string
    round: number
  }
  user_answer?: string
  project_name?: string
}

export interface TeamExecutePayload {
  user_request: string
  project_name?: string
  api_url?: string
  api_key?: string
  model_name?: string
  clarification_context?: ClarificationContext
  max_clarification_rounds?: number
  max_bug_fix_rounds?: number
}

/**
 * 获取团队角色列表
 * GET /api/team/workflows
 */
export async function callListWorkflows(): Promise<TeamWorkflowResponse> {
  const resp = await fetch(`${TEAM_BASE}/workflows`)
  if (!resp.ok) throw new Error(`获取角色列表失败: ${resp.status}`)
  return resp.json()
}

/**
 * 执行团队协作任务
 * POST /api/team/execute
 */
export async function callTeamExecute(payload: TeamExecutePayload): Promise<TeamExecutionResponse> {
  const resp = await fetch(`${TEAM_BASE}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!resp.ok) throw new Error(`团队协作请求失败: ${resp.status} ${resp.statusText}`)
  return resp.json()
}
