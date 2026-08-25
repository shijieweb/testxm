import React, { useState } from 'react'
import { Bot, Key, Server, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useStore } from '../../store'

export function AiModelCard() {
  const { aiModel, updateAiModel, testConnection } = useStore()
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showKey, setShowKey] = useState(false)

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    const result = await testConnection()
    setTestResult(result)
    setTesting(false)
  }

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary" />
        </div>
        <h2 className="card-title">AI 模型配置</h2>
        <span className="badge badge-blue ml-auto">可编辑</span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">API 地址</label>
          <div className="relative">
            <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={aiModel.apiUrl}
              onChange={(e) => updateAiModel({ apiUrl: e.target.value })}
              placeholder="https://api.openai.com/v1"
              className="input-field pl-9"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">API Key</label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showKey ? 'text' : 'password'}
              value={aiModel.apiKey}
              onChange={(e) => updateAiModel({ apiKey: e.target.value })}
              placeholder="sk-..."
              className="input-field pl-9 pr-9"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              {showKey ? '隐藏' : '显示'}
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">模型名称</label>
          <div className="relative">
            <Bot className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={aiModel.modelName}
              onChange={(e) => updateAiModel({ modelName: e.target.value })}
              placeholder="gpt-4o, deepseek-chat..."
              className="input-field pl-9"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleTest}
            disabled={testing || !aiModel.apiUrl || !aiModel.apiKey || !aiModel.modelName}
            className="btn-outline text-sm"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                测试连接中...
              </>
            ) : (
              '测试连接'
            )}
          </button>
          <button className="btn-primary text-sm">
            <CheckCircle2 className="w-4 h-4" />
            保存配置
          </button>
        </div>

        {testResult && (
          <div
            className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
              testResult.success
                ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
            }`}
          >
            {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {testResult.message}
          </div>
        )}

        {!aiModel.apiUrl && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
            未配置 AI 模型，其他页面的 AI 功能将提示"请先配置 AI 模型"
          </p>
        )}
      </div>
    </div>
  )
}
