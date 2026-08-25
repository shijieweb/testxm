import React, { useState } from 'react'
import { FileText, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'
import { useStore } from '../../store'
import type { PromptTemplate } from '../../store'

export function PromptTemplatesCard() {
  const { prompts } = useStore()
  const [expandedId, setExpandedId] = useState<string | null>('1')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="w-4 h-4 text-primary" />
        </div>
        <h2 className="card-title">提示词模板</h2>
        <span className="badge badge-muted ml-auto">只读 · 共 {prompts.length} 个</span>
      </div>

      <div className="space-y-2">
        {prompts.map((prompt, index) => (
          <div key={prompt.id} className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleExpand(prompt.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left"
            >
              <span className="badge badge-secondary text-xs w-6 h-6 p-0 flex items-center justify-center shrink-0">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">{prompt.name}</div>
                <div className="text-xs text-muted-foreground truncate">{prompt.purpose}</div>
              </div>
              {expandedId === prompt.id ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
            </button>
            {expandedId === prompt.id && (
              <div className="px-4 pb-3 border-t border-border bg-muted/30">
                <div className="pt-3 relative">
                  <pre className="text-xs text-foreground font-mono whitespace-pre-wrap max-h-64 overflow-y-auto scrollbar-hide pr-8">
                    {prompt.content}
                  </pre>
                  <button
                    onClick={() => handleCopy(prompt.content, prompt.id)}
                    className="absolute top-2 right-2 btn-ghost p-1.5 rounded-md"
                    title="复制"
                  >
                    {copiedId === prompt.id ? (
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
