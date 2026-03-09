# Migration Project

This folder defines the target architecture for the Coachscribe migration project.

It exists to make the refactor explicit before large code edits begin.

Use these documents as the source of truth for:

- the target file tree
- naming rules
- migration rules
- prompt file rules
- CLI testing rules

This migration is intentionally aggressive.

Allowed changes:

- rename files
- move files
- merge files
- delete redundant files
- remove one-line re-export files

The goal is a codebase that is:

- feature-oriented
- easy to navigate
- easy to test
- prompt-visible
- aligned with product terminology

The architecture should communicate the product:

Turning conversations into structured knowledge and reports for reintegration coaching workflows.
