import assert from 'node:assert/strict'
import test from 'node:test'
import type { Snippet } from '../../storage/types'
import {
  buildApprovedSnippetCountByInputId,
  canGeneratePipelineReport,
  countSelectedApprovedSnippets,
  toggleSelectionId,
} from './newReportPipelineLogic'

function createSnippet(params: { id: string; inputId: string; status: Snippet['status'] }): Snippet {
  return {
    id: params.id,
    clientId: 'client-1',
    trajectoryId: 'trajectory-1',
    inputId: params.inputId,
    sourceInputId: params.inputId,
    sourceSessionId: params.inputId,
    itemId: params.inputId,
    field: 'rp_werkfit_5_1',
    fieldId: 'rp_werkfit_5_1',
    text: 'Snippet',
    date: 1,
    status: params.status,
    createdAtUnixMs: 1,
    updatedAtUnixMs: 1,
  }
}

test('new report pipeline logic counts approved snippets only for selected inputs', () => {
  const snippetCountByInputId = buildApprovedSnippetCountByInputId([
    createSnippet({ id: 'snippet-1', inputId: 'input-1', status: 'approved' }),
    createSnippet({ id: 'snippet-2', inputId: 'input-1', status: 'pending' }),
    createSnippet({ id: 'snippet-3', inputId: 'input-2', status: 'approved' }),
  ])
  assert.equal(snippetCountByInputId.get('input-1'), 1)
  assert.equal(snippetCountByInputId.get('input-2'), 1)
  assert.equal(countSelectedApprovedSnippets(['input-1'], snippetCountByInputId), 1)
  assert.equal(countSelectedApprovedSnippets(['input-1', 'input-2'], snippetCountByInputId), 2)
})

test('new report pipeline logic enables generate when client/template/input are selected', () => {
  assert.equal(
    canGeneratePipelineReport({
      selectedClientId: 'client-1',
      selectedTemplateId: 'reintegratieplan_werkfit_maken',
      selectedInputIds: ['input-1'],
      isGenerating: false,
    }),
    true,
  )
  assert.equal(
    canGeneratePipelineReport({
      selectedClientId: 'client-1',
      selectedTemplateId: 'reintegratieplan_werkfit_maken',
      selectedInputIds: ['input-1'],
      isGenerating: false,
    }),
    true,
  )
  assert.equal(
    canGeneratePipelineReport({
      selectedClientId: 'client-1',
      selectedTemplateId: 'reintegratieplan_werkfit_maken',
      selectedInputIds: ['input-1'],
      isGenerating: true,
    }),
    false,
  )
})

test('new report pipeline logic toggles note/input selection ids', () => {
  assert.deepEqual(toggleSelectionId([], 'input-1'), ['input-1'])
  assert.deepEqual(toggleSelectionId(['input-1', 'input-2'], 'input-1'), ['input-2'])
})
