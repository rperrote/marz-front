import { clerkMiddleware } from '@clerk/tanstack-react-start/server'
import { createStart } from '@tanstack/react-start'
import {
  sentryGlobalFunctionMiddleware,
  sentryGlobalRequestMiddleware,
} from '@sentry/tanstackstart-react'

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [sentryGlobalRequestMiddleware, clerkMiddleware()],
    functionMiddleware: [sentryGlobalFunctionMiddleware],
  }
})
