import assert from 'node:assert/strict'
import test from 'node:test'
import {
  capitalizeFirstLetter,
  composeNameField,
  decomposeNameField,
  formatInitialsForEditing,
  isBsnDraftValidForSave,
  isDefaultCollapsedSection,
  readFieldVariant,
  readSingleChoiceOptions,
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
})

test('default collapsed sections include client/UWV/company and ordernummer question', () => {
  assert.equal(isDefaultCollapsedSection('Gegevens cliënt'), true)
  assert.equal(isDefaultCollapsedSection('Gegevens UWV'), true)
  assert.equal(isDefaultCollapsedSection('Gegevens re-integratiebedrijf'), true)
  assert.equal(isDefaultCollapsedSection('Wat is het ordernummer?'), true)
  assert.equal(isDefaultCollapsedSection('Visie op dienstverlening'), false)
})

