import { UpdateEstablishmentSettings } from '@contexts/establishment/establishment/application/update-settings/update-establishment-settings'
import { EstablishmentRepository } from '@contexts/establishment/establishment/domain/repositories/establishment.repository'
import { EventBus } from '@shared/domain/events'
import { EstablishmentMother } from '../__mothers__/establishment.mother'

describe('UpdateEstablishmentSettings', () => {
  let useCase: UpdateEstablishmentSettings
  let repository: jest.Mocked<EstablishmentRepository>
  let eventBus: jest.Mocked<EventBus>

  beforeEach(() => {
    repository = {
      findSingleton: jest.fn(),
      save: jest.fn()
    } as jest.Mocked<EstablishmentRepository>

    eventBus = {
      publish: jest.fn(),
      addSubscribers: jest.fn()
    } as unknown as jest.Mocked<EventBus>

    useCase = new UpdateEstablishmentSettings(repository, eventBus)
  })

  describe('valid update', () => {
    it('should call repo.save and eventBus.publish once for a valid partial update', async () => {
      const establishment = EstablishmentMother.create()
      repository.findSingleton.mockResolvedValue(establishment)
      repository.save.mockResolvedValue(undefined)
      eventBus.publish.mockResolvedValue(undefined)

      await useCase.run({ name: 'New Name' })

      expect(repository.save).toHaveBeenCalledTimes(1)
      expect(eventBus.publish).toHaveBeenCalledTimes(1)
    })

    it('should persist the updated name', async () => {
      const establishment = EstablishmentMother.create()
      repository.findSingleton.mockResolvedValue(establishment)
      repository.save.mockResolvedValue(undefined)
      eventBus.publish.mockResolvedValue(undefined)

      await useCase.run({ name: 'Updated Name' })

      const savedArg = repository.save.mock.calls[0][0]
      expect(savedArg.toPrimitives().name).toBe('Updated Name')
    })

    it('should publish at least one domain event after update', async () => {
      const establishment = EstablishmentMother.create()
      repository.findSingleton.mockResolvedValue(establishment)
      repository.save.mockResolvedValue(undefined)
      eventBus.publish.mockResolvedValue(undefined)

      await useCase.run({ name: 'New Name' })

      const publishedEvents = eventBus.publish.mock.calls[0][0]
      expect(publishedEvents.length).toBeGreaterThan(0)
    })
  })

  describe('invalid currency', () => {
    it('should throw a domain exception and NOT call repo.save for an invalid currency code', async () => {
      const establishment = EstablishmentMother.create()
      repository.findSingleton.mockResolvedValue(establishment)

      await expect(useCase.run({ defaultCurrency: 'NOTISO' })).rejects.toThrow()

      expect(repository.save).not.toHaveBeenCalled()
    })

    it('should throw a domain exception and NOT call eventBus.publish for an invalid currency code', async () => {
      const establishment = EstablishmentMother.create()
      repository.findSingleton.mockResolvedValue(establishment)

      await expect(useCase.run({ defaultCurrency: 'NOTISO' })).rejects.toThrow()

      expect(eventBus.publish).not.toHaveBeenCalled()
    })
  })

  describe('autoSendToKitchen round-trip', () => {
    it('should persist autoSendToKitchen=true when included in update params', async () => {
      const establishment = EstablishmentMother.create()
      repository.findSingleton.mockResolvedValue(establishment)
      repository.save.mockResolvedValue(undefined)
      eventBus.publish.mockResolvedValue(undefined)

      await useCase.run({ autoSendToKitchen: true })

      const savedArg = repository.save.mock.calls[0][0]
      expect(savedArg.toPrimitives().autoSendToKitchen).toBe(true)
    })

    it('should persist autoSendToKitchen=false when set to false', async () => {
      const establishment = EstablishmentMother.withAutoSendToKitchen(true)
      repository.findSingleton.mockResolvedValue(establishment)
      repository.save.mockResolvedValue(undefined)
      eventBus.publish.mockResolvedValue(undefined)

      await useCase.run({ autoSendToKitchen: false })

      const savedArg = repository.save.mock.calls[0][0]
      expect(savedArg.toPrimitives().autoSendToKitchen).toBe(false)
    })
  })

  describe('invalid tax rate', () => {
    it('should throw a domain exception and NOT call repo.save when tax rate exceeds 1', async () => {
      const establishment = EstablishmentMother.create()
      repository.findSingleton.mockResolvedValue(establishment)

      await expect(useCase.run({ defaultTaxRate: 1.5 })).rejects.toThrow()

      expect(repository.save).not.toHaveBeenCalled()
    })

    it('should throw a domain exception and NOT call repo.save when tax rate is negative', async () => {
      const establishment = EstablishmentMother.create()
      repository.findSingleton.mockResolvedValue(establishment)

      await expect(useCase.run({ defaultTaxRate: -0.1 })).rejects.toThrow()

      expect(repository.save).not.toHaveBeenCalled()
    })
  })
})
