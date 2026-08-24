import { useState } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import { Card } from '../ui'

export function PromptTemplatesDisplay() {
  const { prompts } = useSettingsStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <Card title="提示词模板" subtitle="共 7 个内置模板，来源唯一，不可删除">
      <div className="space-y-3">
        {prompts.map((prompt) => (
          <div
            key={prompt.id}
            className="prompt-template-card border border-gray-200 rounded-xl overflow-hidden"
          >
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              onClick={() => toggle(prompt.id)}
            >
              <div className="text-left">
                <span className="text-sm font-medium text-gray-900">{prompt.name}</span>
                <span className="ml-2 text-xs text-gray-500">{prompt.purpose}</span>
              </div>
              <span className="text-gray-400 text-sm">{expandedId === prompt.id ? '▲' : '▼'}</span>
            </button>
            {expandedId === prompt.id && (
              <div className="p-4 bg-white">
                <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap break-all max-h-60 overflow-y-auto">
                  {prompt.content}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
