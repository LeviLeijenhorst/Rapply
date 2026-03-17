import type { JsonValue, ReportFieldType } from "../../types/Report"

export type UwvOption = {
  value: number
  label: string
}

export type UwvSkipCondition = {
  fieldId: string
  equals: JsonValue
}

export type UwvSkipRule = {
  when: UwvSkipCondition
  skipFieldIds: string[]
}

export type UwvFieldAnswerType = "text" | "multiple_choice" | "structured"

export type UwvAiFieldConfig = {
  vraag: string
  instructie: string
  miniPrompt: string
  antwoordType: UwvFieldAnswerType
  opties?: UwvOption[]
  answerFormat?: string
  voorbeeldAntwoord: string
  skipLogica?: UwvSkipRule[]
  aiEnabled?: boolean
  frontendVariant?:
    | "multi_select_numeric"
    | "single_choice_numeric"
    | "single_choice_with_custom_reason"
    | "activities_rows"
    | "activiteiten_en_keuzes"
    | "akkoord_met_toelichting"
    | "uren_motivering"
    | "tarief_motivering"
    | "maanden_object"
}

export type UwvTemplateField = {
  fieldId: string
  label: string
  fieldType: ReportFieldType
  exportNumberKey: string
  aiConfig?: UwvAiFieldConfig
}

export type UwvTemplate = {
  id: string
  name: string
  description: string
  fields: UwvTemplateField[]
}

function createField(params: {
  fieldId: string
  exportNumberKey: string
  label: string
  fieldType: ReportFieldType
  aiConfig?: UwvAiFieldConfig
}): UwvTemplateField {
  return {
    fieldId: params.fieldId,
    exportNumberKey: params.exportNumberKey,
    label: params.label,
    fieldType: params.fieldType,
    aiConfig: params.aiConfig,
  }
}

export function listAiTemplateFields(template: UwvTemplate): UwvTemplateField[] {
  return template.fields.filter((field) => field.fieldType === "ai" && field.aiConfig?.aiEnabled !== false)
}

