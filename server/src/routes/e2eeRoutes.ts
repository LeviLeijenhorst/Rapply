import type { Express } from "express"
import { registerE2eeMaterialRoutes } from "./e2ee/materialRoutes"
import { registerE2eeObjectKeyRoutes } from "./e2ee/objectKeyRoutes"
import { registerE2eeSetupRoutes } from "./e2ee/setupRoutes"
import type { RegisterE2eeRoutesParams } from "./e2ee/types"

// Registers E2EE key-material and object-key lifecycle endpoints.
export function registerE2eeRoutes(app: Express, params: RegisterE2eeRoutesParams): void {
  registerE2eeMaterialRoutes(app, params)
  registerE2eeSetupRoutes(app, params)
  registerE2eeObjectKeyRoutes(app)
}
