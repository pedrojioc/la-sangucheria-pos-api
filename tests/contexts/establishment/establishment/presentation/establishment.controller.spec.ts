import { EstablishmentController } from '@contexts/establishment/establishment/presentation/http/controllers/establishment.controller'
import { GetEstablishmentSettings } from '@contexts/establishment/establishment/application/get-settings/get-establishment-settings'
import { UpdateEstablishmentSettings } from '@contexts/establishment/establishment/application/update-settings/update-establishment-settings'
import { InitializeEstablishment } from '@contexts/establishment/establishment/application/initialize/initialize-establishment'
import { EstablishmentSettingsResponse } from '@contexts/establishment/establishment/application/dto/establishment-settings.response'
import { EstablishmentNotConfigured } from '@contexts/establishment/establishment/domain/exceptions/establishment-not-configured.exception'
import { KitchenMode } from '@contexts/establishment/establishment/domain/kitchen-mode'
import { EstablishmentMother } from '../__mothers__/establishment.mother'

describe('EstablishmentController', () => {
  let controller: EstablishmentController
  let mockGetSettings: jest.Mocked<GetEstablishmentSettings>
  let mockUpdateSettings: jest.Mocked<UpdateEstablishmentSettings>
  let mockInitializeEstablishment: jest.Mocked<InitializeEstablishment>

  beforeEach(() => {
    mockGetSettings = { run: jest.fn() } as unknown as jest.Mocked<GetEstablishmentSettings>
    mockUpdateSettings = { run: jest.fn() } as unknown as jest.Mocked<UpdateEstablishmentSettings>
    mockInitializeEstablishment = {
      run: jest.fn()
    } as unknown as jest.Mocked<InitializeEstablishment>

    controller = new EstablishmentController(
      mockGetSettings,
      mockUpdateSettings,
      mockInitializeEstablishment
    )
  })

  describe('GET /establishment/settings', () => {
    it('should return configured=true with settings when establishment exists', async () => {
      const establishment = EstablishmentMother.create()
      const response = EstablishmentSettingsResponse.fromDomain(establishment, KitchenMode.NONE)
      mockGetSettings.run.mockResolvedValue(response)

      const result = await controller.getEstablishmentSettings()

      expect(result.configured).toBe(true)
      expect(result.settings).toBe(response)
    })

    it('should return configured=false with null settings when EstablishmentNotConfigured is thrown', async () => {
      mockGetSettings.run.mockRejectedValue(new EstablishmentNotConfigured())

      const result = await controller.getEstablishmentSettings()

      expect(result.configured).toBe(false)
      expect(result.settings).toBeNull()
    })

    it('should rethrow any other error', async () => {
      mockGetSettings.run.mockRejectedValue(new Error('unexpected'))

      await expect(controller.getEstablishmentSettings()).rejects.toThrow('unexpected')
    })
  })
})
