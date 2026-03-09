# buildReportContext.ts

## Pseudocode

1. Receive the template name, the snippet list, and the client knowledge text.
2. Keep only snippets whose status is `approved`.
3. Read each snippet field or fallback type.
4. Classify that field and keep only snippets marked as `report`.
5. Convert each kept snippet into one bullet line with its text.
6. Join all bullet lines into one block.
7. Return a plain-text context string with:
   - the template name
   - the approved report snippets block
   - the client knowledge block
