import type { LocalAppData, Session, Trajectory } from '../../local/types'
import { serializeCoacheeUpsertValues, type CoacheeUpsertValues } from '../../utils/coacheeProfile'

type CoacheeEditApi = {
  updateCoachee: (coacheeId: string, values: { name?: string; clientDetails?: string; employerDetails?: string; firstSickDay?: string }) => void
  updateTrajectory: (
    trajectoryId: string,
    values: {
      name?: string
      dienstType?: string
      uwvContactName?: string | null
      orderNumber?: string | null
      startDate?: string | null
    },
  ) => void
  createTrajectory: (values: {
    coacheeId: string
    name: string
    dienstType?: string
    uwvContactName?: string | null
    orderNumber?: string | null
    startDate?: string | null
  }) => string
}

type NoteApi = {
  createSession: (values: {
    coacheeId: string | null
    trajectoryId?: string | null
    title: string
    kind: Session['kind']
    audioBlobId: string | null
    audioDurationSeconds: number | null
    uploadFileName: string | null
  }) => string
  createNote: (sessionId: string, values: { title: string; text: string }) => void
}

function buildTrajectoryPatch(values: CoacheeUpsertValues) {
  return {
    name: 'Werkfit maken',
    dienstType: 'Werkfit maken',
    uwvContactName: values.uwvContactName.trim() || null,
    orderNumber: values.orderNumber.trim() || null,
    startDate: values.firstSickDay.trim() || null,
  }
}

export function saveCoacheeProfileChanges(
  api: CoacheeEditApi,
  params: {
    coacheeId: string
    activeTrajectory: Trajectory | null
    values: CoacheeUpsertValues
  },
): { didSave: boolean } {
  const serialized = serializeCoacheeUpsertValues(params.values)
  if (!serialized.name.trim()) return { didSave: false }

  api.updateCoachee(params.coacheeId, serialized)

  if (params.activeTrajectory?.id) {
    api.updateTrajectory(params.activeTrajectory.id, buildTrajectoryPatch(params.values))
  } else {
    api.createTrajectory({
      coacheeId: params.coacheeId,
      ...buildTrajectoryPatch(params.values),
    })
  }

  return { didSave: true }
}

export function saveNewCoacheeNote(
  api: NoteApi,
  params: {
    coacheeId: string
    activeTrajectoryId: string | null
    notesSessionId: string | null
    values: { title: string; text: string }
  },
): { didSave: boolean } {
  let targetSessionId = params.notesSessionId
  if (!targetSessionId) {
    targetSessionId = api.createSession({
      coacheeId: params.coacheeId,
      trajectoryId: params.activeTrajectoryId,
      title: 'Notities',
      kind: 'notes',
      audioBlobId: null,
      audioDurationSeconds: null,
      uploadFileName: null,
    })
  }

  if (!targetSessionId) return { didSave: false }

  api.createNote(targetSessionId, params.values)
  return { didSave: true }
}

export function getCoacheeTrajectoryOptions(data: LocalAppData, coacheeId: string) {
  return data.trajectories
    .filter((trajectory) => trajectory.coacheeId === coacheeId)
    .sort((a, b) => a.createdAtUnixMs - b.createdAtUnixMs)
    .map((trajectory) => ({
      id: trajectory.id,
      label: String(trajectory.name || '').trim() || 'Traject',
    }))
}
