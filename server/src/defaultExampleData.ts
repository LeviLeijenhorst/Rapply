import { execute, queryOne } from "./db"

type ExampleSession = {
  title: string
  reportDate: string
  wvpWeekNumber: string
  transcript: string
  summary: string
}

const janVoorbeeldSessions: ExampleSession[] = [
  {
    title: "intake",
    reportDate: "2026-01-08",
    wvpWeekNumber: "Week 3",
    transcript: `[00:00.0] coach: Fijn dat je er bent Jan. Zullen we starten met hoe het nu met je gaat sinds je ziekmelding?
[00:14.2] jan: Ja, dat is goed. Ik merk dat de vermoeidheid nog steeds groot is. Ik slaap wel, maar word niet uitgerust wakker.
[00:29.5] coach: Begrijpelijk. Kun je beschrijven hoe een gemiddelde werkdag er voor je uitzag voor je uitval?
[00:45.0] jan: Ik werkte als logistiek planner, meestal van half acht tot vijf. Veel schakelen, veel telefoontjes, en vaak tussendoor problemen oplossen.
[01:03.8] coach: En welke onderdelen van dat werk geven nu de meeste spanning als je eraan denkt?
[01:19.6] jan: Vooral de constante druk en het tempo. Ik kan me nu korter concentreren en ik raak sneller overprikkeld.
[01:37.4] coach: Helder. Wat lukt momenteel wel in het dagelijks leven?
[01:50.3] jan: Korte wandelingen, huishoudelijke taken in kleine blokken, en twee keer per week mijn kinderen naar school brengen.
[02:08.9] coach: Dat zijn belangrijke signalen van belastbaarheid. Hoe is het contact met je leidinggevende tot nu toe?
[02:22.7] jan: Redelijk goed. Ze willen me graag terug, maar ik voel ook druk omdat het team onderbezet is.
[02:40.1] coach: Ik hoor zowel steun als druk. We gaan samen kijken hoe je inzetbaar kunt opbouwen zonder terugval.
[02:55.6] jan: Dat klinkt goed. Ik wil graag terug, maar niet te snel weer uitvallen.
[03:11.8] coach: Precies. Welke eerdere hulp heb je al gehad?
[03:24.0] jan: Gesprekken met de bedrijfsarts, en drie gesprekken met de praktijkondersteuner over stress en herstel.
[03:40.9] coach: Mooi, daar kunnen we op aansluiten. Als doel voor de komende zes weken: wat zou voor jou een realistische stap zijn?
[03:58.4] jan: Misschien starten met twee ochtenden per week lichte taken, zonder piekbelasting.
[04:15.7] coach: Dat is concreet. Dan zetten we in het plan: opbouw met voorspelbare taken, vaste pauzes, en evaluatie na twee weken.
[04:33.3] jan: Ja, en ik wil dat mijn leidinggevende weet dat ik tijdelijk geen spoedplanning kan doen.
[04:47.2] coach: Dat nemen we mee als randvoorwaarde. Is er nog iets dat je nodig hebt om je veilig te voelen in deze start?
[05:01.1] jan: Duidelijkheid over verwachtingen. Dan krijg ik rust.
[05:13.6] coach: Afgesproken. Ik stuur een samenvatting met acties voor jou, werkgever en een evaluatiemoment.`,
    summary: `### Clientgegevens
- Naam: Jan Voorbeeld
- Functie: Logistiek planner (36 uur)
- Eerste ziektedag: 2025-12-18
- Betrokkenen: Jan Voorbeeld, re-integratiecoach, leidinggevende Teamlead Planning

### Probleemstelling
Jan ervaart stressgerelateerde vermoeidheid, afgenomen concentratie en prikkelgevoeligheid bij hoge werkdruk en onvoorspelbare taken.

### Huidige situatie en belastbaarheid
Korte taakblokken en lichte administratieve werkzaamheden zijn haalbaar. Piekbelasting, escalaties en constante telefonische druk zijn nog niet duurzaam inzetbaar.

### Eerdere inspanningen
Gesprekken met bedrijfsarts en praktijkondersteuner (stress/herstel) zijn gestart en geven basis voor verdere opbouw.

### Doelen en hulpvraag
Doel is duurzame, stapsgewijze werkhervatting zonder terugval. Hulpvraag: duidelijke grenzen en voorspelbare taakopbouw.

### Afspraken vervolgtraject
- Start met 2 ochtenden per week lichte, afgebakende taken.
- Geen spoedplanning of escalatietaken in deze fase.
- Vaste pauzes en energiemonitoring.
- Evaluatie na 2 weken met coach en leidinggevende.

### Ondertekening
Besproken met client en coach; verslag gedeeld met betrokkenen.`,
  },
  {
    title: "Voortgangsgesprek",
    reportDate: "2026-01-29",
    wvpWeekNumber: "Week 6",
    transcript: `[00:00.0] coach: We zijn drie weken verder. Hoe is de opbouw gegaan sinds het intakegesprek?
[00:13.5] jan: Beter dan verwacht. Twee ochtenden per week lukken, maar ik ben daarna wel erg moe.
[00:27.9] coach: Welke taken deed je precies tijdens die ochtenden?
[00:39.4] jan: Vooral administratieve checks, statusupdates in het systeem en overdracht voorbereiden voor collega planners.
[00:54.2] coach: En welke taken heb je bewust nog niet opgepakt?
[01:05.6] jan: Telefonische escalaties en last-minute herplanning. Dat geeft meteen stress.
[01:18.8] coach: Goed dat je daarin grenzen houdt. Wat zegt je leidinggevende over de voortgang?
[01:31.7] jan: Positief. Ze zien dat ik betrouwbaar ben als de taken afgebakend zijn.
[01:44.9] coach: Zijn er momenten geweest waarop de belasting te hoog werd?
[01:57.0] jan: Vorige week woensdag. Er was onverwacht veel uitval in het team en ik werd toch om snelle beslissingen gevraagd.
[02:13.3] coach: Wat gebeurde er toen met je energie?
[02:24.0] jan: Ik had later op de dag hoofdpijn en de dag erna was ik bijna volledig uitgeput.
[02:37.2] coach: Dat is een belangrijk leermoment. Welke beschermende afspraken ontbreken nog?
[02:49.7] jan: Een duidelijke vervanger voor escalaties tijdens mijn opbouwuren.
[03:03.5] coach: Die zetten we als actie bij werkgever. Voor jou: wat helpt om herstel beter te bewaken?
[03:16.8] jan: Strakker pauzeren en niet doorgaan als ik spanning in mijn schouders voel.
[03:31.6] coach: Prima. Durf je de komende periode uit te breiden naar drie ochtenden, of is dat te vroeg?
[03:45.2] jan: Ik wil het proberen, mits de taken licht blijven.
[03:58.9] coach: Dan spreken we af: drie ochtenden gedurende twee weken, geen spoedtaken, evaluatie op belastbaarheid en herstel.
[04:16.5] jan: Ja, dat voelt haalbaar.
[04:27.4] coach: Ik koppel dit terug met een concreet actieschema en verantwoordelijkheden.`,
    summary: `### Datum en weeknummer
- Gespreksdatum: 2026-01-29
- WvP-context: Week 6

### Deelnemers
Jan Voorbeeld en re-integratiecoach (terugkoppeling richting leidinggevende).

### Acties sinds vorig verslag
- Opstart met 2 ochtenden per week op lichte taken.
- Taakafbakening toegepast op administratieve werkzaamheden.
- Pauzes grotendeels gevolgd volgens afspraak.

### Resultaten en voortgang
Opbouw is stabiel gestart. Jan toont betrouwbare inzet binnen afgebakende taken en ervaart voorzichtig herstel van werkritme.

### Belemmeringen
Onverwachte piekbelasting leidde tot overbelasting (hoofdpijn en uitputting volgende dag). Escalatietaken blijven niet passend.

### Aanpassingen en afspraken
- Tijdelijke uitbreiding naar 3 ochtenden per week voor 2 weken.
- Geen spoedtaken of last-minute herplanning.
- Werkgever regelt structurele vervanging voor escalaties.
- Jan bewaakt actief spanningssignalen en neemt vaste herstelpauzes.

### Volgend gesprek
Volgende evaluatie gepland over 2 weken op belastbaarheid en herstel.

### Ondertekening
Afspraken bevestigd door client en coach.`,
  },
  {
    title: "Tweede spoor plan/rapport",
    reportDate: "2026-02-19",
    wvpWeekNumber: "Week 9",
    transcript: `[00:00.0] coach: Vandaag kijken we naar de voortgang in spoor 1 en of orientatie op spoor 2 zinvol is. Hoe kijk jij ernaar?
[00:16.4] jan: Ik merk vooruitgang, maar volledige terugkeer in mijn oude rol voelt nog niet realistisch.
[00:31.2] coach: Welke onderdelen van de oude rol blijven te zwaar?
[00:42.0] jan: Vooral continue tijdsdruk, conflicterende prioriteiten en veel telefoonverkeer tegelijk.
[00:56.6] coach: En waar liggen je sterke kanten die wel goed inzetbaar zijn?
[01:08.1] jan: Structuur aanbrengen, procesverbetering, documentatie en rustig contact met collegas.
[01:22.7] coach: Dat profiel past mogelijk ook bij andere functies binnen of buiten de organisatie. Heb je daar al over gesproken?
[01:38.5] jan: Kort met HR. Ze stonden open voor verkenning, maar nog zonder concreet plan.
[01:52.3] coach: Dan is dit een goed moment om die verkenning te formaliseren. Wat zou je nodig hebben om dat veilig te doen?
[02:07.6] jan: Dat het geen drukmiddel wordt, maar echt een orientatie naast spoor 1.
[02:22.9] coach: Belangrijk punt. We noteren expliciet dat spoor 1 doorloopt, met parallelle orientatie op passende alternatieven.
[02:38.4] jan: Dat geeft rust. Ik wil opties onderzoeken zonder gevoel dat ik faal.
[02:52.0] coach: Dat is professioneel en toekomstgericht. Voor de komende maand stel ik drie acties voor: competentieprofiel opstellen, twee informatieve gesprekken, en een belastbaarheidscheck met bedrijfsarts.
[03:11.6] jan: Die acties passen. Ik wil ook hulp bij het vertalen van mijn ervaring naar een ander functieprofiel.
[03:26.5] coach: Neem ik mee. Ik plan een aparte sessie voor cv-profiel en arbeidsmarktrichting.
[03:40.8] jan: Fijn. Dan heb ik meer houvast.
[03:53.4] coach: Tot slot, hoe gaat het herstel thuis met deze extra stappen?
[04:06.1] jan: Als ik goed plan, gaat het. Ik moet alleen opletten dat ik niet alles tegelijk wil doen.
[04:20.2] coach: Dan blijft energiemanagement een kernafspraak: beperkte weekdoelen, vaste rustmomenten en wekelijkse reflectie.`,
    summary: `### Aanleiding tweede spoor
Volledige terugkeer in oorspronkelijke rol met structurele piekdruk is op dit moment niet realistisch, ondanks voortgang in spoor 1.

### Onderzoek en belastbaarheid
Belastbaarheid groeit bij voorspelbare taken. Beperkingen blijven zichtbaar bij hoge tijdsdruk, conflicterende prioriteiten en continue telefonische belasting.

### Arbeidsmarktactiviteiten
- Opstellen competentieprofiel gericht op structuur- en procesrollen.
- Twee orienterende gesprekken met mogelijke alternatieve functies.
- Voorbereiding op arbeidsmarktrichting en profielvertaling.

### Ondersteuning werkgever en arbodienst
HR en werkgever ondersteunen een parallelle orientatie naast voortzetting van spoor 1. Bedrijfsarts blijft betrokken voor belastbaarheidsafstemming.

### Plan en deadlines
- Week 10: competentieprofiel afronden.
- Week 11-12: twee orienterende gesprekken voeren.
- Week 12: evalueren of vervolg tweede spoor wordt uitgebreid.

### Resultaten en belemmeringen
Resultaat: meer richting en rust door concreet plan. Belemmering: risico op overplanning en energiedips bij te veel parallelle acties.

### Vervolgafspraken
Weekdoelen beperken, vaste rustmomenten behouden, wekelijkse reflectie met coach, en voortgang schriftelijk terugkoppelen aan werkgever.

### Ondertekening
Concept besproken en akkoord voor uitvoering in komende periode.`,
  },
]

