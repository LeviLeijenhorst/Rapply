import type { LocalAppData } from '../../../storage/types'

export function getNewClientTrajectoryLabel(data: LocalAppData): string {
  const firstNamedTrajectory = data.trajectories.find((trajectory) => String(trajectory.name || '').trim().length > 0)
  return firstNamedTrajectory?.name?.trim() || 'Werkfit maken'
}
