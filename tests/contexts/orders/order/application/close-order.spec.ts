import { CloseOrder } from '@contexts/orders/order/application/close/close-order'
import { FindOrder } from '@contexts/orders/order/application/find/find-order'
import { OrderRepository } from '@contexts/orders/order/domain/repositories/order.repository'
import { EventBus } from '@shared/domain/events'
import { OrderClosedEvent } from '@contexts/orders/order/domain/events/order-closed.event'
import { OrderStatus } from '@contexts/orders/order/domain/order-status'
import { TaxType } from '@contexts/orders/order/domain/tax-type'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { OrderMother } from '../__mothers__/order.mother'
import { OrderItemMother } from '../__mothers__/order-item.mother'

function makeRepository(): jest.Mocked<OrderRepository> {
  return {
    save: jest.fn(),
    search: jest.fn(),
    nextOrderNumber: jest.fn(),
    searchWithActiveKitchenItems: jest.fn()
  } as jest.Mocked<OrderRepository>
}

function makeEventBus(): jest.Mocked<EventBus> {
  return {
    publish: jest.fn(),
    addSubscribers: jest.fn()
  } as unknown as jest.Mocked<EventBus>
}

describe('CloseOrder use case', () => {
  let repository: jest.Mocked<OrderRepository>
  let eventBus: jest.Mocked<EventBus>
  let useCase: CloseOrder

  beforeEach(() => {
    repository = makeRepository()
    eventBus = makeEventBus()
    useCase = new CloseOrder(repository, new FindOrder(repository), eventBus)
  })

  describe('Scenario: Enriched payload values are correct (REQ-2)', () => {
    it('should publish OrderClosedEvent with fiscal fields populated for a 2-item 19% IVA order', async () => {
      // Arrange
      const orderId = UuidMother.random()
      const closedBy = UuidMother.random()
      const order = OrderMother.create({
        id: orderId,
        status: OrderStatus.IN_PROGRESS,
        taxConfig: { rate: 0.19, type: TaxType.IVA, inclusive: true },
        items: [
          OrderItemMother.ready({ unitPrice: 10000, quantity: 1, currency: 'COP' }),
          OrderItemMother.ready({ unitPrice: 15000, quantity: 2, currency: 'COP' })
        ]
      })
      repository.search.mockResolvedValue(order)

      // Act
      await useCase.run(orderId, [{ method: 'CASH', amount: 40000 }], closedBy)

      // Assert — event published
      expect(repository.save).toHaveBeenCalledTimes(1)
      expect(eventBus.publish).toHaveBeenCalledTimes(1)
      const publishedEvents = (eventBus.publish as jest.Mock).mock.calls[0][0]
      const closedEvent = publishedEvents.find((e: unknown) => e instanceof OrderClosedEvent) as OrderClosedEvent
      expect(closedEvent).toBeInstanceOf(OrderClosedEvent)

      const payload = closedEvent.toPrimitives()

      // Fiscal fields
      expect(payload.subtotal).toBeCloseTo(40000, 2)
      expect(payload.discountTotal).toBeCloseTo(0, 2)
      expect(payload.taxBase).toBeCloseTo(33613.45, 2)
      expect(payload.taxAmount).toBeCloseTo(6386.55, 2)
      expect(payload.total).toBeCloseTo(40000, 2)
      expect(payload.taxConfig.rate).toBe(0.19)
      expect(payload.taxConfig.inclusive).toBe(true)
      expect(payload.items).toHaveLength(2)
    })
  })

  describe('Scenario: Named-invoice fields forwarded when params present (REQ-2)', () => {
    it('should forward customerDocumentType and customerDocumentNumber to the event', async () => {
      // Arrange
      const orderId = UuidMother.random()
      const order = OrderMother.create({
        id: orderId,
        status: OrderStatus.IN_PROGRESS,
        taxConfig: { rate: 0.19, type: TaxType.IVA, inclusive: true },
        items: [OrderItemMother.ready({ unitPrice: 10000, quantity: 1, currency: 'COP' })]
      })
      repository.search.mockResolvedValue(order)

      // Act — pass customer document params
      await useCase.run(
        orderId,
        [{ method: 'CASH', amount: 10000 }],
        UuidMother.random(),
        null,
        null,
        'NIT',
        '900123456'
      )

      // Assert
      const publishedEvents = (eventBus.publish as jest.Mock).mock.calls[0][0]
      const closedEvent = publishedEvents.find((e: unknown) => e instanceof OrderClosedEvent) as OrderClosedEvent
      const payload = closedEvent.toPrimitives()

      expect(payload.customerDocumentType).toBe('NIT')
      expect(payload.customerDocumentNumber).toBe('900123456')
    })
  })

  describe('Scenario: Consumidor Final path when params absent (REQ-2)', () => {
    it('should set customerDocumentType and customerDocumentNumber to null when not provided', async () => {
      // Arrange
      const orderId = UuidMother.random()
      const order = OrderMother.create({
        id: orderId,
        status: OrderStatus.IN_PROGRESS,
        taxConfig: { rate: 0.19, type: TaxType.IVA, inclusive: true },
        items: [OrderItemMother.ready({ unitPrice: 10000, quantity: 1, currency: 'COP' })]
      })
      repository.search.mockResolvedValue(order)

      // Act — no customer document params at all
      await useCase.run(
        orderId,
        [{ method: 'CASH', amount: 10000 }],
        UuidMother.random()
      )

      // Assert
      const publishedEvents = (eventBus.publish as jest.Mock).mock.calls[0][0]
      const closedEvent = publishedEvents.find((e: unknown) => e instanceof OrderClosedEvent) as OrderClosedEvent
      const payload = closedEvent.toPrimitives()

      expect(payload.customerDocumentType).toBeNull()
      expect(payload.customerDocumentNumber).toBeNull()
    })

    it('should set customerDocumentType and customerDocumentNumber to null when params are undefined', async () => {
      // Arrange
      const orderId = UuidMother.random()
      const order = OrderMother.create({
        id: orderId,
        status: OrderStatus.IN_PROGRESS,
        taxConfig: { rate: 0.19, type: TaxType.IVA, inclusive: true },
        items: [OrderItemMother.ready({ unitPrice: 10000, quantity: 1, currency: 'COP' })]
      })
      repository.search.mockResolvedValue(order)

      // Act — explicitly pass undefined
      await useCase.run(
        orderId,
        [{ method: 'CASH', amount: 10000 }],
        UuidMother.random(),
        undefined,
        undefined,
        undefined,
        undefined
      )

      // Assert
      const publishedEvents = (eventBus.publish as jest.Mock).mock.calls[0][0]
      const closedEvent = publishedEvents.find((e: unknown) => e instanceof OrderClosedEvent) as OrderClosedEvent
      const payload = closedEvent.toPrimitives()

      expect(payload.customerDocumentType).toBeNull()
      expect(payload.customerDocumentNumber).toBeNull()
    })
  })
})
