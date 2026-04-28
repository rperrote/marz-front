import { createFileRoute } from '@tanstack/react-router'
import {
  Bell,
  BarChart3,
  Compass,
  Eye,
  Inbox,
  LayoutGrid,
  MessageSquare,
  Search,
  Upload,
  User,
  Users,
  Video,
  X as XIcon,
} from 'lucide-react'

import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Separator } from '#/components/ui/separator'
import { Slider } from '#/components/ui/slider'
import { Switch } from '#/components/ui/switch'
import { Textarea } from '#/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { ThemeToggle } from '#/components/ThemeToggle'
import { CampaignMiniCard } from '#/features/campaigns/components/CampaignMiniCard'
import { CampaignWorkspaceTabs } from '#/features/campaigns/components/CampaignWorkspaceTabs'
import { ChatHeaderActions } from '#/features/chat/components/ChatHeaderActions'
import { ChatRailItem } from '#/features/chat/components/ChatRailItem'
import { EventBubble } from '#/features/chat/components/EventBubble'
import {
  MobileChatHeader,
  MobileChatRailItem,
  MobileComposer,
  MobileEventBubble,
  MobileMessageBubble,
} from '#/features/chat/components/mobile/MobileChat'
import {
  MobileDraftCard,
  MobileLinkCard,
  MobileOfferCard,
  MobilePaymentCard,
  MobileRequestChangesCard,
} from '#/features/chat/components/mobile/MobileSystemCards'
import { DeliverableCard } from '#/features/deliverables/components/DeliverableCard'
import { DraftApprovedCard } from '#/features/deliverables/components/DraftApprovedCard'
import { DraftSubmittedCard } from '#/features/deliverables/components/DraftSubmittedCard'
import { LinkItem } from '#/features/deliverables/components/LinkItem'
import { LinkSubmittedCard } from '#/features/deliverables/components/LinkSubmittedCard'
import { RequestChangesCard } from '#/features/deliverables/components/RequestChangesCard'
import { RequestChangesModal } from '#/features/deliverables/components/RequestChangesModal'
import { StageCard } from '#/features/deliverables/components/StageCard'
import { BrandHeaderCard } from '#/features/identity/components/BrandHeaderCard'
import { ContextPanel } from '#/shared/ui/ContextPanel'
import { CreatorHeaderCard } from '#/features/identity/components/CreatorHeaderCard'
import { SidebarItem } from '#/features/identity/components/SidebarItem'
import { SidebarTooltip } from '#/features/identity/components/SidebarTooltip'
import { ArchivedOffersList } from '#/features/offers/components/ArchivedOffersList'
import { BundlePlatformRow } from '#/features/offers/components/BundlePlatformRow'
import { DeadlineField } from '#/features/offers/components/DeadlineField'
import {
  OfferCard,
  OfferCardCollapsed,
} from '#/features/offers/components/OfferCard'
import { OfferAcceptedCard } from '#/features/offers/components/OfferAcceptedCard'
import { OfferBlock } from '#/features/offers/components/OfferBlock'
import { OfferTypeChooser } from '#/features/offers/components/OfferTypeChooser'
import {
  SendOfferSidesheetPreview as SendOfferSidesheet,
  SpeedBonusBlock,
} from '#/features/offers/components/SendOfferSidesheetPreview'
import { StageEditor } from '#/features/offers/components/StageEditor'
import { SummaryTotalRow } from '#/features/offers/components/SummaryTotalRow'
import { PaymentCard } from '#/features/payments/components/PaymentCard'
import { DarkTooltip } from '#/shared/ui/DarkTooltip'
import { IconButton } from '#/shared/ui/IconButton'
import {
  MobileActionBar,
  MobileBottomTabBar,
  MobileFloatingAction,
  MobileHomeIndicator,
  MobileStatusBar,
  MobileTopbar,
} from '#/shared/ui/mobile/Shell'

export const Route = createFileRoute('/ds')({
  component: DesignSystemPage,
})

// -----------------------------------------------------------------------------
// Atoms: tokens pulled from marz-design/marzv2.pen (via get_variables).
// Kept inline so changes here are visible in the diff; when the .pen gets an
// exporter, these arrays become the generated output.
// -----------------------------------------------------------------------------

const colorGroups: Array<{ title: string; tokens: Array<string> }> = [
  {
    title: 'Surface',
    tokens: [
      'background',
      'foreground',
      'card',
      'card-foreground',
      'popover',
      'popover-foreground',
      'muted',
      'muted-foreground',
      'accent',
      'accent-foreground',
      'secondary',
      'secondary-foreground',
      'input',
      'surface-hover',
      'surface-active',
      'context-panel',
    ],
  },
  {
    title: 'Brand',
    tokens: ['primary', 'primary-foreground', 'primary-hover', 'ring'],
  },
  {
    title: 'Status',
    tokens: [
      'destructive',
      'destructive-foreground',
      'success',
      'success-foreground',
      'warning',
      'warning-foreground',
      'info',
      'info-foreground',
    ],
  },
  {
    title: 'Borders',
    tokens: ['border', 'border-strong'],
  },
  {
    title: 'Sidebar',
    tokens: [
      'sidebar',
      'sidebar-foreground',
      'sidebar-accent',
      'sidebar-accent-foreground',
      'sidebar-border',
      'sidebar-primary',
      'sidebar-primary-foreground',
    ],
  },
  {
    title: 'Charts',
    tokens: ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'],
  },
  {
    title: 'Neutral scale',
    tokens: [
      'neutral-0',
      'neutral-50',
      'neutral-100',
      'neutral-150',
      'neutral-200',
      'neutral-300',
    ],
  },
]

