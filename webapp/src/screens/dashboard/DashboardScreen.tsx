import React from 'react'
import { Image, Pressable, ScrollView, View } from 'react-native'

import { ActiveClientsIcon } from '@/icons/ActiveClientsIcon'
import { ChevronRightIcon } from '@/icons/ChevronRightIcon'
import { ClientPageMicrophoneIcon, ClientPageRapportageIcon } from '@/icons/ClientPageSvgIcons'
import { ImportAudioIcon } from '@/icons/ImportAudioIcon'
import { ImportDocumentIcon } from '@/icons/ImportDocumentIcon'
import { InputsThisWeekIcon } from '@/icons/InputsThisWeekIcon'
import { NewClientAddIcon } from '@/icons/NewClientAddIcon'
import { RecordSummaryIcon } from '@/icons/RecordSummaryIcon'
import { RecordVideoCallIcon } from '@/icons/RecordVideoCallIcon'
import { VerslagSchrijvenIcon } from '@/icons/VerslagSchrijvenIcon'
import { Text } from '@/ui/Text'

import { useDashboardScreenModel } from './DashboardScreen.logic'
import { styles } from './DashboardScreen.styles'
import type {
  DashboardContinueItem,
  DashboardQuickInputAction,
  DashboardScreenProps,
  DashboardStatCardData,
} from './DashboardScreen.types'

function renderQuickInputIcon(action: DashboardQuickInputAction): React.ReactNode {
  if (action.iconKey === 'record-session') return <ClientPageMicrophoneIcon size={18} />
  if (action.iconKey === 'record-summary') return <RecordSummaryIcon size={18} />
  if (action.iconKey === 'write-report') return <VerslagSchrijvenIcon size={18} color="#FFFFFF" />
  if (action.iconKey === 'record-video') return <RecordVideoCallIcon size={18} />
  if (action.iconKey === 'import-audio') return <ImportAudioIcon size={18} />
  return <ImportDocumentIcon size={18} />
}

function renderStatIcon(card: DashboardStatCardData): React.ReactNode {
  if (card.id === 'active-clients') return <ActiveClientsIcon size={24} color="#FFFFFF" />
  if (card.id === 'inputs-this-week') return <InputsThisWeekIcon size={24} color="#FFFFFF" />
  return <ClientPageRapportageIcon size={28} color="#FFFFFF" />
}

function QuickInputRow({ action }: { action: DashboardQuickInputAction }) {
  const isDisabled = !action.onPress

  return (
    <Pressable
      onPress={action.onPress}
      disabled={isDisabled}
      style={({ hovered }) => [styles.listRow, hovered && !isDisabled ? styles.listRowHovered : undefined, isDisabled ? { opacity: 0.7 } : undefined]}
    >
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

function ContinueRow({ item, onPress }: { item: DashboardContinueItem; onPress: (item: DashboardContinueItem) => void }) {
  return (
    <Pressable onPress={() => onPress(item)} style={({ hovered }) => [styles.listRow, hovered ? styles.listRowHovered : undefined]}>
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

function buildWelcomeTitle(name: string): string {
  if (!name) return 'Welkom terug!'
  return `Welkom terug, ${name}!`
}

export function DashboardScreen(props: DashboardScreenProps) {
  const model = useDashboardScreenModel(props)

  return (
    <ScrollView ref={model.scrollRef} style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}>
        <View style={styles.heroTextWrap}>
          <Text isSemibold style={styles.heroTitle}>{buildWelcomeTitle(model.welcomeName)}</Text>
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
              model.continueItems.map((item) => (
                <ContinueRow
                  key={item.id}
                  item={item}
                  onPress={(continueItem) => {
                    if (continueItem.clientId) {
                      props.onSelectClient(continueItem.clientId)
                      return
                    }
                    props.onOpenInput(continueItem.id)
                  }}
                />
              ))
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
    </ScrollView>
  )
}
