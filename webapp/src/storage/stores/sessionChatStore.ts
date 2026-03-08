import { clearQuickQuestionsChatForSession, loadQuickQuestionsChatForSession, saveQuickQuestionsChatForSession } from '../quickQuestionsChatStore'

export const sessionChatStore = {
  load: loadQuickQuestionsChatForSession,
  save: saveQuickQuestionsChatForSession,
  clear: clearQuickQuestionsChatForSession,
}
