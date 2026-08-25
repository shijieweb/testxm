import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2, ChevronDown, ChevronUp, Plus, X, Folder, FileText, CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import type { TreeNode } from '../../store'

interface FormState {
  name: string
  description: string
  userVision: string
}

interface OptimizedResult {
  project_description: string
  target_users: string[]
  core_functions: string[]
  key_scenarios: string[]
}

export default function CreateProjectPage() {
  const navigate = useNavigate()
  const { addProject, architecture, prompts } = useStore()
  const [form, setForm] = useState<FormState>({ name: '', description: '', userVision: '' })
  const [optimizing, setOptimizing] = useState(false)
  const [optimized, setOptimized] = useState<OptimizedResult | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const template = prompts.find((p) => p.id === '1')

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleOptimize = async () => {
    if (!form.name.trim()) {
      setErrors((prev) => ({ ...prev, name: '项目名称不能为空' }))
      return
    }
    setOptimizing(true)
    // Simulate AI optimization
    await new Promise((r) => setTimeout(r, 1500))
    const mockResult: OptimizedResult = {
      project_description: `一个AI驱动的需求管理与研发协作平台，帮助用户通过自然语言快速创建项目、管理需求并自动化开发流程。`,
      target_users: ['产品经理', '开发者', '技术负责人'],
      core_functions: ['需求管理', '项目架构初始化', 'AI辅助开发文档生成', '协作与评审'],
      key_scenarios: [
        '产品经理通过对话描述需求，AI自动扩展为完整用户故事',
        '开发者创建项目时自动初始化标准架构和技术栈',
        '团队通过AI生成开发文档、测试用例和验收文档',
      ],
    }
    setOptimized(mockResult)
    setForm((prev) => ({ ...prev, description: mockResult.project_description }))
    setOptimizing(false)
    setShowResult(true)
  }

  const handleCreate = () => {
    if (!form.name.trim()) {
      setErrors((prev) => ({ ...prev, name: '项目名称不能为空' }))
      return
    }
    const project = {
      id: Date.now().toString(),
      name: form.name,
      description: form.description || form.name,
      targetUsers: optimized?.target_users ?? [],
      coreFunctions: optimized?.core_functions ?? [],
      keyScenarios: optimized?.key_scenarios ?? [],
      createdAt: new Date().toISOString(),
      architectureSnapshot: architecture,
    }
    addProject(project)
    navigate(`/project/${project.id}`)
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24 md:pb-0">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost p-1.5 -ml-1 md:hidden">
          <ChevronDown className="w-5 h-5 rotate-90" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">创建项目</h1>
          <p className="text-sm text-muted-foreground mt-1">录入初始项目信息，AI 将自动完善</p>
        </div>
      </div>

      {/* Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="card space-y-5"
      >
        {/* Project Name */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            项目名称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="例如：用户管理系统"
            className={`input-field ${errors.name ? 'ring-2 ring-red-500 border-red-500' : ''}`}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">项目简介</label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="简要描述项目的目标和功能..."
            rows={3}
            className="input-field resize-none"
          />
        </div>

        {/* User Vision */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">基础用户设想</label>
          <textarea
            value={form.userVision}
            onChange={(e) => handleChange('userVision', e.target.value)}
            placeholder="描述目标用户、核心功能、使用场景..."
            rows={3}
            className="input-field resize-none"
          />
        </div>

        {/* AI Optimize Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleOptimize}
            disabled={optimizing || !form.name.trim()}
            className="btn-primary w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 border-0"
          >
            {optimizing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                AI 正在优化项目描述...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                AI 优化项目描述
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Optimized Result */}
      <AnimatePresence>
        {showResult && optimized && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="card space-y-4"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <h2 className="card-title">AI 优化结果</h2>
            </div>

            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">项目简介</span>
              <p className="text-sm text-foreground mt-1 leading-relaxed">{optimized.project_description}</p>
            </div>

            {/* Target Users */}
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">目标用户</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {optimized.target_users.map((u, i) => (
                  <span key={i} className="badge badge-blue">{u}</span>
                ))}
              </div>
            </div>

            {/* Core Functions */}
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">核心功能</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {optimized.core_functions.map((f, i) => (
                  <span key={i} className="badge badge-green">{f}</span>
                ))}
              </div>
            </div>

            {/* Key Scenarios */}
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">关键场景</span>
              <div className="mt-2 space-y-1.5">
                {optimized.key_scenarios.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="text-muted-foreground shrink-0">•</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Architecture Preview */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
            <Folder className="w-3.5 h-3.5 text-primary" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">默认架构目录</h2>
          <span className="badge badge-muted ml-auto">只读</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">该项目将使用全局默认架构，无需手动配置。</p>
        <div className="bg-muted/50 rounded-lg p-3 max-h-52 overflow-y-auto scrollbar-hide text-sm font-mono">
          {renderTree(architecture.directoryTree, 0)}
        </div>
      </motion.div>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-md border-t border-border md:relative md:border-0 md:bg-transparent md:backdrop-blur-none md:pt-4 md:pb-0 md:bottom-auto md:left-auto md:right-auto">
        <div className="max-w-xl mx-auto px-4 py-3 md:py-0 flex gap-3">
          <button onClick={() => navigate(-1)} className="btn-outline flex-1 md:flex-none">
            取消
          </button>
          <button onClick={handleCreate} className="btn-primary flex-1 md:flex-none">
            创建项目
          </button>
        </div>
      </div>
    </div>
  )
}

function renderTree(nodes: TreeNode[], depth: number) {
  const prefix = '  '.repeat(depth)
  return nodes.map((node) => (
    <div key={node.name}>
      <span className="text-muted-foreground">{prefix}</span>
      {node.type === 'folder' ? (
        <span className="text-blue-500">
          {depth === 0 ? '' : '├─ '}{node.name}/
        </span>
      ) : (
        <span className="text-foreground">
          {depth === 0 ? '' : '│   '}
          {node.name}
        </span>
      )}
      {node.children && node.children.length > 0 && (
        <div>{renderTree(node.children, depth + 1)}</div>
      )}
    </div>
  ))
}
