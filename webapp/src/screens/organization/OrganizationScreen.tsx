// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native'

import { CircleCloseIcon } from '../../icons/CircleCloseIcon'
import { OrganizationColorPicker } from './components/OrganizationColorPicker'
import { PracticeExportIcon } from '../../icons/PracticeExportIcon'
import { Text } from '../../ui/Text'
import { TextInput } from '../../ui/inputs/TextInput'
import { WarningModal } from '../../ui/modals/WarningModal'
import { brandColors } from '../../design/tokens/colors'
import { fontSizes } from '../../design/tokens/fontSizes'
import { radius } from '../../design/tokens/radius'
import { useLocalAppData } from '../../storage/LocalAppDataProvider'
import { colors } from '../../design/theme/colors'
import {
  capitalizeFirstLetter,
  normalizeEmailValue,
  normalizeHouseNumberValue,
  normalizePhoneValue,
  normalizePostalCodeValue,
} from './viewModels/inputFormatters'

const brandControlSize = 110
const A4_ASPECT_RATIO = 210 / 297
const PDF_PREVIEW_HEIGHT = 396

function normalizeHexColor(value: string) {
  const trimmed = String(value || '').trim()
  if (!/^#[0-9a-fA-F]{6}$/.test(trimmed)) return '#BE0165'
  return trimmed.toUpperCase()
}

function splitPostalCodeCity(value: string): { postalCode: string; city: string } {
  const raw = String(value || '').trim()
  if (!raw) return { postalCode: '', city: '' }
  const match = raw.match(/\b\d{4}\s?[a-z]{2}\b/i)
  if (!match || match.index === undefined) return { postalCode: '', city: raw }
  return {
    postalCode: String(match[0] || '').toUpperCase().replace(/\s+/g, ''),
    city: raw
      .slice(match.index + match[0].length)
      .replace(/^[,\s-]+/, '')
      .trim(),
  }
}

function splitStreetAndHouseNumber(value: string): { street: string; houseNumber: string } {
  const raw = String(value || '').trim()
  if (!raw) return { street: '', houseNumber: '' }
  const match = raw.match(/^(.*?)(\d+[a-zA-Z0-9\-\/]*)$/)
  if (!match) return { street: raw, houseNumber: '' }
  return {
    street: String(match[1] || '').trim().replace(/,\s*$/, ''),
    houseNumber: String(match[2] || '').trim(),
  }
}

function combineStreetAndHouseNumber(street: string, houseNumber: string): string {
  return [String(street || '').trim(), String(houseNumber || '').trim()].filter(Boolean).join(' ').trim()
}

function placeholderForOrganizationLabel(label: string): string {
  if (label === 'Naam organisatie') return 'Bijv. Voorbeeld B.V.'
  if (label === 'Postadres straatnaam' || label === 'Bezoekadres straatnaam') return 'Bijv. Hoofdstraat'
  if (label === 'Postadres huisnummer' || label === 'Bezoekadres huisnummer') return 'Bijv. 12A'
  if (label === 'Postadres postcode' || label === 'Bezoekadres postcode') return 'Bijv. 1234 AB'
  if (label === 'Postadres plaats' || label === 'Bezoekadres plaats') return 'Bijv. Utrecht'
  if (label === 'Naam contactpersoon') return 'Bijv. Jan de Vries'
  if (label === 'Naam contactpersoon re-integratiebedrijf') return 'Bijv. Jan de Vries'
  if (label === 'Functie contactpersoon') return 'Bijv. Re-integratiecoach'
  if (label === 'Telefoonnummer contactpersoon') return 'Bijv. 0612345678'
  if (label === 'E-mailadres contactpersoon') return 'Bijv. naam@organisatie.nl'
  return 'Typ uw antwoord'
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Bestand kon niet worden gelezen.'))
    reader.onload = () => resolve(String(reader.result || ''))
    reader.readAsDataURL(file)
  })
}

