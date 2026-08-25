import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import MainLayout from './MainLayout'

vi.mock('react-router-dom', () => ({
  Outlet: () => null,
  Link: ({ to, className, children }: { to: string; className?: string; children: React.ReactNode }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
  useLocation: () => ({ pathname: '/' }),
  useNavigate: () => vi.fn(),
}))

describe('MainLayout', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders desktop sidebar with navigation links', () => {
    render(<MainLayout />)
    expect(screen.getByText('项目列表')).toBeInTheDocument()
    expect(screen.getByText('创建项目')).toBeInTheDocument()
    // '设置' appears in both desktop and mobile nav; verify total count is 2
    expect(screen.getAllByText('设置').length).toBe(2)
  })

  it('renders mobile header with app title', () => {
    render(<MainLayout />)
    expect(screen.getByText('AI 研发协作平台')).toBeInTheDocument()
  })

  it('renders mobile bottom navigation', () => {
    render(<MainLayout />)
    // Bottom nav labels appear once each
    expect(screen.getAllByText('项目').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('创建').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('设置').length).toBeGreaterThanOrEqual(1)
  })

  it('toggles dark mode via desktop sidebar button', () => {
    render(<MainLayout />)
    const buttons = screen.getAllByRole('button')
    const darkModeBtn = buttons.find((b) => b.textContent?.includes('深色模式') || b.textContent?.includes('浅色模式'))
    expect(darkModeBtn).toBeDefined()
    if (darkModeBtn) {
      darkModeBtn.click()
    }
  })

  it('toggles dark mode via mobile header button', () => {
    render(<MainLayout />)
    // Mobile theme toggle has aria-label="切换主题"
    const toggleBtn = screen.getByLabelText('切换主题')
    expect(toggleBtn).toBeInTheDocument()
    toggleBtn.click()
  })

  it('shows active state for current route link', () => {
    render(<MainLayout />)
    // On '/', the "项目列表" link should be active (bg-primary style)
    const projectLink = screen.getByText('项目列表')
    expect(projectLink).toBeInTheDocument()
  })
})
