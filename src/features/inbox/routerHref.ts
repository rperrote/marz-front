import type { useRouter } from '@tanstack/react-router'

export function isKnownRouterHref(
  router: ReturnType<typeof useRouter>,
  href: string,
) {
  const pathname = getPathnameFromHref(href)
  if (!pathname) return false

  const { foundRoute } = router.getMatchedRoutes(pathname)
  if (!foundRoute) return false

  return foundRoute.fullPath !== '/' || pathname === '/'
}

function getPathnameFromHref(href: string) {
  if (!href.startsWith('/')) return null

  try {
    return new URL(href, 'https://marz.local').pathname
  } catch {
    return null
  }
}
