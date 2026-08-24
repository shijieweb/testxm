import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettingsStore } from '../store/settingsStore'
import { Layout } from '../components/layout'
import {
  callListWorkflows,
  callTeamExecute,
  type TeamRole,
  type TeamExecutionResponse,
} from '../lib/teamApi'
import { Button } from '../components/ui'

const ROLE_ICONS: Record<string, string> = {
  prd: '📝',
  architect: '🏗️',
  engineer: '⚙️',
  qa: '🔍',
}

const ROLE_COLORS: Record<string, string> = {
  prd: 'bg-blue-50 text-blue-700 border-blue-200',
  architect: 'bg-purple-50 text-purple-700 border-purple-200',
  engineer: 'bg-green-50 text-green-700 border-green-200',
  qa: 'bg-orange-50 text-orange-700 border-orange-200',
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[severity] ?? colors.low}`}>
      {severity === 'high' ? '高' : severity === 'medium' ? '中' : '低'}
    </span>
  )
}

function StepCard({ step }: { step: TeamExecutionResponse['steps'][0] }) {
  const running = step.status === 'running'
  const failed = step.status === 'failed'
  const clarification = step.status === 'clarification'
  const needsFix = step.status === 'needs_fix'

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${
      running ? 'border-blue-200 bg-blue-50' :
      failed ? 'border-red-200 bg-red-50' :
      clarification ? 'border-yellow-200 bg-yellow-50' :
      needsFix ? 'border-orange-200 bg-orange-50' :
      'border-gray-100 bg-white'
    }`}>
      <div className="text-lg flex-shrink-0 mt-0.5">
        {running ? '⟳' : failed ? '✕' : clarification || needsFix ? '!' : '✓'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{step.role_name}</span>
          {running && <span className="text-xs text-blue-500 animate-pulse">执行中…</span>}
        </div>
        {step.output_summary && (
          <p className="text-xs text-gray-500 mt-0.5">{step.output_summary}</p>
        )}
      </div>
    </div>
  )
}

