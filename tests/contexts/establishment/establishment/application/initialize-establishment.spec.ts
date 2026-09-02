import {
  InitializeEstablishment,
  InitializeEstablishmentParams
} from '@contexts/establishment/establishment/application/initialize/initialize-establishment'
import { EstablishmentRepository } from '@contexts/establishment/establishment/domain/repositories/establishment.repository'
import { EstablishmentAlreadyConfigured } from '@contexts/establishment/establishment/domain/exceptions/establishment-already-configured.exception'
import { EventBus } from '@shared/domain/events'
import { TaxType } from '@shared/domain/value-objects/tax-type'

describe('InitializeEstablishment', () => {
  let useCase: InitializeEstablishment
  let repository: jest.Mocked<EstablishmentRepository>
  let eventBus: jest.Mocked<EventBus>

  const validParams: InitializeEstablishmentParams = {
    id: '9c858901-8a57-4791-81fe-4c455b099bc9',
    name: 'La Sanguchería',
    displayName: 'La Sanguchería',
    legalName: 'La Sanguchería SAS',
    taxId: '900123456-7',
    phone: null,
    email: null,
    address: null,
    logoUrl: null,
    websiteUrl: null,
    defaultCurrency: 'COP',
    defaultTaxRate: 0.19,
    defaultTaxType: TaxType.IVA,
    taxInclusive: true,
    receiptHeader: null,
    receiptFooter: null,
    timezone: 'America/Bogota',
    locale: 'es-CO',
    loyaltyEnabled: false
  }

  beforeEach(() => {
    repository = {
      exists: jest.fn(),
      findSingleton: jest.fn(),
      save: jest.fn()
    } as jest.Mocked<EstablishmentRepository>

    eventBus = {
      publish: jest.fn(),
      addSubscribers: jest.fn()
    } as unknown as jest.Mocked<EventBus>

    useCase = new InitializeEstablishment(repository, eventBus)
  })

  it('should create and persist the establishment when none exists yet', async () => {
    repository.exists.mockResolvedValue(false)
    repository.save.mockResolvedValue(undefined)
    eventBus.publish.mockResolvedValue(undefined)

    await useCase.run(validParams)

    expect(repository.save).toHaveBeenCalledTimes(1)
    const savedArg = repository.save.mock.calls[0][0]
    expect(savedArg.toPrimitives().name).toBe('La Sanguchería')
    expect(savedArg.toPrimitives().kitchenMode).toBe('NONE')
  })

  it('should publish at least one domain event after initialization', async () => {
    repository.exists.mockResolvedValue(false)
    repository.save.mockResolvedValue(undefined)
    eventBus.publish.mockResolvedValue(undefined)

    await useCase.run(validParams)

    const publishedEvents = eventBus.publish.mock.calls[0][0]
    expect(publishedEvents.length).toBeGreaterThan(0)
  })

  it('should throw EstablishmentAlreadyConfigured and NOT call save when an establishment already exists', async () => {
    repository.exists.mockResolvedValue(true)

    await expect(useCase.run(validParams)).rejects.toThrow(EstablishmentAlreadyConfigured)

    expect(repository.save).not.toHaveBeenCalled()
    expect(eventBus.publish).not.toHaveBeenCalled()
  })
})
