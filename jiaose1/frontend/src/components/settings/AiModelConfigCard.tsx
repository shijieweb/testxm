import { useEffect, useState } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import { callTestConnection } from '../../lib/api'
import { Card, Button, Input } from '../ui'

export function AiModelConfigCard() {
  const { aiModel, saveSettings, dismissAiBanner } = useSettingsStore()
  const [localApiUrl, setLocalApiUrl] = useState(aiModel.apiUrl)
  const [localApiKey, setLocalApiKey] = useState(aiModel.apiKey)
  const [localModelName, setLocalModelName] = useState(aiModel.modelName)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    setLocalApiUrl(aiModel.apiUrl)
    setLocalApiKey(aiModel.apiKey)
    setLocalModelName(aiModel.modelName)
  }, [aiModel])

  const handleSave = async () => {
    if (!localApiUrl.trim() || !localApiKey.trim()) return
    setSaving(true)
    try {
      await saveSettings({ aiModel: { apiUrl: localApiUrl, apiKey: localApiKey, modelName: localModelName } })
      dismissAiBanner()
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTestResult(null)
    const result = await callTestConnection({
      apiUrl: localApiUrl,
      apiKey: localApiKey,
      modelName: localModelName,
    })
    setTestResult(result)
  }

  return (
    <Card title="AI 模型配置" subtitle="配置您的 AI 模型以便使用优化功能">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">API 地址</label>
          <Input
            value={localApiUrl}
            onChange={setLocalApiUrl}
            placeholder="https://api.openai.com/v1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
          <div className="relative">
            <Input
              type={showKey ? 'text' : 'password'}
              value={localApiKey}
              onChange={setLocalApiKey}
              placeholder="sk-..."
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={showKey ? 'Hide API key' : 'Show API key'}
            >
              {showKey ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">模型名称</label>
          <Input
            value={localModelName}
            onChange={setLocalModelName}
            placeholder="gpt-4o / deepseek-chat"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleTest} variant="outline">测试连接</Button>
          <Button
            onClick={handleSave}
            disabled={!localApiUrl.trim() || !localApiKey.trim() || saving}
          >
            {saving ? '保存中...' : '保存配置'}
          </Button>
        </div>
        {testResult && (
          <div className={`text-sm px-3 py-2 rounded-lg ${
            testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {testResult.success ? '连接成功！' : testResult.message}
          </div>
        )}
      </div>
    </Card>
  )
}