const radiusTokens = [
  { name: 'sm', px: '8px' },
  { name: 'md', px: '12px' },
  { name: 'lg', px: '16px' },
  { name: 'xl', px: '20px' },
  { name: '2xl', px: '24px' },
  { name: '3xl', px: '32px' },
  { name: 'full', px: '9999px' },
]

const spacingTokens = [
  ['0.5', '2px'],
  ['1', '4px'],
  ['1.5', '6px'],
  ['2', '8px'],
  ['2.5', '10px'],
  ['3', '12px'],
  ['3.5', '14px'],
  ['4', '16px'],
  ['5', '20px'],
  ['6', '24px'],
  ['7', '28px'],
  ['8', '32px'],
  ['10', '40px'],
  ['12', '48px'],
  ['14', '56px'],
  ['16', '64px'],
  ['20', '80px'],
  ['24', '96px'],
] as const

const fontSizeTokens = [
  { name: 'xs', px: '11px' },
  { name: 'sm', px: '12px' },
  { name: 'base', px: '13px' },
  { name: 'md', px: '14px' },
  { name: 'lg', px: '15px' },
  { name: 'xl', px: '18px' },
  { name: '2xl', px: '22px' },
  { name: '3xl', px: '28px' },
  { name: '4xl', px: '40px' },
]

const fontWeightTokens = [
  { name: 'normal', value: 400 },
  { name: 'medium', value: 500 },
  { name: 'semibold', value: 600 },
  { name: 'bold', value: 700 },
]

const iconSizeTokens = [
  { name: 'sm', px: '16px' },
  { name: 'md', px: '20px' },
  { name: 'lg', px: '24px' },
]

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

function DesignSystemPage() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Marz · Design System
              </h1>
              <p className="text-sm text-muted-foreground">
                Atoms · Molecules · Reusable components — synced with{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  marz-design/marzv2.pen
                </code>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <nav className="hidden gap-4 text-sm text-muted-foreground md:flex">
                <a href="#atoms" className="hover:text-foreground">
                  Atoms
                </a>
                <a href="#molecules" className="hover:text-foreground">
                  Molecules
                </a>
                <a href="#reusable" className="hover:text-foreground">
                  Reusable
                </a>
              </nav>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl space-y-16 px-6 py-10">
          <AtomsSection />
          <MoleculesSection />
          <ReusableSection />
        </main>
      </div>
    </TooltipProvider>
  )
}

// -----------------------------------------------------------------------------
// Atoms
// -----------------------------------------------------------------------------

function AtomsSection() {
  return (
    <section id="atoms" className="space-y-10">
      <SectionHeader
        title="Atoms"
        subtitle="Design tokens pulled from the .pen. No markup — only primitive values."
      />

      {colorGroups.map((group) => (
        <TokenGroup key={group.title} title={group.title}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {group.tokens.map((token) => (
              <ColorSwatch key={token} token={token} />
            ))}
          </div>
        </TokenGroup>
      ))}

      <TokenGroup title="Radius">
        <div className="flex flex-wrap gap-4">
          {radiusTokens.map(({ name, px }) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <div
                className="h-16 w-16 border border-border bg-muted"
                style={{ borderRadius: `var(--radius-${name})` }}
              />
              <div className="text-center">
                <div className="font-mono text-xs">--radius-{name}</div>
                <div className="text-xs text-muted-foreground">{px}</div>
              </div>
            </div>
          ))}
        </div>
      </TokenGroup>

      <TokenGroup title="Spacing (base 4px)">
        <div className="space-y-1.5">
          {spacingTokens.map(([name, px]) => (
            <div key={name} className="flex items-center gap-3">
              <span className="w-20 font-mono text-xs text-muted-foreground">
                --spacing-{name}
              </span>
              <span className="w-14 font-mono text-xs tabular-nums text-muted-foreground">
                {px}
              </span>
              <span
                className="h-3 rounded-sm bg-primary/80"
                style={{ width: `var(--spacing-${name})` }}
              />
            </div>
          ))}
        </div>
      </TokenGroup>

      <TokenGroup title="Typography — font-size">
        <div className="space-y-3">
          {fontSizeTokens.map(({ name, px }) => (
            <div
              key={name}
              className="flex items-baseline gap-4 border-b border-border pb-2"
            >
              <span
                className="font-sans text-foreground"
                style={{ fontSize: `var(--font-size-${name})` }}
              >
                The quick brown fox
              </span>
              <span className="ml-auto font-mono text-xs text-muted-foreground">
                --font-size-{name} · {px}
              </span>
            </div>
          ))}
        </div>
      </TokenGroup>

      <TokenGroup title="Typography — font-weight">
        <div className="space-y-2">
          {fontWeightTokens.map(({ name, value }) => (
            <div
              key={name}
              className="flex items-baseline gap-4 border-b border-border pb-2"
            >
              <span className="text-xl" style={{ fontWeight: value }}>
                The quick brown fox
              </span>
              <span className="ml-auto font-mono text-xs text-muted-foreground">
                --font-weight-{name} · {value}
              </span>
            </div>
          ))}
        </div>
      </TokenGroup>

      <TokenGroup title="Icon sizes">
        <div className="flex items-end gap-6">
          {iconSizeTokens.map(({ name, px }) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <div
                className="rounded-sm bg-primary/80"
                style={{
                  width: `var(--icon-size-${name})`,
                  height: `var(--icon-size-${name})`,
                }}
              />
              <div className="text-center">
                <div className="font-mono text-xs">--icon-size-{name}</div>
                <div className="text-xs text-muted-foreground">{px}</div>
              </div>
            </div>
          ))}
        </div>
      </TokenGroup>

      <TokenGroup title="Fonts">
        <div className="space-y-2">
          <div className="flex items-baseline gap-4">
            <span className="font-sans text-xl">Marz · Geist Sans</span>
            <span className="ml-auto font-mono text-xs text-muted-foreground">
              --font-sans
            </span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="font-mono text-xl">Marz · Geist Mono</span>
            <span className="ml-auto font-mono text-xs text-muted-foreground">
              --font-mono
            </span>
          </div>
        </div>
      </TokenGroup>
    </section>
  )
}

