import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { useDraftUploadFlow } from '../useDraftUploadFlow'
import { ApiError } from '#/shared/api/mutator'

const mocks = {
  requestMutateAsync: vi.fn(),
  completeMutateAsync: vi.fn(),
  cancelMutate: vi.fn(),
}

vi.mock('../../api/draftUpload', async (importOriginal) => {
  const mod = await importOriginal()
  if (typeof mod !== 'object' || mod === null) {
    throw new Error('importOriginal did not return an object')
  }
  return {
    ...mod,
    useRequestDraftUploadMutation: () => ({
      mutateAsync: mocks.requestMutateAsync,
    }),
    useCompleteDraftUploadMutation: () => ({
      mutateAsync: mocks.completeMutateAsync,
    }),
    useCancelDraftUploadMutation: () => ({ mutate: mocks.cancelMutate }),
  }
})

vi.mock('../../analytics', () => ({
  trackUploadStarted: vi.fn(),
  trackUploadProgress: vi.fn(),
  trackUploadCompleted: vi.fn(),
  trackUploadFailed: vi.fn(),
}))

class FakeXMLHttpRequest {
  static instances: FakeXMLHttpRequest[] = []

  upload = { onprogress: null as ((ev: ProgressEvent) => void) | null }
  onload = null as ((ev: ProgressEvent) => void) | null
  onerror = null as ((ev: ProgressEvent) => void) | null
  onabort = null as ((ev: ProgressEvent) => void) | null
  status = 0
  responseText = ''
  open = vi.fn()
  setRequestHeader = vi.fn()
  send = vi.fn()
  abort = vi.fn(() => {
    if (this.onabort) {
      this.onabort(new ProgressEvent('abort'))
    }
  })

  constructor() {
    FakeXMLHttpRequest.instances.push(this)
  }

