import React from 'react'
import { ScrollView, View } from 'react-native'

import { AnimatedMainContent } from '../../../ui/AnimatedMainContent'
import { ConversationTabs, type ConversationTabKey } from '../../../components/sessionDetail/ConversationTabs'
import { NotesTabPanel } from '../../../components/sessionDetail/NotesTabPanel'
import { TranscriptTabPanel } from '../../../components/sessionDetail/TranscriptTabPanel'
import { features } from '../../../config/features'
import { styles } from '../styles'

type Props = {
  activeTabKey: ConversationTabKey
  audioDurationSeconds: number | null
  audioPlayerNode: React.ReactNode
  currentAudioSeconds: number
  detectedActivitiesPanelNode: React.ReactNode
  isMobileLayout: boolean
  isRapportageOnlyView: boolean
  isWrittenSession: boolean
  linkedActivitiesNode: React.ReactNode
  onCancelGeneration: () => void
  onChangeTranscriptSearchText: (value: string) => void
  onRetryTranscription: () => void
  onSeekToSeconds: (seconds: number) => void
  onSelectTab: (tabKey: ConversationTabKey) => void
  reportPanelNode: React.ReactNode
  sessionId: string
  snippetsPanelNode: React.ReactNode
  suppressTranscriptErrorToast: boolean
  transcript: string | null
  transcriptSearchText: string
  transcriptionError: string | null
  transcriptionStatus: 'idle' | 'transcribing' | 'generating' | 'done' | 'error'
  transcriptHighlightTintColor: string
  useTranscriptTintColors: boolean
}

export function TabContent({
  activeTabKey,
  audioDurationSeconds,
  audioPlayerNode,
  currentAudioSeconds,
  detectedActivitiesPanelNode,
  isMobileLayout,
  isRapportageOnlyView,
  isWrittenSession,
  linkedActivitiesNode,
  onCancelGeneration,
  onChangeTranscriptSearchText,
  onRetryTranscription,
  onSeekToSeconds,
  onSelectTab,
  reportPanelNode,
  sessionId,
  snippetsPanelNode,
  suppressTranscriptErrorToast,
  transcript,
  transcriptSearchText,
  transcriptionError,
  transcriptionStatus,
  transcriptHighlightTintColor,
  useTranscriptTintColors,
}: Props) {
  if (isMobileLayout) {
    return (
      <ScrollView
        style={styles.mobileScroll}
        contentContainerStyle={[styles.mobileScrollContent, isRapportageOnlyView ? styles.mobileScrollContentFill : undefined]}
        showsVerticalScrollIndicator={false}
      >
        {audioPlayerNode}
        {isRapportageOnlyView ? <View style={[styles.reportCard, styles.reportCardFill]}>{reportPanelNode}</View> : null}
        {!isRapportageOnlyView ? (
          <View style={styles.mobileTabContentCard}>
            <View style={styles.tabsRow}>
              <View style={styles.tabsLeft}>
                <ConversationTabs activeTabKey={activeTabKey} onSelectTab={onSelectTab} />
              </View>
            </View>
            <AnimatedMainContent key={activeTabKey} contentKey={activeTabKey} style={styles.mobileTabAnimated}>
              {activeTabKey === 'summary' ? <View style={[styles.reportCard, styles.reportCardFill]}>{reportPanelNode}</View> : null}
              {activeTabKey === 'notes' ? <NotesTabPanel sessionId={sessionId} shouldFillAvailableHeight={false} /> : null}
              {!isWrittenSession && activeTabKey === 'transcript' ? (
                <TranscriptTabPanel
                  searchValue={transcriptSearchText}
                  onChangeSearchValue={onChangeTranscriptSearchText}
                  shouldFillAvailableHeight={false}
                  transcript={transcript}
                  transcriptionStatus={transcriptionStatus}
                  transcriptionError={transcriptionError}
                  onSeekToSeconds={onSeekToSeconds}
                  onRetryTranscription={onRetryTranscription}
                  onCancelGeneration={onCancelGeneration}
                  currentAudioSeconds={currentAudioSeconds}
                  highlightTintColor={transcriptHighlightTintColor}
                  useTintColors={useTranscriptTintColors}
                  audioDurationSeconds={audioDurationSeconds}
                  showRetryButton={false}
                  suppressErrorToast={suppressTranscriptErrorToast}
                />
              ) : null}
              {features.activities && activeTabKey === 'activities' ? (
                <View style={styles.leftScrollContent}>
                  {detectedActivitiesPanelNode}
                  {snippetsPanelNode}
                  {linkedActivitiesNode}
                </View>
              ) : null}
            </AnimatedMainContent>
          </View>
        ) : null}
      </ScrollView>
    )
  }

  return (
    <View style={styles.content}>
      <View style={styles.mainRow}>
        {isRapportageOnlyView ? (
          <View style={styles.rapportageOnlyColumn}>
            <View style={[styles.reportCard, styles.reportCardFill]}>{reportPanelNode}</View>
          </View>
        ) : (
          <View style={styles.rightColumn}>
            <View style={styles.rightCard}>
              <View style={styles.tabsRow}>
                <View style={styles.tabsLeft}>
                  <ConversationTabs activeTabKey={activeTabKey} onSelectTab={onSelectTab} />
                </View>
              </View>

              <AnimatedMainContent key={activeTabKey} contentKey={activeTabKey} style={styles.tabAnimated}>
                {activeTabKey === 'summary' ? (
                  <ScrollView style={styles.leftScroll} contentContainerStyle={styles.leftScrollContent} showsVerticalScrollIndicator={false}>
                    {audioPlayerNode}
                    <View style={styles.reportCard}>{reportPanelNode}</View>
                  </ScrollView>
                ) : null}
                {activeTabKey === 'notes' ? <NotesTabPanel sessionId={sessionId} /> : null}
                {!isWrittenSession && activeTabKey === 'transcript' ? (
                  <TranscriptTabPanel
                    searchValue={transcriptSearchText}
                    onChangeSearchValue={onChangeTranscriptSearchText}
                    transcript={transcript}
                    transcriptionStatus={transcriptionStatus}
                    transcriptionError={transcriptionError}
                    onSeekToSeconds={onSeekToSeconds}
                    onRetryTranscription={onRetryTranscription}
                    onCancelGeneration={onCancelGeneration}
                    currentAudioSeconds={currentAudioSeconds}
                    highlightTintColor={transcriptHighlightTintColor}
                    useTintColors={useTranscriptTintColors}
                    audioDurationSeconds={audioDurationSeconds}
                    showRetryButton={false}
                    suppressErrorToast={suppressTranscriptErrorToast}
                  />
                ) : null}
                {features.activities && activeTabKey === 'activities' ? (
                  <ScrollView style={styles.leftScroll} contentContainerStyle={styles.leftScrollContent} showsVerticalScrollIndicator={false}>
                    {detectedActivitiesPanelNode}
                    {snippetsPanelNode}
                    {linkedActivitiesNode}
                  </ScrollView>
                ) : null}
              </AnimatedMainContent>
            </View>
          </View>
        )}
      </View>
    </View>
  )
}

