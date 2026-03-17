import React from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'

import { semanticColorTokens } from '@/design/tokens/colors'
import { fontSizes } from '@/design/tokens/fontSizes'
import { radius } from '@/design/tokens/radius'
import { spacing } from '@/design/tokens/spacing'
import { FullScreenOpenIcon } from '@/icons/FullScreenOpenIcon'
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
  shouldAutoFocus = false,
  onChangeComposerValue,
  onSendMessage,
  onClearChat,
  onOpenExpanded,
}: ChatbotTabProps) {
  const isModalVariant = variant === 'modal'

  return (
    <View style={[styles.container, isModalVariant ? styles.containerModal : undefined]}>
      <View style={[styles.actionsRow, isModalVariant ? styles.actionsRowModal : undefined]}>
        {!isModalVariant && messages.length > 0 ? (
          <Pressable
            onPress={onClearChat}
            style={({ hovered }) => [
              styles.secondaryAction,
              hovered ? styles.secondaryActionHover : undefined,
            ]}
          >
            <Text isSemibold style={styles.secondaryActionText}>Wissen</Text>
          </Pressable>
        ) : null}
        {!isModalVariant ? (
          <Pressable onPress={onOpenExpanded} style={({ hovered }) => [styles.iconAction, hovered ? styles.iconActionHover : undefined]}>
            <FullScreenOpenIcon size={18} color={semanticColorTokens.light.textHeading} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView style={styles.feed} contentContainerStyle={messages.length === 0 ? styles.feedContentCentered : styles.feedContent} showsVerticalScrollIndicator={false}>
        {messages.length === 0 && !isSending ? (
          <Text style={styles.emptyText}>Stel een vraag over deze sessie om AI-chat te starten.</Text>
        ) : (
          <>
            {messages.map((message) => {
              const isHiddenStreamingPlaceholder = message.role === 'assistant' && message.text.trim().length === 0
              if (isHiddenStreamingPlaceholder) return null
              const isStreamingMessage = isSending && message.id.startsWith('assistant-stream-')
              return <ChatMessage key={message.id} role={message.role} text={message.text} isStreaming={isStreamingMessage} />
            })}
            {isSending && !messages.some((message) => message.id.startsWith('assistant-stream-') && message.text.trim().length > 0)
              ? <ChatMessage role="assistant" text="" isLoading />
              : null}
          </>
        )}
      </ScrollView>

      <View style={[styles.composerWrap, isModalVariant ? styles.composerWrapModal : undefined]}>
        <ChatComposer
          value={composerValue}
          onChangeValue={onChangeComposerValue}
          onSend={onSendMessage}
          compact={isModalVariant}
          showDisclaimer={false}
          sendIconVariant="arrow"
          isSendDisabled={isSending || composerValue.trim().length === 0}
          shouldAutoFocus={isModalVariant || shouldAutoFocus}
          autoFocusKey={`session-chat-${inputId}-${isModalVariant ? 'modal' : 'panel'}-${shouldAutoFocus ? 'active' : 'inactive'}`}
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
  actionsRowModal: {
    paddingRight: spacing.md,
    marginTop: -2,
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
    paddingHorizontal: spacing.sm,
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
  composerWrap: {
    marginHorizontal: 0,
    marginBottom: spacing.sm,
  },
  composerWrapModal: {
    marginTop: spacing.xs,
    marginBottom: spacing.xxs - 2,
  },
})
