export function getErrorMessage(error: unknown): string {
  if (typeof error === "string") return error
  if (error && typeof error === "object" && "message" in error && typeof (error as any).message === "string") {
    return (error as any).message
  }
  try {
    return String(error)
  } catch {
    return ""
  }
}

export function isLikelyNoConnectionError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase()
  if (!message) return false

  if (message.includes("network request failed")) return true
  if (message.includes("networkerror")) return true
  if (message.includes("the internet connection appears to be offline")) return true
  if (message.includes("a network error has occurred")) return true
  if (message.includes("timed out")) return true
  if (message.includes("timeout")) return true
  if (message.includes("unable to resolve host")) return true
  if (message.includes("no address associated with hostname")) return true
  if (message.includes("econnreset")) return true
  if (message.includes("enotfound")) return true

  return false
}

