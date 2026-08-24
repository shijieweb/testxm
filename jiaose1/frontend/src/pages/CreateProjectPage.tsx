import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettingsStore } from '../store/settingsStore'
import { useProjectsStore } from '../store/projectsStore'
import { callOptimizeProject } from '../lib/api'
import { Layout } from '../components/layout'
import { ProjectForm } from '../components/create-project/ProjectForm'
import { AiOptimizeSection } from '../components/create-project/AiOptimizeSection'
import { DirectoryTree } from '../components/settings/DirectoryTree'
import { Button } from '../components/ui'
import type { CreateProjectInput, OptimizedResult } from '../types'

export function CreateProjectPage() {
  const navigate = useNavigate()
  const { defaultArchitecture, aiModel } = useSettingsStore()
  const { createProject } = useProjectsStore()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [vision, setVision] = useState('')
  const [targetUsers, setTargetUsers] = useState<string[]>([])
  const [coreFunctions, setCoreFunctions] = useState<string[]>([])
  const [keyScenarios, setKeyScenarios] = useState<string[]>([])
  const [optimizedResult, setOptimizedResult] = useState<OptimizedResult | null>(null)
  const [optimizing, setOptimizing] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleOptimize = async () => {
    if (!name.trim()) {
      alert('请先填写项目名称')
      return
    }
    setOptimizing(true)
    try {
      const result = await callOptimizeProject({ name, description, vision }, aiModel)
      setOptimizedResult(result)
      setDescription(result.description)
      setTargetUsers(result.targetUsers)
      setCoreFunctions(result.coreFunctions)
      setKeyScenarios(result.keyScenarios)
    } catch (error) {
      console.error('AI优化失败:', error)
      alert(`优化失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setOptimizing(false)
    }
  }

  const handleCreate = () => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = '项目名称不能为空'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    const input: CreateProjectInput = {
      name,
      description,
      vision,
      targetUsers,
      coreFunctions,
      keyScenarios,
    }
    createProject(input)
    // Mock navigation to story list (future feature)
    setTimeout(() => {
      navigate('/projects')
    }, 500)
  }

  const handleCancel = () => {
    navigate('/settings')
  }

  return (
    <Layout title="创建项目" activeItem="create-project" onNavigate={(item) => navigate(item === 'settings' ? '/settings' : '/projects/create')}>
      <AnimatePresence mode="wait">
        <motion.div
          key="create-project"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3 }}
          className="max-w-[600px] mx-auto space-y-4"
        >
          <ProjectForm
            formData={{ name, description, vision, targetUsers, coreFunctions, keyScenarios }}
            onChange={({ name: n, description: d, vision: v, targetUsers: tu, coreFunctions: cf, keyScenarios: ks }) => {
              setName(n)
              setDescription(d)
              setVision(v)
              setTargetUsers(tu)
              setCoreFunctions(cf)
              setKeyScenarios(ks)
            }}
            onOptimize={handleOptimize}
            optimizing={optimizing}
            optimized={!!optimizedResult}
            errors={errors}
          />

          <AiOptimizeSection result={optimizedResult} loading={optimizing} />

          {!aiModel.apiUrl && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">
              提示：AI 模型尚未配置，请先在{' '}
              <button onClick={() => navigate('/settings')} className="underline font-medium">设置页面</button>
              {' '}配置 AI 模型以使用优化功能。
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500 mb-3">该项目将使用全局默认架构，无需手动配置。</p>
            <DirectoryTree nodes={defaultArchitecture.directoryTree} defaultExpanded={false} />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16 flex items-center justify-end gap-3 px-4 z-10">
        <Button variant="outline" onClick={handleCancel}>取消</Button>
        <Button onClick={handleCreate} className="px-8">创建项目</Button>
      </div>
    </Layout>
  )
}
