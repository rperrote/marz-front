import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

const healthCheck = createServerFn({ method: 'GET' }).handler(() => ({
  status: 'ok' as const,
  uptime_sec: Math.floor(process.uptime()),
}))

export const Route = createFileRoute('/health')({
  loader: () => healthCheck(),
  component: HealthPage,
})

function HealthPage() {
  const data = Route.useLoaderData()
  return (
    <pre className="p-4 font-mono text-sm">
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}
