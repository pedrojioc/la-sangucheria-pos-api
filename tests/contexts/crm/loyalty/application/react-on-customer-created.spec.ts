import { ReactOnCustomerCreated } from '@/contexts/crm/loyalty/application/subscribers/react-on-customer-created'
import { LoyaltyAccountRepository } from '@/contexts/crm/loyalty/domain/repositories/loyalty-account.repository'
import { CustomerCreatedEvent } from '@/contexts/crm/customer/domain/events/customer-created.event'
import { LoyaltyAccountCreatedEvent } from '@/contexts/crm/loyalty/domain/events/loyalty-account-created.event'
import { LoyaltyAccount } from '@/contexts/crm/loyalty/domain/loyalty-account'
import { EventBus } from '@/shared/domain/events'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('ReactOnCustomerCreated', () => {
  let subscriber: ReactOnCustomerCreated
  let repository: jest.Mocked<LoyaltyAccountRepository>
  let eventBus: jest.Mocked<EventBus>

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      findByCustomer: jest.fn()
    } as any

    eventBus = { publish: jest.fn() } as any
    subscriber = new ReactOnCustomerCreated(repository, eventBus)
  })

  it('should subscribe to CustomerCreatedEvent', () => {
    const subscribed = subscriber.subscribedTo()
    expect(subscribed).toContain(CustomerCreatedEvent)
  })

  it('should create a LoyaltyAccount with points=0 when customer is created', async () => {
    const customerId = UuidMother.random()
    const event = new CustomerCreatedEvent({
      customerId,
      name: 'Test Customer',
      phone: '+57300',
      documentType: 'CC',
      documentNumber: '123'
    })

    await subscriber.on(event)

    expect(repository.save).toHaveBeenCalledTimes(1)
    const saved = repository.save.mock.calls[0][0] as LoyaltyAccount
    const p = saved.toPrimitives()
    expect(p.customerId).toBe(customerId)
    expect(p.points).toBe(0)
  })

  it('should publish LoyaltyAccountCreatedEvent', async () => {
    const event = new CustomerCreatedEvent({
      customerId: UuidMother.random(),
      name: 'Test',
      phone: '+57300',
      documentType: 'CC',
      documentNumber: '123'
    })

    await subscriber.on(event)

    expect(eventBus.publish).toHaveBeenCalledTimes(1)
    const events = eventBus.publish.mock.calls[0][0]
    expect(events[0]).toBeInstanceOf(LoyaltyAccountCreatedEvent)
    expect(events[0].eventName).toBe('loyalty-account.created')
  })

  it('should link LoyaltyAccount to the correct customerId', async () => {
    const customerId = UuidMother.random()
    const event = new CustomerCreatedEvent({
      customerId,
      name: 'Test',
      phone: '+57300',
      documentType: 'NIT',
      documentNumber: '900'
    })

    await subscriber.on(event)

    const saved = repository.save.mock.calls[0][0] as LoyaltyAccount
    expect(saved.toPrimitives().customerId).toBe(customerId)
    const publishedEvents = eventBus.publish.mock.calls[0][0]
    expect(publishedEvents[0].payload.customerId).toBe(customerId)
  })
})
