import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native'

import { FullScreenCloseIcon } from '@/icons/FullScreenCloseIcon'
import { TrashIcon } from '@/icons/TrashIcon'
import { colors } from '@/design/theme/colors'
import { useLocalAppData } from '@/storage/LocalAppDataProvider'
import { clientApi, type AssignedCoach, type OrganizationCoach } from '@/api/clients/clientApi'
import { getClientUpsertValues } from '@/types/clientProfile'
import { Modal } from '@/ui/animated/Modal'
import { ActionMenu } from '@/ui/overlays/ActionMenu'
import { Text } from '@/ui/Text'
import { ConfirmChatClearModal } from '@/screens/shared/modals/ConfirmChatClearModal'
import { ConfirmInputDeleteModal } from '@/screens/shared/modals/ConfirmInputDeleteModal'
import { ClientUpsertModal } from '@/screens/shared/modals/ClientUpsertModal'
import { ConfirmNoteDeleteModal } from '@/screens/shared/modals/ConfirmNoteDeleteModal'
import { NoteEditModal } from '@/screens/shared/modals/NoteEditModal'
import { WarningModal } from '@/ui/modals/WarningModal'
import { saveClientProfileChanges, saveNewClientNote } from '@/screens/client/clientScreen.functions'
import {
  getActiveTrajectory,
  getClientInputListItems,
  getClientTrajectories,
} from '@/screens/client/clientScreen.logic'
import type {
  ClientLeftTabKey,
  ClientRightTabKey,
  ClientScreenProps,
  InputListItem,
} from '@/screens/client/clientScreen.types'
import { ClientHeaderCard } from '@/screens/client/components/ClientHeaderCard'
import { ClientLeftTabs } from '@/screens/client/components/ClientLeftTabs'
import { ClientRightTabs } from '@/screens/client/components/ClientRightTabs'
import { ClientChatbot } from '@/screens/client/components/chatbot/clientChatbot'
import { useClientChatbot } from '@/screens/client/clientScreen.hooks'

