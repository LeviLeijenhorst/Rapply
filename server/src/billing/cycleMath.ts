// Builds a stable billing cycle key from start and end timestamps.
export function buildCycleKey(cycleStartMs: number | null, cycleEndMs: number | null): string | null {
  if (!cycleStartMs || !cycleEndMs) return null
  return `${cycleStartMs}-${cycleEndMs}`
}

// Coerces unknown numeric input to a non-negative integer number of seconds.
export function clampNonNegative(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.floor(n))
}