// Adds one default Jan Voorbeeld client and example reports for freshly created users.
export async function ensureDefaultExampleDataForUser(userId: string): Promise<void> {
  const existingData = await queryOne<{ has_coachees: boolean; has_sessions: boolean }>(
    `
    select
      exists(select 1 from public.coachees where user_id = $1) as has_coachees,
      exists(select 1 from public.coachee_sessions where user_id = $1) as has_sessions
    `,
    [userId],
  )

  if (existingData?.has_coachees || existingData?.has_sessions) {
    return
  }

  const coacheeId = `coachee-example-${userId}-jan-voorbeeld`
  const baseUnixMs = Date.now()

  await execute(
    `
    insert into public.coachees (id, user_id, name, client_details, employer_details, first_sick_day, created_at_unix_ms, updated_at_unix_ms, is_archived)
    values ($1, $2, $3, $4, $5, $6, $7, $8, false)
    on conflict (id) do nothing
    `,
    [
      coacheeId,
      userId,
      "Jan Voorbeeld",
      "Functie: logistiek planner (36 uur). Hulpvraag: duurzame werkhervatting met behoud van belastbaarheid. Klachtenbeeld: stressgerelateerde vermoeidheid en prikkelgevoeligheid bij hoge werkdruk.",
      "Werkgever: DeltaLogistiek BV. Leidinggevende: Teamlead Planning. Werkcontext: hoog tempo, veel ad-hoc wijzigingen, frequente telefonische afstemming.",
      "2025-12-18",
      baseUnixMs - 1000 * 60 * 60 * 24 * 60,
      baseUnixMs - 1000 * 60 * 60 * 24 * 60,
    ],
  )

  for (let index = 0; index < janVoorbeeldSessions.length; index += 1) {
    const item = janVoorbeeldSessions[index]
    const sessionId = `session-example-${userId}-jan-voorbeeld-${index + 1}`
    const sessionUnixMs = baseUnixMs - 1000 * 60 * 60 * 24 * (45 - index * 10)

    await execute(
      `
      insert into public.coachee_sessions (
        id, user_id, coachee_id, title, kind, audio_blob_id, audio_duration_seconds, upload_file_name, transcript, summary,
        report_date, wvp_week_number, report_first_sick_day, transcription_status, transcription_error, created_at_unix_ms, updated_at_unix_ms
      )
      values ($1, $2, $3, $4, 'recording', null, null, null, $5, $6, $7, $8, $9, 'done', null, $10, $11)
      on conflict (id) do nothing
      `,
      [sessionId, userId, coacheeId, item.title, item.transcript, item.summary, item.reportDate, item.wvpWeekNumber, "2025-12-18", sessionUnixMs, sessionUnixMs],
    )

    await execute(
      `
      insert into public.session_written_reports (session_id, user_id, text, updated_at_unix_ms)
      values ($1, $2, $3, $4)
      on conflict (session_id) do nothing
      `,
      [sessionId, userId, item.summary, sessionUnixMs],
    )
  }
}
