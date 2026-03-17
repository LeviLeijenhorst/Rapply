=====================================================================
BELANGRIJKE CONTEXT VOOR CODEX
=====================================================================

Dit document is een beschrijving van:

1. de beoogde AI-pipeline
2. de UX/UI-flow van de applicatie

Deze beschrijving is gegenereerd door een AI-agent (ChatGPT) die
GEEN toegang heeft tot de codebase.

Daarom is het belangrijk dat je als Codex / Cursor begrijpt dat:

- bepaalde benamingen mogelijk NIET overeenkomen met de codebase
- bepaalde architectuurideeën mogelijk aangepast moeten worden
- sommige concepten al bestaan in de code maar misschien anders heten
- sommige onderdelen mogelijk al gedeeltelijk geïmplementeerd zijn
- er discrepantie kan zitten tussen de gewenste flow in dit document
  en de huidige pipeline in de codebase
- dit document AI-gegenereerd is en dus fouten kan bevatten

Jouw taak is dus NIET om dit blind te implementeren.

Jouw taak is om:

1. de codebase te analyseren
2. deze beschrijving te interpreteren als gewenste richting
3. verschillen tussen huidige implementatie en gewenste flow te benoemen
4. een technisch implementatieplan te maken dat past bij de bestaande code
5. rekening te houden met mijn code-preferences (die jij kent uit de code)

Later gaan we:

- de codebase opschonen
- de AI-pipeline correct implementeren
- regeneratiefunctionaliteit toevoegen
- de chat verbeteren

=====================================================================
BELANGRIJKE CORRECTIE OP DE FLOW
=====================================================================

Snippets worden NIET gegenereerd wanneer een rapport wordt gegenereerd.

Snippets worden gegenereerd wanneer een input wordt opgeslagen.

Dus:

INPUT OPSLAAN
→ snippet extractie
→ snippets
→ goedkeuring
→ goedgekeurde snippets

Wanneer later een rapport wordt gegenereerd, gebruikt de pipeline:

- bestaande goedgekeurde snippets
- notities
- rapportvragen
- questionId’s

=====================================================================
DEEL 1 — UX / UI FLOW VAN DE APPLICATIE
=====================================================================

Dit deel beschrijft hoe de applicatie werkt vanuit het perspectief
van de gebruiker.

De AI-pipeline moet deze UX ondersteunen.

---------------------------------------------------------------------
CLIENTPAGINA
---------------------------------------------------------------------

De gebruiker bevindt zich op een clientpagina.

Hier kan de gebruiker:

- inputs bekijken
- notities bekijken
- rapportages bekijken
- een nieuwe rapportage genereren

De client bevat alle relevante informatie over een cliënt.

Deze informatie bestaat uit:

- inputs
- snippets
- notities
- rapportages

---------------------------------------------------------------------
NIEUWE RAPPORTAGE GENEREREN
---------------------------------------------------------------------

Op de clientpagina kan de gebruiker klikken op:

"Nieuwe rapportage genereren"

Dit opent een nieuw rapportgeneratiescherm.

---------------------------------------------------------------------
RAPPORTGENERATIESCHERM
---------------------------------------------------------------------

Op deze pagina kan de gebruiker:

1. een rapporttemplate kiezen
2. inputs selecteren
3. notities selecteren
4. het rapport genereren

---------------------------------------------------------------------
RAPPORTTEMPLATES
---------------------------------------------------------------------

De lijst met rapporttemplates is afhankelijk van:

het traject waarin de cliënt zit.

Voorbeelden:

- Werkfit rapport
- Naar Werk rapport
- andere UWV rapportages

De templates bevatten rapportagevragen.

Elke rapportvraag heeft al een questionId in de bestaande code.

Deze questionId moet gebruikt blijven worden.

---------------------------------------------------------------------
SELECTEREN VAN CLIËNTINFORMATIE
---------------------------------------------------------------------

De gebruiker kan bepalen welke informatie wordt gebruikt
voor rapportgeneratie.

Dit kan bestaan uit:

- opgenomen gesprekken
- gesproken recaps
- geschreven recaps
- geüploade documenten
- notities

Deze informatie wordt gebruikt voor het analyseren
van de cliëntinformatie bij rapportgeneratie.

---------------------------------------------------------------------
RAPPORT GENEREREN
---------------------------------------------------------------------

Wanneer de gebruiker op:

"Rapport genereren"

drukt, start de AI pipeline.

De pipeline bestaat uit:

1. reasoning call
2. rapportgeneratie

Snippets bestaan op dat moment al.

---------------------------------------------------------------------
REASONING CALL
---------------------------------------------------------------------

