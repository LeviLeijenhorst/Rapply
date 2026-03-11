import React from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'

import { CircleCloseIcon } from '@/icons/CircleCloseIcon'
import { FullScreenOpenIcon } from '@/icons/FullScreenOpenIcon'
import { colors } from '@/design/theme/colors'
import { Text } from '@/ui/Text'
import { ChatComposer } from '@/screens/shared/components/chat/ChatComposer'
import { ChatMessage } from '@/screens/shared/components/chat/ChatMessage'
import { ChatStarter } from '@/screens/shared/components/chat/ChatStarter'
import type { ClientChatbotProps } from '@/screens/client/clientScreen.types'

export function ClientChatbot({
  autoFocusKey,
  chatMessages,
  chatScrollRef,
  clientId,
  clientIntentTemplates,
  composerText,
  handleSendChatMessage,
  isAssistantFullscreen,
  isChatMinutesBlocked,
  isChatSending,
  isCheckingChatMinutes,
  isModal,
  isNoMinutesCtaDismissed,
  onSelectStarterPrompt,
  onShowClearChatConfirm,
  onToggleFullscreen,
  setComposerText,
  setIsNoMinutesCtaDismissed,
}: ClientChatbotProps) {
  return (
    <View style={[styles.chatTab, isModal ? styles.chatTabModal : undefined]}>
      <View style={[styles.chatTopActions, isModal ? styles.chatTopActionsModal : undefined]}>
        {chatMessages.length > 0 ? (
          <Pressable
            onPress={onShowClearChatConfirm}
            style={({ hovered }) => [
              styles.chatTopTextAction,
              isModal ? styles.chatTopTextActionModal : undefined,
              hovered ? styles.chatTopTextActionHovered : undefined,
            ]}
          >
            <Text isSemibold style={styles.chatTopTextActionText}>
              Wissen
            </Text>
          </Pressable>
        ) : null}
        {!isModal ? (
          <Pressable
            onPress={onToggleFullscreen}
            style={({ hovered }) => [styles.chatTopIconAction, hovered ? styles.chatTopIconActionHovered : undefined]}
          >
            <FullScreenOpenIcon color="#2C111F" size={18} />
          </Pressable>
        ) : null}
      </View>
      <ScrollView
        ref={chatScrollRef}
        style={styles.chatArea}
        contentContainerStyle={chatMessages.length === 0 ? styles.chatAreaContentCentered : styles.chatAreaContent}
        showsVerticalScrollIndicator={false}
      >
        {chatMessages.length === 0 ? (
          <View style={styles.clientIntentWrap}>
            <ChatStarter
              templates={clientIntentTemplates}
              onSelectOption={({ text, promptText }) => {
                void onSelectStarterPrompt(promptText || text)
              }}
            />
          </View>
        ) : (
          <>
            {chatMessages.map((message) => (
              <ChatMessage key={message.id} role={message.role} text={message.text} />
            ))}
            {isChatSending ? <ChatMessage role="assistant" text="" isLoading /> : null}
          </>
        )}
      </ScrollView>

      {isChatMinutesBlocked && !isNoMinutesCtaDismissed ? (
        <View style={styles.noMinutesCtaContainer}>
          <Pressable
            onPress={() => setIsNoMinutesCtaDismissed(true)}
            style={({ hovered }) => [styles.noMinutesCtaCloseButton, hovered ? styles.noMinutesCtaCloseButtonHovered : undefined]}
            accessibilityRole="button"
            accessibilityLabel="Melding sluiten"
          >
            <CircleCloseIcon size={18} color={colors.textSecondary} />
          </Pressable>
          <Text style={styles.noMinutesCtaText}>U heeft geen minuten meer.</Text>
        </View>
      ) : null}

      <View style={[styles.chatBottom, isModal ? styles.chatBottomModal : undefined]}>
        <ChatComposer
          value={composerText}
          onChangeValue={setComposerText}
          onSend={handleSendChatMessage}
          compact={isModal}
          showDisclaimer={false}
          sendIconVariant="arrow"
          preferCenteredSingleLine
          forceSingleLine
          isSendDisabled={
            isChatSending || isCheckingChatMinutes || isChatMinutesBlocked || composerText.trim().length === 0
          }
          shouldAutoFocus={isModal}
          autoFocusKey={`${clientId}-${autoFocusKey}-${isModal ? 'modal' : 'panel'}-${
            isAssistantFullscreen ? 'open' : 'closed'
          }`}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  chatTab: {
    flex: 1,
    minHeight: 0,
    gap: 10,
    position: 'relative',
    marginTop: 0,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
  },
  chatTabModal: {
    minHeight: 540,
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: 0,
    borderTopColor: 'transparent',
  },
  chatTopActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 4,
    paddingBottom: 2,
  },
  chatTopActionsModal: {
    minHeight: 28,
    paddingRight: 40,
    marginTop: 0,
    paddingBottom: 0,
    alignItems: 'center',
  },
  chatTopTextAction: { height: 28, justifyContent: 'center', alignItems: 'center' },
  chatTopTextActionModal: { marginTop: -3 },
  chatTopTextActionHovered: { opacity: 0.7 },
  chatTopTextActionText: { fontSize: 14, lineHeight: 16, color: '#2C111F' },
  chatTopIconAction: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  chatTopIconActionHovered: { backgroundColor: colors.hoverBackground },
  chatArea: { flex: 1, minHeight: 0 },
  chatAreaContent: { gap: 12, paddingBottom: 8 },
  chatAreaContentCentered: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 8 },
  chatBottom: { marginHorizontal: 12, marginVertical: 12 },
  chatBottomModal: { marginTop: 8, marginBottom: 4 },
  clientIntentWrap: { width: '100%', minHeight: 220, alignItems: 'center', justifyContent: 'center' },
  noMinutesCtaContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 82,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    padding: 12,
    paddingRight: 36,
    gap: 10,
    zIndex: 2,
  },
  noMinutesCtaCloseButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMinutesCtaCloseButtonHovered: { backgroundColor: colors.hoverBackground },
  noMinutesCtaText: { fontSize: 13, lineHeight: 18, color: colors.textSecondary },
})
