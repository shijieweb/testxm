import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { ArchitectureDisplay } from '../../src/components/settings/ArchitectureDisplay'
import { useSettingsStore } from '../../src/store/settingsStore'

describe('ArchitectureDisplay', () => {
  beforeEach(() => {
    useSettingsStore.persist.clearStorage()
    useSettingsStore.getState().resetSettings()
  })

  afterEach(() => {
    cleanup()
  })

  it('TC-005-01: renders five-layer tech stack table', () => {
    render(<ArchitectureDisplay />)
    expect(screen.getByText('前端')).toBeInTheDocument()
    expect(screen.getByText('后端')).toBeInTheDocument()
    expect(screen.getByText('数据库')).toBeInTheDocument()
    expect(screen.getByText('测试')).toBeInTheDocument()
    expect(screen.getByText('部署')).toBeInTheDocument()
  })

  it('TC-005-02: frontend cell contains React', () => {
    render(<ArchitectureDisplay />)
    expect(screen.getByText(/React/)).toBeInTheDocument()
  })

  it('TC-005-03: directory tree is rendered', () => {
    render(<ArchitectureDisplay />)
    expect(screen.getByText('project-root/')).toBeInTheDocument()
  })

  it('TC-005-04: clicking node toggles expand/collapse', () => {
    render(<ArchitectureDisplay />)
    const root = screen.getByText('project-root/')
    // defaultExpanded=false so children are hidden initially
    expect(screen.queryByText('frontend/')).not.toBeInTheDocument()
    // First click expands the tree
    fireEvent.click(root)
    expect(screen.getByText('frontend/')).toBeInTheDocument()
    // Second click collapses the tree
    fireEvent.click(root)
    expect(screen.queryByText('frontend/')).not.toBeInTheDocument()
  })

  it('TC-005-05: reads from settingsStore', () => {
    render(<ArchitectureDisplay />)
    const store = useSettingsStore.getState()
    expect(store.defaultArchitecture.directoryTree.length).toBeGreaterThan(0)
  })
})
