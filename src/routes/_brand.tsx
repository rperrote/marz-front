import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { BrandShell } from '../features/identity/components/BrandShell'
import { getSession } from '../shared/auth/session'

export const Route = createFileRoute('/_brand')({
  beforeLoad: ({ location }) => {
    const session = getSession()
    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
    if (session.kind !== 'brand') {
      throw redirect({ to: '/' })
    }
  },
  component: BrandLayout,
})

function BrandLayout() {
  return (
    <BrandShell>
      <Outlet />
    </BrandShell>
  )
}
