# Feature Plan - Coachee Portal, Assignments en Reflectiechat

## 1. Kritische opmerkingen vooraf

1. **Grootste architectuurbeslissing is identity van coachee**
- Huidige auth is volledig Entra-user gebaseerd en modelleert alleen coaches als `users`.
- Voor een coachee-login moet er een expliciete keuze komen tussen:
  - eigen `coachee_users` identity-model (aanbevolen voor product-fit), of
  - ook coachees als volwaardige `users` in Entra (hogere operationele complexiteit en tenant-koppeling).

2. **E2EE is de grootste functionele constraint**
- Data is nu client-side encrypted per coach-account met object keys op `user_id` (coach).
- Een coachee kan zonder aanvullende key-sharing architectuur geen transcript/samenvatting/audio lezen, ook niet als backend autoriseert.
- Dus: coachee-view + E2EE vereist een expliciet model voor "shareable encrypted payloads" of een "coachee-safe projection".

3. **Datamodel is coach-gecentreerd; coachee-content moet expliciet gescheiden worden**
- `coachee_sessions.summary` is nu 1 veld. Er is nog geen scheiding tussen interne coachsamenvatting en coachee-samenvatting.
- Idem voor transcript/audio sharing: er zijn nog geen share-flags of policy-versies per sessie.

4. **Assignments bestaan functioneel nog niet**
- Er zijn template-features voor samenvattingen, maar geen assignment-entiteiten, runs, stappen, antwoorden of statusmodel.
- Dit is een nieuwe productmodule, geen kleine uitbreiding.

5. **Chatveiligheid moet productmatig worden afgedwongen (niet alleen promptmatig)**
- "Geen medische/therapeutische claims" moet via systeemprompt + response policy + logging/monitoring + copy in UI.
- Alleen promptinstructies zijn onvoldoende voor consistent gedrag.

6. **Autorisatiegrenzen moeten scherper dan nu**
- Nu haalt `/app-data` alles in 1 payload voor de coach op basis van `user_id`.
- Coachee-endpoints moeten per-request beperken tot exact ��n gekoppelde coachee en alleen gedeelde velden.

7. **Bestaande code bevat al bruikbare bouwblokken**
- Coach-side coachee detail + quick questions bestaat al en geeft een goede basis voor metriek, lijst-UI en chatpatroon.

## 2. Begripsuitwerking (wat ik uit jouw featurebeschrijving lees)

### 2.1 Coachee login
- Coach nodigt coachee uit door op het coachee-scherm een code te genereren, deze te kopiëren en deze naar een coachee te sturen.
- Coachee hoeft niet in te loggen.
- Relatie: 1 coachee-account hoort bij exact 1 coach; coach heeft N coachees.

### 2.2 Coachee sidebar
- Opdrachten
- Chat 
- Sessies

### 2.3 Coachee sessie-view
- Eigenlijk hetzelfde als de sessiedetailscreen maar dan:
  - Met de coachee-samenvatting
  - Zonder de notities
  - Zonder opties die logischerwijs alleen bij de coach horen

### 2.4 AI chat voor coachee
- Context uit coachee-samenvattingen + ingevulde assignments.

### 2.5 Assignments
- Coach wijst opdracht toe aan coachee.
- Staptypes: open vraag, meerkeuze, schaal, tekst
- Coachee kan stap-voor-stap invullen en tussentijds opslaan.
- Coach ziet status (hoeveel stappen zijn er gedaan) + antwoorden.
- Coachee en coach zien opdrachten van vandaag. Boven opdrachten-sectie
is een kalender zichtbaar. Hier kan naar een andere dag worden genavigeerd.

### 2.6 Assignment templates (coach)
- In een sidebar menu "Opdrachten"
- Templates zijn herbruikbaar over meerdere coachees.
- v1 krijgt seeded standaardtemplates.

### 2.7 Coach coachee-detail uitbreiding
- opdrachten voor vandaag (kalender erboven)

### 2.8 Branding per coach
- Bestaande practice settings gebruiken voor coachee-ervaring (naam + primaire kleur).

## 3. Plan van aanpak

