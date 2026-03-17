import { useState } from 'react'
import { streamInputPipelineChatMessage } from '@/api/pipeline/pipelineApi'
import { createTypewriterStream } from '@/screens/shared/components/chat/createTypewriterStream'
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
    const assistantId = `assistant-stream-${Date.now()}`
    const placeholderAssistant: ChatbotMessage = {
      id: assistantId,
      role: 'assistant',
      text: '',
      createdAtUnixMs: Date.now(),
    }
    setChatMessages([...nextMessages, placeholderAssistant])
    setChatComposerValue('')
    setIsChatSending(true)
    const typewriter = createTypewriterStream({
      appendChar: (nextChar) => {
        setChatMessages((previousMessages) =>
          previousMessages.map((message) =>
            message.id === assistantId ? { ...message, text: `${message.text}${nextChar}` } : message,
          ),
        )
      },
    })

    try {
      const response = await streamInputPipelineChatMessage({
        inputId,
        messages: nextMessages.map((message) => ({ role: message.role, text: message.text })),
        onDelta: (delta) => {
          typewriter.pushDelta(delta)
        },
      })
      await typewriter.waitUntilIdle()
      typewriter.dispose()

      setChatMessages((previousMessages) =>
        previousMessages.map((message) =>
          message.id === assistantId
            ? { ...message, text: response.answer.trim() || 'Ik kon hier geen antwoord op genereren.' }
            : message,
        ),
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Onbekende fout'
      setChatMessages((previousMessages) =>
        previousMessages.map((message) =>
          message.id === assistantId
            ? { ...message, text: `Het versturen van uw vraag is mislukt: ${errorMessage}` }
            : message,
        ),
      )
      typewriter.dispose()
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