Er wordt één reasoning call gedaan per rapport.

Deze call gebruikt:

- goedgekeurde snippets
- notities
- rapporttype
- rapportvragen
- questionId per vraag

Output per vraag:

- questionId
- feitelijke basis
- reasoning

Deze feitelijke basis wordt opgeslagen.

Deze basis wordt later gebruikt voor:

- rapportgeneratie
- regeneratie van antwoorden

---------------------------------------------------------------------
RAPPORT GENEREREN
---------------------------------------------------------------------

Daarna wordt het rapport gegenereerd.

Dit gebeurt met:

één GPT-5 call per rapport.

Input:

- rapporttype
- rapportvragen
- feitelijke basis per vraag

Output:

rapportantwoorden per vraag.

Deze antwoorden vullen de velden van het rapport.

---------------------------------------------------------------------
RAPPORTAGE CONTROLEREN PAGINA
---------------------------------------------------------------------

Na generatie wordt de gebruiker doorgestuurd naar:

de rapportage controleren pagina.

Hier staan alle velden van het rapport.

Er zijn drie soorten velden.

---------------------------------------------------------------------
PROGRAMMATISCHE VELDEN
---------------------------------------------------------------------

Deze worden ingevuld via externe API’s.

Bijvoorbeeld:

- cliëntgegevens
- trajectinformatie

Belangrijk:

AI heeft GEEN toegang tot deze velden.

---------------------------------------------------------------------
AI VELDEN
---------------------------------------------------------------------

Dit zijn velden die door AI zijn ingevuld.

Deze kunnen worden:

- aangepast
- hergegenereerd

---------------------------------------------------------------------
HANDMATIGE VELDEN
---------------------------------------------------------------------

Deze kan de gebruiker zelf aanpassen.

---------------------------------------------------------------------
REGENERATE PER VELD
---------------------------------------------------------------------

De gebruiker kan een AI veld regenereren.

Dit gebeurt op basis van:

- de bestaande feitelijke basis
- een optionele prompt

O3 wordt hierbij NIET opnieuw aangeroepen.

Alleen GPT-5 wordt gebruikt.

---------------------------------------------------------------------
REGENERATE VIA AI CHAT
---------------------------------------------------------------------

Op de rapportpagina staat een AI chat.

Wanneer de gebruiker een veld wil regenereren met een prompt:

dan verschijnt het antwoord boven de messagebar
(vergelijkbaar met een WhatsApp reply).

De gebruiker kan:

- één antwoord selecteren
- meerdere antwoorden selecteren

Deze stapelen boven de messagebar.

De gebruiker kan daarna een prompt sturen.

Bijvoorbeeld:

"Maak dit korter"

"Schrijf dit formeler"

De AI genereert vervolgens nieuwe versies.

Deze worden gebaseerd op:

de opgeslagen feitelijke basis.

---------------------------------------------------------------------
VERSIEBEHEER
---------------------------------------------------------------------

Wanneer een antwoord opnieuw wordt gegenereerd:

moet het systeem bewaren:

- de oude versie
- de nieuwe versie

De gebruiker moet:

- eerdere versies kunnen bekijken
- eerdere versies kunnen herstellen

Het moet zichtbaar zijn:

welke stukken door AI zijn hergegenereerd.

---------------------------------------------------------------------
EXPORT
---------------------------------------------------------------------

Wanneer het rapport klaar is kan de gebruiker het exporteren.

Exportformaat:

UWV Word document.

---------------------------------------------------------------------
CHAT OP RAPPORTPAGINA
---------------------------------------------------------------------

Op de rapportpagina staat een chat.

Deze chat kan gebruikt worden voor:

- normale vragen
- regenereren van rapportantwoorden

De chat heeft toegang tot:

- snippets
- notities
- rapportantwoorden
- feitelijke bases

De chat heeft GEEN toegang tot programmatisch ingevulde velden.

---------------------------------------------------------------------
SYNCHRONISATIE MET VELDEN
---------------------------------------------------------------------

Wanneer de AI via chat een antwoord aanpast:

moet dat direct zichtbaar worden
in het veld van de rapporteditor.

AI output
→ veld wordt geüpdatet.

---------------------------------------------------------------------
TWEE SOORTEN CHAT
---------------------------------------------------------------------

CLIENT CHAT

Context:

alle snippets van de cliënt
+ notities.

INPUT CHAT

Context:

alleen snippets van één input.

=====================================================================
DEEL 2 — AI PIPELINE
=====================================================================

---------------------------------------------------------------------
INPUT TYPES
---------------------------------------------------------------------

De inputtypes zijn de opties die een gebruiker kan kiezen
wanneer op "Nieuwe input" wordt geklikt.

