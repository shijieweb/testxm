import { AiModelCard } from './AiModelCard'
import { ArchitectureCard } from './ArchitectureCard'
import { PromptTemplatesCard } from './PromptTemplatesCard'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">设置</h1>
        <p className="text-sm text-muted-foreground mt-1">全局配置中心，所有项目默认继承</p>
      </div>

      <AiModelCard />
      <ArchitectureCard />
      <PromptTemplatesCard />

      <div className="text-xs text-muted-foreground text-center py-4">
        单一数据源原则：提示词、架构目录只在全局设置中定义一次
      </div>
    </div>
  )
}
