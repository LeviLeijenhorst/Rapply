import { useEffect, useState } from 'react'

import { fetchBillingStatus } from '../../api/billing/billingApi'

type BillingUsage = {
  usedMinutes: number
  totalMinutes: number
  isLoading: boolean
}

type BillingUsageMinutes = {
  usedMinutes: number
  totalMinutes: number
}

type BillingStatus = {
  includedSeconds: number
  cycleUsedSeconds: number
  nonExpiringTotalSeconds: number
  nonExpiringUsedSeconds: number
}

function buildBillingUsageMinutes(status: BillingStatus | null): BillingUsageMinutes {
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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    const loadStatus = async () => {
      try {
        setIsLoading(true)
        const response = await fetchBillingStatus()
        if (!isActive) return
        const usage = buildBillingUsageMinutes(response?.billingStatus ?? null)
        setUsedMinutes(usage.usedMinutes)
        setTotalMinutes(usage.totalMinutes)
      } catch (error) {
        if (!isActive) return
        console.error('[billing] failed to load status', error)
      } finally {
        if (!isActive) return
        setIsLoading(false)
      }
    }

    void loadStatus()

    const onVisibilityOrFocus = () => {
      void loadStatus()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onVisibilityOrFocus)
      window.addEventListener('pageshow', onVisibilityOrFocus)
      document.addEventListener('visibilitychange', onVisibilityOrFocus)
    }

    return () => {
      isActive = false
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', onVisibilityOrFocus)
        window.removeEventListener('pageshow', onVisibilityOrFocus)
        document.removeEventListener('visibilitychange', onVisibilityOrFocus)
      }
    }
  }, [])

  return { usedMinutes, totalMinutes, isLoading }
}

