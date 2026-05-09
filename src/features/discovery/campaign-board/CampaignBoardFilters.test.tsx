import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CampaignBoardFilters } from './CampaignBoardFilters'
import type { CampaignBoardSearch } from './search-schema'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce(
        (acc, str, index) => acc + str + (values[index] ?? ''),
        '',
      ),
    { __lingui: true },
  ),
}))

const baseSearch: CampaignBoardSearch = {
  recommended_only: false,
  sort: 'match_score_desc',
}

const available = {
  niches: ['tech', 'beauty'],
  interests: ['audio', 'makeup'],
  platforms: ['youtube', 'instagram'],
  deliverables: ['long_form', 'reel'],
  match_score_min: 0,
  match_score_max: 100,
}

const onSearchChange = vi.fn()
const onReset = vi.fn()

function renderFilters(search: CampaignBoardSearch = baseSearch) {
  return render(
    <CampaignBoardFilters
      search={search}
      available={available}
      onSearchChange={onSearchChange}
      onReset={onReset}
    />,
  )
}

describe('CampaignBoardFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('debounces q search for brand, campaign, or niche', async () => {
    vi.useFakeTimers()
    renderFilters()

    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Buscar campañas' }),
      {
        target: { value: 'Marz tech' },
      },
    )

    expect(onSearchChange).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(299)
    })

    expect(onSearchChange).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })

    expect(onSearchChange).toHaveBeenCalledWith({ q: 'Marz tech' })
  })

  it('clears q with debounce', async () => {
    vi.useFakeTimers()
    renderFilters({ ...baseSearch, q: 'audio' })

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Limpiar búsqueda',
      }),
    )

    expect(onSearchChange).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    expect(onSearchChange).toHaveBeenCalledWith({ q: undefined })
  })

  it('keeps niches and interests as independent filters', async () => {
    const user = userEvent.setup()
    renderFilters()

    await user.click(screen.getByRole('button', { name: /categoría/i }))
    await user.click(screen.getByText('Tech'))

    expect(onSearchChange).toHaveBeenLastCalledWith({ niches: ['tech'] })
    expect(onSearchChange).not.toHaveBeenCalledWith(
      expect.objectContaining({ interests: expect.anything() }),
    )

    await user.click(screen.getByRole('button', { name: /intereses/i }))
    await user.click(screen.getByText('Audio'))

    expect(onSearchChange).toHaveBeenLastCalledWith({ interests: ['audio'] })
  })

  it('shows an inline error and does not emit an invalid fee range', async () => {
    const user = userEvent.setup()
    renderFilters()

    await user.click(screen.getByRole('button', { name: /fee range/i }))
    await user.type(screen.getByLabelText('Mínimo USD'), '500')
    onSearchChange.mockClear()
    await user.type(screen.getByLabelText('Máximo USD'), '100')

    expect(screen.getByRole('alert')).toHaveTextContent(
      'El fee máximo debe ser mayor o igual al mínimo.',
    )
    expect(onSearchChange).not.toHaveBeenCalled()
  })

  it('clamps the match score slider display to 0..100', async () => {
    const user = userEvent.setup()
    renderFilters({ ...baseSearch, min_match_score: 140 })

    await user.click(screen.getByRole('button', { name: /match score/i }))

    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('resets filters to defaults', async () => {
    const user = userEvent.setup()
    renderFilters({
      ...baseSearch,
      q: 'audio',
      niches: ['tech'],
      recommended_only: true,
    })

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }))

    expect(onReset).toHaveBeenCalledTimes(1)
  })
})
