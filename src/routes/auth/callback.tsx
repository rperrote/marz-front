import { createFileRoute } from '@tanstack/react-router'

import { CallbackScreen } from '#/features/identity/auth/components/CallbackScreen'

export const Route = createFileRoute('/auth/callback')({
  component: CallbackPage,
})

function CallbackPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 flex items-start justify-center">
        <div
          className="h-[500px] w-[600px] -translate-y-3/4 rounded-full opacity-60"
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--primary) 20%, transparent), transparent)',
          }}
        />
      </div>

      <div className="relative flex min-h-screen items-center justify-center p-6">
        <CallbackScreen />
      </div>
    </main>
  )
}
