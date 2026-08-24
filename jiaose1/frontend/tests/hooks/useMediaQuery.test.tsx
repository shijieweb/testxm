import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useMediaQuery, useIsDesktop, useIsMobile } from '../../src/hooks/useMediaQuery'

describe('useMediaQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('TC-023-01: returns false when media query does not match', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'))
    expect(result.current).toBe(false)
  })

  it('TC-023-02: returns true when media query matches', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(min-width: 768px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(result.current).toBe(true)
  })

  it('TC-023-03: listens to media query changes', () => {
    let capturedListener: (() => void) | null = null
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: '(min-width: 1024px)',
        onchange: null,
        addEventListener: (_: string, listener: () => void) => {
          capturedListener = listener
        },
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    const { result, rerender, unmount } = renderHook(() => useMediaQuery('(min-width: 1024px)'))
    expect(result.current).toBe(false)

    // Simulate change event by calling the captured listener with a mock event
    if (capturedListener) {
      capturedListener({ matches: true } as MediaQueryListEvent)
      // jsdom does not auto-batch state updates from event callbacks; trigger rerender
      rerender()
      expect(result.current).toBe(true)
    }

    unmount()
  })

  it('TC-023-04: cleanup removes event listener on unmount', () => {
    const removeListener = vi.fn()
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: removeListener,
      })),
    })

    const { unmount } = renderHook(() => useMediaQuery('(min-width: 9999px)'))
    unmount()
    expect(removeListener).toHaveBeenCalled()
  })
})

describe('useIsDesktop', () => {
  it('TC-023-05: delegates to useMediaQuery with desktop breakpoint', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(min-width: 1024px)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })
    const { result } = renderHook(() => useIsDesktop())
    expect(result.current).toBe(true)
  })
})

describe('useIsMobile', () => {
  it('TC-023-06: delegates to useMediaQuery with mobile breakpoint', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(max-width: 767px)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })
})
