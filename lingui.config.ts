import { defineConfig } from '@lingui/cli'

export default defineConfig({
  sourceLocale: 'es',
  locales: ['es', 'en'],
  pseudoLocale: 'pseudo',
  fallbackLocales: { default: 'es' },
  catalogs: [
    {
      path: '<rootDir>/src/shared/i18n/locales/{locale}/messages',
      include: ['src'],
      exclude: [
        '**/node_modules/**',
        '**/*.gen.ts',
        'src/shared/api/generated/**',
      ],
    },
  ],
  format: 'po',
  compileNamespace: 'es',
})
