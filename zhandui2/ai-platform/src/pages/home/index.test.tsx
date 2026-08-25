import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import HomePage from './index'
import { useStore } from '../../store'

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }: any) =>
    require('react').createElement('a', { href: to, 'data-to': to }, children),
}))

describe('HomePage', () => {
  beforeEach(() => {
    useStore.setState({ projects: [] })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the page title', () => {
    render(<HomePage />)
    expect(screen.getByRole('heading', { level: 1, name: '项目列表' })).toBeInTheDocument()
  })

  it('has a create project button', () => {
    render(<HomePage />)
    // Link is mocked as <a>, so use getByRole('link') or getByText
    expect(screen.getByRole('link', { name: '新建项目' })).toBeInTheDocument()
  })

  it('shows empty state when no projects exist', () => {
    render(<HomePage />)
    expect(screen.getByText('还没有项目')).toBeInTheDocument()
    expect(screen.getByText(/创建第一个项目/)).toBeInTheDocument()
  })

  it('shows project count in subtitle', () => {
    render(<HomePage />)
    expect(screen.getByText(/0 个项目/)).toBeInTheDocument()
  })

  it('shows projects when they exist', () => {
    useStore.setState({
      projects: [
        {
          id: '1', name: '项目A', description: '描述A',
          targetUsers: ['用户A'], coreFunctions: ['功能A'], keyScenarios: ['场景A'],
          createdAt: '2026-01-01T00:00:00Z',
          architectureSnapshot: useStore.getState().architecture,
        },
      ],
    })
    render(<HomePage />)
    expect(screen.getByText('项目A')).toBeInTheDocument()
    expect(screen.getByText('描述A')).toBeInTheDocument()
  })

  it('deletes a project on confirm', () => {
    useStore.setState({
      projects: [
        {
          id: '1', name: '待删除', description: '将被删除',
          targetUsers: [], coreFunctions: [], keyScenarios: [],
          createdAt: '2026-01-01T00:00:00Z',
          architectureSnapshot: useStore.getState().architecture,
        },
      ],
    })
    render(<HomePage />)
    const nameEl = screen.getByText('待删除')
    const card = nameEl.closest('[class*="group"]')
    expect(card).toBeDefined()
    if (card) {
      fireEvent.mouseEnter(card)
      const deleteBtn = screen.getByTestId('trash-icon').closest('button')
      expect(deleteBtn).toBeDefined()
      if (deleteBtn) {
        fireEvent.click(deleteBtn)
        const confirmBtn = screen.getByRole('button', { name: '确认删除' })
        expect(confirmBtn).toBeInTheDocument()
        fireEvent.click(confirmBtn)
        expect(screen.queryByText('待删除')).not.toBeInTheDocument()
      }
    }
  })
})
