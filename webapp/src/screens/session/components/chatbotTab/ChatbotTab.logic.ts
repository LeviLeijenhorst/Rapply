import { useState } from 'react'
import { sendInputPipelineChatMessage } from '@/api/pipeline/pipelineApi'
import type { ChatbotMessage, UseChatbotTabLogicParams } from '@/screens/session/sessionScreen.types'

export function useChatbotTabLogic({ inputId }: UseChatbotTabLogicParams) {
  const [chatComposerValue, setChatComposerValue] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatbotMessage[]>([])
  const [isChatSending, setIsChatSending] = useState(false)
  const [isExpandedChatOpen, setIsExpandedChatOpen] = useState(false)
  const [isClearChatModalVisible, setIsClearChatModalVisible] = useState(false)

  async function handleSendChatMessage() {
    const trimmedText = chatComposerValue.trim()
    if (!trimmedText || isChatSending) return

    const userMessage: ChatbotMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmedText,
      createdAtUnixMs: Date.now(),
    }

    const nextMessages = [...chatMessages, userMessage]
    setChatMessages(nextMessages)
    setChatComposerValue('')
    setIsChatSending(true)

    try {
      const response = await sendInputPipelineChatMessage({
        inputId,
        messages: nextMessages.map((message) => ({ role: message.role, text: message.text })),
      })

      setChatMessages((previousMessages) => [
        ...previousMessages,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: response.answer.trim() || 'Ik kon hier geen antwoord op genereren.',
          createdAtUnixMs: Date.now(),
        },
      ])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Onbekende fout'
      setChatMessages((previousMessages) => [
        ...previousMessages,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          text: `Het versturen van uw vraag is mislukt: ${errorMessage}`,
          createdAtUnixMs: Date.now(),
        },
      ])
    } finally {
      setIsChatSending(false)
    }
  }

  function handleConfirmClearChat() {
    setIsClearChatModalVisible(false)
    setChatMessages([])
  }

  return {
    chatComposerValue,
    chatMessages,
    isChatSending,
    isExpandedChatOpen,
    isClearChatModalVisible,
    setChatComposerValue,
    setIsExpandedChatOpen,
    setIsClearChatModalVisible,
    handleSendChatMessage,
    handleConfirmClearChat,
  }
}
