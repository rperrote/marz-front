import { createFileRoute, redirect } from '@tanstack/react-router'
import { getSession } from '../shared/auth/session'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const session = getSession()
    if (!session) {
      throw redirect({ to: '/login' })
    }
    if (session.kind === 'brand') {
      throw redirect({ to: '/campaigns' })
    }
    throw redirect({ to: '/offers' })
  },
})
