import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { UploadDraftDialog } from '../UploadDraftDialog'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

const hookState = {
  status: 'idle' as string,
  progress: 0,
  error: null as { kind: string; message: string } | null,
  draft: null,
  start: vi.fn(),
  cancel: vi.fn(),
  reset: vi.fn(),
}

vi.mock('../../hooks/useDraftUploadFlow', () => ({
  useDraftUploadFlow: () => hookState,
}))

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

function renderDialog(
  props?: Partial<Parameters<typeof UploadDraftDialog>[0]>,
) {
  return render(
    <UploadDraftDialog
      open
      onOpenChange={vi.fn()}
      deliverableId="del-1"
      onSuccess={vi.fn()}
      {...props}
    />,
    { wrapper: createWrapper() },
  )
}

describe('UploadDraftDialog', () => {
  beforeEach(() => {
    hookState.status = 'idle'
    hookState.progress = 0
    hookState.error = null
    hookState.draft = null
    hookState.start.mockClear()
    hookState.cancel.mockClear()
    hookState.reset.mockClear()
  })

  it('renders drop zone when idle', () => {
    renderDialog()
    expect(
      screen.getByText(/drag and drop your video here/i),
    ).toBeInTheDocument()
  })

  it('invokes start when a valid file is selected', async () => {
    renderDialog()

    const input = document.querySelector('input[type="file"]')
    if (!input) throw new Error('No file input found')

    const file = new File(['content'], 'valid.mp4', { type: 'video/mp4' })
    fireEvent.change(input, { target: { files: [file] } })

    expect(hookState.start).toHaveBeenCalledTimes(1)
    expect(hookState.start).toHaveBeenCalledWith(expect.any(File))
  })

  it('shows format error banner when hook reports format error', () => {
    hookState.status = 'error'
    hookState.error = {
      kind: 'format',
      message: "This file format isn't supported. Use MP4, MOV, or WebM.",
    }

    renderDialog()
    expect(
      screen.getByText(/this file format isn't supported/i),
    ).toBeInTheDocument()
  })

  it('shows size error banner when hook reports size error', () => {
    hookState.status = 'error'
    hookState.error = {
      kind: 'size',
      message: 'File too large (max 2 GB).',
    }

    renderDialog()
    expect(screen.getByText(/file too large/i)).toBeInTheDocument()
  })

  it('shows upload progress when uploading', () => {
    hookState.status = 'uploading'
    hookState.progress = 42

    renderDialog()
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '42',
    )
  })

  it('has no axe violations', async () => {
    const { container } = renderDialog()
    expect(await axe(container)).toHaveNoViolations()
  })
})
