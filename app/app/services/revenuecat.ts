import { Platform } from "react-native"
import Purchases, { LOG_LEVEL, PRORATION_MODE, type CustomerInfo, type GoogleProductChangeInfo } from "react-native-purchases"
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui"
import Config from "@/config"
import { logger } from "@/utils/logger"
import type { SubscriptionPlanKey } from "@/screens/subscriptionFlowData"
import { postToSecureApi } from "@/services/secureApi"
import { getAllKnownSubscriptionBaseProductIds, getPlanKeyFromSubscriptionProductId, normalizeSubscriptionProductId } from "@/services/subscriptionCatalog"
import { isLikelyNoConnectionError } from "@/utils/networkErrors"

const EXTRA_TRANSCRIPTION_PRODUCT_ID = "extra_transcription_1h"

const ENTITLEMENT_KEY = "paid_features"

const isDev = typeof __DEV__ !== "undefined" && __DEV__
let isTestStoreApiKeyConfigured = false

let purchasesLockTail: Promise<void> = Promise.resolve()

async function runPurchasesOperation<T>(label: string, operation: () => Promise<T>): Promise<T> {
  const shouldLog = label.startsWith("purchase") || label === "restorePurchases"
  const queuedAtMs = Date.now()
  let release: () => void = () => {}
  const current = new Promise<void>((resolve) => {
    release = resolve
  })
  const previous = purchasesLockTail
  purchasesLockTail = current
  await previous
  const startedAtMs = Date.now()
  const waitMs = startedAtMs - queuedAtMs
  if (shouldLog) {
    logger.info("[RevenueCat] operation:start", { label, waitMs })
  }
  if (waitMs > 800) {
    logger.warn(`[RevenueCat] Purchases operation waited ${waitMs}ms: ${label}`)
  }
  try {
    const result = await operation()
    const durationMs = Date.now() - startedAtMs
    if (shouldLog) {
      logger.info("[RevenueCat] operation:done", { label, durationMs })
    }
    if (durationMs > 2500) {
      logger.warn(`[RevenueCat] Purchases operation slow ${durationMs}ms: ${label}`)
    }
    return result
  } catch (error) {
    const durationMs = Date.now() - startedAtMs
    if (shouldLog) {
      try {
        logger.warn("[RevenueCat] operation:error", { label, durationMs, message: String((error as any)?.message || error || "") })
      } catch {}
    }
    throw error
  } finally {
    try {
      release()
    } catch {}
  }
}

function getRevenueCatApiKey(): string | undefined {
  if (Platform.OS === "ios") return Config.REVENUECAT_IOS_API_KEY
  if (Platform.OS === "android") return Config.REVENUECAT_ANDROID_API_KEY
  return undefined
}

export function configureRevenueCat() {
  Purchases.setLogLevel(LOG_LEVEL.INFO)
  const apiKey = getRevenueCatApiKey()
  if (!apiKey) {
    logger.error("[RevenueCat] Missing API key for platform:", Platform.OS)
    return
  }
  isTestStoreApiKeyConfigured = apiKey.startsWith("test_")
  if (!isDev && apiKey.startsWith("test_")) {
    console.error("[RevenueCat] Refusing to configure with a test key in a production build.")
    return
  }
  logger.info("[RevenueCat] Configuring with platform:", Platform.OS)
  logger.info("[RevenueCat] Using config key:", Platform.OS === "ios" ? "REVENUECAT_IOS_API_KEY" : "REVENUECAT_ANDROID_API_KEY")
  Purchases.configure({ apiKey, appUserID: undefined, useAmazon: false })
}

let lastSyncedUserId: string | null | undefined = undefined

