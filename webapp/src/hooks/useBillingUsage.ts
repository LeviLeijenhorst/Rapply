import { useEffect, useState } from 'react'

import { fetchBillingStatus, type BillingStatus } from '../services/billing'

type BillingUsage = {
  usedMinutes: number
  totalMinutes: number
}

function buildBillingUsageMinutes(status: BillingStatus | null): BillingUsage {
  if (!status) {
    return { usedMinutes: 0, totalMinutes: 0 }
  }
  const totalSeconds = Math.max(0, status.includedSeconds + status.nonExpiringTotalSeconds)
  const usedSeconds = Math.max(0, status.cycleUsedSeconds + status.nonExpiringUsedSeconds)
  return {
    usedMinutes: Math.floor(usedSeconds / 60),
    totalMinutes: Math.floor(totalSeconds / 60),
  }
}

export function useBillingUsage(): BillingUsage {
  const [usedMinutes, setUsedMinutes] = useState(0)
  const [totalMinutes, setTotalMinutes] = useState(0)

  useEffect(() => {
    let isActive = true

    const loadStatus = async () => {
      try {
        const response = await fetchBillingStatus()
        if (!isActive) return
        const usage = buildBillingUsageMinutes(response?.billingStatus ?? null)
        setUsedMinutes(usage.usedMinutes)
        setTotalMinutes(usage.totalMinutes)
      } catch (error) {
        if (!isActive) return
        console.error('[billing] failed to load status', error)
        setUsedMinutes(0)
        setTotalMinutes(0)
      }
    }

    loadStatus()

    return () => {
      isActive = false
    }
  }, [])

  return { usedMinutes, totalMinutes }
}
