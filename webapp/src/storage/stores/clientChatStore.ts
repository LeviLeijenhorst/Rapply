import { clearQuickQuestionsChatForCoachee, loadQuickQuestionsChatForCoachee, saveQuickQuestionsChatForCoachee } from '../quickQuestionsChatStore'

export const clientChatStore = {
  load: loadQuickQuestionsChatForCoachee,
  save: saveQuickQuestionsChatForCoachee,
  clear: clearQuickQuestionsChatForCoachee,
}
