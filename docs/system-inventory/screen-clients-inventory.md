# Screen Inventory: Clients (`/clients`)

Primary source:
1. `webapp/src/screens/clients/ClientsScreen.tsx`
2. `webapp/src/screens/clients/selectors/clientListSelectors.ts`
3. `webapp/src/screens/clients/viewModels/clientsViewModel.ts`
4. `webapp/src/screens/clients/components/ClientTableRow.tsx`

## 1. Features

1. Search clients by name.
2. Filter clients by status:
1. All
2. Active
3. Closed
3. Paginated client table.
4. Client table fields:
1. Client
2. Trajectories
3. Sessions
4. Reports
5. Status
6. Last session
5. Open selected client detail.
6. Open new client page flow.
7. Empty-state display for no results.

## 2. Main functions used by this screen

1. `selectClientListItems`
2. `filterClientListItems`
3. `toRelativeDateLabel` (selector helper)
4. `pickProfilePhotoUri` (selector helper)

Local app-data usage:
1. Reads from `useLocalAppData().data`.
2. No direct create/update/delete mutation from this screen.

## 3. Backend endpoints touched by this screen flow

Direct calls in this screen:
1. None.

Indirect dependency:
1. Data source is app data loaded through `readAppData` (`POST /app-data`) in `LocalAppDataProvider`.
