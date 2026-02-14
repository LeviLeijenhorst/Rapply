// Maps built-in template names to default descriptions for migrated rows.
export function getDefaultTemplateDescriptionByName(name: string): string {
  const normalized = name.trim().toLowerCase()
  if (normalized === "standaard verslag") return "Een helder algemeen verslag met samenvatting, inzichten en concrete actiepunten."
  if (normalized === "soap") return "Klassieke SOAP-structuur voor feitelijke en goed navolgbare sessieverslagen."
  if (normalized === "intake") return "Intake-template om hulpvraag, context, doelen en verwachtingen duidelijk vast te leggen."
  if (normalized === "eindverslag") return "Afrondend verslag voor resultaten, kerninzichten en vervolgaanbevelingen."
  if (normalized === "voor de coachee") return "Toegankelijke terugkoppeling voor de coachee met afspraken en praktische acties."
  return ""
}

