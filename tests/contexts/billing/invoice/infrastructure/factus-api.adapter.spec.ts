import { FactusApiAdapter } from '@contexts/billing/invoice/infrastructure/adapters/factus-api.adapter'
import { BillingConfigPrimitives } from '@contexts/billing/billing-config/domain/billing-config'
import { InvoiceSnapshot } from '@contexts/billing/invoice/domain/invoice-snapshot'
import { DocumentType } from '@contexts/billing/invoice/domain/document-type'
import { InvoiceSnapshotMother } from '@test/contexts/billing/invoice/__mothers__/invoice.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

const makeConfig = (overrides: Partial<BillingConfigPrimitives> = {}): BillingConfigPrimitives => ({
  id: UuidMother.random(),
  factusApiToken: 'test-token',
  factusApiBaseUrl: 'https://api.factus.com.co',
  factusTestMode: true,
  resolucionPrefix: 'FE',
  resolucionFrom: 1,
  resolucionTo: 9999,
  resolucionValidFrom: new Date('2025-01-01'),
  resolucionValidTo: new Date('2026-01-01'),
  updatedAt: new Date(),
  ...overrides
})

const makeSnapshot = (overrides: Partial<InvoiceSnapshot> = {}): InvoiceSnapshot =>
  InvoiceSnapshotMother.create({
    documentType: DocumentType.DOCUMENTO_EQUIVALENTE,
    ...overrides
  })

describe('FactusApiAdapter', () => {
  let adapter: FactusApiAdapter

  beforeEach(() => {
    adapter = new FactusApiAdapter()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('issue()', () => {
    it('maps 200 response to FactusIssueResult correctly', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          cufe_cude: 'abc123',
          document_number: 'FE-001'
        }),
        text: jest.fn()
      }
      global.fetch = jest.fn().mockResolvedValue(mockResponse)

      const result = await adapter.issue(makeConfig(), makeSnapshot())

      expect(result.cufeCude).toBe('abc123')
      expect(result.documentNumber).toBe('FE-001')
    })

    it('throws an error containing the status code on non-2xx response', async () => {
      const mockResponse = {
        ok: false,
        status: 422,
        json: jest.fn(),
        text: jest.fn().mockResolvedValue('Validation error')
      }
      global.fetch = jest.fn().mockResolvedValue(mockResponse)

      await expect(adapter.issue(makeConfig(), makeSnapshot())).rejects.toThrow('422')
    })

    it('throws an error when fetch is aborted due to timeout', async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError'))

      await expect(adapter.issue(makeConfig(), makeSnapshot())).rejects.toThrow()
    })
  })
})
