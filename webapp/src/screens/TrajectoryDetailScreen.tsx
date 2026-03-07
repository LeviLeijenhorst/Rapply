import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'

import { AnimatedDropdownPanel } from '../ui/AnimatedDropdownPanel'
import { AnimatedMainContent } from '../ui/AnimatedMainContent'
import { AnimatedOverlayModal } from '../ui/AnimatedOverlayModal'
import { EmptyPageMessage } from '../ui/EmptyPageMessage'
import { PopoverMenu } from '../ui/PopoverMenu'
import { Text } from '../ui/Text'
import { WebPortal } from '../ui/WebPortal'
import { ChevronDownIcon } from '../icons/ChevronDownIcon'
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon'
import { PlusIcon } from '../icons/PlusIcon'
import { SessiesIcon } from '../icons/SessiesIcon'
import { SnelleVragenIcon } from '../icons/SnelleVragenIcon'
import { StandaardVerslagIcon } from '../icons/StandaardVerslagIcon'
import { TrashIcon } from '../icons/TrashIcon'
import { SessieListItemCard } from '../components/sessies/SessieListItemCard'
import { features } from '../config/features'
import { useLocalAppData } from '../local/LocalAppDataProvider'
import { colors } from '../design/theme/colors'
import { isSessionNotesArtifact, isSessionReportArtifact } from '../utils/sessionArtifacts'

type TabKey = 'items' | 'activities' | 'reports'

type Props = {
  coacheeId: string
  trajectoryId: string
  onBack: () => void
  onSelectSession: (sessionId: string) => void
  onPressCreateSession: (trajectoryId: string) => void
  onPressCreateRapportage: (trajectoryId: string) => void
}

const activityCategoryOptions = [
  'Versterken werknemersvaardigheden',
  'Verbeteren persoonlijke effectiviteit',
  'In beeld brengen arbeidsmarktpositie',
]

function isRapportageSession(session: { kind: string; title: string }): boolean {
  // "written" sessions can represent multiple written artifacts.
  // In this screen, we classify only explicit rapportage titles as report list entries.
  if (!isSessionReportArtifact(session)) return false
  return session.title.trim().toLowerCase().includes('rapportage')
}

function formatDurationLabel(durationSeconds: number | null): string {
  if (!Number.isFinite(durationSeconds) || durationSeconds === null || durationSeconds <= 0) return ''
  const roundedSeconds = Math.max(0, Math.round(durationSeconds))
  const hours = Math.floor(roundedSeconds / 3600)
  const minutes = Math.floor((roundedSeconds % 3600) / 60)
  const seconds = roundedSeconds % 60
  const paddedMinutes = String(minutes).padStart(hours > 0 ? 2 : 1, '0')
  const paddedSeconds = String(seconds).padStart(2, '0')
  return hours > 0 ? `${hours}:${paddedMinutes}:${paddedSeconds}` : `${minutes}:${paddedSeconds}`
}

