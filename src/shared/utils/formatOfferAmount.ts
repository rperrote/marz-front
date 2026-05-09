export function formatOfferAmount(amount: string, currency: string): string {
  const num = parseFloat(amount)
  if (Number.isNaN(num)) return `${currency} ${amount}`
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(num)
}
