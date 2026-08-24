import { useSettingsStore } from '../../store/settingsStore'

export function AiNotConfiguredBanner() {
  const { aiModel, dismissAiBanner, aiBannerDismissed } = useSettingsStore()

  if ((aiModel.apiUrl || aiModel.apiKey) || aiBannerDismissed) return null

  return (
    <div className="bg-orange-50 border-b border-orange-200 px-4 py-3 flex items-center justify-between">
      <p className="text-sm text-orange-700">请先配置 AI 模型，否则无法使用 AI 优化功能。</p>
      <button
        type="button"
        onClick={dismissAiBanner}
        className="text-orange-500 hover:text-orange-700 text-sm ml-4 shrink-0"
        aria-label="Dismiss banner"
      >
        关闭
      </button>
    </div>
  )
}
