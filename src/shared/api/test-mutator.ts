// Mutator for the test-only API client. Only safe to import from src/test/**.
// Reads API_URL and MARZ_TEST_SECRET from process.env (Node, Playwright runtime).

const API_URL = (
  process.env.VITE_API_URL ??
  process.env.API_URL ??
  'http://localhost:8080'
).replace(/\/$/, '')

const TEST_SECRET = process.env.MARZ_TEST_SECRET

export interface TestApiErrorBody {
  error: {
    code: string
    message: string
  }
}

class TestApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public override message: string,
  ) {
    super(`Test API ${status} ${code}: ${message}`)
    this.name = 'TestApiError'
  }
}

export async function testFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  if (!TEST_SECRET) {
    throw new Error(
      'MARZ_TEST_SECRET is not set. Required for the test API client.',
    )
  }

  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Test-Secret': TEST_SECRET,
      ...options?.headers,
    },
  })

  const text = await res.text()
  const parsed = text
    ? res.headers.get('content-type')?.includes('application/json')
      ? (JSON.parse(text) as unknown)
      : text
    : undefined

  if (!res.ok) {
    const body = parsed as TestApiErrorBody | undefined
    throw new TestApiError(
      res.status,
      body?.error.code ?? 'unknown',
      body?.error.message ?? res.statusText,
    )
  }

  return {
    data: parsed,
    status: res.status,
    headers: res.headers,
  } as T
}
