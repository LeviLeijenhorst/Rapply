import { clearChatBotForInput, loadChatBotForInput, saveChatBotForInput } from '../chatBotStore'

export const sessionChatStore = {
  load: loadChatBotForInput,
  save: saveChatBotForInput,
  clear: clearChatBotForInput,
}
