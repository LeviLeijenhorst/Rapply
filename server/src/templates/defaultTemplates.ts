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

// Intent: materializeTemplateBlueprints
function materializeTemplateBlueprints(blueprints: TemplateBlueprint[]): Template[] {
  const now = Date.now()
  return blueprints.map((blueprint) => ({
    id: createId("template"),
    name: blueprint.name,
    description: blueprint.description,
    isSaved: false,
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
    name: "Intakeverslag",
    description: "Intakeverslag voor hulpvraag, context, doelen en startafspraken.",
    sections: legacyGenericSections,
  },
  {
    name: "Voortgangsrapportage",
    description: "Periodieke rapportage over voortgang, resultaten en aandachtspunten.",
    sections: legacyGenericSections,
  },
  {
    name: "Plan van aanpak",
    description: "Uitwerking van doelen, interventies, planning en verantwoordelijkheden.",
    sections: legacyGenericSections,
  },
  {
    name: "Eerstejaarsevaluatie",
    description: "Evaluatierapport voor de eerstejaarsevaluatie in het re-integratietraject.",
    sections: legacyGenericSections,
  },
  {
    name: "Tweede spoor rapportage",
    description: "Rapportage gericht op tweede spoor, arbeidsmogelijkheden en inzetbaarheid.",
    sections: legacyGenericSections,
  },
  {
    name: "Eindevaluatie",
    description: "Eindrapportage met resultaten, conclusies en aanbevelingen.",
    sections: legacyGenericSections,
  },
  {
    name: "Adviesrapport aan werkgever",
    description: "Zakelijk adviesrapport gericht aan de werkgever.",
    sections: legacyGenericSections,
  },
  {
    name: "Terugkoppelingsrapport voor werknemer",
    description: "Heldere terugkoppeling aan de werknemer met afspraken en vervolgstappen.",
    sections: legacyGenericSections,
  },
  {
    name: "Arbeidsdeskundig rapport",
    description: "Rapportage vanuit arbeidsdeskundige analyse en belastbaarheid.",
    sections: legacyGenericSections,
  },
]

const reintegrationTemplateBlueprints: TemplateBlueprint[] = [
  {
    name: "Intakeverslag",
    description: "Startsituatie, belastbaarheid, hulpvraag en eerste re-integratieafspraken.",
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
    name: "Voortgangsgespreksverslag",
    description: "Periodiek verslag met voortgang, belemmeringen en concrete vervolgafspraken.",
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
    description: "Formeel plan met doelen, acties, deadlines en ondertekening conform WvP.",
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
    description: "Formele evaluatie rond week 52 met uitkomsten en vervolgkeuzes.",
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
    description: "Plan en voortgang van tweede spoor met acties, resultaten en bewijsvoering.",
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
    description: "Eindrapportage met volledige dossierinspanning en adviesrichting WIA.",
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
    name: "Adviesrapport aan werkgever",
    description: "Zakelijk advies met onderbouwde re-integratie-aanbevelingen.",
    sections: [
      { title: "Samenvatting casus", description: "Kern van de situatie en status van het traject." },
      { title: "Analyse", description: "Relevante observaties en risico-inschatting voor vervolg." },
      { title: "Aanbevelingen", description: "Concreet advies voor werkgever, met prioriteiten." },
      { title: "Vervolgstappen", description: "Acties, timing en verantwoordelijken voor uitvoering." },
    ],
  },
  {
    name: "Terugkoppelingsrapport voor werknemer",
    description: "Begrijpelijke terugkoppeling van voortgang en vervolgstappen.",
    sections: [
      { title: "Samenvatting gesprek", description: "Wat er is besproken in duidelijke taal." },
      { title: "Voortgang", description: "Wat al is bereikt en wat nog aandacht vraagt." },
      { title: "Afspraken", description: "Praktische afspraken en termijnen voor de komende periode." },
      { title: "Ondersteuning", description: "Welke hulp of begeleiding beschikbaar is." },
    ],
  },
  {
    name: "Arbeidsdeskundig rapport",
    description: "Arbeidsdeskundige bevindingen over belastbaarheid en passend werk.",
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
