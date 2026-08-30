export function formatCurrency(amount?: number, currency = 'USD'): string {
  if (amount === undefined || amount === null || Number.isNaN(amount)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}
