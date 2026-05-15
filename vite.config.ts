import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { sentryTanstackStart } from '@sentry/tanstackstart-react/vite'

import viteReact from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { lingui } from '@lingui/vite-plugin'

const sentryOrg = process.env.SENTRY_ORG ?? 'marz-lc'
const sentryProject =
  process.env.SENTRY_PROJECT ?? 'javascript-tanstackstart-react'
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart({
      router: {
        routeFileIgnorePattern: '\\.(test|spec)\\.(ts|tsx)$',
      },
    }),
    viteReact({
      plugins: [['@lingui/swc-plugin', {}]],
    }),
    lingui(),
    // Sentry plugin uploads sourcemaps during build and deletes them from the
    // bundle afterwards. Only active when SENTRY_AUTH_TOKEN is provided.
    ...(sentryAuthToken
      ? [
          sentryTanstackStart({
            org: sentryOrg,
            project: sentryProject,
            authToken: sentryAuthToken,
          }),
        ]
      : []),
  ],
})

export default config
