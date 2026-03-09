# startRealtimeTranscription

## Purpose

Start browser-side realtime transcription for a recording session.

## Pipeline

1. Read realtime runtime configuration from API.
2. Request a provider token.
3. Start provider-specific realtime stream.
4. Emit final transcript segments through callback.
5. Return a session object with `stop()`.
