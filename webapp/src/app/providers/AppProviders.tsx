import React from 'react'

import { ThemeProvider } from '../../design/theme/ThemeProvider'
import { ToastProvider } from '../../toast/ToastProvider'
import { AuthProvider } from './AuthProvider'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
