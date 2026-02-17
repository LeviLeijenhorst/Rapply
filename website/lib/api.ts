const apiBaseUrl = String(process.env.NEXT_PUBLIC_COACHSCRIBE_API_BASE_URL || "").trim()

export function getApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_COACHSCRIBE_API_BASE_URL ontbreekt.")
  }
  return `${apiBaseUrl.replace(/\/+$/, "")}${normalizedPath}`
}
