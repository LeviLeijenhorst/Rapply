import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'

import { callSecureApi } from '../services/secureApi'
import { colors } from '../theme/colors'
import { Text } from '../components/Text'
import { toUserFriendlyErrorMessage } from '../utils/userFriendlyError'

type FeedbackItem = {
  id: string
  userId: string
  name: string | null
  email: string | null
  accountEmail: string | null
  message: string
  createdAt: string
}

type FeedbackListResponse = {
  items: FeedbackItem[]
}

type AllowlistItem = {
  id: string
  email: string
  createdAt: string
}

type AllowlistResponse = {
  items: AllowlistItem[]
}

function formatDateTime(value: string): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime())) return value
  return parsed.toLocaleString('nl-NL')
}

function parseApiError(error: unknown): string {
  return toUserFriendlyErrorMessage(error, {
    fallback: 'Feedback ophalen mislukt.',
    forbiddenMessage: 'Geen toegang. Alleen ltleijenhorst@gmail.com mag deze pagina openen.',
  })
}

export function AdminFeedbackScreen() {
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [allowlistItems, setAllowlistItems] = useState<AllowlistItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAllowlistLoading, setIsAllowlistLoading] = useState(false)
  const [isAllowlistBusy, setIsAllowlistBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [allowlistErrorMessage, setAllowlistErrorMessage] = useState<string | null>(null)
  const [allowlistStatusMessage, setAllowlistStatusMessage] = useState<string | null>(null)
  const [allowlistEmailInput, setAllowlistEmailInput] = useState('')

  const loadFeedback = useCallback(async () => {
    try {
      setIsLoading(true)
      setErrorMessage(null)
      const response = await callSecureApi<FeedbackListResponse>('/admin/feedback/list', { limit: 200 })
      setItems(Array.isArray(response.items) ? response.items : [])
    } catch (error) {
      setItems([])
      setErrorMessage(parseApiError(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadAllowlist = useCallback(async () => {
    try {
      setIsAllowlistLoading(true)
      setAllowlistErrorMessage(null)
      const response = await callSecureApi<AllowlistResponse>('/admin/account-allowlist/list', {})
      setAllowlistItems(Array.isArray(response.items) ? response.items : [])
    } catch (error) {
      setAllowlistItems([])
      setAllowlistErrorMessage(toUserFriendlyErrorMessage(error, {
        fallback: 'Allowlist ophalen mislukt.',
        forbiddenMessage: 'Geen toegang. Alleen ltleijenhorst@gmail.com mag deze pagina openen.',
      }))
    } finally {
      setIsAllowlistLoading(false)
    }
  }, [])

  const addAllowlistEmail = useCallback(async () => {
    const trimmedEmail = allowlistEmailInput.trim().toLowerCase()
    if (!trimmedEmail) {
      setAllowlistStatusMessage('Vul eerst een e-mailadres in.')
      return
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(trimmedEmail)) {
      setAllowlistStatusMessage('Gebruik een geldig e-mailadres.')
      return
    }

    try {
      setIsAllowlistBusy(true)
      setAllowlistStatusMessage(null)
      await callSecureApi<{ ok: true }>('/admin/account-allowlist/add', { email: trimmedEmail })
      setAllowlistEmailInput('')
      setAllowlistStatusMessage('E-mailadres toegevoegd aan de allowlist.')
      await loadAllowlist()
    } catch (error) {
      setAllowlistStatusMessage(toUserFriendlyErrorMessage(error, {
        fallback: 'Toevoegen mislukt.',
        forbiddenMessage: 'Geen toegang. Alleen ltleijenhorst@gmail.com mag deze pagina openen.',
      }))
    } finally {
      setIsAllowlistBusy(false)
    }
  }, [allowlistEmailInput, loadAllowlist])

  const removeAllowlistEmail = useCallback(async (email: string) => {
    try {
      setIsAllowlistBusy(true)
      setAllowlistStatusMessage(null)
      await callSecureApi<{ ok: true }>('/admin/account-allowlist/remove', { email })
      setAllowlistStatusMessage('E-mailadres verwijderd uit de allowlist.')
      await loadAllowlist()
    } catch (error) {
      setAllowlistStatusMessage(toUserFriendlyErrorMessage(error, {
        fallback: 'Verwijderen mislukt.',
        forbiddenMessage: 'Geen toegang. Alleen ltleijenhorst@gmail.com mag deze pagina openen.',
      }))
    } finally {
      setIsAllowlistBusy(false)
    }
  }, [loadAllowlist])

  useEffect(() => {
    void loadFeedback()
    void loadAllowlist()
  }, [loadAllowlist, loadFeedback])

  const headerText = useMemo(() => `Feedback (${items.length})`, [items.length])
  const allowlistHeaderText = useMemo(() => `Allowlist (${allowlistItems.length})`, [allowlistItems.length])

  return (
    <View style={styles.page}>
      <View style={styles.headerRow}>
        <View>
          <Text isBold style={styles.title}>Admin</Text>
          <Text style={styles.subtitle}>{headerText}</Text>
        </View>
        <Pressable onPress={() => void loadFeedback()} style={({ hovered }) => [styles.refreshButton, hovered ? styles.refreshButtonHovered : undefined]} disabled={isLoading}>
          <Text isBold style={styles.refreshButtonText}>{isLoading ? 'Verversen...' : 'Verversen'}</Text>
        </Pressable>
      </View>

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      <View style={styles.allowlistCard}>
        <View style={styles.allowlistHeaderRow}>
          <View>
            <Text isSemibold style={styles.allowlistTitle}>Account allowlist</Text>
            <Text style={styles.allowlistSubtitle}>{allowlistHeaderText}</Text>
          </View>
          <Pressable
            onPress={() => void loadAllowlist()}
            style={({ hovered }) => [styles.allowlistRefreshButton, hovered ? styles.allowlistRefreshButtonHovered : undefined]}
            disabled={isAllowlistLoading || isAllowlistBusy}
          >
            <Text isBold style={styles.allowlistRefreshButtonText}>Verversen</Text>
          </Pressable>
        </View>

        <View style={styles.allowlistAddRow}>
          <TextInput
            value={allowlistEmailInput}
            onChangeText={setAllowlistEmailInput}
            placeholder="naam@voorbeeld.nl"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.allowlistInput}
          />
          <Pressable
            onPress={() => void addAllowlistEmail()}
            style={({ hovered }) => [styles.allowlistAddButton, hovered ? styles.allowlistAddButtonHovered : undefined, isAllowlistBusy ? styles.allowlistButtonDisabled : undefined]}
            disabled={isAllowlistBusy}
          >
            <Text isBold style={styles.allowlistAddButtonText}>Toevoegen</Text>
          </Pressable>
        </View>

        {allowlistErrorMessage ? <Text style={styles.allowlistErrorText}>{allowlistErrorMessage}</Text> : null}
        {allowlistStatusMessage ? <Text style={styles.allowlistStatusText}>{allowlistStatusMessage}</Text> : null}

        {isAllowlistLoading ? (
          <Text style={styles.allowlistLoadingText}>Allowlist laden...</Text>
        ) : allowlistItems.length === 0 ? (
          <Text style={styles.allowlistEmptyText}>Nog geen e-mailadressen in de allowlist.</Text>
        ) : (
          <View style={styles.allowlistList}>
            {allowlistItems.map((item) => (
              <View key={item.id} style={styles.allowlistItemRow}>
                <View style={styles.allowlistItemTextWrap}>
                  <Text style={styles.allowlistItemEmail}>{item.email}</Text>
                  <Text style={styles.allowlistItemMeta}>Toegevoegd op {formatDateTime(item.createdAt)}</Text>
                </View>
                <Pressable
                  onPress={() => void removeAllowlistEmail(item.email)}
                  style={({ hovered }) => [styles.allowlistRemoveButton, hovered ? styles.allowlistRemoveButtonHovered : undefined, isAllowlistBusy ? styles.allowlistButtonDisabled : undefined]}
                  disabled={isAllowlistBusy}
                >
                  <Text isBold style={styles.allowlistRemoveButtonText}>Verwijderen</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Feedback laden...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator>
          {items.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Nog geen feedback gevonden.</Text>
            </View>
          ) : (
            items.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.metaRow}>
                  <Text isSemibold style={styles.metaTitle}>{formatDateTime(item.createdAt)}</Text>
                  <Text style={styles.metaMuted}>{item.accountEmail || item.userId}</Text>
                </View>
                <Text style={styles.metaLine}>Naam: {item.name || '-'}</Text>
                <Text style={styles.metaLine}>Feedback e-mail: {item.email || '-'}</Text>
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
  allowlistCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  allowlistHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  allowlistTitle: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.textStrong,
  },
  allowlistSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  allowlistRefreshButton: {
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.pageBackground,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allowlistRefreshButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  allowlistRefreshButtonText: {
    fontSize: 13,
    lineHeight: 16,
    color: colors.textStrong,
  },
  allowlistAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  allowlistInput: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
    padding: 12,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  allowlistAddButton: {
    minWidth: 110,
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.selected,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allowlistAddButtonHovered: {
    opacity: 0.9,
  },
  allowlistButtonDisabled: {
    opacity: 0.6,
  },
  allowlistAddButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 16,
  },
  allowlistErrorText: {
    color: '#9F0000',
    fontSize: 13,
    lineHeight: 18,
  },
  allowlistStatusText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  allowlistLoadingText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  allowlistEmptyText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  allowlistList: {
    gap: 8,
  },
  allowlistItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
  },
  allowlistItemTextWrap: {
    flex: 1,
    gap: 2,
  },
  allowlistItemEmail: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  allowlistItemMeta: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  allowlistRemoveButton: {
    minWidth: 110,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F2BBD9',
    backgroundColor: '#FCE3F2',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allowlistRemoveButtonHovered: {
    backgroundColor: '#F8D2EA',
  },
  allowlistRemoveButtonText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.selected,
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
