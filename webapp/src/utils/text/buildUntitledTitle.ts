export type UntitledInputKind = 'verslag' | 'gesprek'

function formatDutchDate(date: Date): string {
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function buildUntitledInputTitle(kind: UntitledInputKind, date: Date = new Date()): string {
  const prefix = kind === 'verslag' ? 'Naamloos verslag' : 'Naamloos gesprek'
  return `${prefix} op ${formatDutchDate(date)}`
}

