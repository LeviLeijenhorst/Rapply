# Screen Inventory: Session (`/session/:sessionId`)

Primary source:
1. `webapp/src/screens/session/SessionScreen.tsx`
2. `webapp/src/screens/session/viewModels/sessionViewModel.ts`
3. `webapp/src/screens/session/selectors/sessionNoteSelectors.ts`
4. `webapp/src/api/snippets/snippetGenerationApi.ts`

## 1. Features

1. Show session header.
2. Show session summary card (summary + structured summary + transcript status).
3. Show snippet approval section.
4. Regenerate snippets from transcript when needed.
5. Approve/reject snippets.
6. Show session notes card with create-note capability.
7. Empty page message when session no longer exists.

## 2. Main functions used by this screen

1. `sessionViewModel`
2. `selectSessionNotes`
3. `extractSnippetsForItem` (snippet regeneration)

Local app-data actions invoked:
1. `createNote`
2. `updateSession`
3. `updateSnippet`

## 3. Backend endpoints touched by this screen flow

1. `POST /ai/snippet-extract`
2. `POST /snippets/update`
3. `POST /notes/create`
4. `POST /sessions/update`

Note:
1. `extractSnippetsForItem` triggers snippet creation server-side via AI extraction route.
