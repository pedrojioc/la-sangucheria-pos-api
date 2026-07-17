import { ApplyItemDiscount } from '@contexts/orders/order/application/apply-item-discount/apply-item-discount'
import { RemoveItemDiscount } from '@contexts/orders/order/application/remove-item-discount/remove-item-discount'
import { ApplyOrderDiscount } from '@contexts/orders/order/application/apply-order-discount/apply-order-discount'
import { RemoveOrderDiscount } from '@contexts/orders/order/application/remove-order-discount/remove-order-discount'
import { FindOrder } from '@contexts/orders/order/application/find/find-order'
import { OrderRepository } from '@contexts/orders/order/domain/repositories/order.repository'
import { EventBus } from '@shared/domain/events'
import { DiscountType } from '@contexts/orders/order/domain/discount-type'
import { DiscountMethod } from '@contexts/orders/order/domain/discount-method'
import { OrderStatus } from '@contexts/orders/order/domain/order-status'
import { OrderItemDiscountAppliedEvent } from '@contexts/orders/order/domain/events/order-item-discount-applied.event'
import { OrderItemDiscountRemovedEvent } from '@contexts/orders/order/domain/events/order-item-discount-removed.event'
import { OrderDiscountAppliedEvent } from '@contexts/orders/order/domain/events/order-discount-applied.event'
import { OrderDiscountRemovedEvent } from '@contexts/orders/order/domain/events/order-discount-removed.event'
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

describe('ApplyItemDiscount use case', () => {
  let repository: jest.Mocked<OrderRepository>
  let eventBus: jest.Mocked<EventBus>
  let useCase: ApplyItemDiscount

  beforeEach(() => {
    repository = makeRepository()
    eventBus = makeEventBus()
    useCase = new ApplyItemDiscount(repository, new FindOrder(repository), eventBus)
  })

  it('should publish OrderItemDiscountAppliedEvent after saving', async () => {
    const orderId = UuidMother.random()
    const itemId = UuidMother.random()
    const order = OrderMother.create({
      id: orderId,
      status: OrderStatus.OPEN,
      items: [OrderItemMother.pending({ id: itemId, unitPrice: 20000, quantity: 1 })]
    })
    repository.search.mockResolvedValue(order)

    await useCase.run(
      orderId,
      itemId,
      DiscountType.EMPLOYEE,
      DiscountMethod.PERCENTAGE,
      10,
      'user-1'
    )

    expect(repository.save).toHaveBeenCalledTimes(1)
    expect(eventBus.publish).toHaveBeenCalledTimes(1)
    const publishedEvents = (eventBus.publish as jest.Mock).mock.calls[0][0]
    expect(publishedEvents).toHaveLength(1)
    expect(publishedEvents[0]).toBeInstanceOf(OrderItemDiscountAppliedEvent)
  })

  it('should publish after save, not before', async () => {
    const callOrder: string[] = []
    const orderId = UuidMother.random()
    const itemId = UuidMother.random()
    const order = OrderMother.create({
      id: orderId,
      status: OrderStatus.OPEN,
      items: [OrderItemMother.pending({ id: itemId, unitPrice: 20000, quantity: 1 })]
    })
    repository.search.mockResolvedValue(order)
    repository.save.mockImplementation(async () => {
      callOrder.push('save')
    })
    eventBus.publish.mockImplementation(async () => {
      callOrder.push('publish')
    })

    await useCase.run(
      orderId,
      itemId,
      DiscountType.EMPLOYEE,
      DiscountMethod.PERCENTAGE,
      10,
      'user-1'
    )

    expect(callOrder).toEqual(['save', 'publish'])
  })
})

describe('RemoveItemDiscount use case', () => {
  let repository: jest.Mocked<OrderRepository>
  let eventBus: jest.Mocked<EventBus>
  let useCase: RemoveItemDiscount

  beforeEach(() => {
    repository = makeRepository()
    eventBus = makeEventBus()
    useCase = new RemoveItemDiscount(repository, new FindOrder(repository), eventBus)
  })

  it('should publish OrderItemDiscountRemovedEvent after saving', async () => {
    const orderId = UuidMother.random()
    const itemId = UuidMother.random()
    const order = OrderMother.create({
      id: orderId,
      status: OrderStatus.OPEN,
      items: [OrderItemMother.pending({ id: itemId, unitPrice: 20000, quantity: 1 })]
    })
    // Apply a discount first so remove has something to remove
    const { Discount } = await import('@contexts/orders/order/domain/discount')
    order.applyItemDiscount(
      itemId,
      Discount.create(DiscountType.PROMO, DiscountMethod.FLAT, 1000, 'u1')
    )
    order.pullDomainEvents() // drain pre-existing events
    repository.search.mockResolvedValue(order)

    await useCase.run(orderId, itemId)

    expect(eventBus.publish).toHaveBeenCalledTimes(1)
    const publishedEvents = (eventBus.publish as jest.Mock).mock.calls[0][0]
    expect(publishedEvents).toHaveLength(1)
    expect(publishedEvents[0]).toBeInstanceOf(OrderItemDiscountRemovedEvent)
  })
})

describe('ApplyOrderDiscount use case', () => {
  let repository: jest.Mocked<OrderRepository>
  let eventBus: jest.Mocked<EventBus>
  let useCase: ApplyOrderDiscount

  beforeEach(() => {
    repository = makeRepository()
    eventBus = makeEventBus()
    useCase = new ApplyOrderDiscount(repository, new FindOrder(repository), eventBus)
  })

  it('should publish OrderDiscountAppliedEvent after saving', async () => {
    const orderId = UuidMother.random()
    const order = OrderMother.create({ id: orderId, status: OrderStatus.OPEN })
    repository.search.mockResolvedValue(order)

    await useCase.run(orderId, DiscountType.HAPPY_HOUR, DiscountMethod.PERCENTAGE, 10, 'user-1')

    expect(repository.save).toHaveBeenCalledTimes(1)
    expect(eventBus.publish).toHaveBeenCalledTimes(1)
    const publishedEvents = (eventBus.publish as jest.Mock).mock.calls[0][0]
    expect(publishedEvents).toHaveLength(1)
    expect(publishedEvents[0]).toBeInstanceOf(OrderDiscountAppliedEvent)
  })
})

describe('RemoveOrderDiscount use case', () => {
  let repository: jest.Mocked<OrderRepository>
  let eventBus: jest.Mocked<EventBus>
  let useCase: RemoveOrderDiscount

  beforeEach(() => {
    repository = makeRepository()
    eventBus = makeEventBus()
    useCase = new RemoveOrderDiscount(repository, new FindOrder(repository), eventBus)
  })

  it('should publish OrderDiscountRemovedEvent after saving', async () => {
    const orderId = UuidMother.random()
    const order = OrderMother.create({ id: orderId, status: OrderStatus.OPEN })
    const { Discount } = await import('@contexts/orders/order/domain/discount')
    order.applyOrderDiscount(Discount.create(DiscountType.PROMO, DiscountMethod.FLAT, 500, 'u1'))
    order.pullDomainEvents() // drain
    repository.search.mockResolvedValue(order)

    await useCase.run(orderId)

    expect(repository.save).toHaveBeenCalledTimes(1)
    expect(eventBus.publish).toHaveBeenCalledTimes(1)
    const publishedEvents = (eventBus.publish as jest.Mock).mock.calls[0][0]
    expect(publishedEvents).toHaveLength(1)
    expect(publishedEvents[0]).toBeInstanceOf(OrderDiscountRemovedEvent)
  })
})
