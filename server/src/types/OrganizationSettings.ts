export type OrganizationSettings = {
  practiceName: string
  website: string
  visitAddress: string
  postalAddress: string
  postalCodeCity: string
  visitPostalCodeCity?: string
  contactName?: string
  contactRole?: string
  contactPhone?: string
  contactEmail?: string
  tintColor: string
  logoDataUrl: string | null
  updatedAtUnixMs: number
}
