export type Note = {
  id: string
  clientId: string
  sessionId: string | null
  title: string
  text: string
  createdAt: number
  updatedAt: number
}
