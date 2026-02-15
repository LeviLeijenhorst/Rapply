import { env } from "../env"
import { generateSummaryWithAzureOpenAi } from "./azureOpenAiSummary"
import { generateSummaryWithMistral } from "./mistralSummary"

type GenerateSummaryParams = {
  transcript: string
  template?: { name: string; sections: { title: string; description: string }[] }
}

// Intent: generateSummary
export async function generateSummary(params: GenerateSummaryParams): Promise<string> {
  const azureConfigured = !!String(env.azureOpenAiSummaryDeployment || "").trim()
  const mistralConfigured = !!env.mistralApiKey && !!env.mistralSummaryModel

  if (azureConfigured) {
    return await generateSummaryWithAzureOpenAi(params)
  }
  if (mistralConfigured) {
    return await generateSummaryWithMistral(params)
  }

  throw new Error("No summary provider is configured")
}
