import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { ApiError } from '#/shared/api/mutator'
import { useInitBriefBuilder } from '../hooks/useInitBriefBuilder'
import { useProcessBrief } from '../hooks/useProcessBrief'
import { P1Input } from './P1Input'
import { useBriefBuilderStore } from '../store'
import { renderWithValidation } from '../test-utils'

vi.mock('../hooks/useInitBriefBuilder', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...(actual as Record<string, unknown>),
    useInitBriefBuilder: vi.fn(),
  }
})

vi.mock('../hooks/useProcessBrief', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...(actual as Record<string, unknown>),
    useProcessBrief: vi.fn(),
  }
})

const mockInitMutateAsync = vi.fn()
const mockProcessMutateAsync = vi.fn()

beforeEach(() => {
  useBriefBuilderStore.getState().reset()
  vi.clearAllMocks()
  vi.mocked(useInitBriefBuilder).mockReturnValue({
    mutateAsync: mockInitMutateAsync,
  } as unknown as ReturnType<typeof useInitBriefBuilder>)
  vi.mocked(useProcessBrief).mockReturnValue({
    mutateAsync: mockProcessMutateAsync,
  } as unknown as ReturnType<typeof useProcessBrief>)
})

function createPdfFile(name = 'test.pdf', size = 1024): File {
  const content = new Uint8Array(size)
  return new File([content], name, { type: 'application/pdf' })
}

describe('P1Input', () => {
  it('renders URL, description, and PDF upload fields', () => {
    renderWithValidation(<P1Input />)
    expect(screen.getByLabelText(/sitio web/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/descripci/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/documento pdf/i)).toBeInTheDocument()
  })

  it('shows error for invalid URL on blur', async () => {
    const user = userEvent.setup()
    renderWithValidation(<P1Input />)
    const urlInput = screen.getByLabelText(/sitio web/i)
    await user.type(urlInput, 'not-a-url')
    await user.tab()
    expect(await screen.findByText(/url v.lida/i)).toBeInTheDocument()
  })

  it('shows hint when no input is provided', () => {
    renderWithValidation(<P1Input />)
    expect(screen.getByText(/completa al menos uno/i)).toBeInTheDocument()
  })

  it('hides hint when URL is filled', async () => {
    const user = userEvent.setup()
    renderWithValidation(<P1Input />)
    await user.type(screen.getByLabelText(/sitio web/i), 'https://a.com')
    expect(screen.queryByText(/completa al menos uno/i)).not.toBeInTheDocument()
  })

  it('hides hint when PDF is uploaded', async () => {
    renderWithValidation(<P1Input />)
    const pdfFile = createPdfFile()
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [pdfFile] } })
    await waitFor(() => {
      expect(
        screen.queryByText(/completa al menos uno/i),
      ).not.toBeInTheDocument()
    })
  })

  it('shows error for non-PDF file upload', async () => {
    renderWithValidation(<P1Input />)
    const nonPdfFile = new File(['content'], 'doc.txt', {
      type: 'text/plain',
    })
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [nonPdfFile] } })
    expect(
      await screen.findByText(/solo se aceptan archivos pdf/i),
    ).toBeInTheDocument()
  })

  it('allows text to be optional when PDF is uploaded', async () => {
    renderWithValidation(<P1Input />)
    const pdfFile = createPdfFile()
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [pdfFile] } })
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument()
    })
  })

  it('shows specific error for 422 pdf_too_large on submit', async () => {
    mockInitMutateAsync.mockRejectedValueOnce(
      new ApiError(422, 'pdf_too_large', 'PDF too large'),
    )

    const user = userEvent.setup()
    const { validatorRef } = renderWithValidation(<P1Input />)

    await user.type(screen.getByLabelText(/descripci/i), 'Algo de texto')

    await waitFor(() => {
      expect(validatorRef.current).not.toBeNull()
    })
    await validatorRef.current!()

    await waitFor(() => {
      expect(
        screen.getByText(/el documento contiene demasiado texto/i),
      ).toBeInTheDocument()
    })
  })

  it('returns true and sets processingToken on successful submit', async () => {
    mockInitMutateAsync.mockResolvedValueOnce({
      processing_token: 'tok-123',
    })
    mockProcessMutateAsync.mockResolvedValueOnce({})

    const user = userEvent.setup()
    const { validatorRef } = renderWithValidation(<P1Input />)

    await user.type(screen.getByLabelText(/descripci/i), 'Mi marca vende cosas')

    await waitFor(() => {
      expect(validatorRef.current).not.toBeNull()
    })
    const result = await validatorRef.current!()

    expect(result).toBe(true)
    expect(mockInitMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        descriptionText: 'Mi marca vende cosas',
      }),
    )
    expect(mockProcessMutateAsync).toHaveBeenCalledWith('tok-123')
    expect(useBriefBuilderStore.getState().processingToken).toBe('tok-123')
  })

  it('shows 413 error message', async () => {
    mockInitMutateAsync.mockRejectedValueOnce(
      new ApiError(413, 'payload_too_large', 'Request too large'),
    )

    const user = userEvent.setup()
    const { validatorRef } = renderWithValidation(<P1Input />)

    await user.type(screen.getByLabelText(/descripci/i), 'Algo')

    await waitFor(() => {
      expect(validatorRef.current).not.toBeNull()
    })
    await validatorRef.current!()

    await waitFor(() => {
      expect(screen.getByText(/archivo demasiado grande/i)).toBeInTheDocument()
    })
  })

  it('has no accessibility violations', async () => {
    const { container } = renderWithValidation(<P1Input />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
