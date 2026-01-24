export function formatEuroAmount(value: number): string {
  const safe = Number.isFinite(value) ? value : 0
  const rounded = Math.max(0, safe)
  const fixed = rounded.toFixed(2)
  const parts = fixed.split(".")
  const euros = parts[0] || "0"
  const cents = parts[1] || "00"
  return `€${euros},${cents}`
}

export function formatEuroFromPriceString(value: string): string | null {
  const input = String(value || "").trim()
  if (!input) return null
  const match = input.match(/(\d+(?:[.,]\d+)?)/)
  if (!match) return null
  const normalized = match[1].replace(",", ".")
  const amount = Number.parseFloat(normalized)
  if (!Number.isFinite(amount)) return null
  return formatEuroAmount(amount)
}

