import { describe, it, expect, beforeEach } from 'vitest'
import { useSettingsStore } from '../../src/store/settingsStore'

function resetStore() {
  useSettingsStore.persist.clearStorage()
  useSettingsStore.setState({ ...useSettingsStore.getState() })
}

describe('settingsStore', () => {
  beforeEach(() => {
    resetStore()
  })

  it('TC-001-01: initializes with empty aiModel', () => {
    const settings = useSettingsStore.getState()
    expect(settings.aiModel.apiUrl).toBe('')
    expect(settings.aiModel.apiKey).toBe('')
    expect(settings.aiModel.modelName).toBe('')
  })

  it('TC-001-02: initializes default architecture with React', () => {
    const settings = useSettingsStore.getState()
    expect(settings.defaultArchitecture.frontend).toContain('React')
    expect(settings.defaultArchitecture.backend).toContain('FastAPI')
    expect(settings.defaultArchitecture.database).toBe('SQLite')
  })

  it('TC-001-03: initializes 7 prompt templates', () => {
    const settings = useSettingsStore.getState()
    expect(settings.prompts.length).toBe(7)
  })

  it('TC-001-04: setAiModel updates config', () => {
    useSettingsStore.getState().setAiModel('https://api.test.com', 'sk-test-key', 'gpt-4o')
    const settings = useSettingsStore.getState()
    expect(settings.aiModel.apiUrl).toBe('https://api.test.com')
    expect(settings.aiModel.apiKey).toBe('sk-test-key')
    expect(settings.aiModel.modelName).toBe('gpt-4o')
  })

  it('TC-001-05: saveSettings merges partial updates', () => {
    useSettingsStore.getState().setAiModel('https://api.test.com', 'sk-test-key', 'gpt-4o')
    useSettingsStore.getState().saveSettings({ aiModel: { apiUrl: 'https://api.new.com', apiKey: '', modelName: '' } })
    const settings = useSettingsStore.getState()
    expect(settings.aiModel.apiUrl).toBe('https://api.new.com')
  })

  it('TC-001-06: persist writes to localStorage', () => {
    useSettingsStore.getState().setAiModel('https://api.test.com', 'sk-test-key', 'gpt-4o')
    const persisted = JSON.parse(localStorage.getItem('ai-requirements-platform-settings') || '{}')
    expect(persisted.state.aiModel.apiUrl).toBe('https://api.test.com')
  })

  it('TC-001-07: persist reads from localStorage', () => {
    // Pre-populate localStorage
    const defaults = useSettingsStore.getState()
    localStorage.setItem(
      'ai-requirements-platform-settings',
      JSON.stringify({
        version: 1,
        state: {
          aiModel: { apiUrl: 'https://api.test.com', apiKey: 'sk-key', modelName: 'deepseek-chat' },
          defaultArchitecture: defaults.defaultArchitecture,
          prompts: defaults.prompts,
          aiBannerDismissed: false,
        },
      })
    )
    // Next getState call should read from localStorage
    const settings = useSettingsStore.getState()
    expect(settings.aiModel.apiUrl).toBe('https://api.test.com')
  })

  it('TC-001-08: dismissAiBanner sets flag', () => {
    useSettingsStore.getState().dismissAiBanner()
    expect(useSettingsStore.getState().aiBannerDismissed).toBe(true)
  })

  it('TC-001-09: resetSettings restores defaults', () => {
    useSettingsStore.getState().setAiModel('https://api.test.com', 'sk-key', 'gpt-4o')
    useSettingsStore.getState().resetSettings()
    const settings = useSettingsStore.getState()
    expect(settings.aiModel.apiUrl).toBe('')
    expect(settings.aiModel.apiKey).toBe('')
  })
})
