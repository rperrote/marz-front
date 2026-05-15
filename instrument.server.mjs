import * as Sentry from '@sentry/tanstackstart-react'

const dsn = process.env.SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT,
    release: process.env.SENTRY_RELEASE,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '1.0'),
    sendDefaultPii: true,
  })
}
