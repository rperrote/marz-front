import { defineConfig } from 'orval'

export default defineConfig({
  marz: {
    input: {
      target: './openapi/spec.json',
    },
    output: {
      mode: 'tags-split',
      target: './src/shared/api/generated/endpoints.ts',
      schemas: './src/shared/api/generated/model',
      client: 'react-query',
      httpClient: 'fetch',
      clean: true,
      override: {
        mutator: {
          path: './src/shared/api/mutator.ts',
          name: 'customFetch',
        },
        query: {
          useQuery: true,
          useMutation: true,
          signal: true,
        },
      },
    },
  },
  marzZod: {
    input: {
      target: './openapi/spec.json',
    },
    output: {
      mode: 'tags-split',
      target: './src/shared/api/generated/zod',
      client: 'zod',
      clean: true,
    },
  },
})
