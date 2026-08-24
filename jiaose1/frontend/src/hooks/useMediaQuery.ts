import { useState, useEffect } from 'react'

/**
 * 响应式断点 Hook
 * @param query - CSS media query 字符串，如 "(min-width: 768px)"
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

/**
 * 判断是否为桌面端（宽度 >= 1024px）
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}

/**
 * 判断是否为移动端（宽度 < 768px）
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)')
}
