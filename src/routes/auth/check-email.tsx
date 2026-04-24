import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'

import { MagicSentScreen } from '#/features/identity/auth/components/MagicSentScreen'

const searchSchema = z.object({
  email: z.string().email().optional(),
})

export const Route = createFileRoute('/auth/check-email')({
  validateSearch: (search) => searchSchema.parse(search),
  beforeLoad: ({ search, location }) => {
    const email =
      search.email ?? (location.state as { email?: string } | undefined)?.email
    if (!email) {
      throw redirect({ to: '/auth' })
    }
    return { email }
  },
  component: CheckEmailPage,
})

function CheckEmailPage() {
  const { email } = Route.useRouteContext()

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
        <MagicSentScreen email={email} />
      </div>
    </main>
  )
}
