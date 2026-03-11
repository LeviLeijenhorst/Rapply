# System Inventory Documentation

This folder is the living non-code documentation baseline for the migrated product.

Current objective:
- Document product features.
- Document features and functions per screen.
- Document reusable UI components.
- Document database schema.

Current status:
- High-level product feature inventory is documented.
- Per-screen inventories exist for all routed screens.
- Dashboard, New Client, and New Input modal inventories are documented.
- Client page is documented in the most detail.
- Shared UI inventory is documented.
- SQL schema inventory is documented from `server/sql/*.sql`.

Source-of-truth files used:
- Frontend routes and screens in `webapp/src/app/router` and `webapp/src/screens`.
- Shared UI components in `webapp/src/ui`.
- Backend routes in `server/src/**/routes`.
- Database migrations in `server/sql`.

Main docs in this folder:
1. `feature-inventory.md` (high-level product feature list only)
2. `screen-dashboard-inventory.md`
3. `screen-clients-inventory.md`
4. `screen-client-inventory.md`
5. `screen-session-inventory.md`
6. `screen-new-client-inventory.md`
7. `screen-new-report-inventory.md`
8. `screen-report-inventory.md`
9. `screen-organization-inventory.md`
10. `modal-new-input-inventory.md`
11. `ui-component-inventory.md`
12. `database-schema-inventory.md`
13. `documentation-maintenance.md`

Next expansion steps:
1. Increase depth for `Session` and `New Report` inventories to match client-page detail level.
2. Add sequence diagrams for critical flows (new input, snippet extraction, report generation).
3. Add ownership fields (team owner + test coverage status) per feature.
