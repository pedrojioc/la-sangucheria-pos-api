import { CloseOrder } from '@contexts/orders/order/application/close/close-order'
import { FindOrder } from '@contexts/orders/order/application/find/find-order'
import { OrderRepository } from '@contexts/orders/order/domain/repositories/order.repository'
import { EventBus } from '@shared/domain/events'
import { EstablishmentSettingsPort } from '@contexts/orders/order/application/ports/establishment-settings.port'
import { TipSuggestionsNotConfigured } from '@contexts/orders/order/application/exceptions/tip-suggestions-not-configured.exception'
import { TipSuggestionIndexOutOfRange } from '@contexts/orders/order/application/exceptions/tip-suggestion-index-out-of-range.exception'
import { OrderClosedEvent } from '@contexts/orders/order/domain/events/order-closed.event'
import { OrderStatus } from '@contexts/orders/order/domain/order-status'
import { TaxType } from '@contexts/orders/order/domain/tax-type'
import { DiscountType } from '@contexts/orders/order/domain/discount-type'
import { DiscountMethod } from '@contexts/orders/order/domain/discount-method'
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

function makeEstablishmentSettingsPort(
  tipSuggestions: number[] | null = null
): jest.Mocked<EstablishmentSettingsPort> {
  return {
    resolve: jest.fn().mockResolvedValue({
      currency: 'COP',
      taxRate: 0.19,
      taxType: TaxType.IVA,
      taxInclusive: true,
      enabledOrderTypes: ['DINE_IN', 'DELIVERY', 'TAKEOUT'],
      tipSuggestions
    })
  } as unknown as jest.Mocked<EstablishmentSettingsPort>
}

