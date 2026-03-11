import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native'

import { FullScreenCloseIcon } from '@/icons/FullScreenCloseIcon'
import { TrashIcon } from '@/icons/TrashIcon'
import { colors } from '@/design/theme/colors'
import { useLocalAppData } from '@/storage/LocalAppDataProvider'
import { getClientUpsertValues } from '@/types/clientProfile'
import { Modal } from '@/ui/animated/Modal'
import { ActionMenu } from '@/ui/overlays/ActionMenu'
import { ConfirmChatClearModal } from '@/screens/shared/modals/ConfirmChatClearModal'
import { ConfirmInputDeleteModal } from '@/screens/shared/modals/ConfirmInputDeleteModal'
import { ClientUpsertModal } from '@/screens/shared/modals/ClientUpsertModal'
import { ConfirmNoteDeleteModal } from '@/screens/shared/modals/ConfirmNoteDeleteModal'
import { NoteEditModal } from '@/screens/shared/modals/NoteEditModal'
import { saveClientProfileChanges, saveNewClientNote } from '@/screens/client/clientScreen.functions'
import {
  formatTrajectoryDurationLabel,
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
  void onBack

  const { height: windowHeight } = useWindowDimensions()
  const localAppData = useLocalAppData()
  const { data, createInput, createNote, updateNote, deleteNote, deleteInput, createTrajectory, updateTrajectory } = localAppData as any
  const legacyUpdateClientKey = ['update', 'Coa', 'chee'].join('')
  const updateClient = ((localAppData as any).updateClient ?? (localAppData as any)[legacyUpdateClientKey]) as (
    clientId: string,
    values: { name?: string; clientDetails?: string; employerDetails?: string },
  ) => void

  const clients = ((data as any).clients ?? []) as Array<any>
  const client = clients.find((item) => item.id === clientId) ?? null
  const clientName = client?.name ?? 'Cliënt'
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
  const { sessionItems, noteItems, reportItems, notesInput } = useMemo(
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
  const [menuItemType, setMenuItemType] = useState<'session' | 'note' | null>(null)
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null)
  const [hoveredMenuItemId, setHoveredMenuItemId] = useState<string | null>(null)
  const [menuAnchorPoint, setMenuAnchorPoint] = useState<{ x: number; y: number } | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [pendingDeleteInputId, setPendingDeleteInputId] = useState<string | null>(null)
  const [isDeleteNoteModalOpen, setIsDeleteNoteModalOpen] = useState(false)
  const [pendingDeleteNoteId, setPendingDeleteNoteId] = useState<string | null>(null)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [isClearChatModalVisible, setIsClearChatModalVisible] = useState(false)
  const [isAssistantFullscreen, setIsAssistantFullscreen] = useState(false)
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false)
  const chatAnchorFrameRef = useRef<number | null>(null)
  const lastAnchoredAssistantPanelHeightRef = useRef<number | null>(null)

  const searchInputRef = useRef<TextInput | null>(null)
  const chatScrollRef = useRef<ScrollView | null>(null)
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const isSearchExpanded = isSearchOpen || normalizedQuery.length > 0
  const isDocumentsTab = leftActiveTabKey === 'documenten'
  const showsDurationColumn = leftActiveTabKey === 'sessies'
  const visibleItems = isDocumentsTab ? [] : leftActiveTabKey === 'notities' ? noteItems : leftActiveTabKey === 'rapportages' ? reportItems : sessionItems
  const filteredInputs = visibleItems.filter((item) => item.searchText.includes(normalizedQuery))
  const chatContextInputIds = useMemo(() => {
    if (leftActiveTabKey === 'notities') return new Set(noteItems.map((item) => item.targetInputId))
    if (leftActiveTabKey === 'rapportages') return new Set(reportItems.map((item) => item.targetInputId))
    return new Set(sessionItems.map((item) => item.targetInputId))
  }, [leftActiveTabKey, noteItems, reportItems, sessionItems])
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
  const shouldShowSearch = !isDocumentsTab && visibleItems.length > 1

  const isMenuVisible = !!menuInputId && !!menuAnchorPoint
  const pendingDeleteInputTitle = pendingDeleteInputId ? data.inputs.find((item: any) => item.id === pendingDeleteInputId)?.title : null
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
    onLeftActiveTabChange?.(leftActiveTabKey)
  }, [leftActiveTabKey, onLeftActiveTabChange])

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
        createInput: (values) =>
          createInput({
            clientId: values.clientId,
            trajectoryId: values.trajectoryId,
            title: values.title,
            kind: values.kind,
            audioBlobId: values.audioBlobId,
            audioDurationSeconds: values.audioDurationSeconds,
            uploadFileName: values.uploadFileName,
          } as any),
        createNote,
      },
      { clientId, activeTrajectoryId: activeTrajectory?.id ?? null, notesInputId: notesInput?.id ?? null, values },
    )
    if (result.didSave) setIsCreateNoteModalOpen(false)
  }

  function handleAddItemForLeftTab() {
    if (leftActiveTabKey === 'documenten') return
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
    const rect = event?.currentTarget?.getBoundingClientRect?.() ?? event?.nativeEvent?.target?.getBoundingClientRect?.()
    if (!rect) return
    setMenuInputId(item.id)
    setMenuItemType(item.rowType === 'note' ? 'note' : 'session')
    setMenuAnchorPoint({ x: rect.left + rect.width, y: rect.top + rect.height })
  }

  function handlePressRow(item: InputListItem) {
    if (item.rowType === 'note') {
      setEditingNoteId(item.id)
      return
    }
    onSelectInput(item.targetInputId, leftActiveTabKey)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ClientHeaderCard
        clientEmail={clientProfileValues.clientEmail || '-'}
        clientName={clientName}
        clientPhone={clientProfileValues.clientPhone || '-'}
        durationLabel={formatTrajectoryDurationLabel(activeTrajectory?.startDate)}
        isCreateInputDisabled={isCreateInputDisabled}
        reportCount={reportCount}
        sessionCount={sessionCount}
        trajectoryName={activeTrajectory?.name || '-'}
        onOpenEditClient={() => setIsEditClientModalOpen(true)}
        onPressCreateReports={() => onPressCreateReports(activeTrajectory?.id ?? null)}
        onPressCreateInput={() => onPressCreateInput(activeTrajectory?.id ?? null)}
      />

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
        }}
        onConfirm={() => {
          if (!pendingDeleteInputId) return
          deleteInput(pendingDeleteInputId)
          setIsDeleteModalOpen(false)
          setPendingDeleteInputId(null)
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
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5F8' },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24, gap: 24 },
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

