import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { CreatorShell } from '../features/identity/components/CreatorShell'
import { getSession } from '../shared/auth/session'

export const Route = createFileRoute('/_creator')({
  beforeLoad: ({ location }) => {
    const session = getSession()
    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
    if (session.kind !== 'creator') {
      throw redirect({ to: '/' })
    }
  },
  component: CreatorLayout,
})

function CreatorLayout() {
  return (
    <CreatorShell>
      <Outlet />
    </CreatorShell>
  )
}
