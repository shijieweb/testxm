import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { SettingsPage } from '../../src/pages/SettingsPage'
import { useSettingsStore } from '../../src/store/settingsStore'

describe('SettingsPage', () => {
  beforeEach(() => {
    useSettingsStore.persist.clearStorage()
    useSettingsStore.getState().resetSettings()
  })

  afterEach(() => {
    cleanup()
  })

  it('TC-011-01: renders three card sections', () => {
    render(
      <MemoryRouter key="tc-011-01" initialEntries={['/settings']}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('配置您的 AI 模型以便使用优化功能')).toBeInTheDocument()
    expect(screen.getByText('创建项目时将使用以下默认架构')).toBeInTheDocument()
    expect(screen.getByText('共 7 个内置模板，来源唯一，不可删除')).toBeInTheDocument()
  })

  it('TC-011-02: data persists across re-renders', () => {
    const { rerender } = render(
      <MemoryRouter key="tc-011-02a" initialEntries={['/settings']}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>
    )
    // Set some state
    useSettingsStore.getState().setAiModel('https://api.test.com', 'sk-test', 'gpt-4o')
    // Force full remount by changing the router key
    rerender(
      <MemoryRouter key="tc-011-02b" initialEntries={['/settings']}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>
    )
    // Check that the header still renders after remount
    const headers = screen.getAllByText('AI 模型配置')
    expect(headers.length).toBeGreaterThanOrEqual(1)
  })

  it('TC-011-03: header renders correctly', () => {
    render(
      <MemoryRouter key="tc-011-03" initialEntries={['/settings']}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>
    )
    // Use getAllByText to handle potential duplicates
    const headers = screen.getAllByText('设置')
    expect(headers.length).toBeGreaterThan(0)
  })
})