const reintegratieplanWerkfit: UwvTemplate = {
  id: "reintegratieplan_werkfit_maken",
  name: "Re-integratieplan Werkfit maken",
  description: "UWV re-integratieplan voor Werkfit maken.",
  fields: [
    createField({ fieldId: "rp_werkfit_1_1", exportNumberKey: "1.1", label: "Voorletters en achternaam", fieldType: "programmatic" }),
    createField({ fieldId: "rp_werkfit_1_2", exportNumberKey: "1.2", label: "Burgerservicenummer", fieldType: "programmatic" }),
    createField({ fieldId: "rp_werkfit_2_1", exportNumberKey: "2.1", label: "Naam contactpersoon UWV", fieldType: "programmatic" }),
    createField({ fieldId: "rp_werkfit_3_1", exportNumberKey: "3.1", label: "Naam organisatie", fieldType: "programmatic" }),
    createField({ fieldId: "rp_werkfit_3_2", exportNumberKey: "3.2", label: "Bezoekadres", fieldType: "programmatic" }),
    createField({ fieldId: "rp_werkfit_3_3", exportNumberKey: "3.3", label: "Postadres", fieldType: "programmatic" }),
    createField({ fieldId: "rp_werkfit_3_4", exportNumberKey: "3.4", label: "Postcode en plaats", fieldType: "programmatic" }),
    createField({ fieldId: "rp_werkfit_3_5", exportNumberKey: "3.5", label: "Naam contactpersoon", fieldType: "programmatic" }),
    createField({ fieldId: "rp_werkfit_3_6", exportNumberKey: "3.6", label: "Functie contactpersoon", fieldType: "programmatic" }),
    createField({ fieldId: "rp_werkfit_3_7", exportNumberKey: "3.7", label: "Telefoonnummer contactpersoon", fieldType: "programmatic" }),
    createField({ fieldId: "rp_werkfit_3_8", exportNumberKey: "3.8", label: "E-mailadres contactpersoon", fieldType: "programmatic" }),
    createField({ fieldId: "rp_werkfit_4_1", exportNumberKey: "4.1", label: "Wat is het ordernummer?", fieldType: "programmatic" }),
    createField({
      fieldId: "rp_werkfit_5_1",
      exportNumberKey: "5.1",
      label: "Welke hoofdactiviteiten zijn in het werkplan of Plan van aanpak benoemd?",
      fieldType: "ai",
      aiConfig: {
        vraag: "Welke hoofdactiviteiten zijn in het werkplan of Plan van aanpak benoemd?",
        instructie: "Selecteer alle hoofdactiviteiten die in de broninformatie expliciet terugkomen.",
        miniPrompt:
          "Selecteer alleen hoofdactiviteiten die duidelijk uit het werkplan, plan van aanpak of de beschikbare informatie volgen. Kies niet op basis van vermoedens.",
        antwoordType: "multiple_choice",
        opties: [
          { value: 1, label: "Versterken werknemersvaardigheden" },
          { value: 2, label: "Verbeteren persoonlijke effectiviteit" },
          { value: 3, label: "In beeld brengen arbeidsmarktpositie" },
        ],
        answerFormat: '{"keuzes":[1,2]}',
        voorbeeldAntwoord: '{"keuzes":[1,3]}',
        frontendVariant: "multi_select_numeric",
      },
    }),
    createField({
      fieldId: "rp_werkfit_5_2",
      exportNumberKey: "5.2",
      label: "Beschrijving van de activiteiten en het gewenste resultaat.",
      fieldType: "ai",
      aiConfig: {
        vraag: "Beschrijving van de activiteiten en het gewenste resultaat.",
        instructie:
          "Beschrijf vanuit de startsituatie van de cli\u00ebnt welke activiteiten worden uitgevoerd en wat het beoogde resultaat is.",
        miniPrompt:
          "Beschrijf vanuit de startsituatie welke activiteiten worden ingezet en welk resultaat wordt nagestreefd. Koppel de gekozen aanpak duidelijk aan de situatie van de klant.",
        antwoordType: "text",
        voorbeeldAntwoord:
          "Vanuit de startsituatie is ingezet op het opbouwen van arbeidsritme en het versterken van sollicitatievaardigheden. Het gewenste resultaat is dat de cli\u00ebnt duurzaam kan instromen in passend werk.",
      },
    }),
    createField({
      fieldId: "rp_werkfit_5_3",
      exportNumberKey: "5.3",
      label: "Hoe verdeelt u de begeleidingsuren over de re-integratieactiviteiten?",
      fieldType: "ai",
      aiConfig: {
        vraag: "Hoe verdeelt u de begeleidingsuren over de re-integratieactiviteiten?",
        instructie: "Geef per activiteit het aantal uren. Gebruik alleen activiteiten die uit de broninformatie volgen.",
        miniPrompt:
          "Neem alleen concrete activiteiten op die inhoudelijk zijn benoemd of logisch direct volgen uit de gekozen aanpak. Verdeel uren zakelijk en realistisch.",
        antwoordType: "structured",
        answerFormat: '{"activiteiten":[{"activiteit":"string","uren":number}]}',
        voorbeeldAntwoord: '{"activiteiten":[{"activiteit":"Sollicitatiebegeleiding","uren":6},{"activiteit":"Werkritme-opbouw","uren":4}]}',
        frontendVariant: "activities_rows",
      },
    }),
    createField({
      fieldId: "rp_werkfit_5_4",
      exportNumberKey: "5.4",
      label: "Wanneer begint de eerste re-integratieactiviteit?",
      fieldType: "ai",
      aiConfig: {
        vraag: "Wanneer begint de eerste re-integratieactiviteit?",
        instructie: "Noem startmoment of periode zoals genoemd in de broninformatie.",
        miniPrompt:
          "Noem alleen een startmoment of periode als die uit de beschikbare informatie blijkt. Houd het antwoord kort en feitelijk.",
        antwoordType: "text",
        voorbeeldAntwoord: "De eerste re-integratieactiviteit start in de eerste week na akkoord op het plan van aanpak.",
      },
    }),
    createField({
      fieldId: "rp_werkfit_5_5",
      exportNumberKey: "5.5",
      label: "Beschrijf de afspraken die u samen heeft gemaakt om de re-integratieactiviteiten tot een succes te maken. Welke inspanningen levert u allebei?",
      fieldType: "ai",
      aiConfig: {
        vraag: "Beschrijf de afspraken die u samen heeft gemaakt om de re-integratieactiviteiten tot een succes te maken. Welke inspanningen levert u allebei?",
        instructie: "Beschrijf zowel de inzet van de cli\u00ebnt als van de coach/re-integratiedienst.",
        miniPrompt:
          "Beschrijf wederzijdse afspraken concreet en professioneel. Maak duidelijk welke inspanning van de klant wordt verwacht en welke begeleiding de coach of organisatie levert.",
        antwoordType: "text",
        voorbeeldAntwoord:
          "Afgesproken is dat de cli\u00ebnt wekelijks sollicitatieacties uitvoert en voortgang terugkoppelt. De coach verzorgt wekelijkse begeleiding, feedback op sollicitaties en bewaakt de voortgang richting werkdoel.",
      },
    }),
    createField({
      fieldId: "rp_werkfit_5_6",
      exportNumberKey: "5.6",
      label: "Als u met de invulling van de re-integratieactiviteiten afwijkt van het werkplan of Plan van aanpak, geef dan aan op welke onderdelen u ervan afwijkt en waarom.",
      fieldType: "ai",
      aiConfig: {
        vraag:
          "Als u met de invulling van de re-integratieactiviteiten afwijkt van het werkplan of plan van aanpak, geef dan aan op welke onderdelen u ervan afwijkt en waarom.",
        instructie: "Noem alleen afwijkingen die expliciet blijken uit de broninformatie.",
        miniPrompt:
          "Noem alleen afwijkingen van werkplan of plan van aanpak als die expliciet blijken. Als de informatie daar onvoldoende basis voor geeft, laat dit veld weg.",
        antwoordType: "text",
        voorbeeldAntwoord:
          "Er is afgeweken in de frequentie van fysieke afspraken vanwege belastbaarheid van de cli\u00ebnt. Daarom is tijdelijk meer digitale begeleiding ingezet.",
      },
    }),
    createField({
      fieldId: "rp_werkfit_6_1",
      exportNumberKey: "6.1",
      label: "Wat is de maximale individueel doorlooptijd van de re-integratiedienst?",
      fieldType: "ai",
      aiConfig: {
        vraag: "Wat is de maximale individuele doorlooptijd van de re-integratiedienst?",
        instructie: "Geef het aantal maanden als object terug.",
        miniPrompt:
          "Geef uitsluitend het aantal maanden terug in het vereiste objectformaat. Neem geen toelichting op in het antwoordobject.",
        antwoordType: "structured",
        answerFormat: '{"maanden":number}',
        voorbeeldAntwoord: '{"maanden":6}',
        frontendVariant: "maanden_object",
      },
    }),
    createField({
      fieldId: "rp_werkfit_7_1",
      exportNumberKey: "7.1",
      label: "Wat verwacht de cli\u00ebnt van de inzet en het resultaat van de re-integratiedienst? En van de begeleiding door uw organisatie?",
      fieldType: "ai",
      aiConfig: {
        vraag: "Wat verwacht de cli\u00ebnt van de inzet en het resultaat van de re-integratiedienst?",
        instructie: "Formuleer kort en zakelijk vanuit cli\u00ebntperspectief op basis van de bronnen.",
        miniPrompt:
          "Beschrijf de verwachting van de klant in zakelijke indirecte rede. Benoem alleen verwachtingen die uit uitspraken, wensen of duidelijke context blijken.",
        antwoordType: "text",
        voorbeeldAntwoord:
          "De cli\u00ebnt verwacht begeleiding die helpt bij het vinden en behouden van passend werk, met concrete stappen en regelmatige terugkoppeling.",
      },
    }),
    createField({
      fieldId: "rp_werkfit_7_2",
      exportNumberKey: "7.2",
      label: "Wat is uw visie op de re-integratiemogelijkheden van de cli\u00ebnt?",
      fieldType: "ai",
      aiConfig: {
        vraag: "Wat is uw visie op de re-integratiemogelijkheden van de cli\u00ebnt?",
        instructie: "Geef een professionele inschatting op basis van feitelijke broninformatie.",
        miniPrompt:
          "Geef een professionele visie op de re-integratiemogelijkheden, gebaseerd op belastbaarheid, vaardigheden, werkrichting, ontwikkeling en randvoorwaarden die uit de informatie blijken. Schrijf onderbouwd en terughoudend.",
        antwoordType: "text",
        voorbeeldAntwoord:
          "De cli\u00ebnt laat zien dat er realistische re-integratiekansen zijn, doordat werkhervatting en positief functioneren in een werkomgeving al zichtbaar zijn.",
      },
    }),
    createField({
      fieldId: "rp_werkfit_7_3",
      exportNumberKey: "7.3",
      label: "Wat verwacht u van de inzet en het resultaat van de re-integratiedienst?",
      fieldType: "ai",
      aiConfig: {
        vraag: "Wat verwacht u van de inzet en het resultaat van de re-integratiedienst?",
        instructie: "Beschrijf verwachte opbrengst van het traject op basis van de broninformatie.",
        miniPrompt:
          "Beschrijf de verwachte opbrengst van de dienstverlening concreet en professioneel. Koppel de verwachting aan het trajectdoel en de haalbare ontwikkeling van de klant.",
        antwoordType: "text",
        voorbeeldAntwoord:
          "Verwacht wordt dat de ingezette begeleiding leidt tot verdere bestendiging van werkdeelname en duurzame inzetbaarheid.",
      },
    }),
    createField({
      fieldId: "rp_werkfit_8_1",
      exportNumberKey: "8.1",
      label: "Is er sprake van specialistisch uurtarief?",
      fieldType: "ai",
      aiConfig: {
        vraag: "Is er sprake van specialistisch uurtarief?",
        instructie: "Kies precies \u00e9\u00e9n optie.",
        miniPrompt:
          "Kies alleen Ja als specialistische expertise daadwerkelijk uit de informatie volgt. Kies anders Nee.",
        antwoordType: "multiple_choice",
        opties: [
          { value: 1, label: "Ja" },
          { value: 2, label: "Nee" },
        ],
        answerFormat: '{"keuze":1}',
        voorbeeldAntwoord: '{"keuze":1}',
        skipLogica: [{ when: { fieldId: "rp_werkfit_8_1", equals: 2 }, skipFieldIds: ["rp_werkfit_8_2", "rp_werkfit_8_3"] }],
        frontendVariant: "single_choice_numeric",
      },
    }),
    createField({
      fieldId: "rp_werkfit_8_2",
      exportNumberKey: "8.2",
      label: "Motiveer welke specialistische expertise voor de cli\u00ebnt nodig is en hoeveel uren u adviseert.",
      fieldType: "ai",
      aiConfig: {
        vraag: "Motiveer welke specialistische expertise voor de cli\u00ebnt nodig is en hoeveel uren u adviseert.",
        instructie: "Geef object terug met uren en motivering.",
        miniPrompt:
          "Noem welke specialistische expertise nodig is, waarom die nodig is en hoeveel uren daarvoor worden geadviseerd. Houd de motivering concreet en professioneel.",
        antwoordType: "structured",
        answerFormat: '{"uren":number,"motivering":"string"}',
        voorbeeldAntwoord: '{"uren":8,"motivering":"Extra specialistische begeleiding is nodig vanwege complexe belastbaarheidsproblematiek."}',
        frontendVariant: "uren_motivering",
      },
    }),
    createField({
      fieldId: "rp_werkfit_8_3",
      exportNumberKey: "8.3",
      label: "Hoger uurtarief specialistische expertise",
      fieldType: "ai",
      aiConfig: {
        vraag: "Wat is het in rekening te brengen hogere uurtarief voor de specialistische expertise? Motiveer waarom dit tarief noodzakelijk is.",
        instructie: "Geef object terug met tarief en motivering.",
        miniPrompt:
          "Noem het hogere tarief alleen als specialistische expertise voldoende is onderbouwd. Motiveer zakelijk waarom dat tarief passend en noodzakelijk is.",
        antwoordType: "structured",
        answerFormat: '{"tarief":number,"motivering":"string"}',
        voorbeeldAntwoord: '{"tarief":125,"motivering":"Dit tarief is nodig vanwege inzet van specialistische expertise op arbeidsdeskundig niveau."}',
        frontendVariant: "tarief_motivering",
      },
    }),
    createField({ fieldId: "rp_werkfit_9", exportNumberKey: "9.1", label: "Rechten en plichten", fieldType: "manual" }),
  ],
}

