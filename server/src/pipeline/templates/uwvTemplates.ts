import type { ReportFieldType } from "../../types/Report"

export type UwvTemplateField = {
  fieldId: string
  label: string
  fieldType: ReportFieldType
  exportNumberKey: string
}

export type UwvTemplate = {
  id: string
  name: string
  description: string
  fields: UwvTemplateField[]
}

function createField(fieldId: string, exportNumberKey: string, label: string, fieldType: ReportFieldType): UwvTemplateField {
  return { fieldId, exportNumberKey, label, fieldType }
}

const reintegratieplanWerkfit: UwvTemplate = {
  id: "reintegratieplan_werkfit_maken",
  name: "Re-integratieplan Werkfit maken",
  description: "UWV re-integratieplan voor Werkfit maken.",
  fields: [
    createField("rp_werkfit_1_1", "1.1", "Voorletters en achternaam", "programmatic"),
    createField("rp_werkfit_1_2", "1.2", "Burgerservicenummer", "programmatic"),
    createField("rp_werkfit_2_1", "2.1", "Naam contactpersoon UWV", "programmatic"),
    createField("rp_werkfit_3_1", "3.1", "Naam organisatie", "programmatic"),
    createField("rp_werkfit_3_2", "3.2", "Bezoekadres", "programmatic"),
    createField("rp_werkfit_3_3", "3.3", "Postadres", "programmatic"),
    createField("rp_werkfit_3_4", "3.4", "Postcode en plaats", "programmatic"),
    createField("rp_werkfit_3_5", "3.5", "Naam contactpersoon", "programmatic"),
    createField("rp_werkfit_3_6", "3.6", "Functie contactpersoon", "programmatic"),
    createField("rp_werkfit_3_7", "3.7", "Telefoonnummer contactpersoon", "programmatic"),
    createField("rp_werkfit_3_8", "3.8", "E-mailadres contactpersoon", "programmatic"),
    createField("rp_werkfit_4_1", "4.1", "Ordernummer", "programmatic"),
    createField("rp_werkfit_5_1", "5.1", "Re-integratieactiviteiten en begeleidingsuren", "ai"),
    createField("rp_werkfit_5_2", "5.2", "Beschrijving van de activiteiten en het gewenste resultaat", "ai"),
    createField("rp_werkfit_5_3", "5.3", "Hoe verdeelt U de begeleidingsuren over de re-integratieactiviteiten?", "ai"),
    createField("rp_werkfit_5_4", "5.4", "Wanneer begint de eerste re-integratieactiviteit?", "ai"),
    createField("rp_werkfit_5_5", "5.5", "Afspraken en inspanningen van beide partijen", "ai"),
    createField(
      "rp_werkfit_5_6",
      "5.6",
      "Als U afwijkt van het werkplan of Plan van aanpak: waarop en waarom?",
      "ai",
    ),
    createField("rp_werkfit_6_1", "6.1", "Doorlooptijd", "ai"),
    createField("rp_werkfit_7_1", "7.1", "Visie op dienstverlening", "ai"),
    createField("rp_werkfit_7_2", "7.2", "Wat is uw visie op de re-integratiemogelijkheden van de cliënt?", "ai"),
    createField("rp_werkfit_7_3", "7.3", "Wat verwacht u van de inzet en het resultaat van de re-integratiedienst?", "ai"),
    createField("rp_werkfit_8_1", "8.1", "Specialistisch uurtarief", "ai"),
    createField(
      "rp_werkfit_8_2",
      "8.2",
      "Motiveer welke specialistische expertise nodig is en hoeveel uren u adviseert.",
      "ai",
    ),
    createField(
      "rp_werkfit_8_3",
      "8.3",
      "Wat is het in rekening te brengen ter zake is hogere uurtarief voor de specialistische expertise. Motiveer waarom dit tarief noodzakelijk is.",
      "ai",
    ),
    createField("rp_werkfit_9", "9.1", "Rechten en plichten", "manual"),
  ],
}

const eindrapportageWerkfit: UwvTemplate = {
  id: "eindrapportage_werkfit_maken",
  name: "Eindrapportage Werkfit maken",
  description: "UWV eindrapportage voor Werkfit maken.",
  fields: [
    createField("er_werkfit_1_1", "1.1", "Naam cliënt", "programmatic"),
    createField("er_werkfit_1_2", "1.2", "BSN", "programmatic"),
    createField("er_werkfit_2_1", "2.1", "Naam contactpersoon UWV", "programmatic"),
    createField("er_werkfit_3_1", "3.1", "Naam organisatie", "programmatic"),
    createField("er_werkfit_3_2", "3.2", "Naam contactpersoon re-integratiebedrijf", "programmatic"),
    createField("er_werkfit_4_1", "4.1", "Ordernummer", "programmatic"),
    createField("er_werkfit_4_2", "4.2", "Van welke eindsituatie is sprake?", "ai"),
    createField("er_werkfit_5_1", "5.1", "Reden beëindiging naar aanleiding van evaluatiemoment", "ai"),
    createField("er_werkfit_5_2", "5.2", "Wat is uw advies voor het vervolg van de dienstverlening?", "ai"),
    createField("er_werkfit_6_1", "6.1", "Reden van de voortijdige terugmelding", "ai"),
    createField("er_werkfit_6_2", "6.2", "Toelichting op de reden van de voortijdige terugmelding", "ai"),
    createField("er_werkfit_6_3", "6.3", "Met wie bij UWV is de voortijdige terugmelding besproken?", "ai"),
    createField("er_werkfit_7_1", "7.1", "Welke re-integratieactiviteiten zijn uitgevoerd en uren per activiteit?", "ai"),
    createField("er_werkfit_7_2", "7.2", "Welke vorderingen heeft de klant gemaakt?", "ai"),
    createField("er_werkfit_7_3", "7.3", "Wat is het bereikte resultaat?", "ai"),
    createField("er_werkfit_7_4", "7.4", "Waaruit blijkt dat de klant wel/niet werkfit is?", "ai"),
    createField("er_werkfit_7_5", "7.5", "Is de klant naar eigen mening werkfit? Waaruit blijkt dat?", "ai"),
    createField("er_werkfit_7_6", "7.6", "Wat is uw vervolgadvies en welke begeleiding is nog nodig?", "ai"),
    createField("er_werkfit_7_7", "7.7", "Toelichting op uw advies", "ai"),
    createField("er_werkfit_7_8", "7.8", "Wat vindt de klant van dit advies?", "ai"),
    createField("er_werkfit_8_1", "8.1", "Hoe heeft de klant de ingezette activiteiten ervaren?", "ai"),
    createField("er_werkfit_8_2", "8.2", "Is de klant akkoord met de verantwoorde begeleidingsuren?", "ai"),
  ],
}

const uwvTemplateCatalog: UwvTemplate[] = [reintegratieplanWerkfit, eindrapportageWerkfit]

export function listSupportedUwvTemplates(): UwvTemplate[] {
  return uwvTemplateCatalog
}

export function readSupportedUwvTemplate(templateIdOrName: string): UwvTemplate {
  const normalized = String(templateIdOrName || "").trim().toLowerCase()
  const match =
    uwvTemplateCatalog.find((template) => template.id.toLowerCase() === normalized) ||
    uwvTemplateCatalog.find((template) => template.name.toLowerCase() === normalized)
  if (!match) {
    throw new Error(`Unsupported template: ${templateIdOrName}`)
  }
  return match
}
