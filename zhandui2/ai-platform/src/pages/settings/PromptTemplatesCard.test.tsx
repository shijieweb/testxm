import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { PromptTemplatesCard } from './PromptTemplatesCard'
import { useStore } from '../../store'

describe('PromptTemplatesCard', () => {
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
    render(<PromptTemplatesCard />)
    expect(screen.getByRole('heading', { level: 2, name: '提示词模板' })).toBeInTheDocument()
  })

  it('shows all 7 prompt template items', () => {
    render(<PromptTemplatesCard />)
    const prompts = useStore.getState().prompts
    // Count numeric badge spans directly — each prompt has exactly one .badge-secondary span
    const badgeSpans = document.querySelectorAll<HTMLSpanElement>('.badge-secondary')
    expect(badgeSpans.length).toBe(prompts.length)
  })

  it('each prompt item shows its purpose summary', () => {
    render(<PromptTemplatesCard />)
    const prompts = useStore.getState().prompts
    prompts.forEach((p) => {
      expect(screen.getByText(p.purpose)).toBeInTheDocument()
    })
  })

  it('clicking an expanded prompt item collapses it', () => {
    // Item 1 (index 0) is expanded by default (expandedId = '1')
    render(<PromptTemplatesCard />)
    const prompts = useStore.getState().prompts
    const firstPrompt = prompts[0]
    const buttons = screen.getAllByRole('button')
    const trigger = buttons.find((b) => b.textContent?.includes(firstPrompt.name))
    expect(trigger).toBeDefined()
    // First item is expanded — clicking it should COLLAPSE (content disappears)
    if (trigger) {
      fireEvent.click(trigger)
      expect(screen.queryByText(firstPrompt.content)).not.toBeInTheDocument()
    }
  })

  it('clicking a collapsed item expands it again', async () => {
    // Use item 3 (index 2, id='3') which is NOT expanded by default
    render(<PromptTemplatesCard />)
    const prompts = useStore.getState().prompts
    const thirdPrompt = prompts[2]
    const buttons = screen.getAllByRole('button')
    const trigger = buttons.find((b) => b.textContent?.includes(thirdPrompt.name))
    expect(trigger).toBeDefined()
    if (trigger) {
      // Click to expand
      fireEvent.click(trigger)
      // Use regex to match the beginning of the content (avoids multiline issues)
      await waitFor(() => {
        const contentRegex = new RegExp(thirdPrompt.content.slice(0, 20))
        expect(screen.getByText(contentRegex)).toBeInTheDocument()
      })
      // Click again to collapse
      fireEvent.click(trigger)
      expect(screen.queryByText(thirdPrompt.content)).not.toBeInTheDocument()
    }
  })

  it('copy button copies content to clipboard', async () => {
    const mockCopy = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockCopy },
      writable: true,
      configurable: true,
    })

    render(<PromptTemplatesCard />)
    const prompts = useStore.getState().prompts
    // Use prompt at index 2 (id='3') — not expanded by default
    const prompt = prompts[2]
    const buttons = screen.getAllByRole('button')
    const trigger = buttons.find((b) => b.textContent?.includes(prompt.name))
    expect(trigger).toBeDefined()
    if (trigger) {
      fireEvent.click(trigger)
    }

    await waitFor(() => {
      const contentRegex = new RegExp(prompt.content.slice(0, 20))
      expect(screen.getByText(contentRegex)).toBeInTheDocument()
    })

    // Find copy button by title attribute
    const copyBtn = Array.from(document.querySelectorAll('button[title="复制"]')).pop()
    expect(copyBtn).toBeDefined()
    if (copyBtn) {
      fireEvent.click(copyBtn as HTMLElement)
      await waitFor(() => {
        expect(mockCopy).toHaveBeenCalledWith(prompt.content)
      })
    }

    // Restore original clipboard
    delete (navigator as any).clipboard
  })

  it('shows "只读" badge in card header', () => {
    const { container } = render(<PromptTemplatesCard />)
    const badges = container.querySelectorAll('.badge')
    const readonlyBadge = Array.from(badges).some((el) => el.textContent?.includes('只读'))
    expect(readonlyBadge).toBe(true)
  })
})
