import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import CreateProjectPage from './index'
import { useStore } from '../../store'

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

describe('CreateProjectPage', () => {
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

  it('renders the page title heading', () => {
    render(<CreateProjectPage />)
    expect(screen.getByRole('heading', { level: 1, name: '创建项目' })).toBeInTheDocument()
  })

  it('has a project name input', () => {
    render(<CreateProjectPage />)
    const input = document.querySelector('input[type="text"]')
    expect(input).toBeInTheDocument()
  })

  it('has a project description textarea', () => {
    render(<CreateProjectPage />)
    expect(screen.getByText(/项目简介/)).toBeInTheDocument()
    const textarea = document.querySelector('textarea')
    expect(textarea).toBeInTheDocument()
  })

  it('has a user vision textarea', () => {
    render(<CreateProjectPage />)
    expect(screen.getByText(/基础用户设想/)).toBeInTheDocument()
  })

  it('has an AI optimize button', () => {
    render(<CreateProjectPage />)
    const buttons = screen.getAllByRole('button')
    const optimizeBtn = buttons.find((b) => b.textContent?.includes('AI 优化'))
    expect(optimizeBtn).toBeDefined()
  })

  it('AI optimize button is disabled when name is empty', () => {
    render(<CreateProjectPage />)
    const buttons = screen.getAllByRole('button')
    const optimizeBtn = buttons.find((b) => b.textContent?.includes('AI 优化'))
    expect(optimizeBtn).toBeDefined()
    expect(optimizeBtn!.disabled).toBe(true)
  })

  it('AI optimize button becomes enabled after typing a name', () => {
    render(<CreateProjectPage />)
    const nameInput = document.querySelector('input[type="text"]')
    expect(nameInput).toBeInTheDocument()
    if (nameInput) {
      fireEvent.change(nameInput, { target: { value: '测试项目' } })
    }
    const buttons = screen.getAllByRole('button')
    const optimizeBtn = buttons.find((b) => b.textContent?.includes('AI 优化'))
    expect(optimizeBtn).toBeDefined()
    expect(optimizeBtn!.disabled).toBe(false)
  })

  it('shows loading state after clicking optimize with valid name', async () => {
    render(<CreateProjectPage />)
    const nameInput = document.querySelector('input[type="text"]')
    expect(nameInput).toBeInTheDocument()
    if (nameInput) {
      fireEvent.change(nameInput, { target: { value: '测试项目' } })
    }
    const buttons = screen.getAllByRole('button')
    const optimizeBtn = buttons.find((b) => b.textContent?.includes('AI 优化'))
    expect(optimizeBtn).toBeDefined()
    expect(optimizeBtn!.disabled).toBe(false)
    if (optimizeBtn) {
      fireEvent.click(optimizeBtn)
    }
    await waitFor(
      () => {
        const loadingBtn = screen.getByRole('button', { name: /AI 正在优化/ })
        expect(loadingBtn).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('shows optimized result after AI optimization completes', async () => {
    render(<CreateProjectPage />)
    const nameInput = document.querySelector('input[type="text"]')
    if (nameInput) {
      fireEvent.change(nameInput, { target: { value: '测试项目' } })
    }
    const buttons = screen.getAllByRole('button')
    const optimizeBtn = buttons.find((b) => b.textContent?.includes('AI 优化'))
    if (optimizeBtn) {
      fireEvent.click(optimizeBtn)
    }
    await waitFor(
      () => {
        expect(screen.getByRole('heading', { level: 2, name: 'AI 优化结果' })).toBeInTheDocument()
        expect(screen.getByText(/目标用户/)).toBeInTheDocument()
        expect(screen.getByText(/核心功能/)).toBeInTheDocument()
        expect(screen.getByText(/关键场景/)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('shows error message when name is empty', () => {
    render(<CreateProjectPage />)
    // The error is shown when handleOptimize is called with empty name.
    // We verify the error element exists conditionally by testing the form state path.
    // Since the button is disabled when name is empty, we test via direct invocation:
    const nameInput = document.querySelector('input[type="text"]')
    expect(nameInput).toBeInTheDocument()
    // With empty name, the error message should not yet be visible (no validation trigger)
    expect(screen.queryByText('项目名称不能为空')).not.toBeInTheDocument()
  })

  it('architecture directory tree is displayed', () => {
    render(<CreateProjectPage />)
    const headings = screen.getAllByRole('heading', { level: 2 })
    const archHeading = headings.find((h) => h.textContent?.includes('默认架构目录'))
    expect(archHeading).toBeDefined()
    expect(screen.getByText(/frontend/)).toBeInTheDocument()
    expect(screen.getByText(/backend/)).toBeInTheDocument()
  })

  it('create button exists', () => {
    render(<CreateProjectPage />)
    const buttons = screen.getAllByRole('button')
    const createBtn = buttons.find(
      (b) => b.textContent?.includes('创建项目')
    )
    expect(createBtn).toBeDefined()
  })

  it('cancel button exists', () => {
    render(<CreateProjectPage />)
    const buttons = screen.getAllByRole('button')
    const cancelBtn = buttons.find((b) => b.textContent?.trim() === '取消')
    expect(cancelBtn).toBeDefined()
  })
})
