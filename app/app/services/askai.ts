import { listFiles, readEncryptedFile, writeEncryptedFile } from "@/screens/EncryptedStorage"
import { postToSecureApi } from "./secureApi"

type ChatItem = { id: string; role: "assistant" | "user"; text: string; date: number }

function slugifyId(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_")
}

function coacheeDir(coacheeName: string) {
  const coacheeId = coacheeName.trim() ? slugifyId(coacheeName) : "loose_recordings"
  return `CoachScribe/coachees/${coacheeId}`
}

function isConversationId(value: string) {
  const v = String(value || "").trim()
  if (!/^\d+$/.test(v)) return false
  const n = Number(v)
  if (!Number.isFinite(n) || n <= 0) return false
  return true
}

function baseDir(coacheeName: string, conversationId: string) {
  const coacheeId = coacheeName.trim() ? slugifyId(coacheeName) : "loose_recordings"
  return `CoachScribe/coachees/${coacheeId}/${conversationId}`
}

async function readJson(directory: string, fileName: string) {
  const txt = await readEncryptedFile(directory, fileName)
  return JSON.parse(txt)
}

export async function loadAskAiHistory(coacheeName: string, conversationId: string): Promise<ChatItem[]> {
  const b = baseDir(coacheeName, conversationId)
  try {
    const files = await listFiles(b)
    if (!files.includes("askai.json.enc")) return []
    const json = await readJson(b, "askai.json.enc")
    if (Array.isArray(json)) {
      let arr = json as ChatItem[]
      while (arr.length > 0 && arr[0]?.role === "assistant") {
        arr = arr.slice(1)
      }
      return arr
    }
    return []
  } catch {
    return []
  }
}

export async function saveAskAiHistory(coacheeName: string, conversationId: string, items: ChatItem[]) {
  const b = baseDir(coacheeName, conversationId)
  const payload = JSON.stringify(items)
  await writeEncryptedFile(b, "askai.json.enc", payload, "text")
}

export async function loadCoacheeAskAiHistory(coacheeName: string): Promise<ChatItem[]> {
  const dir = coacheeDir(coacheeName)
  try {
    const files = await listFiles(dir)
    if (!files.includes("askai_coachee.json.enc")) return []
    const json = await readJson(dir, "askai_coachee.json.enc")
    if (Array.isArray(json)) {
      let arr = json as ChatItem[]
      while (arr.length > 0 && arr[0]?.role === "assistant") {
        arr = arr.slice(1)
      }
      return arr
    }
    return []
  } catch {
    return []
  }
}

export async function saveCoacheeAskAiHistory(coacheeName: string, items: ChatItem[]) {
  const dir = coacheeDir(coacheeName)
  const payload = JSON.stringify(items)
  await writeEncryptedFile(dir, "askai_coachee.json.enc", payload, "text")
}

export async function loadSummariesForCoachee(coacheeName: string, excludeConversationId?: string) {
  const name = coacheeName.trim()
  const coacheeId = name ? slugifyId(name) : "loose_recordings"
  const root = `CoachScribe/coachees/${coacheeId}`
  const result: { conversationId: string; summary: string }[] = []
  try {
    const entries = await listFiles(root)
    for (const entry of entries) {
      if (!isConversationId(entry)) continue
      if (excludeConversationId && entry === excludeConversationId) continue
      try {
        const files = await listFiles(`${root}/${entry}`)
        if (files.includes("summary.txt.enc")) {
          const s = await readEncryptedFile(`${root}/${entry}`, "summary.txt.enc")
          result.push({ conversationId: entry, summary: s })
        }
      } catch {}
    }
  } catch {}
  return result
}

export async function getTranscriptForConversation(coacheeName: string, conversationId: string) {
  const name = coacheeName.trim()
  const coacheeId = name ? slugifyId(name) : "loose_recordings"
  const dir = `CoachScribe/coachees/${coacheeId}/${conversationId}`
  const files = await listFiles(dir)
  if (!files.includes("transcript.txt.enc")) {
    throw new Error("Transcript not found")
  }
  const txt = await readEncryptedFile(dir, "transcript.txt.enc")
  return txt
}

function clip(input: string, max: number) {
  if (typeof input !== "string") return ""
  if (input.length <= max) return input
  return input.slice(0, max)
}

export async function askAssistant(params: {
  coacheeName: string
  currentConversationId?: string | null
  userQuestion: string
  currentTranscript?: string
  previousSummaries: { conversationId: string; summary: string }[]
}): Promise<string> {
  const { coacheeName, currentConversationId, userQuestion, currentTranscript, previousSummaries } = params
  const summariesList = previousSummaries
    .map((s) => `- ${s.conversationId}: ${clip(s.summary, 2000)}`)
    .join("\n")
  const availableIds = previousSummaries.map((s) => s.conversationId)
  const hasCurrentTranscript = !!(String(currentConversationId || "").trim() && String(currentTranscript || "").trim())
  const systemA = hasCurrentTranscript
    ? `
Je bent een Nederlandstalige AI-assistent voor coaches. Beantwoord vragen over dit gesprek en eerdere gesprekken met dezelfde coachee.
Gebruik standaard:
- De transcriptie van het huidige gesprek.
- De samenvattingen van eerdere gesprekken.
Vraag alleen de volledige transcriptie van een eerder gesprek op via de tool als dat nodig is voor een nauwkeurig antwoord.
Respecteer de gebruikerstaal en wees beknopt, feitelijk en behulpzaam.`
    : `
Je bent een Nederlandstalige AI-assistent voor coaches. Beantwoord vragen over eerdere gesprekken met dezelfde coachee.
Gebruik standaard:
- De samenvattingen van gesprekken.
Vraag alleen de volledige transcriptie van een gesprek op via de tool als dat nodig is voor een nauwkeurig antwoord.
Respecteer de gebruikerstaal en wees beknopt, feitelijk en behulpzaam.`
  const contextNow = hasCurrentTranscript
    ? `Huidige transcriptie (${String(currentConversationId)}):\n${clip(currentTranscript || "", 20000)}`
    : ""
  const contextPrev = `Beschikbare eerdere gesprekken:\n${availableIds.join(", ")}\nSamenvattingen:\n${summariesList}`
  const messages: any[] = [
    { role: "system", content: systemA },
    { role: "system", content: contextPrev },
    ...(hasCurrentTranscript ? [{ role: "system", content: contextNow }] : []),
    { role: "user", content: userQuestion },
  ]
  const json = await postToSecureApi("/chat", {
    temperature: 0.2,
    messages,
  })
  const content = json?.text
  if (typeof content === "string" && content.trim()) return content.trim()
  return "Er ging iets mis. Probeer het later opnieuw."
}
