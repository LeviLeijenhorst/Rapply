import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'

import { Text } from '../components/Text'
import { callSecureApi } from '../services/secureApi'
import { colors } from '../theme/colors'
import { toUserFriendlyErrorMessage } from '../utils/userFriendlyError'

type Plan = {
  id: string
  name: string
  description: string | null
  monthlyPrice: number
  minutesPerMonth: number
  isActive: boolean
  displayOrder: number
}

type AdminUser = {
  userId: string
  email: string | null
  displayName: string | null
  planId: string | null
  customMonthlyPrice: number | null
  extraMinutes: number
  accountType: 'admin' | 'paid' | 'test'
  isAllowlisted: boolean
  canSeePricingPage: boolean
  adminNotes: string | null
  pilotFlag: boolean
  planName: string | null
  availableMinutesPerMonth: number
}

type PlanListResponse = { items: Plan[] }
type UserListResponse = { items: AdminUser[] }
type AllowlistItem = {
  id: string
  email: string
  createdAt: string
}
type AllowlistResponse = { items: AllowlistItem[] }

type UserFormState = {
  planId: string | null
  customMonthlyPrice: string
  extraMinutes: string
  accountType: 'admin' | 'paid' | 'test'
  isAllowlisted: boolean
  canSeePricingPage: boolean
  pilotFlag: boolean
  adminNotes: string
}

function formatMoney(value: number | null): string {
  if (value == null) return '-'
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value)
}

function formatDateTime(value: string): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime())) return value
  return parsed.toLocaleString('nl-NL')
}

function buildUserLabel(user: AdminUser): string {
  const name = (user.displayName || '').trim()
  if (name) return `${name} (${user.email || user.userId})`
  return user.email || user.userId
}

function parseError(error: unknown): string {
  return toUserFriendlyErrorMessage(error, {
    fallback: 'Admingegevens ophalen mislukt.',
    forbiddenMessage: 'Geen toegang. Alleen contact@jnlsolutions.nl mag deze pagina openen.',
  })
}

