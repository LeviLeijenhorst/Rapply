import type { Express } from "express"
import { registerE2eeMaterialRoutes } from "./registerEncryptionMaterialRoutes"
import { registerE2eeObjectKeyRoutes } from "./registerEncryptionObjectKeyRoutes"
import { registerE2eeSetupRoutes } from "./registerEncryptionSetupRoutes"
import type { RegisterE2eeRoutesParams } from "./types"

// Registers E2EE key-material and object-key lifecycle endpoints.
export function registerEncryptionRoutes(app: Express, params: RegisterE2eeRoutesParams): void {
  registerE2eeMaterialRoutes(app, params)
  registerE2eeSetupRoutes(app, params)
  registerE2eeObjectKeyRoutes(app)
}
