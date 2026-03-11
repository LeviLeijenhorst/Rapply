# Documentation Maintenance Method

## 1. Goal

Keep this inventory synchronized with code during migration so architecture decisions are made on verified behavior.

## 2. Update triggers

Update inventory docs whenever one of these changes:
1. New route/screen in `webapp/src/app/router`.
2. New screen-level user flow in `webapp/src/screens`.
3. Added/removed shared UI component in `webapp/src/ui`.
4. Added/changed API call in `webapp/src/api`.
5. Added backend route in `server/src/**/routes`.
6. New SQL migration in `server/sql`.

## 3. Required update checklist per feature

For each new or changed feature:
1. Add or update screen entry in `feature-inventory.md`.
2. Add or update the corresponding per-surface inventory file (`screen-*-inventory.md` or `modal-*-inventory.md`) with:
1. Feature changes.
2. Function/workflow changes.
3. Endpoint changes.
3. Add or update reusable component entry in `ui-component-inventory.md`.
4. If data model changed, update `database-schema-inventory.md`.
5. Add direct source paths used for verification in the changed section.

## 4. Verification standard

1. Mark items as "verified" only when directly present in code.
2. Mark uncertain items as "inferred" and list the source that implied it.
3. Do not rely on UI appearance alone for schema or API behavior.
4. Prefer route files and SQL migrations over assumptions.

## 5. Recommended monthly cleanup

1. Remove legacy endpoint aliases once no callers remain.
2. Remove stale components no longer imported.
3. Compare SQL table inventory with backend `store.ts` modules for drift.
4. Confirm docs still match route kinds and URL paths.
