const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
})

export function formatOfferAmount(amount: string, currency: string): string {
  const num = parseFloat(amount)
  if (Number.isNaN(num)) return `${currency} ${amount}`
  if (currency !== 'USD')
    return `${currency} ${num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  return usdFormatter.format(num)
}
