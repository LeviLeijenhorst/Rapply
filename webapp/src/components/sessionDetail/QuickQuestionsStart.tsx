import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native'

import { Text } from '../../ui/Text'
import { colors } from '../../design/theme/colors'
import { RotateLeftIcon } from '../../icons/RotateLeftIcon'
import { AnimatedOverlayModal } from '../../ui/AnimatedOverlayModal'

type QuickQuestionOption = {
  id: string
  text: string
  promptText: string
  templateId?: string
}

type Props = {
  templates: { id: string; name: string; promptText?: string; templateId?: string }[]
  onSelectOption: (option: { text: string; promptText: string; templateId?: string }) => void
}

const curatedCoachOptions: QuickQuestionOption[] = [
  { id: 'coach-summary', text: 'een korte samenvatting van dit gesprek', promptText: 'Geef een korte, heldere samenvatting van dit gesprek in maximaal 8 punten.' },
  { id: 'coach-core-insights', text: 'de belangrijkste inzichten uit dit gesprek', promptText: 'Noem de belangrijkste inzichten uit dit gesprek, geordend op impact voor de client.' },
  { id: 'coach-actionpoints', text: 'alle actiepunten uit dit gesprek op een rij', promptText: 'Zet alle actiepunten uit dit gesprek overzichtelijk onder elkaar met eigenaar (coach/client).' },
  { id: 'coach-client-actions', text: 'alleen de actiepunten voor de client', promptText: 'Geef alleen de actiepunten die door de client uitgevoerd moeten worden.' },
  { id: 'coach-coach-actions', text: 'alleen de actiepunten voor de coach', promptText: 'Geef alleen de actiepunten die door de coach opgepakt moeten worden.' },
  { id: 'coach-deadlines', text: 'een overzicht met actiepunten en deadlines', promptText: 'Maak een overzicht met actiepunten en realistische deadlines op basis van dit gesprek.' },
  { id: 'coach-risks', text: 'risicos en aandachtspunten benoemd hebben', promptText: 'Benoem de belangrijkste risicos en aandachtspunten die in dit gesprek naar voren komen.' },
  { id: 'coach-barriers', text: 'de belangrijkste belemmeringen in kaart', promptText: 'Zet de belangrijkste belemmeringen voor werkhervatting of loopbaanstappen op een rij.' },
  { id: 'coach-facilitators', text: 'de helpende factoren overzichtelijk zien', promptText: 'Noem de helpende factoren die de voortgang van de client ondersteunen.' },
  { id: 'coach-strengths', text: 'sterke punten en talenten van de client', promptText: 'Haal uit dit gesprek de sterke punten, competenties en talenten van de client.' },
  { id: 'coach-values', text: 'waarden en motivatiebronnen van de client', promptText: 'Welke waarden, drijfveren en motivatiebronnen van de client blijken uit dit gesprek?' },
  { id: 'coach-goals-smart', text: 'de doelen omzetten naar SMART doelen', promptText: 'Zet de besproken doelen om naar SMART geformuleerde doelen.' },
  { id: 'coach-goal-check', text: 'toetsen of de doelen haalbaar zijn', promptText: 'Beoordeel de haalbaarheid van de besproken doelen en licht kort toe waarom.' },
  { id: 'coach-week-plan', text: 'een weekplanning voor de client', promptText: 'Maak een praktische weekplanning met concrete taken voor de client.' },
  { id: 'coach-two-week-plan', text: 'een plan voor de komende 2 weken', promptText: 'Maak een stap-voor-stap plan voor de komende 2 weken op basis van dit gesprek.' },
  { id: 'coach-thirty-day-plan', text: 'een 30-dagen plan voor reintegratie', promptText: 'Maak een praktisch 30-dagen plan voor reintegratie op basis van dit gesprek.' },
  { id: 'coach-next-session-questions', text: 'gerichte vragen voor de volgende sessie', promptText: 'Geef 12 gerichte coachvragen voor de volgende sessie, passend bij dit gesprek.' },
  { id: 'coach-reflection-questions', text: 'reflectievragen voor de client', promptText: 'Formuleer sterke reflectievragen die eigenaarschap en zelfinzicht vergroten.' },
  { id: 'coach-session-opening', text: 'een sterke opening voor de volgende afspraak', promptText: 'Schrijf een korte, professionele opening voor de volgende sessie.' },
  { id: 'coach-session-closing', text: 'een duidelijke afsluiting voor de sessie', promptText: 'Schrijf een korte afsluiting met samenvatting en vervolgafspraken.' },
  { id: 'coach-followup-mail', text: 'een follow-up mail naar de client', promptText: 'Schrijf een nette follow-up mail aan de client met samenvatting en afspraken.' },
  { id: 'coach-progress-check', text: 'evaluatievragen voor voortgang', promptText: 'Maak een set evaluatievragen om voortgang in de volgende sessie te meten.' },
  { id: 'coach-priorities', text: 'prioriteiten voor de komende periode', promptText: 'Bepaal de topprioriteiten voor de client voor de komende periode.' },
  { id: 'coach-first-step', text: 'alles terugbrengen naar de eerste kleine stap', promptText: 'Vertaal de doelen uit dit gesprek naar de eerstvolgende kleinste uitvoerbare stap.' },
  { id: 'coach-obstacles-alternatives', text: 'per obstakel een alternatief plan', promptText: 'Noem per belemmering een concreet alternatief of back-up scenario.' },
  { id: 'coach-energy-balance', text: 'balans tussen belastbaarheid en opbouw', promptText: 'Geef advies voor opbouw van activiteiten in balans met belastbaarheid.' },
  { id: 'coach-relapse-signals', text: 'signalen van terugval en preventie', promptText: 'Noem signalen van mogelijke terugval en passende preventieve acties.' },
  { id: 'coach-job-directions', text: 'passende functierichtingen verkennen', promptText: 'Noem logische functierichtingen op basis van kwaliteiten en wensen uit dit gesprek.' },
  { id: 'coach-labour-market-angles', text: 'kansrijke arbeidsmarkthoeken op een rij', promptText: 'Noem kansrijke arbeidsmarkthoeken die passen bij het profiel uit dit gesprek.' },
  { id: 'coach-cv-focus', text: 'advies voor de focus van het cv', promptText: 'Geef concrete cv-verbeterpunten op basis van het gesprek en het doel van de client.' },
  { id: 'coach-motivation-letter', text: 'een opzet voor een motivatiebrief', promptText: 'Maak een sterke basisopzet voor een motivatiebrief die past bij dit profiel.' },
  { id: 'coach-interview-prep', text: 'voorbereiding op een sollicitatiegesprek', promptText: 'Geef een praktische voorbereiding voor een sollicitatiegesprek met voorbeeldvragen.' },
  { id: 'coach-network-plan', text: 'een netwerkplan met concrete acties', promptText: 'Maak een concreet netwerkplan met acties, frequentie en opvolging.' },
  { id: 'coach-linkedin-plan', text: 'een verbeterplan voor LinkedIn-profiel', promptText: 'Geef concrete verbeterpunten voor LinkedIn op basis van dit gesprek.' },
  { id: 'coach-reintegration-track', text: 'opties voor het reintegratietraject', promptText: 'Geef passende opties voor vervolgstappen binnen een reintegratietraject.' },
  { id: 'coach-employer-feedback', text: 'een neutrale terugkoppeling voor werkgever', promptText: 'Maak een neutrale, professionele terugkoppeling voor een werkgever zonder privacygevoelige details.' },
  { id: 'coach-case-note', text: 'een nette dossiernotitie van dit gesprek', promptText: 'Schrijf een beknopte en professionele dossiernotitie van dit gesprek.' },
  { id: 'coach-next-appointment', text: 'een voorstel voor agenda volgende sessie', promptText: 'Stel een concrete agenda op voor de volgende sessie met doel per onderdeel.' },
  { id: 'coach-communication-plan', text: 'een communicatieplan tussen sessies', promptText: 'Maak een communicatieplan voor contactmomenten tussen nu en de volgende sessie.' },
]

