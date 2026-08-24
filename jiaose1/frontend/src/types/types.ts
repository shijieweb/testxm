export interface BugItem {
  file: string
  line_hint?: string
  severity: 'high' | 'medium' | 'low'
  description: string
  fix_suggestion?: string
}

export interface BugRefuxRequest {
  bugs: BugItem[]
  bugs_summary: string
  round: number
}

export interface TeamStepResult {
  step_id: string
  agent_name: string
  role_name: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'clarification' | 'needs_fix'
  input_summary?: string
  output_summary?: string
  result?: Record<string, unknown>
  error?: string
}

export interface TeamClarificationRequest {
  score: number
  needs_clarification: boolean
  questions: string[]
  partial_prd?: Record<string, unknown>
}

export interface TeamExecutionResponse {
  task_id: string
  status: 'started' | 'needs_clarification' | 'running' | 'completed' | 'failed' | 'needs_bug_fix'
  steps: TeamStepResult[]
  clarification?: TeamClarificationRequest
  bug_reflux?: BugRefuxRequest
  final_output?: {
    prd?: Record<string, unknown>
    architecture?: Record<string, unknown>
    implementation?: Record<string, unknown>
    quality_review?: Record<string, unknown>
    score?: number
  }
  round: number
}

export interface TeamRole {
  id: string
  name: string
  description: string
}

export interface TeamWorkflowResponse {
  roles: TeamRole[]
  workflow: string
}
