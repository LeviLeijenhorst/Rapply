import React, { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { colors } from '../../../design/theme/colors'
import { fontSizes } from '../../../design/tokens/fontSizes'
import { radius } from '../../../design/tokens/radius'
import { spacing } from '../../../design/tokens/spacing'
import { ArrowDownIcon } from '../../../icons/ArrowDownIcon'
import type { Session } from '../../../storage/types'
import { LoadingSpinner } from '../../../ui/LoadingSpinner'
import { Text } from '../../../ui/Text'
import { SessionEditIcon, SessionExportIcon } from './SessionIcons'

type Props = {
  summary: string | null
  summaryStructured: Session['summaryStructured']
  transcript: string | null
  transcriptionStatus: Session['transcriptionStatus']
}

type SummarySection = {
  title: string
  body: string
}

function buildSections(params: { summary: string | null; summaryStructured: Session['summaryStructured']; transcript: string | null }): SummarySection[] {
  const structured = params.summaryStructured
  if (structured) {
    const items: SummarySection[] = [
      { title: 'Kernpunten', body: String(structured.doelstelling || '').trim() },
      { title: 'Voortgang', body: String(structured.voortgang || '').trim() || String(structured.belastbaarheid || '').trim() },
      { title: 'Aandachtspunten', body: String(structured.belemmeringen || '').trim() || String(structured.arbeidsmarktorientatie || '').trim() },
    ].filter((item) => item.body)
    if (items.length > 0) return items
  }

  const summaryText = String(params.summary || '').trim()
  if (summaryText) {
    const paragraphs = summaryText.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean)
    if (paragraphs.length >= 3) {
      return [
        { title: 'Kernpunten', body: paragraphs[0] },
        { title: 'Voortgang', body: paragraphs[1] },
        { title: 'Aandachtspunten', body: paragraphs.slice(2).join('\n\n') },
      ]
    }

    return [{ title: 'Kernpunten', body: summaryText }]
  }

  return []
}

export function SessionSummaryCard({ summary, summaryStructured, transcript, transcriptionStatus }: Props) {
  const hasSummaryContent = Boolean(summaryStructured) || String(summary || '').trim().length > 0
  const showSummaryLoading = transcriptionStatus === 'generating' && !hasSummaryContent
  const sections = useMemo(() => buildSections({ summary, summaryStructured, transcript }), [summary, summaryStructured, transcript])
  const showBusyState = transcriptionStatus === 'transcribing' || transcriptionStatus === 'generating'

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headingRow}>
          <Text isSemibold style={styles.heading}>Sessie Samenvatting</Text>
          <ArrowDownIcon size={18} color="#93858D" />
        </View>
        <View style={styles.actionsRow}>
          <Pressable accessibilityRole="button" style={({ hovered }) => [styles.action, hovered ? styles.actionHover : undefined]}>
            <SessionExportIcon size={18} />
            <Text style={styles.actionText}>Delen</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={({ hovered }) => [styles.action, hovered ? styles.actionHover : undefined]}>
            <SessionEditIcon size={18} />
            <Text style={styles.actionAccentText}>Aanpassen</Text>
          </Pressable>
        </View>
      </View>

      {showSummaryLoading ? (
        <View style={styles.loadingRow}>
          <LoadingSpinner size="small" />
          <Text style={styles.emptyText}>Samenvatting wordt gegenereerd...</Text>
        </View>
      ) : sections.length === 0 ? (
        <Text style={styles.emptyText}>{showBusyState ? 'Transcriptie en samenvatting worden voorbereid.' : 'Er is nog geen samenvatting beschikbaar voor deze sessie.'}</Text>
      ) : (
        <View style={styles.sectionList}>
          {sections.map((section) => (
            <View key={section.title} style={styles.sectionRow}>
              <Text isBold style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionBody}>{section.body}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    minHeight: 339,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#DFE0E2',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  heading: {
    fontSize: fontSizes.md,
    lineHeight: 26,
    color: '#2C111F',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  action: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionHover: {
    backgroundColor: '#F8EDF3',
  },
  actionText: {
    fontSize: fontSizes.md,
    lineHeight: 24,
    color: '#2C111F',
  },
  actionAccentText: {
    fontSize: fontSizes.md,
    lineHeight: 24,
    color: colors.selected,
  },
  sectionList: {
    gap: spacing.sm,
  },
  sectionRow: {
    gap: spacing.xxs,
  },
  sectionTitle: {
    fontSize: fontSizes.sm,
    lineHeight: 21,
    color: '#2C111F',
  },
  sectionBody: {
    fontSize: fontSizes.sm,
    lineHeight: 21,
    color: '#374151',
  },
  emptyText: {
    fontSize: fontSizes.sm,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
})