function buildOptions(templates: { id: string; name: string; promptText?: string; templateId?: string }[]): QuickQuestionOption[] {
  const templateOptions = templates
    .map((template) => {
      const rawText = String(template.name || '').trim()
      const hasArticlePrefix = /^(een|de|het)\s+/i.test(rawText)
      const text = hasArticlePrefix ? rawText : `een ${rawText}`
      const promptText = String(template.promptText || '').trim() || text
      const templateId = String(template.templateId || template.id || '').trim() || undefined
      return { id: String(template.id || '').trim(), text, promptText, templateId }
    })
    .filter((template) => template.id.length > 0 && template.text.length > 0 && template.promptText.length > 0)

  const uniqueOptions = new Map<string, QuickQuestionOption>()
  for (const option of [...curatedCoachOptions, ...templateOptions]) {
    const key = `${option.text.trim().toLowerCase()}||${option.promptText.trim().toLowerCase()}`
    if (!uniqueOptions.has(key)) uniqueOptions.set(key, option)
  }
  return Array.from(uniqueOptions.values())
}

function shuffleOptions(options: QuickQuestionOption[]) {
  const nextOptions = [...options]
  for (let index = nextOptions.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(Math.random() * (index + 1))
    const temp = nextOptions[index]
    nextOptions[index] = nextOptions[nextIndex]
    nextOptions[nextIndex] = temp
  }
  return nextOptions
}

