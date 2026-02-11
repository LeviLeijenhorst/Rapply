import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native'

import { CoachscribeLogo } from '../components/CoachscribeLogo'
import { PracticeEditFieldIcon } from '../components/icons/PracticeEditFieldIcon'
import { PracticeExportIcon } from '../components/icons/PracticeExportIcon'
import { Text } from '../components/Text'
import { useLocalAppData } from '../local/LocalAppDataProvider'
import { colors } from '../theme/colors'

function normalizeHexColor(value: string, fallback = '#BE0165') {
  const trimmed = String(value || '').trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) return `#${trimmed.toUpperCase()}`
  if (/^[0-9a-fA-F]{3}$/.test(trimmed)) {
    const hex = trimmed
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toUpperCase()
  }
  return fallback
}

function isValidHexColor(value: string) {
  const trimmed = String(value || '').trim().replace(/^#/, '')
  return /^[0-9a-fA-F]{6}$/.test(trimmed) || /^[0-9a-fA-F]{3}$/.test(trimmed)
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Bestand kon niet worden gelezen.'))
    reader.onload = () => resolve(String(reader.result || ''))
    reader.readAsDataURL(file)
  })
}

export function MijnPraktijkScreen() {
  const { data, updatePracticeSettings } = useLocalAppData()
  const settings = data.practiceSettings

  const [practiceNameDraft, setPracticeNameDraft] = useState(settings.practiceName)
  const [websiteDraft, setWebsiteDraft] = useState(settings.website)
  const [tintColorDraft, setTintColorDraft] = useState(normalizeHexColor(settings.tintColor || '#BE0165'))
  const [isColorInputHovered, setIsColorInputHovered] = useState(false)
  const [isColorInputFocused, setIsColorInputFocused] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
  const colorInputRef = useRef<TextInput | null>(null)
  const previewTintColor = isValidHexColor(tintColorDraft) ? normalizeHexColor(tintColorDraft) : normalizeHexColor(settings.tintColor || '#BE0165')

  const logoDropAreaRef = useRef<View | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const hiddenFileInputStyle = useMemo(() => ({ position: 'absolute', opacity: 0, width: 0, height: 0 }), [])

  useEffect(() => {
    setPracticeNameDraft(settings.practiceName)
    setWebsiteDraft(settings.website)
    setTintColorDraft(normalizeHexColor(settings.tintColor || '#BE0165'))
  }, [settings.practiceName, settings.website, settings.tintColor])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const isInsideDropArea = (event: DragEvent) => {
      const rect = (logoDropAreaRef.current as any)?.getBoundingClientRect?.()
      if (!rect) return false
      return event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom
    }

    const extractFileFromDragEvent = (event: DragEvent) => {
      const fileFromFiles = event.dataTransfer?.files?.[0]
      if (fileFromFiles) return fileFromFiles
      const items = event.dataTransfer?.items ?? []
      for (let index = 0; index < items.length; index += 1) {
        const file = items[index].getAsFile()
        if (file) return file
      }
      return null
    }

    const onDragOver = (event: DragEvent) => {
      if (!isInsideDropArea(event)) return
      event.preventDefault()
      event.stopPropagation()
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
      setIsDragActive(true)
    }

    const onDragLeave = (event: DragEvent) => {
      if (isInsideDropArea(event)) return
      setIsDragActive(false)
    }

    const onDrop = (event: DragEvent) => {
      if (!isInsideDropArea(event)) return
      event.preventDefault()
      event.stopPropagation()
      setIsDragActive(false)
      const droppedFile = extractFileFromDragEvent(event)
      void handleLogoFileSelected(droppedFile)
    }

    window.addEventListener('dragover', onDragOver, true)
    window.addEventListener('dragleave', onDragLeave, true)
    window.addEventListener('drop', onDrop, true)
    return () => {
      window.removeEventListener('dragover', onDragOver, true)
      window.removeEventListener('dragleave', onDragLeave, true)
      window.removeEventListener('drop', onDrop, true)
    }
  }, [])

  function persistPracticeName(nextValue: string) {
    updatePracticeSettings({ practiceName: nextValue })
  }

  function persistWebsite(nextValue: string) {
    updatePracticeSettings({ website: nextValue })
  }

  function persistTintColor(nextColor: string) {
    const normalized = isValidHexColor(nextColor) ? normalizeHexColor(nextColor) : normalizeHexColor(settings.tintColor || '#BE0165')
    setTintColorDraft(normalized)
    updatePracticeSettings({ tintColor: normalized })
  }

  function handleTintColorChange(nextValue: string) {
    setTintColorDraft(nextValue)
  }

  async function handleLogoFileSelected(file: File | null) {
    if (!file) return
    if (!file.type.startsWith('image/')) return
    const dataUrl = await readFileAsDataUrl(file)
    if (!dataUrl) return
    updatePracticeSettings({ logoDataUrl: dataUrl })
  }

  return (
    <View style={styles.container}>
      <Text isSemibold style={styles.headerTitle}>
        Mijn praktijk
      </Text>

      <View style={styles.formSection}>
        <LabeledInput
          label="Naam praktijk"
          value={practiceNameDraft}
          onChangeText={setPracticeNameDraft}
          onBlur={() => persistPracticeName(practiceNameDraft)}
        />
        <LabeledInput
          label="Website"
          value={websiteDraft}
          onChangeText={setWebsiteDraft}
          onBlur={() => persistWebsite(websiteDraft)}
        />

        <View style={styles.logoColorRow}>
          <View style={styles.logoColumn}>
            <Text isSemibold style={styles.fieldLabelText}>
              Logo
            </Text>
            <View ref={logoDropAreaRef} style={[styles.logoUploadBox, isDragActive ? styles.logoUploadBoxActive : undefined]}>
              <Pressable
                style={({ hovered }) => [styles.logoUploadPressable, hovered ? styles.logoUploadPressableHovered : undefined]}
                onPress={() => fileInputRef.current?.click()}
              >
                {settings.logoDataUrl ? (
                  <View style={styles.logoPreviewWrap}>
                    <Image source={{ uri: settings.logoDataUrl }} resizeMode="contain" style={styles.logoPreviewImage} />
                  </View>
                ) : (
                  <View style={styles.logoUploadCenter}>
                    <PracticeExportIcon />
                    <Text style={styles.logoUploadHint}>Sleep in of upload van je computer</Text>
                  </View>
                )}
              </Pressable>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(event) => {
                  void handleLogoFileSelected(event.currentTarget.files?.[0] ?? null)
                  event.currentTarget.value = ''
                }}
                style={hiddenFileInputStyle as any}
              />
            </View>
          </View>

          <View style={styles.colorColumn}>
            <Text isSemibold style={styles.fieldLabelText}>
              Kleur
            </Text>
            <View style={styles.colorPickerWrap}>
              <View style={[styles.colorCard, { backgroundColor: previewTintColor }]}>
                <Pressable onPress={() => colorInputRef.current?.focus()} onHoverIn={() => setIsColorInputHovered(true)} onHoverOut={() => setIsColorInputHovered(false)}>
                  <TextInput
                    ref={colorInputRef}
                    value={tintColorDraft}
                    onChangeText={handleTintColorChange}
                    onBlur={() => {
                      setIsColorInputFocused(false)
                      persistTintColor(tintColorDraft)
                    }}
                    onFocus={() => setIsColorInputFocused(true)}
                    onSubmitEditing={() => persistTintColor(tintColorDraft)}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    placeholder="#BE0165"
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    maxLength={7}
                    style={[
                      styles.colorHexInput,
                      isColorInputHovered || isColorInputFocused ? styles.colorHexInputActive : undefined,
                      { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any,
                    ]}
                  />
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.previewSection}>
          <Text isSemibold style={styles.fieldLabelText}>
            Voorbeeld verslag
          </Text>
          <View style={styles.documentCard}>
            <View style={styles.documentHeader}>
              <View style={styles.documentHeaderText}>
                <Text isBold style={[styles.documentTitle, { color: previewTintColor }]}>Titel van het verslag</Text>
                <Text style={styles.documentDate}>07/02/2026</Text>
              </View>
              <View style={styles.documentLogoSlot}>
                {settings.logoDataUrl ? <Image source={{ uri: settings.logoDataUrl }} resizeMode="contain" style={styles.documentLogoImage} /> : <CoachscribeLogo />}
              </View>
            </View>
            <View style={[styles.documentHeaderDivider, { backgroundColor: previewTintColor }]} />

            <View style={styles.documentBody}>
              <Text isBold style={styles.documentSectionTitle}>
                Samenvatting
              </Text>
              <Text style={styles.documentParagraph}>Hier komt een korte samenvatting van het gesprek</Text>
              <Text isBold style={styles.documentSectionTitle}>
                Actiepunten
              </Text>
              <Text style={styles.documentBullet}>- Hier komen de actiepunten overzichtelijk op een rij</Text>
            </View>

            <View style={styles.documentFooter}>
              <View style={[styles.documentFooterLine, { backgroundColor: previewTintColor }]} />
              <View style={styles.documentFooterRow}>
                <Text style={styles.documentFooterText}>{practiceNameDraft.trim()}</Text>
                <Text style={styles.documentFooterText}>{websiteDraft.trim()}</Text>
              </View>
              <Text style={styles.documentPageNumber}>1</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

