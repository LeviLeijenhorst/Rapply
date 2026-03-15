import assert from 'node:assert/strict'
import test from 'node:test'
import type { PipelineTemplate } from '../../api/pipeline/pipelineApi'
import type { StructuredReport } from '../../storage/types'
import { buildStructuredExportContext, buildStructuredReportText } from './structuredReportExport'

const template: PipelineTemplate = {
  id: 'reintegratieplan_werkfit_maken',
  name: 'Re-integratieplan Werkfit maken',
  description: 'UWV',
  fields: [
    { fieldId: 'rp_werkfit_3_4', label: 'Postcode en plaats', fieldType: 'programmatic', exportNumberKey: '3.4' },
    { fieldId: 'rp_werkfit_5_1', label: 'Hoofdactiviteiten', fieldType: 'ai', exportNumberKey: '5.1' },
    { fieldId: 'rp_werkfit_5_3', label: 'Urenverdeling', fieldType: 'ai', exportNumberKey: '5.3' },
    { fieldId: 'rp_werkfit_8_2', label: 'Specialistische expertise', fieldType: 'ai', exportNumberKey: '8.2' },
    { fieldId: 'rp_werkfit_8_3', label: 'Specialistisch tarief', fieldType: 'ai', exportNumberKey: '8.3' },
  ],
}

const report: StructuredReport = {
  templateId: template.id,
  templateName: template.name,
  createdAtUnixMs: 1,
  updatedAtUnixMs: 1,
  fields: {
    rp_werkfit_3_4: {
      fieldId: 'rp_werkfit_3_4',
      label: 'Postcode en plaats',
      fieldType: 'programmatic',
      answer: 'Bezoek postcode: 1011AB; Bezoek plaats: Amsterdam; Post postcode: 3011CD; Post plaats: Rotterdam',
      factualBasis: '',
      reasoning: '',
      confidence: null,
      updatedAtUnixMs: 1,
      versions: [],
    },
    rp_werkfit_5_1: {
      fieldId: 'rp_werkfit_5_1',
      label: 'Hoofdactiviteiten',
      fieldType: 'ai',
      answer: 'Cliënt volgt werkritme-opbouw.',
      factualBasis: '',
      reasoning: '',
      confidence: 0.7,
      updatedAtUnixMs: 1,
      versions: [],
    },
    rp_werkfit_5_3: {
      fieldId: 'rp_werkfit_5_3',
      label: 'Urenverdeling',
      fieldType: 'ai',
      answer: 'Netwerk (2 uur); Sollicitatie (3 uur)',
      factualBasis: '',
      reasoning: '',
      confidence: 0.6,
      updatedAtUnixMs: 1,
      versions: [],
    },
    rp_werkfit_8_2: {
      fieldId: 'rp_werkfit_8_2',
      label: 'Specialistische expertise',
      fieldType: 'ai',
      answer: 'Aantal uren: 6. Motivering: extra jobcoach ondersteuning.',
      factualBasis: '',
      reasoning: '',
      confidence: 0.5,
      updatedAtUnixMs: 1,
      versions: [],
    },
    rp_werkfit_8_3: {
      fieldId: 'rp_werkfit_8_3',
      label: 'Specialistisch tarief',
      fieldType: 'ai',
      answer: 'Uurtarief: 125. Motivatie: specialistisch arbeidsdeskundig advies.',
      factualBasis: '',
      reasoning: '',
      confidence: 0.5,
      updatedAtUnixMs: 1,
      versions: [],
    },
  },
}

test('structured report export builds deterministic text and UWV placeholder context', () => {
  const reportText = buildStructuredReportText(template, report)
  assert.match(reportText, /### 5\.1 Hoofdactiviteiten/)
  assert.match(reportText, /### 8\.3 Specialistisch tarief/)

  const context = buildStructuredExportContext(template, report)
  assert.equal(context['5_1'], 'Cliënt volgt werkritme-opbouw.')
  assert.equal(context['rp_werkfit_5_1'], 'Cliënt volgt werkritme-opbouw.')
  assert.equal(context['5_3_1_re_integratieactiviteit'], 'Netwerk')
  assert.equal(context['5_3_1_aantal_begeleidingsuren'], '2')
  assert.equal(context['5_3_2_re_integratieactiviteit'], 'Sollicitatie')
  assert.equal(context['5_3_2_aantal_begeleidingsuren'], '3')
  assert.equal(context['5_3_totaal_aantal_begeleidingsuren'], '5')
  assert.equal(context['8_2_aantal_uren'], '6')
  assert.match(context['8_3b'], /specialistisch arbeidsdeskundig advies/i)
  assert.equal(context['3_4_bezoek_postcode'], '1011AB')
  assert.equal(context['3_4_post_plaats'], 'Rotterdam')
})
