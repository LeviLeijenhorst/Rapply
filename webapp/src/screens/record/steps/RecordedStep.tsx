import React from 'react'
import { Pressable, ScrollView, TextInput, View } from 'react-native'

import { Dropdown } from '../../../ui/animated/Dropdown'
import { Text } from '../../../ui/Text'
import { CoachscribeLogo } from '../../../components/brand/CoachscribeLogo'
import { ChevronDownIcon } from '../../../icons/ChevronDownIcon'
import { MicrophoneSmallIcon } from '../../../icons/MicrophoneSmallIcon'
import { ProfileCircleIcon } from '../../../icons/ProfileCircleIcon'
import { colors } from '../../../design/theme/colors'
import { unassignedClientLabel } from '../../../types/client'
import type { OptionKey } from '../utils'
import { styles } from '../styles'

type ClientOption = {
  id: string | null
  name: string
}

type RecordedStepModel = {
  clientDropdownMaxHeight: number | null
  clientOptions: ClientOption[]
  defaultDropdownMaxHeight: number
  isClientOpen: boolean
  limitedMode: boolean
  selectedClientName: string | null
  selectedOption: OptionKey | null
  sessionTitle: string
  sessionTitleInputRef: React.RefObject<TextInput | null>
  clientTriggerRef: React.RefObject<any>
  onSelectClient: (clientId: string | null) => void
  onInputTitleChange: (title: string) => void
  onToggleClientDropdown: () => void
}

export function RecordedStep({
  clientDropdownMaxHeight,
  clientOptions,
  defaultDropdownMaxHeight,
  isClientOpen,
  limitedMode,
  selectedClientName,
  selectedOption,
  sessionTitle,
  sessionTitleInputRef,
  clientTriggerRef,
  onSelectClient,
  onInputTitleChange,
  onToggleClientDropdown,
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
      <Pressable onPress={() => sessionTitleInputRef.current?.focus()} style={styles.infoRow}>
        <MicrophoneSmallIcon color={colors.textStrong} size={20} />
        <TextInput
          ref={sessionTitleInputRef}
          value={sessionTitle}
          onChangeText={onInputTitleChange}
          placeholder="Titel"
          placeholderTextColor="#656565"
          style={[styles.sessionTitleInput, ({ outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any)]}
        />
      </Pressable>

      <View style={[styles.recordedDropdownsRow, limitedMode ? styles.recordedDropdownsColumn : undefined]}>
        <View style={[styles.dropdownArea, isClientOpen ? styles.dropdownAreaRaised : undefined]}>
          <Pressable
            ref={clientTriggerRef}
            id="new-session-client-trigger"
            onPress={onToggleClientDropdown}
            style={({ hovered }) => [styles.infoRow, hovered ? styles.infoRowHovered : undefined]}
          >
            <ProfileCircleIcon />
            <Text isSemibold style={styles.infoRowText}>
              {selectedClientName ?? unassignedClientLabel}
            </Text>
            <View style={styles.infoRowSpacer} />
            <ChevronDownIcon color={colors.textStrong} size={20} />
          </Pressable>

          <Dropdown
            visible={isClientOpen}
            id="new-session-client-panel"
            style={[styles.clientPanel, { maxHeight: clientDropdownMaxHeight ?? defaultDropdownMaxHeight }]}
          >
            <ScrollView
              style={[styles.clientList, { maxHeight: Math.max(0, (clientDropdownMaxHeight ?? defaultDropdownMaxHeight) - 48) }]}
              contentContainerStyle={styles.clientListContent}
              showsVerticalScrollIndicator={false}
            >
              {clientOptions.map((client, index) => {
                const isFirst = index === 0
                return (
                  <Pressable
                    key={client.id ?? 'client-unassigned'}
                    onPress={() => onSelectClient(client.id)}
                    style={({ hovered }) => [
                      styles.clientItem,
                      isFirst ? styles.clientItemTop : undefined,
                      hovered ? styles.clientItemHovered : undefined,
                    ]}
                  >
                    <ProfileCircleIcon />
                    <Text style={styles.clientItemText}>{client.name}</Text>
                  </Pressable>
                )
              })}
            </ScrollView>
          </Dropdown>
        </View>
      </View>
    </View>
  )
}









