import type { LocalAppData, Trajectory } from '../../../storage/types'
import { getClientUpsertValues, serializeClientUpsertValues, type ClientUpsertValues } from '../../../types/clientProfile'
import { isInputNotesArtifact } from '../../../types/sessionArtifacts'

type ClientMutationApi = {
  createClient: (values: { name: string; clientDetails?: string; employerDetails?: string }) => string
  createTrajectory: (values: {
    clientId: string
    name: string
    dienstType?: string
    uwvContactName?: string | null
    orderNumber?: string | null
    startDate?: string | null
  }) => string
  updateClient: (clientId: string, values: { name?: string; clientDetails?: string; employerDetails?: string }) => void
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

type SaveClientParams = {
  api: ClientMutationApi
  data: LocalAppData
  mode: 'create' | 'edit'
  editClientId: string | null
  values: ClientUpsertValues
}

function getPrimaryTrajectoryForClient(data: LocalAppData, clientId: string): Trajectory | null {
  return (
    data.trajectories
      .filter((trajectory) => trajectory.clientId === clientId)
      .sort((a, b) => a.createdAtUnixMs - b.createdAtUnixMs)[0] ?? null
  )
}

function buildTrajectoryPatch(values: ClientUpsertValues) {
  return {
    name: 'Werkfit maken',
    dienstType: 'Werkfit maken',
    uwvContactName: values.uwvContactName.trim() || null,
    orderNumber: values.orderNumber.trim() || null,
  }
}

export function getClientInputCounts(data: LocalAppData): Map<string, number> {
  const counts = new Map<string, number>()
  for (const session of data.inputs) {
    if (isInputNotesArtifact(session)) continue
    if (!session.clientId) continue
    counts.set(session.clientId, (counts.get(session.clientId) ?? 0) + 1)
  }
  return counts
}

export function getUpsertTrajectoryOptions(data: LocalAppData, upsertMode: 'create' | 'edit', upsertClientId: string | null) {
  const trajectories =
    upsertMode === 'edit' && upsertClientId
      ? data.trajectories.filter((trajectory) => trajectory.clientId === upsertClientId)
      : data.trajectories

  return trajectories.map((trajectory) => ({
    id: trajectory.id,
    label: String(trajectory.name || '').trim() || 'Traject',
  }))
}

export function getInitialUpsertValuesForEdit(data: LocalAppData, clientId: string): ClientUpsertValues {
  const client = data.clients.find((item) => item.id === clientId) ?? null
  const primaryTrajectory = getPrimaryTrajectoryForClient(data, clientId)

  return {
    ...getClientUpsertValues(client),
    trajectoryId: primaryTrajectory?.id ?? '',
    orderNumber: String(primaryTrajectory?.orderNumber || ''),
    uwvContactName: String(primaryTrajectory?.uwvContactName || ''),
  }
}

export function saveClientFromUpsert({ api, data, mode, editClientId, values }: SaveClientParams): { didSave: boolean; createdClientId: string | null } {
  const serialized = serializeClientUpsertValues(values)
  const trimmedName = serialized.name.trim()
  if (!trimmedName) return { didSave: false, createdClientId: null }

  if (mode === 'create') {
    const createdClientId = api.createClient(serialized)
    if (!createdClientId) return { didSave: false, createdClientId: null }

    api.createTrajectory({
      clientId: createdClientId,
      ...buildTrajectoryPatch(values),
    })
    return { didSave: true, createdClientId }
  }

  if (!editClientId) return { didSave: false, createdClientId: null }

  api.updateClient(editClientId, serialized)
  const existingTrajectory = getPrimaryTrajectoryForClient(data, editClientId)
  if (existingTrajectory?.id) {
    api.updateTrajectory(existingTrajectory.id, buildTrajectoryPatch(values))
  } else {
    api.createTrajectory({
      clientId: editClientId,
      ...buildTrajectoryPatch(values),
    })
  }

  return { didSave: true, createdClientId: null }
}

