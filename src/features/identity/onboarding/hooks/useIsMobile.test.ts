import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { useIsMobile } from './useIsMobile'

let addSpy: ReturnType<typeof vi.spyOn>
let removeSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  addSpy = vi.spyOn(window, 'addEventListener')
  removeSpy = vi.spyOn(window, 'removeEventListener')
})

afterEach(() => {
  addSpy.mockRestore()
  removeSpy.mockRestore()
})

function setWidth(w: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: w,
  })
}

describe('useIsMobile', () => {
  it('returns false on initial render (SSR-safe default)', () => {
    setWidth(1280)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('returns true after effect when width < 1024', async () => {
    setWidth(320)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('returns false after effect when width >= 1024', () => {
    setWidth(1024)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('updates on resize', () => {
    setWidth(1280)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    act(() => {
      setWidth(800)
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.current).toBe(true)

    act(() => {
      setWidth(1280)
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.current).toBe(false)
  })

  it('registers resize listener on mount', () => {
    setWidth(1280)
    renderHook(() => useIsMobile())
    expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function))
  })

  it('removes resize listener on unmount', () => {
    setWidth(1280)
    const { unmount } = renderHook(() => useIsMobile())
    unmount()
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function))
  })
})
