import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { PromptTemplatesDisplay } from '../../src/components/settings/PromptTemplatesDisplay'
import { useSettingsStore } from '../../src/store/settingsStore'

describe('PromptTemplatesDisplay', () => {
  beforeEach(() => {
    useSettingsStore.persist.clearStorage()
    useSettingsStore.getState().resetSettings()
  })

  afterEach(() => {
    cleanup()
  })

  it('TC-006-01: renders 7 template cards', () => {
    render(<PromptTemplatesDisplay />)
    const cards = document.querySelectorAll('.prompt-template-card')
    expect(cards.length).toBe(7)
  })

  it('TC-006-02: each card shows prompt name', () => {
    render(<PromptTemplatesDisplay />)
    expect(screen.getByText('项目描述优化')).toBeInTheDocument()
    expect(screen.getByText('故事扩展')).toBeInTheDocument()
    expect(screen.getByText('架构初始化')).toBeInTheDocument()
  })

  it('TC-006-03: each card shows full prompt content when expanded', () => {
    render(<PromptTemplatesDisplay />)
    const firstCard = document.querySelector('.prompt-template-card')!
    fireEvent.click(firstCard.querySelector('button')!)
    // Content should be visible after click
    const pre = firstCard.querySelector('pre')
    expect(pre).toBeInTheDocument()
  })

  it('TC-006-04: card toggle expand/collapse', () => {
    render(<PromptTemplatesDisplay />)
    const firstCard = document.querySelector('.prompt-template-card')!
    fireEvent.click(firstCard.querySelector('button')!)
    expect(firstCard.querySelector('pre')).toBeInTheDocument()
    fireEvent.click(firstCard.querySelector('button')!)
    expect(firstCard.querySelector('pre')).not.toBeInTheDocument()
  })

  it('TC-006-05: reads from settingsStore', () => {
    render(<PromptTemplatesDisplay />)
    const store = useSettingsStore.getState()
    expect(store.prompts.length).toBe(7)
    const cards = document.querySelectorAll('.prompt-template-card')
    expect(cards.length).toBe(7)
  })
})