function ClarificationDialog({
  questions,
  onContinue,
  onCancel,
}: {
  questions: string[]
  onContinue: (answer: string) => void
  onCancel: () => void
}) {
  const [answer, setAnswer] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6"
      >
        <h2 className="text-base font-semibold text-gray-900 mb-1">📝 需要补充信息</h2>
        <p className="text-sm text-gray-500 mb-4">产品经理「许清楚」发现需求不够清晰，请补充以下信息：</p>
        <ul className="space-y-2 mb-4">
          {questions.map((q, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-blue-500 font-medium mt-0.5">Q{i + 1}.</span>
              <span>{q}</span>
            </li>
          ))}
        </ul>
        <textarea
          className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-blue-300"
          placeholder="在此输入你的补充说明…"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" size="sm" onClick={onCancel}>取消</Button>
          <Button
            size="sm"
            disabled={!answer.trim()}
            onClick={() => onContinue(answer)}
          >
            继续执行
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

function BugFixDialog({
  bugsSummary,
  bugs,
  onContinue,
  onCancel,
}: {
  bugsSummary: string
  bugs: { file: string; severity: string; description: string; fix_suggestion?: string }[]
  onContinue: (fixInstruction: string) => void
  onCancel: () => void
}) {
  const [fixInstruction, setFixInstruction] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[80vh] overflow-y-auto"
      >
        <h2 className="text-base font-semibold text-gray-900 mb-1">🔍 发现代码问题</h2>
        <p className="text-sm text-gray-500 mb-3">质检工程师「严过关」审查后发现了以下问题：</p>
        <p className="text-sm text-orange-600 bg-orange-50 rounded-lg p-2 mb-3">{bugsSummary}</p>
        <div className="space-y-2 mb-4">
          {bugs.map((bug, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded bg-gray-50 text-sm">
              <SeverityBadge severity={bug.severity} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-700 truncate">{bug.file}</div>
                <div className="text-gray-500">{bug.description}</div>
                {bug.fix_suggestion && (
                  <div className="text-xs text-gray-400 mt-0.5">💡 {bug.fix_suggestion}</div>
                )}
              </div>
            </div>
          ))}
        </div>
        <textarea
          className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-orange-300"
          placeholder="请描述修复方案或指令（可选）…"
          value={fixInstruction}
          onChange={(e) => setFixInstruction(e.target.value)}
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" size="sm" onClick={onCancel}>跳过修复</Button>
          <Button
            variant="primary"
            size="sm"
            className="bg-orange-500 hover:bg-orange-600"
            disabled={!fixInstruction.trim()}
            onClick={() => onContinue(fixInstruction)}
          >
            工程师修复并重检
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

function FinalOutput({ output }: { output: TeamExecutionResponse['final_output'] }) {
  if (!output) return null

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          📊 PRD 评分：{output.score ?? '—'} / 100
        </h3>
        {output.prd && (
          <div className="space-y-2 text-sm">
            {Object.entries(output.prd).map(([k, v]) => {
              if (v === null || v === undefined) return null
              const val = typeof v === 'string' ? v : JSON.stringify(v)
              return (
                <div key={k} className="flex gap-2">
                  <span className="text-gray-400 w-20 shrink-0">{k}:</span>
                  <span className="text-gray-700">{val}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
      {output.architecture && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">🏗️ 技术方案</h3>
          <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono bg-gray-50 rounded p-3">
            {JSON.stringify(output.architecture, null, 2)}
          </pre>
        </div>
      )}
      {output.implementation && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">⚙️ 实现计划</h3>
          <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono bg-gray-50 rounded p-3">
            {JSON.stringify(output.implementation, null, 2)}
          </pre>
        </div>
      )}
      {output.quality_review && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <h3 className="text-sm font-semibold text-green-800 mb-2">🔍 质检报告</h3>
          <p className="text-sm text-green-700">{(output.quality_review as any).summary ?? '质量审查通过'}</p>
        </div>
      )}
    </div>
  )
}

export function TeamPage() {
  const { aiModel } = useSettingsStore()
  const [roles, setRoles] = useState<TeamRole[]>([])
  const [request, setRequest] = useState('')
  const [response, setResponse] = useState<TeamExecutionResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showClarify, setShowClarify] = useState(false)
  const [showBugFix, setShowBugFix] = useState(false)
  const [clarifyContext, setClarifyContext] = useState<{
    questions: string[]
    user_answer: string
    project_name?: string
  } | null>(null)
  const [bugRefuxContext, setBugRefuxContext] = useState<{
    bugs: { file: string; severity: string; description: string; fix_suggestion?: string }[]
    bugs_summary: string
    round: number
  } | null>(null)

  useEffect(() => {
    callListWorkflows().then(setRoles).catch(() => {})
  }, [])

  async function runTask(withContext?: { clarification_context?: Record<string, unknown> }) {
    setLoading(true)
    setError(null)
    setResponse(null)
    try {
      const resp = await callTeamExecute({
        user_request: request,
        project_name: request.slice(0, 30),
        api_url: aiModel.apiUrl,
        api_key: aiModel.apiKey,
        model_name: aiModel.modelName,
        ...withContext,
      })
      setResponse(resp)

      if (resp.status === 'needs_clarification' && resp.clarification) {
        setClarifyContext({
          questions: resp.clarification.questions,
          user_answer: '',
          project_name: request.slice(0, 30),
        })
        setShowClarify(true)
      } else if (resp.status === 'needs_bug_fix' && resp.bug_reflux) {
        setBugRefuxContext({
          bugs: resp.bug_reflux.bugs,
          bugs_summary: resp.bug_reflux.bugs_summary,
          round: resp.bug_reflux.round,
        })
        setShowBugFix(true)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '执行失败')
    } finally {
      setLoading(false)
    }
  }

  function handleClarifyContinue(answer: string) {
    setShowClarify(false)
    if (!clarifyContext) return
    runTask({
      clarification_context: {
        clarification: {
          questions: clarifyContext.questions,
          needs_clarification: true,
          score: 0,
        },
        user_answer: answer,
        project_name: clarifyContext.project_name,
      },
    })
  }

  function handleBugFixContinue(fixInstruction: string) {
    setShowBugFix(false)
    if (!bugRefuxContext) return
    runTask({
      clarification_context: {
        bug_reflux: {
          bugs: bugRefuxContext.bugs.map(b => ({
            file: b.file,
            severity: b.severity,
            description: b.description,
            fix_suggestion: b.fix_suggestion,
          })),
          bugs_summary: bugRefuxContext.bugs_summary,
          round: bugRefuxContext.round,
        },
      },
    })
  }

  return (
    <Layout title="专家协作" activeItem="team">
      <div className="space-y-6">
        {/* Role cards */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">团队协作角色</h2>
          <div className="grid grid-cols-2 gap-3">
            {roles.map((role) => (
              <div
                key={role.id}
                className={`p-3 rounded-lg border ${ROLE_COLORS[role.id] ?? 'border-gray-100 bg-gray-50'}`}
              >
                <div className="text-lg mb-1">{ROLE_ICONS[role.id] ?? '👤'}</div>
                <div className="text-sm font-medium">{role.name}</div>
                <div className="text-xs mt-1 opacity-75">{role.description}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            工作流：prd → architect → engineer → qa（串行，含澄清闭环 + Bug 回溯闭环）
          </p>
        </div>

        {/* Input */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          <label className="block text-sm font-medium text-gray-700">描述你的项目需求</label>
          <textarea
            className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="例如：一个企业级的任务管理系统，支持多团队、看板视图、权限控制…"
            value={request}
            onChange={(e) => setRequest(e.target.value)}
          />
          <Button
            size="md"
            disabled={!request.trim() || loading}
            onClick={() => runTask()}
          >
            {loading ? '执行中…' : '开始协作'}
          </Button>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {/* Steps */}
        <AnimatePresence>
          {response?.steps.length ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <h3 className="text-sm font-semibold text-gray-700">执行步骤</h3>
              {response.steps.map((step) => (
                <StepCard key={step.step_id} step={step} />
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Result */}
        {response?.final_output && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-sm font-semibold text-gray-700 mb-3">📦 最终产出</h3>
            <FinalOutput output={response.final_output} />
            <p className="text-xs text-gray-400 mt-2">共 {response.round} 轮对话</p>
          </motion.div>
        )}

        {/* Dialogs */}
        <AnimatePresence>
          {showClarify && clarifyContext && (
            <ClarificationDialog
              questions={clarifyContext.questions}
              onContinue={handleClarifyContinue}
              onCancel={() => setShowClarify(false)}
            />
          )}
          {showBugFix && bugRefuxContext && (
            <BugFixDialog
              bugsSummary={bugRefuxContext.bugs_summary}
              bugs={bugRefuxContext.bugs}
              onContinue={handleBugFixContinue}
              onCancel={() => setShowBugFix(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </Layout>
  )
}
