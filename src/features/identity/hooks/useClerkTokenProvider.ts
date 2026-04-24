import { useAuth } from '@clerk/tanstack-react-start'
import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { setAuthTokenProvider } from '#/shared/api/mutator'

export function useClerkTokenProvider() {
  const { getToken, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    setAuthTokenProvider({
      getToken: () => getToken(),
      refreshToken: () => getToken({ skipCache: true }),
      signOut: () => signOut({ redirectUrl: '/auth' }),
      navigate: (to: string) => navigate({ to }),
    })
  }, [getToken, signOut, navigate])
}
