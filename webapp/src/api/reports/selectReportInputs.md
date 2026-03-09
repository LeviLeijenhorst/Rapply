# selectReportInputs.ts

## Pseudocode

1. Receive all snippets and the selected session ids.
2. Convert the selected session ids into a set for fast lookup.
3. Loop through each snippet.
4. Read the snippet session id, falling back to `itemId`.
5. Read the snippet field, falling back to `type`.
6. Keep the snippet only when all conditions are true:
   - the snippet is approved
   - its session id is in the selected set
   - its field classifies as a report snippet
7. Return the filtered snippet list.
