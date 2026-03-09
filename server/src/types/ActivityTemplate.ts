export type ActivityTemplate = {
  id: string
  name: string
  description: string
  category: string
  defaultHours: number
  isAdmin: boolean
  organizationId: string | null
  isActive: boolean
  createdAtUnixMs: number
  updatedAtUnixMs: number
}
