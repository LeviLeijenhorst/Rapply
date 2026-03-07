import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'

import { Text } from '../ui/Text'
import { listAdminWachtlijst } from '../api/admin'
import { colors } from '../design/theme/colors'
import { toUserFriendlyErrorMessage } from '../utils/userFriendlyError'
import { useToast } from '../toast/ToastProvider'

type WachtlijstItem = {
  id: string
  userId: string
  email: string
  accountEmail: string | null
  message: string
  createdAt: string
}

type WachtlijstListResponse = {
  items: WachtlijstItem[]
}

function formatDateTime(value: string): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime())) return value
  return parsed.toLocaleString('nl-NL')
}

function parseApiError(error: unknown): string {
  return toUserFriendlyErrorMessage(error, {
    fallback: 'Wachtlijst ophalen mislukt.',
    forbiddenMessage: 'Geen toegang. Alleen contact@jnlsolutions.nl mag deze pagina openen.',
  })
}

export function AdminWachtlijstScreen() {
  const [items, setItems] = useState<WachtlijstItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { showErrorToast } = useToast()

  const loadWachtlijst = useCallback(async () => {
    try {
      setIsLoading(true)
      setErrorMessage(null)
      const response = await listAdminWachtlijst(200) as WachtlijstListResponse
      setItems(Array.isArray(response.items) ? response.items : [])
    } catch (error) {
      setItems([])
      setErrorMessage(parseApiError(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadWachtlijst()
  }, [loadWachtlijst])

  useEffect(() => {
    if (!errorMessage) return
    showErrorToast(errorMessage, 'Wachtlijst ophalen mislukt.')
  }, [errorMessage, showErrorToast])

  const headerText = useMemo(() => `Wachtlijst (${items.length})`, [items.length])

  return (
    <View style={styles.page}>
      <View style={styles.headerRow}>
        <View>
          <Text isBold style={styles.title}>Wachtlijst</Text>
          <Text style={styles.subtitle}>{headerText}</Text>
        </View>
        <Pressable onPress={() => void loadWachtlijst()} style={({ hovered }) => [styles.refreshButton, hovered ? styles.refreshButtonHovered : undefined]} disabled={isLoading}>
          <Text isBold style={styles.refreshButtonText}>{isLoading ? 'Verversen...' : 'Verversen'}</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Wachtlijst laden...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator>
          {items.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Nog geen wachtlijstverzoeken gevonden.</Text>
            </View>
          ) : (
            items.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.metaRow}>
                  <Text isSemibold style={styles.metaTitle}>{formatDateTime(item.createdAt)}</Text>
                  <Text style={styles.metaMuted}>{item.accountEmail || item.userId}</Text>
                </View>
                <Text style={styles.metaLine}>E-mail: {item.email}</Text>
                <Text style={styles.message}>{item.message}</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.pageBackground,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontSize: 24,
    lineHeight: 28,
    color: colors.textStrong,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  refreshButton: {
    minWidth: 120,
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.selected,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonHovered: {
    opacity: 0.9,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 12,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 36,
    paddingHorizontal: 16,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 20,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  metaTitle: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  metaMuted: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  metaLine: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  message: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textStrong,
  },
})

