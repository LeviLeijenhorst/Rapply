import crypto from "crypto"

import type { Template } from "../types/Template"

// Intent: createId
function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

type TemplateBlueprint = {
  name: string
  category?: Template["category"]
  description: string
  sections: Array<{ title: string; description: string }>
}

function normalizeTemplateName(name: string): string {
  return String(name || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
}

function inferTemplateCategoryFromName(name: string): Template["category"] {
  const normalized = normalizeTemplateName(name)
  if (!normalized) return "ander-verslag"
  if (normalized === "intake" || normalized === "intakeverslag") return "gespreksverslag"
  if (
    normalized === "voortgangsgesprek" ||
    normalized === "voortgangsgespreksverslag" ||
    normalized === "voortgangsrapportage"
  ) {
    return "gespreksverslag"
  }
  if (
    normalized === "terugkoppelingsrapportclient" ||
    normalized === "terugkoppelingsrapportvoorclient" ||
    normalized === "terugkoppelingclient" ||
    normalized === "terugkoppelingsrapportwerknemer" ||
    normalized === "terugkoppelingsrapportvoorwerknemer" ||
    normalized === "terugkoppelingwerknemer"
  ) {
    return "gespreksverslag"
  }
  return "ander-verslag"
}

const intakeDescription = `### Doel
Het intakeverslag brengt de beginsituatie van het traject helder in kaart. Je legt vast wat er speelt, wat de belastbaarheid is en welke eerste afspraken worden gemaakt.

### Wanneer gebruik je dit?
- Bij de start van een traject (eerste gesprek met client).

### Wat bevat dit verslag?
- Client- en werkgeversgegevens
- Eerste ziektedag
- Probleemstelling (niet-medisch)
- Huidige belastbaarheid en mogelijkheden
- Eerdere inspanningen
- Doelstellingen van het traject
- Concrete vervolgafspraken met datum`

const progressDescription = `### Doel
Documenteert periodieke voortgang (idealiter elke 6 weken) en legt inspanningen en afspraken vast.

### Wanneer gebruik je dit?
- Na elk voortgangsgesprek tijdens het traject.

### Wat bevat dit verslag?
- Datum en weeknummer (WvP-tijdlijn)
- Aanwezigen
- Uitgevoerde acties sinds vorig gesprek
- Resultaten en voortgang
- Belemmeringen
- Nieuwe afspraken met termijnen en verantwoordelijken
- Datum volgend evaluatiemoment`

const pvaDescription = `### Doel
Het wettelijk verplichte document (uiterlijk week 8) waarin werkgever en werknemer concrete re-integratieafspraken vastleggen.

### Wanneer gebruik je dit?
- Uiterlijk in week 8 na de eerste ziektedag.

### Wat bevat dit verslag?
- Datum, weeknummer en eerste ziektedag
- Samenvatting probleemanalyse (functionele mogelijkheden)
- Re-integratiedoelen
- Concrete acties (met startdatum en verantwoordelijke)
- Evaluatiemomenten (minimaal elke 6 weken)
- Ondertekening door werkgever en werknemer`

const firstYearDescription = `### Doel
Formele evaluatie rond week 52 waarin het eerste re-integratiejaar wordt beoordeeld en wordt besloten over voortzetting of tweede spoor.

### Wanneer gebruik je dit?
- Rond week 52 na de eerste ziektedag.

### Wat bevat dit verslag?
- Overzicht van alle inspanningen in jaar 1
- Beoordeling van het Plan van Aanpak
- Nieuwe afspraken
- Besluit over tweede spoor (indien nodig)
- Reactie van de werknemer
- Ondertekening door werkgever en werknemer`

const secondTrackDescription = `### Doel
Legt vast welke inspanningen worden verricht buiten de eigen organisatie wanneer terugkeer in eigen werk niet haalbaar is.

### Wanneer gebruik je dit?
- Na besluit tot tweede spoor (meestal na week 52).

### Wat bevat dit verslag?
- Motivatie voor tweede spoor
- Arbeidsmarktactiviteiten (sollicitaties, netwerkgesprekken, scholing)
- Concrete aantallen en data
- Ondersteuning door werkgever of coach
- Afspraken en deadlines
- Ondertekening`

const finalEvaluationDescription = `### Doel
Eindrapport van het re-integratietraject (week +/-91-104), onderdeel van het re-integratieverslag voor WIA.

### Wanneer gebruik je dit?
- Minimaal 2 weken voor de WIA-aanvraag.

### Wat bevat dit verslag?
- Huidige situatie en belastbaarheid
- Samenvatting van alle inspanningen (eerste + tweede spoor)
- Evaluatie van resultaten
- Conclusie en advies
- Ondertekening door werkgever en werknemer`

const employerAdviceDescription = `### Doel
Zakelijk advies aan de werkgever over strategie, interventies of vervolgstappen binnen het traject.

### Wanneer gebruik je dit?
- Wanneer aanvullende beleidsmatige of strategische advisering nodig is.

### Wat bevat dit verslag?
- Analyse van huidige situatie
- Risico-inschatting
- Concrete aanbevelingen
- Eventuele kosten-batenoverweging`

const clientFeedbackDescription = `### Doel
Clientgerichte, begrijpelijke samenvatting van voortgang en afspraken.

### Wanneer gebruik je dit?
- Na een belangrijk gesprek of evaluatiemoment.

### Wat bevat dit verslag?
- Samenvatting gesprek
- Bereikte stappen
- Concrete vervolgstappen
- Heldere, toegankelijke formulering`

const arbeidsdeskundigDescription = `### Doel
Legt arbeidsdeskundige bevindingen vast over belastbaarheid, passend werk en realistische re-integratieroutes.

### Wanneer gebruik je dit?
- Bij arbeidsdeskundig onderzoek of wanneer inzetbaarheid en passend werk onderbouwd moeten worden.

### Wat bevat dit verslag?
- Onderzoeksvraag en context
- Analyse van belastbaarheid en mogelijkheden
- Beoordeling passend werk en alternatieven
- Conclusie en advies met vervolgstappen`

// Intent: materializeTemplateBlueprints
function materializeTemplateBlueprints(blueprints: TemplateBlueprint[]): Template[] {
  const now = Date.now()
  return blueprints.map((blueprint) => ({
    id: createId("template"),
    name: blueprint.name,
    category: blueprint.category ?? inferTemplateCategoryFromName(blueprint.name),
    description: blueprint.description,
    isSaved: false,
    isDefault: true,
    createdAtUnixMs: now,
    updatedAtUnixMs: now,
    sections: blueprint.sections.map((section) => ({
      id: createId("template-section"),
      title: section.title,
      description: section.description,
    })),
  }))
}

const reintegrationTemplateBlueprints: TemplateBlueprint[] = [
  {
    name: "Re-integratieplan Werkfit maken",
    category: "gespreksverslag",
    description: `UWV-formulier Re-integratieplan Werkfit maken. Dit formulier bevat alle velden uit het UWV-format.`,
    sections: [
      { title: "1.1 Voorletters en achternaam", description: "Automatisch invullen uit clientgegevens." },
      { title: "1.2 Burgerservicenummer", description: "Automatisch invullen uit clientgegevens." },
      { title: "2.1 Naam contactpersoon UWV", description: "Automatisch invullen uit clientgegevens/zaakgegevens." },
      { title: "3.1 Naam organisatie", description: "Automatisch invullen uit organisatiegegevens." },
      { title: "3.2 Bezoekadres", description: "Automatisch invullen uit organisatiegegevens." },
      { title: "3.3 Postadres", description: "Automatisch invullen uit organisatiegegevens." },
      { title: "3.4 Postcode en plaats", description: "Automatisch invullen uit organisatiegegevens." },
      { title: "3.5 Naam contactpersoon", description: "Automatisch invullen uit organisatiegegevens." },
      { title: "3.6 Functie contactpersoon", description: "Automatisch invullen uit organisatiegegevens." },
      { title: "3.7 Telefoonnummer contactpersoon", description: "Automatisch invullen uit organisatiegegevens." },
      { title: "3.8 E-mailadres contactpersoon", description: "Automatisch invullen uit organisatiegegevens." },
      { title: "4.1 Wat is het ordernummer?", description: "Automatisch invullen uit clientgegevens/organisatiegegevens." },
      { title: "5.1 Welke hoofdactiviteiten zijn in het werkplan of Plan van aanpak benoemd?", description: "Open vraag. Noem alle relevante hoofdactiviteiten." },
      { title: "5.2 Beschrijving van de activiteiten en het gewenste resultaat", description: "Beschrijf vanuit de startsituatie van de client de activiteiten en het gewenste resultaat (zonder medische details)." },
      { title: "5.3 Verdeling begeleidingsuren over de re-integratieactiviteiten", description: "Open vraag. Geef per activiteit het aantal uren." },
      { title: "5.3a Re-integratieactiviteit", description: "Open invulveld voor activiteit." },
      { title: "5.3b Aantal begeleidingsuren", description: "Open invulveld voor uren per activiteit (hele uren)." },
      { title: "5.3c Totaal aantal begeleidingsuren, inclusief administratieve uren (maximaal 41)", description: "Open invulveld voor totaal." },
      { title: "5.4 Wanneer begint de eerste re-integratieactiviteit?", description: "Open vraag met startdatum." },
      { title: "5.5 Afspraken en inspanningen van beide partijen", description: "Beschrijf welke afspraken zijn gemaakt en welke inspanningen beide partijen leveren." },
      { title: "5.6 Afwijkingen van werkplan of Plan van aanpak", description: "Als er afwijkingen zijn: beschrijf op welke onderdelen en waarom." },
      { title: "6.1 Maximale individuele doorlooptijd", description: "Open vraag. Geef het aantal maanden." },
      { title: "7.1 Verwachting client van inzet/resultaat en begeleiding", description: "Open vraag." },
      { title: "7.2 Visie op re-integratiemogelijkheden van de client", description: "Open vraag." },
      { title: "7.3 Verwachting van inzet en resultaat van de re-integratiedienst", description: "Open vraag vanuit re-integratiebedrijf." },
      { title: "8.1 Is er sprake van specialistisch uurtarief?", description: "Open vraag (ja/nee + toelichting)." },
      { title: "8.2 Specialistische expertise: motivering en aantal uren", description: "Open vraag. Motiveer welke expertise nodig is en noem het aantal uren." },
      { title: "8.2a Aantal uren specialistische expertise", description: "Open invulveld." },
      { title: "8.2b Motivering specialistische expertise", description: "Open invulveld." },
      { title: "8.3 Hoger specialistisch uurtarief en motivering", description: "Open vraag. Geef uurtarief exclusief btw en motiveer noodzaak." },
      { title: "8.3a Uurtarief exclusief btw", description: "Open invulveld in euro." },
      { title: "8.3b Motivering uurtarief", description: "Open invulveld." },
      { title: "9 Rechten en plichten", description: "Bevestig dat rechten en plichten met client zijn besproken." },
      { title: "10 Ondertekening contactpersoon re-integratiebedrijf - naam", description: "Automatisch invullen uit organisatiegegevens." },
      { title: "10 Ondertekening contactpersoon re-integratiebedrijf - datum en handtekening", description: "Open invulveld." },
      { title: "10 Ondertekening client - naam", description: "Automatisch invullen uit clientgegevens." },
      { title: "10 Ondertekening client - datum en handtekening", description: "Open invulveld." },
    ],
  },
  {
    name: "Eindrapportage Werkfit maken",
    category: "gespreksverslag",
    description: `UWV-formulier Eindrapportage Werkfit maken. Dit formulier bevat alle velden uit het UWV-format.`,
    sections: [
      { title: "1.1 Voorletters en achternaam", description: "Automatisch invullen uit clientgegevens." },
      { title: "1.2 Burgerservicenummer", description: "Automatisch invullen uit clientgegevens." },
      { title: "2.1 Naam contactpersoon UWV", description: "Automatisch invullen uit clientgegevens/zaakgegevens." },
      { title: "3.1 Naam organisatie", description: "Automatisch invullen uit organisatiegegevens." },
      { title: "3.2 Naam contactpersoon", description: "Automatisch invullen uit organisatiegegevens." },
      { title: "3.3 Functie contactpersoon", description: "Automatisch invullen uit organisatiegegevens." },
      { title: "3.4 Telefoonnummer contactpersoon", description: "Automatisch invullen uit organisatiegegevens." },
      { title: "3.5 E-mailadres contactpersoon", description: "Automatisch invullen uit organisatiegegevens." },
      { title: "4.1 Wat is het ordernummer?", description: "Automatisch invullen uit clientgegevens/organisatiegegevens." },
      { title: "4.2 Van welke eindsituatie is sprake?", description: "Open vraag. Beschrijf de eindsituatie." },
      { title: "5.1 Reden beeindiging naar aanleiding van evaluatiemoment", description: "Open vraag. Licht reden toe en geef aan of de klant het ermee eens is." },
      { title: "5.2 Advies voor vervolg van de dienstverlening", description: "Open vraag." },
      { title: "6.1 Reden van de voortijdige terugmelding", description: "Open vraag. Oorspronkelijke meerkeuze als vrije tekst invullen." },
      { title: "6.2 Toelichting op reden voortijdige terugmelding", description: "Open vraag." },
      { title: "6.3 Met wie bij UWV is de voortijdige terugmelding besproken?", description: "Open vraag." },
      { title: "7.1 Uitgevoerde re-integratieactiviteiten en ingezette begeleidingsuren", description: "Open vraag. Noem activiteiten en uren per activiteit." },
      { title: "7.1a Re-integratieactiviteit", description: "Open invulveld." },
      { title: "7.1b Aantal begeleidingsuren", description: "Open invulveld." },
      { title: "7.1c Totaal aantal begeleidingsuren inclusief administratieve uren", description: "Open invulveld." },
      { title: "7.2 Welke vorderingen heeft de klant gemaakt?", description: "Open vraag met acties en resultaat." },
      { title: "7.3 Wat is het bereikte resultaat?", description: "Open vraag." },
      { title: "7.4 Onderbouwing werkfit of niet werkfit", description: "Open vraag." },
      { title: "7.5 Is de klant naar eigen mening werkfit? Waaruit blijkt dat?", description: "Open vraag." },
      { title: "7.6 Vervolgadvies en benodigde bemiddeling/begeleiding", description: "Open vraag. Oorspronkelijke meerkeuze als vrije tekst invullen." },
      { title: "7.7 Toelichting op het advies", description: "Open vraag." },
      { title: "7.8 Wat vindt de klant van dit advies?", description: "Open vraag." },
      { title: "8.1 Hoe heeft de klant de ingezette re-integratieactiviteiten ervaren?", description: "Open vraag met toelichting." },
      { title: "8.2 Is de klant akkoord met de ingezette en verantwoorde begeleidingsuren?", description: "Open vraag (ja/nee + toelichting)." },
      { title: "9 Ondertekening contactpersoon re-integratiebedrijf - naam", description: "Automatisch invullen uit organisatiegegevens." },
      { title: "9 Ondertekening contactpersoon re-integratiebedrijf - datum en handtekening", description: "Open invulveld." },
      { title: "9 Ondertekening klant - naam", description: "Automatisch invullen uit clientgegevens." },
      { title: "9 Ondertekening klant - datum en handtekening", description: "Open invulveld." },
    ],
  },
]

const legacyTemplateBlueprints: TemplateBlueprint[] = reintegrationTemplateBlueprints

export function getReintegrationDefaultTemplateSectionsByName(name: string): Array<{ title: string; description: string }> | null {
  const normalizedName = normalizeTemplateName(name)
  if (!normalizedName) return null
  const match = reintegrationTemplateBlueprints.find((blueprint) => normalizeTemplateName(blueprint.name) === normalizedName)
  if (!match) return null
  return match.sections.map((section) => ({ title: section.title, description: section.description }))
}

// Intent: createLegacyDefaultTemplates
export function createLegacyDefaultTemplates(): Template[] {
  return materializeTemplateBlueprints(legacyTemplateBlueprints)
}

// Intent: createReintegrationDefaultTemplates
export function createReintegrationDefaultTemplates(): Template[] {
  return materializeTemplateBlueprints(reintegrationTemplateBlueprints)
}

// Intent: createDefaultTemplates
export function createDefaultTemplates(params?: { set?: "legacy" | "reintegration" }): Template[] {
  const templateSet = params?.set === "legacy" ? "legacy" : "reintegration"
  return templateSet === "legacy" ? createLegacyDefaultTemplates() : createReintegrationDefaultTemplates()
}
