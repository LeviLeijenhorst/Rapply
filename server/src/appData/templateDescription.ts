// Maps built-in template names to default descriptions for migrated rows.
export function getDefaultTemplateDescriptionByName(name: string): string {
  const normalized = name.trim().toLowerCase()
  if (normalized === "intakeverslag") return "Intakeverslag voor hulpvraag, context, doelen en startafspraken."
  if (normalized === "voortgangsrapportage") return "Periodieke rapportage over voortgang, resultaten en aandachtspunten."
  if (normalized === "plan van aanpak") return "Uitwerking van doelen, interventies, planning en verantwoordelijkheden."
  if (normalized === "eerstejaarsevaluatie") return "Evaluatierapport voor de eerstejaarsevaluatie in het re-integratietraject."
  if (normalized === "tweede spoor rapportage") return "Rapportage gericht op tweede spoor, arbeidsmogelijkheden en inzetbaarheid."
  if (normalized === "eindevaluatie") return "Eindrapportage met resultaten, conclusies en aanbevelingen."
  if (normalized === "adviesrapport aan werkgever") return "Zakelijk adviesrapport gericht aan de werkgever."
  if (normalized === "terugkoppelingsrapport voor werknemer") return "Heldere terugkoppeling aan de werknemer met afspraken en vervolgstappen."
  if (normalized === "arbeidsdeskundig rapport") return "Rapportage vanuit arbeidsdeskundige analyse en belastbaarheid."
  return ""
}
