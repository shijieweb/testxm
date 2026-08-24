import React from 'react'
import { Card, Button, Input, Textarea } from '../ui'

export interface ProjectFormData {
  name: string
  description: string
  vision: string
  targetUsers: string[]
  coreFunctions: string[]
  keyScenarios: string[]
}

interface ProjectFormProps {
  formData: ProjectFormData
  onChange: (data: ProjectFormData) => void
  onOptimize: () => void
  optimizing?: boolean
  optimized?: boolean
  errors?: Partial<Record<keyof ProjectFormData, string>>
}

export function ProjectForm({
  formData,
  onChange,
  onOptimize,
  optimizing = false,
  optimized = false,
  errors,
}: ProjectFormProps) {
  const updateField = <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => {
    onChange({ ...formData, [field]: value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Form validation is handled by the parent
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card title="项目信息" subtitle="填写项目基本信息，AI 将自动优化描述">
        <div className="space-y-4">
          <div>
            <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-1">
              项目名称 <span className="text-red-500">*</span>
            </label>
            <Input
              id="project-name"
              value={formData.name}
              onChange={(v) => updateField('name', v)}
              placeholder="输入项目名称"
              className={errors?.name ? 'border-red-500' : ''}
            />
            {errors?.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="project-description" className="block text-sm font-medium text-gray-700 mb-1">项目简介</label>
            <Textarea
              id="project-description"
              value={formData.description}
              onChange={(v) => updateField('description', v)}
              placeholder="简要描述项目目标和功能"
              rows={3}
            />
          </div>
          <div>
            <label htmlFor="project-vision" className="block text-sm font-medium text-gray-700 mb-1">基础用户设想</label>
            <Textarea
              id="project-vision"
              value={formData.vision}
              onChange={(v) => updateField('vision', v)}
              placeholder="描述目标用户和使用场景"
              rows={3}
            />
          </div>
        </div>
      </Card>

      <Card title="标签管理" subtitle="添加目标用户、核心功能、关键场景标签">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">目标用户</label>
            <input
              type="text"
              placeholder="输入后回车添加"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  const val = (e.target as HTMLInputElement).value.trim()
                  if (val && !formData.targetUsers.includes(val)) {
                    updateField('targetUsers', [...formData.targetUsers, val])
                  }
                  ;(e.target as HTMLInputElement).value = ''
                }
              }}
            />
            <div className="flex flex-wrap gap-2">
              {formData.targetUsers.map((tag, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
                  {tag}
                  <button type="button" aria-label={`Remove ${tag}`} onClick={() => updateField('targetUsers', formData.targetUsers.filter((_, j) => j !== i))} className="text-blue-400 hover:text-blue-600">×</button>
                </span>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">核心功能</label>
            <input
              type="text"
              placeholder="输入后回车添加"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  const val = (e.target as HTMLInputElement).value.trim()
                  if (val && !formData.coreFunctions.includes(val)) {
                    updateField('coreFunctions', [...formData.coreFunctions, val])
                  }
                  ;(e.target as HTMLInputElement).value = ''
                }
              }}
            />
            <div className="flex flex-wrap gap-2">
              {formData.coreFunctions.map((tag, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-50 text-green-700 border border-green-200">
                  {tag}
                  <button type="button" aria-label={`Remove ${tag}`} onClick={() => updateField('coreFunctions', formData.coreFunctions.filter((_, j) => j !== i))} className="text-green-400 hover:text-green-600">×</button>
                </span>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">关键场景</label>
            <input
              type="text"
              placeholder="输入后回车添加"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  const val = (e.target as HTMLInputElement).value.trim()
                  if (val && !formData.keyScenarios.includes(val)) {
                    updateField('keyScenarios', [...formData.keyScenarios, val])
                  }
                  ;(e.target as HTMLInputElement).value = ''
                }
              }}
            />
            <div className="flex flex-wrap gap-2">
              {formData.keyScenarios.map((tag, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-50 text-yellow-700 border border-yellow-200">
                  {tag}
                  <button type="button" aria-label={`Remove ${tag}`} onClick={() => updateField('keyScenarios', formData.keyScenarios.filter((_, j) => j !== i))} className="text-yellow-400 hover:text-yellow-600">×</button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <Button
          onClick={onOptimize}
          variant="outline"
          disabled={optimizing || !formData.name.trim()}
          className="w-full"
        >
          {optimizing ? 'AI 优化中...' : optimized ? '重新 AI 优化' : 'AI 优化项目描述'}
        </Button>
      </Card>
    </form>
  )
}
