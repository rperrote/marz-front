import { useEffect } from 'react'
import { useAuth } from '@clerk/tanstack-react-start'
import { useNavigate } from '@tanstack/react-router'

import { useMe } from '#/shared/api/generated/accounts/accounts'

export function useAuthGuard() {
  const { isSignedIn, isLoaded } = useAuth()
  const navigate = useNavigate()

  const meQuery = useMe({
    query: { enabled: isLoaded && !!isSignedIn },
  })

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return

    const me = meQuery.data
    if (!me || me.status !== 200) return
    const data = me.data

    if (data.onboarding_status === 'onboarded') {
      const home = data.kind === 'brand' ? '/campaigns' : '/offers'
      void navigate({ to: home })
    } else if (data.redirect_to) {
      void navigate({ to: data.redirect_to })
    }
  }, [isLoaded, isSignedIn, meQuery.data, navigate])

  const showLoading = !isLoaded || (isSignedIn && meQuery.isLoading)

  return { showLoading }
}
