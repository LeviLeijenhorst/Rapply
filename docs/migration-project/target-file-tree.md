# Target File Tree

This file defines the target file tree for the AI-related parts of the Coachscribe codebase.

It is based on the current repository and is intended to be implementable through migration, not greenfield replacement.

## Core rules

- Folders represent product domains.
- Feature orchestration lives in feature-domain files outside `screens/` and `hooks/`.
- `screens/` and UI hooks manage UI state and user interaction only.
- `api/` files are transport tools only.
- Prompts live in separate prompt files.
- One-line re-export files are not allowed.
- Product terminology must use English domain names.

## Webapp target

```text
webapp/
  src/
    api/
      callApi.ts
      transcription/
        getRealtimeTranscriptionRuntime.ts
        getRealtimeTranscriptionToken.ts
        chargeRealtimeTranscription.ts
        prepareBatchTranscription.ts
        startBatchTranscription.ts
        cancelBatchTranscription.ts
      summaries/
        generateSessionSummary.ts
      snippets/
        extractSessionSnippets.ts
        approveSnippet.ts
        rejectSnippet.ts
      reports/
        generateReport.ts
        exportReportToWord.ts
      chat/
        sendSessionChatMessage.ts
        sendClientChatMessage.ts
      sessions/
        createSession.ts
        updateSession.ts
        deleteSession.ts
      audio/
        createAudioBlob.ts
        getAudioBlob.ts

    ai/
      transcription/
        realtime/
          startRealtimeTranscription.ts
          stopRealtimeTranscription.ts
          transcribeRecordedSession.ts
        batch/
          transcribeAudioFile.ts
          transcribeDocument.ts
          transcribeWrittenRecap.ts
        normalizeTranscript.ts
        errors.ts
        types.ts
      summaries/
        generateSessionSummary.ts
        buildSessionSummaryPrompt.ts
        prompts/
          sessionSummaryPrompt.md
      snippets/
        extractSessionSnippets.ts
        buildSessionSnippetPrompt.ts
        buildClientKnowledge.ts
        approveSnippet.ts
        rejectSnippet.ts
        classifySnippetType.ts
        prompts/
          sessionSnippetPrompt.md
      reports/
        generateReport.ts
        buildReportPrompt.ts
        buildReportContext.ts
        selectReportInputs.ts
        mapReportFields.ts
        reportTemplateCatalog.ts
        prompts/
          generateReportPrompt.md
      chat/
        sendSessionChatMessage.ts
        sendClientChatMessage.ts
        buildSessionChatPrompt.ts
        buildClientChatPrompt.ts
        buildSessionChatContext.ts
        buildClientChatContext.ts
        prompts/
          sessionChatPrompt.md
          clientChatPrompt.md
      sessions/
        processSessionInput.ts

    audio/
      recordAudio.ts
      measureAudioDuration.ts
      downloadAudioStream.ts

    encryption/
      encryptAudio.ts
      decryptAudio.ts
      encryptText.ts
      decryptText.ts

    storage/
      appData/
      files/
        pendingSessionAudioStore.ts

    screens/
      record/
      session/
      client/
      report/

    hooks/
      useAudioRecorder.ts
      useWaveformBars.ts
      useRecordScreenState.ts
      useSessionScreenState.ts

  devtools/
    ai/
      runSessionSummary.ts
      runSessionSnippets.ts
      runGenerateReport.ts
      runSessionChat.ts
      runClientChat.ts
      fixtures/
        summaries/
        snippets/
        reports/
        chat/
```

## Server target

```text
server/
  src/
    transcription/
      realtime/
        getRealtimeTranscriptionRuntime.ts
        issueRealtimeTranscriptionToken.ts
        chargeRealtimeTranscription.ts
      batch/
        prepareBatchTranscription.ts
        startBatchTranscription.ts
        cancelBatchTranscription.ts
        runBatchTranscription.ts
      providers/
        transcribeWithAzureSpeech.ts
        transcribeWithSpeechmatics.ts
      storage/
        createTranscriptionUpload.ts
        readTranscriptionUpload.ts
        deleteTranscriptionUpload.ts
      billing/
        chargeTranscription.ts
        refundTranscription.ts
      config/
        readTranscriptionConfig.ts
        writeTranscriptionConfig.ts
      routes/
        registerTranscriptionRoutes.ts

    summaries/
      generateSessionSummary.ts
      buildSessionSummaryPrompt.ts
      prompts/
        sessionSummaryPrompt.md
      routes/
        registerSummaryRoutes.ts

    snippets/
      extractSessionSnippets.ts
      classifySnippet.ts
      approveSnippet.ts
      rejectSnippet.ts
      buildSnippetPrompt.ts
      prompts/
        sessionSnippetPrompt.md
      routes/
        registerSnippetRoutes.ts

    reports/
      generateReport.ts
      buildReportContext.ts
      mapReportFields.ts
      exportReportToWord.ts
      buildReportPrompt.ts
      prompts/
        generateReportPrompt.md
      routes/
        registerReportRoutes.ts

    chat/
      sendSessionChatMessage.ts
      sendClientChatMessage.ts
      buildSessionChatPrompt.ts
      buildClientChatPrompt.ts
      prompts/
        sessionChatPrompt.md
        clientChatPrompt.md
      routes/
        registerChatRoutes.ts

    sessions/
      createSession.ts
      updateSession.ts
      deleteSession.ts
      routes/
        registerSessionRoutes.ts
```

## Pseudocode file rule

Eventually, important code files should have a sibling `.md` pseudocode file.

Example:

```text
generateSessionSummary.ts
generateSessionSummary.md
```

The first feature where this pattern will be tested is transcription.
