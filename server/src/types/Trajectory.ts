export type Trajectory = {
  id: string
  clientId: string
  name: string
  serviceType: string
  uwvContactName: string | null
  uwvContactPhone: string | null
  uwvContactEmail: string | null
  orderNumber: string | null
  startDate: string | null
  planOfAction: {
    documentId: string
  } | null
  maxHours: number
  maxAdminHours: number
  createdAtUnixMs: number
  updatedAtUnixMs: number
}
