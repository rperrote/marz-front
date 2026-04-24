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
  OnboardingShell,
  OnboardingTopbar,
  OnboardingProgress,
  OnboardingFooter,
  OnboardingField,
  OnboardingOptionChip,
  OnboardingVerticalCard,
  OnboardingContentTypeChip,
  OnboardingTierCard,
  OnboardingSectionTitle,
} from '#/features/identity/onboarding/shared/components'

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
          <OnboardingTopbar stepLabel="Paso 1 de 17" onExit={() => {}} />
        </div>
      </section>

      <section className="space-y-8 border-b border-border p-8">
        <h2 className="text-xl font-bold text-foreground">
          OnboardingProgress
        </h2>
        <div className="space-y-4">
          <OnboardingProgress percent={0} />
          <OnboardingProgress percent={25} />
          <OnboardingProgress percent={50} />
          <OnboardingProgress percent={75} />
          <OnboardingProgress percent={100} />
        </div>
      </section>

      <section className="space-y-8 border-b border-border p-8">
        <h2 className="text-xl font-bold text-foreground">OnboardingFooter</h2>
        <div className="overflow-hidden rounded-xl border border-border">
          <OnboardingFooter
            onBack={() => {}}
            onNext={() => {}}
            nextLabel="Continuar"
          />
        </div>
        <div className="overflow-hidden rounded-xl border border-border">
          <OnboardingFooter onNext={() => {}} nextDisabled />
        </div>
        <div className="overflow-hidden rounded-xl border border-border">
          <OnboardingFooter onNext={() => {}} isLoading />
        </div>
      </section>

      <section className="space-y-8 border-b border-border p-8">
        <h2 className="text-xl font-bold text-foreground">
          OnboardingSectionTitle
        </h2>
        <div className="flex justify-center">
          <OnboardingSectionTitle
            title="Título de pantalla"
            subtitle="Subcopy que ecoa un dato previo del usuario."
          />
        </div>
      </section>

      <section className="space-y-8 border-b border-border p-8">
        <h2 className="text-xl font-bold text-foreground">OnboardingField</h2>
        <div className="flex flex-col items-center gap-4">
          <OnboardingField label="Nombre de marca">
            <Input placeholder="Escribe tu nombre de marca" />
          </OnboardingField>
          <OnboardingField
            label="Sitio web"
            hint="Ingresa la URL de tu sitio web"
          >
            <Input placeholder="https://ejemplo.com" />
          </OnboardingField>
          <OnboardingField label="Email" error="El email es requerido">
            <Input placeholder="email@ejemplo.com" />
          </OnboardingField>
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
          <OnboardingShell
            stepLabel="Paso 3 de 17"
            percent={18}
            onBack={() => {}}
            onNext={() => {}}
            onExit={() => {}}
          >
            <OnboardingSectionTitle
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
          </OnboardingShell>
        </div>
      </section>

      <section className="space-y-8 p-8">
        <h2 className="text-xl font-bold text-foreground">
          OnboardingShell (loading, no back)
        </h2>
        <div className="h-[400px] overflow-hidden rounded-xl border border-border">
          <OnboardingShell
            stepLabel="Paso 17 de 17"
            percent={100}
            onNext={() => {}}
            nextLabel="Finalizar"
            isLoading
            onExit={() => {}}
          >
            <OnboardingSectionTitle title="Procesando tu perfil..." />
          </OnboardingShell>
        </div>
      </section>
    </div>
  )
}
