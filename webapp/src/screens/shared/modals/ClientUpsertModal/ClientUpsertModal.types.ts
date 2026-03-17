import type { ClientUpsertValues } from '../../../../types/clientProfile'

export type ClientUpsertModalProps = {
  visible: boolean
  mode: 'create' | 'edit'
  initialValues: ClientUpsertValues
  trajectoryOptions?: Array<{ id: string; label: string }>
  onClose: () => void
  onSave: (values: ClientUpsertValues) => void
  onDelete?: () => void
}

export type CalendarCell = {
  isoDate: string
  dayOfMonth: number
  inCurrentMonth: boolean
}

