import { UpdateBillingConfig } from '@contexts/billing/billing-config/application/update-billing-config/update-billing-config'
import { BillingConfigRepository } from '@contexts/billing/billing-config/domain/repositories/billing-config.repository'
import { BillingNotConfigured } from '@contexts/billing/billing-config/domain/exceptions/billing-not-configured.exception'
import { BillingConfigUpdatedEvent } from '@contexts/billing/billing-config/domain/events/billing-config-updated.event'
import { EventBus } from '@shared/domain/events'
import { BillingConfigMother } from '../__mothers__/billing-config.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { DomainEvent } from '@shared/domain/events'

describe('UpdateBillingConfig', () => {
  let mockRepository: jest.Mocked<BillingConfigRepository>
  let mockEventBus: jest.Mocked<EventBus>
  let useCase: UpdateBillingConfig

  const validParams = {
    id: UuidMother.random(),
    factusApiToken: 'test-token',
    factusApiBaseUrl: 'https://api-sandbox.factus.com.co',
    factusTestMode: true,
    resolucionPrefix: 'SETP',
    resolucionFrom: 1,
    resolucionTo: 1000,
    resolucionValidFrom: new Date('2025-01-01'),
    resolucionValidTo: new Date('2025-12-31')
  }

  beforeEach(() => {
    mockRepository = {
      findSingleton: jest.fn(),
      save: jest.fn()
    } as jest.Mocked<BillingConfigRepository>

    mockEventBus = {
      publish: jest.fn(),
      addSubscribers: jest.fn()
    } as unknown as jest.Mocked<EventBus>

    useCase = new UpdateBillingConfig(mockRepository, mockEventBus)
  })

  describe('run() — existing config (update path)', () => {
    it('should update existing config, save, and publish BillingConfigUpdatedEvent', async () => {
      // Arrange
      const existingConfig = BillingConfigMother.create()
      mockRepository.findSingleton.mockResolvedValue(existingConfig)
      mockRepository.save.mockResolvedValue(undefined)
      mockEventBus.publish.mockResolvedValue(undefined)

      // Act
      await useCase.run(validParams)

      // Assert
      expect(mockRepository.findSingleton).toHaveBeenCalledTimes(1)
      expect(mockRepository.save).toHaveBeenCalledTimes(1)
      expect(mockEventBus.publish).toHaveBeenCalledTimes(1)

      const publishedEvents: DomainEvent[] = mockEventBus.publish.mock.calls[0][0]
      expect(publishedEvents).toHaveLength(1)
      expect(publishedEvents[0]).toBeInstanceOf(BillingConfigUpdatedEvent)
    })
  })

  describe('run() — no existing config (create path)', () => {
    it('should create new config when repo throws BillingNotConfigured, save, and NOT publish events', async () => {
      // Arrange
      mockRepository.findSingleton.mockRejectedValue(new BillingNotConfigured())
      mockRepository.save.mockResolvedValue(undefined)
      mockEventBus.publish.mockResolvedValue(undefined)

      // Act
      await useCase.run(validParams)

      // Assert
      expect(mockRepository.save).toHaveBeenCalledTimes(1)
      // create() does not record events; pullDomainEvents() returns []
      expect(mockEventBus.publish).toHaveBeenCalledWith([])
    })
  })
})
