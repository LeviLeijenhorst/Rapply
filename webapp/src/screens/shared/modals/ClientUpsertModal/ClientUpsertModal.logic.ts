import type { CalendarCell } from './ClientUpsertModal.types'

export const dayLabels = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

export function formatDateToInput(value: Date) {
  return `${pad2(value.getDate())}/${pad2(value.getMonth() + 1)}/${value.getFullYear()}`
}

export function toIsoDate(value: Date) {
  return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`
}

export function parseDateInput(value: string): Date | null {
  const trimmed = String(value || '').trim()
  const dutchMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (dutchMatch) {
    const day = Number(dutchMatch[1])
    const month = Number(dutchMatch[2])
    const year = Number(dutchMatch[3])
    if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null
    const candidate = new Date(year, month - 1, day)
    if (candidate.getFullYear() !== year || candidate.getMonth() !== month - 1 || candidate.getDate() !== day) return null
    return candidate
  }
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!isoMatch) return null
  const year = Number(isoMatch[1])
  const month = Number(isoMatch[2])
  const day = Number(isoMatch[3])
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null
  const candidate = new Date(year, month - 1, day)
  if (candidate.getFullYear() !== year || candidate.getMonth() !== month - 1 || candidate.getDate() !== day) return null
  return candidate
}

export function getCalendarCells(monthDate: Date): CalendarCell[] {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDayOfMonth = new Date(year, month, 1)
  const startWeekday = (firstDayOfMonth.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPreviousMonth = new Date(year, month, 0).getDate()
  const cells: CalendarCell[] = []

  for (let index = 0; index < 42; index += 1) {
    const dayOffset = index - startWeekday + 1
    let currentDate: Date
    let inCurrentMonth = true
    if (dayOffset <= 0) {
      currentDate = new Date(year, month - 1, daysInPreviousMonth + dayOffset)
      inCurrentMonth = false
    } else if (dayOffset > daysInMonth) {
      currentDate = new Date(year, month + 1, dayOffset - daysInMonth)
      inCurrentMonth = false
    } else {
      currentDate = new Date(year, month, dayOffset)
    }
    cells.push({
      isoDate: toIsoDate(currentDate),
      dayOfMonth: currentDate.getDate(),
      inCurrentMonth,
    })
  }

  return cells
}

function formatInitialsFromLetters(letters: string): string {
  if (!letters) return ''
  return `${letters.toUpperCase().split('').join('.')}.`
}

export function normalizeInitialsInput(raw: string, previousValue: string): string {
  const previousLetters = previousValue.replace(/[^A-Za-z]/g, '')
  const nextLettersFromRaw = raw.replace(/[^A-Za-z]/g, '')
  if (previousValue.endsWith('.') && raw === previousValue.slice(0, -1)) {
    return formatInitialsFromLetters(previousLetters.slice(0, -1))
  }
  return formatInitialsFromLetters(nextLettersFromRaw)
}

export function capitalizeFirstCharacter(value: string): string {
  if (!value) return value
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`
}

export function sanitizePhoneInput(raw: string): string {
  const compact = String(raw || '').replace(/\s+/g, '')
  const hasLeadingPlus = compact.startsWith('+')
  const digits = compact.replace(/\D/g, '')
  return `${hasLeadingPlus ? '+' : ''}${digits}`
}

function clampDateDigits(digits: string) {
  if (digits.length === 0) return digits
  const fallbackYear = new Date().getFullYear()
  const rawDay = digits.slice(0, Math.min(2, digits.length))
  const rawMonth = digits.length > 2 ? digits.slice(2, Math.min(4, digits.length)) : ''
  const rawYear = digits.length > 4 ? digits.slice(4) : ''

  let day = rawDay
  if (rawDay.length === 2) {
    const dayNumber = Number(rawDay)
    if (Number.isFinite(dayNumber)) {
      let maxDay = 31
      if (rawMonth.length === 2) {
        const monthNumber = Number(rawMonth)
        if (monthNumber >= 1 && monthNumber <= 12) {
          const yearForCalc = rawYear.length === 4 ? Number(rawYear) : fallbackYear
          maxDay = new Date(yearForCalc, monthNumber, 0).getDate()
        }
      }
      day = pad2(Math.max(1, Math.min(dayNumber, maxDay)))
    }
  }

  let month = rawMonth
  if (rawMonth.length === 2) {
    const monthNumber = Number(rawMonth)
    if (Number.isFinite(monthNumber)) {
      month = pad2(Math.max(1, Math.min(monthNumber, 12)))
    }
  }

  if (day.length === 2 && month.length === 2) {
    const dayNumber = Number(day)
    const monthNumber = Number(month)
    if (Number.isFinite(dayNumber) && Number.isFinite(monthNumber) && monthNumber >= 1 && monthNumber <= 12) {
      const yearForCalc = rawYear.length === 4 ? Number(rawYear) : fallbackYear
      const maxDay = new Date(yearForCalc, monthNumber, 0).getDate()
      day = pad2(Math.max(1, Math.min(dayNumber, maxDay)))
    }
  }

  return `${day}${month}${rawYear}`.slice(0, 8)
}

export function formatDateInput(raw: string, previousValue: string) {
  const previousDigits = previousValue.replace(/\D/g, '').slice(0, 8)
  const rawDigits = raw.replace(/\D/g, '').slice(0, 8)
  const digits = clampDateDigits(rawDigits)
  const isDeleting = rawDigits.length < previousDigits.length
  const endsAtSecondSeparator = previousValue.endsWith('/') && rawDigits.length === previousDigits.length

  if (isDeleting && endsAtSecondSeparator) {
    const digitsWithoutMonth = digits.slice(0, 2)
    return digitsWithoutMonth.length === 2 ? `${digitsWithoutMonth}/` : digitsWithoutMonth
  }

  if (isDeleting && previousValue.endsWith('/') && previousDigits.length === 2 && rawDigits.length === 2) {
    return digits
  }

  if (digits.length <= 2) return digits.length === 2 ? `${digits}/` : digits
  if (digits.length <= 4) {
    const monthPart = digits.slice(2)
    return digits.length === 4 ? `${digits.slice(0, 2)}/${monthPart}/` : `${digits.slice(0, 2)}/${monthPart}`
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}
