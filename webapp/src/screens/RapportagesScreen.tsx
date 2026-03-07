import React, { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'

import { Text } from '../ui/Text'
import { useLocalAppData } from '../local/LocalAppDataProvider'
import { colors } from '../design/theme/colors'
import { isSessionReportArtifact } from '../utils/sessionArtifacts'

type Props = {
  onOpenReport: (sessionId: string, coacheeId: string | null, trajectoryId: string | null) => void
}

type ReportRow = {
  sessionId: string
  title: string
  clientName: string
  trajectoryName: string
  createdAtUnixMs: number
  coacheeId: string | null
  trajectoryId: string | null
}

export function RapportagesScreen({ onOpenReport }: Props) {
  const { data } = useLocalAppData()

  const reportRows = useMemo<ReportRow[]>(() => {
    return data.sessions
      .filter((session) => isSessionReportArtifact(session))
      .map((session) => {
        const trajectory = session.trajectoryId ? data.trajectories.find((item) => item.id === session.trajectoryId) ?? null : null
        const resolvedCoacheeId = trajectory?.coacheeId ?? session.coacheeId ?? null
        const coachee = resolvedCoacheeId ? data.coachees.find((item) => item.id === resolvedCoacheeId) ?? null : null
        return {
          sessionId: session.id,
          title: String(session.title || '').trim() || 'Rapportage',
          clientName: String(coachee?.name || '').trim() || '-',
          trajectoryName: String(trajectory?.name || '').trim() || '-',
          createdAtUnixMs: session.createdAtUnixMs,
          coacheeId: resolvedCoacheeId,
          trajectoryId: trajectory?.id ?? null,
        }
      })
      .sort((a, b) => b.createdAtUnixMs - a.createdAtUnixMs)
  }, [data.coachees, data.sessions, data.trajectories])

  return (
    <View style={styles.container}>
      <ScrollView style={styles.listScroll} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {reportRows.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nog geen rapportages gevonden.</Text>
          </View>
        ) : null}

        {reportRows.map((report) => (
          <Pressable
            key={report.sessionId}
            onPress={() => onOpenReport(report.sessionId, report.coacheeId, report.trajectoryId)}
            style={({ hovered }) => [styles.reportCard, hovered ? styles.reportCardHovered : undefined]}
          >
            <Text isSemibold style={styles.reportTitle}>{report.title}</Text>
            <Text style={styles.reportMeta}>Cliënt: {report.clientName}</Text>
            <Text style={styles.reportMeta}>Traject: {report.trajectoryName}</Text>
            <Text style={styles.reportMeta}>
              Aangemaakt: {new Date(report.createdAtUnixMs).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    gap: 12,
    paddingBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  reportCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 4,
  },
  reportCardHovered: {
    backgroundColor: colors.hoverBackground,
  },
  reportTitle: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.textStrong,
  },
  reportMeta: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
})

