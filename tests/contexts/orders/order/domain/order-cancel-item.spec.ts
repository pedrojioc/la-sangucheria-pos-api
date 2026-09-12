import { OrderStatus } from '@contexts/orders/order/domain/order-status'
import { OrderCannotBeModified } from '@contexts/orders/order/domain/exceptions/order-cannot-be-modified.exception'
import { OrderItemAlreadyDelivered } from '@contexts/orders/order/domain/exceptions/order-item-already-delivered.exception'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { OrderMother } from '../__mothers__/order.mother'
import { OrderItemMother } from '../__mothers__/order-item.mother'

describe('Order - cancelItem', () => {
  it('should allow cancelling a pending item when order is READY (account still open)', () => {
    const pendingItemId = UuidMother.random()
    const order = OrderMother.create({
      status: OrderStatus.READY,
      items: [OrderItemMother.delivered(), OrderItemMother.pending({ id: pendingItemId })]
    })

    expect(() => order.cancelItem(pendingItemId, 'Client changed mind', 'waiter-1')).not.toThrow()
  })

  it('should still reject cancelling an already delivered item regardless of order status', () => {
    const deliveredItemId = UuidMother.random()
    const order = OrderMother.create({
      status: OrderStatus.READY,
      items: [OrderItemMother.delivered({ id: deliveredItemId })]
    })

    expect(() => order.cancelItem(deliveredItemId, 'reason', 'waiter-1')).toThrow(
      OrderItemAlreadyDelivered
    )
  })

  it('should throw OrderCannotBeModified when order is CLOSED', () => {
    const itemId = UuidMother.random()
    const order = OrderMother.create({
      status: OrderStatus.CLOSED,
      items: [OrderItemMother.delivered({ id: itemId })]
    })

    expect(() => order.cancelItem(itemId, 'reason', 'waiter-1')).toThrow(OrderCannotBeModified)
  })
})
