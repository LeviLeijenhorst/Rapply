import { sendClientChatMessage } from './sendClientChatMessage'
import type { LocalChatMessage } from './types'

export async function previewClientChatCompletion(params: {
  messages: LocalChatMessage[]
  temperature?: number
}): Promise<{
  text: string
  rawResponse: string
  messagesSentToModel: LocalChatMessage[]
}> {
  const messages = Array.isArray(params.messages) ? params.messages : []
  const text = await sendClientChatMessage({
    messages,
    temperature: params.temperature,
  })

  return {
    text,
    rawResponse: text,
    messagesSentToModel: messages,
  }
}