## Fase 0 - Beslissingen en contracten (must-have vooraf)
1. Identity-keuze vastleggen voor coachee auth (aanbevolen: eigen invite + passwordless link/code of email+password buiten Entra).
2. E2EE-scope voor coacheeportaal kiezen:
- Optie A: v1 alleen server-managed custody accounts toestaan voor coachee-portal.
- Optie B: nieuw key-sharing model bouwen (zwaarder, maar toekomstvast).
3. Definitieve share-policy bepalen per sessieveld:
- `share_summary_with_coachee`
- `share_transcript_with_coachee`
- `share_audio_with_coachee`
4. Juridische copy en guardrails voor reflectiechat vastleggen.

## Fase 1 - Datamodel & migraties
1. Nieuwe tabellen toevoegen:
- `coachee_accounts` (identity, status, invite/activation metadata, coach binding).
- `coachee_invites` (token hash, expiry, accepted_at, revoked_at).
- `coachee_session_views` of extra kolommen op `coachee_sessions` voor shareable velden.
- `assignment_templates` + `assignment_template_steps`.
- `assignments` + `assignment_steps` (snapshot bij toewijzing).
- `assignment_responses` + `assignment_progress`.
- `coachee_chat_threads` + `coachee_chat_messages` (of alleen audit + ephemeral, keuze nodig).
2. Indexen en unieke constraints inbouwen voor ownership/isolatie.
3. Seed-script voor standaard assignment templates toevoegen.

## Fase 2 - Backend auth en autorisatie
1. Nieuwe coachee-auth routes:
- invite accept/start
- login
- token refresh/logout
- `coachee/me`
2. Nieuwe auth guard naast bestaande `requireAuthenticatedUser`.
3. Coachee-read endpoints (projection only):
- dashboard
- sessions list/detail (alleen gedeelde velden)
- assignments list/detail/progress/save/submit
- reflectiechat create/message/history (als history in scope is)
4. Coach-endpoints uitbreiden:
- uitnodigen/heruitnodigen/intrekken coachee account
- share flags per sessie beheren
- assignments toewijzen en monitoren
5. Strikte server-side checks op coach_id/coachee_id-relatie bij elke query.

## Fase 3 - Frontend coach-app uitbreidingen
1. Coachee detail scherm uitbreiden met metrics en assignments-tab.
2. Sessie-detail: expliciete "delen met coachee" toggles voor summary/transcript/audio.
3. Templates tab uitbreiden met assignment-template CRUD/duplicate.
4. Assignment toewijzingsflow toevoegen vanuit coachee context.

## Fase 4 - Nieuw coachee-webportaal
1. Aparte app-shell/route-space (kan in huidige `webapp` of aparte package).
2. Login + invite-activatie flow.
3. Dashboard met branding, sessies, open assignments.
4. Sessie detail page met alleen gedeelde content.
5. Assignment runner (step-by-step + autosave + submit).
6. Reflectiechat UI met duidelijke safety positioning.

## Fase 5 - AI reflectiechat veiligheid
1. Dedicated system prompt voor coachee-reflectie (geen diagnose/therapieclaims).
2. Input-contextbuilder uit alleen toegestane bronnen.
3. Output filters/heuristieken voor risicovolle claims + fallback response.
4. Productcopy + disclaimer in chat UI.
5. Logging voor quality review (privacy-by-design).

## Fase 6 - Testen, rollout, migratie
1. Unit/integration tests voor authz boundaries (meest kritisch).
2. E2E tests:
- coach invite -> coachee activate/login
- gedeelde/niet-gedeelde sessievelden
- assignment lifecycle
- reflectiechat contextgrenzen
3. Backfill/migratieplan voor bestaande sessies (default: niets gedeeld tenzij expliciet aangezet).
4. Gefaseerde release met feature flags:
- eerst intern/alpha
- daarna beperkte coachgroep
- daarna algemene uitrol.

## 4. Aanbevolen scope voor v1 (risicoarm)
1. Coachee login + dashboard.
2. Sessie-view met alleen coachee-samenvatting (nog geen transcript/audio delen).
3. Assignment templates + assignment invullen.
4. Reflectiechat op basis van coachee-samenvattingen + assignment-antwoorden.
5. Transcript/audio sharing pas in v1.1 na E2EE- en autorisatieverificatie.

## 5. Concrete risico's die ik nu al zie
1. Zonder expliciete scheiding van coach-vs-coachee samenvatting ontstaat datalekrisico.
2. Zonder heldere E2EE-keuze loop je vast halverwege implementatie.
3. Full payload hergebruik (`/app-data`) voor coachee zou overexposure geven.
4. Assignment "template" verwarren met huidige summary templates kan productmatig verwarrend worden; duidelijke naamgeving nodig in UI en DB.