export function AdminRevenueScreen() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [allowlistItems, setAllowlistItems] = useState<AllowlistItem[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUserForm, setSelectedUserForm] = useState<UserFormState | null>(null)
  const [newPlanName, setNewPlanName] = useState('')
  const [newPlanDescription, setNewPlanDescription] = useState('')
  const [newPlanPrice, setNewPlanPrice] = useState('')
  const [newPlanMinutes, setNewPlanMinutes] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAllowlistLoading, setIsAllowlistLoading] = useState(false)
  const [isAllowlistBusy, setIsAllowlistBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [allowlistErrorMessage, setAllowlistErrorMessage] = useState<string | null>(null)
  const [allowlistStatusMessage, setAllowlistStatusMessage] = useState<string | null>(null)
  const [allowlistEmailInput, setAllowlistEmailInput] = useState('')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setErrorMessage(null)
      const [plansResponse, usersResponse] = await Promise.all([
        callSecureApi<PlanListResponse>('/admin/plans/list', {}),
        callSecureApi<UserListResponse>('/admin/users/list', {}),
      ])
      const nextPlans = Array.isArray(plansResponse.items) ? plansResponse.items : []
      const nextUsers = Array.isArray(usersResponse.items) ? usersResponse.items : []
      setPlans(nextPlans)
      setUsers(nextUsers)
      setSelectedUserId((current) => {
        if (current && nextUsers.some((user) => user.userId === current)) return current
        return nextUsers[0]?.userId ?? null
      })
    } catch (error) {
      setErrorMessage(parseError(error))
      setPlans([])
      setUsers([])
      setSelectedUserId(null)
      setSelectedUserForm(null)
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
      setAllowlistErrorMessage(
        toUserFriendlyErrorMessage(error, {
          fallback: 'Allowlist ophalen mislukt.',
          forbiddenMessage: 'Geen toegang. Alleen contact@jnlsolutions.nl mag deze pagina openen.',
        }),
      )
    } finally {
      setIsAllowlistLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
    void loadAllowlist()
  }, [loadAllowlist, loadData])

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
      setAllowlistStatusMessage(
        toUserFriendlyErrorMessage(error, {
          fallback: 'Toevoegen mislukt.',
          forbiddenMessage: 'Geen toegang. Alleen contact@jnlsolutions.nl mag deze pagina openen.',
        }),
      )
    } finally {
      setIsAllowlistBusy(false)
    }
  }, [allowlistEmailInput, loadAllowlist])

  const removeAllowlistEmail = useCallback(
    async (email: string) => {
      try {
        setIsAllowlistBusy(true)
        setAllowlistStatusMessage(null)
        await callSecureApi<{ ok: true }>('/admin/account-allowlist/remove', { email })
        setAllowlistStatusMessage('E-mailadres verwijderd uit de allowlist.')
        await loadAllowlist()
      } catch (error) {
        setAllowlistStatusMessage(
          toUserFriendlyErrorMessage(error, {
            fallback: 'Verwijderen mislukt.',
            forbiddenMessage: 'Geen toegang. Alleen contact@jnlsolutions.nl mag deze pagina openen.',
          }),
        )
      } finally {
        setIsAllowlistBusy(false)
      }
    },
    [loadAllowlist],
  )

  const selectedUser = useMemo(
    () => users.find((user) => user.userId === selectedUserId) || null,
    [selectedUserId, users],
  )

  useEffect(() => {
    if (!selectedUser) {
      setSelectedUserForm(null)
      return
    }
    setSelectedUserForm({
      planId: selectedUser.planId,
      customMonthlyPrice: selectedUser.customMonthlyPrice == null ? '' : String(selectedUser.customMonthlyPrice),
      extraMinutes: String(selectedUser.extraMinutes),
      accountType: selectedUser.accountType,
      isAllowlisted: selectedUser.isAllowlisted,
      canSeePricingPage: selectedUser.canSeePricingPage,
      pilotFlag: selectedUser.pilotFlag,
      adminNotes: selectedUser.adminNotes || '',
    })
  }, [selectedUser])

  const savePlan = useCallback(async (plan: Plan) => {
    try {
      setIsBusy(true)
      setStatusMessage(null)
      await callSecureApi<{ ok: true }>('/admin/plans/upsert', {
        id: plan.id,
        name: plan.name,
        description: plan.description || '',
        monthlyPrice: plan.monthlyPrice,
        minutesPerMonth: plan.minutesPerMonth,
        isActive: plan.isActive,
        displayOrder: plan.displayOrder,
      })
      setStatusMessage(`Plan opgeslagen: ${plan.name}`)
      await loadData()
    } catch (error) {
      setStatusMessage(parseError(error))
    } finally {
      setIsBusy(false)
    }
  }, [loadData])

  const createPlan = useCallback(async () => {
    const name = newPlanName.trim()
    const price = Number(newPlanPrice)
    const minutes = Number(newPlanMinutes)
    if (!name || !Number.isFinite(price) || price < 0 || !Number.isFinite(minutes) || minutes < 0) {
      setStatusMessage('Vul een geldige plannaam, prijs en minuten in.')
      return
    }

    try {
      setIsBusy(true)
      setStatusMessage(null)
      await callSecureApi<{ ok: true }>('/admin/plans/upsert', {
        name,
        description: newPlanDescription.trim(),
        monthlyPrice: price,
        minutesPerMonth: Math.trunc(minutes),
        isActive: true,
      })
      setNewPlanName('')
      setNewPlanDescription('')
      setNewPlanPrice('')
      setNewPlanMinutes('')
      setStatusMessage('Nieuw plan toegevoegd.')
      await loadData()
    } catch (error) {
      setStatusMessage(parseError(error))
    } finally {
      setIsBusy(false)
    }
  }, [loadData, newPlanDescription, newPlanMinutes, newPlanName, newPlanPrice])

  const movePlan = useCallback(async (planId: string, direction: -1 | 1) => {
    const currentIndex = plans.findIndex((plan) => plan.id === planId)
    const nextIndex = currentIndex + direction
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= plans.length) return

    const nextOrder = [...plans]
    const temp = nextOrder[currentIndex]
    nextOrder[currentIndex] = nextOrder[nextIndex]
    nextOrder[nextIndex] = temp

    try {
      setIsBusy(true)
      setStatusMessage(null)
      await callSecureApi<{ ok: true }>('/admin/plans/reorder', {
        planIds: nextOrder.map((plan) => plan.id),
      })
      setStatusMessage('Planvolgorde bijgewerkt.')
      await loadData()
    } catch (error) {
      setStatusMessage(parseError(error))
    } finally {
      setIsBusy(false)
    }
  }, [loadData, plans])

  const saveSelectedUser = useCallback(async () => {
    if (!selectedUser || !selectedUserForm) return
    const customMonthlyPrice = selectedUserForm.customMonthlyPrice.trim()
    const extraMinutes = Number(selectedUserForm.extraMinutes)
    if (!Number.isFinite(extraMinutes) || extraMinutes < 0) {
      setStatusMessage('Extra minuten moeten 0 of hoger zijn.')
      return
    }

    try {
      setIsBusy(true)
      setStatusMessage(null)
      await callSecureApi<{ ok: true }>('/admin/users/update-pricing-controls', {
        userId: selectedUser.userId,
        planId: selectedUserForm.planId,
        customMonthlyPrice: customMonthlyPrice.length > 0 ? Number(customMonthlyPrice) : null,
        extraMinutes: Math.trunc(extraMinutes),
        accountType: selectedUserForm.accountType,
        isAllowlisted: selectedUserForm.isAllowlisted,
        canSeePricingPage: selectedUserForm.canSeePricingPage,
        pilotFlag: selectedUserForm.pilotFlag,
        adminNotes: selectedUserForm.adminNotes.trim(),
      })
      setStatusMessage(`Gebruiker opgeslagen: ${buildUserLabel(selectedUser)}`)
      await loadData()
    } catch (error) {
      setStatusMessage(parseError(error))
    } finally {
      setIsBusy(false)
    }
  }, [loadData, selectedUser, selectedUserForm])

  function updatePlanValue(planId: string, patch: Partial<Plan>) {
    setPlans((prev) => prev.map((plan) => (plan.id === planId ? { ...plan, ...patch } : plan)))
  }

  return (
    <View style={styles.page}>
      <View style={styles.headerRow}>
        <View>
          <Text isBold style={styles.title}>Admin pricing</Text>
          <Text style={styles.subtitle}>Handmatige verkoopflow en planbeheer</Text>
        </View>
        <Pressable onPress={() => void loadData()} style={({ hovered }) => [styles.refreshButton, hovered ? styles.refreshButtonHovered : undefined]} disabled={isLoading || isBusy}>
          <Text isBold style={styles.refreshButtonText}>{isLoading ? 'Laden...' : 'Verversen'}</Text>
        </Pressable>
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      {statusMessage ? <Text style={styles.statusText}>{statusMessage}</Text> : null}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.allowlistHeaderRow}>
            <View>
              <Text isSemibold style={styles.cardTitle}>Account allowlist</Text>
              <Text style={styles.cardSubtitle}>Alleen e-mails in deze lijst kunnen inloggen in de webapp.</Text>
            </View>
            <Pressable
              onPress={() => void loadAllowlist()}
              style={({ hovered }) => [styles.secondaryButton, hovered ? styles.secondaryButtonHovered : undefined]}
              disabled={isAllowlistLoading || isAllowlistBusy}
            >
              <Text isBold style={styles.secondaryButtonText}>Verversen</Text>
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
              style={styles.input}
              editable={!isAllowlistBusy}
            />
            <Pressable
              onPress={() => void addAllowlistEmail()}
              style={({ hovered }) => [styles.primaryButton, hovered ? styles.primaryButtonHovered : undefined, isAllowlistBusy ? styles.buttonDisabled : undefined]}
              disabled={isAllowlistBusy}
            >
              <Text isBold style={styles.primaryButtonText}>Toevoegen</Text>
            </Pressable>
          </View>

          {allowlistErrorMessage ? <Text style={styles.errorText}>{allowlistErrorMessage}</Text> : null}
          {allowlistStatusMessage ? <Text style={styles.statusText}>{allowlistStatusMessage}</Text> : null}

          {isAllowlistLoading ? (
            <Text style={styles.cardSubtitle}>Allowlist laden...</Text>
          ) : allowlistItems.length === 0 ? (
            <Text style={styles.cardSubtitle}>Nog geen e-mailadressen in de allowlist.</Text>
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
                    style={({ hovered }) => [styles.secondaryButton, hovered ? styles.secondaryButtonHovered : undefined, isAllowlistBusy ? styles.buttonDisabled : undefined]}
                    disabled={isAllowlistBusy}
                  >
                    <Text isBold style={styles.secondaryButtonText}>Verwijderen</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text isSemibold style={styles.cardTitle}>Plannen</Text>
          <View style={styles.newPlanRow}>
            <TextInput value={newPlanName} onChangeText={setNewPlanName} placeholder="Plannaam" placeholderTextColor={colors.textSecondary} style={styles.input} editable={!isBusy} />
            <TextInput value={newPlanPrice} onChangeText={setNewPlanPrice} placeholder="Prijs p/m" placeholderTextColor={colors.textSecondary} keyboardType="numeric" style={styles.inputSmall} editable={!isBusy} />
            <TextInput value={newPlanMinutes} onChangeText={setNewPlanMinutes} placeholder="Minuten" placeholderTextColor={colors.textSecondary} keyboardType="numeric" style={styles.inputSmall} editable={!isBusy} />
            <Pressable onPress={() => void createPlan()} style={({ hovered }) => [styles.primaryButton, hovered ? styles.primaryButtonHovered : undefined]} disabled={isBusy}>
              <Text isBold style={styles.primaryButtonText}>Plan toevoegen</Text>
            </Pressable>
          </View>
          <TextInput value={newPlanDescription} onChangeText={setNewPlanDescription} placeholder="Omschrijving (optioneel)" placeholderTextColor={colors.textSecondary} style={styles.input} editable={!isBusy} />

          {plans.map((plan, index) => (
            <View key={plan.id} style={styles.planRow}>
              <View style={styles.planInputRow}>
                <TextInput value={plan.name} onChangeText={(value) => updatePlanValue(plan.id, { name: value })} placeholder="Naam" placeholderTextColor={colors.textSecondary} style={styles.input} editable={!isBusy} />
                <TextInput value={String(plan.monthlyPrice)} onChangeText={(value) => updatePlanValue(plan.id, { monthlyPrice: Number(value) || 0 })} placeholder="Prijs" placeholderTextColor={colors.textSecondary} keyboardType="numeric" style={styles.inputSmall} editable={!isBusy} />
                <TextInput value={String(plan.minutesPerMonth)} onChangeText={(value) => updatePlanValue(plan.id, { minutesPerMonth: Number(value) || 0 })} placeholder="Minuten" placeholderTextColor={colors.textSecondary} keyboardType="numeric" style={styles.inputSmall} editable={!isBusy} />
              </View>
              <TextInput value={plan.description || ''} onChangeText={(value) => updatePlanValue(plan.id, { description: value })} placeholder="Omschrijving" placeholderTextColor={colors.textSecondary} style={styles.input} editable={!isBusy} />
              <View style={styles.planActionsRow}>
                <Pressable onPress={() => updatePlanValue(plan.id, { isActive: !plan.isActive })} style={({ hovered }) => [styles.secondaryButton, hovered ? styles.secondaryButtonHovered : undefined]} disabled={isBusy}>
                  <Text isBold style={styles.secondaryButtonText}>{plan.isActive ? 'Actief' : 'Inactief'}</Text>
                </Pressable>
                <Pressable onPress={() => void movePlan(plan.id, -1)} style={({ hovered }) => [styles.secondaryButton, hovered ? styles.secondaryButtonHovered : undefined]} disabled={isBusy || index === 0}>
                  <Text isBold style={styles.secondaryButtonText}>Omhoog</Text>
                </Pressable>
                <Pressable onPress={() => void movePlan(plan.id, 1)} style={({ hovered }) => [styles.secondaryButton, hovered ? styles.secondaryButtonHovered : undefined]} disabled={isBusy || index === plans.length - 1}>
                  <Text isBold style={styles.secondaryButtonText}>Omlaag</Text>
                </Pressable>
                <Pressable onPress={() => void savePlan(plan)} style={({ hovered }) => [styles.primaryButton, hovered ? styles.primaryButtonHovered : undefined]} disabled={isBusy}>
                  <Text isBold style={styles.primaryButtonText}>Opslaan</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text isSemibold style={styles.cardTitle}>Gebruikers</Text>
          <Text style={styles.cardSubtitle}>Flow: kies gebruiker, zet allowlist aan, koppel plan, stel prijs/minuten in, noteer deal, opslaan.</Text>

          <View style={styles.usersLayout}>
            <View style={styles.userList}>
              {users.map((user) => (
                <Pressable key={user.userId} onPress={() => setSelectedUserId(user.userId)} style={({ hovered }) => [styles.userRow, selectedUserId === user.userId ? styles.userRowSelected : undefined, hovered ? styles.userRowHovered : undefined]}>
                  <Text isSemibold style={styles.userRowTitle}>{buildUserLabel(user)}</Text>
                  <Text style={styles.userRowMeta}>{user.planName || 'Geen plan'} | {formatMoney(user.customMonthlyPrice)} | {user.availableMinutesPerMonth} min</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.userEditor}>
              {!selectedUser || !selectedUserForm ? (
                <Text style={styles.emptyText}>Selecteer een gebruiker</Text>
              ) : (
                <>
                  <Text isSemibold style={styles.selectedUserTitle}>{buildUserLabel(selectedUser)}</Text>

                  <View style={styles.toggleRow}>
                    <Pressable onPress={() => setSelectedUserForm((prev) => (prev ? { ...prev, isAllowlisted: !prev.isAllowlisted } : prev))} style={({ hovered }) => [styles.secondaryButton, hovered ? styles.secondaryButtonHovered : undefined]}>
                      <Text isBold style={styles.secondaryButtonText}>Allowlist: {selectedUserForm.isAllowlisted ? 'Aan' : 'Uit'}</Text>
                    </Pressable>
                    <Pressable onPress={() => setSelectedUserForm((prev) => (prev ? { ...prev, canSeePricingPage: !prev.canSeePricingPage } : prev))} style={({ hovered }) => [styles.secondaryButton, hovered ? styles.secondaryButtonHovered : undefined]}>
                      <Text isBold style={styles.secondaryButtonText}>Pricing zichtbaar: {selectedUserForm.canSeePricingPage ? 'Ja' : 'Nee'}</Text>
                    </Pressable>
                    <Pressable onPress={() => setSelectedUserForm((prev) => (prev ? { ...prev, pilotFlag: !prev.pilotFlag } : prev))} style={({ hovered }) => [styles.secondaryButton, hovered ? styles.secondaryButtonHovered : undefined]}>
                      <Text isBold style={styles.secondaryButtonText}>Pilot: {selectedUserForm.pilotFlag ? 'Ja' : 'Nee'}</Text>
                    </Pressable>
                  </View>

                  <Text style={styles.fieldLabel}>Account type</Text>
                  <View style={styles.toggleRow}>
                    {(['admin', 'paid', 'test'] as const).map((accountType) => (
                      <Pressable key={accountType} onPress={() => setSelectedUserForm((prev) => (prev ? { ...prev, accountType } : prev))} style={({ hovered }) => [styles.accountTypeButton, selectedUserForm.accountType === accountType ? styles.accountTypeButtonSelected : undefined, hovered ? styles.secondaryButtonHovered : undefined]}>
                        <Text isBold style={selectedUserForm.accountType === accountType ? styles.accountTypeButtonTextSelected : styles.accountTypeButtonText}>{accountType}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={styles.fieldLabel}>Plan</Text>
                  <View style={styles.planSelectorWrap}>
                    <Pressable onPress={() => setSelectedUserForm((prev) => (prev ? { ...prev, planId: null } : prev))} style={({ hovered }) => [styles.accountTypeButton, selectedUserForm.planId == null ? styles.accountTypeButtonSelected : undefined, hovered ? styles.secondaryButtonHovered : undefined]}>
                      <Text isBold style={selectedUserForm.planId == null ? styles.accountTypeButtonTextSelected : styles.accountTypeButtonText}>Geen plan</Text>
                    </Pressable>
                    {plans.map((plan) => (
                      <Pressable key={plan.id} onPress={() => setSelectedUserForm((prev) => (prev ? { ...prev, planId: plan.id } : prev))} style={({ hovered }) => [styles.accountTypeButton, selectedUserForm.planId === plan.id ? styles.accountTypeButtonSelected : undefined, hovered ? styles.secondaryButtonHovered : undefined]}>
                        <Text isBold style={selectedUserForm.planId === plan.id ? styles.accountTypeButtonTextSelected : styles.accountTypeButtonText}>{plan.name}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <View style={styles.userInputRow}>
                    <View style={styles.fieldColumn}>
                      <Text style={styles.fieldLabel}>Custom prijs p/m (optioneel)</Text>
                      <TextInput value={selectedUserForm.customMonthlyPrice} onChangeText={(value) => setSelectedUserForm((prev) => (prev ? { ...prev, customMonthlyPrice: value } : prev))} placeholder="bijv. 49.95" placeholderTextColor={colors.textSecondary} keyboardType="numeric" style={styles.input} />
                    </View>
                    <View style={styles.fieldColumn}>
                      <Text style={styles.fieldLabel}>Extra minuten</Text>
                      <TextInput value={selectedUserForm.extraMinutes} onChangeText={(value) => setSelectedUserForm((prev) => (prev ? { ...prev, extraMinutes: value } : prev))} placeholder="0" placeholderTextColor={colors.textSecondary} keyboardType="numeric" style={styles.input} />
                    </View>
                  </View>

                  <Text style={styles.fieldLabel}>Admin notities</Text>
                  <TextInput value={selectedUserForm.adminNotes} onChangeText={(value) => setSelectedUserForm((prev) => (prev ? { ...prev, adminNotes: value } : prev))} placeholder="Deal details / afspraken" placeholderTextColor={colors.textSecondary} multiline style={styles.notesInput} />

                  <Pressable onPress={() => void saveSelectedUser()} style={({ hovered }) => [styles.primaryButton, hovered ? styles.primaryButtonHovered : undefined]} disabled={isBusy}>
                    <Text isBold style={styles.primaryButtonText}>Gebruiker opslaan</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.pageBackground,
    padding: 24,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    lineHeight: 28,
    color: colors.textStrong,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  refreshButton: {
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.selected,
  },
  refreshButtonHovered: {
    opacity: 0.9,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 16,
  },
  errorText: {
    color: '#A80000',
    fontSize: 13,
    lineHeight: 17,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 17,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 20,
  },
  allowlistHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  allowlistAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  allowlistList: {
    gap: 8,
  },
  allowlistItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    backgroundColor: colors.pageBackground,
  },
  allowlistItemTextWrap: {
    flex: 1,
    gap: 2,
  },
  allowlistItemEmail: {
    color: colors.textStrong,
    fontSize: 14,
    lineHeight: 18,
  },
  allowlistItemMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 17,
    lineHeight: 22,
    color: colors.textStrong,
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  newPlanRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  planRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  planInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  planActionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  input: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  inputSmall: {
    width: 120,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  usersLayout: {
    flexDirection: 'row',
    gap: 12,
  },
  userList: {
    width: 360,
    gap: 8,
  },
  userRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.pageBackground,
    padding: 10,
    gap: 2,
  },
  userRowSelected: {
    borderColor: colors.selected,
    backgroundColor: '#FCE3F2',
  },
  userRowHovered: {
    opacity: 0.95,
  },
  userRowTitle: {
    fontSize: 13,
    lineHeight: 17,
    color: colors.textStrong,
  },
  userRowMeta: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  userEditor: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.pageBackground,
    padding: 12,
    gap: 10,
  },
  selectedUserTitle: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  secondaryButton: {
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  secondaryButtonText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textStrong,
  },
  accountTypeButton: {
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountTypeButtonSelected: {
    borderColor: colors.selected,
    backgroundColor: '#FCE3F2',
  },
  accountTypeButtonText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textStrong,
  },
  accountTypeButtonTextSelected: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.selected,
  },
  fieldLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  planSelectorWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  userInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldColumn: {
    flex: 1,
    gap: 6,
  },
  notesInput: {
    minHeight: 120,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
    ...( { textAlignVertical: 'top' } as any ),
  },
  primaryButton: {
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: colors.selected,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonHovered: {
    opacity: 0.9,
  },
  primaryButtonText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#FFFFFF',
  },
})
