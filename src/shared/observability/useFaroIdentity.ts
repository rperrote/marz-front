import { useAuth, useUser } from '@clerk/tanstack-react-start'
import { useEffect } from 'react'

import { clearFaroUser, getFaro, setFaroUser } from './faro'

/**
 * Sincroniza la identidad del usuario logueado con Faro para que los errores
 * y eventos se correlacionen con la cuenta. Mountar una sola vez en el shell.
 */
export function useFaroIdentity() {
  const { isSignedIn, userId } = useAuth()
  const { user } = useUser()

  useEffect(() => {
    if (!getFaro()) return
    if (!isSignedIn || !userId) {
      clearFaroUser()
      return
    }
    setFaroUser({
      id: userId,
      username: user?.primaryEmailAddress?.emailAddress,
    })
  }, [isSignedIn, userId, user?.primaryEmailAddress?.emailAddress])
}
