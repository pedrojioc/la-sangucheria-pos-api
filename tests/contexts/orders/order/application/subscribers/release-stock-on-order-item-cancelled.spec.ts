import { ReleaseStockOnOrderItemCancelled } from '@contexts/orders/order/application/subscribers/release-stock-on-order-item-cancelled'
import { StockReservationPort } from '@contexts/orders/order/application/ports/stock-reservation.port'
import { OrderItemCancelledEvent } from '@contexts/orders/order/domain/events/order-item-cancelled.event'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('ReleaseStockOnOrderItemCancelled', () => {
  let subscriber: ReleaseStockOnOrderItemCancelled
  let stockReservationPort: jest.Mocked<StockReservationPort>

  beforeEach(() => {
    stockReservationPort = {
      reserve: jest.fn(),
      releaseForItem: jest.fn(),
      releaseForOrder: jest.fn(),
      consume: jest.fn()
    } as any

    subscriber = new ReleaseStockOnOrderItemCancelled(stockReservationPort)
  })

  it('should subscribe to OrderItemCancelledEvent', () => {
    expect(subscriber.subscribedTo()).toContain(OrderItemCancelledEvent)
  })

  it('should call releaseForItem with the order and item ids', async () => {
    const orderId = UuidMother.random()
    const itemId = UuidMother.random()
    const event = new OrderItemCancelledEvent({
      orderId,
      itemId,
      reason: 'Out of stock',
      cancelledBy: UuidMother.random(),
      cancelledAt: new Date()
    })

    await subscriber.on(event)

    expect(stockReservationPort.releaseForItem).toHaveBeenCalledTimes(1)
    expect(stockReservationPort.releaseForItem).toHaveBeenCalledWith(orderId, itemId)
  })

  it('should propagate a release failure so the caller can roll back the transaction', async () => {
    const event = new OrderItemCancelledEvent({
      orderId: UuidMother.random(),
      itemId: UuidMother.random(),
      reason: 'Out of stock',
      cancelledBy: UuidMother.random(),
      cancelledAt: new Date()
    })
    stockReservationPort.releaseForItem.mockRejectedValue(new Error('release failed'))

    await expect(subscriber.on(event)).rejects.toThrow('release failed')
  })
})
