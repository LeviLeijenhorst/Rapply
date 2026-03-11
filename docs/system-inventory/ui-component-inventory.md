# UI Component Inventory

## 1. Shared reusable UI components (`webapp/src/ui`)

Core building blocks:
1. `AppButton.tsx`
2. `Text.tsx`
3. `PopoverMenu.tsx`
4. `AnimatedOverlayModal.tsx`
5. `AnimatedMainContent.tsx`
6. `LoadingSpinner.tsx`
7. `BottomToast.tsx`
8. `EmptyPageMessage.tsx`

Navigation and shell:
1. `AppShell.tsx`
2. `Navbar.tsx`
3. `Sidebar.tsx`
4. `SidebarItem.tsx`
5. `BreadcrumbBar.tsx`

Entity display components:
1. `CoacheeCard.tsx`
2. `ArchivedCoacheeCard.tsx`
3. `CoacheeDropdown.tsx`
4. `CoacheeEditMenu.tsx`
5. `ConversationCard.tsx`

Inputs:
1. `inputs/TextInput.tsx`
2. `inputs/SearchField.tsx`
3. `inputs/ExpandableSearchField.tsx`
4. `DateInputWithCalendar.tsx`

Presentation helpers:
1. `FormattedText.tsx`
2. `InteractiveFormattedText.tsx`
3. `IconNumber.tsx`
4. `SubscriptionPlanPill.tsx`
5. `UsageIndicator.tsx`

## 2. Screen and modal component sets

### 2.1 Clients (`/clients`)
From `webapp/src/screens/clients/components`:
1. `ClientSearch.tsx`
2. `ClientsList.tsx`
3. `ClientStatusPill.tsx`
4. `ClientTableRow.tsx`

### 2.2 Client (`/client/:clientId`)
From `webapp/src/screens/client/components`:
1. `CoacheeTabs.tsx`
2. `ClientTabIndicator.tsx` (thin wrapper today)
3. `ClientInformation.tsx`
4. `ClientStatus.tsx`
5. `CoacheeSessionCard.tsx`

Common reused components on this surface:
1. `screens/session/components/ChatComposer.tsx`
2. `screens/session/components/ChatMessage.tsx`
3. `screens/session/components/ConfirmChatClearModal.tsx`
4. `screens/session/components/QuickQuestionsStart.tsx`
5. `ui/coachees/CoacheeUpsertModal.tsx`
6. `ui/sessies/ConfirmSessieDeleteModal.tsx`
7. `ui/notes/NoteEditModal.tsx`
8. `ui/notes/ConfirmNoteDeleteModal.tsx`

### 2.3 Session (`/session/:sessionId`)
From `webapp/src/screens/session/components` (core set):
1. `SessionHeader.tsx`
2. `SessionSummaryCard.tsx`
3. `SessionSnippetsCard.tsx`
4. `SnippetApprovalSection.tsx`
5. `SessionNotesCard.tsx`
6. `SessionTranscriptCard.tsx`
7. `SessionTabs.tsx`
8. `ReportPanel.tsx`
9. `AudioPlayerCard.tsx`
10. `TemplatePickerModal.tsx`

### 2.4 New Report (`/new-report`)
From `webapp/src/screens/newReport/components`:
1. `ReportOverview.tsx`

Also reuses session chat components and report export/editor support UI.

### 2.5 Report (`/report/:reportId`)
From `webapp/src/screens/report/components`:
1. `ReportEditor.tsx`

### 2.6 New Client (surface)
From `webapp/src/screens/newClient/components`:
1. `NewClientForm.tsx`

### 2.7 Organization (`/organization`)
From `webapp/src/screens/organization/components`:
1. `OrganizationColorPicker.tsx` (feature-flagged block in current screen)

### 2.8 New Input modal (surface)
From `webapp/src/screens/record/components`:
1. `MinimizedRecordingLayer.tsx`
2. `NewSessionAuxiliaryModals.tsx`
3. `SessionOptionRow.tsx`

From `webapp/src/screens/record/steps`:
1. `SelectSessionTypeStep.tsx`
2. `ConsentStep.tsx`
3. `RecordingStep.tsx`
4. `RecordedStep.tsx`
5. `UploadAudioStep.tsx`
6. `UploadDocumentStep.tsx`

## 3. Icon system

Icons are mostly componentized SVG wrappers in `webapp/src/icons`.

Notable icon groups:
1. `ClientPageSvgIcons.tsx` (client-tab and assistant-tab icons)
2. Dashboard and action icons (`ActiveClientsIcon`, `OpenActionItemsIcon`, `RecordSummaryIcon`, `ImportAudioIcon`, `ImportDocumentIcon`, `NewClientAddIcon`)
3. Generic action icons (`PlusIcon`, `TrashIcon`, `MoreOptionsIcon`, `FullScreenOpenIcon`, `FullScreenCloseIcon`)

## 4. Current standard component patterns

1. Tab indicators: `CoacheeTabs` + selected tab bridge styling.
2. Context menu: `PopoverMenu` anchored by row button coordinates.
3. Modal confirmations: dedicated confirm modal components per entity type.
4. Search: `SearchField` and `ExpandableSearchField` across list surfaces.
5. Assistant composer: single-line `ChatComposer` with send-disabled guards.
6. Multi-step workflows: step components used in `NewSessionModal`.
