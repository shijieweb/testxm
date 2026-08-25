import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { AiModelCard } from './AiModelCard'
import { useStore } from '../../store'

describe('AiModelCard', () => {
  beforeEach(() => {
    useStore.setState({
      aiModel: { apiUrl: '', apiKey: '', modelName: '' },
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the card title', () => {
    render(<AiModelCard />)
    expect(screen.getByRole('heading', { level: 2, name: 'AI 模型配置' })).toBeInTheDocument()
  })

  it('renders API URL input field', () => {
    render(<AiModelCard />)
    const inputs = screen.getAllByRole('textbox')
    expect(inputs.length).toBeGreaterThanOrEqual(1)
  })

  it('renders API Key input field', () => {
    render(<AiModelCard />)
    const keyInput = document.querySelector('input[placeholder*="sk-"]')
    expect(keyInput).toBeInTheDocument()
  })

  it('renders Model Name input field', () => {
    render(<AiModelCard />)
    const inputs = screen.getAllByRole('textbox')
    expect(inputs.length).toBeGreaterThanOrEqual(1)
  })

  it('shows warning when AI model is not configured', () => {
    render(<AiModelCard />)
    expect(screen.getByText(/未配置 AI 模型/)).toBeInTheDocument()
  })

  it('testConnection button is disabled when fields are empty', () => {
    render(<AiModelCard />)
    const testBtn = screen.getByRole('button', { name: '测试连接' })
    expect(testBtn).toBeDisabled()
  })

  it('testConnection button is enabled when all fields are filled', () => {
    useStore.setState({
      aiModel: { apiUrl: 'https://api.test.com', apiKey: 'sk-test', modelName: 'gpt-4o' },
    })
    render(<AiModelCard />)
    const testBtn = screen.getByRole('button', { name: '测试连接' })
    expect(testBtn).not.toBeDisabled()
  })

  it('updating input fields updates store', () => {
    render(<AiModelCard />)
    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: 'https://api.openai.com/v1' } })
    const { aiModel } = useStore.getState()
    expect(aiModel.apiUrl).toBe('https://api.openai.com/v1')
  })

  it('testConnection shows success message after click', async () => {
    useStore.setState({
      aiModel: { apiUrl: 'https://api.test.com', apiKey: 'sk-test', modelName: 'gpt-4o' },
    })
    render(<AiModelCard />)
    const testBtn = screen.getByRole('button', { name: '测试连接' })
    fireEvent.click(testBtn)
    await waitFor(
      () => {
        expect(screen.getByText('连接成功')).toBeInTheDocument()
      },
      { timeout: 2000 }
    )
  })

  it('key input should toggle between password and text', () => {
    render(<AiModelCard />)
    // Locate the API Key input by its placeholder
    const keyInput = document.querySelector('input[placeholder*="sk-"]') as HTMLInputElement
    expect(keyInput).toBeDefined()
    expect(keyInput!.type).toBe('password')

    const showBtn = screen.getByRole('button', { name: '显示' })
    fireEvent.click(showBtn)

    expect(keyInput).toHaveAttribute('type', 'text')
  })
})
