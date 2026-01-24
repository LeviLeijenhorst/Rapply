import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { colors } from '../theme/colors'
import { Navbar } from './Navbar'
import { Sidebar, SidebarItemKey } from './Sidebar'
import { Text } from './Text'
import { dummyConversations, GesprekkenScreen } from '../screens/GesprekkenScreen'
import { GesprekDetailScreen } from '../screens/GesprekDetailScreen'

export function AppShell() {
  const [selectedSidebarItemKey, setSelectedSidebarItemKey] = useState<SidebarItemKey>('gesprekken')
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)

  function renderMainContent() {
    if (selectedSidebarItemKey === 'gesprekken') {
      if (selectedConversationId) {
        const conversationTitle = dummyConversations.find((item) => item.id === selectedConversationId)?.title ?? 'Gesprek'
        return <GesprekDetailScreen title={conversationTitle} onBack={() => setSelectedConversationId(null)} />
      }
      return <GesprekkenScreen onSelectConversation={setSelectedConversationId} />
    }
    return <Text style={styles.mainContentText}>{selectedSidebarItemKey}</Text>
  }

  return (
    <View style={styles.page}>
      {/* Top navigation bar */}
      <Navbar />
      {/* Page content */}
      <View style={styles.contentRow}>
        {/* Sidebar */}
        <Sidebar selectedSidebarItemKey={selectedSidebarItemKey} onSelectSidebarItem={setSelectedSidebarItemKey} />
        {/* Main content */}
        <View style={styles.mainContent}>
          {renderMainContent()}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
  },
  mainContent: {
    flex: 1,
    padding: 24,
  },
  mainContentText: {
    fontSize: 16,
    color: colors.text,
  },
})