Deze inputtypes zijn:

- opgenomen gesprek
- gesproken recap
- geschreven recap
- geüpload document

Notities zijn geen inputs maar worden wel gebruikt
als onderdeel van cliëntkennis in prompts.

---------------------------------------------------------------------
SNIPPET EXTRACTIE
---------------------------------------------------------------------

Snippets worden gegenereerd wanneer een input wordt opgeslagen.

Flow:

INPUT OPSLAAN
→ snippet extractie
→ snippets
→ goedkeuring
→ goedgekeurde snippets

Alleen goedgekeurde snippets worden gebruikt voor:

- rapportgeneratie
- chat

---------------------------------------------------------------------
STRUCTUUR VAN CLIËNTKENNIS IN PROMPTS
---------------------------------------------------------------------

Cliëntkennis bestaat uit:

- goedgekeurde snippets
- notities

Deze worden gegroepeerd op:

type input
datum

Voorbeeld:

Samenvatting van relevante cliëntinformatie

Opgenomen gesprek op 3 maart 2026

- snippet
- snippet

Gesproken recap op 5 maart 2026

- snippet

Geschreven recap op 6 maart 2026

- snippet

Geüpload document op 10 maart 2026

- snippet

Notitie op 12 maart 2026

- snippet

---------------------------------------------------------------------
SNIPPET EXTRACTIE PROMPT
---------------------------------------------------------------------

SYSTEM PROMPT

CONTEXT DOCUMENT

Je opereert binnen een applicatie die gebruikt wordt door
re-integratiecoaches en re-integratiebureaus.

Deze applicatie helpt bij het maken van rapportages voor het UWV.

Coaches nemen gesprekken met cliënten op,
maken gesproken of geschreven recaps,
uploaden documenten en schrijven notities.

Uit deze informatie worden snippets gehaald
die relevante feiten en observaties over de cliënt bevatten.

RULES DOCUMENT

- Haal belangrijke feiten en observaties uit de input
- Formuleer elke snippet als losse observatie
- Gebruik alleen informatie uit de input

USER PROMPT

Type input:

<INPUTTYPE>

Input inhoud:

<INPUTTEKST OF TRANSCRIPT>

Genereer snippets.

---------------------------------------------------------------------
REASONING CALL (O3)
---------------------------------------------------------------------

Er wordt één reasoning call gedaan per rapport.

Output per vraag:

- questionId
- feitelijke basis
- reasoning

SYSTEM PROMPT

CONTEXT DOCUMENT

Je opereert binnen een applicatie die gebruikt wordt door
re-integratiecoaches en re-integratiebureaus.

Deze applicatie helpt bij het maken van rapportages voor het UWV.

Snippets bevatten feiten en observaties uit gesprekken,
recaps, documenten en notities.

Op basis van deze informatie moeten rapportagevragen
worden voorbereid.

RULES DOCUMENT

- Maak per rapportvraag een feitelijke basis
- Gebruik uitsluitend informatie uit cliëntinformatie
- Gebruik de questionId die bij de vraag hoort
- Leg kort uit hoe je tot de basis bent gekomen

USER PROMPT

Type rapport:

<RAPPORTTYPE>

Cliëntinformatie:

<CLIËNTKENNIS>

Rapportagevragen:

questionId: ...
vraag: ...

Output JSON:

questionId
basis
reasoning

---------------------------------------------------------------------
RAPPORT GENERATIE (GPT-5)
---------------------------------------------------------------------

Er wordt één GPT-5 call gedaan per rapport.

Input:

rapporttype
rapportvragen
feitelijke basis per vraag

Output:

rapportantwoord per vraag.

SYSTEM PROMPT

CONTEXT DOCUMENT

Je helpt bij het schrijven van UWV-rapportages
voor re-integratiecoaches.

RULES DOCUMENT

- Gebruik alleen informatie uit de feitelijke basis
- Schrijf professioneel en duidelijk

INPUT STRUCTUUR

rapporttype
rapportvragen
basis per vraag

---------------------------------------------------------------------
REGENERATE RAPPORTANTWOORDEN
---------------------------------------------------------------------

Regeneratie gebruikt alleen GPT-5.

Input:

- vraag
- huidige antwoord
- feitelijke basis
- gebruikersprompt

O3 wordt niet opnieuw gebruikt.

---------------------------------------------------------------------
CHAT
---------------------------------------------------------------------

De chat moet altijd JSON teruggeven.

STRUCTUUR

answer
waitingMessage
tool
memoryUpdate
toneUpdate

Er zijn twee chatcontexten:

client chat
input chat

=====================================================================

