import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'

import { AnimatedMainContent } from '../../ui/AnimatedMainContent'
import { AnimatedOverlayModal } from '../../ui/AnimatedOverlayModal'
import { CoacheeTabs, CoacheeTabKey } from './components/CoacheeTabs'
import { CoacheeUpsertModal } from '../../ui/coachees/CoacheeUpsertModal'
import { ClientPageAiChatIcon, ClientPageStatusIcon } from '../../icons/ClientPageSvgIcons'
import { CircleCloseIcon } from '../../icons/CircleCloseIcon'
import { FullScreenCloseIcon } from '../../icons/FullScreenCloseIcon'
import { MoreOptionsIcon } from '../../icons/MoreOptionsIcon'
import { FullScreenOpenIcon } from '../../icons/FullScreenOpenIcon'
import { PlusIcon } from '../../icons/PlusIcon'
import { StandaardVerslagIcon } from '../../icons/StandaardVerslagIcon'
import { TrashIcon } from '../../icons/TrashIcon'
import { PopoverMenu } from '../../ui/PopoverMenu'
import { ConfirmSessieDeleteModal } from '../../ui/sessies/ConfirmSessieDeleteModal'
import { ChatComposer } from '../session/components/ChatComposer'
import { ChatMessage } from '../session/components/ChatMessage'
import { ConfirmChatClearModal } from '../session/components/ConfirmChatClearModal'
import { QuickQuestionsStart } from '../session/components/QuickQuestionsStart'
import { NoteEditModal } from '../../ui/notes/NoteEditModal'
import { ConfirmNoteDeleteModal } from '../../ui/notes/ConfirmNoteDeleteModal'
import { Text } from '../../ui/Text'
import { saveCoacheeProfileChanges, saveNewCoacheeNote } from '../../hooks/coacheeDetail/coacheeDetailActions'
import {
  formatTrajectoryDurationLabel,
  getActiveTrajectory,
  getCoacheeTrajectories,
  getSessionListItems,
  type SessionListItem,
} from '../../hooks/coacheeDetail/coacheeDetailData'
import { useCoacheeDetailChatFlow } from '../../hooks/coacheeDetail/useCoacheeDetailChatFlow'
import { ExpandableSearchField } from '../../ui/inputs/ExpandableSearchField'
import { useLocalAppData } from '../../storage/LocalAppDataProvider'
import { colors } from '../../design/theme/colors'
import { typography } from '../../design/theme/typography'
import { webTransitionSmooth } from '../../design/theme/webTransitions'
import { getCoacheeUpsertValues } from '../../types/clientProfile'

type Props = {
  coacheeId: string
  onBack: () => void
  onSelectSession: (sessionId: string, sourceTab: CoacheeTabKey) => void
  onPressCreateSession: (trajectoryId: string | null) => void
  onPressCreateRapportage: (trajectoryId: string | null) => void
  onOpenMySubscription: () => void
  initialActiveTabKey?: CoacheeTabKey
  onActiveTabChange?: (tabKey: CoacheeTabKey) => void
  isCreateSessionDisabled?: boolean
}

