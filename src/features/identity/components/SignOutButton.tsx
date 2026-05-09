import { useAuth } from '@clerk/tanstack-react-start'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { useCallback } from 'react'

import { cn } from '#/lib/utils'
import { track } from '#/shared/analytics/track'
import { useBrandOnboardingStore } from '#/features/identity/onboarding/brand/store'
import { useCreatorOnboardingStore } from '#/features/identity/onboarding/creator/store'

export function SignOutButton({ collapsed = false }: { collapsed?: boolean }) {
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
      aria-label={collapsed ? 'Sign out' : undefined}
      className={cn(
        'rounded-md text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
        collapsed
          ? 'flex size-11 items-center justify-center'
          : 'w-full px-3 py-2 text-left',
      )}
    >
      {collapsed ? (
        <LogOut className="size-5" aria-hidden="true" />
      ) : (
        'Sign out'
      )}
    </button>
  )
}
