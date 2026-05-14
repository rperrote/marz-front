import { useEffect } from 'react'
import { useNavigate, useLocation } from '@tanstack/react-router'

import { useIsMobile } from '#/features/identity/onboarding/hooks/useIsMobile'

/* eslint-disable-next-line lingui/no-unlocalized-strings -- Session storage key is not translatable UI copy. */
const SESSION_KEY = 'marz:desktop-only:returnTo'

function shouldBlock(pathname: string): boolean {
  return pathname.startsWith('/auth') || pathname.startsWith('/onboarding')
}

export function MobileRedirectGuard() {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const pathname = location.pathname
    if (isMobile && shouldBlock(pathname) && pathname !== '/desktop-only') {
      sessionStorage.setItem(SESSION_KEY, pathname)
      void navigate({ to: '/desktop-only' })
    }
  }, [isMobile, location, navigate])

  return null
}
