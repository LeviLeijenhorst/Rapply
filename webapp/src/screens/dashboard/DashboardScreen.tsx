import React from 'react'
import { Image, Pressable, ScrollView, View } from 'react-native'

import { ActiveClientsIcon } from '@/icons/ActiveClientsIcon'
import { ChevronRightIcon } from '@/icons/ChevronRightIcon'
import { ClientPageMicrophoneIcon, ClientPageRapportageIcon } from '@/icons/ClientPageSvgIcons'
import { ImportAudioIcon } from '@/icons/ImportAudioIcon'
import { ImportDocumentIcon } from '@/icons/ImportDocumentIcon'
import { NewClientAddIcon } from '@/icons/NewClientAddIcon'
import { OpenActionItemsIcon } from '@/icons/OpenActionItemsIcon'
import { RecordSummaryIcon } from '@/icons/RecordSummaryIcon'
import { RecordVideoCallIcon } from '@/icons/RecordVideoCallIcon'
import { SessionsThisWeekIcon } from '@/icons/SessionsThisWeekIcon'
import { Text } from '@/ui/Text'
import { SearchBar } from '@/ui/inputs/SearchBar'

import { useDashboardScreenModel } from './DashboardScreen.logic'
import { styles } from './DashboardScreen.styles'
import type {
  DashboardContinueItem,
  DashboardOpenActionItem,
  DashboardQuickInputAction,
  DashboardScreenProps,
  DashboardStatCardData,
} from './DashboardScreen.types'

function renderQuickInputIcon(action: DashboardQuickInputAction): React.ReactNode {
  if (action.iconKey === 'record-session') return <ClientPageMicrophoneIcon size={18} />
  if (action.iconKey === 'record-summary') return <RecordSummaryIcon size={18} />
  if (action.iconKey === 'record-video') return <RecordVideoCallIcon size={18} />
  if (action.iconKey === 'import-audio') return <ImportAudioIcon size={18} />
  return <ImportDocumentIcon size={18} />
}

function renderStatIcon(card: DashboardStatCardData): React.ReactNode {
  if (card.id === 'active-clients') return <ActiveClientsIcon size={24} color="#FFFFFF" />
  if (card.id === 'sessions-this-week') return <SessionsThisWeekIcon size={24} color="#FFFFFF" />
  if (card.id === 'reports-this-week') return <ClientPageRapportageIcon size={28} color="#FFFFFF" />
  return <OpenActionItemsIcon size={24} color="#FFFFFF" />
}

function QuickInputRow({ action }: { action: DashboardQuickInputAction }) {
  return (
    <Pressable onPress={action.onPress} style={({ hovered }) => [styles.listRow, hovered ? styles.listRowHovered : undefined]}>
      <View
        style={[
          styles.quickIconWrap,
          {
            backgroundColor: action.accentFrom,
            ...( { backgroundImage: `linear-gradient(to top right, ${action.accentFrom} 0%, ${action.accentTo} 100%)` } as any ),
          },
        ]}
      >
        {renderQuickInputIcon(action)}
      </View>
      <View style={styles.listRowTextWrap}>
        <Text isSemibold style={styles.listRowTitle}>{action.title}</Text>
        <Text style={styles.listRowSubtitle}>{action.subtitle}</Text>
      </View>
      <ChevronRightIcon color="#93858D" size={18} />
    </Pressable>
  )
}

function ContinueRow({ item, onPress }: { item: DashboardContinueItem; onPress: (clientId: string) => void }) {
  return (
    <Pressable onPress={() => onPress(item.clientId)} style={({ hovered }) => [styles.listRow, hovered ? styles.listRowHovered : undefined]}>
      <View style={styles.avatarWrap}>
        {item.profilePhotoUri ? (
          <Image source={{ uri: item.profilePhotoUri }} style={styles.avatarImage} resizeMode="cover" />
        ) : (
          <Text isSemibold style={styles.avatarFallbackText}>{item.clientName.slice(0, 1).toUpperCase()}</Text>
        )}
      </View>
      <View style={styles.listRowTextWrap}>
        <Text isSemibold style={styles.listRowTitle}>{item.clientName}</Text>
        <Text style={styles.listRowSubtitle}>{item.subtitle}</Text>
      </View>
      <ChevronRightIcon color="#93858D" size={18} />
    </Pressable>
  )
}

function OpenActionRow({
  item,
  onOpenReportsPage,
  onOpenSession,
}: {
  item: DashboardOpenActionItem
  onOpenReportsPage: () => void
  onOpenSession: (sessionId: string) => void
}) {
  const isDisabled = item.kind === 'snippet' && !item.sessionId

  return (
    <Pressable
      onPress={() => {
        if (item.kind === 'report') {
          onOpenReportsPage()
          return
        }

        if (item.sessionId) onOpenSession(item.sessionId)
      }}
      disabled={isDisabled}
      style={({ hovered }) => [styles.tableRow, isDisabled ? styles.tableRowDisabled : undefined, hovered && !isDisabled ? styles.tableRowHovered : undefined]}
    >
      <View style={[styles.tableCell, styles.itemCell]}>
        <Text isSemibold style={styles.tableItemText} numberOfLines={1}>{item.itemLabel}</Text>
      </View>
      <View style={[styles.tableCell, styles.clientCell]}>
        <Text isSemibold style={styles.tableClientName} numberOfLines={1}>{item.clientName}</Text>
      </View>
      <View style={[styles.tableCell, styles.createdCell]}>
        <Text style={styles.tableSecondaryText}>{item.createdAtLabel}</Text>
      </View>
      <View style={[styles.tableCell, styles.statusCell]}>
        <View style={[styles.statusPill, item.kind === 'report' ? styles.statusPillReview : styles.statusPillPending]}>
          <Text isSemibold style={[styles.statusPillText, item.kind === 'report' ? styles.statusPillTextReview : styles.statusPillTextPending]}>
            {`• ${item.statusLabel}`}
          </Text>
        </View>
      </View>
      <View style={[styles.tableCell, styles.updatedCell]}>
        <Text style={styles.tableSecondaryText}>{item.updatedLabel}</Text>
      </View>
      <View style={[styles.tableCell, styles.chevronCell]}>
        <ChevronRightIcon color="#93858D" size={18} />
      </View>
    </Pressable>
  )
}

