# Screen Inventory: New Client (create client surface)

Primary source:
1. `webapp/src/screens/newClient/NewClientScreen.tsx`
2. `webapp/src/screens/newClient/workflows/clientsScreenFunctionality.ts`
3. `webapp/src/screens/newClient/viewModels/newClientViewModel.ts`
4. `webapp/src/screens/newClient/components/NewClientForm.tsx`

## 1. Features

1. Client creation form with profile and trajectory fields.
2. Privacy/AVG information banner.
3. Validation gate for save action.
4. Save flow creates:
1. Client/coachee entity.
2. Initial trajectory (`Werkfit maken`) for that client.
5. On successful save, route callback receives created client id.

## 2. Main functions used by this screen

1. `createInitialNewClientValues`
2. `isNewClientFormValid`
3. `sanitizeNewClientValues`
4. `saveCoacheeFromUpsert`
5. `getNewClientTrajectoryLabel`

Local app-data actions invoked:
1. `createCoachee`
2. `createTrajectory`
3. `updateCoachee` (workflow supports edit mode too)
4. `updateTrajectory` (workflow supports edit mode too)

## 3. Backend endpoints touched by this screen flow

Create flow:
1. `POST /clients/create`
2. `POST /trajectories/create`
