import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { C17AvatarScreen } from './C17AvatarScreen'

const { mockMutate, mockSetField, mockToastError } = vi.hoisted(() => ({
  mockMutate: vi.fn(),
  mockSetField: vi.fn(),
  mockToastError: vi.fn(),
}))

vi.mock('@lingui/core/macro', () => ({
  t: (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
}))

vi.mock('#/shared/api/generated/onboarding/onboarding', () => ({
  usePresignCreatorAvatar: () => ({
    mutate: mockMutate,
    mutateAsync: vi.fn(),
  }),
}))

vi.mock('../store', () => ({
  useCreatorOnboardingStore: () => ({
    avatar_s3_key: '',
    setField: mockSetField,
  }),
}))

vi.mock('sonner', () => ({
  toast: { error: mockToastError },
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:test'),
    revokeObjectURL: vi.fn(),
  })
})

function createFile(size: number, type: string) {
  return new File([new ArrayBuffer(size)], 'avatar.jpg', { type })
}

describe('C17AvatarScreen', () => {
  it('rejects files larger than 5MB', async () => {
    render(<C17AvatarScreen />)
    const input = screen.getByLabelText(/seleccionar imagen/i)
    const bigFile = createFile(6 * 1024 * 1024, 'image/jpeg')

    fireEvent.change(input, { target: { files: [bigFile] } })

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        expect.stringContaining('5MB'),
      )
    })
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('rejects invalid file types', async () => {
    render(<C17AvatarScreen />)
    const input = screen.getByLabelText(/seleccionar imagen/i)
    const gifFile = createFile(1024, 'image/gif')

    fireEvent.change(input, { target: { files: [gifFile] } })

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        expect.stringContaining('JPEG'),
      )
    })
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('uploads valid file and sets avatar_s3_key', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchSpy)

    mockMutate.mockImplementation(
      (
        _vars: unknown,
        opts: {
          onSuccess: (res: {
            status: number
            data: {
              upload_url: string
              s3_key: string
              required_headers: Record<string, string>
            }
          }) => void
        },
      ) => {
        opts.onSuccess({
          status: 200,
          data: {
            upload_url: 'https://s3.example.com/upload',
            s3_key: 'avatars/abc123.jpg',
            required_headers: { 'x-amz-acl': 'public-read' },
          },
        })
      },
    )

    render(<C17AvatarScreen />)
    const input = screen.getByLabelText(/seleccionar imagen/i)
    const validFile = createFile(1024, 'image/jpeg')

    fireEvent.change(input, { target: { files: [validFile] } })

    await waitFor(() => {
      expect(mockSetField).toHaveBeenCalledWith(
        'avatar_s3_key',
        'avatars/abc123.jpg',
      )
    })

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://s3.example.com/upload',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'x-amz-acl': 'public-read',
        }),
      }),
    )
  })

  it('shows remove button when preview exists and clears on click', async () => {
    mockMutate.mockImplementation(
      (
        _vars: unknown,
        opts: {
          onSuccess: (res: {
            status: number
            data: {
              upload_url: string
              s3_key: string
              required_headers: Record<string, string>
            }
          }) => void
        },
      ) => {
        opts.onSuccess({
          status: 200,
          data: {
            upload_url: 'https://s3.example.com/upload',
            s3_key: 'avatars/test.jpg',
            required_headers: {},
          },
        })
      },
    )
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))

    render(<C17AvatarScreen />)
    const input = screen.getByLabelText(/seleccionar imagen/i)
    fireEvent.change(input, {
      target: { files: [createFile(1024, 'image/png')] },
    })

    const removeBtn = await screen.findByLabelText(/eliminar foto/i)
    fireEvent.click(removeBtn)

    expect(mockSetField).toHaveBeenCalledWith('avatar_s3_key', '')
  })
})
