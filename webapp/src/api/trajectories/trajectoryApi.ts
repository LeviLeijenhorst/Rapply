import { callSecureApi } from '../secureApi'
import type { Trajectory } from '../../storage/types'

export async function createTrajectoryRemote(trajectory: Trajectory): Promise<void> {
  await callSecureApi('/trajectories/create', {
    trajectory: {
      ...trajectory,
      clientId: trajectory.clientId,
    },
  })
}

export async function updateTrajectoryRemote(params: {
  id: string
  clientId?: string
  name?: string
  uwvContactName?: string | null
  orderNumber?: string | null
  startDate?: string | null
  updatedAtUnixMs: number
}): Promise<void> {
  await callSecureApi('/trajectories/update', {
    ...params,
    clientId: params.clientId,
  })
}

export async function deleteTrajectoryRemote(id: string): Promise<void> {
  await callSecureApi('/trajectories/delete', { id })
}
