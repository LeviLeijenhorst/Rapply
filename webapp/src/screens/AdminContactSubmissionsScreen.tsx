import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'

import { Text } from '../components/Text'
import { callSecureApi } from '../services/secureApi'
import { colors } from '../theme/colors'
import { toUserFriendlyErrorMessage } from '../utils/userFriendlyError'

type ContactSubmissionItem = {
  id: string
  userId: string
  name: string
  email: string
  phone: string | null
  message: string
  accountEmail: string | null
  createdAt: string
}

type ContactSubmissionListResponse = {
  items: ContactSubmissionItem[]
}

function formatDateTime(value: string): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime())) return value
  return parsed.toLocaleString('nl-NL')
}

function parseApiError(error: unknown): string {
  return toUserFriendlyErrorMessage(error, {
    fallback: 'Contactberichten ophalen mislukt.',
    forbiddenMessage: 'Geen toegang. Alleen contact@jnlsolutions.nl mag deze pagina openen.',
  })
}

export function AdminContactSubmissionsScreen() {
  const [items, setItems] = useState<ContactSubmissionItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadContactSubmissions = useCallback(async () => {
    try {
      setIsLoading(true)
      setErrorMessage(null)
      const response = await callSecureApi<ContactSubmissionListResponse>('/admin/contact-submissions/list', { limit: 200 })
      setItems(Array.isArray(response.items) ? response.items : [])
    } catch (error) {
      setItems([])
      setErrorMessage(parseApiError(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadContactSubmissions()
  }, [loadContactSubmissions])

  const headerText = useMemo(() => `Contactberichten (${items.length})`, [items.length])

  return (
    <View style={styles.page}>
      <View style={styles.headerRow}>
        <View>
          <Text isBold style={styles.title}>Contactberichten</Text>
          <Text style={styles.subtitle}>{headerText}</Text>
        </View>
        <Pressable onPress={() => void loadContactSubmissions()} style={({ hovered }) => [styles.refreshButton, hovered ? styles.refreshButtonHovered : undefined]} disabled={isLoading}>
          <Text isBold style={styles.refreshButtonText}>{isLoading ? 'Verversen...' : 'Verversen'}</Text>
        </Pressable>
      </View>

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Contactberichten laden...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator>
          {items.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Nog geen contactberichten gevonden.</Text>
            </View>
          ) : (
            items.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.metaRow}>
                  <Text isSemibold style={styles.metaTitle}>{formatDateTime(item.createdAt)}</Text>
                  <Text style={styles.metaMuted}>{item.accountEmail || item.userId}</Text>
                </View>
                <Text style={styles.metaLine}>Naam: {item.name}</Text>
                <Text style={styles.metaLine}>E-mail: {item.email}</Text>
                <Text style={styles.metaLine}>Telefoon: {item.phone || '-'}</Text>
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
  errorBox: {
    borderWidth: 1,
    borderColor: '#B20000',
    backgroundColor: '#FFF2F2',
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    color: '#9F0000',
    fontSize: 14,
    lineHeight: 20,
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
