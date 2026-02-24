import crypto from "crypto"

import type { Template } from "../appData"

// Intent: createId
function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

type TemplateBlueprint = {
  name: string
  description: string
  sections: Array<{ title: string; description: string }>
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

const legacyGenericSections = [
  {
    title: "Situatie",
    description: "Feitelijke context, relevante achtergrond en actuele stand van zaken.",
  },
  {
    title: "Analyse",
    description: "Professionele duiding van bevindingen, mogelijkheden en belemmeringen.",
  },
  {
    title: "Advies en vervolgstappen",
    description: "Concreet advies, afspraken en acties met duidelijke opvolging.",
  },
]

const legacyTemplateBlueprints: TemplateBlueprint[] = [
  {
    name: "intake",
    description: intakeDescription,
    sections: legacyGenericSections,
  },
  {
    name: "Voortgangsrapportage",
    description: progressDescription,
    sections: legacyGenericSections,
  },
  {
    name: "Plan van aanpak",
    description: pvaDescription,
    sections: legacyGenericSections,
  },
  {
    name: "Eerstejaarsevaluatie",
    description: firstYearDescription,
    sections: legacyGenericSections,
  },
  {
    name: "Tweede spoor rapportage",
    description: secondTrackDescription,
    sections: legacyGenericSections,
  },
  {
    name: "Eindevaluatie",
    description: finalEvaluationDescription,
    sections: legacyGenericSections,
  },
  {
    name: "Adviesrapport aan werkgever",
    description: employerAdviceDescription,
    sections: legacyGenericSections,
  },
  {
    name: "Terugkoppelingsrapport voor werknemer",
    description: clientFeedbackDescription,
    sections: legacyGenericSections,
  },
  {
    name: "Arbeidsdeskundig rapport",
    description: arbeidsdeskundigDescription,
    sections: legacyGenericSections,
  },
]

const reintegrationTemplateBlueprints: TemplateBlueprint[] = [
  {
    name: "intake",
    description: intakeDescription,
    sections: [
      { title: "Clientgegevens", description: "Naam, functie, eerste ziektedag en betrokken contactpersonen." },
      { title: "Probleemstelling", description: "Feitelijke context van verzuim zonder medische diagnose." },
      { title: "Huidige situatie en belastbaarheid", description: "Wat nu haalbaar is in werkbelasting en inzetbaarheid." },
      { title: "Eerdere inspanningen", description: "Bestaande interventies en eerdere stappen in het traject." },
      { title: "Doelen en hulpvraag", description: "Concreet doel en gewenste voortgang op korte termijn." },
      { title: "Afspraken vervolgtraject", description: "Acties met datum of termijn en verantwoordelijke." },
      { title: "Ondertekening", description: "Ruimte voor bevestiging door client en coach." },
    ],
  },
  {
    name: "Voortgangsgesprek",
    description: progressDescription,
    sections: [
      { title: "Datum en weeknummer", description: "Leg de datum en WvP-context in weken vast." },
      { title: "Deelnemers", description: "Wie aanwezig was bij het voortgangsgesprek." },
      { title: "Acties sinds vorig verslag", description: "Welke acties sinds de vorige evaluatie zijn uitgevoerd." },
      { title: "Resultaten en voortgang", description: "Wat aantoonbaar is bereikt sinds de vorige stap." },
      { title: "Belemmeringen", description: "Nieuwe of aanhoudende knelpunten die voortgang beperken." },
      { title: "Aanpassingen en afspraken", description: "Nieuwe acties met termijnen en verantwoordelijkheden." },
      { title: "Volgend gesprek", description: "Plan een volgende evaluatiedatum of termijn." },
      { title: "Ondertekening", description: "Ruimte voor bevestiging van besproken afspraken." },
    ],
  },
  {
    name: "Plan van Aanpak",
    description: pvaDescription,
    sections: [
      { title: "Algemene gegevens", description: "Datum opstellen, eerste ziektedag, weeknummer en betrokken partijen." },
      { title: "Samenvatting probleemanalyse", description: "Functionele mogelijkheden en relevante context zonder medische details." },
      { title: "Re-integratiedoel", description: "Gezamenlijk doel voor werkhervatting of passend werk." },
      { title: "Concrete acties en interventies", description: "Werkplek, begeleiding, training en andere maatregelen." },
      { title: "Verantwoordelijkheden en deadlines", description: "Wie doet wat en voor welke datum." },
      { title: "Evaluatiemomenten", description: "Frequentie en data voor voortgangsgesprekken." },
      { title: "Mening werknemer", description: "Leg expliciet vast hoe werknemer de afspraken beoordeelt." },
      { title: "Ondertekening werkgever en werknemer", description: "Verplichte ondertekening door beide partijen." },
    ],
  },
  {
    name: "Eerstejaarsevaluatie",
    description: firstYearDescription,
    sections: [
      { title: "Datum en weeknummer", description: "Leg evaluatiedatum en fase in het traject vast." },
      { title: "Samenvatting inspanningen jaar 1", description: "Kernoverzicht van genomen stappen en resultaten." },
      { title: "Beoordeling Plan van Aanpak", description: "Wat is gehaald en wat niet, met toelichting." },
      { title: "Nieuwe afspraken", description: "Acties voor de volgende periode met concrete planning." },
      { title: "Voorstel vervolgtraject", description: "Besluit over eerste spoor of start tweede spoor." },
      { title: "Mening werknemer", description: "Relevante reactie van werknemer op nieuwe afspraken." },
      { title: "Ondertekening werkgever en werknemer", description: "Ondertekening door beide partijen." },
    ],
  },
  {
    name: "Tweede spoor plan/rapport",
    description: secondTrackDescription,
    sections: [
      { title: "Aanleiding tweede spoor", description: "Waarom eerste spoor onvoldoende perspectief biedt." },
      { title: "Onderzoek en belastbaarheid", description: "Relevante bevindingen over inzetbaarheid buiten eigen organisatie." },
      { title: "Arbeidsmarktactiviteiten", description: "Sollicitaties, orientatie, scholing en netwerkacties met data." },
      { title: "Ondersteuning werkgever en arbodienst", description: "Welke begeleiding en middelen zijn ingezet." },
      { title: "Plan en deadlines", description: "Doelen, acties en planning voor het tweede spoor." },
      { title: "Resultaten en belemmeringen", description: "Uitkomsten, reacties en resterende knelpunten." },
      { title: "Vervolgafspraken", description: "Nieuwe acties met verantwoordelijken en termijnen." },
      { title: "Ondertekening", description: "Ruimte voor bevestiging van afspraken." },
    ],
  },
  {
    name: "Eindevaluatie",
    description: finalEvaluationDescription,
    sections: [
      { title: "Datum en weeknummer", description: "Leg timing vast richting WIA-aanvraag." },
      { title: "Huidige situatie en belastbaarheid", description: "Actuele status van inzetbaarheid en werkhervatting." },
      { title: "Samenvatting inspanningen", description: "Overzicht van alle relevante stappen in het traject." },
      { title: "Actueel oordeel bedrijfsarts", description: "Verwijs naar actueel oordeel en functionele mogelijkheden." },
      { title: "Evaluatie resultaten", description: "Beoordeling van eerste en tweede spoor uitkomsten." },
      { title: "Conclusie en advies", description: "Heldere conclusie en advies voor vervolg of WIA." },
      { title: "Bevestiging ontvangst werknemer", description: "Leg vast dat werknemer een kopie heeft ontvangen." },
      { title: "Ondertekening werkgever en werknemer", description: "Ondertekening door beide partijen." },
    ],
  },
  {
    name: "Adviesrapport Werkgever",
    description: employerAdviceDescription,
    sections: [
      { title: "Samenvatting casus", description: "Kern van de situatie en status van het traject." },
      { title: "Analyse", description: "Relevante observaties en risico-inschatting voor vervolg." },
      { title: "Aanbevelingen", description: "Concreet advies voor werkgever, met prioriteiten." },
      { title: "Vervolgstappen", description: "Acties, timing en verantwoordelijken voor uitvoering." },
    ],
  },
  {
    name: "Terugkoppelingsrapport Client",
    description: clientFeedbackDescription,
    sections: [
      { title: "Samenvatting gesprek", description: "Wat er is besproken in duidelijke taal." },
      { title: "Voortgang", description: "Wat al is bereikt en wat nog aandacht vraagt." },
      { title: "Afspraken", description: "Praktische afspraken en termijnen voor de komende periode." },
      { title: "Ondersteuning", description: "Welke hulp of begeleiding beschikbaar is." },
    ],
  },
  {
    name: "Arbeidsdeskundig rapport",
    description: arbeidsdeskundigDescription,
    sections: [
      { title: "Onderzoeksvraag", description: "Doel en scope van het arbeidsdeskundig onderzoek." },
      { title: "Belastbaarheid en mogelijkheden", description: "Functionele mogelijkheden in relatie tot arbeid." },
      { title: "Passend werk en alternatieven", description: "Mogelijkheden binnen en buiten de huidige organisatie." },
      { title: "Conclusie en advies", description: "Onderbouwde conclusie met aanbevolen vervolgstappen." },
    ],
  },
]

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
