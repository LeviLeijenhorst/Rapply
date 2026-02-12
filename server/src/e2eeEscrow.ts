import { env } from "./env"

function ensureEscrowConfigured() {
  if (!env.e2eeEscrowServiceUrl || !env.e2eeEscrowServiceApiKey) {
    throw new Error("E2EE escrow service is not configured")
  }
}

async function postEscrow<T>(path: string, payload: unknown): Promise<T> {
  ensureEscrowConfigured()
  const baseUrl = env.e2eeEscrowServiceUrl.replace(/\/+$/g, "")
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.e2eeEscrowServiceApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload ?? {}),
  })

  const text = await response.text()
  let json: any = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }
  if (!response.ok) {
    const message = (json && (json.error || json.message)) || text || `Escrow request failed (${response.status})`
    throw new Error(String(message))
  }
  return (json || {}) as T
}

export async function storeRecoveryKeyInEscrow(params: {
  userId: string
  recoveryKey: string
  wrappedUserDataKeyForRecovery: string
}): Promise<{ referenceId: string }> {
  const result = await postEscrow<{ referenceId?: string }>("/v1/recovery/store", {
    userId: params.userId,
    recoveryKey: params.recoveryKey,
    wrappedUserDataKeyForRecovery: params.wrappedUserDataKeyForRecovery,
  })
  const referenceId = typeof result?.referenceId === "string" ? result.referenceId.trim() : ""
  if (!referenceId) {
    throw new Error("Escrow response missing referenceId")
  }
  return { referenceId }
}

export async function readRecoveryKeyFromEscrow(params: {
  userId: string
}): Promise<{ recoveryKey: string; referenceId: string | null }> {
  const result = await postEscrow<{ recoveryKey?: string; referenceId?: string | null }>("/v1/recovery/read", {
    userId: params.userId,
  })
  const recoveryKey = typeof result?.recoveryKey === "string" ? result.recoveryKey.trim() : ""
  if (!recoveryKey) {
    throw new Error("Escrow response missing recoveryKey")
  }
  const referenceId = typeof result?.referenceId === "string" ? result.referenceId.trim() : null
  return { recoveryKey, referenceId }
}

