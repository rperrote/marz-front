import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRef } from 'react'
import { useViewedOnce } from './useViewedOnce'

class MockIntersectionObserver {
  callback: IntersectionObserverCallback
  elements: Element[] = []

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
  }

  observe(element: Element) {
    this.elements.push(element)
  }

  disconnect() {
    this.elements = []
  }

  trigger(isIntersecting: boolean) {
    const entries = this.elements.map((el) => ({
      isIntersecting,
      target: el,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRatio: isIntersecting ? 1 : 0,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      time: Date.now(),
    }))
    this.callback(
      entries as IntersectionObserverEntry[],
      this as unknown as IntersectionObserver,
    )
  }
}

describe('useViewedOnce', () => {
  let mockObserver: MockIntersectionObserver | null = null

  beforeEach(() => {
    vi.stubGlobal(
      'IntersectionObserver',
      vi.fn((callback: IntersectionObserverCallback) => {
        mockObserver = new MockIntersectionObserver(callback)
        return mockObserver
      }),
    )
  })

  it('fires callback when element enters viewport', () => {
    const callback = vi.fn()

    renderHook(() => {
      const ref = useRef<HTMLDivElement>(document.createElement('div'))
      useViewedOnce(ref, callback)
      return ref
    })

    mockObserver!.trigger(true)

    expect(callback).toHaveBeenCalledOnce()
  })

  it('fires callback only once even if element enters viewport multiple times', () => {
    const callback = vi.fn()

    renderHook(() => {
      const ref = useRef<HTMLDivElement>(document.createElement('div'))
      useViewedOnce(ref, callback)
      return ref
    })

    mockObserver!.trigger(true)
    mockObserver!.trigger(true)

    expect(callback).toHaveBeenCalledOnce()
  })

  it('does not fire when element is not intersecting', () => {
    const callback = vi.fn()

    renderHook(() => {
      const ref = useRef<HTMLDivElement>(document.createElement('div'))
      useViewedOnce(ref, callback)
      return ref
    })

    mockObserver!.trigger(false)

    expect(callback).not.toHaveBeenCalled()
  })
})
