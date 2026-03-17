import assert from 'node:assert/strict'
import test from 'node:test'
import {
  capitalizeFirstLetter,
  composeNameField,
  decomposeNameField,
  deserializeAddressSplit,
  formatInitialsForEditing,
  isBsnDraftValidForSave,
  isDefaultCollapsedSection,
  normalizeHoursInput,
  parseHoursToNumber,
  readConditionalHiddenFieldIds,
  readDefaultSectionTitle,
  readDisplayFieldLabel,
  readFieldVariant,
  readSingleChoiceOptions,
  serializeAddressSplit,
  shouldShowAkkoordToelichting,
  shouldCapitalizeField,
} from './reportEditorFieldUi'

test('name split field stays editable and recombines to one source field', () => {
  const split = decomposeNameField('J. Jansen')
  assert.equal(split.initials, 'J.')
  assert.equal(split.surname, 'Jansen')
  assert.equal(composeNameField('A.B.', 'de vries', true), 'A.B. De vries')
})

test('name split field keeps only surname when full first and last name are pasted', () => {
  const split = decomposeNameField('Jan Jansen')
  assert.equal(split.initials, '')
  assert.equal(split.surname, 'Jansen')
})

test('initials formatter preserves natural backspace behavior', () => {
  assert.equal(formatInitialsForEditing('ab', 'A.'), 'A.B.')
  assert.equal(formatInitialsForEditing('A.B', 'A.B.'), 'A.')
})

test('bsn validation allows only 8 or 9 digits at save-time', () => {
  assert.equal(isBsnDraftValidForSave('12345678'), true)
  assert.equal(isBsnDraftValidForSave('123456789'), true)
  assert.equal(isBsnDraftValidForSave('1234567'), false)
})

test('capitalization rules apply only to 1.x, 2.x and 3.x identity fields', () => {
  assert.equal(shouldCapitalizeField('2.1', 'Naam contactpersoon UWV'), true)
  assert.equal(shouldCapitalizeField('3.8', 'E-mailadres contactpersoon'), false)
  assert.equal(shouldCapitalizeField('5.2', 'Beschrijving'), false)
  assert.equal(capitalizeFirstLetter('jan jansen'), 'Jan jansen')
})

test('field variants include all new structured and multiple-choice fields', () => {
  assert.equal(readFieldVariant({ fieldId: 'rp_werkfit_5_1', numberKey: '5.1', fieldType: 'ai' }), 'multi_select_numeric')
  assert.equal(readFieldVariant({ fieldId: 'rp_werkfit_8_1', numberKey: '8.1', fieldType: 'ai' }), 'single_choice_numeric')
  assert.equal(readFieldVariant({ fieldId: 'er_werkfit_6_1', numberKey: '6.1', fieldType: 'ai' }), 'single_choice_with_custom_reason')
  assert.equal(readFieldVariant({ fieldId: 'er_werkfit_7_1', numberKey: '7.1', fieldType: 'ai' }), 'activiteiten_en_keuzes')
})

test('single choice options are available for all numeric choice fields', () => {
  assert.equal(readSingleChoiceOptions('rp_werkfit_8_1').length, 2)
  assert.equal(readSingleChoiceOptions('er_werkfit_4_2').length, 3)
  assert.equal(readSingleChoiceOptions('er_werkfit_6_1').length, 6)
  assert.equal(readSingleChoiceOptions('er_werkfit_7_3').length, 2)
  assert.equal(readSingleChoiceOptions('er_werkfit_8_2').length, 2)
  assert.equal(
    readSingleChoiceOptions('er_werkfit_4_2')[0]?.label,
    "BeÃ«indiging re-integratiedienst 'Werkfit maken' naar aanleiding van het evaluatiemoment",
  )
})

test('default collapsed sections include client/UWV/company and ordernummer section', () => {
  assert.equal(isDefaultCollapsedSection('Gegevens cliÃ«nt'), true)
  assert.equal(isDefaultCollapsedSection('Gegevens UWV'), true)
  assert.equal(isDefaultCollapsedSection('Gegevens re-integratiebedrijf'), true)
  assert.equal(isDefaultCollapsedSection('Ordernummer'), true)
  assert.equal(isDefaultCollapsedSection('Visie op dienstverlening'), false)
})