export async function syncRevenueCatIdentity(userId: string | null) {
  const next = userId ? userId.trim() : null
  if (next === lastSyncedUserId) return

  if (next) {
    try {
      await runPurchasesOperation("logIn", async () => {
        await Purchases.logIn(next)
      })
      lastSyncedUserId = next
      return
    } catch (error) {
      if (isLikelyNoConnectionError(error)) {
        logger.warn("[RevenueCat] Log in skipped (no connection)")
        return
      }
      logger.error("[RevenueCat] Failed to log in:", error)
      throw error
    }
  }

  try {
    await runPurchasesOperation("logOut", async () => {
      await Purchases.logOut()
    })
    lastSyncedUserId = null
  } catch (error) {
    if (isLikelyNoConnectionError(error)) {
      logger.warn("[RevenueCat] Log out skipped (no connection)")
      return
    }
    logger.error("[RevenueCat] Failed to log out:", error)
    throw error
  }
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    const info = await getCustomerInfoSingleFlight()
    return info
  } catch {
    return null
  }
}

export function hasProEntitlement(info: CustomerInfo | null | undefined): boolean {
  if (!info) return false
  const entitlements = info.entitlements?.active || {}
  return typeof entitlements[ENTITLEMENT_KEY] !== "undefined"
}

export async function presentPaywall(): Promise<boolean> {
  try {
    const result = await RevenueCatUI.presentPaywall()
    if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) return true
    return false
  } catch {
    return false
  }
}

export async function presentCustomerCenter(): Promise<boolean> {
  try {
    await RevenueCatUI.presentCustomerCenter()
    return true
  } catch {
    return false
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    await runPurchasesOperation("restorePurchases", async () => {
      await Purchases.restorePurchases()
    })
    return true
  } catch {
    return false
  }
}

let customerInfoInFlight: Promise<CustomerInfo> | null = null
async function getCustomerInfoSingleFlight(): Promise<CustomerInfo> {
  if (customerInfoInFlight) return await customerInfoInFlight
  customerInfoInFlight = runPurchasesOperation("getCustomerInfo", async () => {
    return await Purchases.getCustomerInfo()
  }).finally(() => {
    customerInfoInFlight = null
  })
  return await customerInfoInFlight
}

let offeringsInFlight: Promise<any> | null = null
async function getOfferingsSingleFlight(): Promise<any> {
  if (offeringsInFlight) return await offeringsInFlight
  offeringsInFlight = runPurchasesOperation("getOfferings", async () => {
    return await Purchases.getOfferings()
  }).finally(() => {
    offeringsInFlight = null
  })
  return await offeringsInFlight
}

function getActiveSubscriptionStoreIdentifier(info: CustomerInfo | null | undefined): string | null {
  if (!info) return null
  const active = Array.isArray((info as any)?.activeSubscriptions) ? ((info as any).activeSubscriptions as string[]) : []
  const ids = active.map((v) => String(v || "").trim()).filter(Boolean)
  const knownBaseProductIds = getAllKnownSubscriptionBaseProductIds()
  const candidateIds = ids.filter((id) => {
    const base = normalizeSubscriptionProductId(id)
    return knownBaseProductIds.includes(base)
  })
  if (candidateIds.length === 0) return null

  return candidateIds[candidateIds.length - 1] ?? null
}

function getMostRecentlyPurchasedSubscriptionStoreIdentifier(info: CustomerInfo | null | undefined): string | null {
  if (!info) return null
  const allPurchaseDates = (info as any)?.allPurchaseDates ?? {}
  const knownBaseProductIds = getAllKnownSubscriptionBaseProductIds()

  function parseDateMs(value: any): number | null {
    const s = typeof value === "string" ? value.trim() : ""
    if (!s) return null
    const ms = Date.parse(s)
    if (!Number.isFinite(ms)) return null
    return ms
  }

  const candidates: Array<{ id: string; ms: number }> = []
  for (const baseId of knownBaseProductIds) {
    const ms = parseDateMs(allPurchaseDates?.[baseId])
    if (ms !== null) {
      candidates.push({ id: baseId, ms })
    }
  }

  if (candidates.length === 0) return null
  candidates.sort((a, b) => b.ms - a.ms)
  return candidates[0]?.id ?? null
}

