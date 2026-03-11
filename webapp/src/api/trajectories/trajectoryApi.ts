import { callSecureApi } from '../secureApi'
import type { Trajectory } from '../../storage/types'

export async function createTrajectoryRemote(trajectory: Trajectory): Promise<void> {
  await callSecureApi('/trajectories/create', {
    trajectory: {
      ...trajectory,
      clientId: trajectory.coacheeId,
      serviceType: trajectory.dienstType,
      planOfAction: trajectory.planVanAanpak,
    },
  })
}

export async function updateTrajectoryRemote(params: {
  id: string
  coacheeId?: string
  name?: string
  dienstType?: string
  uwvContactName?: string | null
  uwvContactPhone?: string | null
  uwvContactEmail?: string | null
  orderNumber?: string | null
  startDate?: string | null
  planVanAanpak?: Trajectory['planVanAanpak']
  maxHours?: number
  maxAdminHours?: number
  updatedAtUnixMs: number
}): Promise<void> {
  await callSecureApi('/trajectories/update', {
    ...params,
    clientId: params.coacheeId,
    serviceType: params.dienstType,
    planOfAction: params.planVanAanpak,
  })
}

export async function deleteTrajectoryRemote(id: string): Promise<void> {
  await callSecureApi('/trajectories/delete', { id })
}
