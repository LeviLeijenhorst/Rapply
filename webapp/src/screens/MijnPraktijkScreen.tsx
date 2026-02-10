import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native'

import { CoachscribeWordmarkIcon } from '../components/icons/CoachscribeWordmarkIcon'
import { PracticeColorIcon } from '../components/icons/PracticeColorIcon'
import { PracticeEditFieldIcon } from '../components/icons/PracticeEditFieldIcon'
import { PracticeExportIcon } from '../components/icons/PracticeExportIcon'
import { Text } from '../components/Text'
import { colors } from '../theme/colors'

const PRESET_COLORS = ['#BE0165', '#9B59B6', '#2E86DE', '#0FA958', '#E67E22', '#D63447', '#1D0A00', '#656565']

export function MijnPraktijkScreen() {
  const [praktijkNaam, setPraktijkNaam] = useState('')
  const [website, setWebsite] = useState('')
  const [tintColor, setTintColor] = useState('#BE0165')
  const [logoPreviewUri, setLogoPreviewUri] = useState<string | null>(null)
  const [logoFileName, setLogoFileName] = useState<string | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false)
  const logoDropAreaRef = useRef<View | null>(null)
  const colorMenuTriggerRef = useRef<View | null>(null)
  const colorMenuRef = useRef<View | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const hiddenFileInputStyle = useMemo(() => ({ position: 'absolute', opacity: 0, width: 0, height: 0 }), [])
  const colorInputStyle = useMemo(
    () => ({ width: 42, height: 30, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }),
    [],
  )

  const footerLine = useMemo(() => {
    const parts = [praktijkNaam.trim(), website.trim()].filter((part) => part.length > 0)
    if (parts.length === 0) return ''
    return parts.join(' | ')
  }, [praktijkNaam, website])

  const handleLogoFileSelected = useCallback(
    (file: File | null) => {
      if (!file) return
      if (!file.type.startsWith('image/')) return
      if (logoPreviewUri) {
        URL.revokeObjectURL(logoPreviewUri)
      }
      const nextUri = URL.createObjectURL(file)
      setLogoPreviewUri(nextUri)
      setLogoFileName(file.name)
    },
    [logoPreviewUri],
  )

  useEffect(() => {
    return () => {
      if (!logoPreviewUri) return
      URL.revokeObjectURL(logoPreviewUri)
    }
  }, [logoPreviewUri])

  useEffect(() => {
    if (!isColorMenuOpen) return
    if (typeof document === 'undefined') return
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      const triggerElement = colorMenuTriggerRef.current as any
      const menuElement = colorMenuRef.current as any
      if (triggerElement?.contains?.(target) || menuElement?.contains?.(target)) return
      setIsColorMenuOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
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
      const inside = isInsideDropArea(event)
      if (!inside) return
      event.preventDefault()
      event.stopPropagation()
      setIsDragActive(false)
      const droppedFile = extractFileFromDragEvent(event)
      handleLogoFileSelected(droppedFile)
    }

    window.addEventListener('dragover', onDragOver, true)
    window.addEventListener('dragleave', onDragLeave, true)
    window.addEventListener('drop', onDrop, true)
    return () => {
      window.removeEventListener('dragover', onDragOver, true)
      window.removeEventListener('dragleave', onDragLeave, true)
      window.removeEventListener('drop', onDrop, true)
    }
  }, [handleLogoFileSelected])

  return (
    <View style={styles.container}>
      <Text isSemibold style={styles.headerTitle}>
        Mijn praktijk
      </Text>

      <View style={styles.formSection}>
        <LabeledInput label="Naam praktijk" value={praktijkNaam} onChangeText={setPraktijkNaam} />
        <LabeledInput label="Website" value={website} onChangeText={setWebsite} />

        <View style={styles.logoColorRow}>
          <View style={styles.logoColumn}>
            <Text isSemibold style={styles.fieldLabelText}>
              Logo
            </Text>
            <View ref={logoDropAreaRef} style={[styles.logoUploadBox, isDragActive ? styles.logoUploadBoxActive : undefined]}>
              <Pressable style={({ hovered }) => [styles.logoUploadPressable, hovered ? styles.logoUploadPressableHovered : undefined]} onPress={() => fileInputRef.current?.click()}>
                {logoPreviewUri ? (
                  <View style={styles.logoPreviewWrap}>
                    <Image source={{ uri: logoPreviewUri }} resizeMode="contain" style={styles.logoPreviewImage} />
                    <Text numberOfLines={1} style={styles.logoFileName}>
                      {logoFileName}
                    </Text>
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
                  handleLogoFileSelected(event.currentTarget.files?.[0] ?? null)
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
                style={({ hovered }) => [styles.colorCard, { backgroundColor: tintColor }, hovered ? styles.colorCardHovered : undefined]}
              >
                <PracticeColorIcon />
              </Pressable>
              {isColorMenuOpen ? (
                <View ref={colorMenuRef} style={styles.colorMenu}>
                  <View style={styles.colorSwatchGrid}>
                    {PRESET_COLORS.map((color) => (
                      <Pressable key={color} onPress={() => setTintColor(color)} style={[styles.colorSwatch, { backgroundColor: color }, tintColor === color ? styles.colorSwatchSelected : undefined]} />
                    ))}
                  </View>
                  <View style={styles.customColorRow}>
                    <Text style={styles.customColorLabel}>Eigen kleur</Text>
                    <input
                      type="color"
                      value={tintColor}
                      onChange={(event) => setTintColor(event.currentTarget.value)}
                      style={colorInputStyle as any}
                    />
                  </View>
                </View>
              ) : null}
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
                <Text isBold style={[styles.documentTitle, { color: tintColor }]}>Titel van het verslag</Text>
                <Text style={styles.documentDate}>07/02/2026</Text>
              </View>
              <View style={styles.documentLogoSlot}>
                {logoPreviewUri ? <Image source={{ uri: logoPreviewUri }} resizeMode="contain" style={styles.documentLogoImage} /> : <CoachscribeWordmarkIcon />}
              </View>
            </View>

            <View style={[styles.documentDivider, { backgroundColor: tintColor }]} />

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
    </View>
  )
}

type LabeledInputProps = {
  label: string
  value: string
  onChangeText: (value: string) => void
  placeholder?: string
}

function LabeledInput({ label, value, onChangeText, placeholder }: LabeledInputProps) {
  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any

  return (
    <View style={styles.inputGroup}>
      <Text isSemibold style={styles.fieldLabelText}>
        {label}
      </Text>
      <View style={styles.inputRow}>
        <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#656565" style={[styles.input, inputWebStyle]} />
        <PracticeEditFieldIcon />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 14,
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
    gap: 12,
  },
  logoPreviewImage: {
    width: '100%',
    height: 130,
  },
  logoFileName: {
    fontSize: 12,
    lineHeight: 16,
    color: '#656565',
    maxWidth: '100%',
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
  colorMenu: {
    position: 'absolute',
    top: 228,
    left: 0,
    width: 300,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
    ...( { boxShadow: '0 14px 32px rgba(0,0,0,0.16)', zIndex: 20 } as any ),
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
