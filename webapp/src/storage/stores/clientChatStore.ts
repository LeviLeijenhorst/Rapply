import { clearChatBotForClient, loadChatBotForClient, saveChatBotForClient } from '../chatBotStore'

export const clientChatStore = {
  load: loadChatBotForClient,
  save: saveChatBotForClient,
  clear: clearChatBotForClient,
}
