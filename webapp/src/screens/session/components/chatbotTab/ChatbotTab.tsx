import React from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'

import { semanticColorTokens } from '@/design/tokens/colors'
import { fontSizes } from '@/design/tokens/fontSizes'
import { radius } from '@/design/tokens/radius'
import { spacing } from '@/design/tokens/spacing'
import { FullScreenOpenIcon } from '@/icons/FullScreenOpenIcon'
import { TrashIcon } from '@/icons/TrashIcon'
import type { ChatbotTabProps } from '@/screens/session/sessionScreen.types'
import { ChatComposer } from '@/screens/shared/components/chat/ChatComposer'
import { ChatMessage } from '@/screens/shared/components/chat/ChatMessage'
import { Text } from '@/ui/Text'

export function ChatbotTab({
  inputId,
  variant,
  messages,
  composerValue,
  isSending,
  onChangeComposerValue,
  onSendMessage,
  onDeleteMessage,
  onClearChat,
  onOpenExpanded,
}: ChatbotTabProps) {
  const isModalVariant = variant === 'modal'

  return (
    <View style={[styles.container, isModalVariant ? styles.containerModal : undefined]}>
      {/* Top actions */}
      <View style={styles.actionsRow}>
        {messages.length > 0 ? (
          <Pressable onPress={onClearChat} style={({ hovered }) => [styles.secondaryAction, hovered ? styles.secondaryActionHover : undefined]}>
            <Text isSemibold style={styles.secondaryActionText}>Wissen</Text>
          </Pressable>
        ) : null}
        {!isModalVariant ? (
          <Pressable onPress={onOpenExpanded} style={({ hovered }) => [styles.iconAction, hovered ? styles.iconActionHover : undefined]}>
            <FullScreenOpenIcon size={18} color={semanticColorTokens.light.textHeading} />
          </Pressable>
        ) : null}
      </View>

      {/* Chat feed */}
      <ScrollView style={styles.feed} contentContainerStyle={messages.length === 0 ? styles.feedContentCentered : styles.feedContent} showsVerticalScrollIndicator={false}>
        {messages.length === 0 ? (
          <Text style={styles.emptyText}>Stel een vraag over deze sessie om AI-chat te starten.</Text>
        ) : (
          <>
            {messages.map((message) => (
              <View key={message.id} style={styles.messageRow}>
                <ChatMessage role={message.role} text={message.text} />
                <Pressable onPress={() => onDeleteMessage(message.id)} style={({ hovered }) => [styles.deleteButton, hovered ? styles.deleteButtonHover : undefined]}>
                  <TrashIcon size={14} color={semanticColorTokens.light.textSecondary} />
                </Pressable>
              </View>
            ))}
            {isSending ? <ChatMessage role="assistant" text="" isLoading /> : null}
          </>
        )}
      </ScrollView>

      {/* Composer */}
      <View style={[styles.composerWrap, isModalVariant ? styles.composerWrapModal : undefined]}>
        <ChatComposer
          value={composerValue}
          onChangeValue={onChangeComposerValue}
          onSend={onSendMessage}
          compact={isModalVariant}
          showDisclaimer={false}
          sendIconVariant="arrow"
          preferCenteredSingleLine
          forceSingleLine
          isSendDisabled={isSending || composerValue.trim().length === 0}
          shouldAutoFocus={isModalVariant}
          autoFocusKey={`session-chat-${inputId}-${isModalVariant ? 'modal' : 'panel'}`}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs + 2,
  },
  containerModal: {
    paddingTop: spacing.xs - 2,
    minHeight: 540,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxs,
    minHeight: 28,
  },
  secondaryAction: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionHover: {
    opacity: 0.7,
  },
  secondaryActionText: {
    fontSize: fontSizes.sm,
    lineHeight: 16,
    color: semanticColorTokens.light.textHeading,
  },
  iconAction: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActionHover: {
    backgroundColor: semanticColorTokens.light.hoverSoft,
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingHorizontal: 0,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  feedContentCentered: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg - 4,
    paddingVertical: spacing.md,
  },
  emptyText: {
    color: semanticColorTokens.light.textMuted,
    fontSize: fontSizes.sm,
    lineHeight: 21,
    textAlign: 'center',
  },
  messageRow: {
    gap: spacing.xxs + 2,
  },
  deleteButton: {
    alignSelf: 'flex-end',
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonHover: {
    backgroundColor: semanticColorTokens.light.hoverNeutral,
  },
  composerWrap: {
    marginHorizontal: 0,
    marginBottom: spacing.sm,
  },
  composerWrapModal: {
    marginTop: spacing.xs,
    marginBottom: spacing.xxs - 2,
  },
})
