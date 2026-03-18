import { listFiles, readEncryptedFile, writeEncryptedFile } from "@/screens/EncryptedStorage"
import { postToSecureApi } from "./secureApi"

type ChatItem = { id: string; role: "assistant" | "user"; text: string; date: number }

function slugifyId(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_")
}

function coacheeDir(coacheeName: string) {
  const coacheeId = coacheeName.trim() ? slugifyId(coacheeName) : "loose_recordings"
  return `Rapply/coachees/${coacheeId}`
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
  return `Rapply/coachees/${coacheeId}/${conversationId}`
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
  const root = `Rapply/coachees/${coacheeId}`
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

export async function loadLatestConversationTranscriptForCoachee(coacheeName: string) {
  const name = coacheeName.trim()
  const coacheeId = name ? slugifyId(name) : "loose_recordings"
  const root = `Rapply/coachees/${coacheeId}`
  try {
    const entries = await listFiles(root)
    const conversationIds = entries
      .filter((entry) => isConversationId(entry))
      .sort((a, b) => Number(b) - Number(a))
    for (const conversationId of conversationIds) {
      try {
        const files = await listFiles(`${root}/${conversationId}`)
        if (!files.includes("transcript.txt.enc")) continue
        const transcript = await readEncryptedFile(`${root}/${conversationId}`, "transcript.txt.enc")
        return { conversationId, transcript }
      } catch {}
    }
  } catch {}
  return null
}

type ConversationTranscriptEntry = {
  conversationId: string
  title: string | null
  transcript: string
}

function normalizeText(value: string | null | undefined) {
  return String(value || "").trim()
}

export async function loadConversationTranscriptsForCoachee(params: {
  coacheeName: string
  excludeConversationId?: string
  maxTotalCharacters?: number
  maxTranscriptCharactersPerConversation?: number
  maxConversations?: number
}): Promise<{ entries: ConversationTranscriptEntry[]; isTruncated: boolean }> {
  const name = params.coacheeName.trim()
  const coacheeId = name ? slugifyId(name) : "loose_recordings"
  const root = `Rapply/coachees/${coacheeId}`
  const maxTotalCharacters = Math.max(1000, params.maxTotalCharacters ?? 60000)
  const maxTranscriptCharactersPerConversation = Math.max(1000, params.maxTranscriptCharactersPerConversation ?? 8000)
  const maxConversations = Math.max(1, params.maxConversations ?? 50)

  const entries: ConversationTranscriptEntry[] = []
  let totalCharacters = 0
  let isTruncated = false

  try {
    const dirEntries = await listFiles(root)
    const conversationIds = dirEntries
      .filter((entry) => isConversationId(entry))
      .filter((entry) => !params.excludeConversationId || entry !== params.excludeConversationId)
      .sort((a, b) => Number(b) - Number(a))

    for (const conversationId of conversationIds) {
      if (entries.length >= maxConversations) {
        isTruncated = true
        break
      }
      if (totalCharacters >= maxTotalCharacters) {
        isTruncated = true
        break
      }
      try {
        const files = await listFiles(`${root}/${conversationId}`)
        if (!files.includes("transcript.txt.enc")) continue

        const transcriptRaw = await readEncryptedFile(`${root}/${conversationId}`, "transcript.txt.enc")
        const transcript = normalizeText(transcriptRaw)
        if (!transcript) continue

        let title: string | null = null
        try {
          if (files.includes("title.txt.enc")) {
            const titleRaw = await readEncryptedFile(`${root}/${conversationId}`, "title.txt.enc")
            const normalizedTitle = normalizeText(titleRaw)
            title = normalizedTitle ? normalizedTitle : null
          }
        } catch {}

        const clippedTranscript = clip(transcript, maxTranscriptCharactersPerConversation)
        const nextTotal = totalCharacters + clippedTranscript.length
        if (nextTotal > maxTotalCharacters) {
          isTruncated = true
          break
        }

        entries.push({ conversationId, title, transcript: clippedTranscript })
        totalCharacters = nextTotal
      } catch {}
    }
  } catch {}

  return { entries, isTruncated }
}

export async function getTranscriptForConversation(coacheeName: string, conversationId: string) {
  const name = coacheeName.trim()
  const coacheeId = name ? slugifyId(name) : "loose_recordings"
  const dir = `Rapply/coachees/${coacheeId}/${conversationId}`
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
  scope: "conversation" | "coachee"
  coacheeName: string
  currentConversationId?: string | null
  userQuestion: string
  currentTranscript?: string
  previousSummaries: { conversationId: string; summary: string }[]
  coacheeConversationTranscripts?: { conversationId: string; title?: string | null; transcript: string }[]
  coacheeConversationTranscriptsTruncated?: boolean
}): Promise<string> {
  const {
    scope,
    coacheeName,
    currentConversationId,
    userQuestion,
    currentTranscript,
    previousSummaries,
    coacheeConversationTranscripts,
    coacheeConversationTranscriptsTruncated,
  } = params
  const summariesList = previousSummaries
    .map((s) => `- ${s.conversationId}: ${clip(s.summary, 2000)}`)
    .join("\n")

  const transcriptEntries = Array.isArray(coacheeConversationTranscripts) ? coacheeConversationTranscripts : []
  const hasAnyTranscriptEntries = transcriptEntries.length > 0
  const hasCurrentTranscript = !!normalizeText(currentConversationId) && !!normalizeText(currentTranscript)
  const hasAnySummaries = previousSummaries.length > 0
  const isConversationScope = scope === "conversation"

  const transcriptContextList = hasAnyTranscriptEntries
    ? transcriptEntries
        .map((entry, index) => {
          const titlePart = normalizeText(entry.title) ? ` - ${normalizeText(entry.title)}` : ""
          return `${index + 1}. ${entry.conversationId}${titlePart}\n${normalizeText(entry.transcript)}`
        })
        .join("\n\n")
    : ""

  const systemA = `
Je bent een Nederlandstalige AI-assistent voor coaches. Beantwoord vragen over gesprekken met ${coacheeName}.
Gebruik alleen informatie uit de aangeleverde context en de vraag van de gebruiker.
Verzin geen feiten of actiepunten.
Noem alleen actiepunten die expliciet in de context of vraag staan.
Als er geen expliciete actiepunten zijn, zeg dat duidelijk.
Wees beknopt, feitelijk en behulpzaam.`

  const contextPrev = hasAnySummaries
    ? `Samenvattingen van gesprekken:\n${summariesList}`
    : `Er zijn nog geen samenvattingen beschikbaar.`

  const contextAllTranscripts = hasAnyTranscriptEntries
    ? `Transcripties van gesprekken:\n\n${transcriptContextList}${coacheeConversationTranscriptsTruncated ? "\n\nLet op: niet alle transcripties passen in de context. Oudere transcripties zijn weggelaten." : ""}`
    : `Er zijn nog geen transcripties beschikbaar.`

  const contextNow = hasCurrentTranscript
    ? `Huidige transcriptie (${String(currentConversationId)}):\n${clip(normalizeText(currentTranscript), 20000)}`
    : ""

  const scopeInstruction = isConversationScope
    ? "Scope: alleen de huidige sessie. Gebruik geen context uit andere sessies."
    : "Scope: alle beschikbare gesprekken van deze coachee."

  const messages: any[] = [
    { role: "system", content: systemA },
    { role: "system", content: scopeInstruction },
    ...(!isConversationScope ? [{ role: "system", content: contextAllTranscripts }] : []),
    ...(!isConversationScope ? [{ role: "system", content: contextPrev }] : []),
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
