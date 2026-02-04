# Azure migration plan (deprecated)

The single source of truth is now:

- `docs/azure-plan.md`

This file is kept only for historical context. Do not update this file. Use the master plan instead.

## Notes on early-stage cost control

- For early development and very low usage, a small “Burstable” Postgres compute size is acceptable.
- Expect to scale up when real usage grows, especially during concurrent transcription usage.

