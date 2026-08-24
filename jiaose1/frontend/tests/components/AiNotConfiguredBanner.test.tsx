import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { AiNotConfiguredBanner } from '../../src/components/shared/AiNotConfiguredBanner'
import { useSettingsStore } from '../../src/store/settingsStore'

describe('AiNotConfiguredBanner', () => {
  beforeEach(() => {
    useSettingsStore.persist.clearStorage()
    useSettingsStore.getState().resetSettings()
  })

  afterEach(() => {
    cleanup()
  })

  it('TC-010-01: not shown when AI is configured', () => {
    const store = useSettingsStore.getState()
    store.setAiModel('https://api.test.com', 'sk-test', 'gpt-4o')
    render(<AiNotConfiguredBanner key="tc-010-01" />)
    expect(screen.queryByText(/请先配置 AI 模型/)).not.toBeInTheDocument()
  })

  it('TC-010-02: shown when AI not configured', () => {
    render(<AiNotConfiguredBanner key="tc-010-02" />)
    expect(screen.getByText(/请先配置 AI 模型/)).toBeInTheDocument()
  })

  it('TC-010-03: close button dismisses banner', () => {
    const { rerender } = render(<AiNotConfiguredBanner key="tc-010-03" />)
    const closeBtn = screen.getByLabelText('Dismiss banner')
    closeBtn.click()
    // Re-render to reflect the store state change
    rerender(<AiNotConfiguredBanner key="tc-010-03-d" />)
    // After dismiss, banner should not show
    expect(screen.queryByText(/请先配置 AI 模型/)).not.toBeInTheDocument()
  })
})
