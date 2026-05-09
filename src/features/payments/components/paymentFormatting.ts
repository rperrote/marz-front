const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

const compactUsdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function parsePaymentAmount(amount: string): number {
  const parsed = Number(amount)
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatUsd(amount: string | number): string {
  const value = typeof amount === 'number' ? amount : parsePaymentAmount(amount)
  return usdFormatter.format(value)
}

export function formatCompactUsd(amount: string | number): string {
  const value = typeof amount === 'number' ? amount : parsePaymentAmount(amount)
  return compactUsdFormatter.format(value)
}

export function formatPaymentDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function formatMonthLabel(value: string): string {
  const [year, month] = value.split('-')
  if (!year || !month) return value
  const date = new Date(Number(year), Number(month) - 1, 1)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date)
}