export function getCurrentPlanKeyFromCustomerInfo(info: CustomerInfo | null | undefined): SubscriptionPlanKey | null {
  const mostRecent = getMostRecentlyPurchasedSubscriptionStoreIdentifier(info)
  if (mostRecent) return getPlanKeyFromSubscriptionProductId(mostRecent)
  const activeStoreIdentifier = getActiveSubscriptionStoreIdentifier(info)
  return getPlanKeyFromSubscriptionProductId(activeStoreIdentifier)
}

export async function getOfferingByLookupKey(lookupKey: string): Promise<any | null> {
  const key = String(lookupKey || "").trim()
  if (!key) return null
  const offerings = await getOfferingsSingleFlight()
  const all = (offerings as any)?.all ?? {}
  const offering = all?.[key]
  return offering ?? null
}

export async function purchaseSubscriptionProductId(params: { offeringLookupKey: string; productId: string }): Promise<CustomerInfo> {
  const offeringLookupKey = String(params.offeringLookupKey || "").trim()
  const productId = String(params.productId || "").trim()
  if (!offeringLookupKey) throw new Error("Missing offeringLookupKey")
  if (!productId) throw new Error("Missing productId")

  const beforeInfo = await getCustomerInfoSingleFlight()
  const oldProductIdentifier = getActiveSubscriptionStoreIdentifier(beforeInfo)
  const googleProductChangeInfo: GoogleProductChangeInfo | null = (() => {
    if (Platform.OS !== "android") return null
    if (isTestStoreApiKeyConfigured) return null
    const oldId = String(oldProductIdentifier || "").trim()
    const newId = String(productId || "").trim()
    if (!oldId) return null
    if (!newId) return null
    if (normalizeSubscriptionProductId(oldId) === normalizeSubscriptionProductId(newId)) return null
    return {
      oldProductIdentifier: oldId,
      prorationMode: PRORATION_MODE.IMMEDIATE_WITH_TIME_PRORATION,
    }
  })()

  try {
    const active = Array.isArray((beforeInfo as any)?.activeSubscriptions) ? ((beforeInfo as any).activeSubscriptions as string[]) : []
    logger.info("[RevenueCat] purchaseSubscriptionProductId: platform:", Platform.OS)
    logger.info("[RevenueCat] purchaseSubscriptionProductId: targetBaseProductId:", productId)
    logger.info("[RevenueCat] purchaseSubscriptionProductId: activeSubscriptions:", active)
    logger.info("[RevenueCat] purchaseSubscriptionProductId: derivedOldProductIdentifier:", oldProductIdentifier)
    logger.info("[RevenueCat] purchaseSubscriptionProductId: googleProductChangeInfo:", googleProductChangeInfo)
  } catch {}

  const offering = await getOfferingByLookupKey(offeringLookupKey)
  if (!offering) throw new Error("Offering not found")

  const availablePackages = Array.isArray(offering?.availablePackages) ? offering.availablePackages : []
  const matchingPackage = availablePackages.find((p: any) => {
    const storeId = String(p?.product?.identifier || "").trim()
    return normalizeSubscriptionProductId(storeId) === normalizeSubscriptionProductId(productId)
  })
  if (!matchingPackage) throw new Error("Subscription product not found in offering")

  try {
    const storeId = String((matchingPackage as any)?.product?.identifier || "").trim()
    const priceString = String((matchingPackage as any)?.product?.priceString || "").trim()
    logger.info("[RevenueCat] purchaseSubscriptionProductId: matchingPackage storeId:", storeId)
    logger.info("[RevenueCat] purchaseSubscriptionProductId: matchingPackage priceString:", priceString)
  } catch {}

  const result = await runPurchasesOperation("purchasePackage", async () => {
    return await Purchases.purchasePackage(matchingPackage, null, googleProductChangeInfo, null)
  })
  const info = (result as any)?.customerInfo as CustomerInfo | undefined
  if (!info) {
    const refreshed = await getCustomerInfoSingleFlight()
    return refreshed
  }
  try {
    await runPurchasesOperation("syncPurchases", async () => {
      await Purchases.syncPurchases()
    })
    await runPurchasesOperation("invalidateCustomerInfoCache", async () => {
      await Purchases.invalidateCustomerInfoCache()
    })
  } catch {}
  const refreshed = await getCustomerInfoSingleFlight()
  try {
    const active = Array.isArray((refreshed as any)?.activeSubscriptions) ? ((refreshed as any).activeSubscriptions as string[]) : []
    logger.info("[RevenueCat] purchaseSubscriptionProductId: refreshed activeSubscriptions:", active)
    logger.info("[RevenueCat] purchaseSubscriptionProductId: refreshed currentPlanKey:", getCurrentPlanKeyFromCustomerInfo(refreshed))
  } catch {}
  return refreshed
}

