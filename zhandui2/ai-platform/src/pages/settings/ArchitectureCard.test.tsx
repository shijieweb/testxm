import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ArchitectureCard } from './ArchitectureCard'
import { useStore } from '../../store'

describe('ArchitectureCard', () => {
  beforeEach(() => {
    useStore.setState({
      aiModel: { apiUrl: '', apiKey: '', modelName: '' },
      prompts: useStore.getState().prompts,
      architecture: useStore.getState().architecture,
      projects: [],
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the card title', () => {
    render(<ArchitectureCard />)
    expect(screen.getByRole('heading', { level: 2, name: '默认架构技术栈' })).toBeInTheDocument()
  })

  it('shows "只读" badge in header', () => {
    const { container } = render(<ArchitectureCard />)
    const badges = container.querySelectorAll('.badge')
    const readonlyBadge = Array.from(badges).some((el) => el.textContent?.includes('只读'))
    expect(readonlyBadge).toBe(true)
  })

  it('shows all tech stack rows', () => {
    render(<ArchitectureCard />)
    const { architecture } = useStore.getState()
    expect(screen.getByText('前端')).toBeInTheDocument()
    expect(screen.getByText(architecture.frontend)).toBeInTheDocument()
    expect(screen.getByText('后端')).toBeInTheDocument()
    expect(screen.getByText(architecture.backend)).toBeInTheDocument()
    expect(screen.getByText('数据库')).toBeInTheDocument()
    expect(screen.getByText(architecture.database)).toBeInTheDocument()
    expect(screen.getByText('测试')).toBeInTheDocument()
    expect(screen.getByText(architecture.testing)).toBeInTheDocument()
    expect(screen.getByText('部署')).toBeInTheDocument()
    expect(screen.getByText(architecture.deployment)).toBeInTheDocument()
  })

  it('shows directory structure section', () => {
    render(<ArchitectureCard />)
    expect(screen.getByText('目录结构')).toBeInTheDocument()
  })

  it('shows root-level folders in tree', () => {
    render(<ArchitectureCard />)
    // Root folders should be visible (depth 0, initially expanded)
    expect(screen.getByText(/frontend/)).toBeInTheDocument()
    expect(screen.getByText(/backend/)).toBeInTheDocument()
  })
})
