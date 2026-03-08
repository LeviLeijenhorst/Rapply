export function parseTimeLabelToSeconds(timeLabel: string) {
  const timeParts = timeLabel.split(':')
  if (timeParts.length < 2 || timeParts.length > 3) return null
  const hours = timeParts.length === 3 ? Number(timeParts[0]) : 0
  const minutes = Number(timeParts.length === 3 ? timeParts[1] : timeParts[0])
  const rawSeconds = timeParts[timeParts.length - 1].replace(',', '.')
  const seconds = Number.parseFloat(rawSeconds)
  if ([hours, minutes, seconds].some((value) => Number.isNaN(value))) return null
  return hours * 3600 + minutes * 60 + seconds
}
