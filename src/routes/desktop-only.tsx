import { createFileRoute } from '@tanstack/react-router'

import { DesktopOnlyScreen } from '#/features/identity/onboarding/components/DesktopOnlyScreen'

export const Route = createFileRoute('/desktop-only')({
  component: DesktopOnlyScreen,
})
