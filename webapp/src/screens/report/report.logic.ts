import type { ReportScreenProps } from '@/screens/report/report.types'

export {
  buildAssistantReportContext,
  buildFallbackReportFromTemplate,
  buildFieldsFromTemplate,
  buildGeneratedFieldMap,
  buildReportGenerationSourceText,
  buildReportTextFromFields,
  capitalizeFirstLetter,
  extractBsn,
  exportReportWord,
  formatDateLabel,
  formatOnBlur,
  generateReportText,
  getGroupTitle,
  isActivityHoursDistribution,
  isMainActivityMultichoice,
  isSpecialistExpertiseDetail,
  isSpecialistTariffDetail,
  isSpecialistTariffQuestion,
  isWerkfitTemplate,
  normalizeFieldValueForStorage,
  normalizeMatchValue,
  normalizeYesNo,
  parsePostalCodeAndCity,
  parseStreetAndHouseNumber,
  placeholderForField,
  sanitizeCurrencyInput,
  sanitizeOnChange,
  sanitizePhoneInput,
  sendReportAssistantMessage,
  splitCoacheeName,
  toPlaceholderKey,
  runGenerateFromSetup,
  runSendAssistantMessage,
} from '@/screens/newReport/newReport.logic'

export function normalizeReportScreenProps(props: ReportScreenProps): Required<ReportScreenProps> {
  return {
    initialCoacheeId: props.initialCoacheeId ?? props.initialClientId ?? null,
    initialSessionId: props.initialSessionId ?? props.initialInputId ?? null,
    initialClientId: props.initialClientId ?? props.initialCoacheeId ?? null,
    initialInputId: props.initialInputId ?? props.initialSessionId ?? null,
    mode: props.mode ?? 'controleren',
  }
}
