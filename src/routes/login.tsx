import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 text-card-foreground">
        <h1 className="text-xl font-semibold mb-2">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Placeholder login. Identity context pending.
        </p>
      </div>
    </main>
  )
}
