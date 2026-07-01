import { GetBillingConfig } from '@contexts/billing/billing-config/application/get-billing-config/get-billing-config'
import { BillingConfigRepository } from '@contexts/billing/billing-config/domain/repositories/billing-config.repository'
import { BillingNotConfigured } from '@contexts/billing/billing-config/domain/exceptions/billing-not-configured.exception'
import { BillingConfigMother } from '../__mothers__/billing-config.mother'

describe('GetBillingConfig', () => {
  let mockRepository: jest.Mocked<BillingConfigRepository>
  let useCase: GetBillingConfig

  beforeEach(() => {
    mockRepository = {
      findSingleton: jest.fn(),
      save: jest.fn()
    } as jest.Mocked<BillingConfigRepository>

    useCase = new GetBillingConfig(mockRepository)
  })

  describe('run()', () => {
    it('should return primitives when config exists', async () => {
      // Arrange
      const config = BillingConfigMother.create()
      mockRepository.findSingleton.mockResolvedValue(config)

      // Act
      const result = await useCase.run()

      // Assert
      expect(result).toEqual(config.toPrimitives())
      expect(mockRepository.findSingleton).toHaveBeenCalledTimes(1)
    })

    it('should propagate BillingNotConfigured when repo throws', async () => {
      // Arrange
      mockRepository.findSingleton.mockRejectedValue(new BillingNotConfigured())

      // Act & Assert
      await expect(useCase.run()).rejects.toThrow(BillingNotConfigured)
    })
  })
})