export function ClientScreen({
  coacheeId,
  onBack,
  onSelectSession,
  onPressCreateSession,
  onPressCreateRapportage,
  onOpenMySubscription,
  initialActiveTabKey = 'sessies',
  onActiveTabChange,
  isCreateSessionDisabled = false,
}: Props) {
  void onBack
  const { data, createSession, createNote, updateNote, deleteNote, deleteSession, updateCoachee, createTrajectory, updateTrajectory } = useLocalAppData()
  const coachee = data.coachees.find((item) => item.id === coacheeId) ?? null
  const coacheeName = coachee?.name ?? 'Cliënt'
  const coacheeProfileValues = useMemo(() => getCoacheeUpsertValues(coachee), [coachee])
  const coacheeTrajectories = useMemo(() => getCoacheeTrajectories(data, coacheeId), [coacheeId, data])
  const coacheeTrajectoryOptions = useMemo(
    () =>
      coacheeTrajectories.map((trajectory) => ({
        id: trajectory.id,
        label: String(trajectory.name || '').trim() || 'Traject',
      })),
    [coacheeTrajectories],
  )
  const preferredTrajectoryId = String(coacheeProfileValues.trajectoryId || '').trim()
  const activeTrajectory = useMemo(() => getActiveTrajectory(coacheeTrajectories, preferredTrajectoryId), [coacheeTrajectories, preferredTrajectoryId])
  const { sessieItems, noteItems, rapportageItems, notesSession } = useMemo(() => getSessionListItems(data, coacheeId), [coacheeId, data])
  const sessionCount = sessieItems.length
  const reportCount = rapportageItems.length

  const [activeTabKey, setActiveTabKey] = useState<CoacheeTabKey>(initialActiveTabKey || 'sessies')
  const [assistantPanelTabKey, setAssistantPanelTabKey] = useState<'aiChat' | 'status'>('aiChat')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateNoteModalOpen, setIsCreateNoteModalOpen] = useState(false)
  const [menuSessionId, setMenuSessionId] = useState<string | null>(null)
  const [menuItemType, setMenuItemType] = useState<'session' | 'note' | null>(null)
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null)
  const [hoveredMenuItemId, setHoveredMenuItemId] = useState<string | null>(null)
  const [menuAnchorPoint, setMenuAnchorPoint] = useState<{ x: number; y: number } | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [pendingDeleteSessionId, setPendingDeleteSessionId] = useState<string | null>(null)
  const [isDeleteNoteModalOpen, setIsDeleteNoteModalOpen] = useState(false)
  const [pendingDeleteNoteId, setPendingDeleteNoteId] = useState<string | null>(null)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [isClearChatModalVisible, setIsClearChatModalVisible] = useState(false)
  const [isAssistantFullscreen, setIsAssistantFullscreen] = useState(false)
  const [isEditCoacheeModalOpen, setIsEditCoacheeModalOpen] = useState(false)

  const searchInputRef = useRef<TextInput | null>(null)
  const chatScrollRef = useRef<ScrollView | null>(null)
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const isSearchExpanded = isSearchOpen || normalizedQuery.length > 0
  const isDocumentsTab = activeTabKey === 'documenten'
  const showsDurationColumn = activeTabKey === 'sessies'
  const visibleItems = isDocumentsTab ? [] : activeTabKey === 'notities' ? noteItems : activeTabKey === 'rapportages' ? rapportageItems : sessieItems
  const filteredSessions = visibleItems.filter((item) => item.searchText.includes(normalizedQuery))
  const chatContextSessionIds = useMemo(() => {
    if (activeTabKey === 'notities') return new Set(noteItems.map((item) => item.targetSessionId))
    if (activeTabKey === 'rapportages') return new Set(rapportageItems.map((item) => item.targetSessionId))
    return new Set(sessieItems.map((item) => item.targetSessionId))
  }, [activeTabKey, noteItems, rapportageItems, sessieItems])
  const quickQuestionTemplates = useMemo(
    () => data.templates.map((template) => ({ id: template.id, name: template.name })),
    [data.templates],
  )
  const statusSummary = useMemo(() => {
    const latest = sessieItems[0] ?? null
    if (!latest) return `Nog geen sessies voor ${coacheeName}. Start met een eerste sessie om AI-status op te bouwen.`
    const latestDate = `${latest.dateLabel}${latest.timeLabel ? ` ${latest.timeLabel}` : ''}`
    return `Het traject loopt ${activeTrajectory?.name ? `binnen \"${activeTrajectory.name}\"` : 'zonder actief traject'}. Laatste sessie: \"${latest.title}\" op ${latestDate}. Tot nu toe: ${sessionCount} sessies en ${reportCount} rapportages. Volgende stap: vervolg op laatste actiepunten en status opnieuw evalueren.`
  }, [activeTrajectory?.name, coacheeName, reportCount, sessionCount, sessieItems])
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
  } = useCoacheeDetailChatFlow({
    activeTrajectoryName: activeTrajectory?.name ?? null,
    assistantPanelTabKey,
    chatContextSessionIds,
    chatScrollRef,
    coachee,
    coacheeId,
    coacheeName,
    onStatusFallbackText: statusSummary,
    reportCount,
    sessionCount,
    sessions: data.sessions,
    sessieItemsForStatus: sessieItems,
    writtenReports: data.writtenReports,
  })
  const searchPlaceholder =
    activeTabKey === 'documenten'
      ? 'Zoek documenten...'
      :
    activeTabKey === 'notities'
      ? 'Zoek notities...'
      : activeTabKey === 'rapportages'
        ? 'Zoek rapportages...'
        : 'Zoek sessies...'
  const shouldShowSearch = !isDocumentsTab && visibleItems.length > 1

  const isMenuVisible = !!menuSessionId && !!menuAnchorPoint
  const pendingDeleteSessionTitle = pendingDeleteSessionId ? data.sessions.find((item) => item.id === pendingDeleteSessionId)?.title : null
  const pendingDeleteNoteTitle = pendingDeleteNoteId ? data.notes.find((item) => item.id === pendingDeleteNoteId)?.title : null
  const editingNote = editingNoteId ? data.notes.find((item) => item.id === editingNoteId) ?? null : null
  const sessionsPanelTitle =
    activeTabKey === 'documenten'
      ? 'Documenten'
      : activeTabKey === 'notities'
      ? 'Notities'
      : activeTabKey === 'rapportages'
        ? 'Rapportages'
        : 'Recente sessies'
  const tableFirstColumnLabel = activeTabKey === 'documenten' ? 'Document' : activeTabKey === 'notities' ? 'Notitie' : activeTabKey === 'rapportages' ? 'Rapportage' : 'Sessie'
  useEffect(() => {
    setIsAssistantFullscreen(false)
  }, [coacheeId])

  useEffect(() => {
    setActiveTabKey(initialActiveTabKey || 'sessies')
    setAssistantPanelTabKey('aiChat')
    setIsSearchOpen(false)
    setSearchQuery('')
    setIsCreateNoteModalOpen(false)
    setEditingNoteId(null)
    setMenuSessionId(null)
    setMenuItemType(null)
    setMenuAnchorPoint(null)
    setHoveredItemId(null)
    setHoveredMenuItemId(null)
  }, [coacheeId, initialActiveTabKey])

  useEffect(() => {
    if (!isSearchOpen) return
    const id = setTimeout(() => searchInputRef.current?.focus(), 120)
    return () => clearTimeout(id)
  }, [activeTabKey, isSearchOpen])

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
    onActiveTabChange?.(activeTabKey)
  }, [activeTabKey, onActiveTabChange])

  function renderAiChatContent(isModal: boolean) {
    return (
      <View style={[styles.chatTab, isModal ? styles.chatTabModal : undefined]}>
        <View style={[styles.chatTopActions, isModal ? styles.chatTopActionsModal : undefined]}>
          {chatMessages.length > 0 ? (
            <Pressable onPress={() => setIsClearChatModalVisible(true)} style={({ hovered }) => [styles.chatTopTextAction, isModal ? styles.chatTopTextActionModal : undefined, hovered ? styles.chatTopTextActionHovered : undefined]}>
              <Text isSemibold style={styles.chatTopTextActionText}>Wissen</Text>
            </Pressable>
          ) : null}
          {!isModal ? (
            <Pressable onPress={() => setIsAssistantFullscreen((previous) => !previous)} style={({ hovered }) => [styles.chatTopIconAction, hovered ? styles.chatTopIconActionHovered : undefined]}>
              <FullScreenOpenIcon color="#2C111F" size={18} />
            </Pressable>
          ) : null}
        </View>
        <ScrollView ref={chatScrollRef} style={styles.chatArea} contentContainerStyle={chatMessages.length === 0 ? styles.chatAreaContentCentered : styles.chatAreaContent} showsVerticalScrollIndicator={false}>
          {chatMessages.length === 0 ? (
            <View style={styles.quickQuestionsWrap}>
              <QuickQuestionsStart
                templates={quickQuestionTemplates}
                onSelectOption={({ text, promptText }) => {
                  void sendChatMessage(promptText || text)
                }}
              />
            </View>
          ) : (
            <>
              {chatMessages.map((message) => <ChatMessage key={message.id} role={message.role} text={message.text} />)}
              {isChatSending ? <ChatMessage role="assistant" text="" isLoading /> : null}
            </>
          )}
        </ScrollView>

        {isChatMinutesBlocked && !isNoMinutesCtaDismissed ? (
          <View style={styles.noMinutesCtaContainer}>
            <Pressable onPress={() => setIsNoMinutesCtaDismissed(true)} style={({ hovered }) => [styles.noMinutesCtaCloseButton, hovered ? styles.noMinutesCtaCloseButtonHovered : undefined]} accessibilityRole="button" accessibilityLabel="Melding sluiten">
              <CircleCloseIcon size={18} color={colors.textSecondary} />
            </Pressable>
            <Text style={styles.noMinutesCtaText}>U heeft geen minuten meer.</Text>
            <Pressable onPress={onOpenMySubscription} style={({ hovered }) => [styles.noMinutesCtaButton, hovered ? styles.noMinutesCtaButtonHovered : undefined]}>
              <Text isBold style={styles.noMinutesCtaButtonText}>Mijn abonnement</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={[styles.chatBottom, isModal ? styles.chatBottomModal : undefined]}>
          <ChatComposer value={composerText} onChangeValue={setComposerText} onSend={handleSendChatMessage} compact={isModal} isSendDisabled={isChatSending || isCheckingChatMinutes || isChatMinutesBlocked || composerText.trim().length === 0} shouldAutoFocus={isModal} autoFocusKey={`${coacheeId}-${assistantPanelTabKey}-${isModal ? 'modal' : 'panel'}-${isAssistantFullscreen ? 'open' : 'closed'}`} />
        </View>
      </View>
    )
  }

  function handleSaveNewNote(values: { title: string; text: string }) {
    const result = saveNewCoacheeNote(
      { createSession, createNote },
      {
        coacheeId,
        activeTrajectoryId: activeTrajectory?.id ?? null,
        notesSessionId: notesSession?.id ?? null,
        values,
      },
    )
    if (result.didSave) setIsCreateNoteModalOpen(false)
  }

  function handleAddItemForActiveTab() {
    if (activeTabKey === 'documenten') return
    if (activeTabKey === 'notities') {
      setIsCreateNoteModalOpen(true)
      return
    }
    if (activeTabKey === 'rapportages') {
      onPressCreateRapportage(activeTrajectory?.id ?? null)
      return
    }
    onPressCreateSession(activeTrajectory?.id ?? null)
  }

  function openRowMenu(item: SessionListItem, event?: any) {
    const rect =
      event?.currentTarget?.getBoundingClientRect?.() ??
      event?.nativeEvent?.target?.getBoundingClientRect?.()
    if (!rect) return
    setMenuSessionId(item.id)
    setMenuItemType(item.rowType === 'note' ? 'note' : 'session')
    setMenuAnchorPoint({ x: rect.left + rect.width, y: rect.top + rect.height })
  }

  function handlePressRow(item: SessionListItem) {
    if (item.rowType === 'note') {
      setEditingNoteId(item.id)
      return
    }
    onSelectSession(item.targetSessionId, activeTabKey)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View>
        <View style={styles.profileCard}>
          <View style={styles.profileCardTopRow}>
            <View style={styles.profileIdentityRow}>
              <View style={styles.profileAvatarCircle}>
                <Image source={require('../../../assets/over_ons-Jonas.jpg')} style={styles.profileAvatarImage} resizeMode="cover" />
              </View>
              <View style={styles.profileTitleStack}>
                <View style={styles.profileNameRow}>
                  <Text isSemibold style={styles.profileName}>{coacheeName}</Text>
                  <Pressable
                    onPress={() => setIsEditCoacheeModalOpen(true)}
                    style={({ hovered }) => [styles.profileSettingsButton, hovered ? styles.profileSettingsButtonHovered : undefined]}
                  >
                    <MoreOptionsIcon color="#93858D" size={18} />
                  </Pressable>
                </View>
                <View style={styles.statusBadge}>
                  <View style={styles.statusBadgeDot} />
                  <Text isSemibold style={styles.statusBadgeText}>Actief</Text>
                </View>
              </View>
            </View>
            <View style={styles.profileActions}>
              <Pressable
                disabled={isCreateSessionDisabled}
                style={({ hovered }) => [styles.newSessionButton, webTransitionSmooth, isCreateSessionDisabled ? styles.newSessionButtonDisabled : undefined, hovered && !isCreateSessionDisabled ? styles.newSessionButtonHovered : undefined]}
                onPress={() => onPressCreateSession(activeTrajectory?.id ?? null)}
              >
                <PlusIcon color="#FFFFFF" size={22} />
                <Text numberOfLines={1} style={styles.newSessionButtonText}>Nieuwe input</Text>
              </Pressable>
              <Pressable style={({ hovered }) => [styles.newReportButton, hovered ? styles.newReportButtonHovered : undefined]} onPress={() => onPressCreateRapportage(activeTrajectory?.id ?? null)}>
                <View style={styles.newReportButtonIcon}>
                  <StandaardVerslagIcon color={colors.text} size={14} />
                </View>
                <Text numberOfLines={1} style={styles.newReportButtonText}>Nieuwe rapportage</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.profileMetaGrid}>
            <View style={styles.profileMetaItem}><Text style={styles.profileMetaLabel}>Email</Text><Text isSemibold style={styles.profileMetaValue}>{coacheeProfileValues.clientEmail || '-'}</Text></View>
            <View style={styles.profileMetaItem}><Text style={styles.profileMetaLabel}>Traject</Text><Text isSemibold style={styles.profileMetaValue}>{activeTrajectory?.name || '-'}</Text></View>
            <View style={styles.profileMetaItem}><Text style={styles.profileMetaLabel}>Sessies</Text><Text isSemibold style={styles.profileMetaValue}>{`${sessionCount} sessies`}</Text></View>
            <View style={styles.profileMetaItem}><Text style={styles.profileMetaLabel}>Looptijd</Text><Text isSemibold style={styles.profileMetaValue}>{formatTrajectoryDurationLabel(activeTrajectory?.startDate)}</Text></View>
            <View style={styles.profileMetaItem}><Text style={styles.profileMetaLabel}>Telefoon</Text><Text isSemibold style={styles.profileMetaValue}>{coacheeProfileValues.clientPhone || '-'}</Text></View>
            <View style={styles.profileMetaItem}><Text style={styles.profileMetaLabel}>Rapportages</Text><Text isSemibold style={styles.profileMetaValue}>{`${reportCount} rapportages`}</Text></View>
          </View>
        </View>

        <View style={styles.mainRow}>
          <View style={styles.leftColumn}>
            <View style={styles.tabsRow}>
              <View style={styles.tabsLeft}><CoacheeTabs activeTabKey={activeTabKey} onSelectTab={setActiveTabKey} /></View>
            </View>
            <View style={[styles.card, styles.bottomCardConnected]}>
              <AnimatedMainContent contentKey={`coachee-list-${activeTabKey}`}>
                <View style={styles.sessionsHeaderRow}>
                  <View style={styles.sessionsHeaderTitleWrap}>
                    <Text isSemibold style={styles.sessionsHeaderTitle}>{sessionsPanelTitle}</Text>
                    <Text style={styles.sessionsHeaderCount}>{`(${filteredSessions.length})`}</Text>
                  </View>
                  <View style={styles.sessionsHeaderActions}>
                    {shouldShowSearch ? (
                      <ExpandableSearchField
                        isExpanded={isSearchExpanded}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder={searchPlaceholder}
                        onExpand={() => setIsSearchOpen(true)}
                        onBlur={() => {
                          if (searchQuery.trim().length === 0) setIsSearchOpen(false)
                        }}
                        inputRef={searchInputRef}
                        collapsedLabel="Zoeken"
                        expandedWidth={220}
                        collapsedWidth={138}
                        containerStyle={styles.searchField}
                        inputStyle={styles.searchFieldInput}
                      />
                    ) : null}
                    {!isDocumentsTab ? (
                      <Pressable onPress={handleAddItemForActiveTab} style={({ hovered }) => [styles.quickAddButton, hovered ? styles.quickAddButtonHovered : undefined]}>
                        <PlusIcon color="#FFFFFF" size={18} />
                        <Text isSemibold style={styles.quickAddButtonText}>
                          {activeTabKey === 'notities' ? 'Nieuwe notitie' : activeTabKey === 'rapportages' ? 'Nieuwe rapportage' : 'Nieuwe sessie'}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>

                {isDocumentsTab ? (
                  <View style={styles.documentsPlaceholder}>
                    <Text style={styles.documentsPlaceholderText}>Documenten worden hier binnenkort toegevoegd.</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.tableHeaderText, styles.tableSessionCol]}>{tableFirstColumnLabel}</Text>
                      <Text style={[styles.tableHeaderText, styles.tableDateCol]}>Datum</Text>
                      {showsDurationColumn ? <Text style={[styles.tableHeaderText, styles.tableDurationCol]}>Duur</Text> : null}
                    </View>

                    <ScrollView style={styles.sessionsScroll} contentContainerStyle={styles.sessionsScrollContent} showsVerticalScrollIndicator={false}>
                      {filteredSessions.length === 0 ? (
                        <View style={styles.emptyTableState}>
                          <Text style={styles.emptySessionsText}>Geen items gevonden.</Text>
                        </View>
                      ) : null}
                      {filteredSessions.map((item) => (
                        <Pressable
                          key={item.id}
                          onPress={() => handlePressRow(item)}
                          accessibilityRole="button"
                          accessibilityLabel={
                            item.rowType === 'note'
                              ? `Open notitie ${item.title}`
                              : item.rowType === 'report'
                                ? `Open rapportage ${item.title}`
                                : `Open sessie ${item.title}`
                          }
                          onHoverIn={() => setHoveredItemId(item.id)}
                          onHoverOut={() => setHoveredItemId((previous) => (previous === item.id ? null : previous))}
                          style={({ hovered }) => [styles.tableRow, hovered ? styles.tableRowHovered : undefined]}
                        >
                          <View style={styles.tableSessionCol}>
                            <Text isSemibold style={styles.tableSessionTitle}>{item.title}</Text>
                            <Text style={styles.tableSessionSub}>{item.trajectoryLabel}</Text>
                          </View>
                          <View style={styles.tableDateCol}>
                            <Text style={styles.tableDateMain}>{item.dateLabel}</Text>
                            {!item.isReport ? <Text style={styles.tableDateSub}>{item.timeLabel}</Text> : null}
                          </View>
                          {showsDurationColumn ? (
                            <View style={styles.tableDurationCol}>
                              <Text style={styles.tableDurationText}>{item.durationLabel || '-'}</Text>
                            </View>
                          ) : null}
                          <Pressable
                            pointerEvents={hoveredItemId === item.id || hoveredMenuItemId === item.id || menuSessionId === item.id ? 'auto' : 'none'}
                            onHoverIn={() => setHoveredMenuItemId(item.id)}
                            onHoverOut={() => setHoveredMenuItemId((previous) => (previous === item.id ? null : previous))}
                            onPress={(event) => {
                              ;(event as any)?.stopPropagation?.()
                              openRowMenu(item, event)
                            }}
                            style={({ hovered }) => [styles.rowMenuButton, hoveredItemId === item.id || hoveredMenuItemId === item.id || menuSessionId === item.id ? undefined : styles.rowMenuButtonHidden, hovered ? styles.rowMenuButtonHovered : undefined]}
                          >
                            <MoreOptionsIcon color="#656565" size={18} />
                          </Pressable>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </>
                )}
              </AnimatedMainContent>
            </View>
          </View>

          <View style={styles.rightColumn}>
            <View style={styles.assistantTabsRow}>
              <Pressable
                onPress={() => setAssistantPanelTabKey('aiChat')}
                style={({ hovered }) => [
                  styles.assistantTabButton,
                  assistantPanelTabKey === 'aiChat' ? styles.assistantTabButtonSelected : styles.assistantTabButtonUnselected,
                  hovered
                    ? assistantPanelTabKey === 'aiChat'
                      ? styles.assistantTabButtonSelectedHovered
                      : styles.assistantTabButtonHovered
                    : undefined,
                ]}
              >
                <View style={styles.assistantTabButtonContent}>
                  <View style={styles.assistantStatusIconWrap}>
                    <ClientPageAiChatIcon color={assistantPanelTabKey === 'aiChat' ? colors.selected : '#2C111F'} size={14} />
                  </View>
                  <Text isSemibold style={[styles.assistantTabText, assistantPanelTabKey === 'aiChat' ? styles.assistantTabTextActive : undefined]}>AI-chat</Text>
                </View>
              </Pressable>
              <Pressable
                disabled
                onPress={() => undefined}
                style={({ hovered }) => [
                  styles.assistantTabButton,
                  styles.assistantTabButtonUnselected,
                  styles.assistantTabButtonDisabled,
                  hovered
                    ? styles.assistantTabButtonHovered
                    : undefined,
                ]}
              >
                <View style={styles.assistantTabButtonContent}>
                  <View style={styles.assistantStatusIconWrap}>
                    <ClientPageStatusIcon color={'#A1A1AA'} size={18} />
                  </View>
                  <Text isSemibold style={[styles.assistantTabText, styles.assistantTabTextDisabled]}>Status</Text>
                </View>
              </Pressable>
            </View>
            <View style={[styles.card, styles.bottomCardConnected]}>
              <AnimatedMainContent contentKey={`coachee-assistant-${assistantPanelTabKey}`}>
                {assistantPanelTabKey === 'status' ? (
                  <View style={styles.statusPanel}>
                    <Text style={styles.statusText}>{isStatusSummaryLoading ? 'Status wordt gegenereerd...' : statusSummaryAi}</Text>
                  </View>
                ) : (
                  renderAiChatContent(false)
                )}
              </AnimatedMainContent>
            </View>
          </View>
        </View>
      </View>

      <AnimatedOverlayModal visible={isAssistantFullscreen} onClose={() => setIsAssistantFullscreen(false)} contentContainerStyle={styles.fullscreenModalOverlay}>
        <View style={styles.fullscreenModalCard}>
          <Pressable onPress={() => setIsAssistantFullscreen(false)} style={({ hovered }) => [styles.fullscreenModalCloseButton, hovered ? styles.fullscreenModalCloseButtonHovered : undefined]}>
            <FullScreenCloseIcon size={18} color="#2C111F" />
          </Pressable>
          {renderAiChatContent(true)}
        </View>
      </AnimatedOverlayModal>

      <PopoverMenu
        visible={isMenuVisible}
        anchorPoint={menuAnchorPoint}
        placement="below"
        width={220}
        estimatedHeight={52}
        items={[{ key: 'delete', label: 'Verwijderen', icon: <TrashIcon color={colors.selected} size={18} />, isDanger: true, onPress: () => {
          if (!menuSessionId) return
          if (menuItemType === 'note') {
            setPendingDeleteNoteId(menuSessionId)
            setIsDeleteNoteModalOpen(true)
          } else {
            setPendingDeleteSessionId(menuSessionId)
            setIsDeleteModalOpen(true)
          }
          setMenuSessionId(null)
          setMenuItemType(null)
          setMenuAnchorPoint(null)
        } }]}
        onClose={() => {
          setMenuSessionId(null)
          setMenuItemType(null)
          setMenuAnchorPoint(null)
        }}
      />

      <ConfirmSessieDeleteModal visible={isDeleteModalOpen} sessieTitle={pendingDeleteSessionTitle} onClose={() => { setIsDeleteModalOpen(false); setPendingDeleteSessionId(null) }} onConfirm={() => {
        if (!pendingDeleteSessionId) return
        deleteSession(pendingDeleteSessionId)
        setIsDeleteModalOpen(false)
        setPendingDeleteSessionId(null)
      }} />
      <ConfirmNoteDeleteModal
        visible={isDeleteNoteModalOpen}
        noteText={pendingDeleteNoteTitle}
        onClose={() => { setIsDeleteNoteModalOpen(false); setPendingDeleteNoteId(null) }}
        onConfirm={() => {
          if (!pendingDeleteNoteId) return
          deleteNote(pendingDeleteNoteId)
          setIsDeleteNoteModalOpen(false)
          setPendingDeleteNoteId(null)
        }}
      />
      <ConfirmChatClearModal visible={isClearChatModalVisible} onClose={() => setIsClearChatModalVisible(false)} onConfirm={() => { setIsClearChatModalVisible(false); resetChat() }} />
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
      <CoacheeUpsertModal visible={isEditCoacheeModalOpen} mode="edit" initialValues={{
        ...coacheeProfileValues,
        trajectoryId: activeTrajectory?.id ?? '',
        orderNumber: String(activeTrajectory?.orderNumber || ''),
        uwvContactName: String(activeTrajectory?.uwvContactName || ''),
        firstSickDay: String(activeTrajectory?.startDate || coacheeProfileValues.firstSickDay || ''),
      }} trajectoryOptions={coacheeTrajectoryOptions} onClose={() => setIsEditCoacheeModalOpen(false)} onSave={(values) => {
        if (!coachee) return
        const result = saveCoacheeProfileChanges(
          { updateCoachee, updateTrajectory, createTrajectory },
          {
            coacheeId: coachee.id,
            activeTrajectory,
            values,
          },
        )
        if (result.didSave) setIsEditCoacheeModalOpen(false)
      }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5F8' },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24, gap: 22 },
  profileCard: { borderRadius: 12, borderWidth: 1, borderColor: '#DFE0E2', backgroundColor: '#FFFFFF', paddingHorizontal: 24, paddingVertical: 20, gap: 16, shadowColor: '#000000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, ...( { boxShadow: '0px 2px 8px 0px rgba(0,0,0,0.08)' } as any ) },
  profileCardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
  profileIdentityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, minWidth: 0, flex: 1 },
  profileAvatarCircle: { width: 88, height: 88, borderRadius: 44, borderWidth: 1, borderColor: '#DADBDD', backgroundColor: '#F6F6F6', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  profileAvatarImage: { width: '100%', height: '100%' },
  profileTitleStack: { minWidth: 0, gap: 6 },
  profileNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profileName: { fontSize: 32, lineHeight: 44, color: '#2C111F', flexShrink: 1 },
  profileSettingsButton: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', ...( { cursor: 'pointer' } as any ) },
  profileSettingsButtonHovered: { backgroundColor: '#F3F4F6' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, height: 20, borderRadius: 999, backgroundColor: '#C9FFD9', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  statusBadgeDot: { width: 4, height: 4, borderRadius: 999, backgroundColor: '#0C8043' },
  statusBadgeText: { fontSize: 12, lineHeight: 14, color: '#0C8043' },
  profileActions: { flexDirection: 'column', alignItems: 'stretch', gap: 12 },
  profileMetaGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 18, columnGap: 24, paddingLeft: 104 },
  profileMetaItem: { flexBasis: '30%', maxWidth: '30%', minWidth: 180 },
  profileMetaLabel: { fontSize: 16, lineHeight: 20, color: 'rgba(44,17,31,0.5)' },
  profileMetaValue: { marginTop: 4, fontSize: 16, lineHeight: 20, color: '#2C111F' },
  mainRow: { flexDirection: 'row', gap: 24, minHeight: 640, marginTop: 34, alignItems: 'stretch' },
  leftColumn: { flex: 1.65, minWidth: 0, minHeight: 640 },
  rightColumn: { flex: 1, minWidth: 420, minHeight: 640 },
  card: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: '#DFE0E2', backgroundColor: '#FFFFFF', gap: 0, minHeight: 0, overflow: 'hidden', shadowColor: '#000000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, ...( { boxShadow: '0px 2px 8px 0px rgba(0,0,0,0.08)' } as any ), zIndex: 1 },
  bottomCardConnected: { marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 12 },
  tabsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingLeft: 0, zIndex: 5, marginBottom: 0, position: 'relative' },
  tabsLeft: { flex: 1 },
  sessionsHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: 24, paddingVertical: 20 },
  sessionsHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 0 },
  sessionsHeaderTitleWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  sessionsHeaderTitle: { fontSize: 24, lineHeight: 34, color: '#2C111F' },
  sessionsHeaderCount: { fontSize: 16, lineHeight: 20, color: 'rgba(44,17,31,0.5)', fontFamily: typography.fontFamilyRegular },
  searchField: { backgroundColor: '#F9FAFB', borderColor: '#DFE0E2' },
  searchFieldInput: { fontFamily: typography.fontFamilyMedium, color: '#656565' },
  quickAddButton: { height: 40, borderRadius: 8, backgroundColor: colors.selected, borderWidth: 1, borderColor: colors.selected, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  quickAddButtonHovered: { backgroundColor: '#A50058', borderColor: '#A50058' },
  quickAddButtonText: { fontSize: 14, lineHeight: 18, color: '#FFFFFF' },
  tableHeaderRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#DFE0E2', paddingVertical: 16, paddingHorizontal: 24, backgroundColor: '#F9FAFB' },
  tableHeaderText: { fontSize: 16, lineHeight: 20, color: 'rgba(44,17,31,0.5)' },
  tableSessionCol: { flex: 1.45, minWidth: 0 },
  tableDateCol: { width: 170 },
  tableDurationCol: { width: 90 },
  tableRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#DFE0E2', paddingVertical: 14, paddingHorizontal: 24, position: 'relative', ...( { cursor: 'pointer' } as any ) },
  tableRowHovered: { backgroundColor: '#FAFAFA' },
  tableSessionTitle: { fontSize: 16, lineHeight: 20, color: '#2C111F', paddingRight: 8 },
  tableSessionSub: { marginTop: 4, fontSize: 14, lineHeight: 18, color: 'rgba(44,17,31,0.5)' },
  tableDateMain: { fontSize: 14, lineHeight: 16, color: 'rgba(44,17,31,0.5)', fontFamily: typography.fontFamilySemibold },
  tableDateSub: { marginTop: 2, fontSize: 14, lineHeight: 16, color: 'rgba(44,17,31,0.5)' },
  tableDurationText: { fontSize: 14, lineHeight: 16, color: 'rgba(44,17,31,0.5)' },
  rowMenuButton: {
    position: 'absolute',
    right: 8,
    top: '50%',
    marginTop: -17,
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowMenuButtonHidden: { opacity: 0 },
  rowMenuButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  newSessionButton: { minWidth: 203, height: 40, borderRadius: 8, backgroundColor: colors.selected, borderWidth: 1, borderColor: colors.selected, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  newSessionButtonHovered: { backgroundColor: '#A50058' },
  newSessionButtonDisabled: { backgroundColor: '#C6C6C6', borderColor: '#C6C6C6' },
  newSessionButtonText: { fontSize: 16, lineHeight: 20, color: '#FFFFFF' },
  newReportButton: { minWidth: 204, height: 40, borderRadius: 8, borderWidth: 1, borderColor: '#D2D2D2', backgroundColor: '#F9FAFB', paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  newReportButtonIcon: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  newReportButtonHovered: { backgroundColor: colors.hoverBackground },
  newReportButtonText: { fontSize: 16, lineHeight: 20, color: '#2C111F' },
  sessionsScroll: { flex: 1 },
  sessionsScrollContent: { gap: 0, paddingBottom: 0 },
  sessionsListItem: { width: '100%' },
  emptyTableState: { paddingVertical: 24, alignItems: 'center', justifyContent: 'center' },
  documentsPlaceholder: { borderTopWidth: 1, borderTopColor: '#DFE0E2', paddingHorizontal: 24, paddingVertical: 28 },
  documentsPlaceholderText: { fontSize: 15, lineHeight: 22, color: 'rgba(44,17,31,0.6)' },
  assistantTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    zIndex: 5,
    marginBottom: 0,
    position: 'relative',
    ...( { overflowX: 'auto', overflowY: 'hidden' } as any ),
    ...( { scrollbarWidth: 'none' } as any ),
    ...( { msOverflowStyle: 'none' } as any ),
  },
  assistantTabButton: {
    height: 48,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    top: 1,
    position: 'relative',
  },
  assistantTabButtonSelected: { backgroundColor: '#FFFFFF', borderColor: '#DFE0E2', borderBottomWidth: 1, borderBottomColor: '#FFFFFF' },
  assistantTabButtonSelectedHovered: { backgroundColor: '#FAFAFA', borderColor: '#DFE0E2' },
  assistantTabButtonUnselected: { backgroundColor: '#FFFFFF', borderColor: '#DFE0E2' },
  assistantTabButtonDisabled: { opacity: 0.6 },
  assistantTabButtonHovered: { backgroundColor: colors.hoverBackground },
  assistantTabButtonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  assistantStatusIconWrap: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  assistantTabText: { fontSize: 16, lineHeight: 20, color: '#2C111F', fontFamily: typography.fontFamilySemibold },
  assistantTabTextActive: { color: colors.selected },
  assistantTabTextDisabled: { color: '#A1A1AA' },
  statusPanel: { flex: 1, margin: 12, padding: 14 },
  statusText: { fontSize: 14, lineHeight: 20, color: '#2C111F' },
  emptySessionsContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  emptySessionsText: { fontSize: 14, lineHeight: 20, color: colors.textSecondary, textAlign: 'center' },
  emptyPrimaryButton: { height: 40, borderRadius: 10, backgroundColor: 'transparent', paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  emptyPrimaryButtonHovered: { backgroundColor: colors.hoverBackground },
  emptyPrimaryButtonDisabled: { opacity: 0.5 },
  emptyPrimaryButtonText: { fontSize: 15, lineHeight: 18, color: colors.selected },
  chatTab: { flex: 1, gap: 10, position: 'relative', marginTop: 0, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10 },
  chatTabModal: { minHeight: 540, paddingTop: 8, paddingBottom: 12, borderTopWidth: 0, borderTopColor: 'transparent' },
  chatTopActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12, paddingHorizontal: 4, paddingBottom: 2 },
  chatTopActionsModal: { minHeight: 28, paddingRight: 40, marginTop: 0, paddingBottom: 0, alignItems: 'center' },
  chatTopTextAction: { height: 28, justifyContent: 'center', alignItems: 'center' },
  chatTopTextActionModal: { marginTop: -3 },
  chatTopTextActionHovered: { opacity: 0.7 },
  chatTopTextActionText: { fontSize: 14, lineHeight: 16, color: '#2C111F' },
  chatTopIconAction: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  chatTopIconActionHovered: { backgroundColor: colors.hoverBackground },
  chatArea: { flex: 1 },
  chatAreaContent: { gap: 12, paddingBottom: 8 },
  chatAreaContentCentered: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 8 },
  chatBottom: { width: '100%', gap: 8, paddingTop: 8, paddingBottom: 2 },
  chatBottomModal: { marginTop: 8, paddingTop: 8, paddingBottom: 4 },
  quickQuestionsWrap: { width: '100%', minHeight: 220, alignItems: 'center', justifyContent: 'center' },
  noMinutesCtaContainer: { position: 'absolute', left: 0, right: 0, bottom: 82, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: '#FFFFFF', padding: 12, paddingRight: 36, gap: 10, zIndex: 2 },
  noMinutesCtaCloseButton: { position: 'absolute', right: 8, top: 8, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  noMinutesCtaCloseButtonHovered: { backgroundColor: colors.hoverBackground },
  noMinutesCtaText: { fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  noMinutesCtaButton: { alignSelf: 'flex-start', height: 36, borderRadius: 10, backgroundColor: colors.selected, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  noMinutesCtaButtonHovered: { backgroundColor: '#A50058' },
  noMinutesCtaButtonText: { fontSize: 13, lineHeight: 16, color: '#FFFFFF' },
  chatActionButton: { height: 32, borderRadius: 10, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  chatActionButtonHovered: { backgroundColor: colors.hoverBackground },
  chatActionText: { fontSize: 13, lineHeight: 16, color: colors.textSecondary },
  fullscreenModalOverlay: { width: '100%', maxWidth: 1080 },
  fullscreenModalCard: { width: '100%', height: '82vh', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#DFE0E2', paddingTop: 12, paddingHorizontal: 12, paddingBottom: 12, shadowColor: '#000000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, ...( { boxShadow: '0px 2px 8px 0px rgba(0,0,0,0.08)' } as any ) },
  fullscreenModalCloseButton: { position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  fullscreenModalCloseButtonHovered: { backgroundColor: colors.hoverBackground },
})











