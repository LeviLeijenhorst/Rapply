import React, { useMemo } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'

import { colors } from '../../design/theme/colors'
import { useLocalAppData } from '../../storage/LocalAppDataProvider'
import { Text } from '../../ui/Text'
import { ArchivedClientCard } from './components/ArchivedClientCard'

export function ArchiveScreen() {
  const { data, restoreClient, deleteClient } = useLocalAppData()

  const archivedClients = useMemo(
    () =>
      data.clients
        .filter((client) => client.isArchived)
        .sort((a, b) => a.name.localeCompare(b.name, 'nl-NL', { sensitivity: 'base' })),
    [data.clients],
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text isSemibold style={styles.title}>Archief</Text>
        <Text style={styles.subtitle}>Beheer gearchiveerde clienten.</Text>
      </View>
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {archivedClients.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Er staan nog geen clienten in het archief.</Text>
          </View>
        ) : (
          archivedClients.map((client) => (
            <ArchivedClientCard
              key={client.id}
              name={client.name}
              onRestore={() => restoreClient(client.id)}
              onDelete={() => deleteClient(client.id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
    padding: 24,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 40,
    lineHeight: 48,
    color: colors.textStrong,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 10,
    paddingBottom: 16,
  },
  emptyState: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  emptyStateText: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.textSecondary,
  },
})

