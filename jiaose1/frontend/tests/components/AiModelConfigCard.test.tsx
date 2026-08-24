import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react'
import { AiModelConfigCard } from '../../src/components/settings/AiModelConfigCard'
import { useSettingsStore } from '../../src/store/settingsStore'

beforeEach(() => {
  vi.clearAllMocks()
  useSettingsStore.persist.clearStorage()
  useSettingsStore.getState().resetSettings()
})

afterEach(() => {
  cleanup()
})

describe('AiModelConfigCard', () => {
  it('TC-004-01: renders three input fields', () => {
    render(<AiModelConfigCard />)
    expect(screen.getByPlaceholderText('https://api.openai.com/v1')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('sk-...')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('gpt-4o / deepseek-chat')).toBeInTheDocument()
  })

  it('TC-004-02: echoes saved config', () => {
    useSettingsStore.getState().setAiModel('https://api.test.com', 'sk-test', 'gpt-4o')
    render(<AiModelConfigCard />)
    const apiUrlInput = screen.getByPlaceholderText('https://api.openai.com/v1') as HTMLInputElement
    expect(apiUrlInput.value).toBe('https://api.test.com')
  })

  it('TC-004-03: input changes update local state', () => {
    render(<AiModelConfigCard />)
    const apiUrlInput = screen.getByPlaceholderText('https://api.openai.com/v1') as HTMLInputElement
    fireEvent.change(apiUrlInput, { target: { value: 'https://api.new.com' } })
    expect(apiUrlInput.value).toBe('https://api.new.com')
  })

  it('TC-004-04: save button triggers saveSettings', async () => {
    const mockSave = vi.fn()
    const store = useSettingsStore.getState()
    ;(store as unknown as Record<string, unknown>).saveSettings = mockSave

    render(<AiModelConfigCard />)
    const apiUrlInput = screen.getByPlaceholderText('https://api.openai.com/v1') as HTMLInputElement
    const apiKeyInput = screen.getByPlaceholderText('sk-...') as HTMLInputElement
    fireEvent.change(apiUrlInput, { target: { value: 'https://api.test.com' } })
    fireEvent.change(apiKeyInput, { target: { value: 'sk-test-key' } })

    const saveBtn = screen.getByText('保存配置')
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalled()
    })
  })

  it('TC-004-05: test connection shows success message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, message: '连接成功！' }),
    })

    render(<AiModelConfigCard />)
    const apiUrlInput = screen.getByPlaceholderText('https://api.openai.com/v1') as HTMLInputElement
    const apiKeyInput = screen.getByPlaceholderText('sk-...') as HTMLInputElement
    // Fill in config so callTestConnection receives real values
    fireEvent.change(apiUrlInput, { target: { value: 'https://api.openai.com/v1' } })
    fireEvent.change(apiKeyInput, { target: { value: 'sk-test-key' } })

    const testBtn = screen.getByText('测试连接')
    fireEvent.click(testBtn)
    await waitFor(() => {
      expect(screen.getByText('连接成功！')).toBeInTheDocument()
    })
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/ai/test-connection',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('api.openai.com'),
      })
    )
  })

  it('TC-004-06: API key toggle switches input type', () => {
    render(<AiModelConfigCard />)
    const apiKeyInput = screen.getByPlaceholderText('sk-...') as HTMLInputElement
    expect(apiKeyInput.type).toBe('password')

    const eyeBtn = screen.getByLabelText('Show API key')
    fireEvent.click(eyeBtn)
    expect(apiKeyInput.type).toBe('text')

    fireEvent.click(eyeBtn)
    expect(apiKeyInput.type).toBe('password')
  })

  it('TC-004-07: save button disabled when apiUrl is empty', () => {
    render(<AiModelConfigCard />)
    const saveBtn = screen.getByText('保存配置')
    expect(saveBtn).toBeDisabled()
  })
})
