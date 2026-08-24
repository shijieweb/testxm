import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { Header, Sidebar, Layout } from '../../src/components/layout'
import { useMediaQuery } from '../../src/hooks/useMediaQuery'

vi.mock('../../src/hooks/useMediaQuery', () => ({
  useMediaQuery: vi.fn(),
}))

describe('Header', () => {
  beforeEach(() => {
    cleanup()
    vi.mocked(useMediaQuery).mockReturnValue(false) // mobile by default
  })
  afterEach(() => {
    cleanup()
  })

  it('TC-021-01: renders title on mobile', () => {
    render(<Header title="设置" />)
    expect(screen.getByText('设置')).toBeInTheDocument()
    // Menu button renders when isDesktop=false regardless of onMenuClick prop
    expect(screen.queryByLabelText('Open menu')).toBeInTheDocument()
  })

  it('TC-021-02: shows menu button on mobile when onMenuClick provided', () => {
    const handleClick = vi.fn()
    render(<Header title="创建项目" onMenuClick={handleClick} />)
    const menuBtn = screen.getByLabelText('Open menu')
    expect(menuBtn).toBeInTheDocument()
    fireEvent.click(menuBtn)
    expect(handleClick).toHaveBeenCalled()
  })

  it('TC-021-03: no menu button on desktop', () => {
    vi.mocked(useMediaQuery).mockReturnValue(true)
    render(<Header title="设置" />)
    expect(screen.queryByLabelText('Open menu')).not.toBeInTheDocument()
    expect(screen.getByText('设置')).toBeInTheDocument()
  })
})

describe('Sidebar', () => {
  beforeEach(() => {
    cleanup()
  })
  afterEach(() => {
    cleanup()
  })

  it('TC-021-04: renders sidebar items', () => {
    const handleClick = vi.fn()
    render(<Sidebar activeItem="settings" onItemClick={handleClick} />)
    expect(screen.getByText('设置')).toBeInTheDocument()
    expect(screen.getByText('创建项目')).toBeInTheDocument()
  })

  it('TC-021-05: highlights active item', () => {
    const handleClick = vi.fn()
    render(<Sidebar activeItem="create-project" onItemClick={handleClick} />)
    const createItem = screen.getByText('创建项目').closest('button')
    expect(createItem).toHaveClass('bg-primary-50', 'text-primary-700')
  })

  it('TC-021-06: click item triggers callback', () => {
    const handleClick = vi.fn()
    render(<Sidebar activeItem="settings" onItemClick={handleClick} />)
    fireEvent.click(screen.getByText('创建项目'))
    expect(handleClick).toHaveBeenCalledWith('create-project')
  })
})

describe('Layout', () => {
  beforeEach(() => {
    cleanup()
  })
  afterEach(() => {
    cleanup()
  })

  it('TC-021-07: renders mobile layout without sidebar', () => {
    vi.mocked(useMediaQuery).mockReturnValue(false)
    render(
      <Layout title="设置">
        <div>Content</div>
      </Layout>
    )
    expect(screen.getByRole('heading', { level: 1, name: '设置' })).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
    // No sidebar on mobile
    expect(screen.queryByText('AI 需求平台')).not.toBeInTheDocument()
  })

  it('TC-021-08: renders desktop layout with sidebar when onNavigate provided', () => {
    vi.mocked(useMediaQuery).mockReturnValue(true)
    render(
      <Layout title="设置" onNavigate={() => {}}>
        <div>Content</div>
      </Layout>
    )
    expect(screen.getByRole('heading', { level: 1, name: '设置' })).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
    // Sidebar should be visible on desktop
    expect(screen.getByText('AI 需求平台')).toBeInTheDocument()
    // Use getByRole to disambiguate from the heading with the same text
    expect(screen.getByRole('button', { name: '设置' })).toBeInTheDocument()
    expect(screen.getByText('创建项目')).toBeInTheDocument()
    expect(screen.getByText('专家协作')).toBeInTheDocument()
  })

  it('TC-021-09: desktop layout without sidebar when onNavigate not provided', () => {
    vi.mocked(useMediaQuery).mockReturnValue(true)
    render(
      <Layout title="设置">
        <div>Content</div>
      </Layout>
    )
    expect(screen.getByRole('heading', { level: 1, name: '设置' })).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
    // No sidebar when onNavigate is not provided
    expect(screen.queryByText('AI 需求平台')).not.toBeInTheDocument()
  })

  it('TC-021-10: header has sticky positioning class', () => {
    vi.mocked(useMediaQuery).mockReturnValue(false)
    render(<Layout title="创建项目"><div>Content</div></Layout>)
    const header = document.querySelector('header')
    expect(header).toBeInTheDocument()
    expect(header).toHaveClass('sticky')
  })
})
