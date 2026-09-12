import { OrderStatus } from '@contexts/orders/order/domain/order-status'
import { OrderItemsAddedEvent } from '@contexts/orders/order/domain/events/order-items-added.event'
import { OrderCannotBeModified } from '@contexts/orders/order/domain/exceptions/order-cannot-be-modified.exception'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { OrderMother } from '../__mothers__/order.mother'

describe('Order - addItems', () => {
  const newItemInput = () => ({
    id: UuidMother.random(),
    productId: UuidMother.random(),
    productName: 'Coctel de la casa',
    unitPrice: 25000,
    currency: 'COP',
    quantity: 1,
    modifiers: [],
    notes: null
  })

  it('should allow adding items when order is OPEN', () => {
    const order = OrderMother.create({ status: OrderStatus.OPEN })

    expect(() => order.addItems([newItemInput()])).not.toThrow()
  })

  it('should allow adding items when order is IN_PROGRESS', () => {
    const order = OrderMother.inProgress()

    expect(() => order.addItems([newItemInput()])).not.toThrow()
  })

  it('should allow adding items when order is READY, keeping status READY', () => {
    const order = OrderMother.readyToClose()

    order.addItems([newItemInput()])

    expect(order.getStatus()).toBe(OrderStatus.READY)
  })

  it('should record OrderItemsAddedEvent when adding items to a READY order', () => {
    const order = OrderMother.readyToClose()
    const input = newItemInput()

    order.pullDomainEvents()
    order.addItems([input])

    const events = order.pullDomainEvents()
    const addedEvent = events.find(e => e instanceof OrderItemsAddedEvent)
    expect(addedEvent).toBeDefined()
    expect((addedEvent as OrderItemsAddedEvent).toPrimitives().itemIds).toContain(input.id)
  })

  it('should throw OrderCannotBeModified when order is CLOSED', () => {
    const order = OrderMother.create({ status: OrderStatus.CLOSED })

    expect(() => order.addItems([newItemInput()])).toThrow(OrderCannotBeModified)
  })

  it('should throw OrderCannotBeModified when order is CANCELLED', () => {
    const order = OrderMother.create({ status: OrderStatus.CANCELLED })

    expect(() => order.addItems([newItemInput()])).toThrow(OrderCannotBeModified)
  })
})
