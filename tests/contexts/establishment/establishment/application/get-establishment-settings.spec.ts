import { GetEstablishmentSettings } from '@contexts/establishment/establishment/application/get-settings/get-establishment-settings'
import { EstablishmentRepository } from '@contexts/establishment/establishment/domain/repositories/establishment.repository'
import { EstablishmentSettingsResponse } from '@contexts/establishment/establishment/application/dto/establishment-settings.response'
import { EstablishmentNotConfigured } from '@contexts/establishment/establishment/domain/exceptions/establishment-not-configured.exception'
import { TaxType } from '@shared/domain/value-objects/tax-type'
import { KitchenMode } from '@contexts/establishment/establishment/domain/kitchen-mode'
import { EstablishmentMother } from '../__mothers__/establishment.mother'

describe('GetEstablishmentSettings', () => {
  let useCase: GetEstablishmentSettings
  let repository: jest.Mocked<EstablishmentRepository>

  beforeEach(() => {
    repository = {
      findSingleton: jest.fn(),
      save: jest.fn()
    } as jest.Mocked<EstablishmentRepository>

    useCase = new GetEstablishmentSettings(repository)
  })

  describe('happy path', () => {
    it('should return EstablishmentSettingsResponse with matching fields when singleton exists', async () => {
      const establishment = EstablishmentMother.create()
      repository.findSingleton.mockResolvedValue(establishment)

      const result = await useCase.run()

      expect(result).toBeInstanceOf(EstablishmentSettingsResponse)
      expect(result.id).toBe('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d')
      expect(result.name).toBe('Mi Establecimiento')
      expect(result.defaultCurrency).toBe('COP')
      expect(result.defaultTaxRate).toBe(0.08)
      expect(result.defaultTaxType).toBe(TaxType.INC)
      expect(result.taxInclusive).toBe(true)
      expect(result.kitchenMode).toBe(KitchenMode.NONE)
      expect(result.timezone).toBe('America/Bogota')
      expect(result.locale).toBe('es-CO')
      expect(result.loyaltyEnabled).toBe(false)
    })

    it('should call repository.findSingleton exactly once', async () => {
      repository.findSingleton.mockResolvedValue(EstablishmentMother.create())

      await useCase.run()

      expect(repository.findSingleton).toHaveBeenCalledTimes(1)
    })
  })

  describe('not configured', () => {
    it('should propagate EstablishmentNotConfigured when repository throws', async () => {
      repository.findSingleton.mockRejectedValue(new EstablishmentNotConfigured())

      await expect(useCase.run()).rejects.toThrow(EstablishmentNotConfigured)
    })

    it('should not call save when findSingleton throws', async () => {
      repository.findSingleton.mockRejectedValue(new EstablishmentNotConfigured())

      await expect(useCase.run()).rejects.toThrow()

      expect(repository.save).not.toHaveBeenCalled()
    })
  })
})
