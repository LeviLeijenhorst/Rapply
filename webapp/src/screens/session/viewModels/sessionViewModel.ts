import type { Session, Snippet } from '../../../storage/types'
import { selectSessionSnippets } from '../selectors/sessionSnippetSelectors'

export function sessionViewModel(sessions: Session[], snippets: Snippet[], sessionId: string) {
  const session = sessions.find((item) => item.id === sessionId) ?? null
  return { session, snippets: selectSessionSnippets(snippets, sessionId) }
}
