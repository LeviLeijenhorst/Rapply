import assert from 'node:assert/strict'
import test from 'node:test'
import type { PipelineTemplate } from '../../api/pipeline/pipelineApi'
import type { Report } from '../../storage/types'
import { formatConfidence, formatVersionSource, hasChatFieldUpdates, readFieldOrder } from './reportEditorLogic'

function createReport(): Report {
  return {
    id: 'report-1',
    clientId: 'client-1',
    trajectoryId: 'trajectory-1',
    sourceInputId: 'input-1',
    title: 'Rapport',
    reportType: 'uwv',
    state: 'needs_review',
    reportText: 'tekst',
    reportDate: null,
    createdAtUnixMs: 1,
    updatedAtUnixMs: 1,
    reportStructuredJson: {
      templateId: 'template-1',
      templateName: 'Template 1',
      createdAtUnixMs: 1,
      updatedAtUnixMs: 1,
      fields: {
        field_a: {
          fieldId: 'field_a',
          label: 'Veld A',
          fieldType: 'ai',
          answer: 'A',
          factualBasis: '',
          reasoning: '',
          confidence: 0.64,
          updatedAtUnixMs: 1,
          versions: [],
        },
        field_b: {
          fieldId: 'field_b',
          label: 'Veld B',
          fieldType: 'manual',
          answer: 'B',
          factualBasis: '',
          reasoning: '',
          confidence: null,
          updatedAtUnixMs: 1,
          versions: [],
        },
        field_extra: {
          fieldId: 'field_extra',
          label: 'Extra veld',
          fieldType: 'ai',
          answer: 'E',
          factualBasis: '',
          reasoning: '',
          confidence: null,
          updatedAtUnixMs: 1,
          versions: [],
        },
      },
    },
  }
}

test('report editor logic formats confidence and version source labels', () => {
  assert.equal(formatConfidence(0.64), '64%')
  assert.equal(formatConfidence(null), 'Onbekend')
  assert.equal(formatVersionSource('ai_generation'), 'AI generatie')
  assert.equal(formatVersionSource('ai_regeneration'), 'AI regeneratie')
  assert.equal(formatVersionSource('chat_update'), 'Chat update')
  assert.equal(formatVersionSource('manual_edit'), 'Handmatige wijziging')
})

test('report editor logic uses template order first, then extra fields', () => {
  const template: PipelineTemplate = {
    id: 'template-1',
    name: 'Template 1',
    description: 'desc',
    fields: [
      { fieldId: 'field_b', label: 'B', fieldType: 'manual', exportNumberKey: '1.1' },
      { fieldId: 'field_a', label: 'A', fieldType: 'ai', exportNumberKey: '1.2' },
    ],
  }
  const order = readFieldOrder(createReport(), template)
  assert.deepEqual(order, ['field_b', 'field_a', 'field_extra'])
})

test('report editor logic refreshes only when chat returned valid field updates', () => {
  assert.equal(hasChatFieldUpdates({ fieldUpdates: undefined }), false)
  assert.equal(hasChatFieldUpdates({ fieldUpdates: [] }), false)
  assert.equal(hasChatFieldUpdates({ fieldUpdates: [{ fieldId: '', answer: 'x' }] }), false)
  assert.equal(hasChatFieldUpdates({ fieldUpdates: [{ fieldId: 'field_a', answer: 'Nieuw antwoord' }] }), true)
})
