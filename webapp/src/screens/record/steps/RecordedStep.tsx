import React from 'react'
import { Pressable, ScrollView, TextInput, View } from 'react-native'

import { Dropdown } from '../../../ui/animated/Dropdown'
import { AudioPlayerCard } from '../../shared/components/audio/AudioPlayerCard'
import { Text } from '../../../ui/Text'
import { CoachscribeLogo } from '../../../components/brand/CoachscribeLogo'
import { ChevronDownIcon } from '../../../icons/ChevronDownIcon'
import { MicrophoneSmallIcon } from '../../../icons/MicrophoneSmallIcon'
import { ProfileCircleIcon } from '../../../icons/ProfileCircleIcon'
import { colors } from '../../../design/theme/colors'
import { unassignedCoacheeLabel } from '../../../types/client'
import { maxDuration, type OptionKey } from '../utils'
import { styles } from '../styles'

type CoacheeOption = {
  id: string | null
  name: string
}

type RecordedStepModel = {
  audioDurationSeconds: number | null
  audioPreviewUrl: string | null
  coacheeDropdownMaxHeight: number | null
  coacheeOptions: CoacheeOption[]
  defaultDropdownMaxHeight: number
  isCoacheeOpen: boolean
  limitedMode: boolean
  selectedCoacheeName: string | null
  selectedOption: OptionKey | null
  sessionTitle: string
  sessionTitleInputRef: React.RefObject<TextInput | null>
  shouldSaveAudio: boolean
  coacheeTriggerRef: React.RefObject<any>
  onAddCoachee: () => void
  onSelectCoachee: (coacheeId: string | null) => void
  onSessionTitleChange: (title: string) => void
  onToggleAudioSave: () => void
  onToggleCoacheeDropdown: () => void
  onUpdateAudioDuration: (seconds: number | null) => void
}

export function RecordedStep({
  audioDurationSeconds,
  audioPreviewUrl,
  coacheeDropdownMaxHeight,
  coacheeOptions,
  defaultDropdownMaxHeight,
  isCoacheeOpen,
  limitedMode,
  selectedCoacheeName,
  selectedOption,
  sessionTitle,
  sessionTitleInputRef,
  shouldSaveAudio,
  coacheeTriggerRef,
  onAddCoachee,
  onSelectCoachee,
  onSessionTitleChange,
  onToggleAudioSave,
  onToggleCoacheeDropdown,
  onUpdateAudioDuration,
}: RecordedStepModel) {
  return (
    <View style={styles.recordedBody}>
      {limitedMode ? (
        <View style={styles.mobileRecordedHeader}>
          <CoachscribeLogo />
          <Text isSemibold style={styles.mobileRecordedStatusText}>
            {selectedOption === 'gespreksverslag' ? 'Verslag opgenomen...' : selectedOption === 'intake' ? 'Intake opgenomen...' : 'Gesprek opgenomen...'}
          </Text>
        </View>
      ) : null}
      {audioPreviewUrl && !limitedMode ? (
        <View style={styles.audioPreviewCard}>
          <AudioPlayerCard
            audioBlobId={null}
            audioDurationSeconds={audioDurationSeconds}
            audioUrlOverride={audioPreviewUrl}
            onDurationSecondsChange={(seconds) => {
              if (!Number.isFinite(seconds) || seconds <= 0) return
              onUpdateAudioDuration(maxDuration([audioDurationSeconds, Math.max(1, Math.round(seconds))]))
            }}
          />
          <Pressable
            onPress={onToggleAudioSave}
            style={({ hovered }) => [styles.audioSaveToggleRow, hovered ? styles.audioSaveToggleRowHovered : undefined]}
          >
            <Text isSemibold style={styles.audioSaveToggleLabel}>
              Audio opslaan
            </Text>
            <View style={[styles.audioSaveToggleTrack, shouldSaveAudio ? styles.audioSaveToggleTrackOn : styles.audioSaveToggleTrackOff]}>
              <View style={[styles.audioSaveToggleThumb, shouldSaveAudio ? styles.audioSaveToggleThumbOn : styles.audioSaveToggleThumbOff]} />
            </View>
          </Pressable>
        </View>
      ) : null}
      <Pressable onPress={() => sessionTitleInputRef.current?.focus()} style={styles.infoRow}>
        <MicrophoneSmallIcon color={colors.textStrong} size={20} />
        <TextInput
          ref={sessionTitleInputRef}
          value={sessionTitle}
          onChangeText={onSessionTitleChange}
          placeholder="Titel"
          placeholderTextColor="#656565"
          style={[styles.sessionTitleInput, ({ outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any)]}
        />
      </Pressable>

      <View style={[styles.recordedDropdownsRow, limitedMode ? styles.recordedDropdownsColumn : undefined]}>
        <View style={[styles.dropdownArea, isCoacheeOpen ? styles.dropdownAreaRaised : undefined]}>
          <Pressable
            ref={coacheeTriggerRef}
            id="new-session-coachee-trigger"
            onPress={onToggleCoacheeDropdown}
            style={({ hovered }) => [styles.infoRow, hovered ? styles.infoRowHovered : undefined]}
          >
            <ProfileCircleIcon />
            <Text isSemibold style={styles.infoRowText}>
              {selectedCoacheeName ?? unassignedCoacheeLabel}
            </Text>
            <View style={styles.infoRowSpacer} />
            <ChevronDownIcon color={colors.textStrong} size={20} />
          </Pressable>

          <Dropdown
            visible={isCoacheeOpen}
            id="new-session-coachee-panel"
            style={[styles.coacheePanel, { maxHeight: coacheeDropdownMaxHeight ?? defaultDropdownMaxHeight }]}
          >
            <ScrollView
              style={[styles.coacheeList, { maxHeight: Math.max(0, (coacheeDropdownMaxHeight ?? defaultDropdownMaxHeight) - 48) }]}
              contentContainerStyle={styles.coacheeListContent}
              showsVerticalScrollIndicator={false}
            >
              {coacheeOptions.map((coachee, index) => {
                const isFirst = index === 0
                return (
                  <Pressable
                    key={coachee.id ?? 'coachee-unassigned'}
                    onPress={() => onSelectCoachee(coachee.id)}
                    style={({ hovered }) => [
                      styles.coacheeItem,
                      isFirst ? styles.coacheeItemTop : undefined,
                      hovered ? styles.coacheeItemHovered : undefined,
                    ]}
                  >
                    <ProfileCircleIcon />
                    <Text style={styles.coacheeItemText}>{coachee.name}</Text>
                  </Pressable>
                )
              })}
            </ScrollView>
            <Pressable
              onPress={onAddCoachee}
              style={({ hovered }) => [
                styles.coacheeItem,
                styles.coacheeItemAdd,
                coacheeOptions.length === 0 ? styles.coacheeItemTop : undefined,
                styles.coacheeItemBottom,
                hovered ? styles.coacheeItemAddHovered : undefined,
              ]}
            >
              <ProfileCircleIcon />
              <Text style={styles.coacheeItemAddText}>+ Nieuwe cli�nt</Text>
            </Pressable>
          </Dropdown>
        </View>
      </View>
    </View>
  )
}






