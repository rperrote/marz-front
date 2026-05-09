import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { describe, expect, it, vi } from 'vitest'

import type {
  CampaignBoardBriefSnapshot,
  CampaignBoardCommercialSnapshot,
  CampaignBoardTargetingSnapshot,
  CreatorCampaignBoardCard,
} from '#/shared/api/generated/model'

import { CampaignBriefContent } from './CampaignBriefContent'

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

const campaignId = '11111111-1111-4111-8111-111111111111'

function makeCard(): CreatorCampaignBoardCard {
  return {
    campaign_id: campaignId,
    brand: {
      brand_workspace_id: '22222222-2222-4222-8222-222222222222',
      name: 'Marz Audio',
      logo_url: null,
      avatar_initials: 'MA',
      vertical: 'tech',
    },
    campaign: {
      name: 'Lanzamiento auriculares M-Pro 2',
      objective: 'brand_awareness',
      description_preview: 'Preview',
      deadline: '2026-05-12',
      platforms: [{ platform: 'youtube', format: 'long_form' }],
      deliverables: [
        {
          platform: 'youtube',
          format: 'long_form',
          quantity: 1,
          description: 'Review honesto con prueba de audio.',
        },
      ],
      content_type: 'ugc_videos',
    },
    economics: {
      fee_model: 'fixed_per_video',
      fee_min_amount: '250',
      fee_max_amount: '500',
      fee_label: 'USD 250 - 500',
    },
    targeting: {
      niches: ['tech'],
      interests: ['audio'],
      platforms: ['youtube'],
      deliverables: ['long_form'],
      fee_min: '250',
      fee_max: '500',
    },
    match: {
      score: 42,
      score_raw: '42.00',
      band: 'low',
      recommended: false,
      hard_filters_passed: false,
      profile_complete: true,
      positive_reasons: ['Buen fit con audio'],
      mismatch_reasons: ['Tu audiencia principal no está en YouTube'],
    },
    application: {
      status: 'none',
      application_id: null,
      submitted_at: null,
      can_apply: true,
    },
    published_at: '2026-05-09T08:00:00.000Z',
  }
}

function makeBrief(): CampaignBoardBriefSnapshot {
  return {
    description: 'Buscamos creators tech para presentar nuevos auriculares.',
    tone: 'Cercano, experto y honesto.',
    key_messages: ['Batería de 48 horas', 'Cancelación activa de ruido'],
    do_list: ['Mostrar el producto en uso'],
    dont_list: ['No prometer resultados médicos'],
    reference_links: ['https://example.com'],
    icp: {
      description: 'Personas interesadas en gadgets y productividad.',
      age_min: 22,
      age_max: 35,
      genders: ['all'],
      countries: ['AR', 'UY'],
      platforms: ['youtube'],
      interests: ['audio', 'productivity'],
    },
    scoring_dimensions: [
      {
        name: 'Afinidad tech',
        description: 'Historial de contenido técnico.',
        weight_pct: 60,
        positive_signals: ['Reviews detalladas'],
        negative_signals: ['Contenido solo lifestyle'],
      },
    ],
    hard_filters: [],
    disqualifiers: ['Contenido de apuestas'],
  }
}

function makeTargeting(): CampaignBoardTargetingSnapshot {
  return {
    countries: ['AR'],
    tiers: ['micro'],
    follower_min: 10000,
    follower_max: 50000,
    genders: ['all'],
    age_min: 22,
    age_max: 35,
    interests: ['audio'],
    content_languages: ['es'],
    source: 'brief',
    adjusted_from_brief: false,
  }
}

function makeCommercial(): CampaignBoardCommercialSnapshot {
  return {
    fee_model: 'fixed_per_video',
    fee_min_amount: '250',
    fee_max_amount: '500',
    fee_label: 'USD 250 - 500',
    pricing_notes: 'Pago contra aprobación del contenido.',
  }
}

function renderContent() {
  return render(
    <CampaignBriefContent
      card={makeCard()}
      brief={makeBrief()}
      targeting={makeTargeting()}
      commercial={makeCommercial()}
    />,
  )
}

describe('CampaignBriefContent', () => {
  it('renders the read-only campaign brief sections', () => {
    renderContent()

    expect(screen.getByText('Descripción')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Buscamos creators tech para presentar nuevos auriculares.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Cercano, experto y honesto.')).toBeInTheDocument()
    expect(screen.getByText('Batería de 48 horas')).toBeInTheDocument()
    expect(screen.getByText('Mostrar el producto en uso')).toBeInTheDocument()
    expect(
      screen.getByText('No prometer resultados médicos'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Personas interesadas en gadgets y productividad.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Afinidad tech')).toBeInTheDocument()
    expect(screen.getByText('Contenido de apuestas')).toBeInTheDocument()
    expect(screen.getByText('1x Youtube · Long Form')).toBeInTheDocument()
    expect(screen.getByText('USD 250 - 500')).toBeInTheDocument()
    expect(
      screen.getByText('Tu audiencia principal no está en YouTube'),
    ).toBeInTheDocument()
  })

  it('does not render application or invite actions', () => {
    renderContent()

    expect(
      screen.queryByRole('button', {
        name: /postularme|aceptar|declinar|invitar/i,
      }),
    ).not.toBeInTheDocument()
  })

  it('has no axe violations', async () => {
    const { container } = renderContent()

    expect(await axe(container)).toHaveNoViolations()
  })
})