function ColorSwatch({ token }: { token: string }) {
  const varName = `--${token}`
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-card p-2.5">
      <div
        className="h-10 w-10 shrink-0 rounded-md border border-border"
        style={{ backgroundColor: `var(${varName})` }}
      />
      <div className="min-w-0">
        <div className="truncate font-mono text-xs">{varName}</div>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Molecules — shadcn primitives wired to our tokens
// -----------------------------------------------------------------------------

function MoleculesSection() {
  return (
    <section id="molecules" className="space-y-10">
      <SectionHeader
        title="Molecules"
        subtitle="Reusable primitives, no product domain. All consume atoms."
      />

      <TokenGroup title="Buttons">
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Destructive</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="icon">
            ★
          </Button>
        </div>
      </TokenGroup>

      <TokenGroup title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </TokenGroup>

      <TokenGroup title="Avatars">
        <div className="flex items-end gap-3">
          {[
            { size: 'h-6 w-6', label: 'XS' },
            { size: 'h-8 w-8', label: 'SM' },
            { size: 'h-10 w-10', label: 'MD' },
            { size: 'h-12 w-12', label: 'LG' },
            { size: 'h-16 w-16', label: 'XL' },
          ].map(({ size, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <Avatar className={size}>
                <AvatarFallback>MZ</AvatarFallback>
              </Avatar>
              <span className="font-mono text-xs text-muted-foreground">
                {label}
              </span>
            </div>
          ))}
        </div>
      </TokenGroup>

      <TokenGroup title="Inputs">
        <div className="grid max-w-md gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="ds-email">Email</Label>
            <Input id="ds-email" type="email" placeholder="you@marz.co" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ds-password">Password</Label>
            <Input id="ds-password" type="password" placeholder="••••••••" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ds-disabled">Disabled</Label>
            <Input id="ds-disabled" disabled placeholder="Can't touch this" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ds-textarea">Textarea</Label>
            <Textarea id="ds-textarea" placeholder="Tell us more..." rows={3} />
          </div>
        </div>
      </TokenGroup>

      <TokenGroup title="Select">
        <div className="max-w-xs">
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Pick a platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="twitter_x">Twitter / X</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </TokenGroup>

      <TokenGroup title="Switch · Slider">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch id="ds-switch" />
            <Label htmlFor="ds-switch">Notifications enabled</Label>
          </div>
          <div className="max-w-sm">
            <Label className="mb-2 block">Volume</Label>
            <Slider defaultValue={[40]} max={100} step={1} />
          </div>
        </div>
      </TokenGroup>

      <TokenGroup title="Tooltip">
        <div className="flex gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>Tooltip anchored to the trigger</TooltipContent>
          </Tooltip>
        </div>
      </TokenGroup>

      <TokenGroup title="Separator">
        <div>
          <p className="text-sm">Above</p>
          <Separator className="my-3" />
          <p className="text-sm">Below</p>
        </div>
      </TokenGroup>

      <TokenGroup title="Card">
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Luminal Studio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="text-muted-foreground">Tier · Mid · YouTube</div>
            <div className="text-muted-foreground">Avg engagement · 4.2%</div>
          </CardContent>
        </Card>
      </TokenGroup>
    </section>
  )
}

// -----------------------------------------------------------------------------
// Reusable — organisms with product domain. Rendered with mock data so the
// implementation stays alive and visible. Not-yet-implemented ones appear as
// a "pending" list at the bottom.
// -----------------------------------------------------------------------------

function ReusableSection() {
  return (
    <section id="reusable" className="space-y-12">
      <SectionHeader
        title="Reusable components"
        subtitle="Organisms with product-domain knowledge. Each consumes tokens and molecules; domain data is mocked here for preview."
      />

      <ShowcaseGroup title="Chat · event bubbles" context="features/chat">
        <div className="flex flex-wrap gap-3">
          <EventBubble severity="info" direction="out">
            Draft submitted
          </EventBubble>
          <EventBubble severity="info" direction="in">
            Draft submitted
          </EventBubble>
          <EventBubble severity="success" direction="out">
            YouTube link approved
          </EventBubble>
          <EventBubble severity="success" direction="in">
            YouTube link approved
          </EventBubble>
          <EventBubble severity="warning" direction="out">
            Awaiting review
          </EventBubble>
          <EventBubble severity="warning" direction="in">
            Awaiting review
          </EventBubble>
          <EventBubble severity="destructive" direction="out">
            Draft rejected — changes requested
          </EventBubble>
          <EventBubble severity="destructive" direction="in">
            Draft rejected — changes requested
          </EventBubble>
        </div>
      </ShowcaseGroup>

      <ShowcaseGroup title="Chat · rail item" context="features/chat">
        <div className="flex max-w-md flex-col gap-1 rounded-lg border border-border bg-card p-2">
          <ChatRailItem
            name="Luminal Studio"
            preview="Sure, I'll send the draft tomorrow"
            online
            unread
          />
          <ChatRailItem name="Nova Flux" preview="Got it — rendering now" />
          <ChatRailItem
            name="Terra Collective"
            preview="Final cut attached ⬇"
            active
            online
          />
        </div>
      </ShowcaseGroup>

      <ShowcaseGroup title="Chat · header actions" context="features/chat">
        <ChatHeaderActions
          conversationId="ds-conv-1"
          canSendOffer={{ visible: true, disabled: false }}
          onSendOffer={() => {}}
        />
      </ShowcaseGroup>

      <ShowcaseGroup title="Shell · sidebar" context="features/identity">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1 rounded-lg border border-sidebar-border bg-sidebar p-2">
            <SidebarItem icon={Inbox} label="Inbox" active />
            <SidebarItem icon={Compass} label="Discovery" />
            <SidebarItem icon={Users} label="Creators" />
            <SidebarItem icon={Video} label="Campaigns" />
            <SidebarItem icon={BarChart3} label="Metrics" />
          </div>
          <div className="flex flex-col items-start gap-2 rounded-lg border border-sidebar-border bg-sidebar p-2">
            <SidebarItem icon={Inbox} label="Inbox" collapsed active />
            <SidebarItem icon={Compass} label="Discovery" collapsed />
            <SidebarItem icon={Users} label="Creators" collapsed />
            <SidebarItem icon={Video} label="Campaigns" collapsed />
            <SidebarItem icon={BarChart3} label="Metrics" collapsed />
          </div>
        </div>
      </ShowcaseGroup>

      <ShowcaseGroup title="Tooltips" context="shared/ui + features/identity">
        <div className="flex items-center gap-4">
          <DarkTooltip>Tooltip</DarkTooltip>
          <SidebarTooltip label="Inbox" />
        </div>
      </ShowcaseGroup>

      <ShowcaseGroup title="Icon button" context="shared/ui">
        <div className="flex items-center gap-3">
          <IconButton aria-label="view">
            <Eye />
          </IconButton>
          <IconButton variant="outline" aria-label="view outline">
            <Eye />
          </IconButton>
          <IconButton variant="solid" aria-label="view solid">
            <Eye />
          </IconButton>
          <IconButton shape="circle" aria-label="close circle">
            <XIcon />
          </IconButton>
          <IconButton size="sm" aria-label="small">
            <Eye />
          </IconButton>
          <IconButton size="lg" aria-label="large">
            <Eye />
          </IconButton>
        </div>
      </ShowcaseGroup>

      <ShowcaseGroup title="Link item" context="features/deliverables">
        <div className="max-w-lg space-y-2">
          <LinkItem url="youtube.com/watch?v=abc123" status="pending" />
          <LinkItem url="youtube.com/watch?v=def456" status="approved" />
          <LinkItem url="youtube.com/watch?v=ghi789" status="rejected" />
        </div>
      </ShowcaseGroup>

      <ShowcaseGroup
        title="Campaign workspace tabs"
        context="features/campaigns"
      >
        <CampaignWorkspaceTabs
          tabs={[
            { id: 'discovery', label: 'Discovery', icon: Compass },
            { id: 'creators', label: 'Creators', icon: Users },
            { id: 'videos', label: 'Videos', icon: Video },
            { id: 'metrics', label: 'Metrics', icon: BarChart3 },
          ]}
          activeId="creators"
        />
      </ShowcaseGroup>

      <ShowcaseGroup
        title="Request changes modal"
        context="features/deliverables"
      >
        <RequestChangesModal title="YouTube Video · Luminal Studio" inline />
      </ShowcaseGroup>

      <ShowcaseGroup
        title="Offer card · received / sent"
        context="features/offers"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <OfferCard
            variant="received"
            title="Q4 Echo Wireless Series"
            budget="$4,500.00"
            deadline="Oct 12"
            platforms={[
              { platform: 'youtube', label: '1× YouTube Video' },
              { platform: 'instagram', label: 'IG Reels' },
            ]}
          />
          <OfferCard
            variant="sent"
            title="Q4 Echo Wireless Series"
            budget="$4,500.00"
            deadline="Oct 12"
            platforms={[
              { platform: 'youtube', label: '1× YouTube Video' },
              { platform: 'instagram', label: 'IG Reels' },
            ]}
          />
        </div>
      </ShowcaseGroup>

      <ShowcaseGroup title="Offer card · collapsed" context="features/offers">
        <div className="max-w-md space-y-2">
          <OfferCardCollapsed offerId="OFR-2847" status="accepted" />
          <OfferCardCollapsed offerId="OFR-2848" status="sent" />
          <OfferCardCollapsed offerId="OFR-2849" status="rejected" />
          <OfferCardCollapsed offerId="OFR-2850" status="negotiating" />
        </div>
      </ShowcaseGroup>

      <ShowcaseGroup
        title="Offer accepted · creator / brand"
        context="features/offers"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <OfferAcceptedCard audience="creator" deadline="Oct 12" />
          <OfferAcceptedCard
            audience="brand"
            creatorName="Luminal Studio"
            deadline="Oct 12"
          />
        </div>
      </ShowcaseGroup>

      <ShowcaseGroup
        title="Draft submitted · creator / brand"
        context="features/deliverables"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <DraftSubmittedCard
            message={{
              id: 'msg-1',
              author_account_id: 'creator-1',
              event_type: 'DraftSubmitted',
              payload: {
                snapshot: {
                  event_type: 'DraftSubmitted',
                  deliverable_id: 'del-1',
                  deliverable_platform: 'youtube',
                  deliverable_format: 'long_form',
                  deliverable_offer_stage_id: null,
                  draft_id: 'draft-1',
                  version: 1,
                  original_filename: 'echo_wireless_draft_v1.mp4',
                  file_size_bytes: 148897152,
                  duration_sec: 204,
                  mime_type: 'video/mp4',
                  thumbnail_url: null,
                  playback_url: 'https://example.com/video.mp4',
                  playback_url_expires_at: new Date().toISOString(),
                  submitted_at: new Date().toISOString(),
                  submitted_by_account_id: 'creator-1',
                },
              },
              created_at: new Date().toISOString(),
            }}
            currentAccountId="creator-1"
            counterpartDisplayName="Brand Name"
            conversationId="conv-1"
            sessionKind="creator"
          />
          <DraftSubmittedCard
            message={{
              id: 'msg-2',
              author_account_id: 'creator-1',
              event_type: 'DraftSubmitted',
              payload: {
                snapshot: {
                  event_type: 'DraftSubmitted',
                  deliverable_id: 'del-1',
                  deliverable_platform: 'youtube',
                  deliverable_format: 'long_form',
                  deliverable_offer_stage_id: null,
                  draft_id: 'draft-1',
                  version: 1,
                  original_filename: 'echo_wireless_draft_v1.mp4',
                  file_size_bytes: 148897152,
                  duration_sec: 204,
                  mime_type: 'video/mp4',
                  thumbnail_url: null,
                  playback_url: 'https://example.com/video.mp4',
                  playback_url_expires_at: new Date().toISOString(),
                  submitted_at: new Date().toISOString(),
                  submitted_by_account_id: 'creator-1',
                },
              },
              created_at: new Date().toISOString(),
            }}
            currentAccountId="brand-1"
            counterpartDisplayName="Creator Name"
            conversationId="conv-1"
            sessionKind="brand"
          />
        </div>
      </ShowcaseGroup>

      <ShowcaseGroup
        title="Draft submitted · portrait (Reel / Short)"
        context="features/deliverables"
      >
        <div className="max-w-xs">
          <DraftSubmittedCard
            message={{
              id: 'msg-3',
              author_account_id: 'creator-1',
              event_type: 'DraftSubmitted',
              payload: {
                snapshot: {
                  event_type: 'DraftSubmitted',
                  deliverable_id: 'del-2',
                  deliverable_platform: 'instagram',
                  deliverable_format: 'reel',
                  deliverable_offer_stage_id: null,
                  draft_id: 'draft-2',
                  version: 1,
                  original_filename: 'reel_draft.mp4',
                  file_size_bytes: 39845888,
                  duration_sec: 45,
                  mime_type: 'video/mp4',
                  thumbnail_url: null,
                  playback_url: 'https://example.com/reel.mp4',
                  playback_url_expires_at: new Date().toISOString(),
                  submitted_at: new Date().toISOString(),
                  submitted_by_account_id: 'creator-1',
                },
              },
              created_at: new Date().toISOString(),
            }}
            currentAccountId="brand-1"
            counterpartDisplayName="Creator Name"
            conversationId="conv-1"
            sessionKind="brand"
          />
        </div>
      </ShowcaseGroup>

      <ShowcaseGroup title="Draft approved" context="features/deliverables">
        <div className="max-w-md">
          <DraftApprovedCard
            message={{
              id: 'msg-4',
              author_account_id: 'brand-1',
              event_type: 'DraftApproved',
              payload: {
                snapshot: {
                  event_type: 'DraftApproved',
                  deliverable_id: 'del-1',
                  deliverable_platform: 'youtube',
                  deliverable_format: 'long_form',
                  deliverable_offer_stage_id: null,
                  draft_id: 'draft-1',
                  version: 1,
                  approved_at: new Date().toISOString(),
                  approved_by_account_id: 'brand-1',
                },
              },
              created_at: new Date().toISOString(),
            }}
            currentAccountId="brand-1"
            counterpartDisplayName="Creator Name"
          />
        </div>
      </ShowcaseGroup>

      <ShowcaseGroup
        title="Link submitted · creator / brand"
        context="features/deliverables"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <LinkSubmittedCard
            audience="creator"
            message="Just published! Sharing the link here."
            url="youtube.com/watch?v=xK93"
            platform="youtube"
          />
          <LinkSubmittedCard
            audience="brand"
            message="It's live! Here's the YouTube link. Hope you love how it turned out!"
            url="youtube.com/watch?v=xK93"
            platform="youtube"
            payoutAmount="$4,500.00"
          />
        </div>
      </ShowcaseGroup>

      <ShowcaseGroup
        title="Request changes card"
        context="features/deliverables"
      >
        <div className="max-w-md">
          <RequestChangesCard
            message={{
              id: 'msg-rc-1',
              author_account_id: 'acc-brand',
              event_type: 'ChangesRequested',
              payload: {
                event_type: 'ChangesRequested',
                deliverable_id: 'del-1',
                deliverable_platform: 'youtube',
                deliverable_format: 'long_form',
                deliverable_offer_stage_id: null,
                draft_id: 'draft-1',
                draft_version: 1,
                draft_thumbnail_url: null,
                categories: ['product_placement', 'audio'],
                notes:
                  'Product placement more prominent in intro. Add discount code overlay at 2:15.',
                requested_at: '2026-04-27T12:00:00Z',
                requested_by_account_id: 'acc-brand',
              },
              created_at: '2026-04-27T12:00:00Z',
            }}
            currentAccountId="acc-brand"
            counterpartDisplayName="María García"
          />
        </div>
      </ShowcaseGroup>

      <ShowcaseGroup
        title="Payment card · received / sent"
        context="features/payments"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <PaymentCard audience="received" amount="$4,575.00" />
          <PaymentCard audience="sent" amount="$4,575.00" />
        </div>
      </ShowcaseGroup>

      <ShowcaseGroup title="Deliverable card" context="features/deliverables">
        <div className="grid gap-4 md:grid-cols-2">
          <DeliverableCard
            platform="youtube"
            title="YouTube Video"
            status="draft_submitted"
            drafts={[
              {
                filename: 'draft_v1.mp4',
                duration: '3:24',
                status: 'changes_requested',
              },
              {
                filename: 'draft_v2.mp4',
                duration: '3:22',
                status: 'in_review',
              },
            ]}
          />
          <DeliverableCard
            platform="instagram"
            title="IG Reel standalone"
            status="pending"
            drafts={[]}
          />
        </div>
      </ShowcaseGroup>

      <ShowcaseGroup
        title="Stage card · expanded / collapsed"
        context="features/deliverables"
      >
        <div className="space-y-3">
          <StageCard
            stageNumber={1}
            name="Launch week"
            deadline="Oct 12"
            status="active"
          >
            <DeliverableCard
              platform="youtube"
              title="YouTube Video"
              status="draft_submitted"
              drafts={[
                {
                  filename: 'draft_v1.mp4',
                  duration: '3:24',
                  status: 'changes_requested',
                },
                {
                  filename: 'draft_v2.mp4',
                  duration: '3:22',
                  status: 'in_review',
                },
              ]}
            />
          </StageCard>
          <StageCard
            stageNumber={2}
            name="Follow-up week"
            deadline="Oct 20"
            status="upcoming"
          />
          <StageCard
            stageNumber={3}
            name="Closing week"
            deadline="Nov 5"
            status="done"
          />
        </div>
      </ShowcaseGroup>

      <ShowcaseGroup title="Brand header card" context="features/identity">
        <BrandHeaderCard
          name="Marz Brand"
          meta="Consumer electronics · 85K followers"
        />
      </ShowcaseGroup>

      <ShowcaseGroup
        title="Creator header card · collapsed / expanded"
        context="features/identity"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <CreatorHeaderCard
            name="Luminal Studio"
            handle="@luminalstudio"
            collapsed
          />
          <CreatorHeaderCard
            name="Luminal Studio"
            handle="@luminalstudio"
            stats={[
              { label: 'Followers', value: '245K' },
              { label: 'Eng.', value: '4.8%' },
              { label: 'Collabs', value: '32' },
            ]}
          />
        </div>
      </ShowcaseGroup>

      <ShowcaseGroup
        title="Offer block · current offer"
        context="features/offers"
      >
        <div className="max-w-md">
          <OfferBlock
            title="Current Offer"
            offerId="OFR-2847"
            statusLabel="Accepted"
            terms={[
              { label: 'Budget', value: '$4,500.00' },
              { label: 'Deadline', value: 'Oct 12, 2024' },
              {
                label: 'Speed bonus',
                value: '+15% within 48h',
                tone: 'accent',
              },
            ]}
            sectionLabel="Deliverables"
          >
            <DeliverableCard
              platform="youtube"
              title="YouTube Video"
              status="draft_submitted"
              drafts={[
                {
                  filename: 'draft_v1.mp4',
                  duration: '3:24',
                  status: 'changes_requested',
                },
                {
                  filename: 'draft_v2.mp4',
                  duration: '3:22',
                  status: 'in_review',
                },
              ]}
            />
          </OfferBlock>
        </div>
      </ShowcaseGroup>

      <ShowcaseGroup title="Archived offers list" context="features/offers">
        <div className="max-w-md">
          <ArchivedOffersList
            offers={[
              {
                offerId: 'OFR-2801',
                amount: '$2,800',
                date: 'Sep 14, 2024',
                status: 'paid',
              },
              {
                offerId: 'OFR-2650',
                amount: '$3,200',
                date: 'Jul 02, 2024',
                status: 'paid',
              },
            ]}
          />
        </div>
      </ShowcaseGroup>

      <ShowcaseGroup
        title="Context panel · creator view (brand context)"
        context="features/identity"
      >
        <ContextPanel
          headerSlot={
            <BrandHeaderCard
              name="Marz Brand"
              meta="Consumer electronics · 85K followers"
            />
          }
          offerSlot={
            <OfferBlock
              title="Current Offer"
              offerId="OFR-2847"
              statusLabel="Accepted"
              terms={[
                { label: 'Budget', value: '$4,500.00' },
                { label: 'Deadline', value: 'Oct 12, 2024' },
                {
                  label: 'Speed bonus',
                  value: '+15% within 48h',
                  tone: 'accent',
                },
              ]}
              sectionLabel="Deliverables"
            >
              <DeliverableCard
                platform="youtube"
                title="YouTube Video"
                status="draft_submitted"
                drafts={[
                  {
                    filename: 'draft_v1.mp4',
                    duration: '3:24',
                    status: 'changes_requested',
                  },
                  {
                    filename: 'draft_v2.mp4',
                    duration: '3:22',
                    status: 'in_review',
                  },
                ]}
              />
            </OfferBlock>
          }
          archiveSlot={
            <ArchivedOffersList
              offers={[
                {
                  offerId: 'OFR-2801',
                  amount: '$2,800',
                  date: 'Sep 14, 2024',
                  status: 'paid',
                },
                {
                  offerId: 'OFR-2650',
                  amount: '$3,200',
                  date: 'Jul 02, 2024',
                  status: 'paid',
                },
              ]}
            />
          }
        />
      </ShowcaseGroup>

      <ShowcaseGroup
        title="Context panel · brand view (creator context, expanded)"
        context="features/identity"
      >
        <ContextPanel
          headerSlot={
            <CreatorHeaderCard
              name="Luminal Studio"
              handle="@luminalstudio"
              stats={[
                { label: 'Followers', value: '245K' },
                { label: 'Eng.', value: '4.8%' },
                { label: 'Collabs', value: '32' },
              ]}
            />
          }
          offerSlot={
            <OfferBlock
              title="Current Offer"
              offerId="OFR-2847"
              statusLabel="Accepted"
              terms={[
                { label: 'Budget', value: '$4,500.00' },
                { label: 'Deadline', value: 'Oct 12, 2024' },
                {
                  label: 'Speed bonus',
                  value: '+15% within 48h',
                  tone: 'accent',
                },
              ]}
              sectionLabel="Stages"
            >
              <StageCard
                stageNumber={1}
                name="Launch week"
                deadline="Oct 5"
                status="done"
              />
              <StageCard
                stageNumber={2}
                name="Follow-up week"
                deadline="Oct 12"
                status="active"
              >
                <DeliverableCard
                  platform="youtube"
                  title="YouTube Video"
                  status="draft_submitted"
                  drafts={[
                    {
                      filename: 'draft_v1.mp4',
                      duration: '3:24',
                      status: 'changes_requested',
                    },
                  ]}
                />
              </StageCard>
              <StageCard
                stageNumber={3}
                name="Holiday content"
                deadline="Dec 1"
                status="upcoming"
              />
            </OfferBlock>
          }
        />
      </ShowcaseGroup>

      <ShowcaseGroup title="Campaign mini card" context="features/campaigns">
        <div className="max-w-sm">
          <CampaignMiniCard
            name="Summer Glow 2026"
            startDate="Jun 30"
            status="active"
            creators={6}
            budget="$42k"
            videos={{ done: 3, total: 8 }}
            platforms={['YouTube', 'Instagram']}
          />
        </div>
      </ShowcaseGroup>

      <ShowcaseGroup title="Offer type chooser" context="features/offers">
        <OfferTypeChooser value="bundle" />
      </ShowcaseGroup>

      <ShowcaseGroup title="Bundle platform row" context="features/offers">
        <div className="max-w-xl space-y-2">
          <DemoBundlePlatformRow
            platform="youtube"
            label="YouTube"
            format="Long-form video"
            amount={2500}
          />
          <DemoBundlePlatformRow
            platform="instagram"
            label="Instagram Reels"
            format="Short-form vertical"
            amount={1200}
          />
          <DemoBundlePlatformRow
            platform="tiktok"
            label="TikTok"
            format="Short-form vertical"
            amount={800}
          />
        </div>
      </ShowcaseGroup>

      <ShowcaseGroup title="Deadline field" context="features/offers">
        <div className="max-w-xs">
          <DeadlineField value="Oct 12, 2024" />
        </div>
      </ShowcaseGroup>

      <ShowcaseGroup title="Summary total row" context="features/offers">
        <div className="max-w-md space-y-2">
          <SummaryTotalRow label="Bundle total" amount="$4,500.00" />
          <SummaryTotalRow
            label="Campaign total"
            amount="$12,500.00"
            emphasis="strong"
          />
        </div>
      </ShowcaseGroup>

      <ShowcaseGroup title="Stage editor" context="features/offers">
        <div className="max-w-xl">
          <StageEditor
            stageNumber={1}
            name="Launch week"
            deadline="Oct 12"
            subtotal="$2,500"
          >
            <DemoBundlePlatformRow
              platform="youtube"
              label="YouTube video"
              format="Long-form"
              amount={1800}
            />
          </StageEditor>
        </div>
      </ShowcaseGroup>

      <ShowcaseGroup title="Send offer · single" context="features/offers">
        <SendOfferSidesheet creatorName="Luminal Studio" mode="single">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Main Platform</Label>
            <Select defaultValue="youtube">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-2 block text-sm font-semibold">
                Budget (USD)
              </Label>
              <DeadlineField value="$4,500.00" />
            </div>
            <div>
              <Label className="mb-2 block text-sm font-semibold">
                Deadline
              </Label>
              <DeadlineField value="Oct 12, 2024" />
            </div>
          </div>

          <SpeedBonusBlock
            enabled
            tiers={[
              {
                id: 't1',
                value: 48,
                unit: 'hours',
                mode: 'percent',
                amount: 15,
              },
              { id: 't2', value: 7, unit: 'days', mode: 'amount', amount: 450 },
            ]}
          />
        </SendOfferSidesheet>
      </ShowcaseGroup>

      <ShowcaseGroup title="Send offer · bundle" context="features/offers">
        <SendOfferSidesheet creatorName="Luminal Studio" mode="bundle">
          <div className="space-y-3 rounded-2xl bg-muted p-4">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="font-semibold text-foreground">
                  Bundle Deliverables
                </div>
                <div className="text-xs text-muted-foreground">
                  1 video per platform
                </div>
              </div>
              <Badge className="rounded-full">3 platforms</Badge>
            </div>
            <DemoBundlePlatformRow
              platform="youtube"
              label="YouTube"
              format="Long-form video"
              amount={2500}
            />
            <DemoBundlePlatformRow
              platform="instagram"
              label="Instagram Reels"
              format="Short-form vertical"
              amount={1200}
            />
            <DemoBundlePlatformRow
              platform="tiktok"
              label="TikTok"
              format="Short-form vertical"
              amount={800}
            />
            <SummaryTotalRow label="Bundle total" amount="$4,500.00" />
          </div>
          <div>
            <Label className="mb-2 block text-sm font-semibold">Deadline</Label>
            <DeadlineField value="Oct 12, 2024" />
          </div>
        </SendOfferSidesheet>
      </ShowcaseGroup>

      <ShowcaseGroup title="Send offer · multistage" context="features/offers">
        <SendOfferSidesheet creatorName="Luminal Studio" mode="multistage">
          <div className="space-y-3">
            <StageEditor
              stageNumber={1}
              name="Launch week"
              deadline="Oct 12"
              subtotal="$2,500"
            >
              <DemoBundlePlatformRow
                platform="youtube"
                label="YouTube video"
                format="Long-form"
                amount={1800}
              />
            </StageEditor>
            <StageEditor
              stageNumber={2}
              name="Mid-campaign"
              deadline="Oct 20"
              subtotal="$1,500"
            >
              <DemoBundlePlatformRow
                platform="youtube"
                label="YouTube video"
                format="Long-form"
                amount={1800}
              />
            </StageEditor>
            <SummaryTotalRow
              label="Campaign total"
              amount="$4,500.00"
              emphasis="strong"
            />
          </div>
        </SendOfferSidesheet>
      </ShowcaseGroup>

      <MobileSection />
    </section>
  )
}

function DemoBundlePlatformRow({
  platform,
  label,
  format,
  amount,
}: {
  platform: string
  label: string
  format: string
  amount: number
}) {
  return (
    <BundlePlatformRow platform={platform} onRemove={() => {}}>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-foreground">
          {label}
        </div>
        <div className="truncate text-xs text-muted-foreground">{format}</div>
      </div>
      <div className="flex items-center gap-2 rounded-full bg-muted pl-3 pr-1">
        <span className="text-sm text-muted-foreground">$</span>
        <span className="w-20 py-2 text-right font-mono text-sm font-semibold text-foreground">
          {amount.toLocaleString()}
        </span>
      </div>
    </BundlePlatformRow>
  )
}

function MobileSection() {
  return (
    <div className="space-y-10 rounded-2xl border border-border bg-muted/30 p-6">
      <div>
        <h3 className="text-xl font-semibold text-foreground">
          Mobile variants
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Native-aspect components. Previewed inside 375 × auto phone frames.
        </p>
      </div>

      <ShowcaseGroup
        title="Shell · status bar, topbar, tab bar, home indicator"
        context="shared/ui/mobile"
      >
        <PhoneFrame>
          <MobileStatusBar />
          <MobileTopbar title="Chat" />
          <div className="flex-1 bg-background" />
          <MobileBottomTabBar
            activeId="workspace"
            tabs={[
              { id: 'workspace', label: 'Workspace', icon: MessageSquare },
              { id: 'campaigns', label: 'Campaigns', icon: LayoutGrid },
              { id: 'discover', label: 'Discover', icon: Search },
              { id: 'inbox', label: 'Inbox', icon: Bell },
              { id: 'profile', label: 'Profile', icon: User },
            ]}
          />
          <MobileHomeIndicator />
        </PhoneFrame>
      </ShowcaseGroup>

      <ShowcaseGroup
        title="Chat · rail + header + composer + bubbles"
        context="features/chat/mobile"
      >
        <PhoneFrame>
          <MobileChatHeader
            name="Aurora Beauty"
            subtitle="Summer Glow Launch"
            avatarFallback="AB"
          />
          <div className="flex-1 space-y-2 overflow-auto bg-background p-3">
            <MobileChatRailItem
              name="Aurora Beauty"
              preview="Sent offer · Summer Glow Launch"
              timestamp="2m"
              unreadCount={2}
              avatarFallback="AB"
            />
            <MobileMessageBubble direction="in">
              Hey! We loved your recent content on skincare routines. Interested
              in collaborating?
            </MobileMessageBubble>
            <MobileMessageBubble direction="out">
              Absolutely! Tell me more about the campaign.
            </MobileMessageBubble>
            <MobileEventBubble>Offer accepted</MobileEventBubble>
          </div>
          <MobileComposer value="" placeholder="Message" />
        </PhoneFrame>
      </ShowcaseGroup>

      <ShowcaseGroup
        title="Chat · system event cards"
        context="features/chat/mobile"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <MobileOfferCard
            variant="received"
            title="Summer Glow Launch"
            statusLabel="Pending"
            rows={[
              { label: 'Amount', value: '$2,400' },
              { label: 'Deadline', value: 'May 24' },
              { label: 'Deliverable', value: '1 Reel · 30s' },
            ]}
          />
          <MobileOfferCard
            variant="sent"
            title="Summer Glow Launch"
            statusLabel="Awaiting"
            rows={[
              { label: 'Amount', value: '$2,400' },
              { label: 'Deadline', value: 'May 24' },
              { label: 'Deliverable', value: '1 Reel · 30s' },
            ]}
          />
          <MobileDraftCard
            filename="summer_glow_reel_v1.mp4"
            duration="0:28"
            sizeLabel="18.4 MB"
            formatLabel="Reel 9:16"
            version="v1"
          />
          <MobileRequestChangesCard
            notes="Please re-shoot the opening 3 seconds — the lighting is too harsh and the product is cropped. Also lower the background music."
            signoff="Aurora Beauty · May 15"
          />
          <MobileLinkCard
            url="instagram.com/p/CxY2K9_"
            meta="Posted · Reel · 0:28 · May 18"
          />
          <MobilePaymentCard
            amount="$2,400"
            subtitle="Released to creator on May 18"
            lines={[
              { label: 'Base', amount: '$2,200' },
              { label: 'Bonus', amount: '$200' },
            ]}
          />
        </div>
      </ShowcaseGroup>

      <ShowcaseGroup
        title="Floating action · action bar"
        context="shared/ui/mobile"
      >
        <div className="flex flex-wrap items-center gap-4">
          <MobileFloatingAction
            label="Upload draft"
            icon={<Upload className="size-4" />}
          />
          <MobileActionBar>
            <Upload className="size-4" />
            Upload draft
          </MobileActionBar>
        </div>
      </ShowcaseGroup>
    </div>
  )
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex h-[640px] w-[375px] flex-col overflow-hidden rounded-[2.5rem] border-8 border-foreground bg-card">
      {children}
    </div>
  )
}

function ShowcaseGroup({
  title,
  context,
  children,
}: {
  title: string
  context: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        <span className="font-mono text-xs text-muted-foreground/70">
          {context}
        </span>
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        {children}
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Shared layout pieces
// -----------------------------------------------------------------------------

function SectionHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}) {
  return (
    <div className="border-b border-border pb-3">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  )
}

function TokenGroup({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div>{children}</div>
    </div>
  )
}
