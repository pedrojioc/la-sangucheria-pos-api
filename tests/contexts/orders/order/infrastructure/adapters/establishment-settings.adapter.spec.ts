import { TypeOrmEstablishmentSettingsAdapter } from '@contexts/orders/order/infrastructure/adapters/establishment-settings.adapter'
import { GetEstablishmentSettings } from '@contexts/establishment/establishment/application/get-settings/get-establishment-settings'
import { EstablishmentSettingsResponse } from '@contexts/establishment/establishment/application/dto/establishment-settings.response'
import { TaxType } from '@shared/domain/value-objects/tax-type'

function makeSettingsResponse(
  overrides: Partial<{ tipSuggestions: [number, number, number] | null }> = {}
): EstablishmentSettingsResponse {
  return {
    defaultCurrency: 'COP',
    defaultTaxRate: 0.19,
    defaultTaxType: TaxType.IVA,
    taxInclusive: true,
    enabledOrderTypes: ['DINE_IN', 'DELIVERY', 'TAKEOUT'],
    tipSuggestions: overrides.tipSuggestions ?? null
  } as EstablishmentSettingsResponse
}

describe('TypeOrmEstablishmentSettingsAdapter', () => {
  it('maps configured tipSuggestions through', async () => {
    const getSettings = {
      run: jest.fn().mockResolvedValue(makeSettingsResponse({ tipSuggestions: [0.05, 0.1, 0.15] }))
    } as unknown as jest.Mocked<GetEstablishmentSettings>

    const adapter = new TypeOrmEstablishmentSettingsAdapter(getSettings)
    const result = await adapter.resolve()

    expect(result.tipSuggestions).toEqual([0.05, 0.1, 0.15])
  })

  it('maps unconfigured tipSuggestions as null', async () => {
    const getSettings = {
      run: jest.fn().mockResolvedValue(makeSettingsResponse({ tipSuggestions: null }))
    } as unknown as jest.Mocked<GetEstablishmentSettings>

    const adapter = new TypeOrmEstablishmentSettingsAdapter(getSettings)
    const result = await adapter.resolve()

    expect(result.tipSuggestions).toBeNull()
  })
})
