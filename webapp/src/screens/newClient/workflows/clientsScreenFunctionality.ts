import type { LocalAppData, Trajectory } from '../../../storage/types'
import { getCoacheeUpsertValues, serializeCoacheeUpsertValues, type CoacheeUpsertValues } from '../../../types/clientProfile'
import { isSessionNotesArtifact } from '../../../types/sessionArtifacts'

type CoacheeMutationApi = {
  createCoachee: (values: { name: string; clientDetails?: string; employerDetails?: string; firstSickDay?: string }) => string
  createTrajectory: (values: {
    coacheeId: string
    name: string
    dienstType?: string
    uwvContactName?: string | null
    orderNumber?: string | null
    startDate?: string | null
  }) => string
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
}

type SaveCoacheeParams = {
  api: CoacheeMutationApi
  data: LocalAppData
  mode: 'create' | 'edit'
  editCoacheeId: string | null
  values: CoacheeUpsertValues
}

function getPrimaryTrajectoryForCoachee(data: LocalAppData, coacheeId: string): Trajectory | null {
  return (
    data.trajectories
      .filter((trajectory) => trajectory.coacheeId === coacheeId)
      .sort((a, b) => a.createdAtUnixMs - b.createdAtUnixMs)[0] ?? null
  )
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

export function getCoacheeSessionCounts(data: LocalAppData): Map<string, number> {
  const counts = new Map<string, number>()
  for (const session of data.sessions) {
    if (isSessionNotesArtifact(session)) continue
    if (!session.coacheeId) continue
    counts.set(session.coacheeId, (counts.get(session.coacheeId) ?? 0) + 1)
  }
  return counts
}

export function getUpsertTrajectoryOptions(data: LocalAppData, upsertMode: 'create' | 'edit', upsertCoacheeId: string | null) {
  const trajectories =
    upsertMode === 'edit' && upsertCoacheeId
      ? data.trajectories.filter((trajectory) => trajectory.coacheeId === upsertCoacheeId)
      : data.trajectories

  return trajectories.map((trajectory) => ({
    id: trajectory.id,
    label: String(trajectory.name || '').trim() || 'Traject',
  }))
}

export function getInitialUpsertValuesForEdit(data: LocalAppData, coacheeId: string): CoacheeUpsertValues {
  const coachee = data.coachees.find((item) => item.id === coacheeId) ?? null
  const primaryTrajectory = getPrimaryTrajectoryForCoachee(data, coacheeId)

  return {
    ...getCoacheeUpsertValues(coachee),
    trajectoryId: primaryTrajectory?.id ?? '',
    orderNumber: String(primaryTrajectory?.orderNumber || ''),
    uwvContactName: String(primaryTrajectory?.uwvContactName || ''),
    firstSickDay: String(primaryTrajectory?.startDate || coachee?.firstSickDay || ''),
  }
}

export function saveCoacheeFromUpsert({ api, data, mode, editCoacheeId, values }: SaveCoacheeParams): { didSave: boolean; createdCoacheeId: string | null } {
  const serialized = serializeCoacheeUpsertValues(values)
  const trimmedName = serialized.name.trim()
  if (!trimmedName) return { didSave: false, createdCoacheeId: null }

  if (mode === 'create') {
    const createdCoacheeId = api.createCoachee(serialized)
    if (!createdCoacheeId) return { didSave: false, createdCoacheeId: null }

    api.createTrajectory({
      coacheeId: createdCoacheeId,
      ...buildTrajectoryPatch(values),
    })
    return { didSave: true, createdCoacheeId }
  }

  if (!editCoacheeId) return { didSave: false, createdCoacheeId: null }

  api.updateCoachee(editCoacheeId, serialized)
  const existingTrajectory = getPrimaryTrajectoryForCoachee(data, editCoacheeId)
  if (existingTrajectory?.id) {
    api.updateTrajectory(existingTrajectory.id, buildTrajectoryPatch(values))
  } else {
    api.createTrajectory({
      coacheeId: editCoacheeId,
      ...buildTrajectoryPatch(values),
    })
  }

  return { didSave: true, createdCoacheeId: null }
}