let extraTranscriptionProductInFlight: Promise<any | null> | null = null

export async function getExtraTranscriptionStoreProduct(): Promise<any | null> {
  if (extraTranscriptionProductInFlight) return await extraTranscriptionProductInFlight
  extraTranscriptionProductInFlight = (async () => {
    const products = await runPurchasesOperation("getProducts(extra)", async () => {
      return await Purchases.getProducts([EXTRA_TRANSCRIPTION_PRODUCT_ID], Purchases.PURCHASE_TYPE.INAPP)
    })
    const first = Array.isArray(products) ? products[0] : null
    return first ?? null
  })().finally(() => {
    extraTranscriptionProductInFlight = null
  })
  return await extraTranscriptionProductInFlight
}

export async function purchaseExtraTranscriptionHour(): Promise<void> {
  await runPurchasesOperation("purchaseProduct(extra)", async () => {
    await Purchases.purchaseProduct(EXTRA_TRANSCRIPTION_PRODUCT_ID, null, Purchases.PURCHASE_TYPE.INAPP)
  })
  await postToSecureApi("/billing/sync", {})
}

function stringifyForLog(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export async function logRevenueCatInformation(source: string): Promise<void> {
  logger.info("[RevenueCat] Logging all RevenueCat information. Source:", source)

  try {
    const appUserId = await Purchases.getAppUserID()
    logger.info("[RevenueCat] App user id:", appUserId)
  } catch (error) {
    logger.error("[RevenueCat] Failed to read app user id:", error)
  }

  let customerInfo: CustomerInfo | null = null
  try {
    customerInfo = await getCustomerInfoSingleFlight()
    logger.info("[RevenueCat] Customer info:", stringifyForLog(customerInfo))
  } catch (error) {
    logger.error("[RevenueCat] Failed to read customer info:", error)
  }

  let offerings: any = null
  try {
    offerings = await getOfferingsSingleFlight()
    logger.info("[RevenueCat] Offerings:", stringifyForLog(offerings))
  } catch (error) {
    logger.error("[RevenueCat] Failed to read offerings:", error)
  }

  try {
    const productIdentifiers = new Set<string>()
    const allOfferings = offerings?.all ?? {}
    Object.values(allOfferings).forEach((offering: any) => {
      const packages = Array.isArray(offering?.availablePackages) ? offering.availablePackages : []
      packages.forEach((availablePackage: any) => {
        const storeProduct = availablePackage?.product
        const identifier = storeProduct?.identifier
        if (typeof identifier === "string" && identifier.trim()) {
          productIdentifiers.add(identifier)
        }
      })
    })

    const identifiersArray = Array.from(productIdentifiers)
    logger.info("[RevenueCat] Product identifiers found in offerings:", stringifyForLog(identifiersArray))

    if (identifiersArray.length > 0) {
      const products = await Purchases.getProducts(identifiersArray)
      logger.info("[RevenueCat] Products:", stringifyForLog(products))
    } else {
      logger.info("[RevenueCat] No product identifiers found in offerings, skipping product fetch.")
    }
  } catch (error) {
    logger.error("[RevenueCat] Failed to read products from offerings:", error)
  }

  if (customerInfo) {
    const activeEntitlements = customerInfo.entitlements?.active ?? {}
    logger.info("[RevenueCat] Active entitlements:", stringifyForLog(activeEntitlements))
  }
}




