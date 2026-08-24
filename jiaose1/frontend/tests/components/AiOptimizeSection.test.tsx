import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { AiOptimizeSection } from '../../src/components/create-project/AiOptimizeSection'
import type { OptimizedResult } from '../../src/types'

describe('AiOptimizeSection', () => {
  beforeEach(() => {
    cleanup()
  })
  afterEach(() => {
    cleanup()
  })

  const mockResult: OptimizedResult = {
    targetUsers: ['Product Manager', 'Developer'],
    coreFunctions: ['需求管理', '文档生成'],
    keyScenarios: ['日常需求录入', '批量导入'],
    description: '这是一个AI驱动的需求管理平台',
  }

  it('TC-020-01: returns null when no result and not loading', () => {
    const { container } = render(
      <AiOptimizeSection result={null} loading={false} />
    )
    // Should render nothing (no card title)
    expect(container.firstChild).toBeNull()
  })

  it('TC-020-02: shows loading spinner', () => {
    render(<AiOptimizeSection result={null} loading={true} key="tc-020-02" />)
    // Loading spinner element exists
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
    // Should not show result content yet
    expect(screen.queryByText('项目简介')).not.toBeInTheDocument()
  })

  it('TC-020-03: displays optimized result with all sections', () => {
    render(
      <AiOptimizeSection result={mockResult} loading={false} key="tc-020-03" />
    )
    expect(screen.getByText('AI 优化结果')).toBeInTheDocument()
    expect(screen.getByText('项目简介')).toBeInTheDocument()
    expect(screen.getByText(mockResult.description)).toBeInTheDocument()
    expect(screen.getByText('目标用户')).toBeInTheDocument()
    expect(screen.getByText('核心功能')).toBeInTheDocument()
    expect(screen.getByText('关键场景')).toBeInTheDocument()
    // Check tags rendered
    mockResult.targetUsers.forEach((tag) => {
      expect(screen.getByText(tag)).toBeInTheDocument()
    })
    mockResult.coreFunctions.forEach((tag) => {
      expect(screen.getByText(tag)).toBeInTheDocument()
    })
    mockResult.keyScenarios.forEach((tag) => {
      expect(screen.getByText(tag)).toBeInTheDocument()
    })
  })

  it('TC-020-04: handles empty arrays in result', () => {
    const emptyResult: OptimizedResult = {
      targetUsers: [],
      coreFunctions: [],
      keyScenarios: [],
      description: 'Empty result',
    }
    render(
      <AiOptimizeSection result={emptyResult} loading={false} key="tc-020-04" />
    )
    expect(screen.getByText('项目简介')).toBeInTheDocument()
    expect(screen.getByText('Empty result')).toBeInTheDocument()
    expect(screen.getByText('目标用户')).toBeInTheDocument()
  })

  it('TC-020-05: early return null path verified', () => {
    const { container } = render(
      <AiOptimizeSection result={null} loading={false} key="tc-020-05" />
    )
    expect(container.firstChild).toBeNull()
  })
})