describe('CloseOrder use case', () => {
  let repository: jest.Mocked<OrderRepository>
  let eventBus: jest.Mocked<EventBus>
  let settingsPort: jest.Mocked<EstablishmentSettingsPort>
  let useCase: CloseOrder

  beforeEach(() => {
    repository = makeRepository()
    eventBus = makeEventBus()
    settingsPort = makeEstablishmentSettingsPort()
    useCase = new CloseOrder(repository, new FindOrder(repository), eventBus, settingsPort)
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
      await useCase.run(orderId, [{ method: 'CASH', amount: 40000 }], closedBy, { kind: 'NONE' })

      // Assert — event published
      expect(repository.save).toHaveBeenCalledTimes(1)
      expect(eventBus.publish).toHaveBeenCalledTimes(1)
      const publishedEvents = (eventBus.publish as jest.Mock).mock.calls[0][0]
      const closedEvent = publishedEvents.find(
        (e: unknown) => e instanceof OrderClosedEvent
      ) as OrderClosedEvent
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
        { kind: 'NONE' },
        null,
        'NIT',
        '900123456'
      )

      // Assert
      const publishedEvents = (eventBus.publish as jest.Mock).mock.calls[0][0]
      const closedEvent = publishedEvents.find(
        (e: unknown) => e instanceof OrderClosedEvent
      ) as OrderClosedEvent
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
      await useCase.run(orderId, [{ method: 'CASH', amount: 10000 }], UuidMother.random(), {
        kind: 'NONE'
      })

      // Assert
      const publishedEvents = (eventBus.publish as jest.Mock).mock.calls[0][0]
      const closedEvent = publishedEvents.find(
        (e: unknown) => e instanceof OrderClosedEvent
      ) as OrderClosedEvent
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

      // Act — explicitly pass undefined for the optional trailing params
      await useCase.run(
        orderId,
        [{ method: 'CASH', amount: 10000 }],
        UuidMother.random(),
        { kind: 'NONE' },
        undefined,
        undefined,
        undefined
      )

      // Assert
      const publishedEvents = (eventBus.publish as jest.Mock).mock.calls[0][0]
      const closedEvent = publishedEvents.find(
        (e: unknown) => e instanceof OrderClosedEvent
      ) as OrderClosedEvent
      const payload = closedEvent.toPrimitives()

      expect(payload.customerDocumentType).toBeNull()
      expect(payload.customerDocumentNumber).toBeNull()
    })
  })

  describe('Scenario: Tip computed from an INDEX selection', () => {
    it('computes tipAmount = round2((subtotal - discountTotal) * tipSuggestions[index]) for a mid-tuple index', async () => {
      // Arrange — no tax (INC, 0%) to keep totals easy to reason about
      const orderId = UuidMother.random()
      const order = OrderMother.create({
        id: orderId,
        status: OrderStatus.IN_PROGRESS,
        taxConfig: { rate: 0, type: TaxType.INC, inclusive: true },
        orderDiscount: {
          type: DiscountType.MANAGER,
          method: DiscountMethod.FLAT,
          value: 20000,
          reason: null,
          appliedBy: UuidMother.random()
        },
        items: [OrderItemMother.ready({ unitPrice: 100000, quantity: 1, currency: 'COP' })]
      })
      repository.search.mockResolvedValue(order)
      settingsPort = makeEstablishmentSettingsPort([0.05, 0.1, 0.15])
      useCase = new CloseOrder(repository, new FindOrder(repository), eventBus, settingsPort)

      // subtotal = 100000, discountTotal = 20000 -> netBase = 80000
      // tipAmount = 80000 * 0.10 = 8000
      // orderTotal = netBase = 80000 (no tax, no delivery fee, no tip yet)
      // payments must cover orderTotal + tipAmount = 88000

      // Act
      await useCase.run(orderId, [{ method: 'CASH', amount: 88000 }], UuidMother.random(), {
        kind: 'INDEX',
        index: 1
      })

      // Assert
      expect(repository.save).toHaveBeenCalledTimes(1)
      const publishedEvents = (eventBus.publish as jest.Mock).mock.calls[0][0]
      const closedEvent = publishedEvents.find(
        (e: unknown) => e instanceof OrderClosedEvent
      ) as OrderClosedEvent
      const payload = closedEvent.toPrimitives()

      expect(payload.tip).toBeCloseTo(8000, 2)
    })

    it('throws TipSuggestionsNotConfigured before order.close()/save()/publish() when tipSuggestions is null', async () => {
      // Arrange
      const orderId = UuidMother.random()
      const order = OrderMother.create({
        id: orderId,
        status: OrderStatus.IN_PROGRESS,
        taxConfig: { rate: 0.19, type: TaxType.IVA, inclusive: true },
        items: [OrderItemMother.ready({ unitPrice: 10000, quantity: 1, currency: 'COP' })]
      })
      repository.search.mockResolvedValue(order)
      settingsPort = makeEstablishmentSettingsPort(null)
      useCase = new CloseOrder(repository, new FindOrder(repository), eventBus, settingsPort)

      // Act / Assert
      await expect(
        useCase.run(orderId, [{ method: 'CASH', amount: 10000 }], UuidMother.random(), {
          kind: 'INDEX',
          index: 0
        })
      ).rejects.toThrow(TipSuggestionsNotConfigured)

      expect(repository.save).not.toHaveBeenCalled()
      expect(eventBus.publish).not.toHaveBeenCalled()
    })

    it('throws TipSuggestionIndexOutOfRange when index is outside the configured suggestions', async () => {
      // Arrange
      const orderId = UuidMother.random()
      const order = OrderMother.create({
        id: orderId,
        status: OrderStatus.IN_PROGRESS,
        taxConfig: { rate: 0.19, type: TaxType.IVA, inclusive: true },
        items: [OrderItemMother.ready({ unitPrice: 10000, quantity: 1, currency: 'COP' })]
      })
      repository.search.mockResolvedValue(order)
      settingsPort = makeEstablishmentSettingsPort([0.05, 0.1, 0.15])
      useCase = new CloseOrder(repository, new FindOrder(repository), eventBus, settingsPort)

      // Act / Assert
      await expect(
        useCase.run(orderId, [{ method: 'CASH', amount: 10000 }], UuidMother.random(), {
          kind: 'INDEX',
          index: 3
        })
      ).rejects.toThrow(TipSuggestionIndexOutOfRange)

      expect(repository.save).not.toHaveBeenCalled()
      expect(eventBus.publish).not.toHaveBeenCalled()
    })

    it('throws TipSuggestionIndexOutOfRange when the establishment has only 1 suggestion configured and index 1 is selected', async () => {
      // Arrange
      const orderId = UuidMother.random()
      const order = OrderMother.create({
        id: orderId,
        status: OrderStatus.IN_PROGRESS,
        taxConfig: { rate: 0.19, type: TaxType.IVA, inclusive: true },
        items: [OrderItemMother.ready({ unitPrice: 10000, quantity: 1, currency: 'COP' })]
      })
      repository.search.mockResolvedValue(order)
      settingsPort = makeEstablishmentSettingsPort([0.1])
      useCase = new CloseOrder(repository, new FindOrder(repository), eventBus, settingsPort)

      // Act / Assert
      await expect(
        useCase.run(orderId, [{ method: 'CASH', amount: 10000 }], UuidMother.random(), {
          kind: 'INDEX',
          index: 1
        })
      ).rejects.toThrow(TipSuggestionIndexOutOfRange)

      expect(repository.save).not.toHaveBeenCalled()
      expect(eventBus.publish).not.toHaveBeenCalled()
    })

    it('succeeds with NONE selection regardless of tipSuggestions config, including null', async () => {
      // Arrange
      const orderId = UuidMother.random()
      const order = OrderMother.create({
        id: orderId,
        status: OrderStatus.IN_PROGRESS,
        taxConfig: { rate: 0.19, type: TaxType.IVA, inclusive: true },
        items: [OrderItemMother.ready({ unitPrice: 10000, quantity: 1, currency: 'COP' })]
      })
      repository.search.mockResolvedValue(order)
      settingsPort = makeEstablishmentSettingsPort(null)
      useCase = new CloseOrder(repository, new FindOrder(repository), eventBus, settingsPort)

      // Act
      await useCase.run(orderId, [{ method: 'CASH', amount: 10000 }], UuidMother.random(), {
        kind: 'NONE'
      })

      // Assert
      expect(repository.save).toHaveBeenCalledTimes(1)
      const publishedEvents = (eventBus.publish as jest.Mock).mock.calls[0][0]
      const closedEvent = publishedEvents.find(
        (e: unknown) => e instanceof OrderClosedEvent
      ) as OrderClosedEvent
      const payload = closedEvent.toPrimitives()

      expect(payload.tip).toBeNull()
    })

    it('rounds a non-terminating-decimal tip to 2 decimals and reconciles within tolerance', async () => {
      // Arrange — no tax to isolate the tip-rounding behavior
      const orderId = UuidMother.random()
      const order = OrderMother.create({
        id: orderId,
        status: OrderStatus.IN_PROGRESS,
        taxConfig: { rate: 0, type: TaxType.INC, inclusive: true },
        items: [OrderItemMother.ready({ unitPrice: 33333.33, quantity: 1, currency: 'COP' })]
      })
      repository.search.mockResolvedValue(order)
      settingsPort = makeEstablishmentSettingsPort([0.05, 0.1, 0.15])
      useCase = new CloseOrder(repository, new FindOrder(repository), eventBus, settingsPort)

      // netBase = 33333.33, tipAmount = round2(33333.33 * 0.10) = 3333.33
      // orderTotal = 33333.33, payments must cover orderTotal + tipAmount = 36666.66

      // Act
      await useCase.run(orderId, [{ method: 'CASH', amount: 36666.66 }], UuidMother.random(), {
        kind: 'INDEX',
        index: 1
      })

      // Assert
      expect(repository.save).toHaveBeenCalledTimes(1)
      const publishedEvents = (eventBus.publish as jest.Mock).mock.calls[0][0]
      const closedEvent = publishedEvents.find(
        (e: unknown) => e instanceof OrderClosedEvent
      ) as OrderClosedEvent
      const payload = closedEvent.toPrimitives()

      expect(payload.tip).toBeCloseTo(3333.33, 2)
    })
  })
})
