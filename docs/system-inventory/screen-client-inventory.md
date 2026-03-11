# Screen Inventory: Client (`/client/:clientId`)

Primary source:
1. `webapp/src/screens/client/ClientScreen.tsx`
2. `webapp/src/screens/client/workflows/useClientDetailChatFlow.ts`
3. `webapp/src/screens/client/workflows/clientDetailActions.ts`
4. `webapp/src/screens/client/workflows/clientDetailData.ts`
5. `webapp/src/screens/client/components/CoacheeTabs.tsx`

## 1. Features

### 1.1 Client header and profile actions
1. Show client identity, status badge, and key metadata.
2. Open edit modal for client + trajectory details.
3. Create new input for active trajectory.
4. Create new report for active trajectory.
5. Disable create-input when `isCreateSessionDisabled`.

### 1.2 Tabbed left panel
Tabs:
1. `Sessies`
2. `Notities`
3. `Rapportages`
4. `Documenten` (currently placeholder state)

Capabilities:
1. Search list entries with tab-aware placeholder text.
2. Open session rows into session detail.
3. Open note rows into note edit modal.
4. Add item by active tab (session, note, report).
5. Row menu delete for sessions and notes with confirmation modals.

### 1.3 Assistant panel
Tabs:
1. `AI-chat`
2. `Status`

AI chat:
1. Persistent per-client conversation history.
2. Quick-question starter prompts.
3. Send chat messages to assistant.
4. Clear conversation with confirmation modal.
5. Fullscreen assistant mode.
6. Minutes guard with subscription CTA when blocked.

Status:
1. Build status context from sessions, approved snippets, and reports.
2. Generate Dutch status summary through AI.
3. Fall back to deterministic local summary on failure.

### 1.4 Note management
1. Create note.
2. Auto-create "Notities" session when needed.
3. Edit note.
4. Delete note.

## 2. Main functions used by this screen

### 2.1 Screen/workflow functions
1. `saveCoacheeProfileChanges`
2. `saveNewCoacheeNote`
3. `getClientTrajectories`
4. `getActiveTrajectory`
5. `getClientSessionListItems`
6. `formatTrajectoryDurationLabel`
7. `useClientDetailChatFlow`

### 2.2 Local app-data actions invoked
1. `createSession`
2. `deleteSession`
3. `createNote`
4. `updateNote`
5. `deleteNote`
6. `updateCoachee`
7. `createTrajectory`
8. `updateTrajectory`

### 2.3 Chat and status path
1. `handleSendChatMessage` -> `sendChatMessage` (local flow)
2. `sendClientChatMessage` (`sendClientChatPromptMessage.ts`)
3. `sendClientChatMessage` transport (`sendClientChatMessage.ts`)
4. `buildClientChatPrompt`
5. `buildCoacheeStructuredSystemMessages`

## 3. Backend endpoints touched by this screen flow

1. `POST /chat`
2. `POST /billing/status`
3. `POST /sessions/create`
4. `POST /sessions/update`
5. `POST /sessions/delete`
6. `POST /notes/create`
7. `POST /notes/update`
8. `POST /notes/delete`
9. `POST /clients/create`
10. `POST /clients/update`
11. `POST /clients/delete`
12. `POST /trajectories/create`
13. `POST /trajectories/update`
14. `POST /trajectories/delete`
15. `POST /snippets/create`
16. `POST /snippets/update`
17. `POST /snippets/delete`
18. `POST /written-reports/set` (legacy report save alias)
