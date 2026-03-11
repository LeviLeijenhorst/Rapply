import { useMemo, useState } from 'react'

import { sendInputChatMessage } from '@/api/chat/sendInputChatMessage'
import type { ChatbotMessage, UseChatbotTabLogicParams } from '@/screens/session/sessionScreen.types'

function buildInputChatSystemPrompt(params: {
  summary: string | null
  transcript: string | null
  snippets: UseChatbotTabLogicParams['snippets']
  notes: UseChatbotTabLogicParams['notes']
}): string {
  const snippetLines = params.snippets.map((snippet) => `- (${snippet.field}) ${snippet.text}`).join('\n')
  const noteLines = params.notes.map((note) => `- ${note.text}`).join('\n')

  return [
    'Je bent een AI-assistent voor een coach en antwoordt in formeel Nederlands.',
    'Gebruik alleen de context hieronder en wees kort en concreet.',
    '',
    'Samenvatting:',
    String(params.summary || '').trim() || '-',
    '',
    'Transcript:',
    String(params.transcript || '').trim() || '-',
    '',
    'Snippets:',
    snippetLines || '-',
    '',
    'Notities:',
    noteLines || '-',
  ].join('\n')
}

export function useChatbotTabLogic({ inputId, summary, transcript, snippets, notes }: UseChatbotTabLogicParams) {
  const [chatComposerValue, setChatComposerValue] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatbotMessage[]>([])
  const [isChatSending, setIsChatSending] = useState(false)
  const [isExpandedChatOpen, setIsExpandedChatOpen] = useState(false)
  const [isClearChatModalVisible, setIsClearChatModalVisible] = useState(false)

  const sortedNotes = useMemo(
    () => [...notes].sort((leftNote, rightNote) => leftNote.createdAtUnixMs - rightNote.createdAtUnixMs),
    [notes],
  )

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
      const aiResponse = await sendInputChatMessage({
        messages: [
          {
            role: 'system',
            text: buildInputChatSystemPrompt({
              summary,
              transcript,
              snippets,
              notes: sortedNotes,
            }),
          },
          ...nextMessages.map((message) => ({ role: message.role, text: message.text })),
        ],
        sessionId: inputId,
      })

      setChatMessages((previousMessages) => [
        ...previousMessages,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: String(aiResponse || '').trim() || 'Ik kon hier geen antwoord op genereren.',
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

  function handleDeleteChatMessage(messageId: string) {
    setChatMessages((previousMessages) => previousMessages.filter((message) => message.id !== messageId))
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
    handleDeleteChatMessage,
    handleConfirmClearChat,
  }
}


