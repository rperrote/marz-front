import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type * as ReactModule from 'react'

const useSyncExternalStoreMock = vi.fn()

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof ReactModule>('react')
  return {
    ...actual,
    useCallback: (callback: unknown) => callback,
    useRef: <T>(value: T) => ({ current: value }),
    useSyncExternalStore: useSyncExternalStoreMock,
  }
})

describe('useClientNow', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    useSyncExternalStoreMock.mockReset()
  })

  it('uses a null server snapshot so hydration starts from stable markup', async () => {
    const { useClientNow } = await import('./useClientNow')

    useSyncExternalStoreMock.mockImplementation(
      (
        _subscribe: () => () => void,
        _getSnapshot: () => number,
        getServerSnapshot: () => null,
      ) => getServerSnapshot(),
    )

    expect(useClientNow()).toBeNull()
  })

  it('returns the client timestamp from the client snapshot', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_778_628_000_000)
    const { useClientNow } = await import('./useClientNow')

    useSyncExternalStoreMock.mockImplementation(
      (
        _subscribe: () => () => void,
        getSnapshot: () => number,
        _getServerSnapshot: () => null,
      ) => getSnapshot(),
    )

    expect(useClientNow()).toBe(1_778_628_000_000)
  })

  it('subscribes with a timer when ticking is requested', async () => {
    const { useClientNow } = await import('./useClientNow')
    const setTimeoutSpy = vi
      .spyOn(window, 'setTimeout')
      .mockReturnValue(123 as unknown as ReturnType<typeof window.setInterval>)
    const clearTimeoutSpy = vi
      .spyOn(window, 'clearTimeout')
      .mockImplementation(() => undefined)
    const onStoreChange = vi.fn()

    useSyncExternalStoreMock.mockImplementation(
      (
        subscribe: (callback: () => void) => () => void,
        getSnapshot: () => number,
        _getServerSnapshot: () => null,
      ) => {
        const unsubscribe = subscribe(onStoreChange)
        expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000)
        const timeoutCallback = setTimeoutSpy.mock.calls[0]?.[0]
        if (typeof timeoutCallback === 'function') {
          timeoutCallback()
        }
        unsubscribe()
        return getSnapshot()
      },
    )

    useClientNow(1000)

    expect(onStoreChange).toHaveBeenCalledTimes(1)
    expect(clearTimeoutSpy).toHaveBeenCalledWith(123)
  })
})
