import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock scrollTo to prevent Framer Motion jsdom errors
window.scrollTo = vi.fn()

// Provide a proper localStorage-like mock that is compatible with Zustand persist middleware.
// The mock must expose the same interface as the native Storage object (getItem, setItem,
// removeItem, clear, length, key) so that Zustand's persist middleware can read/write
// persisted state without throwing.
const store: Record<string, string> = {}
let _length = 0
const localStorageMock = {
  get length() { return _length },
  set length(_v) { /* read-only */ },
  key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    if (!(key in store)) _length++
    store[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    if (key in store) _length--
    delete store[key]
  }),
  clear: vi.fn(() => {
    Object.keys(store).forEach(k => delete store[k])
    _length = 0
  }),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })
