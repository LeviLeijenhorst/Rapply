import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { Text } from './Text'
import { colors } from '../theme/colors'
import { trackWebappError } from '../services/analytics'

type Props = {
  children: React.ReactNode
  onReset: () => void
}

type State = {
  errorMessage: string | null
  errorStack: string | null
  componentStack: string | null
}

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = {
    errorMessage: null,
    errorStack: null,
    componentStack: null,
  }

  static getDerivedStateFromError(error: unknown): Partial<State> {
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack ?? null : null
    return { errorMessage: message, errorStack: stack }
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack ?? null : null
    const componentStack = errorInfo.componentStack ?? null
    this.setState({ errorMessage: message, errorStack: stack, componentStack })
    trackWebappError(error, { kind: 'react_error_boundary', componentStack }, { authenticated: true })
    console.error('AppErrorBoundary caught error', { message, stack, componentStack, error })
  }

  render() {
    if (!this.state.errorMessage) {
      return this.props.children
    }

    return (
      <View style={styles.page}>
        {/* Error container */}
        <View style={styles.container}>
          <Text isBold style={styles.title}>
            Er ging iets mis
          </Text>

          <Text style={styles.label}>Foutmelding</Text>
          <Text style={styles.codeText}>{this.state.errorMessage}</Text>

          {this.state.errorStack ? (
            <>
              <Text style={styles.label}>Stack</Text>
              <Text style={styles.codeText}>{this.state.errorStack}</Text>
            </>
          ) : null}

          {this.state.componentStack ? (
            <>
              <Text style={styles.label}>Component stack</Text>
              <Text style={styles.codeText}>{this.state.componentStack}</Text>
            </>
          ) : null}

          <Pressable onPress={this.props.onReset} style={({ hovered }) => [styles.button, hovered ? styles.buttonHovered : undefined]}>
            {/* Reset */}
            <Text isBold style={styles.buttonText}>
              Terug naar inloggen
            </Text>
          </Pressable>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.pageBackground,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...( { height: '100vh' } as any ),
  },
  container: {
    width: 920,
    maxWidth: '95vw',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    gap: 12,
    ...( { overflow: 'auto' } as any ),
    ...( { maxHeight: '90vh' } as any ),
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
    ...( { fontFamily: 'monospace' } as any ),
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