test('template-specific eindrapportage titles and labels match the UWV structure', () => {
  assert.equal(readDefaultSectionTitle('4', 'Fallback', 'eindrapportage_werkfit_maken'), 'Aanleiding voor de eindrapportage')
  assert.equal(
    readDefaultSectionTitle('5', 'Fallback', 'eindrapportage_werkfit_maken'),
    'BeÃ«indiging re-integratiedienst naar aanleiding van het evaluatiemoment',
  )
  assert.equal(readDisplayFieldLabel('4.2', 'Fallback', 'eindrapportage_werkfit_maken'), 'Van welke eindsituatie is sprake?')
  assert.equal(
    readDisplayFieldLabel('6.3', 'Fallback', 'eindrapportage_werkfit_maken'),
    'Een voortijdige terugmelding moet altijd vooraf worden besproken met de klant en met UWV. Met wie bij UWV heeft u dit besproken?',
  )
  assert.equal(readDefaultSectionTitle('8', 'Fallback', 'eindrapportage_werkfit_maken'), 'Oordeel klant')
  assert.equal(
    readDisplayFieldLabel('8.2', 'Fallback', 'eindrapportage_werkfit_maken'),
    'Is de klant akkoord met het aantal door u ingezette en verantwoorde begeleidingsuren?',
  )
  assert.equal(
    readDisplayFieldLabel('7.6', 'Fallback', 'eindrapportage_werkfit_maken'),
    'Wat is uw vervolgadvies en welke bemiddeling en/of begeleiding heeft de klant nog nodig?',
  )
  assert.equal(readDisplayFieldLabel('7.7', 'Fallback', 'eindrapportage_werkfit_maken'), 'Toelichting op advies')
  assert.equal(
    readDisplayFieldLabel('7.8', 'Fallback', 'eindrapportage_werkfit_maken'),
    'Wat vindt de klant van dit advies?',
  )
})

test('template-specific reintegratieplan labels match requested wording', () => {
  assert.equal(readDefaultSectionTitle('4', 'Fallback', 'reintegratieplan_werkfit_maken'), 'Ordernummer')
  assert.equal(readDisplayFieldLabel('4.1', 'Fallback', 'reintegratieplan_werkfit_maken'), 'Wat is het ordernummer?')
  assert.equal(
    readDisplayFieldLabel('7.2', 'Fallback', 'reintegratieplan_werkfit_maken'),
    'Wat is uw visie op de re-integratiemogelijkheden van de cliÃ«nt?',
  )
  assert.equal(
    readDisplayFieldLabel('7.3', 'Fallback', 'reintegratieplan_werkfit_maken'),
    'Wat verwacht u van de inzet en het resultaat van de re-integratiedienst?',
  )
})

test('eindrapportage branching hides the expected sections for each 4.2 option', () => {
  assert.deepEqual(readConditionalHiddenFieldIds({ er42Choice: 1 }), ['er_werkfit_6_1', 'er_werkfit_6_2', 'er_werkfit_6_3'])
  assert.deepEqual(readConditionalHiddenFieldIds({ er42Choice: 2 }), ['er_werkfit_5_1', 'er_werkfit_5_2'])
  assert.deepEqual(readConditionalHiddenFieldIds({ er42Choice: 3 }), [
    'er_werkfit_5_1',
    'er_werkfit_5_2',
    'er_werkfit_6_1',
    'er_werkfit_6_2',
    'er_werkfit_6_3',
  ])
})

test('hour input normalization accepts dot decimals with max two digits before and after', () => {
  assert.equal(normalizeHoursInput('12'), '12')
  assert.equal(normalizeHoursInput('12.5'), '12.5')
  assert.equal(normalizeHoursInput('12.55'), '12.55')
  assert.equal(normalizeHoursInput('123'), '12')
  assert.equal(normalizeHoursInput('1.234'), '1.23')
  assert.equal(normalizeHoursInput('1.2.3'), '1.23')
  assert.equal(parseHoursToNumber('12.55'), 12.55)
  assert.equal(parseHoursToNumber('12,5'), 12.5)
})

test('akkoord_met_toelichting shows toelichting only for Nee', () => {
  assert.equal(shouldShowAkkoordToelichting(1), false)
  assert.equal(shouldShowAkkoordToelichting(2), true)
  assert.equal(shouldShowAkkoordToelichting(null), false)
})

test('address split serialization and parsing preserves all postcode/place parts', () => {
  const composite = serializeAddressSplit({
    visitPostcode: '1011AB',
    visitPlace: 'Amsterdam',
    postalPostcode: '3011CD',
    postalPlace: 'Rotterdam',
  })
  assert.equal(composite, 'Bezoek postcode: 1011AB; Bezoek plaats: Amsterdam; Post postcode: 3011CD; Post plaats: Rotterdam')
  const parsed = deserializeAddressSplit(composite)
  assert.equal(parsed.visitPostcode, '1011AB')
  assert.equal(parsed.visitPlace, 'Amsterdam')
  assert.equal(parsed.postalPostcode, '3011CD')
  assert.equal(parsed.postalPlace, 'Rotterdam')
})
