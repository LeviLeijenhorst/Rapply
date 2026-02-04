import { useEffect, useState } from 'react'

export function useReducedMotion() {
  const [isReducedMotionEnabled, setIsReducedMotionEnabled] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setIsReducedMotionEnabled(mediaQueryList.matches)
    update()

    if (typeof mediaQueryList.addEventListener === 'function') {
      mediaQueryList.addEventListener('change', update)
      return () => mediaQueryList.removeEventListener('change', update)
    }

    mediaQueryList.addListener(update)
    return () => mediaQueryList.removeListener(update)
  }, [])

  return isReducedMotionEnabled
}

