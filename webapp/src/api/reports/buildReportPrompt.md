# buildReportPrompt.ts

## Pseudocode

1. Receive the full report generation input.
2. Build the report context string from the template name, approved snippets, and client knowledge.
3. Load the shared report instructions from the prompt file.
4. Assemble one tagged prompt block with:
   - an opening tag
   - the shared instructions
   - the template name
   - the generated report context
   - a closing tag
5. Remove empty lines created by empty values.
6. Join the lines into one final prompt string and trim outer whitespace.
