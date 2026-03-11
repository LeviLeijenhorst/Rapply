# Screen Inventory: Report (`/report/:reportId`)

Primary source:
1. `webapp/src/screens/report/ReportScreen.tsx`
2. `webapp/src/utils/text/buildUntitledTitle.ts`
3. `webapp/src/types/client.ts`

## 1. Features

1. Quick report draft editor.
2. Editable report title.
3. Assign draft to selected client (or unassigned).
4. Dropdown with active clients and "Nieuwe coachee" action.
5. Continue action:
1. Creates a new written session.
2. Saves written report text.
3. Navigates to resulting session.

## 2. Main functions used by this screen

1. `buildUntitledSessionTitle`
2. `getCoacheeDisplayName`

Local app-data actions invoked:
1. `createSession`
2. `setWrittenReport`

## 3. Backend endpoints touched by this screen flow

1. `POST /sessions/create`
2. `POST /written-reports/set`
