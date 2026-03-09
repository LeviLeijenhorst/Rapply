import { claimNextPipedriveImportJob } from "./claimNextPipedriveImportJob"
import { runPipedriveImportJob } from "./runPipedriveImportJob"

let workerStarted = false
let workerRunning = false

async function runOnce(): Promise<void> {
  if (workerRunning) return
  workerRunning = true
  try {
    const job = await claimNextPipedriveImportJob()
    if (!job) return
    await runPipedriveImportJob(job)
  } finally {
    workerRunning = false
  }
}

export function startPipedriveImportWorker(): void {
  if (workerStarted) return
  workerStarted = true
  setInterval(() => {
    void runOnce()
  }, 5000)
}
