import assert from 'node:assert/strict'
import test from 'node:test'
import { decryptAppDataTextFields } from './decryptAppData'
import type { LocalAppData } from './types'

function createBaseData(): LocalAppData {
  return {
    clients: [
      {
        id: 'client-1',
        name: 'RTJFRTE1234567890ABCDEFGHIJKLMNOP',
        clientDetails: '',
        employerDetails: '',
        createdAtUnixMs: 1,
        updatedAtUnixMs: 1,
        isArchived: false,
      },
    ],
    trajectories: [],
    inputs: [],
    reports: [],
    snippets: [],
    notes: [],
    templates: [],
    inputSummaries: [],
    organizationSettings: {
      name: '',
      practiceName: '',
      website: '',
      visitAddress: '',
      postalAddress: '',
      postalCodeCity: '',
      updatedAtUnixMs: 1,
    },
    userSettings: {
      name: '',
      role: '',
      phone: '',
      email: '',
      updatedAtUnixMs: 1,
    },
  }
}

test('decryptAppDataTextFields decrypts encrypted-like values and keeps normal text unchanged', async () => {
  const baseData = createBaseData()
  const decryptCalls: string[] = []
  const decrypted = await decryptAppDataTextFields(baseData, {
    decryptText: async (value) => {
      decryptCalls.push(value)
      if (value === 'RTJFRTE1234567890ABCDEFGHIJKLMNOP') return 'Jan Jansen'
      throw new Error('decrypt failed')
    },
  })

  assert.equal(decrypted.clients[0].name, 'Jan Jansen')
  assert.deepEqual(decryptCalls, ['RTJFRTE1234567890ABCDEFGHIJKLMNOP'])
})
