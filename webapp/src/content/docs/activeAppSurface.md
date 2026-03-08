# Active App Surface

This document lists the currently active navigation and workflow surface used by the app runtime.

## Active Sidebar Routes

Defined in `webapp/src/components/Sidebar.tsx` and handled in `webapp/src/components/AppShell.tsx`.

- `coachees` (`/clienten`): primary dossier entry point.
- `mijnPraktijk` (`/mijn-praktijk`): organization/practice settings.
- `archief` (`/archief`): archive overlay surface.
- `admin` (`/admin`): admin revenue screen (admin users only).
- `adminContact` (`/admin-contact`): admin contact submissions (admin users only).
- `adminWachtlijst` (`/admin-wachtlijst`): admin waitlist (admin users only).

Future-facing routes intentionally disabled in current product surface:

- `activities` (`/activiteiten`) remains in the internal route model, but is disabled in navigation.
- `templates` (`/templates`) remains in the internal route model, but is disabled in navigation.
- Direct access to disabled feature routes is normalized to `/clienten`.

## Core Workflow Screens

Main runtime composition lives in `webapp/src/components/AppShell.tsx`.

- `CoacheesScreen`: client list and entry point.
- `CoacheeDetailScreen`: client dossier view (sessions/reports/notes + assistant/status tabs).
- `TrajectoryDetailScreen`: trajectory-specific item/report management.
- `SessieDetailScreen`: item detail for transcript/summary/notes/report workflows.
- `NewRapportageScreen`: structured reporting flow for trajectory/client context.
- `RapportagesScreen`: report listing surface used from flow transitions.
- `MijnPraktijkScreen`: organization metadata and branding settings.

Additional active overlays/modals include archive, settings/account, feedback/contact, and new-session flows.

## Session Artifact Semantics

`Session.kind` currently represents artifact type within one shared session container.

- `recording`: recorded conversation input artifact.
- `upload`: uploaded audio input artifact.
- `written`: written report artifact.
- `notes`: notes container artifact.
- `intake`: intake-form artifact.

Helper functions for explicit checks are centralized in `webapp/src/utils/sessionArtifacts.ts`.

## Feature Flags (Demo-Disabled)

Defined in `webapp/src/config/features.ts`.

- `features.activities = false`: activity tabs/panels remain hidden.
- `features.templates = false`: templates/dashboard feature area remains hidden.
- `features.documentenTab = false`: documenten tab remains hidden in rapportage setup.

These flags replace commented-out UI blocks so the active product surface is explicit.
