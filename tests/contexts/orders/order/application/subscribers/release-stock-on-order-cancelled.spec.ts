import { ReleaseStockOnOrderCancelled } from '@contexts/orders/order/application/subscribers/release-stock-on-order-cancelled'
import { StockReservationPort } from '@contexts/orders/order/application/ports/stock-reservation.port'
import { OrderCancelledEvent } from '@contexts/orders/order/domain/events/order-cancelled.event'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('ReleaseStockOnOrderCancelled', () => {
  let subscriber: ReleaseStockOnOrderCancelled
  let stockReservationPort: jest.Mocked<StockReservationPort>

  beforeEach(() => {
    stockReservationPort = {
      reserve: jest.fn(),
      releaseForItem: jest.fn(),
      releaseForOrder: jest.fn(),
      consume: jest.fn()
    } as any

    subscriber = new ReleaseStockOnOrderCancelled(stockReservationPort)
  })

  it('should subscribe to OrderCancelledEvent', () => {
    expect(subscriber.subscribedTo()).toContain(OrderCancelledEvent)
  })

  it('should call releaseForOrder with the order id', async () => {
    const orderId = UuidMother.random()
    const event = new OrderCancelledEvent({
      orderId,
      reason: 'Customer left',
      cancelledBy: UuidMother.random(),
      cancelledAt: new Date(),
      tableId: null,
      customerId: null,
      total: 0,
      currency: 'COP'
    })

    await subscriber.on(event)

    expect(stockReservationPort.releaseForOrder).toHaveBeenCalledTimes(1)
    expect(stockReservationPort.releaseForOrder).toHaveBeenCalledWith(orderId)
  })

  it('should propagate a release failure so the caller can roll back the transaction', async () => {
    const event = new OrderCancelledEvent({
      orderId: UuidMother.random(),
      reason: 'Customer left',
      cancelledBy: UuidMother.random(),
      cancelledAt: new Date(),
      tableId: null,
      customerId: null,
      total: 0,
      currency: 'COP'
    })
    stockReservationPort.releaseForOrder.mockRejectedValue(new Error('release failed'))

    await expect(subscriber.on(event)).rejects.toThrow('release failed')
  })
})