const eindrapportageWerkfit: UwvTemplate = {
  id: "eindrapportage_werkfit_maken",
  name: "Eindrapportage Werkfit maken",
  description: "UWV eindrapportage voor Werkfit maken.",
  fields: [
    createField({ fieldId: "er_werkfit_1_1", exportNumberKey: "1.1", label: "Naam cli\u00ebnt", fieldType: "programmatic" }),
    createField({ fieldId: "er_werkfit_1_2", exportNumberKey: "1.2", label: "BSN", fieldType: "programmatic" }),
    createField({ fieldId: "er_werkfit_2_1", exportNumberKey: "2.1", label: "Naam contactpersoon UWV", fieldType: "programmatic" }),
    createField({ fieldId: "er_werkfit_3_1", exportNumberKey: "3.1", label: "Naam organisatie", fieldType: "programmatic" }),
    createField({ fieldId: "er_werkfit_3_2", exportNumberKey: "3.2", label: "Naam contactpersoon", fieldType: "programmatic" }),
    createField({ fieldId: "er_werkfit_3_3", exportNumberKey: "3.3", label: "Functie contactpersoon", fieldType: "programmatic" }),
    createField({ fieldId: "er_werkfit_3_4", exportNumberKey: "3.4", label: "Telefoonnummer contactpersoon", fieldType: "programmatic" }),
    createField({ fieldId: "er_werkfit_3_5", exportNumberKey: "3.5", label: "E-mailadres contactpersoon", fieldType: "programmatic" }),
    createField({ fieldId: "er_werkfit_4_1", exportNumberKey: "4.1", label: "Ordernummer", fieldType: "programmatic" }),
    createField({
      fieldId: "er_werkfit_4_2",
      exportNumberKey: "4.2",
      label: "Van welke eindsituatie is er sprake?",
      fieldType: "ai",
      aiConfig: {
        vraag: "Van welke eindsituatie is er sprake?",
        instructie: "Kies precies \u00e9\u00e9n optie.",
        miniPrompt:
          "Bepaal de eindsituatie uitsluitend op basis van duidelijke trajectinformatie. Kies alleen een optie als die ondubbelzinnig volgt uit de beschikbare informatie.",
        antwoordType: "multiple_choice",
        opties: [
          { value: 1, label: "Be\u00ebindiging re-integratiedienst 'Werkfit maken' naar aanleiding van evaluatiemoment" },
          { value: 2, label: "Voortijdige terugmelding" },
          { value: 3, label: "Be\u00ebindiging re-integratiedienst 'Werkfit maken'" },
        ],
        answerFormat: '{"keuze":1}',
        voorbeeldAntwoord: '{"keuze":3}',
        skipLogica: [
          { when: { fieldId: "er_werkfit_4_2", equals: 1 }, skipFieldIds: ["er_werkfit_6_1", "er_werkfit_6_2", "er_werkfit_6_3"] },
          { when: { fieldId: "er_werkfit_4_2", equals: 2 }, skipFieldIds: ["er_werkfit_5_1", "er_werkfit_5_2"] },
          { when: { fieldId: "er_werkfit_4_2", equals: 3 }, skipFieldIds: ["er_werkfit_5_1", "er_werkfit_5_2", "er_werkfit_6_1", "er_werkfit_6_2", "er_werkfit_6_3"] },
        ],
        frontendVariant: "single_choice_numeric",
      },
    }),
    createField({
      fieldId: "er_werkfit_5_1",
      exportNumberKey: "5.1",
      label: "Reden be\u00ebindiging naar aanleiding van evaluatiemoment",
      fieldType: "ai",
      aiConfig: {
        vraag: "Waarom beëindigt u de re-integratiedienst naar aanleiding van het evaluatiemoment? Is de klant het hiermee eens?",
        instructie: "Beschrijf de reden en benoem expliciet of de klant het ermee eens is.",
        miniPrompt:
          "Benoem kort waarom op het evaluatiemoment wordt beëindigd en noem alleen instemming van de klant als die blijkt uit de informatie. Schrijf feitelijk en professioneel, zonder speculatie.",
        antwoordType: "text",
        voorbeeldAntwoord:
          "De dienst wordt beëindigd omdat de afgesproken doelen voor dit traject zijn bereikt. De klant is hierover geïnformeerd en kan zich vinden in deze beëindiging.",
      },
    }),
    createField({
      fieldId: "er_werkfit_5_2",
      exportNumberKey: "5.2",
      label: "Advies vervolg dienstverlening",
      fieldType: "ai",
      aiConfig: {
        vraag: "Wat is uw advies voor het vervolg van de dienstverlening?",
        instructie: "Geef concreet vervolgadvies dat logisch aansluit op het behaalde resultaat.",
        miniPrompt:
          "Formuleer een praktisch en professioneel vervolgadvies dat logisch voortbouwt op de bereikte situatie. Benoem alleen nazorg, begeleiding of vervolgstappen die uit de informatie volgen.",
        antwoordType: "text",
        voorbeeldAntwoord:
          "Advies is om de ingezette lijn voort te zetten met lichte nazorg en periodieke evaluatie, zodat de klant het werk duurzaam kan behouden.",
      },
    }),
    createField({
      fieldId: "er_werkfit_6_1",
      exportNumberKey: "6.1",
      label: "Reden voortijdige terugmelding",
      fieldType: "ai",
      aiConfig: {
        vraag: "Wat is de reden van de voortijdige terugmelding?",
        instructie: "Kies \u00e9\u00e9n standaardreden of kies 'Anders' en geef dan customReason.",
        miniPrompt:
          "Kies alleen een standaardreden als die expliciet past. Gebruik 'Anders' alleen wanneer de informatie duidelijk een andere reden noemt.",
        antwoordType: "multiple_choice",
        opties: [
          { value: 1, label: "Ziekte langer dan 4 weken (klant met een Ziektewet-uitkering)" },
          { value: 2, label: "Ziekte langer dan 13 weken (klant met een arbeidsongeschiktheidsuitkering)" },
          { value: 3, label: "Verhuizing van de klant" },
          { value: 4, label: "Overlijden van de klant" },
          { value: 5, label: "Bezwaar of beroep tegen het werkplan, Plan van aanpak of re-integratieplan" },
          { value: 6, label: "Anders" },
        ],
        answerFormat: '{"reden":1,"customReason":""}',
        voorbeeldAntwoord: '{"reden":6,"customReason":"Klant heeft het traject voortijdig be\u00ebindigd door gewijzigde priv\u00e9situatie."}',
        frontendVariant: "single_choice_with_custom_reason",
      },
    }),
    createField({
      fieldId: "er_werkfit_6_2",
      exportNumberKey: "6.2",
      label: "Toelichting voortijdige terugmelding",
      fieldType: "ai",
      aiConfig: {
        vraag: "Geef een toelichting op de reden van de voortijdige terugmelding.",
        instructie: "Geef een korte feitelijke toelichting.",
        miniPrompt:
          "Houd dit antwoord kort, feitelijk en neutraal. Licht alleen toe wat de aanleiding was en waarom het traject daardoor niet is voortgezet.",
        antwoordType: "text",
        voorbeeldAntwoord:
          "De klant kon het traject door de gewijzigde situatie niet voortzetten en heeft dit na overleg met betrokken partijen gemeld.",
      },
    }),
    createField({
      fieldId: "er_werkfit_6_3",
      exportNumberKey: "6.3",
      label: "Met wie bij UWV is de voortijdige terugmelding besproken?",
      fieldType: "manual",
    }),
    createField({
      fieldId: "er_werkfit_7_1",
      exportNumberKey: "7.1",
      label: "Re-integratieactiviteiten en begeleidingsuren",
      fieldType: "ai",
      aiConfig: {
        vraag: "Welke re-integratieactiviteiten heeft u voor de klant uitgevoerd? En hoeveel begeleidingsuren heeft u ingezet per activiteit?",
        instructie: "Geef zowel hoofdkeuzes als activiteiten/uren terug.",
        miniPrompt:
          "Kies hoofdactiviteiten alleen als ze inhoudelijk passen bij de uitgevoerde begeleiding. Neem bij activiteiten alleen concrete trajectonderdelen op en koppel daar realistische uren aan zoals die uit de informatie volgen.",
        antwoordType: "structured",
        opties: [
          { value: 1, label: "Versterken werknemersvaardigheden" },
          { value: 2, label: "Verbeteren persoonlijke effectiviteit" },
          { value: 3, label: "In beeld brengen arbeidsmarktpositie" },
        ],
        answerFormat: '{"keuzes":[1,2],"activiteiten":[{"activiteit":"string","uren":number}]}',
        voorbeeldAntwoord:
          '{"keuzes":[1,3],"activiteiten":[{"activiteit":"Sollicitatiebegeleiding","uren":5},{"activiteit":"Arbeidsmarktori\u00ebntatie","uren":4}]}',
        frontendVariant: "activiteiten_en_keuzes",
      },
    }),
    createField({
      fieldId: "er_werkfit_7_2",
      exportNumberKey: "7.2",
      label: "Vorderingen klant",
      fieldType: "ai",
      aiConfig: {
        vraag: "Welke vorderingen heeft de klant gemaakt?",
        instructie: "Beschrijf feitelijke voortgang en ontwikkeling in professionele UWV-stijl.",
        miniPrompt:
          "Beschrijf eerst de hoofdlijn van de voortgang richting werk of werkfitheid. Werk dat daarna uit met concrete stappen, inzichten, acties of resultaten die tijdens het traject zijn bereikt, zoals ook in de voorbeeldrapportages gebeurt.",
        antwoordType: "text",
        voorbeeldAntwoord:
          "De klant heeft aantoonbare voortgang laten zien in werkgerichte vaardigheden en heeft concrete stappen gezet richting duurzame arbeidsdeelname.",
      },
    }),
    createField({
      fieldId: "er_werkfit_7_3",
      exportNumberKey: "7.3",
      label: "Bereikt resultaat",
      fieldType: "ai",
      aiConfig: {
        vraag: "Wat is het bereikte resultaat?",
        instructie: "Kies precies \u00e9\u00e9n resultaatoptie.",
        miniPrompt:
          "Kies alleen het resultaat dat direct volgt uit de beschikbare informatie over werkfitheid en inzetbaarheid.",
        antwoordType: "multiple_choice",
        opties: [
          { value: 1, label: "De klant is werkfit en kan aan het werk" },
          { value: 2, label: "De klant is niet werkfit" },
        ],
        answerFormat: '{"resultaat":1}',
        voorbeeldAntwoord: '{"resultaat":1}',
        frontendVariant: "single_choice_numeric",
      },
    }),
    createField({
      fieldId: "er_werkfit_7_4",
      exportNumberKey: "7.4",
      label: "Onderbouwing werkfit/niet werkfit",
      fieldType: "ai",
      aiConfig: {
        vraag: "Geef aan waaruit blijkt dat de klant werkfit is, of wat de reden is dat de klant niet werkfit is.",
        instructie: "Onderbouw het resultaat met concrete observaties.",
        miniPrompt:
          "Onderbouw het resultaat met zichtbaar gedrag, bereikte stappen, functioneren, belastbaarheid, werktempo of concrete opbrengsten. Schrijf niet alleen de conclusie op, maar leg uit waar die professioneel op steunt.",
        antwoordType: "text",
        voorbeeldAntwoord:
          "Uit de uitgevoerde activiteiten en behaalde voortgang blijkt dat de klant werkfit gedrag laat zien en in staat is duurzaam richting werk te bewegen.",
      },
    }),
    createField({
      fieldId: "er_werkfit_7_5",
      exportNumberKey: "7.5",
      label: "Eigen mening klant over werkfitheid",
      fieldType: "ai",
      aiConfig: {
        vraag: "Is de klant naar zijn eigen mening werkfit? Waaruit blijkt dat?",
        instructie: "Beschrijf de eigen beleving van de klant en de feitelijke onderbouwing.",
        miniPrompt:
          "Beschrijf de visie van de klant in indirecte rede en onderbouw die met uitspraken, houding, ervaringen of concrete stappen van de klant. Neem voorwaarden zoals passend tempo, belastbaarheid of setting mee als die relevant zijn.",
        antwoordType: "text",
        voorbeeldAntwoord:
          "De klant geeft aan zich werkfit te voelen en onderbouwt dit met het hervatten van werk en positieve ervaringen in de werkomgeving.",
      },
    }),
    createField({
      fieldId: "er_werkfit_7_6",
      exportNumberKey: "7.6",
      label: "Wat is uw vervolgadvies en welke bemiddeling en/of begeleiding heeft de klant nog nodig?",
      fieldType: "ai",
      aiConfig: {
        vraag: "Wat is uw vervolgadvies en welke bemiddeling en/of begeleiding heeft de klant nog nodig?",
        instructie: "Geef concreet vervolgadvies met benodigde ondersteuning.",
        miniPrompt:
          "Geef een praktisch vervolgadvies dat aansluit op de huidige fase van de klant. Benoem welke ondersteuning nog nodig is alleen als die logisch uit de informatie volgt; denk aan bestendigen, gefaseerd uitbouwen, aanvullende begeleiding of gerichte ondersteuning.",
        antwoordType: "text",
        voorbeeldAntwoord:
          "Advies is om de huidige werkhervatting te bestendigen met beperkte nazorg en gerichte begeleiding op behoud van belastbaarheid.",
      },
    }),
    createField({
      fieldId: "er_werkfit_7_7",
      exportNumberKey: "7.7",
      label: "Toelichting op advies",
      fieldType: "ai",
      aiConfig: {
        vraag: "Toelichting op advies",
        instructie: "Licht kort en professioneel toe waarom het advies passend is.",
        miniPrompt:
          "Leg uit waarom dit advies past bij het huidige functioneren, de belastbaarheid, het werktempo en de duurzaamheid van de vervolgstap. Sluit aan op de toon van de voorbeeldrapportages: professioneel, concreet en terughoudend.",
        antwoordType: "text",
        voorbeeldAntwoord:
          "Het advies sluit aan bij het huidige niveau van functioneren en voorkomt overbelasting, terwijl verdere ontwikkeling mogelijk blijft.",
      },
    }),
    createField({
      fieldId: "er_werkfit_7_8",
      exportNumberKey: "7.8",
      label: "Wat vindt de klant van dit advies?",
      fieldType: "ai",
      aiConfig: {
        vraag: "Wat vindt de klant van dit advies?",
        instructie: "Beschrijf de reactie van de klant op het advies.",
        miniPrompt:
          "Beschrijf kort of de klant zich in het advies kan vinden en welke houding de klant daarbij laat zien. Vul dit alleen in als de reactie van de klant uit de informatie blijkt.",
        antwoordType: "text",
        voorbeeldAntwoord: "De klant kan zich vinden in het voorgestelde advies en staat open voor de aanbevolen vervolgstappen.",
      },
    }),
    createField({
      fieldId: "er_werkfit_8_1",
      exportNumberKey: "8.1",
      label: "Hoe heeft de klant de door u ingezette re-integratieactiviteiten ervaren?",
      fieldType: "ai",
      aiConfig: {
        vraag: "Hoe heeft de klant de door u ingezette re-integratieactiviteiten ervaren?",
        instructie: "Beschrijf de klantervaring feitelijk en beknopt.",
        miniPrompt:
          "Beschrijf hoe de klant de begeleiding heeft ervaren in 1 tot 3 professionele zinnen. Benoem ervaren meerwaarde, stijl van begeleiding of opbrengst alleen als die uit de informatie blijkt.",
        antwoordType: "text",
        voorbeeldAntwoord:
          "De klant heeft de activiteiten als ondersteunend en praktisch ervaren, met duidelijke meerwaarde voor het zetten van vervolgstappen.",
      },
    }),
    createField({
      fieldId: "er_werkfit_8_2",
      exportNumberKey: "8.2",
      label: "Is de klant akkoord met het aantal door u ingezette en verantwoorde begeleidingsuren?",
      fieldType: "ai",
      aiConfig: {
        vraag: "Is de klant akkoord met het aantal door u ingezette en verantwoorde begeleidingsuren?",
        instructie: "Kies Ja/Nee en geef toelichting vooral bij Nee of wanneer toelichting aanwezig is.",
        miniPrompt:
          "Kies alleen Ja als instemming of akkoord uit de informatie blijkt. Voeg toelichting vooral toe bij Nee of wanneer expliciete toelichting beschikbaar is.",
        antwoordType: "multiple_choice",
        opties: [
          { value: 1, label: "Ja" },
          { value: 2, label: "Nee" },
        ],
        answerFormat: '{"akkoord":1,"toelichting":""}',
        voorbeeldAntwoord: '{"akkoord":1,"toelichting":"De klant heeft bevestigd akkoord te zijn met het aantal ingezette begeleidingsuren."}',
        frontendVariant: "akkoord_met_toelichting",
      },
    }),
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

