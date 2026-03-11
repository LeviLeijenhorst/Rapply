# Screen Inventory: Organization (`/organization`)

Primary source:
1. `webapp/src/screens/organization/OrganizationScreen.tsx`
2. `webapp/src/screens/organization/viewModels/inputFormatters.ts`

## 1. Features

1. Manage organization and contact profile fields.
2. Manage postal address fields.
3. Manage visit address fields.
4. Input normalization on blur/change:
1. Name capitalization.
2. Email lowercasing.
3. Phone normalization.
4. Postal code normalization.
5. House number normalization.
5. Persist settings through app-data layer.

Current feature-flagged/disabled blocks in UI (`{false ? ... : null}`):
1. Brand color picker and autosave.
2. Logo upload/drag-drop and remove flow.
3. PDF preview block.

## 2. Main functions used by this screen

1. `capitalizeFirstLetter`
2. `normalizePhoneValue`
3. `normalizeEmailValue`
4. `normalizeHouseNumberValue`
5. `normalizePostalCodeValue`
6. `splitPostalCodeCity`
7. `splitStreetAndHouseNumber`
8. `combineStreetAndHouseNumber`

Local app-data actions invoked:
1. `updatePracticeSettings`

## 3. Backend endpoints touched by this screen flow

1. `POST /practice-settings/update`
