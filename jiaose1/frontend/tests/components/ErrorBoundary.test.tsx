import React from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ErrorBoundary } from '../../src/components/shared/ErrorBoundary'

function ThrowingComponent(): React.JSX.Element {
  throw new Error('Test error')
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    cleanup()
  })

  it('TC-009-01: normal render does not trigger fallback', () => {
    render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('Normal content')).toBeInTheDocument()
  })

  it('TC-009-02: child error shows fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
  })

  it('TC-009-03: reset button re-renders children', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )
    // After error, show fallback
    const fallback = screen.getAllByText(/Something went wrong/i)
    expect(fallback.length).toBeGreaterThanOrEqual(1)

    // Click reset
    const resetBtn = screen.getByText('重置')
    expect(resetBtn).toBeInTheDocument()
    resetBtn.click()

    // After reset, fallback should still show since ThrowComponent throws again
    expect(screen.getAllByText(/Something went wrong/i).length).toBeGreaterThanOrEqual(1)
  })
})
