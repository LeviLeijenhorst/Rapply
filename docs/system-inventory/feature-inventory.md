# Product Feature Inventory

This document is intentionally high-level. Detailed behavior is documented in per-surface inventory files.

## 1. Routed product surfaces (verified)

From `webapp/src/app/router/routes.ts`, `buildPath.ts`, `AppRouteView.tsx`:

1. `clients` -> `/clients` -> `ClientsScreen`
2. `client` -> `/client/:clientId` -> `ClientScreen`
3. `session` -> `/session/:sessionId` -> `SessionScreen`
4. `new-report` -> `/new-report` -> `NewReportScreen`
5. `report` -> `/report/:reportId` -> `ReportScreen`
6. `organization` -> `/organization` -> `OrganizationScreen`

## 2. Additional major surfaces (The non modals in this list should also get a route)

1. Dashboard
2. New Client
3. New Input modal

## 3. Detailed inventory files

1. `screen-dashboard-inventory.md`
2. `screen-clients-inventory.md`
3. `screen-client-inventory.md`
4. `screen-session-inventory.md`
5. `screen-new-client-inventory.md`
6. `screen-new-report-inventory.md`
7. `screen-report-inventory.md`
8. `screen-organization-inventory.md`
9. `modal-new-input-inventory.md`
