import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native'

import { CoachscribeWordmarkIcon } from '../components/icons/CoachscribeWordmarkIcon'
import { PracticeColorIcon } from '../components/icons/PracticeColorIcon'
import { PracticeEditFieldIcon } from '../components/icons/PracticeEditFieldIcon'
import { PracticeExportIcon } from '../components/icons/PracticeExportIcon'
import { Text } from '../components/Text'
import { useLocalAppData } from '../local/LocalAppDataProvider'
import { colors } from '../theme/colors'

const PRESET_COLORS = ['#BE0165', '#A50058', '#7E0056', '#D63447', '#E67E22', '#0FA958', '#2E86DE', '#1D0A00']

function normalizeHexColor(value: string) {
  const trimmed = String(value || '').trim()
  if (!/^#[0-9a-fA-F]{6}$/.test(trimmed)) return '#BE0165'
  return trimmed.toUpperCase()
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
  const [isDragActive, setIsDragActive] = useState(false)
  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false)
  const [colorMenuAnchor, setColorMenuAnchor] = useState<{ x: number; y: number } | null>(null)

  const logoDropAreaRef = useRef<View | null>(null)
  const colorMenuTriggerRef = useRef<View | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const hiddenFileInputStyle = useMemo(() => ({ position: 'absolute', opacity: 0, width: 0, height: 0 }), [])
  const browserColorInputStyle = useMemo(() => ({ width: 44, height: 32, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }), [])

  const footerLine = useMemo(() => {
    const parts = [practiceNameDraft.trim(), websiteDraft.trim()].filter((part) => part.length > 0)
    return parts.join(' | ')
  }, [practiceNameDraft, websiteDraft])

  useEffect(() => {
    setPracticeNameDraft(settings.practiceName)
    setWebsiteDraft(settings.website)
    setTintColorDraft(normalizeHexColor(settings.tintColor || '#BE0165'))
  }, [settings.practiceName, settings.website, settings.tintColor])

  useEffect(() => {
    if (!isColorMenuOpen) return
    if (typeof document === 'undefined') return

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      const triggerElement = colorMenuTriggerRef.current as any
      const menuElement = document.getElementById('practice-color-menu')
      if (triggerElement?.contains?.(target) || menuElement?.contains(target)) return
      setIsColorMenuOpen(false)
    }

    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [isColorMenuOpen])

  useEffect(() => {
    if (!isColorMenuOpen) return
    const trigger = colorMenuTriggerRef.current as any
    const rect = trigger?.getBoundingClientRect?.()
    if (!rect) return
    setColorMenuAnchor({ x: rect.left, y: rect.bottom + 8 })
  }, [isColorMenuOpen])

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
    setTintColorDraft(normalized)
    updatePracticeSettings({ tintColor: normalized })
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
              <Pressable
                ref={colorMenuTriggerRef}
                onPress={() => setIsColorMenuOpen((current) => !current)}
                style={({ hovered }) => [styles.colorCard, { backgroundColor: tintColorDraft }, hovered ? styles.colorCardHovered : undefined]}
              >
                <PracticeColorIcon />
              </Pressable>
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
                <Text isBold style={[styles.documentTitle, { color: tintColorDraft }]}>Titel van het verslag</Text>
                <Text style={styles.documentDate}>07/02/2026</Text>
              </View>
              <View style={styles.documentLogoSlot}>
                {settings.logoDataUrl ? <Image source={{ uri: settings.logoDataUrl }} resizeMode="contain" style={styles.documentLogoImage} /> : <CoachscribeWordmarkIcon />}
              </View>
            </View>

            <View style={[styles.documentDivider, { backgroundColor: tintColorDraft }]} />

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
              <Text style={styles.documentFooterText}>{footerLine}</Text>
            </View>
          </View>
        </View>
      </View>

      {isColorMenuOpen && colorMenuAnchor ? (
        <View
          id="practice-color-menu"
          style={[
            styles.colorMenuFixed,
            {
              ...( { left: colorMenuAnchor.x, top: colorMenuAnchor.y } as any ),
            },
          ]}
        >
          <View style={styles.colorSwatchGrid}>
            {PRESET_COLORS.map((color) => (
              <Pressable
                key={color}
                onPress={() => persistTintColor(color)}
                style={[styles.colorSwatch, { backgroundColor: color }, tintColorDraft === color ? styles.colorSwatchSelected : undefined]}
              />
            ))}
          </View>
          <View style={styles.customColorRow}>
            <Text style={styles.customColorLabel}>Alle kleuren</Text>
            <input
              type="color"
              value={tintColorDraft}
              onChange={(event) => persistTintColor(event.currentTarget.value)}
              style={browserColorInputStyle as any}
            />
          </View>
          <TextInput
            value={tintColorDraft}
            onChangeText={(nextValue) => {
              setTintColorDraft(nextValue)
              if (/^#[0-9a-fA-F]{6}$/.test(nextValue)) {
                persistTintColor(nextValue)
              }
            }}
            placeholder="#BE0165"
            placeholderTextColor="#656565"
            style={styles.hexInput}
          />
        </View>
      ) : null}
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

  return (
    <View style={styles.inputGroup}>
      <Text isSemibold style={styles.fieldLabelText}>
        {label}
      </Text>
      <View style={styles.inputRow}>
        <TextInput value={value} onChangeText={onChangeText} onBlur={onBlur} placeholderTextColor="#656565" style={[styles.input, inputWebStyle]} />
        <PracticeEditFieldIcon />
      </View>
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
  },
  input: {
    flex: 1,
    padding: 0,
    fontSize: 16,
    lineHeight: 20,
    color: colors.textStrong,
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
  },
  colorCardHovered: {
    opacity: 0.93,
  },
  colorMenuFixed: {
    ...( { position: 'fixed', zIndex: 10000, width: 280 } as any ),
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
    ...( { boxShadow: '0 14px 32px rgba(0,0,0,0.16)' } as any ),
  },
  colorSwatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorSwatch: {
    width: 30,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...( { boxShadow: '0 0 0 1px rgba(0,0,0,0.22)' } as any ),
  },
  customColorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  customColorLabel: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  hexInput: {
    width: '100%',
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    fontSize: 13,
    lineHeight: 16,
    color: colors.textStrong,
    ...( { outlineStyle: 'none', outlineWidth: 0 } as any ),
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
    padding: 24,
    gap: 16,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  documentHeaderText: {
    gap: 4,
  },
  documentTitle: {
    fontSize: 22,
    lineHeight: 26,
  },
  documentDate: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  documentLogoSlot: {
    width: 82,
    height: 24,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  documentLogoImage: {
    width: '100%',
    height: '100%',
  },
  documentDivider: {
    width: '100%',
    height: 2,
  },
  documentBody: {
    gap: 10,
  },
  documentSectionTitle: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  documentParagraph: {
    fontSize: 10,
    lineHeight: 14,
    color: colors.text,
  },
  documentBullet: {
    fontSize: 10,
    lineHeight: 14,
    color: colors.text,
  },
  documentFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 8,
  },
  documentFooterText: {
    fontSize: 10,
    lineHeight: 14,
    color: colors.textSecondary,
  },
})