export function TrajectoryDetailScreen({ coacheeId, trajectoryId, onBack, onSelectSession, onPressCreateSession, onPressCreateRapportage }: Props) {
  const { data, createActivity, updateActivity, deleteActivity, deleteSession, updateTrajectory } = useLocalAppData()
  const [activeTabKey, setActiveTabKey] = useState<TabKey>('items')
  const [menuSessionId, setMenuSessionId] = useState<string | null>(null)
  const [menuAnchorPoint, setMenuAnchorPoint] = useState<{ x: number; y: number } | null>(null)
  const [isTitleEditorOpen, setIsTitleEditorOpen] = useState(false)
  const [editableTrajectoryTitle, setEditableTrajectoryTitle] = useState('')
  const [titleMenuPosition, setTitleMenuPosition] = useState<{ left: number; top: number; width: number } | null>(null)
  const backTitleButtonRef = useRef<any>(null)
  const titleEditorPanelRef = useRef<View | null>(null)
  const titleInputRef = useRef<TextInput | null>(null)

  const [isCreateActivityModalVisible, setIsCreateActivityModalVisible] = useState(false)
  const [newActivityName, setNewActivityName] = useState('Nieuwe activiteit')
  const [newActivityCategory, setNewActivityCategory] = useState(activityCategoryOptions[0])
  const [isCreateActivityCategoryOpen, setIsCreateActivityCategoryOpen] = useState(false)

  const [editingActivityId, setEditingActivityId] = useState<string | null>(null)
  const [editActivityName, setEditActivityName] = useState('')
  const [editActivityCategory, setEditActivityCategory] = useState(activityCategoryOptions[0])
  const [isEditActivityCategoryOpen, setIsEditActivityCategoryOpen] = useState(false)

  const trajectory = data.trajectories.find((item) => item.id === trajectoryId && item.coacheeId === coacheeId) ?? null
  const sessionsForTrajectory = useMemo(
    () => data.sessions.filter((session) => session.trajectoryId === trajectoryId && !isSessionNotesArtifact(session)),
    [data.sessions, trajectoryId],
  )
  const itemSessions = useMemo(
    () => sessionsForTrajectory.filter((session) => !isRapportageSession(session)).sort((a, b) => b.createdAtUnixMs - a.createdAtUnixMs),
    [sessionsForTrajectory],
  )
  const reportSessions = useMemo(
    () => sessionsForTrajectory.filter((session) => isRapportageSession(session)).sort((a, b) => b.createdAtUnixMs - a.createdAtUnixMs),
    [sessionsForTrajectory],
  )
  const trajectoryActivities = useMemo(
    () => data.activities.filter((activity) => activity.trajectoryId === trajectoryId).sort((a, b) => b.createdAtUnixMs - a.createdAtUnixMs),
    [data.activities, trajectoryId],
  )

  useEffect(() => {
    if (!trajectory) return
    setEditableTrajectoryTitle(trajectory.name)
  }, [trajectory?.id, trajectory?.name])

  if (!trajectory) {
    return <EmptyPageMessage message="Dit traject bestaat niet meer." onGoHome={() => undefined} />
  }

  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any

  function applyTrajectoryTitle(nextTitle: string) {
    if (!trajectory) return
    const safeName = nextTitle.trim() || trajectory.name
    if (safeName !== trajectory.name) updateTrajectory(trajectory.id, { name: safeName })
    setEditableTrajectoryTitle(safeName)
  }

  function updateTitleMenuAnchor() {
    if (typeof window === 'undefined') return
    const rect = backTitleButtonRef.current?.getBoundingClientRect?.()
    if (!rect) return
    setTitleMenuPosition({
      left: rect.left + window.scrollX,
      top: rect.bottom + window.scrollY + 8,
      width: Math.max(280, Math.round(rect.width)),
    })
  }

  useEffect(() => {
    if (!isTitleEditorOpen) return
    if (typeof window === 'undefined') return
    updateTitleMenuAnchor()
    const id = setTimeout(() => titleInputRef.current?.focus(), 20)

    const pointInRect = (x: number, y: number, rect: DOMRect | null | undefined) => {
      if (!rect) return false
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
    }

    const closeIfOutside = (clientX: number, clientY: number) => {
      const panelRect = (titleEditorPanelRef.current as any)?.getBoundingClientRect?.() as DOMRect | undefined
      const targetRect = backTitleButtonRef.current?.getBoundingClientRect?.() as DOMRect | undefined
      const connectorRect = panelRect && targetRect
        ? {
            left: Math.min(targetRect.left, panelRect.left),
            right: Math.max(targetRect.right, panelRect.right),
            top: Math.min(targetRect.bottom, panelRect.top),
            bottom: Math.max(targetRect.bottom, panelRect.top),
          }
        : null
      if (pointInRect(clientX, clientY, panelRect) || pointInRect(clientX, clientY, targetRect) || pointInRect(clientX, clientY, connectorRect as any)) return
      applyTrajectoryTitle(editableTrajectoryTitle)
      setIsTitleEditorOpen(false)
    }

    const onResizeOrScroll = () => updateTitleMenuAnchor()
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const touch = 'touches' in event ? event.touches[0] ?? event.changedTouches[0] : null
      const clientX = touch ? touch.clientX : (event as MouseEvent).clientX
      const clientY = touch ? touch.clientY : (event as MouseEvent).clientY
      if (typeof clientX !== 'number' || typeof clientY !== 'number') return
      closeIfOutside(clientX, clientY)
    }
    const onMouseMove = (event: MouseEvent) => closeIfOutside(event.clientX, event.clientY)

    window.addEventListener('resize', onResizeOrScroll)
    window.addEventListener('scroll', onResizeOrScroll, true)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('touchstart', onPointerDown, { passive: true })
    return () => {
      clearTimeout(id)
      window.removeEventListener('resize', onResizeOrScroll)
      window.removeEventListener('scroll', onResizeOrScroll, true)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('touchstart', onPointerDown)
    }
  }, [editableTrajectoryTitle, isTitleEditorOpen])

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View style={styles.leftHeader}>
          <Pressable
            ref={backTitleButtonRef}
            onPress={onBack}
            onHoverIn={() => {
              updateTitleMenuAnchor()
              setIsTitleEditorOpen(true)
            }}
            style={({ hovered }) => [styles.backTitleButton, hovered ? styles.backTitleButtonHovered : undefined]}
          >
            <ChevronLeftIcon color={colors.text} size={24} />
            <Text isSemibold style={styles.sessionTitle} numberOfLines={1}>
              {editableTrajectoryTitle || trajectory.name}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.headerRow}>
        <View style={styles.tabsRow}>
          <TabButton
            label="Items"
            isSelected={activeTabKey === 'items'}
            icon={(color) => <SessiesIcon color={color} size={24} />}
            onPress={() => setActiveTabKey('items')}
          />
          {features.activities ? (
            <TabButton
              label="Activiteiten"
              isSelected={activeTabKey === 'activities'}
              icon={(color) => <SnelleVragenIcon color={color} size={24} />}
              onPress={() => setActiveTabKey('activities')}
            />
          ) : null}
          <TabButton
            label="Rapportages"
            isSelected={activeTabKey === 'reports'}
            icon={(color) => <StandaardVerslagIcon color={color} size={24} />}
            onPress={() => setActiveTabKey('reports')}
          />
        </View>

        {activeTabKey === 'items' ? (
          <Pressable onPress={() => onPressCreateSession(trajectory.id)} style={({ hovered }) => [styles.addButton, hovered ? styles.addButtonHovered : undefined]}>
            <PlusIcon color="#FFFFFF" size={22} />
            <Text style={styles.addButtonText}>Nieuw item</Text>
          </Pressable>
        ) : null}
        {activeTabKey === 'reports' ? (
          <Pressable onPress={() => onPressCreateRapportage(trajectory.id)} style={({ hovered }) => [styles.addButton, hovered ? styles.addButtonHovered : undefined]}>
            <PlusIcon color="#FFFFFF" size={22} />
            <Text style={styles.addButtonText}>Nieuwe rapportage</Text>
          </Pressable>
        ) : null}
        {features.activities && activeTabKey === 'activities' ? (
          <Pressable
            onPress={() => {
              setNewActivityName('Nieuwe activiteit')
              setNewActivityCategory(activityCategoryOptions[0])
              setIsCreateActivityCategoryOpen(false)
              setIsCreateActivityModalVisible(true)
            }}
            style={({ hovered }) => [styles.addButton, hovered ? styles.addButtonHovered : undefined]}
          >
            <PlusIcon color="#FFFFFF" size={22} />
            <Text style={styles.addButtonText}>Activiteit toevoegen</Text>
          </Pressable>
        ) : null}
      </View>

      <AnimatedMainContent key={activeTabKey} contentKey={activeTabKey} style={styles.content}>
        {activeTabKey === 'items' ? (
          <ScrollView style={styles.listScroll} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {itemSessions.length === 0 ? (
              <View style={styles.emptyState}><Text style={styles.emptyText}>Nog geen items in dit traject.</Text></View>
            ) : null}
            {itemSessions.map((item) => (
              <View key={item.id} style={styles.listItem}>
                <SessieListItemCard
                  title={item.title}
                  dateLabel={new Date(item.createdAtUnixMs).toLocaleDateString('nl-NL', { month: 'short', day: 'numeric', year: 'numeric' })}
                  timeLabel={new Date(item.createdAtUnixMs).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                  durationLabel={formatDurationLabel(item.audioDurationSeconds)}
                  isReport={isSessionReportArtifact(item)}
                  transcriptionStatus={item.transcriptionStatus}
                  showCoachee={false}
                  onPress={() => onSelectSession(item.id)}
                  onPressMore={(anchorPoint) => {
                    setMenuSessionId(item.id)
                    setMenuAnchorPoint(anchorPoint)
                  }}
                />
              </View>
            ))}
          </ScrollView>
        ) : null}

        {activeTabKey === 'reports' ? (
          <ScrollView style={styles.listScroll} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {reportSessions.length === 0 ? (
              <View style={styles.emptyState}><Text style={styles.emptyText}>Nog geen rapportages in dit traject.</Text></View>
            ) : null}
            {reportSessions.map((item) => (
              <View key={item.id} style={styles.listItem}>
                <SessieListItemCard
                  title={item.title}
                  dateLabel={new Date(item.createdAtUnixMs).toLocaleDateString('nl-NL', { month: 'short', day: 'numeric', year: 'numeric' })}
                  timeLabel={new Date(item.createdAtUnixMs).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                  durationLabel={formatDurationLabel(item.audioDurationSeconds)}
                  isReport
                  transcriptionStatus={item.transcriptionStatus}
                  showCoachee={false}
                  onPress={() => onSelectSession(item.id)}
                  onPressMore={(anchorPoint) => {
                    setMenuSessionId(item.id)
                    setMenuAnchorPoint(anchorPoint)
                  }}
                />
              </View>
            ))}
          </ScrollView>
        ) : null}

        {features.activities && activeTabKey === 'activities' ? (
          <ScrollView style={styles.listScroll} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {trajectoryActivities.length === 0 ? (
              <View style={styles.emptyState}><Text style={styles.emptyText}>Nog geen activiteiten in dit traject.</Text></View>
            ) : null}
            {trajectoryActivities.map((activity) => (
              <Pressable
                key={activity.id}
                onPress={() => {
                  setEditingActivityId(activity.id)
                  setEditActivityName(activity.name)
                  setEditActivityCategory(activity.category || activityCategoryOptions[0])
                  setIsEditActivityCategoryOpen(false)
                }}
                style={({ hovered }) => [styles.activityCard, hovered ? styles.activityCardHovered : undefined]}
              >
                <View style={styles.activityLeft}>
                  <Text isSemibold style={styles.activityName}>{activity.name}</Text>
                  <Text style={styles.activityMeta}>{activity.status === 'planned' ? 'Gepland' : 'Uitgevoerd'}</Text>
                </View>
                <Text style={styles.activityMeta}>{activity.category}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
      </AnimatedMainContent>

      <PopoverMenu
        visible={Boolean(menuSessionId) && Boolean(menuAnchorPoint)}
        anchorPoint={menuAnchorPoint}
        placement="below"
        width={220}
        estimatedHeight={44}
        items={[
          {
            key: 'delete',
            label: 'Verwijderen',
            icon: <TrashIcon color={colors.selected} size={18} />,
            isDanger: true,
            onPress: () => {
              if (!menuSessionId) return
              deleteSession(menuSessionId)
              setMenuSessionId(null)
              setMenuAnchorPoint(null)
            },
          },
        ]}
        onClose={() => {
          setMenuSessionId(null)
          setMenuAnchorPoint(null)
        }}
      />

      <AnimatedOverlayModal
        visible={isCreateActivityModalVisible}
        onClose={() => {
          setIsCreateActivityCategoryOpen(false)
          setIsCreateActivityModalVisible(false)
        }}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <Text isSemibold style={styles.modalTitle}>Activiteit toevoegen</Text>
          <TextInput
            value={newActivityName}
            onChangeText={setNewActivityName}
            placeholder="Naam"
            placeholderTextColor="#818181"
            style={[styles.modalInput, inputWebStyle]}
          />
          <View style={[styles.modalMenuArea, isCreateActivityCategoryOpen ? styles.modalMenuAreaRaised : undefined]}>
            <Pressable
              onPress={() => setIsCreateActivityCategoryOpen((value) => !value)}
              style={({ hovered }) => [styles.modalFieldRow, hovered ? styles.modalFieldRowHovered : undefined]}
            >
              <Text style={styles.modalDropdownText}>{newActivityCategory}</Text>
              <View style={styles.modalDropdownSpacer} />
              <ChevronDownIcon color="#656565" size={18} />
            </Pressable>
            <AnimatedDropdownPanel visible={isCreateActivityCategoryOpen} style={styles.modalMenuPanel}>
              <ScrollView style={styles.modalMenuScroll} contentContainerStyle={styles.modalMenuContent} showsVerticalScrollIndicator={false}>
                {activityCategoryOptions.map((option, index) => (
                  <Pressable
                    key={option}
                    onPress={() => {
                      setNewActivityCategory(option)
                      setIsCreateActivityCategoryOpen(false)
                    }}
                    style={({ hovered }) => [
                      styles.modalMenuItem,
                      index === 0 ? styles.modalMenuItemTop : undefined,
                      hovered ? styles.modalMenuItemHovered : undefined,
                    ]}
                  >
                    <Text style={styles.modalMenuItemText}>{option}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </AnimatedDropdownPanel>
          </View>
          <View style={styles.modalActions}>
            <Pressable
              onPress={() => {
                setIsCreateActivityCategoryOpen(false)
                setIsCreateActivityModalVisible(false)
              }}
              style={({ hovered }) => [styles.secondaryButton, hovered ? styles.secondaryButtonHovered : undefined]}
            >
              <Text isBold style={styles.secondaryButtonText}>Annuleren</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                createActivity({
                  trajectoryId: trajectory.id,
                  templateId: null,
                  sessionId: null,
                  name: newActivityName.trim() || 'Nieuwe activiteit',
                  category: newActivityCategory,
                  status: 'planned',
                  plannedHours: null,
                  actualHours: null,
                  source: 'manual',
                  isAdmin: false,
                })
                setIsCreateActivityCategoryOpen(false)
                setIsCreateActivityModalVisible(false)
              }}
              style={({ hovered }) => [styles.primaryButton, hovered ? styles.primaryButtonHovered : undefined]}
            >
              <Text isBold style={styles.primaryButtonText}>Aanmaken</Text>
            </Pressable>
          </View>
        </View>
      </AnimatedOverlayModal>

      <AnimatedOverlayModal
        visible={Boolean(editingActivityId)}
        onClose={() => {
          setIsEditActivityCategoryOpen(false)
          setEditingActivityId(null)
        }}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <Text isSemibold style={styles.modalTitle}>Activiteit bewerken</Text>
          <TextInput
            value={editActivityName}
            onChangeText={setEditActivityName}
            placeholder="Naam"
            placeholderTextColor="#818181"
            style={[styles.modalInput, inputWebStyle]}
          />
          <View style={[styles.modalMenuArea, isEditActivityCategoryOpen ? styles.modalMenuAreaRaised : undefined]}>
            <Pressable
              onPress={() => setIsEditActivityCategoryOpen((value) => !value)}
              style={({ hovered }) => [styles.modalFieldRow, hovered ? styles.modalFieldRowHovered : undefined]}
            >
              <Text style={styles.modalDropdownText}>{editActivityCategory}</Text>
              <View style={styles.modalDropdownSpacer} />
              <ChevronDownIcon color="#656565" size={18} />
            </Pressable>
            <AnimatedDropdownPanel visible={isEditActivityCategoryOpen} style={styles.modalMenuPanel}>
              <ScrollView style={styles.modalMenuScroll} contentContainerStyle={styles.modalMenuContent} showsVerticalScrollIndicator={false}>
                {activityCategoryOptions.map((option, index) => (
                  <Pressable
                    key={option}
                    onPress={() => {
                      setEditActivityCategory(option)
                      setIsEditActivityCategoryOpen(false)
                    }}
                    style={({ hovered }) => [
                      styles.modalMenuItem,
                      index === 0 ? styles.modalMenuItemTop : undefined,
                      hovered ? styles.modalMenuItemHovered : undefined,
                    ]}
                  >
                    <Text style={styles.modalMenuItemText}>{option}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </AnimatedDropdownPanel>
          </View>
          <View style={styles.modalActions}>
            <Pressable
              onPress={() => {
                if (!editingActivityId) return
                deleteActivity(editingActivityId)
                setIsEditActivityCategoryOpen(false)
                setEditingActivityId(null)
              }}
              style={({ hovered }) => [styles.dangerButton, hovered ? styles.dangerButtonHovered : undefined]}
            >
              <Text isBold style={styles.dangerButtonText}>Verwijderen</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setIsEditActivityCategoryOpen(false)
                setEditingActivityId(null)
              }}
              style={({ hovered }) => [styles.secondaryButton, hovered ? styles.secondaryButtonHovered : undefined]}
            >
              <Text isBold style={styles.secondaryButtonText}>Annuleren</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (!editingActivityId) return
                updateActivity(editingActivityId, {
                  name: editActivityName.trim() || 'Nieuwe activiteit',
                  category: editActivityCategory,
                })
                setIsEditActivityCategoryOpen(false)
                setEditingActivityId(null)
              }}
              style={({ hovered }) => [styles.primaryButton, hovered ? styles.primaryButtonHovered : undefined]}
            >
              <Text isBold style={styles.primaryButtonText}>Opslaan</Text>
            </Pressable>
          </View>
        </View>
      </AnimatedOverlayModal>

      {isTitleEditorOpen && titleMenuPosition ? (
        <WebPortal>
          <AnimatedDropdownPanel
            visible={isTitleEditorOpen}
            style={[styles.titleEditorMenu, { left: titleMenuPosition.left, top: titleMenuPosition.top, width: titleMenuPosition.width } as any]}
          >
            <View ref={titleEditorPanelRef} style={styles.titleEditorPanelInner}>
              <TextInput
                ref={titleInputRef}
                value={editableTrajectoryTitle}
                onChangeText={setEditableTrajectoryTitle}
                placeholder="Trajectnaam"
                placeholderTextColor={colors.textSecondary}
                onBlur={() => {
                  applyTrajectoryTitle(editableTrajectoryTitle)
                  setIsTitleEditorOpen(false)
                }}
                onKeyPress={(event) => {
                  if (event.nativeEvent.key === 'Enter') {
                    applyTrajectoryTitle(editableTrajectoryTitle)
                    setIsTitleEditorOpen(false)
                  }
                  if (event.nativeEvent.key === 'Escape') {
                    setEditableTrajectoryTitle(trajectory.name)
                    setIsTitleEditorOpen(false)
                  }
                }}
                style={[styles.titleInput, inputWebStyle]}
              />
            </View>
          </AnimatedDropdownPanel>
        </WebPortal>
      ) : null}
    </View>
  )
}

type TabButtonProps = {
  label: string
  isSelected: boolean
  icon: (color: string) => React.ReactNode
  onPress: () => void
}

function TabButton({ label, isSelected, icon, onPress }: TabButtonProps) {
  const iconColor = isSelected ? '#FFFFFF' : colors.selected
  const textColor = isSelected ? '#FFFFFF' : colors.selected

  return (
    <Pressable
      onPress={onPress}
      style={({ hovered }) => [
        styles.tabButton,
        isSelected ? styles.tabButtonSelected : styles.tabButtonUnselected,
        hovered ? (isSelected ? styles.tabButtonSelectedHovered : styles.tabButtonHovered) : undefined,
      ]}
    >
      <View style={styles.tabButtonContent}>
        {icon(iconColor)}
        <Text isSemibold style={[styles.tabLabel, { color: textColor }]}> {label}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    zIndex: 20,
    paddingVertical: 8,
    marginBottom: 10,
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 12,
    minWidth: 0,
  },
  backTitleButton: {
    height: 40,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'flex-start',
    flexShrink: 1,
    maxWidth: '100%',
  },
  backTitleButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  sessionTitle: {
    fontSize: 24,
    lineHeight: 28,
    color: colors.text,
    flexShrink: 1,
  },
  titleInput: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  titleEditorMenu: {
    position: 'absolute',
    zIndex: 1500,
  },
  titleEditorPanelInner: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 8,
    ...( { boxShadow: '0 14px 30px rgba(15,23,42,0.12)' } as any ),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
    flexWrap: 'wrap',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...( { overflowX: 'auto', overflowY: 'hidden' } as any ),
    ...( { scrollbarWidth: 'none' } as any ),
    ...( { msOverflowStyle: 'none' } as any ),
  },
  tabButton: {
    height: 40,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tabButtonSelected: {
    backgroundColor: colors.selected,
    borderColor: colors.selected,
  },
  tabButtonSelectedHovered: {
    backgroundColor: '#A50058',
    borderColor: '#A50058',
  },
  tabButtonUnselected: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  tabButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  tabButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tabLabel: {
    fontSize: 14,
    lineHeight: 18,
  },
  addButton: {
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.selected,
    borderWidth: 1,
    borderColor: colors.selected,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonHovered: {
    backgroundColor: '#A50058',
  },
  addButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
    ...( { transform: [{ translateY: 1 }] } as any ),
  },
  content: { flex: 1 },
  listScroll: { flex: 1 },
  listContent: { gap: 12, paddingBottom: 16 },
  listItem: { width: '100%' },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 16 },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  activityCardHovered: {
    backgroundColor: colors.hoverBackground,
  },
  activityLeft: { flex: 1, minWidth: 0, gap: 4 },
  activityName: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.textStrong,
  },
  activityMeta: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 12,
    overflow: 'visible',
  },
  modalContainer: {
    overflow: 'visible',
  },
  modalTitle: {
    fontSize: 20,
    lineHeight: 24,
    color: colors.text,
  },
  modalInput: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  modalMenuArea: {
    width: '100%',
    position: 'relative',
    zIndex: 1,
  },
  modalMenuAreaRaised: {
    zIndex: 20,
  },
  modalFieldRow: {
    width: '100%',
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalFieldRowHovered: {
    backgroundColor: colors.hoverBackground,
  },
  modalDropdownText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  modalDropdownSpacer: {
    flex: 1,
  },
  modalMenuPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '100%',
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    zIndex: 30,
    maxHeight: 220,
  },
  modalMenuScroll: {
    maxHeight: 220,
  },
  modalMenuContent: {
    paddingVertical: 0,
  },
  modalMenuItem: {
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalMenuItemTop: {
    borderTopWidth: 0,
  },
  modalMenuItemHovered: {
    backgroundColor: colors.hoverBackground,
  },
  modalMenuItemText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  secondaryButton: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  secondaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  primaryButton: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.selected,
    backgroundColor: colors.selected,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonHovered: {
    backgroundColor: '#A50058',
  },
  primaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  dangerButton: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DAB4C8',
    backgroundColor: '#FCE3F2',
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonHovered: {
    backgroundColor: '#F8D2EA',
  },
  dangerButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.selected,
  },
})

