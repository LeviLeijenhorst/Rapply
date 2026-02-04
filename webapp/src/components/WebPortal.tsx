import React, { ReactNode, useMemo } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  children: ReactNode
}

export function WebPortal({ children }: Props) {
  const canUseDom = typeof document !== 'undefined'

  const portalRoot = useMemo(() => {
    if (!canUseDom) return null
    return document.body
  }, [canUseDom])

  if (!portalRoot) return null
  return createPortal(children, portalRoot)
}

