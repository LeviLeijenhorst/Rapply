import { Catamaran_400Regular, Catamaran_700Bold, useFonts } from '@expo-google-fonts/catamaran'
import { StatusBar } from 'expo-status-bar'
import React from 'react'

import { AppShell } from './src/components/AppShell'

export default function App() {
  const [areFontsLoaded] = useFonts({
    Catamaran_400Regular,
    Catamaran_700Bold,
  })

  if (!areFontsLoaded) {
    return null
  }

  return (
    <>
      {/* App status bar */}
      <StatusBar style="auto" />
      {/* App shell */}
      <AppShell />
    </>
  )
}
