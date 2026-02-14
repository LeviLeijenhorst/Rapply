import { env } from "../env"
import { completeMistralChat, type ChatMessage } from "../ai/mistralChat"

// Intent: normalizeText
function normalizeText(value: unknown) {
  return String(value || "").trim()
}

// Intent: safeClampTranscript
function safeClampTranscript(transcript: string) {
  const trimmed = normalizeText(transcript)
  if (!trimmed) {
    throw new Error("Missing transcript")
  }
  const maxCharacters = 60_000
  if (trimmed.length > maxCharacters) {
    throw new Error("Transcript is too long to summarize")
  }
  return trimmed
}

// Intent: generateSummaryWithMistral
export async function generateSummaryWithMistral(params: { transcript: string; templateKey?: string; template?: { name: string; sections: { title: string; description: string }[] } }): Promise<string> {
  const transcript = safeClampTranscript(params.transcript)

  const templateKeyRaw = normalizeText(params.templateKey)
  const templateKey =
    templateKeyRaw === "soap" ||
    templateKeyRaw === "intake" ||
    templateKeyRaw === "voorbereiding" ||
    templateKeyRaw === "themas" ||
    templateKeyRaw === "gespreksplan"
      ? templateKeyRaw
      : "standaard"

  const systemPrompt =
    "Je bent een assistent voor CoachScribe. Vat een coachgesprek samen in het Nederlands. " +
    "Noem geen details die niet in de tekst staan. " +
    "Schrijf geen persoonsgegevens zoals e-mailadressen of telefoonnummers. " +
    "Gebruik alleen Markdown met kopjes die beginnen met '### ' en bullet points die beginnen met '- '. " +
    "Maak belangrijke woorden vetgedrukt door ze te omringen met **. Gebruik dit spaarzaam: maximaal 1 tot 3 vetgedrukte woorden per bullet point."

  const baseIntro = "Maak een korte, bruikbare samenvatting."
  const structure = params.template?.sections?.length
    ? buildTemplateStructure(params.template)
    : templateKey === "soap"
      ? "Gebruik deze structuur:\n" +
        "### Subjectief\n- ...\n" +
        "### Objectief\n- ...\n" +
        "### Analyse\n- ...\n" +
        "### Plan\n- ...\n"
      : templateKey === "intake"
        ? "Gebruik deze structuur:\n" +
          "### Doel van het gesprek\n- ...\n" +
          "### Achtergrond\n- ...\n" +
          "### Huidige situatie\n- ...\n" +
          "### Gewenste situatie\n- ...\n" +
          "### Obstakels\n- ...\n" +
          "### Actiepunten\n- ...\n" +
          "### Vervolgafspraken\n- ...\n"
        : templateKey === "voorbereiding"
          ? "Gebruik deze structuur:\n" +
            "### Voorbereiding\n- ...\n" +
            "### Doelen voor de volgende sessie\n- ...\n" +
            "### Vragen om te stellen\n- ...\n" +
            "### Aandachtspunten\n- ...\n" +
            "### Oefeningen / opdrachten\n- ...\n"
          : templateKey === "themas"
            ? "Gebruik deze structuur:\n" +
              "### Thema's\n- ...\n" +
              "### Belangrijkste inzichten\n- ...\n" +
              "### Actiepunten\n- ...\n" +
              "### Afspraken / vervolg\n- ...\n"
            : templateKey === "gespreksplan"
              ? "Gebruik deze structuur:\n" +
                "### Agenda\n- ...\n" +
                "### Tijdindeling\n- ...\n" +
                "### Vragen\n- ...\n" +
                "### Afsluiting\n- ...\n"
              : "Gebruik deze structuur:\n" +
                "### Kern\n- ...\n" +
                "### Belangrijkste thema's\n- ...\n" +
                "### Actiepunten\n- ...\n" +
                "### Afspraken / vervolg\n- ...\n"

  const userPrompt = `${baseIntro}\n\n${structure}\nTranscript:\n${transcript}`

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]

  const summary = await completeMistralChat({
    apiKey: env.mistralApiKey,
    model: env.mistralSummaryModel,
    messages,
    temperature: 0.2,
  })

  if (!summary) {
    throw new Error("Summary generation failed")
  }
  return summary
}

// Intent: buildTemplateStructure
function buildTemplateStructure(template: { name: string; sections: { title: string; description: string }[] }) {
  const sectionGuide = template.sections
    .map((section) => `- ${section.title}: ${normalizeText(section.description) || "Geen extra toelichting."}`)
    .join("\n")
  const structure = template.sections.map((section) => `### ${section.title}\n- ...`).join("\n")
  return `Gebruik de structuur van het template "${normalizeText(template.name) || "Template"}".\n\nUitleg per onderdeel:\n${sectionGuide}\n\nStructuur:\n${structure}\n`
}