type LabeledInputProps = {
  label: string
  value: string
  onChangeText: (value: string) => void
  onBlur: () => void
}

function LabeledInput({ label, value, onChangeText, onBlur }: LabeledInputProps) {
  const inputRef = useRef<TextInput | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any
  const shouldHighlight = isHovered || isFocused

  return (
    <View style={styles.inputGroup}>
      <Text isSemibold style={styles.fieldLabelText}>
        {label}
      </Text>
      <Pressable onPress={() => inputRef.current?.focus()} onHoverIn={() => setIsHovered(true)} onHoverOut={() => setIsHovered(false)} style={[styles.inputRow, shouldHighlight ? styles.inputRowActive : undefined]}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false)
            onBlur()
          }}
          placeholderTextColor="#656565"
          style={[styles.input, styles.inputCursorPointer, inputWebStyle]}
        />
        <PracticeEditFieldIcon color={shouldHighlight ? colors.selected : colors.textStrong} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 14,
    ...( { overflow: 'visible' } as any ),
  },
  headerTitle: {
    fontSize: 24,
    lineHeight: 28,
    color: colors.text,
  },
  formSection: {
    width: '100%',
    ...( { maxWidth: 'min(1260px, 100%)' } as any ),
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  fieldLabelText: {
    fontSize: 16,
    lineHeight: 20,
    color: '#656565',
  },
  inputRow: {
    width: '100%',
    height: 78,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...( { cursor: 'pointer' } as any ),
  },
  inputRowActive: {
    borderColor: colors.selected,
  },
  input: {
    flex: 1,
    padding: 0,
    fontSize: 16,
    lineHeight: 20,
    color: colors.textStrong,
  },
  inputCursorPointer: {
    ...( { cursor: 'pointer' } as any ),
  },
  logoColorRow: {
    flexDirection: 'row',
    gap: 32,
    flexWrap: 'wrap',
  },
  logoColumn: {
    width: 220,
    maxWidth: '100%',
    gap: 8,
  },
  colorColumn: {
    width: 220,
    maxWidth: '100%',
    gap: 8,
  },
  logoUploadBox: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  logoUploadBoxActive: {
    borderColor: colors.selected,
    backgroundColor: 'rgba(190,1,101,0.08)',
  },
  logoUploadPressable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  logoUploadPressableHovered: {
    backgroundColor: colors.hoverBackground,
  },
  logoUploadCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  logoUploadHint: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
    textAlign: 'center',
  },
  logoPreviewWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  logoPreviewImage: {
    width: '100%',
    height: '100%',
  },
  colorPickerWrap: {
    width: '100%',
    position: 'relative',
  },
  colorCard: {
    width: 220,
    maxWidth: '100%',
    height: 220,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  colorHexInput: {
    width: 94,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.12)',
    letterSpacing: 0.5,
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
    ...( { cursor: 'pointer' } as any ),
  },
  colorHexInputActive: {
    borderColor: colors.selected,
  },
  previewSection: {
    gap: 8,
    paddingBottom: 24,
  },
  documentCard: {
    width: 470,
    maxWidth: '100%',
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    gap: 10,
    aspectRatio: 210 / 297,
    justifyContent: 'flex-start',
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  documentHeaderText: {
    gap: 3,
  },
  documentTitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  documentDate: {
    fontSize: 10,
    lineHeight: 14,
    color: colors.textSecondary,
  },
  documentLogoSlot: {
    width: 110,
    height: 24,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  documentLogoImage: {
    width: '100%',
    height: '100%',
  },
  documentHeaderDivider: {
    width: '100%',
    height: 1,
    marginTop: 2,
    marginBottom: 8,
  },
  documentBody: {
    gap: 14,
  },
  documentSectionTitle: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  documentParagraph: {
    fontSize: 10.3,
    lineHeight: 14,
    color: colors.text,
  },
  documentBullet: {
    fontSize: 10.3,
    lineHeight: 14,
    color: colors.text,
  },
  documentFooter: {
    gap: 4,
    ...( { marginTop: 'auto' } as any ),
  },
  documentFooterLine: {
    width: '100%',
    height: 1,
  },
  documentFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  documentFooterText: {
    fontSize: 8.5,
    lineHeight: 11,
    color: colors.textSecondary,
  },
  documentPageNumber: {
    marginTop: 4,
    alignSelf: 'flex-end',
    fontSize: 8.5,
    lineHeight: 11,
    color: colors.textSecondary,
  },
})
