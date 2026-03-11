import { ensureUsersSchemaCompatibility } from "./users"

type RuntimeSchemaWarmupStep = {
  name: string
  run: () => Promise<void>
}

function buildRuntimeSchemaWarmupSteps(): RuntimeSchemaWarmupStep[] {
  return [
    { name: "users", run: ensureUsersSchemaCompatibility },
  ]
}

let prewarmRuntimeSchemaPromise: Promise<void> | null = null

// Runs compatibility DDL once during startup to keep request handlers predictable.
export async function prewarmRuntimeSchemaCompatibility(): Promise<void> {
  if (!prewarmRuntimeSchemaPromise) {
    prewarmRuntimeSchemaPromise = (async () => {
      const steps = buildRuntimeSchemaWarmupSteps()
      for (const step of steps) {
        try {
          await step.run()
        } catch (error: any) {
          const message = String(error?.message || error || "")
          console.warn("[db] runtime schema warmup step failed", { step: step.name, message })
          throw error
        }
      }
      console.log("[db] runtime schema warmup complete", { steps: steps.map((step) => step.name) })
    })().catch((error) => {
      prewarmRuntimeSchemaPromise = null
      throw error
    })
  }
  await prewarmRuntimeSchemaPromise
}
