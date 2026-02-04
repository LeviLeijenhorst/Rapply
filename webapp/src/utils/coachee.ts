export const unassignedCoacheeLabel = 'Niet toegewezen'

type CoacheeItem = {
  id: string
  name: string
}

export function getCoacheeDisplayName(coachees: CoacheeItem[], coacheeId: string | null | undefined) {
  if (!coacheeId) return unassignedCoacheeLabel
  const match = coachees.find((coachee) => coachee.id === coacheeId)
  return match?.name ?? unassignedCoacheeLabel
}

export function isUnassignedCoacheeName(name: string) {
  return name === unassignedCoacheeLabel
}
