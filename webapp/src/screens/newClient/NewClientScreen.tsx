import React, { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'

import { saveCoacheeFromUpsert } from './workflows/clientsScreenFunctionality'
import { useLocalAppData } from '../../storage/LocalAppDataProvider'
import { colors } from '../../design/theme/colors'
import { Text } from '../../ui/Text'
import { SecuritySafeIcon } from '../../icons/SecuritySafeIcon'
import type { CoacheeUpsertValues } from '../../types/clientProfile'
import { NewClientForm } from './components/NewClientForm'
import { getNewClientTrajectoryLabel } from './selectors/newClientSelectors'
import { createInitialNewClientValues, isNewClientFormValid, sanitizeNewClientValues } from './viewModels/newClientViewModel'

type Props = {
  onBack: () => void
  onSaved: (clientId: string) => void
}

export function NewClientScreen({ onBack, onSaved }: Props) {
  const { data, createCoachee, createTrajectory, updateCoachee, updateTrajectory } = useLocalAppData()
  const [values, setValues] = useState<CoacheeUpsertValues>(() => createInitialNewClientValues())

  const canSave = isNewClientFormValid(values)
  const trajectoryLabel = getNewClientTrajectoryLabel(data)

  function setValue(key: keyof CoacheeUpsertValues, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }))
  }

  function handleSave() {
    if (!canSave) return
    const result = saveCoacheeFromUpsert({
      api: { createCoachee, createTrajectory, updateCoachee, updateTrajectory },
      data,
      mode: 'create',
      editCoacheeId: null,
      values: sanitizeNewClientValues(values),
    })
    if (!result.createdCoacheeId) return
    onSaved(result.createdCoacheeId)
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.privacyCard}>
          <SecuritySafeIcon color="#1E3A8A" size={18} />
          <View style={styles.privacyTextWrap}>
            <Text isSemibold style={styles.privacyTitle}>Privacy & AVG</Text>
            <Text style={styles.privacyBody}>
              Alle cliëntgegevens worden versleuteld opgeslagen conform AVG-richtlijnen en uitsluitend gebruikt voor re-integratiedoeleinden.
            </Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <View style={styles.formHeaderRow}>
            <Text isSemibold style={styles.sectionTitle}>Persoonlijke gegevens</Text>
            <Pressable
              onPress={handleSave}
              disabled={!canSave}
              style={({ hovered }) => [styles.primaryButton, !canSave ? styles.primaryButtonDisabled : undefined, hovered && canSave ? styles.primaryButtonHovered : undefined]}
            >
              <Text isSemibold style={styles.primaryButtonText}>Cliënt opslaan</Text>
            </Pressable>
          </View>
          <NewClientForm values={values} trajectoryLabel={trajectoryLabel} onChange={setValue} />
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  scroll: {
    flex: 1,
    marginHorizontal: -8,
    ...( { paddingHorizontal: 8 } as any ),
  },
  scrollContent: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    gap: 16,
    paddingBottom: 24,
  },
  privacyCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  privacyTextWrap: {
    flex: 1,
    gap: 6,
  },
  privacyTitle: {
    fontSize: 16,
    lineHeight: 20,
    color: '#1E3A8A',
  },
  privacyBody: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1E3A8A',
  },
  formCard: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE0E2',
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    ...( { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' } as any ),
  },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.textStrong,
  },
  primaryButton: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.selected,
    backgroundColor: colors.selected,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonHovered: {
    backgroundColor: '#A50058',
    borderColor: '#A50058',
  },
  primaryButtonDisabled: {
    backgroundColor: '#C6C6C6',
    borderColor: '#C6C6C6',
  },
  primaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
})
