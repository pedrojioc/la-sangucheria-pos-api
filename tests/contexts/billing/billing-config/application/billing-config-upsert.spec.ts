import { UpdateBillingConfig } from '@contexts/billing/billing-config/application/update-billing-config/update-billing-config'
import { BillingConfigRepository } from '@contexts/billing/billing-config/domain/repositories/billing-config.repository'
import { BillingConfig } from '@contexts/billing/billing-config/domain/billing-config'
import { BillingNotConfigured } from '@contexts/billing/billing-config/domain/exceptions/billing-not-configured.exception'
import { InvalidResolucionRange } from '@contexts/billing/billing-config/domain/exceptions/invalid-resolucion-range.exception'
import { EventBus } from '@shared/domain/events'
import { BillingConfigMother } from '../__mothers__/billing-config.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('UpdateBillingConfig — upsert round-trip', () => {
  let mockRepository: jest.Mocked<BillingConfigRepository>
  let mockEventBus: jest.Mocked<EventBus>
  let useCase: UpdateBillingConfig

  const baseParams = {
    id: UuidMother.random(),
    factusApiToken: 'first-token-abc',
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

    mockRepository.save.mockResolvedValue(undefined)
    mockEventBus.publish.mockResolvedValue(undefined)

    useCase = new UpdateBillingConfig(mockRepository, mockEventBus)
  })

  it('should create a new config (via save) when no config exists yet', async () => {
    // Arrange — repo has no singleton yet
    mockRepository.findSingleton.mockRejectedValue(new BillingNotConfigured())

    // Act
    await useCase.run(baseParams)

    // Assert — save called exactly once with new config containing our token
    expect(mockRepository.save).toHaveBeenCalledTimes(1)
    const savedConfig = mockRepository.save.mock.calls[0][0] as BillingConfig
    expect(savedConfig.toPrimitives().factusApiToken).toBe(baseParams.factusApiToken)
    expect(savedConfig.toPrimitives().resolucionFrom).toBe(baseParams.resolucionFrom)
    expect(savedConfig.toPrimitives().resolucionTo).toBe(baseParams.resolucionTo)
  })

  it('should update existing config (via save) when one already exists — token changes, single save', async () => {
    // Arrange — repo has an existing config
    const existingConfig = BillingConfigMother.create({ factusApiToken: 'old-token-xyz' })
    mockRepository.findSingleton.mockResolvedValue(existingConfig)

    const updatedParams = { ...baseParams, factusApiToken: 'new-token-updated' }

    // Act
    await useCase.run(updatedParams)

    // Assert — findSingleton was called, save called exactly once with updated token
    expect(mockRepository.findSingleton).toHaveBeenCalledTimes(1)
    expect(mockRepository.save).toHaveBeenCalledTimes(1)

    const savedConfig = mockRepository.save.mock.calls[0][0] as BillingConfig
    expect(savedConfig.toPrimitives().factusApiToken).toBe('new-token-updated')
    // ID remains unchanged (same singleton)
    expect(savedConfig.toPrimitives().id).toBe(existingConfig.id.value)
  })

  it('should throw InvalidResolucionRange and NOT call save when resolucionFrom > resolucionTo', async () => {
    // Arrange — invalid range: from > to
    const existingConfig = BillingConfigMother.create()
    mockRepository.findSingleton.mockResolvedValue(existingConfig)

    const invalidParams = { ...baseParams, resolucionFrom: 9999, resolucionTo: 1 }

    // Act + Assert
    await expect(useCase.run(invalidParams)).rejects.toThrow(InvalidResolucionRange)

    expect(mockRepository.save).not.toHaveBeenCalled()
  })
})