function DashboardStatCard({ card }: { card: DashboardStatCardData }) {
  return (
    <Pressable
      onPress={card.onPress}
      disabled={!card.onPress}
      style={({ hovered, pressed }) => [
        styles.statCard,
        card.onPress ? styles.statCardInteractive : undefined,
        hovered && card.onPress ? styles.statCardHovered : undefined,
        pressed && card.onPress ? styles.statCardPressed : undefined,
      ]}
    >
      <View style={styles.statCardHeader}>
        <Text isSemibold style={styles.statCardTitle}>{card.title}</Text>
        <View
          style={[
            styles.statCardIconWrap,
            {
              backgroundColor: card.accentFrom,
              ...( { backgroundImage: `linear-gradient(to top right, ${card.accentFrom} 0%, ${card.accentTo} 100%)` } as any ),
            },
          ]}
        >
          {renderStatIcon(card)}
        </View>
      </View>
      <View style={styles.statCardValueRow}>
        <Text isBold style={styles.statCardValue}>{card.value}</Text>
      </View>
    </Pressable>
  )
}

export function DashboardScreen(props: DashboardScreenProps) {
  const model = useDashboardScreenModel(props)

  return (
    <ScrollView ref={model.scrollRef} style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}>
        <View style={styles.heroTextWrap}>
          <Text isSemibold style={styles.heroTitle}>Welkom terug, Peter!</Text>
          <Text style={styles.heroSubtitle}>Hier een overzicht van hoe het ervoor staat vandaag.</Text>
        </View>
        <Pressable
          onPress={props.onOpenNewClientPage}
          style={({ hovered }) => [styles.heroButton, hovered ? styles.heroButtonHovered : undefined]}
        >
          <NewClientAddIcon color="#FFFFFF" size={18} />
          <Text style={styles.heroButtonText}>Nieuwe client</Text>
        </Pressable>
      </View>

      <View style={styles.statsGrid}>
        {model.dashboardStatCards.map((card) => (
          <DashboardStatCard key={card.id} card={card} />
        ))}
      </View>

      <View style={[styles.topGrid, model.isStacked ? styles.topGridStacked : undefined]}>
        <View style={styles.panelCard}>
          <Text isSemibold style={styles.panelTitle}>Verder waar je was gebleven</Text>
          <View style={styles.panelList}>
            {model.continueItems.length > 0 ? (
              model.continueItems.map((item) => <ContinueRow key={item.id} item={item} onPress={props.onSelectClient} />)
            ) : (
              <View style={styles.emptyPanelState}>
                <Text style={styles.emptyPanelText}>Nog geen recente items.</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.panelCard}>
          <Text isSemibold style={styles.panelTitle}>Snelle input</Text>
          <View style={styles.panelList}>
            {model.quickInputActions.map((action) => (
              <QuickInputRow key={action.id} action={action} />
            ))}
          </View>
        </View>
      </View>

      <View
        style={styles.tableCard}
        onLayout={(event) => {
          model.setOpenActionsOffsetY(event.nativeEvent.layout.y)
        }}
      >
        <View style={styles.tableHeaderTop}>
          <Text isSemibold style={styles.tableHeading}>Open actiepunten</Text>
          <SearchBar
            value={model.openActionQuery}
            onChangeText={model.setOpenActionQuery}
            placeholder="Zoek open acties..."
            inputRef={model.openActionInputRef}
            containerStyle={styles.tableSearchBar}
          />
        </View>

        <View style={styles.tableHeaderRow}>
          <Text isSemibold style={[styles.tableHeaderText, styles.itemCell]}>Item</Text>
          <Text isSemibold style={[styles.tableHeaderText, styles.clientCell]}>Client</Text>
          <Text isSemibold style={[styles.tableHeaderText, styles.createdCell]}>Aangemaakt</Text>
          <Text isSemibold style={[styles.tableHeaderText, styles.statusCell]}>Status</Text>
          <Text isSemibold style={[styles.tableHeaderText, styles.updatedCell]}>Laatst bewerkt</Text>
          <View style={styles.chevronCell} />
        </View>

        <View style={styles.tableBody}>
          {model.filteredOpenActionItems.length > 0 ? (
            model.filteredOpenActionItems.map((item) => (
              <OpenActionRow
                key={item.id}
                item={item}
                onOpenReportsPage={props.onOpenReportsPage}
                onOpenSession={props.onOpenSession}
              />
            ))
          ) : (
            <View style={styles.emptyTableState}>
              <Text style={styles.emptyTableText}>Geen open actiepunten gevonden.</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  )
}
