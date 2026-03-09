// Maps built-in template names to default descriptions for migrated rows.
export function getDefaultTemplateDescriptionByName(name: string): string {
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

  const normalized = name.trim().toLowerCase()
  if (normalized === "intake" || normalized === "intakeverslag") return intakeDescription
  if (normalized === "voortgangsrapportage" || normalized === "voortgangsgespreksverslag" || normalized === "voortgangsgesprek") return progressDescription
  if (normalized === "plan van aanpak") return pvaDescription
  if (normalized === "eerstejaarsevaluatie") return firstYearDescription
  if (normalized === "tweede spoor rapportage" || normalized === "tweede spoor plan/rapport") return secondTrackDescription
  if (normalized === "eindevaluatie") return finalEvaluationDescription
  if (normalized === "adviesrapport aan werkgever" || normalized === "adviesrapport werkgever") return employerAdviceDescription
  if (normalized === "terugkoppelingsrapport voor werknemer" || normalized === "terugkoppelingsrapport client") return clientFeedbackDescription
  if (normalized === "arbeidsdeskundig rapport") return arbeidsdeskundigDescription
  return ""
}
