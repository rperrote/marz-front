import { useAuth } from '@clerk/tanstack-react-start'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'

import { track } from '#/shared/analytics/track'
import { useBrandOnboardingStore } from '#/features/identity/onboarding/brand/store'
import { useCreatorOnboardingStore } from '#/features/identity/onboarding/creator/store'

export function SignOutButton() {
  const { signOut } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const handleSignOut = useCallback(async () => {
    track('sign_out')
    queryClient.clear()
    useBrandOnboardingStore.getState().reset()
    useCreatorOnboardingStore.getState().reset()
    await signOut()
    navigate({ to: '/auth' })
  }, [signOut, queryClient, navigate])

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      Sign out
    </button>
  )
}