  static reset() {
    FakeXMLHttpRequest.instances = []
  }
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

function makeFile(overrides?: { type?: string; size?: number }): File {
  const file = new File(['content'], 'test.mp4', {
    type: overrides?.type ?? 'video/mp4',
  })
  if (overrides?.size !== undefined) {
    Object.defineProperty(file, 'size', { value: overrides.size })
  }
  return file
}

const MOCK_INTENT_BODY = {
  intent_id: 'intent-1',
  upload_url: 'https://s3.example.com/upload',
  headers: { 'Content-Type': 'video/mp4', 'x-amz-meta-deliverable': 'del-1' },
  expires_at: '2099-01-01T00:00:00Z',
}

const MOCK_INTENT_RESPONSE = {
  data: MOCK_INTENT_BODY,
  status: 200,
}

const MOCK_DRAFT = {
  id: 'draft-1',
  deliverable_id: 'del-1',
  version: 1,
  original_filename: 'test.mp4',
  file_size_bytes: 1234,
  duration_sec: 60,
  mime_type: 'video/mp4',
  thumbnail_url: null,
  playback_url: 'https://cdn.example.com/video.mp4',
  playback_url_expires_at: '2099-01-01T00:00:00Z',
  submitted_at: '2026-01-01T00:00:00Z',
  submitted_by_account_id: 'acc-1',
}

const MOCK_COMPLETE_RESPONSE = {
  data: MOCK_DRAFT,
  status: 200,
}

vi.stubGlobal('XMLHttpRequest', FakeXMLHttpRequest)

describe('useDraftUploadFlow', () => {
  beforeEach(() => {
    FakeXMLHttpRequest.reset()
    mocks.requestMutateAsync.mockReset()
    mocks.completeMutateAsync.mockReset()
    mocks.cancelMutate.mockReset()
  })

  it('rejects unsupported formats with kind=format', async () => {
    const { result } = renderHook(() => useDraftUploadFlow('del-1'), {
      wrapper: createWrapper(),
    })

    const file = makeFile({ type: 'application/zip' })
    await act(() => result.current.start(file))

    expect(result.current.status).toBe('error')
    expect(result.current.error?.kind).toBe('format')
  })

  it('rejects files larger than 2 GB with kind=size', async () => {
    const { result } = renderHook(() => useDraftUploadFlow('del-1'), {
      wrapper: createWrapper(),
    })

    const file = makeFile({ size: 3 * 1024 * 1024 * 1024 })
    await act(() => result.current.start(file))

    expect(result.current.status).toBe('error')
    expect(result.current.error?.kind).toBe('size')
  })

  it('reports progress 0→100 and completes successfully', async () => {
    mocks.requestMutateAsync.mockResolvedValueOnce(MOCK_INTENT_RESPONSE)
    mocks.completeMutateAsync.mockResolvedValueOnce(MOCK_COMPLETE_RESPONSE)

    const { result } = renderHook(() => useDraftUploadFlow('del-1'), {
      wrapper: createWrapper(),
    })

    const file = makeFile()
    act(() => {
      void result.current.start(file)
    })

    await waitFor(() => expect(result.current.status).toBe('uploading'))

    const xhr = FakeXMLHttpRequest.instances[0]!
    expect(xhr).toBeDefined()
    expect(xhr.open).toHaveBeenCalledWith('PUT', MOCK_INTENT_BODY.upload_url)
    expect(typeof xhr.upload.onprogress).toBe('function')

    await act(async () => {
      xhr.upload.onprogress?.(
        new ProgressEvent('progress', { loaded: 100, total: 100 }),
      )
    })

    act(() => {
      xhr.status = 200
      xhr.onload?.(new ProgressEvent('load'))
    })

    await waitFor(() => expect(result.current.status).toBe('done'))
    expect(result.current.progress).toBe(100)
    expect(result.current.draft).toEqual(MOCK_DRAFT)
    expect(mocks.completeMutateAsync).toHaveBeenCalledWith({
      deliverableId: 'del-1',
      intentId: 'intent-1',
      body: { duration_sec: null },
    })
  })

  it('aborts XHR and calls cancel mutation on cancel()', async () => {
    mocks.requestMutateAsync.mockResolvedValueOnce(MOCK_INTENT_RESPONSE)

    const { result } = renderHook(() => useDraftUploadFlow('del-1'), {
      wrapper: createWrapper(),
    })

    const file = makeFile()
    act(() => {
      void result.current.start(file)
    })

    await waitFor(() => expect(result.current.status).toBe('uploading'))

    const xhr = FakeXMLHttpRequest.instances[0]!
    act(() => result.current.cancel())

    expect(xhr.abort).toHaveBeenCalled()
    await waitFor(() => expect(result.current.status).toBe('cancelled'))
    expect(mocks.cancelMutate).toHaveBeenCalledWith({
      deliverableId: 'del-1',
      intentId: 'intent-1',
    })
  })

  it('sets error=server when complete returns 5xx', async () => {
    mocks.requestMutateAsync.mockResolvedValueOnce(MOCK_INTENT_RESPONSE)
    mocks.completeMutateAsync.mockRejectedValueOnce(
      new ApiError(500, 'internal_error', 'Server error'),
    )

    const { result } = renderHook(() => useDraftUploadFlow('del-1'), {
      wrapper: createWrapper(),
    })

    const file = makeFile()
    act(() => {
      void result.current.start(file)
    })

    await waitFor(() => expect(result.current.status).toBe('uploading'))

    const xhr = FakeXMLHttpRequest.instances[0]!
    act(() => {
      xhr.status = 200
      xhr.onload?.(new ProgressEvent('load'))
    })

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error?.kind).toBe('server')
  })

  it('allows restarting after an error (idempotency of start)', async () => {
    mocks.requestMutateAsync
      .mockRejectedValueOnce(new Error('Network down'))
      .mockResolvedValueOnce(MOCK_INTENT_RESPONSE)
    mocks.completeMutateAsync.mockResolvedValueOnce(MOCK_COMPLETE_RESPONSE)

    const { result } = renderHook(() => useDraftUploadFlow('del-1'), {
      wrapper: createWrapper(),
    })

    const file = makeFile()
    await act(() => result.current.start(file))
    expect(result.current.status).toBe('error')

    act(() => result.current.reset())
    expect(result.current.status).toBe('idle')

    act(() => {
      void result.current.start(file)
    })

    await waitFor(() => expect(result.current.status).toBe('uploading'))

    const xhr = FakeXMLHttpRequest.instances.at(-1)!
    act(() => {
      xhr.status = 200
      xhr.onload?.(new ProgressEvent('load'))
    })

    await waitFor(() => expect(result.current.status).toBe('done'))
    expect(result.current.draft).toEqual(MOCK_DRAFT)
  })
})
