import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveInputSummaryText } from './sessionSummary'

test('resolveInputSummaryText prefers markdown summary when available', () => {
  const summary = resolveInputSummaryText({
    summary: 'Korte samenvatting',
    summaryStructured: {
      doelstelling: 'Wordt niet gebruikt',
      belastbaarheid: '',
      belemmeringen: '',
      voortgang: '',
      arbeidsmarktorientatie: '',
    },
  })
  assert.equal(summary, 'Korte samenvatting')
})

test('resolveInputSummaryText formats structured summary when markdown is missing', () => {
  const summary = resolveInputSummaryText({
    summary: null,
    summaryStructured: {
      doelstelling: 'Coach en client hebben doelen afgestemd.',
      belastbaarheid: '',
      belemmeringen: '',
      voortgang: '',
      arbeidsmarktorientatie: 'Vervolgstap is netwerkgesprek.',
    },
  })
  assert.doesNotMatch(String(summary), /###/)
  assert.match(String(summary), /Coach en client hebben doelen afgestemd\./)
  assert.match(String(summary), /Vervolgstap is netwerkgesprek\./)
})

test('resolveInputSummaryText returns null when no usable summary exists', () => {
  const summary = resolveInputSummaryText({
    summary: '',
    summaryStructured: null,
  })
  assert.equal(summary, null)
})
