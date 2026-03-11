import React from 'react'
import { Pressable, ScrollView, View } from 'react-native'

import { Text } from '../../../ui/Text'
import { SendSquareIcon } from '../../../icons/SendSquareIcon'
import { styles } from '../styles'

type UploadAudioStepModel = {
  isUploadDragActive: boolean
  selectedAudioFile: File | null
  uploadDropAreaRef: React.RefObject<View | null>
  uploadFileDurationWarning: string | null
  onOpenFilePicker: () => void
}

export function UploadAudioStep({
  isUploadDragActive,
  selectedAudioFile,
  uploadDropAreaRef,
  uploadFileDurationWarning,
  onOpenFilePicker,
}: UploadAudioStepModel) {
  return (
    <ScrollView style={styles.stepScroll} contentContainerStyle={styles.stepScrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.uploadBody}>
        <View ref={uploadDropAreaRef} style={[styles.uploadDropArea, isUploadDragActive ? styles.uploadDropAreaActive : undefined]}>
          <Pressable
            onPress={onOpenFilePicker}
            style={({ hovered }) => [styles.uploadPressable, hovered ? styles.uploadDropAreaHovered : undefined]}
          >
            <View style={styles.uploadCenter}>
              <SendSquareIcon size={80} color="#656565" />
              <Text isSemibold style={styles.uploadHintText}>
                Sleep bestand hierin
              </Text>
              {selectedAudioFile ? (
                <Text style={styles.uploadFileNameText} numberOfLines={1}>
                  {selectedAudioFile.name}
                </Text>
              ) : null}
              {uploadFileDurationWarning ? (
                <Text style={styles.uploadDurationWarningText}>{uploadFileDurationWarning}</Text>
              ) : null}
            </View>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  )
}

