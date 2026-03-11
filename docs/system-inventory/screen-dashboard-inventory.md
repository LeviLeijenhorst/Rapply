# Screen Inventory: Dashboard (main workspace surface)

Primary source:
1. `webapp/src/screens/dashboard/DashboardScreen.tsx`

## 1. Features

1. Welcome/hero section with primary action for creating a new client.
2. Stat cards:
1. Active clients
2. Sessions this week
3. Reports this week
4. Open action items
3. Continue list ("Verder waar je was gebleven") based on recent session activity.
4. Quick input actions:
1. Record session
2. Record summary
3. Record video call
4. Import audio
5. Import document
5. Open action items table:
1. Combines pending report items and pending snippet items.
2. Search/filter open action rows.
3. Open relevant destination (reports page or session page).

## 2. Main functions used by this screen

1. `pickProfilePhotoUri`
2. `formatContinueSubtitle`
3. `normalizeSessionLikeId`
4. `toRelativeDateLabel`
5. `toDateLabel`
6. `scrollToOpenActions`

State/data dependencies:
1. Reads coachees, sessions, snippets, and written reports from `useLocalAppData().data`.
2. No direct write mutation in this screen.

## 3. Backend endpoints touched by this screen flow

Direct calls in this screen:
1. None.

Indirect dependency:
1. Data source is app-data hydration via `readAppData` (`POST /app-data`) in `LocalAppDataProvider`.
