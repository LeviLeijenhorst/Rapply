import { env } from "../env"
import { completeAzureOpenAiChat, type ChatMessage } from "../ai/azureOpenAi"

function normalizeText(value: string) {
  return String(value || "").trim()
}

function safeClampTranscript(transcript: string) {
  const trimmed = normalizeText(transcript)
  if (!trimmed) {
    throw new Error("Missing transcript")
  }
  const maxChars = 60_000
  if (trimmed.length > maxChars) {
    throw new Error("Transcript is too long to summarize")
  }
  return trimmed
}

export async function generateSummaryWithAzureOpenAi(params: { transcript: string }): Promise<string> {
  const deployment = String(env.azureOpenAiSummaryDeployment || "").trim()
  if (!deployment) {
    throw new Error("Azure OpenAI summary deployment is not configured")
  }

  const transcript = safeClampTranscript(params.transcript)

  const systemPrompt =
    "Je bent een assistent voor CoachScribe. Vat een coachgesprek samen in het Nederlands. " +
    "Noem geen medische details die niet in de tekst staan. " +
    "Gebruik duidelijke kopjes en korte zinnen. " +
    "Schrijf geen persoonsgegevens zoals e-mailadressen of telefoonnummers."

  const userPrompt =
    "Maak een korte, bruikbare samenvatting met deze structuur:\n" +
    "- Kern (2-4 zinnen)\n" +
    "- Belangrijkste thema's (bullet list)\n" +
    "- Actiepunten (bullet list)\n" +
    "- Afspraken / vervolg (bullet list)\n\n" +
    "Transcript:\n" +
    transcript

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]

  const summary = await completeAzureOpenAiChat({
    deployment,
    messages,
    temperature: 0.2,
  })

  if (!summary) {
    throw new Error("Summary generation failed")
  }
  return summary
}
