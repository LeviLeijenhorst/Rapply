export function maskEmail(email: string) {
  const trimmedEmail = email.trim()
  const atIndex = trimmedEmail.indexOf('@')
  if (atIndex === -1) return trimmedEmail

  const localPart = trimmedEmail.slice(0, atIndex)
  const domainPart = trimmedEmail.slice(atIndex + 1)

  const visibleLocalPartLength = Math.min(2, localPart.length)
  const maskedLocalPart = `******${localPart.slice(-visibleLocalPartLength)}`

  return `${maskedLocalPart}@${domainPart}`
}

export function maskPhoneNumber(phoneNumber: string) {
  const digitsOnly = phoneNumber.replace(/\D/g, '')
  if (digitsOnly.length <= 2) return digitsOnly

  const lastTwoDigits = digitsOnly.slice(-2)
  return `******${lastTwoDigits}`
}

