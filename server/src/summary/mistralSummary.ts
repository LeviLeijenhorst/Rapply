import { env } from "../env"

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

export async function generateSummaryWithMistral(params: { transcript: string }): Promise<string> {
  const apiKey = String(env.mistralApiKey || "").trim()
  if (!apiKey) {
    throw new Error("Mistral API key is not configured")
  }

  const model = String(env.mistralSummaryModel || "").trim()
  if (!model) {
    throw new Error("Mistral summary model is not configured")
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

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  })

  const textBody = await response.text().catch(() => "")
  if (!response.ok) {
    throw new Error(`Mistral summary failed: ${textBody || response.statusText || "Unknown error"}`)
  }

  const json: any = textBody ? JSON.parse(textBody) : null
  const content = json?.choices?.[0]?.message?.content
  const summary = normalizeText(typeof content === "string" ? content : "")
  if (!summary) {
    throw new Error("Summary generation failed")
  }
  return summary
}

