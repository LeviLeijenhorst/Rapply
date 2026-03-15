import { serializeClientUpsertValues, type ClientUpsertValues } from '@/types/clientProfile'
import type { ClientDataShape, ClientInput, ClientTrajectory } from '@/screens/client/clientScreen.types'

type ClientEditApi = {
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
  createTrajectory: (values: {
    clientId: string
    name: string
    dienstType?: string
    uwvContactName?: string | null
    orderNumber?: string | null
    startDate?: string | null
  }) => string
}

type NoteApi = {
  createNote: (
    inputId: string | null,
    values: { title: string; text: string },
    options?: { clientId?: string | null; sourceInputId?: string | null },
  ) => void
}

function readTrajectoryClientId(trajectory: ClientTrajectory): string {
  return String((trajectory as any).clientId || '')
}

function buildTrajectoryPatch(values: ClientUpsertValues) {
  return {
    name: 'Werkfit maken',
    dienstType: 'Werkfit maken',
    uwvContactName: values.uwvContactName.trim() || null,
    orderNumber: values.orderNumber.trim() || null,
  }
}

export function saveClientProfileChanges(
  api: ClientEditApi,
  params: {
    clientId: string
    activeTrajectory: ClientTrajectory | null
    values: ClientUpsertValues
  },
): { didSave: boolean } {
  const serialized = serializeClientUpsertValues(params.values)
  if (!serialized.name.trim()) return { didSave: false }

  api.updateClient(params.clientId, serialized)

  if (params.activeTrajectory?.id) {
    api.updateTrajectory(params.activeTrajectory.id, buildTrajectoryPatch(params.values))
  } else {
    api.createTrajectory({
      clientId: params.clientId,
      ...buildTrajectoryPatch(params.values),
    })
  }

  return { didSave: true }
}

export function saveNewClientNote(
  api: NoteApi,
  params: {
    clientId: string
    activeTrajectoryId: string | null
    values: { title: string; text: string }
  },
): { didSave: boolean } {
  void params.activeTrajectoryId
  api.createNote(null, params.values, {
    clientId: params.clientId,
    sourceInputId: null,
  })
  return { didSave: true }
}

export function getClientTrajectoryOptions(data: ClientDataShape, clientId: string) {
  return data.trajectories
    .filter((trajectory) => readTrajectoryClientId(trajectory) === clientId)
    .sort((a, b) => a.createdAtUnixMs - b.createdAtUnixMs)
    .map((trajectory) => ({
      id: trajectory.id,
      label: String(trajectory.name || '').trim() || 'Traject',
    }))
}

