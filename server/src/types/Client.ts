export type Client = {
  id: string
  organizationId?: string
  name: string
  clientDetails: string
  employerDetails: string
  trajectoryStartDate?: string | null
  trajectoryEndDate?: string | null
  createdByUserId?: string | null
  primaryCoachUserId?: string | null
  assignedCoachUserIds?: string[]
  assignedCoaches?: Array<{
    userId: string
    displayName: string | null
    email: string | null
    role: string
  }>
  createdAtUnixMs: number
  updatedAtUnixMs: number
  isArchived: boolean
}
