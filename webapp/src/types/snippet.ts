export type SnippetType = 'report' | 'knowledge'
export type SnippetStatus = 'pending' | 'approved' | 'rejected'

export type Snippet = {
  id: string
  clientId: string
  sessionId: string
  type: SnippetType
  field: string
  text: string
  status: SnippetStatus
  createdAt: number
  updatedAt: number
}
