import React from 'react'
import { Animated, Pressable, ScrollView, View } from 'react-native'

import { WebPortal } from '../../../ui/WebPortal'
import { ChatComposer } from '../../../components/sessionDetail/ChatComposer'
import { ChatMessage } from '../../../components/sessionDetail/ChatMessage'
import { QuickQuestionsStart } from '../../../components/sessionDetail/QuickQuestionsStart'
import { Text } from '../../../ui/Text'
import { CircleCloseIcon } from '../../../icons/CircleCloseIcon'
import { FullScreenCloseIcon } from '../../../icons/FullScreenCloseIcon'
import { colors } from '../../../design/theme/colors'
import type { ChatStateMessage } from '../../../utils/chatState'
import { styles } from '../styles'

type Props = {
  chatMessages: ChatStateMessage[]
  chatOverlayOpacity: Animated.Value
  chatOverlayScale: Animated.Value
  chatScrollRef: React.RefObject<ScrollView | null>
  composerText: string
  editableSessionTitle: string
  isChatMaximizedRendered: boolean
  isChatMinutesBlocked: boolean
  isChatSending: boolean
  isCheckingChatMinutes: boolean
  isNoMinutesCtaDismissed: boolean
  noMinutesCtaOpacity: Animated.Value
  noMinutesCtaTranslateY: Animated.Value
  quickQuestionTemplates: { id: string; name: string; promptText: string; templateId: string }[]
  shouldShowClearChat: boolean
  shouldShowQuickStart: boolean
  onChangeComposerText: (value: string) => void
  onCloseOverlay: () => void
  onOpenMySubscription: () => void
  onRequestPdfEdit: (params: { text: string; title?: string }) => void
  onRequestResetChat: () => void
  onSendChatMessage: (value: string | { text: string; promptText?: string; templateId?: string }) => void | Promise<void>
  onSendComposer: () => void | Promise<void>
  onTranscriptMentionPress: (seconds: number) => void
  onDismissNoMinutesCta: () => void
}

export function ChatOverlay({
  chatMessages,
  chatOverlayOpacity,
  chatOverlayScale,
  chatScrollRef,
  composerText,
  editableSessionTitle,
  isChatMaximizedRendered,
  isChatMinutesBlocked,
  isChatSending,
  isCheckingChatMinutes,
  isNoMinutesCtaDismissed,
  noMinutesCtaOpacity,
  noMinutesCtaTranslateY,
  quickQuestionTemplates,
  shouldShowClearChat,
  shouldShowQuickStart,
  onChangeComposerText,
  onCloseOverlay,
  onOpenMySubscription,
  onRequestPdfEdit,
  onRequestResetChat,
  onSendChatMessage,
  onSendComposer,
  onTranscriptMentionPress,
  onDismissNoMinutesCta,
}: Props) {
  if (!isChatMaximizedRendered) return null

  return (
    <WebPortal>
      <Animated.View style={[styles.chatOverlay, { opacity: chatOverlayOpacity }]}>
        <Animated.View style={[styles.chatOverlayCard, { transform: [{ scale: chatOverlayScale }] }]}>
          <View style={styles.chatOverlayHeader}>
            <Text isSemibold style={styles.chatOverlayTitle}>
              Snelle vragen
            </Text>
            <View style={styles.chatOverlayActions}>
              {shouldShowClearChat ? (
                <Pressable
                  onPress={onRequestResetChat}
                  style={({ hovered }) => [styles.chatActionButton, hovered ? styles.chatActionButtonHovered : undefined]}
                >
                  <Text isBold style={styles.chatActionText}>
                    Chat wissen
                  </Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={onCloseOverlay}
                style={({ hovered }) => [styles.chatActionButton, hovered ? styles.chatActionButtonHovered : undefined]}
              >
                <FullScreenCloseIcon />
              </Pressable>
            </View>
          </View>
          <View style={styles.chatTab}>
            <ScrollView
              ref={chatScrollRef}
              style={styles.chatArea}
              contentContainerStyle={shouldShowQuickStart ? styles.chatAreaContentCentered : styles.chatAreaContent}
              showsVerticalScrollIndicator={false}
            >
              {shouldShowQuickStart ? (
                <QuickQuestionsStart
                  templates={quickQuestionTemplates}
                  onSelectOption={(option: string | { text: string; promptText?: string; templateId?: string }) => onSendChatMessage(option)}
                />
              ) : (
                <>
                  {chatMessages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      role={message.role}
                      text={message.text}
                      onTranscriptMentionPress={onTranscriptMentionPress}
                      exportTitle={editableSessionTitle}
                      onRequestPdfEdit={(params: { text: string; title?: string }) => onRequestPdfEdit(params)}
                    />
                  ))}
                  {isChatSending ? (
                    <ChatMessage role="assistant" text="" isLoading onTranscriptMentionPress={onTranscriptMentionPress} exportTitle={editableSessionTitle} />
                  ) : null}
                </>
              )}
            </ScrollView>
            {isChatMinutesBlocked && !isNoMinutesCtaDismissed ? (
              <Animated.View
                style={[
                  styles.noMinutesChatCtaContainer,
                  { opacity: noMinutesCtaOpacity, transform: [{ translateY: noMinutesCtaTranslateY }] },
                ]}
              >
                <Pressable
                  onPress={onDismissNoMinutesCta}
                  style={({ hovered }) => [styles.noMinutesChatCtaCloseButton, hovered ? styles.noMinutesChatCtaCloseButtonHovered : undefined]}
                  accessibilityRole="button"
                  accessibilityLabel="Melding sluiten"
                >
                  <CircleCloseIcon size={18} color={colors.textSecondary} />
                </Pressable>
                <Text style={styles.noMinutesChatCtaText}>U heeft geen minuten meer.</Text>
                <Pressable
                  onPress={onOpenMySubscription}
                  style={({ hovered }) => [
                    styles.noMinutesChatCtaButton,
                    hovered ? styles.noMinutesChatCtaButtonHovered : undefined,
                  ]}
                >
                  <Text isBold style={styles.noMinutesChatCtaButtonText}>
                    Mijn abonnement
                  </Text>
                </Pressable>
              </Animated.View>
            ) : null}
            <View style={styles.chatBottom}>
              <ChatComposer
                value={composerText}
                onChangeValue={onChangeComposerText}
                onSend={onSendComposer}
                isSendDisabled={isChatSending || isCheckingChatMinutes || composerText.trim().length === 0}
                shouldAutoFocus
                autoFocusKey="full-screen-chat"
                onPressEscape={onCloseOverlay}
              />
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </WebPortal>
  )
}

