import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary'

import { Text } from './Text'
import { colors } from '../design/theme/colors'
import { trackWebappError } from '../api/analytics/webappAnalytics'

type Props = {
  children: React.ReactNode
  onReset: () => void
}

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack ?? null : null

  return (
    <View style={styles.page}>
      {/* Error container */}
      <View style={styles.container}>
        <Text isBold style={styles.title}>
          Er ging iets mis
        </Text>

        <Text style={styles.label}>Foutmelding</Text>
        <Text style={styles.codeText}>{errorMessage}</Text>

        {errorStack ? (
          <>
            <Text style={styles.label}>Stack</Text>
            <Text style={styles.codeText}>{errorStack}</Text>
          </>
        ) : null}

        <Pressable onPress={resetErrorBoundary} style={({ hovered }) => [styles.button, hovered ? styles.buttonHovered : undefined]}>
          {/* Reset */}
          <Text isBold style={styles.buttonText}>
            Terug naar inloggen
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

export function ErrorBoundary({ children, onReset }: Props) {
  return (
    <ReactErrorBoundary
      onReset={onReset}
      onError={(error, info) => {
        const message = error instanceof Error ? error.message : String(error)
        const stack = error instanceof Error ? error.stack ?? null : null
        const componentStack = info.componentStack ?? null
        trackWebappError(error, { kind: 'react_error_boundary', componentStack }, { authenticated: true })
        console.error('ErrorBoundary caught error', { message, stack, componentStack, error })
      }}
      FallbackComponent={ErrorFallback}
    >
      {children}
    </ReactErrorBoundary>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.pageBackground,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: 920,
    maxWidth: '95%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
    color: colors.textStrong,
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  codeText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.text,
    fontFamily: 'monospace',
  },
  button: {
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.selected,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonHovered: {
    backgroundColor: '#A50058',
  },
  buttonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
})


