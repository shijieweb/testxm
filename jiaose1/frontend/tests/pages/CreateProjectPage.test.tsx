import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { CreateProjectPage } from '../../src/pages/CreateProjectPage'
import { useSettingsStore } from '../../src/store/settingsStore'
import { useProjectsStore } from '../../src/store/projectsStore'

vi.mock('../../src/store/projectsStore', () => ({
  useProjectsStore: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('CreateProjectPage', () => {
  beforeEach(() => {
    useSettingsStore.persist.clearStorage()
    useSettingsStore.getState().resetSettings()
    mockNavigate.mockClear()
    vi.mocked(useProjectsStore).mockReturnValue({
      createProject: vi.fn(),
      getProjects: () => [],
      deleteProject: vi.fn(),
    } as any)
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    // 只恢复自己创建的 mock，不清 matchMedia
    vi.mocked(useProjectsStore).mockRestore?.()
  })

  it('TC-012-01: renders form and architecture tree', () => {
    render(
      <MemoryRouter initialEntries={['/projects/create']}>
        <Routes>
          <Route path="/projects/create" element={<CreateProjectPage />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByLabelText(/项目名称/)).toBeInTheDocument()
    expect(screen.getByText('project-root/')).toBeInTheDocument()
  })

  it('TC-012-02: full create flow', async () => {
    const mockCreate = vi.fn()
    vi.mocked(useProjectsStore).mockReturnValue({
      createProject: mockCreate,
      getProjects: () => [],
      deleteProject: vi.fn(),
    } as any)

    render(
      <MemoryRouter initialEntries={['/projects/create']}>
        <Routes>
          <Route path="/projects/create" element={<CreateProjectPage />} />
        </Routes>
      </MemoryRouter>
    )

    const nameInput = screen.getByPlaceholderText('输入项目名称') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'My New Project' } })

    const createBtn = screen.getByRole('button', { name: /创建项目/ })
    fireEvent.click(createBtn)

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ name: 'My New Project' }))
    })
  })

  it('TC-012-03: fixed bottom action bar is visible', () => {
    render(
      <MemoryRouter initialEntries={['/projects/create']}>
        <Routes>
          <Route path="/projects/create" element={<CreateProjectPage />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByRole('button', { name: '创建项目' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument()
  })

  it('TC-012-04: shows AI not configured hint when AI not set up', () => {
    render(
      <MemoryRouter initialEntries={['/projects/create']}>
        <Routes>
          <Route path="/projects/create" element={<CreateProjectPage />} />
        </Routes>
      </MemoryRouter>
    )
    const container = document.querySelector('.bg-orange-50')
    expect(container).toBeInTheDocument()
    expect(container!.textContent).toContain('配置')
    expect(container!.textContent).toContain('AI')
    expect(container!.textContent).toContain('模型')
  })

  it('TC-012-05: AI optimize button triggers callOptimizeProject and updates state', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        targetUsers: ['Developer'],
        coreFunctions: ['API'],
        keyScenarios: ['Login'],
        description: 'An API project',
      }),
    })

    render(
      <MemoryRouter initialEntries={['/projects/create']}>
        <Routes>
          <Route path="/projects/create" element={<CreateProjectPage />} />
        </Routes>
      </MemoryRouter>
    )

    const nameInput = screen.getByPlaceholderText('输入项目名称') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'Test Project' } })

    const form = document.querySelector('form')!
    const optimizeBtn = form.querySelector<HTMLButtonElement>('button[type="button"]')
    expect(optimizeBtn).toBeInTheDocument()
    expect(optimizeBtn!.disabled).toBe(false)
    fireEvent.click(optimizeBtn!)

    await waitFor(() => {
      expect(screen.getByText('AI 优化结果')).toBeInTheDocument()
    })
  })

  it('TC-012-06: cancel button navigates to settings', () => {
    render(
      <MemoryRouter initialEntries={['/projects/create']}>
        <Routes>
          <Route path="/projects/create" element={<CreateProjectPage />} />
        </Routes>
      </MemoryRouter>
    )

    const cancelBtn = screen.getByRole('button', { name: '取消' })
    fireEvent.click(cancelBtn)
    expect(mockNavigate).toHaveBeenCalledWith('/settings')
  })

  it('TC-012-07: hides AI hint when AI is configured', () => {
    const store = useSettingsStore.getState()
    store.setAiModel('https://api.test.com', 'sk-test', 'gpt-4o')

    render(
      <MemoryRouter initialEntries={['/projects/create']}>
        <Routes>
          <Route path="/projects/create" element={<CreateProjectPage />} />
        </Routes>
      </MemoryRouter>
    )

    const container = document.querySelector('.bg-orange-50')
    expect(container).not.toBeInTheDocument()
  })

  it('TC-012-08: async optimize sets result state and clears loading', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        targetUsers: ['User'],
        coreFunctions: ['Func'],
        keyScenarios: ['Scenario'],
        description: 'Desc',
      }),
    })

    render(
      <MemoryRouter initialEntries={['/projects/create']}>
        <Routes>
          <Route path="/projects/create" element={<CreateProjectPage />} />
        </Routes>
      </MemoryRouter>
    )

    const nameInput = screen.getByPlaceholderText('输入项目名称') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'Test Project' } })

    const form = document.querySelector('form')!
    const optimizeBtn = form.querySelector<HTMLButtonElement>('button[type="button"]')
    expect(optimizeBtn).toBeInTheDocument()
    fireEvent.click(optimizeBtn!)

    await waitFor(() => {
      expect(screen.getByText('AI 优化结果')).toBeInTheDocument()
    })
  })

  it('TC-012-09: create button triggers navigation after delay', async () => {
    vi.useRealTimers()
    const mockCreate = vi.fn()
    vi.mocked(useProjectsStore).mockReturnValue({
      createProject: mockCreate,
      getProjects: () => [],
      deleteProject: vi.fn(),
    } as any)

    render(
      <MemoryRouter initialEntries={['/projects/create']}>
        <Routes>
          <Route path="/projects/create" element={<CreateProjectPage />} />
        </Routes>
      </MemoryRouter>
    )

    const nameInput = screen.getByPlaceholderText('输入项目名称') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'New Project' } })

    const createBtn = screen.getByRole('button', { name: /创建项目/ })
    fireEvent.click(createBtn)

    await new Promise<void>((r) => setTimeout(r, 600))
    expect(mockCreate).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/projects')
  }, 10000)

  it('TC-012-10: handleOptimize sets optimizing true then false after completion', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        targetUsers: ['User'],
        coreFunctions: ['Func'],
        keyScenarios: ['Scenario'],
        description: 'Desc',
      }),
    })

    render(
      <MemoryRouter initialEntries={['/projects/create']}>
        <Routes>
          <Route path="/projects/create" element={<CreateProjectPage />} />
        </Routes>
      </MemoryRouter>
    )

    const nameInput = screen.getByPlaceholderText('输入项目名称') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'Async Test' } })

    const form = document.querySelector('form')!
    const optimizeBtn = form.querySelector<HTMLButtonElement>('button[type="button"]')!
    fireEvent.click(optimizeBtn)

    expect(optimizeBtn).toHaveTextContent('AI 优化中...')

    await waitFor(() => {
      expect(optimizeBtn).toHaveTextContent('重新 AI 优化')
    })
  })

  it('TC-012-11: handleOptimize returns early when name is empty', async () => {
    render(
      <MemoryRouter initialEntries={['/projects/create']}>
        <Routes>
          <Route path="/projects/create" element={<CreateProjectPage />} />
        </Routes>
      </MemoryRouter>
    )

    const form = document.querySelector('form')!
    const optimizeBtn = form.querySelector<HTMLButtonElement>('button[type="button"]')!
    expect(optimizeBtn.disabled).toBe(true)
  })

  it('TC-012-12: handleCreate navigates to /projects after delay', async () => {
    const mockCreate = vi.fn()
    vi.mocked(useProjectsStore).mockReturnValue({
      createProject: mockCreate,
      getProjects: () => [],
      deleteProject: vi.fn(),
    } as any)

    render(
      <MemoryRouter initialEntries={['/projects/create']}>
        <Routes>
          <Route path="/projects/create" element={<CreateProjectPage />} />
        </Routes>
      </MemoryRouter>
    )

    const nameInput = screen.getByPlaceholderText('输入项目名称') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'Nav Test Project' } })

    const createBtn = screen.getByRole('button', { name: /创建项目/ })
    fireEvent.click(createBtn)

    await new Promise((r) => setTimeout(r, 600))
    expect(mockNavigate).toHaveBeenCalledWith('/projects')
  })

  it('TC-012-13: handleCreate returns early when name is empty (no navigation)', async () => {
    const mockCreate = vi.fn()
    vi.mocked(useProjectsStore).mockReturnValue({
      createProject: mockCreate,
      getProjects: () => [],
      deleteProject: vi.fn(),
    } as any)

    render(
      <MemoryRouter initialEntries={['/projects/create']}>
        <Routes>
          <Route path="/projects/create" element={<CreateProjectPage />} />
        </Routes>
      </MemoryRouter>
    )

    const createBtn = screen.getByRole('button', { name: /创建项目/ })
    fireEvent.click(createBtn)

    await new Promise((r) => setTimeout(r, 100))
    expect(mockCreate).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