export function ClientScreen({
  clientId,
  onBack,
  onSelectInput,
  onPressCreateInput,
  onPressCreateReports,
  initialLeftActiveTabKey = 'sessies',
  initialRightActiveTabKey = 'chatbot',
  onLeftActiveTabChange,
  isCreateInputDisabled = false,
}: ClientScreenProps) {

  const { height: windowHeight } = useWindowDimensions()
  const localAppData = useLocalAppData()
  const { data, createInput, createNote, updateNote, deleteNote, deleteInput, deleteReport: deleteReportFromStore, createTrajectory, updateTrajectory, deleteClient } = localAppData as any
  const deleteReport = (deleteReportFromStore ?? deleteInput) as (reportId: string) => void
  const legacyUpdateClientKey = ['update', 'Coa', 'chee'].join('')
  const updateClient = ((localAppData as any).updateClient ?? (localAppData as any)[legacyUpdateClientKey]) as (
    clientId: string,
    values: { name?: string; clientDetails?: string; employerDetails?: string },
  ) => void

  const clients = ((data as any).clients ?? []) as Array<any>
  const client = clients.find((item) => item.id === clientId) ?? null
  const clientName = client?.name ?? 'Client'
  const clientProfileValues = useMemo(() => getClientUpsertValues(client), [client])
  const clientTrajectories = useMemo(() => getClientTrajectories(data, clientId), [clientId, data])
  const clientTrajectoryOptions = useMemo(
    () =>
      clientTrajectories.map((trajectory) => ({
        id: trajectory.id,
        label: String(trajectory.name || '').trim() || 'Traject',
      })),
    [clientTrajectories],
  )
  const selectedTrajectoryId = String(clientProfileValues.trajectoryId || '').trim()
  const activeTrajectory = useMemo(
    () => getActiveTrajectory(clientTrajectories, selectedTrajectoryId),
    [clientTrajectories, selectedTrajectoryId],
  )
  const { sessionItems, documentItems, noteItems, reportItems } = useMemo(
    () => getClientInputListItems(data, clientId),
    [clientId, data],
  )
  const sessionCount = sessionItems.length
  const reportCount = reportItems.length

  const [leftActiveTabKey, setLeftActiveTabKey] = useState<ClientLeftTabKey>(initialLeftActiveTabKey || 'sessies')
  const [rightActiveTabKey, setRightActiveTabKey] = useState<ClientRightTabKey>(initialRightActiveTabKey || 'chatbot')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateNoteModalOpen, setIsCreateNoteModalOpen] = useState(false)
  const [menuInputId, setMenuInputId] = useState<string | null>(null)
  const [menuItemType, setMenuItemType] = useState<'session' | 'note' | 'report' | null>(null)
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null)
  const [hoveredMenuItemId, setHoveredMenuItemId] = useState<string | null>(null)
  const [menuAnchorPoint, setMenuAnchorPoint] = useState<{ x: number; y: number } | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [pendingDeleteInputId, setPendingDeleteInputId] = useState<string | null>(null)
  const [pendingDeleteItemType, setPendingDeleteItemType] = useState<'session' | 'report' | null>(null)
  const [isDeleteNoteModalOpen, setIsDeleteNoteModalOpen] = useState(false)
  const [pendingDeleteNoteId, setPendingDeleteNoteId] = useState<string | null>(null)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [isClearChatModalVisible, setIsClearChatModalVisible] = useState(false)
  const [isAssistantFullscreen, setIsAssistantFullscreen] = useState(false)
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false)
  const [isDeleteClientWarningVisible, setIsDeleteClientWarningVisible] = useState(false)
  const [assignedCoaches, setAssignedCoaches] = useState<AssignedCoach[]>([])
  const [organizationCoaches, setOrganizationCoaches] = useState<OrganizationCoach[]>([])
  const [selectedCoachUserId, setSelectedCoachUserId] = useState<string>('')
  const [isUpdatingAssignments, setIsUpdatingAssignments] = useState(false)
  const [isCoachDropdownOpen, setIsCoachDropdownOpen] = useState(false)
  const chatAnchorFrameRef = useRef<number | null>(null)
  const lastAnchoredAssistantPanelHeightRef = useRef<number | null>(null)
  const onLeftActiveTabChangeRef = useRef(onLeftActiveTabChange)
  const lastNotifiedLeftTabRef = useRef<ClientLeftTabKey | null>(null)
  const containerScrollRef = useRef<ScrollView | null>(null)

  const searchInputRef = useRef<TextInput | null>(null)
  const chatScrollRef = useRef<ScrollView | null>(null)
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const isSearchExpanded = isSearchOpen || normalizedQuery.length > 0
  const isDocumentsTab = leftActiveTabKey === 'documenten'
  const showsDurationColumn = false
  const visibleItems = isDocumentsTab ? documentItems : leftActiveTabKey === 'notities' ? noteItems : leftActiveTabKey === 'rapportages' ? reportItems : sessionItems
  const filteredInputs = visibleItems.filter((item) => item.searchText.includes(normalizedQuery))
  const chatContextInputIds = useMemo(() => {
    if (leftActiveTabKey === 'documenten') return new Set(documentItems.map((item) => item.targetInputId))
    if (leftActiveTabKey === 'notities') return new Set(noteItems.map((item) => item.targetInputId))
    if (leftActiveTabKey === 'rapportages') return new Set(reportItems.map((item) => item.targetInputId))
    return new Set(sessionItems.map((item) => item.targetInputId))
  }, [documentItems, leftActiveTabKey, noteItems, reportItems, sessionItems])
  const clientIntentTemplates = useMemo(
    () => data.templates.map((template: any) => ({ id: template.id, name: template.name })),
    [data.templates],
  )
  const statusSummaryFallback = useMemo(() => {
    const latest = sessionItems[0] ?? null
    if (!latest) return `Nog geen sessies voor ${clientName}. Start met een eerste sessie om AI-status op te bouwen.`
    const latestDate = `${latest.dateLabel}${latest.timeLabel ? ` ${latest.timeLabel}` : ''}`
    return `Het traject loopt ${activeTrajectory?.name ? `binnen "${activeTrajectory.name}"` : 'zonder actief traject'}. Laatste sessie: "${latest.title}" op ${latestDate}. Tot nu toe: ${sessionCount} sessies en ${reportCount} rapportages. Volgende stap: vervolg op laatste actiepunten en status opnieuw evalueren.`
  }, [activeTrajectory?.name, clientName, reportCount, sessionCount, sessionItems])
  const {
    chatMessages,
    composerText,
    handleSendChatMessage,
    isChatMinutesBlocked,
    isChatSending,
    isCheckingChatMinutes,
    isNoMinutesCtaDismissed,
    isStatusSummaryLoading,
    resetChat,
    sendChatMessage,
    setComposerText,
    setIsNoMinutesCtaDismissed,
    statusSummaryAi,
  } = useClientChatbot({
    activeTrajectoryName: activeTrajectory?.name ?? null,
    rightActiveTabKey,
    chatContextInputIds,
    chatScrollRef,
    client,
    clientId,
    clientName,
    onStatusFallbackText: statusSummaryFallback,
    reportCount,
    sessionCount,
    inputs: data.inputs,
    sessionItemsForStatus: sessionItems,
    snippets: data.snippets,
    inputSummaries: data.inputSummaries,
  })

  const searchPlaceholder =
    leftActiveTabKey === 'documenten'
      ? 'Zoek documenten...'
      : leftActiveTabKey === 'notities'
        ? 'Zoek notities...'
        : leftActiveTabKey === 'rapportages'
          ? 'Zoek rapportages...'
          : 'Zoek sessies...'
  const shouldShowSearch = visibleItems.length > 1

  const isMenuVisible = !!menuInputId && !!menuAnchorPoint
  const pendingDeleteInputTitle = pendingDeleteInputId
    ? pendingDeleteItemType === 'report'
      ? data.reports.find((item: any) => item.id === pendingDeleteInputId)?.title
      : data.inputs.find((item: any) => item.id === pendingDeleteInputId)?.title
    : null
  const pendingDeleteNoteTitle = pendingDeleteNoteId ? data.notes.find((item: any) => item.id === pendingDeleteNoteId)?.title : null
  const editingNote = editingNoteId ? data.notes.find((item: any) => item.id === editingNoteId) ?? null : null
  const leftPanelTitle =
    leftActiveTabKey === 'documenten'
      ? 'Documenten'
      : leftActiveTabKey === 'notities'
        ? 'Notities'
        : leftActiveTabKey === 'rapportages'
          ? 'Rapportages'
          : 'Recente sessies'
  const tableFirstColumnLabel =
    leftActiveTabKey === 'documenten'
      ? 'Document'
      : leftActiveTabKey === 'notities'
        ? 'Notitie'
        : leftActiveTabKey === 'rapportages'
          ? 'Rapportage'
          : 'Sessie'

  const assistantPanelHeight = Math.max(640, windowHeight - 180)
  const rightColumnFloatingStyle = useMemo(
    () => ({ height: assistantPanelHeight, minHeight: assistantPanelHeight, maxHeight: assistantPanelHeight } as any),
    [assistantPanelHeight],
  )
  const leftColumnMatchHeightStyle = useMemo(
    () => ({ height: assistantPanelHeight, minHeight: assistantPanelHeight, maxHeight: assistantPanelHeight } as any),
    [assistantPanelHeight],
  )

  useEffect(() => {
    setIsAssistantFullscreen(false)
  }, [clientId])

  useEffect(() => {
    containerScrollRef.current?.scrollTo({ y: 0, animated: false })
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [clientId])

  useEffect(() => {
    setLeftActiveTabKey(initialLeftActiveTabKey || 'sessies')
    setRightActiveTabKey(initialRightActiveTabKey || 'chatbot')
    setIsSearchOpen(false)
    setSearchQuery('')
    setIsCreateNoteModalOpen(false)
    setEditingNoteId(null)
    setMenuInputId(null)
    setMenuItemType(null)
    setMenuAnchorPoint(null)
    setHoveredItemId(null)
    setHoveredMenuItemId(null)
  }, [clientId, initialLeftActiveTabKey, initialRightActiveTabKey])

  useEffect(() => {
    let cancelled = false
    if (!clientId) return
    void (async () => {
      try {
        const [assigned, available] = await Promise.all([
          clientApi.listAssignedCoaches(clientId),
          clientApi.listOrganizationCoaches(clientId),
        ])
        if (cancelled) return
        setAssignedCoaches(assigned)
        setOrganizationCoaches(available)
        setSelectedCoachUserId((previous) => previous || available[0]?.userId || '')
      } catch {
        if (cancelled) return
        setAssignedCoaches([])
        setOrganizationCoaches([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [clientId])

  useEffect(() => {
    onLeftActiveTabChangeRef.current = onLeftActiveTabChange
  }, [onLeftActiveTabChange])

  useEffect(() => {
    if (!isSearchOpen) return
    const id = setTimeout(() => searchInputRef.current?.focus(), 120)
    return () => clearTimeout(id)
  }, [leftActiveTabKey, isSearchOpen])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!isSearchExpanded) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      ;(searchInputRef.current as any)?.blur?.()
      if (searchQuery.trim().length === 0) setIsSearchOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isSearchExpanded, searchQuery])

  useEffect(() => {
    if (lastNotifiedLeftTabRef.current === leftActiveTabKey) return
    lastNotifiedLeftTabRef.current = leftActiveTabKey
    onLeftActiveTabChangeRef.current?.(leftActiveTabKey)
  }, [leftActiveTabKey])

  useEffect(() => {
    if (rightActiveTabKey !== 'chatbot' || isAssistantFullscreen || chatMessages.length === 0) {
      lastAnchoredAssistantPanelHeightRef.current = assistantPanelHeight
      return
    }

    const previousHeight = lastAnchoredAssistantPanelHeightRef.current
    lastAnchoredAssistantPanelHeightRef.current = assistantPanelHeight
    if (previousHeight === null) return
    if (Math.abs(assistantPanelHeight - previousHeight) < 0.1) return

    const scrollView = chatScrollRef.current
    if (!scrollView) return
    const scrollToLatest = () => scrollView.scrollToEnd({ animated: false })

    if (typeof window === 'undefined') {
      setTimeout(scrollToLatest, 0)
      return
    }

    if (chatAnchorFrameRef.current !== null) window.cancelAnimationFrame(chatAnchorFrameRef.current)
    chatAnchorFrameRef.current = window.requestAnimationFrame(() => {
      scrollToLatest()
      chatAnchorFrameRef.current = null
    })
  }, [assistantPanelHeight, rightActiveTabKey, chatMessages.length, isAssistantFullscreen])

  useEffect(
    () => () => {
      if (typeof window === 'undefined') return
      if (chatAnchorFrameRef.current !== null) window.cancelAnimationFrame(chatAnchorFrameRef.current)
      chatAnchorFrameRef.current = null
    },
    [],
  )

  function renderClientChatbot(isModal: boolean) {
    return (
      <ClientChatbot
        autoFocusKey={rightActiveTabKey}
        chatMessages={chatMessages}
        chatScrollRef={chatScrollRef}
        clientId={clientId}
        clientIntentTemplates={clientIntentTemplates}
        composerText={composerText}
        handleSendChatMessage={handleSendChatMessage}
        isAssistantFullscreen={isAssistantFullscreen}
        isChatMinutesBlocked={isChatMinutesBlocked}
        isChatSending={isChatSending}
        isCheckingChatMinutes={isCheckingChatMinutes}
        isModal={isModal}
        isNoMinutesCtaDismissed={isNoMinutesCtaDismissed}
        onSelectStarterPrompt={sendChatMessage}
        onShowClearChatConfirm={() => setIsClearChatModalVisible(true)}
        onToggleFullscreen={() => setIsAssistantFullscreen((previous) => !previous)}
        setComposerText={setComposerText}
        setIsNoMinutesCtaDismissed={setIsNoMinutesCtaDismissed}
      />
    )
  }

  function handleSaveNewNote(values: { title: string; text: string }) {
    const result = saveNewClientNote(
      {
        createNote,
      },
      { clientId, activeTrajectoryId: activeTrajectory?.id ?? null, values },
    )
    if (result.didSave) setIsCreateNoteModalOpen(false)
  }

  function handleAddItemForLeftTab() {
    if (leftActiveTabKey === 'documenten') {
      onPressCreateInput(activeTrajectory?.id ?? null, 'import-document')
      return
    }
    if (leftActiveTabKey === 'notities') {
      setIsCreateNoteModalOpen(true)
      return
    }
    if (leftActiveTabKey === 'rapportages') {
      onPressCreateReports(activeTrajectory?.id ?? null)
      return
    }
    onPressCreateInput(activeTrajectory?.id ?? null)
  }

  function openRowMenu(item: InputListItem, event?: any) {
    const rowMenuWidth = 220
    const rect = event?.currentTarget?.getBoundingClientRect?.() ?? event?.nativeEvent?.target?.getBoundingClientRect?.()
    if (!rect) return
    setMenuInputId(item.id)
    setMenuItemType(item.rowType === 'note' ? 'note' : item.rowType === 'report' ? 'report' : 'session')
    setMenuAnchorPoint({ x: rect.right - rowMenuWidth, y: rect.top + rect.height })
  }

  function handlePressRow(item: InputListItem) {
    if (item.rowType === 'note') {
      setEditingNoteId(item.id)
      return
    }
    if (item.rowType === 'document') return
    onSelectInput(item.targetInputId, leftActiveTabKey)
  }

  const primaryCoachUserId = String((client as any)?.primaryCoachUserId || '').trim() || null
  const assignedCoachUserIds = new Set(assignedCoaches.map((coach) => coach.userId))
  const availableToAssign = organizationCoaches.filter((coach) => !assignedCoachUserIds.has(coach.userId))
  const shouldShowAssignedCoachesCard = false

  return (
    <ScrollView ref={containerScrollRef} style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ClientHeaderCard
        clientName={clientName}
        isCreateInputDisabled={isCreateInputDisabled}
        sessionCount={sessionCount}
        onOpenEditClient={() => setIsEditClientModalOpen(true)}
        onPressCreateReports={() => onPressCreateReports(activeTrajectory?.id ?? null)}
        onPressCreateInput={() => onPressCreateInput(activeTrajectory?.id ?? null)}
      />
      {shouldShowAssignedCoachesCard ? <View style={styles.assignmentCard}>
        <Text isSemibold style={styles.assignmentTitle}>Toegewezen coaches</Text>
        <View style={styles.assignmentList}>
          {assignedCoaches.length === 0 ? (
            <Text style={styles.assignmentEmptyText}>Nog geen toegewezen coaches.</Text>
          ) : (
            assignedCoaches.map((coach) => {
              const isPrimary = primaryCoachUserId === coach.userId
              return (
                <View key={coach.userId} style={styles.assignmentRow}>
                  <View style={styles.assignmentIdentity}>
                    <Text style={styles.assignmentName}>
                      {String(coach.displayName || coach.email || coach.userId)}
                      {isPrimary ? ' (primaire coach)' : ''}
                    </Text>
                    {coach.email ? <Text style={styles.assignmentEmail}>{coach.email}</Text> : null}
                  </View>
                  <View style={styles.assignmentActions}>
                    {!isPrimary ? (
                      <Pressable
                        disabled={isUpdatingAssignments}
                        onPress={() => {
                          setIsUpdatingAssignments(true)
                          void clientApi
                            .updatePrimaryCoach(clientId, coach.userId)
                            .then(() => Promise.all([clientApi.listAssignedCoaches(clientId), clientApi.listOrganizationCoaches(clientId)]))
                            .then(([assigned, available]) => {
                              setAssignedCoaches(assigned)
                              setOrganizationCoaches(available)
                            })
                            .finally(() => setIsUpdatingAssignments(false))
                        }}
                        style={({ hovered }) => [styles.assignmentButton, hovered ? styles.assignmentButtonHover : undefined]}
                      >
                        <Text style={styles.assignmentButtonText}>Maak primair</Text>
                      </Pressable>
                    ) : null}
                    <Pressable
                      disabled={isUpdatingAssignments || isPrimary}
                      onPress={() => {
                        setIsUpdatingAssignments(true)
                        void clientApi
                          .unassignCoach(clientId, coach.userId)
                          .then(() => Promise.all([clientApi.listAssignedCoaches(clientId), clientApi.listOrganizationCoaches(clientId)]))
                          .then(([assigned, available]) => {
                            setAssignedCoaches(assigned)
                            setOrganizationCoaches(available)
                          })
                          .finally(() => setIsUpdatingAssignments(false))
                      }}
                      style={({ hovered }) => [styles.assignmentDangerButton, hovered ? styles.assignmentDangerButtonHover : undefined]}
                    >
                      <Text style={styles.assignmentDangerButtonText}>Verwijder</Text>
                    </Pressable>
                  </View>
                </View>
              )
            })
          )}
        </View>
        <View style={styles.assignmentCreateRow}>
          <View style={styles.assignmentSelectWrap}>
            <Pressable
              onPress={() => setIsCoachDropdownOpen((value) => !value)}
              style={({ hovered }) => [styles.assignmentSelectButton, hovered ? styles.assignmentButtonHover : undefined]}
            >
              <Text style={styles.assignmentSelectButtonText}>
                {availableToAssign.find((coach) => coach.userId === selectedCoachUserId)?.displayName ||
                  availableToAssign.find((coach) => coach.userId === selectedCoachUserId)?.email ||
                  'Selecteer coach'}
              </Text>
            </Pressable>
            {isCoachDropdownOpen ? (
              <View style={styles.assignmentDropdown}>
                {availableToAssign.length === 0 ? (
                  <Text style={styles.assignmentEmptyText}>Geen extra coaches beschikbaar.</Text>
                ) : (
                  availableToAssign.map((coach) => (
                    <Pressable
                      key={coach.userId}
                      onPress={() => {
                        setSelectedCoachUserId(coach.userId)
                        setIsCoachDropdownOpen(false)
                      }}
                      style={({ hovered }) => [styles.assignmentDropdownOption, hovered ? styles.assignmentButtonHover : undefined]}
                    >
                      <Text style={styles.assignmentName}>{coach.displayName || coach.email || coach.userId}</Text>
                      {coach.email ? <Text style={styles.assignmentEmail}>{coach.email}</Text> : null}
                    </Pressable>
                  ))
                )}
              </View>
            ) : null}
          </View>
          <Pressable
            disabled={isUpdatingAssignments || !selectedCoachUserId.trim()}
            onPress={() => {
              const coachUserId = selectedCoachUserId.trim()
              if (!coachUserId) return
              setIsUpdatingAssignments(true)
              void clientApi
                .assignCoach(clientId, coachUserId)
                .then(() => Promise.all([clientApi.listAssignedCoaches(clientId), clientApi.listOrganizationCoaches(clientId)]))
                .then(([assigned, available]) => {
                  setAssignedCoaches(assigned)
                  setOrganizationCoaches(available)
                  setSelectedCoachUserId(available.find((coach) => coach.userId !== coachUserId)?.userId || '')
                })
                .finally(() => setIsUpdatingAssignments(false))
            }}
            style={({ hovered }) => [styles.assignmentAddButton, hovered ? styles.assignmentAddButtonHover : undefined]}
          >
            <Text style={styles.assignmentAddButtonText}>Coach toewijzen</Text>
          </Pressable>
        </View>
        {availableToAssign.length > 0 ? (
          <Text style={styles.assignmentHint}>Selecteer een coach uit de lijst om toe te wijzen.</Text>
        ) : null}
      </View> : null}

      <View style={styles.mainRow}>
        <ClientLeftTabs
          activeTabKey={leftActiveTabKey}
          filteredInputs={filteredInputs}
          hoveredItemId={hoveredItemId}
          hoveredMenuItemId={hoveredMenuItemId}
          isDocumentsTab={isDocumentsTab}
          isSearchExpanded={isSearchExpanded}
          leftColumnStyle={leftColumnMatchHeightStyle}
          menuInputId={menuInputId}
          searchInputRef={searchInputRef}
          searchPlaceholder={searchPlaceholder}
          searchQuery={searchQuery}
          title={leftPanelTitle}
          shouldShowSearch={shouldShowSearch}
          showsDurationColumn={showsDurationColumn}
          tableFirstColumnLabel={tableFirstColumnLabel}
          onAddItem={handleAddItemForLeftTab}
          onOpenRowMenu={openRowMenu}
          onPressRow={handlePressRow}
          onSelectTab={setLeftActiveTabKey}
          setHoveredItemId={setHoveredItemId}
          setHoveredMenuItemId={setHoveredMenuItemId}
          setIsSearchOpen={setIsSearchOpen}
          setSearchQuery={setSearchQuery}
        />

        <ClientRightTabs
          activeTabKey={rightActiveTabKey}
          chatContent={renderClientChatbot(false)}
          isStatusSummaryLoading={isStatusSummaryLoading}
          rightColumnStyle={rightColumnFloatingStyle}
          statusSummary={statusSummaryAi}
          onSelectTab={setRightActiveTabKey}
        />
      </View>

      <Modal visible={isAssistantFullscreen} onClose={() => setIsAssistantFullscreen(false)} contentContainerStyle={styles.fullscreenModalOverlay}>
        <View style={styles.fullscreenModalCard}>
          <Pressable
            onPress={() => setIsAssistantFullscreen(false)}
            style={({ hovered }) => [styles.fullscreenModalCloseButton, hovered ? styles.fullscreenModalCloseButtonHovered : undefined]}
          >
            <FullScreenCloseIcon size={18} color="#2C111F" />
          </Pressable>
          {renderClientChatbot(true)}
        </View>
      </Modal>

      <ActionMenu
        visible={isMenuVisible}
        anchorPoint={menuAnchorPoint}
        placement="below"
        width={220}
        estimatedHeight={52}
        items={[
          {
            key: 'delete',
            label: 'Verwijderen',
            icon: <TrashIcon color={colors.selected} size={18} />,
            isDanger: true,
            onPress: () => {
              if (!menuInputId) return
              if (menuItemType === 'note') {
                setPendingDeleteNoteId(menuInputId)
                setIsDeleteNoteModalOpen(true)
              } else {
                setPendingDeleteInputId(menuInputId)
                setPendingDeleteItemType(menuItemType === 'report' ? 'report' : 'session')
                setIsDeleteModalOpen(true)
              }
              setMenuInputId(null)
              setMenuItemType(null)
              setMenuAnchorPoint(null)
            },
          },
        ]}
        onClose={() => {
          setMenuInputId(null)
          setMenuItemType(null)
          setMenuAnchorPoint(null)
        }}
      />

      <ConfirmInputDeleteModal
        visible={isDeleteModalOpen}
        sessionTitle={pendingDeleteInputTitle}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setPendingDeleteInputId(null)
          setPendingDeleteItemType(null)
        }}
        onConfirm={() => {
          if (!pendingDeleteInputId) return
          if (pendingDeleteItemType === 'report') deleteReport(pendingDeleteInputId)
          else deleteInput(pendingDeleteInputId)
          setIsDeleteModalOpen(false)
          setPendingDeleteInputId(null)
          setPendingDeleteItemType(null)
        }}
      />

      <ConfirmNoteDeleteModal
        visible={isDeleteNoteModalOpen}
        noteText={pendingDeleteNoteTitle}
        onClose={() => {
          setIsDeleteNoteModalOpen(false)
          setPendingDeleteNoteId(null)
        }}
        onConfirm={() => {
          if (!pendingDeleteNoteId) return
          deleteNote(pendingDeleteNoteId)
          setIsDeleteNoteModalOpen(false)
          setPendingDeleteNoteId(null)
        }}
      />

      <ConfirmChatClearModal
        visible={isClearChatModalVisible}
        onClose={() => setIsClearChatModalVisible(false)}
        onConfirm={() => {
          setIsClearChatModalVisible(false)
          resetChat()
        }}
      />

      <NoteEditModal
        visible={isCreateNoteModalOpen}
        mode="create"
        initialTitle=""
        initialBody=""
        onClose={() => setIsCreateNoteModalOpen(false)}
        onSave={handleSaveNewNote}
      />

      <NoteEditModal
        visible={!!editingNote}
        mode="edit"
        initialTitle={editingNote?.title ?? ''}
        initialBody={editingNote?.text ?? ''}
        onClose={() => setEditingNoteId(null)}
        onSave={(values) => {
          if (!editingNote) return
          updateNote(editingNote.id, values)
        }}
        onDelete={() => {
          if (!editingNote) return
          deleteNote(editingNote.id)
          setEditingNoteId(null)
        }}
      />

      <ClientUpsertModal
        visible={isEditClientModalOpen}
        mode="edit"
        initialValues={{
          ...clientProfileValues,
          trajectoryId: activeTrajectory?.id ?? '',
          orderNumber: String(activeTrajectory?.orderNumber || ''),
          uwvContactName: String(activeTrajectory?.uwvContactName || ''),
        }}
        trajectoryOptions={clientTrajectoryOptions}
        onClose={() => setIsEditClientModalOpen(false)}
        onDelete={() => setIsDeleteClientWarningVisible(true)}
        onSave={(values) => {
          if (!client) return
          const result = saveClientProfileChanges(
            {
              updateClient,
              updateTrajectory,
              createTrajectory: (values) =>
                createTrajectory({
                  clientId: values.clientId,
                  name: values.name,
                  dienstType: values.dienstType,
                  uwvContactName: values.uwvContactName,
                  orderNumber: values.orderNumber,
                  startDate: values.startDate,
                } as any),
            },
            { clientId: client.id, activeTrajectory, values },
          )
          if (result.didSave) setIsEditClientModalOpen(false)
        }}
      />

      <WarningModal
        visible={isDeleteClientWarningVisible}
        title="Client verwijderen"
        description={`Weet je zeker dat je "${clientName}" wilt verwijderen? Alle sessies, notities en rapportages van deze client worden ook verwijderd. Dit kan niet ongedaan worden gemaakt.`}
        confirmLabel="Verwijderen"
        cancelLabel="Annuleren"
        onClose={() => setIsDeleteClientWarningVisible(false)}
        onConfirm={() => {
          setIsDeleteClientWarningVisible(false)
          setIsEditClientModalOpen(false)
          if (!client) return
          deleteClient(client.id)
          onBack()
        }}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5F8' },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24, gap: 24 },
  assignmentCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE0E2',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
  },
  assignmentTitle: { fontSize: 16, lineHeight: 22, color: '#2C111F' },
  assignmentList: { gap: 8 },
  assignmentEmptyText: { fontSize: 14, lineHeight: 20, color: '#7C6E76' },
  assignmentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  assignmentIdentity: { flex: 1, minWidth: 0 },
  assignmentName: { fontSize: 14, lineHeight: 20, color: '#2C111F' },
  assignmentEmail: { fontSize: 12, lineHeight: 16, color: '#7C6E76' },
  assignmentActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  assignmentButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D2D2D2',
    backgroundColor: '#F9FAFB',
    minHeight: 32,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignmentButtonHover: { backgroundColor: '#EEF2F7' },
  assignmentButtonText: { fontSize: 12, lineHeight: 16, color: '#2C111F' },
  assignmentDangerButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F1B5B5',
    backgroundColor: '#FFF6F6',
    minHeight: 32,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignmentDangerButtonHover: { backgroundColor: '#FDECEC' },
  assignmentDangerButtonText: { fontSize: 12, lineHeight: 16, color: '#B42318' },
  assignmentCreateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  assignmentSelectWrap: { flex: 1 },
  assignmentSelectButton: {
    minHeight: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DFE0E2',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  assignmentSelectButtonText: { fontSize: 13, lineHeight: 18, color: '#2C111F' },
  assignmentDropdown: {
    marginTop: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DFE0E2',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  assignmentDropdownOption: { paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F2F4' },
  assignmentAddButton: {
    minHeight: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BE0165',
    backgroundColor: '#BE0165',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignmentAddButtonHover: { backgroundColor: '#A50058', borderColor: '#A50058' },
  assignmentAddButtonText: { fontSize: 12, lineHeight: 16, color: '#FFFFFF' },
  assignmentHint: { fontSize: 12, lineHeight: 16, color: '#7C6E76' },
  mainRow: { flexDirection: 'row', gap: 24, minHeight: 640, alignItems: 'flex-start' },
  fullscreenModalOverlay: { width: '100%', maxWidth: 1080 },
  fullscreenModalCard: {
    width: '100%',
    height: '82vh',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE0E2',
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    ...({ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' } as any),
  },
  fullscreenModalCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  fullscreenModalCloseButtonHovered: { backgroundColor: '#F3F4F6' },
})



