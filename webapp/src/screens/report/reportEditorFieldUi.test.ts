import assert from 'node:assert/strict'
import test from 'node:test'
import {
  capitalizeFirstLetter,
  composeNameField,
  decomposeNameField,
  deserializeRepeatableRows,
  deserializeTariffSplit,
  formatInitialsForEditing,
  isBsnDraftValidForSave,
  isDefaultCollapsedSection,
  serializeMultiSelectDeterministic,
  serializeRepeatableRows,
  serializeTariffSplit,
  shouldCapitalizeField,
} from './reportEditorFieldUi'

test('name split field stays editable and recombines to one source field', () => {
  const split = decomposeNameField('J. Jansen')
  assert.equal(split.initials, 'J.')
  assert.equal(split.surname, 'Jansen')
  assert.equal(composeNameField('A.B.', 'de vries', true), 'A.B. De vries')
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

test('5.1 multi-select serialization is deterministic', () => {
  const serialized = serializeMultiSelectDeterministic([
    'Verbeteren persoonlijke effectiviteit',
    'Versterken werknemersvaardigheden',
  ])
  assert.equal(serialized, 'Versterken werknemersvaardigheden | Verbeteren persoonlijke effectiviteit')
})

test('5.3 repeatable rows serialize and deserialize consistently', () => {
  const serialized = serializeRepeatableRows([
    { hours: '2', activity: 'Netwerk' },
    { hours: '3', activity: 'Sollicitatie' },
  ])
  assert.equal(serialized, 'Netwerk (2 uur); Sollicitatie (3 uur)')
  const rows = deserializeRepeatableRows(serialized)
  assert.equal(rows[0].activity, 'Netwerk')
  assert.equal(rows[1].hours, '3')
})

test('8.3 amount and motivation split serialize and deserialize correctly', () => {
  const serialized = serializeTariffSplit({ amount: '125', motivation: 'Specialistische expertise nodig.' })
  assert.match(serialized, /uurtarief:\s*125/i)
  const parsed = deserializeTariffSplit(serialized)
  assert.equal(parsed.amount, '125')
  assert.match(parsed.motivation, /specialistische expertise/i)
})

test('default collapsed sections include client/UWV/company and ordernummer', () => {
  assert.equal(isDefaultCollapsedSection('Gegevens cliënt'), true)
  assert.equal(isDefaultCollapsedSection('Gegevens UWV'), true)
  assert.equal(isDefaultCollapsedSection('Gegevens re-integratiebedrijf'), true)
  assert.equal(isDefaultCollapsedSection('Ordernummer'), true)
  assert.equal(isDefaultCollapsedSection('Visie op dienstverlening'), false)
})