export function OrganizationScreen() {
  const { width } = useWindowDimensions()
  const { data, updateOrganizationSettings, updateUserSettings } = useLocalAppData()
  const settings = data.organizationSettings
  const userSettings = data.userSettings
  const useStackedBrandLayout = width < 1360
  const initialPostalCodeCity = splitPostalCodeCity(settings.postalCodeCity)
  const initialVisitPostalCodeCity = splitPostalCodeCity(settings.visitPostalCodeCity || settings.postalCodeCity)
  const initialContactName = String(userSettings.name || settings.contactName || '')
  const initialContactRole = String(userSettings.role || settings.contactRole || '')
  const initialContactPhone = String(userSettings.phone || settings.contactPhone || '')
  const initialContactEmail = String(userSettings.email || settings.contactEmail || '')

  const [practiceNameDraft, setPracticeNameDraft] = useState(settings.practiceName)
  const [visitStreetDraft, setVisitStreetDraft] = useState(splitStreetAndHouseNumber(settings.visitAddress).street)
  const [visitHouseNumberDraft, setVisitHouseNumberDraft] = useState(splitStreetAndHouseNumber(settings.visitAddress).houseNumber)
  const [postStreetDraft, setPostStreetDraft] = useState(splitStreetAndHouseNumber(settings.postalAddress).street)
  const [postHouseNumberDraft, setPostHouseNumberDraft] = useState(splitStreetAndHouseNumber(settings.postalAddress).houseNumber)
  const [postPostalCodeDraft, setPostPostalCodeDraft] = useState(initialPostalCodeCity.postalCode)
  const [postCityDraft, setPostCityDraft] = useState(initialPostalCodeCity.city)
  const [visitPostalCodeDraft, setVisitPostalCodeDraft] = useState(initialVisitPostalCodeCity.postalCode)
  const [visitCityDraft, setVisitCityDraft] = useState(initialVisitPostalCodeCity.city)
  const [contactNameDraft, setContactNameDraft] = useState(initialContactName)
  const [contactRoleDraft, setContactRoleDraft] = useState(initialContactRole)
  const [contactPhoneDraft, setContactPhoneDraft] = useState(initialContactPhone)
  const [contactEmailDraft, setContactEmailDraft] = useState(initialContactEmail)
  const [activeTab, setActiveTab] = useState<'mijn-organisatie' | 'mijn-profiel'>('mijn-organisatie')
  const [tintColorDraft, setTintColorDraft] = useState(normalizeHexColor(settings.tintColor || '#BE0165'))
  const [isDragActive, setIsDragActive] = useState(false)
  const [isLogoHovered, setIsLogoHovered] = useState(false)
  const [isRemoveLogoConfirmOpen, setIsRemoveLogoConfirmOpen] = useState(false)
  const tintColorAutosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const logoDropAreaRef = useRef<View | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const hiddenFileInputStyle = useMemo(() => ({ position: 'absolute', opacity: 0, width: 0, height: 0 }), [])

  useEffect(() => {
    const normalizedDraft = normalizeHexColor(tintColorDraft)
    const normalizedStored = normalizeHexColor(settings.tintColor || '#BE0165')
    if (normalizedDraft === normalizedStored) {
      if (tintColorAutosaveTimeoutRef.current) {
        clearTimeout(tintColorAutosaveTimeoutRef.current)
        tintColorAutosaveTimeoutRef.current = null
      }
      return
    }

    if (tintColorAutosaveTimeoutRef.current) {
      clearTimeout(tintColorAutosaveTimeoutRef.current)
      tintColorAutosaveTimeoutRef.current = null
    }
    tintColorAutosaveTimeoutRef.current = setTimeout(() => {
      tintColorAutosaveTimeoutRef.current = null
      updateOrganizationSettings({ tintColor: normalizedDraft })
    }, 280)

    return () => {
      if (tintColorAutosaveTimeoutRef.current) {
        clearTimeout(tintColorAutosaveTimeoutRef.current)
        tintColorAutosaveTimeoutRef.current = null
      }
    }
  }, [settings.tintColor, tintColorDraft, updateOrganizationSettings])

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
    updateOrganizationSettings({ practiceName: nextValue })
  }

  function persistVisitAddress(nextStreet: string, nextHouseNumber: string) {
    updateOrganizationSettings({ visitAddress: combineStreetAndHouseNumber(nextStreet, nextHouseNumber) })
  }
  function persistPostalAddress(nextStreet: string, nextHouseNumber: string) {
    updateOrganizationSettings({ postalAddress: combineStreetAndHouseNumber(nextStreet, nextHouseNumber) })
  }
  function persistPostalCodeAndCity(nextPostalCode: string, nextCity: string) {
    const postalCode = String(nextPostalCode || '').trim().toUpperCase()
    const city = String(nextCity || '').trim()
    const combined = [postalCode, city].filter(Boolean).join(' ').trim()
    updateOrganizationSettings({ postalCodeCity: combined })
  }
  function persistVisitPostalCodeAndCity(nextPostalCode: string, nextCity: string) {
    const postalCode = String(nextPostalCode || '').trim().toUpperCase()
    const city = String(nextCity || '').trim()
    const combined = [postalCode, city].filter(Boolean).join(' ').trim()
    updateOrganizationSettings({ visitPostalCodeCity: combined })
  }
  function persistContactName(nextValue: string) {
    updateUserSettings({ name: nextValue })
    updateOrganizationSettings({ contactName: nextValue })
  }
  function persistContactRole(nextValue: string) {
    updateUserSettings({ role: nextValue })
    updateOrganizationSettings({ contactRole: nextValue })
  }
  function persistContactPhone(nextValue: string) {
    updateUserSettings({ phone: nextValue })
    updateOrganizationSettings({ contactPhone: nextValue })
  }
  function persistContactEmail(nextValue: string) {
    updateUserSettings({ email: nextValue })
    updateOrganizationSettings({ contactEmail: nextValue })
  }

  function persistTintColor(nextColor: string) {
    const normalized = normalizeHexColor(nextColor)
    setTintColorDraft(normalized)
    updateOrganizationSettings({ tintColor: normalized })
  }

  async function handleLogoFileSelected(file: File | null) {
    if (!file) return
    if (!file.type.startsWith('image/')) return
    const dataUrl = await readFileAsDataUrl(file)
    if (!dataUrl) return
    updateOrganizationSettings({ logoDataUrl: dataUrl })
  }

  function handleRemoveLogoConfirm() {
    updateOrganizationSettings({ logoDataUrl: null })
    setIsRemoveLogoConfirmOpen(false)
  }

  return (
    <ScrollView style={styles.screenScroll} contentContainerStyle={styles.screenScrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <View style={styles.headerTop}>
          <Text isSemibold style={styles.headerTitle}>
            Mijn praktijk
          </Text>
          <View style={styles.tabBar}>
            <Pressable
              style={[styles.tabButton, activeTab === 'mijn-organisatie' ? styles.tabButtonActive : undefined]}
              onPress={() => setActiveTab('mijn-organisatie')}
            >
              <Text isSemibold style={[styles.tabLabel, activeTab === 'mijn-organisatie' ? styles.tabLabelActive : undefined]}>
                Mijn organisatie
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tabButton, activeTab === 'mijn-profiel' ? styles.tabButtonActive : undefined]}
              onPress={() => setActiveTab('mijn-profiel')}
            >
              <Text isSemibold style={[styles.tabLabel, activeTab === 'mijn-profiel' ? styles.tabLabelActive : undefined]}>
                Mijn profiel
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.formSection}>
          <View style={styles.formCard}>
            <Text isSemibold style={styles.formCardTitle}>
              {activeTab === 'mijn-organisatie' ? 'Gegevens re-integratiebedrijf' : 'Mijn profiel'}
            </Text>
            {activeTab === 'mijn-organisatie' ? (
              <>
                <View style={styles.fieldGrid}>
                  <LabeledInput
                    label="Naam organisatie"
                    value={practiceNameDraft}
                    onChangeText={(nextValue) => {
                      setPracticeNameDraft(capitalizeFirstLetter(nextValue))
                    }}
                    onBlur={() => {
                      const normalized = capitalizeFirstLetter(practiceNameDraft)
                      setPracticeNameDraft(normalized)
                      persistPracticeName(normalized)
                    }}
                  />
                </View>
                <View style={styles.addressSectionsWrap}>
                  <View style={styles.addressSection}>
                    <Text isSemibold style={styles.addressSectionTitle}>Postadres</Text>
                    <View style={styles.addressSectionGrid}>
                      <LabeledInput
                        label="Postadres straatnaam"
                        value={postStreetDraft}
                        onChangeText={(nextValue) => {
                          setPostStreetDraft(capitalizeFirstLetter(nextValue))
                        }}
                        onBlur={() => persistPostalAddress(postStreetDraft, postHouseNumberDraft)}
                      />
                      <LabeledInput
                        label="Postadres huisnummer"
                        value={postHouseNumberDraft}
                        onChangeText={(nextValue) => {
                          setPostHouseNumberDraft(normalizeHouseNumberValue(nextValue))
                        }}
                        onBlur={() => {
                          const normalized = normalizeHouseNumberValue(postHouseNumberDraft)
                          setPostHouseNumberDraft(normalized)
                          persistPostalAddress(postStreetDraft, normalized)
                        }}
                      />
                      <LabeledInput
                        label="Postadres postcode"
                        value={postPostalCodeDraft}
                        onChangeText={(nextValue) => {
                          setPostPostalCodeDraft(normalizePostalCodeValue(nextValue))
                        }}
                        onBlur={() => {
                          const normalized = normalizePostalCodeValue(postPostalCodeDraft)
                          setPostPostalCodeDraft(normalized)
                          persistPostalCodeAndCity(normalized, postCityDraft)
                        }}
                      />
                      <LabeledInput
                        label="Postadres plaats"
                        value={postCityDraft}
                        onChangeText={(nextValue) => {
                          setPostCityDraft(capitalizeFirstLetter(nextValue))
                        }}
                        onBlur={() => persistPostalCodeAndCity(postPostalCodeDraft, postCityDraft)}
                      />
                    </View>
                  </View>
                  <View style={styles.addressSection}>
                    <Text isSemibold style={styles.addressSectionTitle}>Bezoekadres</Text>
                    <View style={styles.addressSectionGrid}>
                      <LabeledInput
                        label="Bezoekadres straatnaam"
                        value={visitStreetDraft}
                        onChangeText={(nextValue) => {
                          setVisitStreetDraft(capitalizeFirstLetter(nextValue))
                        }}
                        onBlur={() => persistVisitAddress(visitStreetDraft, visitHouseNumberDraft)}
                      />
                      <LabeledInput
                        label="Bezoekadres huisnummer"
                        value={visitHouseNumberDraft}
                        onChangeText={(nextValue) => {
                          setVisitHouseNumberDraft(normalizeHouseNumberValue(nextValue))
                        }}
                        onBlur={() => {
                          const normalized = normalizeHouseNumberValue(visitHouseNumberDraft)
                          setVisitHouseNumberDraft(normalized)
                          persistVisitAddress(visitStreetDraft, normalized)
                        }}
                      />
                      <LabeledInput
                        label="Bezoekadres postcode"
                        value={visitPostalCodeDraft}
                        onChangeText={(nextValue) => {
                          setVisitPostalCodeDraft(normalizePostalCodeValue(nextValue))
                        }}
                        onBlur={() => {
                          const normalized = normalizePostalCodeValue(visitPostalCodeDraft)
                          setVisitPostalCodeDraft(normalized)
                          persistVisitPostalCodeAndCity(normalized, visitCityDraft)
                        }}
                      />
                      <LabeledInput
                        label="Bezoekadres plaats"
                        value={visitCityDraft}
                        onChangeText={(nextValue) => {
                          setVisitCityDraft(capitalizeFirstLetter(nextValue))
                        }}
                        onBlur={() => persistVisitPostalCodeAndCity(visitPostalCodeDraft, visitCityDraft)}
                      />
                    </View>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.fieldGrid}>
                <LabeledInput
                  label="Naam contactpersoon"
                  value={contactNameDraft}
                  onChangeText={(nextValue) => {
                    setContactNameDraft(capitalizeFirstLetter(nextValue))
                  }}
                  onBlur={() => {
                    const normalized = capitalizeFirstLetter(contactNameDraft)
                    setContactNameDraft(normalized)
                    persistContactName(normalized)
                  }}
                />
                <LabeledInput
                  label="Functie contactpersoon"
                  value={contactRoleDraft}
                  onChangeText={(nextValue) => {
                    setContactRoleDraft(capitalizeFirstLetter(nextValue))
                  }}
                  onBlur={() => {
                    const normalized = capitalizeFirstLetter(contactRoleDraft)
                    setContactRoleDraft(normalized)
                    persistContactRole(normalized)
                  }}
                />
                <LabeledInput
                  label="Telefoonnummer contactpersoon"
                  value={contactPhoneDraft}
                  onChangeText={(nextValue) => {
                    const normalized = normalizePhoneValue(nextValue)
                    setContactPhoneDraft(normalized)
                  }}
                  onBlur={() => {
                    const normalized = normalizePhoneValue(contactPhoneDraft)
                    setContactPhoneDraft(normalized)
                    persistContactPhone(normalized)
                  }}
                />
                <LabeledInput
                  label="E-mailadres contactpersoon"
                  value={contactEmailDraft}
                  onChangeText={(nextValue) => {
                    setContactEmailDraft(nextValue)
                  }}
                  onBlur={() => {
                    const normalized = normalizeEmailValue(contactEmailDraft)
                    setContactEmailDraft(normalized)
                    persistContactEmail(normalized)
                  }}
                />
              </View>
            )}
          </View>

          {false ? (
        <View style={[styles.brandLayout, useStackedBrandLayout ? styles.brandLayoutStacked : undefined]}>
          <View style={styles.logoColorRow}>
            <View style={styles.colorColumn}>
              <Text isSemibold style={styles.fieldLabelText}>
                Kleur
              </Text>
              <View style={styles.colorPickerWrap}>
            <OrganizationColorPicker
                  value={tintColorDraft}
                  onPreviewChange={(nextColor) => setTintColorDraft(normalizeHexColor(nextColor))}
                  onCommit={(nextColor) => {
                    const normalized = normalizeHexColor(nextColor)
                    if (normalized === normalizeHexColor(settings.tintColor || '#BE0165')) {
                      setTintColorDraft(normalized)
                      return
                    }
                    persistTintColor(normalized)
                  }}
                />
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
                      <Image source={{ uri: String(settings.logoDataUrl || '') }} resizeMode="contain" style={styles.logoPreviewImage} />
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
                ) : (
                  null
                )}
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

          <PdfPreviewExample tintColor={tintColorDraft} logoDataUrl={settings.logoDataUrl} compact={useStackedBrandLayout} />
        </View>
          ) : null}
        </View>

        {false ? (
        <WarningModal
          visible={isRemoveLogoConfirmOpen}
          title="Logo verwijderen"
          description="Weet je zeker dat je het logo wilt verwijderen?"
          confirmLabel="Verwijderen"
          cancelLabel="Annuleren"
          onClose={() => setIsRemoveLogoConfirmOpen(false)}
          onConfirm={handleRemoveLogoConfirm}
        />
        ) : null}
      </View>
    </ScrollView>
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
  const multiline = false

  return (
    <View style={styles.fieldItem}>
      <Text style={styles.fieldLabel}>
        {label}
      </Text>
      <View style={[styles.inputWrap, multiline ? styles.inputWrapMultiline : undefined]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          placeholder={placeholderForOrganizationLabel(label)}
          placeholderTextColor="#8E8480"
          style={[styles.input, multiline ? styles.inputMultiline : undefined, inputWebStyle]}
        />
      </View>
    </View>
  )
}