export function QuickQuestionsStart({ templates, onSelectOption }: Props) {
  const opacity = useRef(new Animated.Value(1)).current
  const translateY = useRef(new Animated.Value(0)).current
  const [isAnimating, setIsAnimating] = useState(false)
  const baseOptions = useMemo(() => buildOptions(templates), [templates])
  const [optionsOrder, setOptionsOrder] = useState<QuickQuestionOption[]>(() => shuffleOptions(baseOptions))
  const [activeIndex, setActiveIndex] = useState(0)
  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const optionsOrderRef = useRef<QuickQuestionOption[]>(optionsOrder)
  const activeIndexRef = useRef(activeIndex)
  const visibleOptions = optionsOrder.length > 0 ? [optionsOrder[activeIndex % optionsOrder.length]] : []
  const selectedOption = optionsOrder.find((option) => option.id === selectedOptionId) ?? null

  function animateOptions(onNext: () => void) {
    if (isAnimating) return
    setIsAnimating(true)
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 8, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      onNext()
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]).start(() => setIsAnimating(false))
    })
  }

  function refreshOptions() {
    const order = optionsOrderRef.current
    if (order.length === 0) return
    const nextIndex = (activeIndexRef.current + 1) % order.length
    animateOptions(() => setActiveIndex(nextIndex))
  }

  useEffect(() => {
    const nextOrder = shuffleOptions(baseOptions)
    setOptionsOrder(nextOrder)
    setActiveIndex(0)
  }, [baseOptions])

  useEffect(() => {
    optionsOrderRef.current = optionsOrder
  }, [optionsOrder])

  useEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])

  useEffect(() => {
    if (optionsOrderRef.current.length === 0) return
    const intervalId = setInterval(() => {
      if (isAnimating) return
      refreshOptions()
    }, 5000)
    return () => clearInterval(intervalId)
  }, [optionsOrder.length, isAnimating])

  useEffect(() => {
    if (optionsOrder.length === 0) {
      setSelectedOptionId(null)
      return
    }
    setSelectedOptionId((previous) => {
      if (previous && optionsOrder.some((option) => option.id === previous)) return previous
      return optionsOrder[0].id
    })
  }, [optionsOrder])

  return (
    <View style={styles.container}>
      {/* Intro line */}
      <Text isSemibold style={styles.titleText}>
        Ik wil...
      </Text>

      <Animated.View style={[styles.optionsContainer, { opacity, transform: [{ translateY }] }]}>
        {/* Quick question options */}
        {visibleOptions.map((option) => (
          <Pressable
            key={option.id}
            onPress={() => onSelectOption({ text: option.text, promptText: option.promptText, templateId: option.templateId })}
            style={({ hovered }) => [styles.optionTextButton, hovered ? styles.optionTextButtonHovered : undefined]}
          >
            {/* Quick option text */}
            <Text style={styles.optionText}>{option.text}</Text>
          </Pressable>
        ))}
      </Animated.View>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={refreshOptions}
          style={({ hovered }) => [styles.circleButton, hovered ? styles.circleButtonHovered : undefined]}
        >
          {/* Refresh options */}
          <RotateLeftIcon size={18} color={colors.textSecondary} />
        </Pressable>
        <Pressable
          onPress={() => setIsOptionsModalVisible(true)}
          style={({ hovered }) => [styles.circleButton, hovered ? styles.circleButtonHovered : undefined]}
        >
          {/* Open all options modal */}
          <View style={styles.listIcon}>
            <View style={styles.listIconLine} />
            <View style={styles.listIconLine} />
            <View style={styles.listIconLine} />
          </View>
        </Pressable>
      </View>

      <AnimatedOverlayModal visible={isOptionsModalVisible} onClose={() => setIsOptionsModalVisible(false)} contentContainerStyle={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalBody}>
            <View style={styles.modalHeader}>
              <Text isSemibold style={styles.modalTitle}>
                Ik wil...
              </Text>
            </View>
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              {optionsOrder.map((option) => {
                const isSelected = selectedOptionId === option.id
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setSelectedOptionId(option.id)}
                    style={({ hovered }) => [
                      styles.modalOptionRow,
                      isSelected ? styles.modalOptionRowSelected : undefined,
                      hovered ? styles.modalOptionRowHovered : undefined,
                    ]}
                  >
                    <Text style={styles.modalOptionText}>{option.text}</Text>
                  </Pressable>
                )
              })}
            </ScrollView>
          </View>
          <View style={styles.modalFooter}>
            <Pressable
              onPress={() => setIsOptionsModalVisible(false)}
              style={({ hovered }) => [styles.modalFooterSecondaryButton, hovered ? styles.modalFooterSecondaryButtonHovered : undefined]}
            >
              <Text isBold style={styles.modalFooterSecondaryButtonText}>
                Annuleren
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (!selectedOption) return
                onSelectOption({ text: selectedOption.text, promptText: selectedOption.promptText, templateId: selectedOption.templateId })
                setIsOptionsModalVisible(false)
              }}
              disabled={!selectedOption}
              style={({ hovered }) => [
                styles.modalFooterPrimaryButton,
                hovered ? styles.modalFooterPrimaryButtonHovered : undefined,
                !selectedOption ? styles.modalFooterPrimaryButtonDisabled : undefined,
              ]}
            >
              <Text isBold style={styles.modalFooterPrimaryButtonText}>
                Selecteren
              </Text>
            </Pressable>
          </View>
        </View>
      </AnimatedOverlayModal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.textStrong,
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
  },
  optionTextButton: {
    padding: 8,
  },
  optionTextButtonHovered: {
    backgroundColor: colors.hoverBackground,
    borderRadius: 8,
  },
  optionText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  circleButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  listIcon: {
    width: 14,
    gap: 3,
  },
  listIconLine: {
    width: '100%',
    height: 1.75,
    borderRadius: 999,
    backgroundColor: colors.textSecondary,
  },
  modalContainer: {
    width: 560,
    maxWidth: '100%',
  },
  modalContent: {
    width: '100%',
    maxHeight: 640,
    overflow: 'hidden',
  },
  modalBody: {
    width: '100%',
    padding: 18,
    gap: 14,
  },
  modalHeader: {
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    lineHeight: 22,
    color: colors.textStrong,
  },
  modalScroll: {
    maxHeight: 420,
  },
  modalScrollContent: {
    gap: 8,
  },
  modalOptionRow: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  modalOptionRowHovered: {
    backgroundColor: colors.hoverBackground,
  },
  modalOptionRowSelected: {
    borderColor: 'transparent',
    backgroundColor: '#FFF2F8',
  },
  modalOptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  modalFooter: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalFooterSecondaryButton: {
    height: 48,
    borderRadius: 0,
    borderBottomLeftRadius: 16,
    backgroundColor: colors.surface,
    paddingHorizontal: 24,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFooterSecondaryButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  modalFooterSecondaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  modalFooterPrimaryButton: {
    height: 48,
    borderRadius: 0,
    borderBottomRightRadius: 16,
    backgroundColor: colors.selected,
    paddingHorizontal: 24,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFooterPrimaryButtonHovered: {
    backgroundColor: '#A50058',
  },
  modalFooterPrimaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  modalFooterPrimaryButtonDisabled: {
    opacity: 0.5,
  },
})


