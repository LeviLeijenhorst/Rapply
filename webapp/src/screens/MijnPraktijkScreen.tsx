import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native'

import { CircleCloseIcon } from '../components/icons/CircleCloseIcon'
import { EditSmallIcon } from '../components/icons/EditSmallIcon'
import { PracticeExportIcon } from '../components/icons/PracticeExportIcon'
import { Text } from '../components/Text'
import { ConfirmDeleteDialog } from '../foundation/ui/modals/ConfirmDeleteDialog'
import { brandColors, fontSizes, radius } from '../foundation/theme/tokens'
import { useLocalAppData } from '../local/LocalAppDataProvider'
import { colors } from '../theme/colors'

const brandControlSize = 110

function normalizeHexColor(value: string) {
  const trimmed = String(value || '').trim()
  if (!/^#[0-9a-fA-F]{6}$/.test(trimmed)) return '#BE0165'
  return trimmed.toUpperCase()
}

function sanitizeHexInput(value: string) {
  return String(value || '')
    .replace('#', '')
    .replace(/[^0-9a-fA-F]/g, '')
    .slice(0, 6)
    .toUpperCase()
}

function normalizeHexInputOnBlur(input: string) {
  const sanitized = sanitizeHexInput(input)
  if (sanitized.length === 3) {
    return sanitized
      .split('')
      .map((character) => `${character}${character}`)
      .join('')
  }
  if (sanitized.length === 6) return sanitized
  return 'BE0165'
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
  const [tintColorInput, setTintColorInput] = useState(normalizeHexColor(settings.tintColor || '#BE0165').replace('#', ''))
  const [isDragActive, setIsDragActive] = useState(false)
  const [isLogoHovered, setIsLogoHovered] = useState(false)
  const [isRemoveLogoConfirmOpen, setIsRemoveLogoConfirmOpen] = useState(false)

  const logoDropAreaRef = useRef<View | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const colorInputRef = useRef<TextInput | null>(null)

  const hiddenFileInputStyle = useMemo(() => ({ position: 'absolute', opacity: 0, width: 0, height: 0 }), [])

  const tintColorDraft = useMemo(() => {
    const normalized = sanitizeHexInput(tintColorInput)
    if (normalized.length === 3) {
      const expanded = normalized
        .split('')
        .map((character) => `${character}${character}`)
        .join('')
      return `#${expanded}`
    }
    if (normalized.length === 6) return `#${normalized}`
    return normalizeHexColor(settings.tintColor || '#BE0165')
  }, [settings.tintColor, tintColorInput])

  useEffect(() => {
    setPracticeNameDraft(settings.practiceName)
    setWebsiteDraft(settings.website)
    setTintColorInput(normalizeHexColor(settings.tintColor || '#BE0165').replace('#', ''))
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
    const normalized = normalizeHexColor(nextColor)
    setTintColorInput(normalized.replace('#', ''))
    updatePracticeSettings({ tintColor: normalized })
  }

  function handleTintColorChange(nextValue: string) {
    const sanitized = sanitizeHexInput(nextValue)
    setTintColorInput(sanitized)
    if (sanitized.length === 6) persistTintColor(`#${sanitized}`)
  }

  function handleTintColorBlur() {
    const normalizedWithoutHash = normalizeHexInputOnBlur(tintColorInput)
    setTintColorInput(normalizedWithoutHash)
    persistTintColor(`#${normalizedWithoutHash}`)
  }

  async function handleLogoFileSelected(file: File | null) {
    if (!file) return
    if (!file.type.startsWith('image/')) return
    const dataUrl = await readFileAsDataUrl(file)
    if (!dataUrl) return
    updatePracticeSettings({ logoDataUrl: dataUrl })
  }

  function handleRemoveLogoConfirm() {
    updatePracticeSettings({ logoDataUrl: null })
    setIsRemoveLogoConfirmOpen(false)
  }

  return (
    <View style={styles.container}>
      <Text isSemibold style={styles.headerTitle}>
        Mijn praktijk
      </Text>

      <View style={styles.formSection}>
        <LabeledInput label="Naam praktijk" value={practiceNameDraft} onChangeText={setPracticeNameDraft} onBlur={() => persistPracticeName(practiceNameDraft)} />
        <LabeledInput label="Website" value={websiteDraft} onChangeText={setWebsiteDraft} onBlur={() => persistWebsite(websiteDraft)} />

        <View style={styles.logoColorRow}>
          <View style={styles.colorColumn}>
            <Text isSemibold style={styles.fieldLabelText}>
              Kleur
            </Text>
            <View style={styles.colorPickerWrap}>
              <Pressable onPress={() => colorInputRef.current?.focus()} style={[styles.colorCard, { backgroundColor: tintColorDraft }]}>
                <TextInput
                  ref={colorInputRef}
                  value={tintColorInput}
                  onChangeText={handleTintColorChange}
                  onBlur={handleTintColorBlur}
                  placeholder="BE0165"
                  placeholderTextColor="rgba(255,255,255,0.85)"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  style={styles.colorHexInput}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.logoColumn}>
            <Text isSemibold style={styles.fieldLabelText}>
              Logo
            </Text>
            <View
              ref={logoDropAreaRef}
              style={[styles.logoUploadBox, isDragActive ? styles.logoUploadBoxActive : undefined]}
              {...( { onMouseEnter: () => settings.logoDataUrl && setIsLogoHovered(true), onMouseLeave: () => setIsLogoHovered(false) } as any )}
            >
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
              {settings.logoDataUrl && isLogoHovered ? (
                <Pressable
                  onPress={() => setIsRemoveLogoConfirmOpen(true)}
                  style={({ hovered }) => [styles.logoRemoveButton, hovered ? styles.logoRemoveButtonHovered : undefined]}
                >
                  <CircleCloseIcon size={22} color={colors.textStrong} />
                </Pressable>
              ) : null}
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
        </View>
      </View>

      <ConfirmDeleteDialog
        visible={isRemoveLogoConfirmOpen}
        title="Logo verwijderen"
        description="Weet je zeker dat je het logo wilt verwijderen?"
        confirmLabel="Verwijderen"
        cancelLabel="Annuleren"
        onClose={() => setIsRemoveLogoConfirmOpen(false)}
        onConfirm={handleRemoveLogoConfirm}
      />
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
  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any
  const inputRef = useRef<TextInput | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isEditHovered, setIsEditHovered] = useState(false)

  function focusInput() {
    inputRef.current?.focus()
  }

  function selectAll() {
    const input = inputRef.current as any
    input?.focus?.()
    if (typeof input?.setSelection === 'function') {
      input.setSelection(0, value.length)
      return
    }
    if (typeof input?.setSelectionRange === 'function') {
      input.setSelectionRange(0, value.length)
      return
    }
    input?.setNativeProps?.({ selection: { start: 0, end: value.length } })
  }

  return (
    <View style={styles.inputGroup}>
      <Text isSemibold style={styles.fieldLabelText}>
        {label}
      </Text>
      <Pressable
        onPress={focusInput}
        onHoverIn={() => setIsHovered(true)}
        onHoverOut={() => setIsHovered(false)}
        style={[styles.inputRow, isHovered || isEditHovered ? styles.inputRowHovered : undefined]}
      >
        <TextInput ref={inputRef} value={value} onChangeText={onChangeText} onBlur={onBlur} placeholderTextColor="#656565" style={[styles.input, inputWebStyle]} />
        <Pressable
          onPress={selectAll}
          onHoverIn={() => setIsEditHovered(true)}
          onHoverOut={() => setIsEditHovered(false)}
          style={({ hovered }) => [styles.editIconButton, hovered ? styles.editIconButtonHovered : undefined]}
        >
          <EditSmallIcon color={isEditHovered ? colors.selected : colors.textSecondary} size={17} />
        </Pressable>
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
    fontSize: fontSizes.xl,
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
    fontSize: fontSizes.md,
    lineHeight: 20,
    color: '#656565',
  },
  inputRow: {
    width: '100%',
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...( { cursor: 'pointer' } as any ),
  },
  inputRowHovered: {
    borderColor: colors.selected,
  },
  input: {
    flex: 1,
    padding: 0,
    fontSize: fontSizes.md,
    lineHeight: 20,
    color: colors.textStrong,
    ...( { cursor: 'pointer' } as any ),
  },
  editIconButton: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIconButtonHovered: {
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  logoColorRow: {
    flexDirection: 'column',
    gap: 14,
  },
  logoColumn: {
    width: brandControlSize * 3,
    maxWidth: '100%',
    gap: 8,
  },
  colorColumn: {
    width: brandControlSize,
    maxWidth: '100%',
    gap: 8,
  },
  logoUploadBox: {
    width: '100%',
    height: brandControlSize,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  logoUploadBoxActive: {
    borderColor: colors.selected,
    backgroundColor: brandColors.primarySubtle,
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
    fontSize: fontSizes.sm,
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
  logoRemoveButton: {
    ...( { position: 'absolute', top: 4, right: 4 } as any ),
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRemoveButtonHovered: {
    backgroundColor: colors.hoverBackground,
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
    width: brandControlSize,
    maxWidth: '100%',
    height: brandControlSize,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...( { cursor: 'pointer' } as any ),
  },
  colorHexInput: {
    width: 88,
    height: 42,
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    textAlign: 'center',
    fontSize: fontSizes.md,
    lineHeight: 22,
    color: '#FFFFFF',
    letterSpacing: 1,
    ...( { outlineStyle: 'none', outlineWidth: 0, cursor: 'pointer' } as any ),
  },
})
