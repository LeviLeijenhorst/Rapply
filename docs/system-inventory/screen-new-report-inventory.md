# Screen Inventory: New Report (`/new-report`)

Primary source:
1. `webapp/src/screens/newReport/NewReportScreen.tsx`
2. `webapp/src/screens/newReport/workflows/newReportWorkflows.ts`
3. `webapp/src/screens/newReport/selectors/newReportSelectors.ts`
4. `webapp/src/screens/newReport/viewModels/newReportViewModel.ts`

## 1. Features

1. Report setup mode:
1. Select client.
2. Select trajectory.
3. Select source items by tabs (`sessies`, `rapportages`, `notities`).
4. Select report template.
5. Generate report.
2. Report edit mode:
1. Structured field groups rendered from selected template.
2. Completion status per group.
3. Manual editing of generated content.
4. Persist generated/edited report to session report storage.
3. AI assistant panel:
1. Ask follow-up questions about current report context.
2. Receive AI answers in chat stream.
4. Export:
1. Export to Word document for UWV templates.

## 2. Main functions used by this screen

Workflow functions:
1. `buildReportGenerationSourceText`
2. `generateReportText`
3. `exportReportWord`
4. `buildAssistantReportContext`
5. `sendReportAssistantMessage`

Selector/viewmodel:
1. `selectReportCandidateSessions`
2. `newReportViewModel`

Local app-data actions invoked:
1. `createSession`
2. `updateSession`
3. `setWrittenReport`

## 3. Backend endpoints touched by this screen flow

1. `POST /summary/generate` (report generation via summary engine)
2. `POST /chat` (assistant panel messages)
3. `POST /sessions/create`
4. `POST /sessions/update`
5. `POST /written-reports/set`

## 4. Notes

1. `exportReportToWord` is local export logic and does not call backend routes.
2. This screen is currently one of the largest logic surfaces and should be further split during migration cleanup.
