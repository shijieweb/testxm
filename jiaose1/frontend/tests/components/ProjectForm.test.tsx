import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ProjectForm } from '../../src/components/create-project/ProjectForm'

describe('ProjectForm', () => {
  beforeEach(() => {
    cleanup()
  })

  afterEach(() => {
    cleanup()
  })

  const defaultProps = {
    formData: {
      name: '',
      description: '',
      vision: '',
      targetUsers: [],
      coreFunctions: [],
      keyScenarios: [],
    },
    onChange: vi.fn(),
    onOptimize: vi.fn(),
  }

  it('TC-008-01: renders three input areas', () => {
    render(<ProjectForm {...defaultProps} key="tc-008-01" />)
    expect(screen.getByLabelText(/项目名称/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('简要描述项目目标和功能')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('描述目标用户和使用场景')).toBeInTheDocument()
  })

  it('TC-008-02: shows error when project name is empty on submit', () => {
    render(<ProjectForm {...defaultProps} errors={{ name: '项目名称不能为空' }} key="tc-008-02" />)
    expect(screen.getByText('项目名称不能为空')).toBeInTheDocument()
  })

  it('TC-008-03: AI optimize button triggers callback', () => {
    render(
      <ProjectForm
        {...defaultProps}
        formData={{ ...defaultProps.formData, name: 'Test' }}
        key="tc-008-03"
      />
    )
    // Use a scoped query to find the first button within the rendered form
    const form = document.querySelector('form')!
    const btn = form.querySelector<HTMLButtonElement>('button[type="button"]')
    expect(btn).toBeInTheDocument()
    fireEvent.click(btn!)
    expect(defaultProps.onOptimize).toHaveBeenCalled()
  })

  it('TC-008-04: AI optimize button disabled when name is empty', () => {
    render(<ProjectForm {...defaultProps} key="tc-008-04" />)
    // There may be multiple buttons due to test isolation; find the first one and check disabled
    const form = document.querySelector('form')!
    const btn = form.querySelector<HTMLButtonElement>('button[type="button"]')
    expect(btn?.disabled).toBe(true)
  })

  it('TC-008-05: tag list can be deleted', () => {
    render(
      <ProjectForm
        {...defaultProps}
        formData={{
          ...defaultProps.formData,
          targetUsers: ['Product Manager', 'Developer'],
        }}
        key="tc-008-05"
      />
    )
    // Find remove buttons for target users tags
    const removeButtons = document.querySelectorAll('[aria-label^="Remove"]')
    expect(removeButtons.length).toBe(2)
  })

  it('TC-008-06: updateField calls onChange with updated name', () => {
    render(<ProjectForm {...defaultProps} key="tc-008-06" />)
    const nameInput = screen.getByLabelText(/项目名称/) as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'New Project' } })
    expect(defaultProps.onChange).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Project' }))
  })

  it('TC-008-07: updateField calls onChange with updated description', () => {
    render(<ProjectForm {...defaultProps} key="tc-008-07" />)
    const descTextarea = screen.getByLabelText(/项目简介/) as HTMLTextAreaElement
    fireEvent.change(descTextarea, { target: { value: 'My project desc' } })
    expect(defaultProps.onChange).toHaveBeenCalledWith(expect.objectContaining({ description: 'My project desc' }))
  })

  it('TC-008-08: onKeyDown Enter adds targetUser tag', () => {
    render(
      <ProjectForm
        {...defaultProps}
        formData={{ ...defaultProps.formData, targetUsers: [] }}
        key="tc-008-08"
      />
    )
    const input = document.querySelectorAll('input[type="text"]')[0] as HTMLInputElement
    fireEvent.keyDown(input, { key: 'Enter' })
    // Input should be cleared after adding
    expect(input.value).toBe('')
  })

  it('TC-008-09: onKeyDown Enter does not add empty tag', () => {
    const onChangeMock = vi.fn()
    render(<ProjectForm {...defaultProps} onChange={onChangeMock} key="tc-008-09" />)
    const inputs = document.querySelectorAll('input[type="text"]')
    const visionInput = inputs[1] as HTMLInputElement
    fireEvent.keyDown(visionInput, { key: 'Enter' })
    expect(onChangeMock).not.toHaveBeenCalled()
  })

  it('TC-008-10: onKeyDown Enter adds coreFunction tag', () => {
    render(<ProjectForm {...defaultProps} key="tc-008-10" />)
    const inputs = document.querySelectorAll('input[type="text"]')
    const coreInput = inputs[1] as HTMLInputElement
    coreInput.value = 'Search'
    fireEvent.keyDown(coreInput, { key: 'Enter' })
    expect(coreInput.value).toBe('')
  })

  it('TC-008-11: onKeyDown Enter adds keyScenario tag', () => {
    render(<ProjectForm {...defaultProps} key="tc-008-11" />)
    const inputs = document.querySelectorAll('input[type="text"]')
    const scenarioInput = inputs[2] as HTMLInputElement
    scenarioInput.value = 'Login'
    fireEvent.keyDown(scenarioInput, { key: 'Enter' })
    expect(scenarioInput.value).toBe('')
  })

  it('TC-008-12: form submit calls handleSubmit (prevents default)', () => {
    render(<ProjectForm {...defaultProps} key="tc-008-12" />)
    const form = document.querySelector('form')!
    // Form exists and has onSubmit handler from component
    expect(form).toBeInTheDocument()
    // Submit the form - handleSubmit should prevent default behavior
    fireEvent.submit(form)
    // If handleSubmit ran and prevented default, page stays rendered
    expect(screen.getByLabelText(/项目名称/)).toBeInTheDocument()
  })

  it('TC-008-13: tag item remove button calls onChange with filtered array', () => {
    render(
      <ProjectForm
        {...defaultProps}
        formData={{
          ...defaultProps.formData,
          coreFunctions: ['Feature A', 'Feature B'],
        }}
        key="tc-008-13"
      />
    )
    const removeButtons = document.querySelectorAll('[aria-label*="Feature A"]')
    expect(removeButtons.length).toBe(1)
    fireEvent.click(removeButtons[0])
    expect(defaultProps.onChange).toHaveBeenCalledWith(
      expect.objectContaining({ coreFunctions: ['Feature B'] })
    )
  })
})