type PdfPreviewExampleProps = {
  tintColor: string
  logoDataUrl: string | null
  compact: boolean
}

function PdfPreviewExample({ tintColor, logoDataUrl, compact }: PdfPreviewExampleProps) {
  return (
    <View style={[styles.pdfPreviewColumn, compact ? styles.pdfPreviewColumnCompact : undefined]}>
      <View style={styles.pdfPreviewPaper}>
        {logoDataUrl ? <Image source={{ uri: logoDataUrl }} resizeMode="contain" style={styles.pdfPreviewLogoImage} /> : null}
        <View style={styles.pdfPreviewBody}>
          <View style={[styles.pdfPreviewTitleLine, { backgroundColor: normalizeHexColor(tintColor) }]} />
          <View style={styles.pdfPreviewTextLine} />
          <View style={styles.pdfPreviewTextLine} />
          <View style={styles.pdfPreviewTextLine} />
          <View style={[styles.pdfPreviewTextLine, styles.pdfPreviewTextLineShort]} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screenScroll: { flex: 1 },
  screenScrollContent: { paddingBottom: 0 },
  container: {
    minHeight: 0,
    gap: 14,
    padding: 24,
    paddingBottom: 24,
    ...( { overflow: 'visible' } as any ),
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    lineHeight: 28,
    color: colors.text,
  },
  headerTop: {
    gap: 12,
  },
  tabBar: {
    flexDirection: 'row',
    gap: 10,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#DFE0E2',
    backgroundColor: '#FFFFFF',
  },
  tabButtonActive: {
    borderColor: '#BE0165',
    backgroundColor: '#FCEFF5',
  },
  tabLabel: {
    fontSize: 13,
    lineHeight: 16,
    color: '#5B5158',
  },
  tabLabelActive: {
    color: '#BE0165',
  },
  formSection: {
    width: '100%',
    ...( { maxWidth: 'min(1280px, 100%)' } as any ),
    gap: 14,
  },
  formCard: { borderRadius: 12, borderWidth: 1, borderColor: '#DFE0E2', backgroundColor: '#FFFFFF', padding: 16, gap: 12, ...( { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' } as any ) },
  formCardTitle: { flex: 1, fontSize: 16, lineHeight: 20, color: '#2C111F' },
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  fieldItem: { width: '48.5%', gap: 6 },
  fieldLabelText: { fontSize: 14, lineHeight: 18, color: '#2C111F' },
  fieldLabel: { fontSize: 14, lineHeight: 18, color: '#2C111F' },
  addressSectionsWrap: { gap: 12 },
  addressSection: { gap: 8 },
  addressSectionTitle: { fontSize: 14, lineHeight: 18, color: '#2C111F' },
  addressSectionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  inputWrap: { minHeight: 48, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', paddingHorizontal: 12, justifyContent: 'center' },
  inputWrapMultiline: { minHeight: 96, paddingTop: 10, paddingBottom: 10 },
  input: { width: '100%', padding: 0, fontSize: 14, lineHeight: 20, color: '#2C111F' },
  inputMultiline: { minHeight: 76, ...( { overflow: 'hidden' } as any ) },
  brandLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 28,
  },
  brandLayoutStacked: {
    flexDirection: 'column',
    gap: 18,
  },
  logoColorRow: {
    flexDirection: 'column',
    gap: 14,
    paddingBottom: 28,
  },
  logoColumn: {
    width: brandControlSize * 3,
    maxWidth: '100%',
    gap: 8,
  },
  colorColumn: {
    width: 176,
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
  pdfPreviewColumn: {
    paddingTop: 28,
  },
  pdfPreviewColumnCompact: {
    paddingTop: 0,
  },
  pdfPreviewPaper: {
    height: PDF_PREVIEW_HEIGHT,
    aspectRatio: A4_ASPECT_RATIO,
    maxWidth: '100%',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    overflow: 'hidden',
  },
  pdfPreviewLogoImage: {
    ...( { position: 'absolute', top: 20, right: 12 } as any ),
    width: 44,
    height: 21,
  },
  pdfPreviewBody: {
    flex: 1,
    gap: 8,
    paddingTop: 34,
  },
  pdfPreviewTitleLine: {
    width: '68%',
    height: 8,
    borderRadius: 999,
  },
  pdfPreviewTextLine: {
    width: '100%',
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D9D9D9',
  },
  pdfPreviewTextLineShort: {
    width: '74%',
  },
})






