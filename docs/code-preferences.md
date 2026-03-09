This document defines the coding principles and architectural preferences for the Coachscribe codebase.

All engineers, AI agents, and contributors should follow these guidelines.

---

# 1. General Philosophy

The codebase should be:

- consistent  
- explicit  
- modular  
- readable  
- predictable  

Avoid clever abstractions.  
Prefer clarity over complexity.

Every file and folder should have a clear purpose.

---

# 2. Naming Conventions

Names must clearly describe what something does or represents.

## Preferred naming style

Use descriptive names.

Examples:

generateSummary.ts  
extractSnippets.ts  
getReportStructure.ts  
transcribeAudio.ts  
approveSnippet.ts  
rejectSnippet.ts  

## Avoid vague names

Do NOT use:

helpers.ts  
logic.ts  
manager.ts  
handler.ts  
misc.ts  
common.ts  
stuff.ts  

Names must communicate intent.

---

# 3. Domain Terminology

Use the current product terminology consistently.

Correct terms:

- client  
- session  
- report  
- snippet  
- summary  
- transcript  

Avoid legacy terms:

- coachee  
- sessie  
- rapportage  

---

# 4. Folder Structure Philosophy

Folders represent **domains**, not technical layers.

Good examples:

ai/  
snippets/  
reports/  
transcription/  
chat/  
clients/  
sessions/  

Avoid meaningless generic folders:

helpers/  
managers/  
misc/  
temp/  
old/  

---

# 5. UI Structure

UI code should follow these rules.

## Screen-owned components

Components specific to a screen should live inside that screen folder.

Example:

screens/session/components/  
screens/client/components/  
screens/clients/components/  

## Shared UI components

Reusable UI components belong in:

ui/  
ui/components/  
ui/inputs/  
ui/modals/  
ui/layout/  

Avoid duplicating UI components.

Reuse existing primitives where possible.

---

# 6. File Responsibility

Each file should have **one clear responsibility**.

Bad:

sessionLogic.ts  

Good:

generateSessionSummary.ts  
extractSessionSnippets.ts  
approveSnippet.ts  

Do not combine unrelated functionality in a single file.

---

# 7. Modularity

Prefer smaller focused components.

Large screens should be split into:

- headers  
- cards  
- panels  
- tab systems  
- modals  
- sections  

But do not over-fragment into meaningless tiny files.

---

# 8. Reuse Rules

Reuse existing patterns whenever possible.

Examples:

- tab indicators  
- loading states  
- buttons  
- layout containers  
- form inputs  
- icons  

Do not create duplicate implementations of existing UI primitives.

---

# 9. Styling Preferences

Use the existing design system and theme tokens.

Avoid:

- hardcoded colors  
- random spacing values  
- inconsistent font sizes  

Prefer:

- theme tokens  
- shared spacing values  
- consistent typography  

---

# 10. Icons

Reuse icons from the icons directory.

Do not create new icons if an existing one already fits.

Prefer icon components instead of inline SVGs when possible.

---

# 11. Animation

Animations should follow the existing animation style.

Do not introduce completely new animation patterns.

Reuse the same animation behavior across screens where possible.

---

# 12. No Catch-All Utility Files

Avoid:

utils.ts  
helpers.ts  
common.ts  
misc.ts  

Utilities should be grouped by domain.

Example:

utils/date/  
utils/text/  

---

# 13. Consistency Rule

If a concept exists for one entity, it should exist consistently for similar entities.

Example:

If there is:

snippetTypes.ts  

Then other domains should follow similar patterns.

Avoid one-off patterns.

---

# 14. Do Not Force Architecture

If a feature does not clearly belong in an existing file, create a new file.

Do NOT force unrelated logic into an existing file just to satisfy structure.

---

# 15. No Dead Code

Remove:

- unused modules  
- legacy implementations  
- abandoned features  
- duplicate implementations  

---

# 16. Documentation

Architecture and product behavior should be documented.

The repository should contain:

docs/product-features.md  
docs/code-preferences.md  
docs/ai-pipeline.md  
docs/architecture.md  

These documents define the system's structure and behavior.