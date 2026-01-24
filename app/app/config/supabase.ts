import { Platform } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { createClient } from "@supabase/supabase-js"
import Config from "@/config"

export function getSupabaseUrl(): string {
  const url = typeof (Config as any).SUPABASE_URL === "string" ? String((Config as any).SUPABASE_URL).trim() : ""
  if (!url) {
    throw new Error("Missing SUPABASE_URL in config")
  }
  return url.replace(/\/+$/, "")
}

export function getSupabasePublishableKey(): string {
  const key =
    typeof (Config as any).SUPABASE_PUBLISHABLE_KEY === "string"
      ? String((Config as any).SUPABASE_PUBLISHABLE_KEY).trim()
      : ""
  if (!key) {
    throw new Error("Missing SUPABASE_PUBLISHABLE_KEY in config")
  }
  return key
}

const url = getSupabaseUrl()
const key = getSupabasePublishableKey()

export const supabase = createClient(url, key, {
  auth: {
    storage: Platform.OS === "web" ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
})

export async function getSupabaseAccessToken(): Promise<string> {
  const sessionResult = await supabase.auth.getSession()
  const token = sessionResult.data.session?.access_token
  if (!token) {
    throw new Error("Not signed in")
  }
  const dotCount = (token.match(/\./g) || []).length
  if (dotCount !== 2) {
    throw new Error("Invalid session token, please sign in again")
  }
  return token
}

export async function getSupabaseUserId(): Promise<string> {
  const sessionResult = await supabase.auth.getSession()
  const userId = sessionResult.data.session?.user?.id
  if (!userId) {
    throw new Error("Not signed in")
  }
  return userId
}

