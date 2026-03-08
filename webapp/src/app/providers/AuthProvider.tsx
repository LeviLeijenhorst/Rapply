import React, { createContext, useContext, useMemo, useState } from 'react'

import { getInitialAuthenticationState } from '../bootstrap/authBootstrap'

type AuthContextValue = {
  isAuthenticated: boolean
  setIsAuthenticated: (value: boolean) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => getInitialAuthenticationState())
  const value = useMemo(() => ({ isAuthenticated, setIsAuthenticated }), [isAuthenticated])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthState() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuthState must be used within AuthProvider')
  return value
}
