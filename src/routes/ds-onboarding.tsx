import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Circle,
  Flame,
  Landmark,
  Sprout,
  Video,
  Camera,
  Music,
  Mic,
  Pen,
} from 'lucide-react'
import { Input } from '#/components/ui/input'
import {
  WizardShell,
  WizardTopbar,
  WizardProgress,
  WizardFooter,
  WizardSectionTitle,
} from '#/shared/ui/wizard'
import {
  OnboardingOptionChip,
  OnboardingVerticalCard,
  OnboardingContentTypeChip,
  OnboardingTierCard,
} from '#/features/identity/onboarding/shared/components'
import { FieldRow } from '#/shared/ui/form'

export const Route = createFileRoute('/ds-onboarding')({
  component: DsOnboardingPage,
})

function DsOnboardingPage() {
  const [chipSelections, setChipSelections] = useState<Record<string, boolean>>(
    {},
  )
  const [verticalCard, setVerticalCard] = useState<string | null>('fintech')
  const [contentType, setContentType] = useState<Record<string, boolean>>({})
  const [tier, setTier] = useState<string | null>('fuerza')

  const toggleChip = (id: string) =>
    setChipSelections((prev) => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="min-h-screen bg-background">
      {/* Standalone components */}
      <section className="space-y-8 border-b border-border p-8">
        <h2 className="text-xl font-bold text-foreground">OnboardingTopbar</h2>
        <div className="overflow-hidden rounded-xl border border-border">
          <WizardTopbar stepLabel="Paso 1 de 17" onExit={() => {}} />
        </div>
      </section>

      <section className="space-y-8 border-b border-border p-8">
        <h2 className="text-xl font-bold text-foreground">
          OnboardingProgress
        </h2>
        <div className="space-y-4">
          <WizardProgress percent={0} />
          <WizardProgress percent={25} />
          <WizardProgress percent={50} />
          <WizardProgress percent={75} />
          <WizardProgress percent={100} />
        </div>
      </section>

      <section className="space-y-8 border-b border-border p-8">
        <h2 className="text-xl font-bold text-foreground">OnboardingFooter</h2>
        <div className="overflow-hidden rounded-xl border border-border">
          <WizardFooter
            onBack={() => {}}
            onNext={() => {}}
            nextLabel="Continuar"
          />
        </div>
        <div className="overflow-hidden rounded-xl border border-border">
          <WizardFooter onNext={() => {}} nextDisabled />
        </div>
        <div className="overflow-hidden rounded-xl border border-border">
          <WizardFooter onNext={() => {}} isLoading />
        </div>
      </section>

      <section className="space-y-8 border-b border-border p-8">
        <h2 className="text-xl font-bold text-foreground">
          OnboardingSectionTitle
        </h2>
        <div className="flex justify-center">
          <WizardSectionTitle
            title="Título de pantalla"
            subtitle="Subcopy que ecoa un dato previo del usuario."
          />
        </div>
      </section>

      <section className="space-y-8 border-b border-border p-8">
        <h2 className="text-xl font-bold text-foreground">FieldRow</h2>
        <div className="flex flex-col items-center gap-4">
          <FieldRow label="Nombre de marca" className="max-w-[440px]">
            {(aria) => (
              <Input {...aria} placeholder="Escribe tu nombre de marca" />
            )}
          </FieldRow>
          <FieldRow
            label="Sitio web"
            hint="Ingresa la URL de tu sitio web"
            className="max-w-[440px]"
          >
            {(aria) => <Input {...aria} placeholder="https://ejemplo.com" />}
          </FieldRow>
          <FieldRow
            label="Email"
            error="El email es requerido"
            className="max-w-[440px]"
          >
            {(aria) => <Input {...aria} placeholder="email@ejemplo.com" />}
          </FieldRow>
        </div>
      </section>

      <section className="space-y-8 border-b border-border p-8">
        <h2 className="text-xl font-bold text-foreground">
          OnboardingOptionChip
        </h2>
        <div className="flex flex-wrap gap-3">
          {['Moda', 'Tecnología', 'Belleza', 'Deportes', 'Comida'].map(
            (opt) => (
              <OnboardingOptionChip
                key={opt}
                label={opt}
                selected={!!chipSelections[opt]}
                onToggle={() => toggleChip(opt)}
              />
            ),
          )}
        </div>
      </section>

      <section className="space-y-8 border-b border-border p-8">
        <h2 className="text-xl font-bold text-foreground">
          OnboardingVerticalCard
        </h2>
        <div className="flex flex-wrap gap-4">
          {[
            { id: 'general', label: 'General', icon: Circle },
            { id: 'fintech', label: 'Fintech', icon: Landmark },
            { id: 'health', label: 'Salud', icon: Sprout },
          ].map(({ id, label, icon }) => (
            <OnboardingVerticalCard
              key={id}
              label={label}
              icon={icon}
              selected={verticalCard === id}
              onToggle={() =>
                setVerticalCard((prev) => (prev === id ? null : id))
              }
            />
          ))}
        </div>
      </section>

      <section className="space-y-8 border-b border-border p-8">
        <h2 className="text-xl font-bold text-foreground">
          OnboardingContentTypeChip
        </h2>
        <div className="flex flex-wrap gap-3">
          {[
            { id: 'video', label: 'Video', icon: Video },
            { id: 'foto', label: 'Foto', icon: Camera },
            { id: 'musica', label: 'Música', icon: Music },
            { id: 'podcast', label: 'Podcast', icon: Mic },
            { id: 'blog', label: 'Blog', icon: Pen },
          ].map(({ id, label, icon }) => (
            <OnboardingContentTypeChip
              key={id}
              label={label}
              icon={icon}
              selected={!!contentType[id]}
              onToggle={() =>
                setContentType((prev) => ({ ...prev, [id]: !prev[id] }))
              }
            />
          ))}
        </div>
      </section>

      <section className="space-y-8 border-b border-border p-8">
        <h2 className="text-xl font-bold text-foreground">
          OnboardingTierCard
        </h2>
        <div className="flex flex-wrap gap-4">
          {[
            {
              id: 'semilla',
              label: 'Semilla',
              desc: '1K–5K followers',
              icon: Sprout,
            },
            {
              id: 'fuerza',
              label: 'Fuerza',
              desc: '20K–100K followers',
              icon: Flame,
            },
          ].map(({ id, label, desc, icon }) => (
            <OnboardingTierCard
              key={id}
              label={label}
              description={desc}
              icon={icon}
              selected={tier === id}
              onToggle={() => setTier((prev) => (prev === id ? null : id))}
            />
          ))}
        </div>
      </section>

      {/* Full Shell demo */}
      <section className="space-y-8 p-8">
        <h2 className="text-xl font-bold text-foreground">
          OnboardingShell (full)
        </h2>
        <div className="h-[600px] overflow-hidden rounded-xl border border-border">
          <WizardShell
            stepLabel="Paso 3 de 17"
            percent={18}
            onBack={() => {}}
            onNext={() => {}}
            onExit={() => {}}
          >
            <WizardSectionTitle
              title="¿En qué industria opera tu marca?"
              subtitle="Esto nos ayuda a conectarte con los creadores adecuados."
            />
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              {[
                { id: 'general', label: 'General', icon: Circle },
                { id: 'fintech', label: 'Fintech', icon: Landmark },
                { id: 'health', label: 'Salud', icon: Sprout },
              ].map(({ id, label, icon }) => (
                <OnboardingVerticalCard
                  key={id}
                  label={label}
                  icon={icon}
                  selected={verticalCard === id}
                  onToggle={() =>
                    setVerticalCard((prev) => (prev === id ? null : id))
                  }
                />
              ))}
            </div>
          </WizardShell>
        </div>
      </section>

      <section className="space-y-8 p-8">
        <h2 className="text-xl font-bold text-foreground">
          OnboardingShell (loading, no back)
        </h2>
        <div className="h-[400px] overflow-hidden rounded-xl border border-border">
          <WizardShell
            stepLabel="Paso 17 de 17"
            percent={100}
            onNext={() => {}}
            nextLabel="Finalizar"
            isLoading
            onExit={() => {}}
          >
            <WizardSectionTitle title="Procesando tu perfil..." />
          </WizardShell>
        </div>
      </section>
    </div>
  )
}
