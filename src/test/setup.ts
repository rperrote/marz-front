import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, expect, vi } from 'vitest'
import * as matchers from 'vitest-axe/matchers'
import type { ReactNode } from 'react'

expect.extend(matchers)

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce(
        (acc, str, index) => acc + str + (values[index] ?? ''),
        '',
      ),
    { __lingui: true },
  ),
  plural: Object.assign(
    (_value: number, options: { one?: string; other: string }) => options.other,
    { __lingui: true },
  ),
}))

vi.mock('@lingui/react/macro', () => ({
  Trans: ({ children }: { children?: ReactNode }) => children,
}))

afterEach(() => cleanup())

// jsdom polyfills required by Radix primitives.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

if (typeof Element !== 'undefined') {
  const proto = Element.prototype as unknown as Record<string, unknown>
  proto.hasPointerCapture ??= () => false
  proto.releasePointerCapture ??= () => {}
  proto.setPointerCapture ??= () => {}
  proto.scrollIntoView ??= () => {}
}

// axe touches canvas APIs through color/contrast checks; jsdom exposes a
// throwing stub unless the optional canvas package is installed.
if (typeof HTMLCanvasElement !== 'undefined') {
  const canvasProto = HTMLCanvasElement.prototype as unknown as {
    getContext?: (...args: unknown[]) => null
  }
  canvasProto.getContext = () => null
}
