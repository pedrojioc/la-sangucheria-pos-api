import { InventoryStockReservationAdapter } from '@contexts/orders/order/infrastructure/adapters/inventory-stock-reservation.adapter'
import { ReserveStock } from '@contexts/inventory/stock-level/application/reserve-stock/reserve-stock'
import { ReleaseStockForItem } from '@contexts/inventory/stock-level/application/release-stock/release-stock-for-item'
import { ReleaseStockForOrder } from '@contexts/inventory/stock-level/application/release-stock/release-stock-for-order'
import { ConsumeStockReservation } from '@contexts/inventory/stock-level/application/consume-stock-reservation/consume-stock-reservation'
import { InsufficientStockForReservation } from '@contexts/inventory/stock-level/domain/exceptions/insufficient-stock-for-reservation.exception'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('InventoryStockReservationAdapter', () => {
  let reserveStock: jest.Mocked<ReserveStock>
  let releaseStockForItem: jest.Mocked<ReleaseStockForItem>
  let releaseStockForOrder: jest.Mocked<ReleaseStockForOrder>
  let consumeStockReservation: jest.Mocked<ConsumeStockReservation>
  let adapter: InventoryStockReservationAdapter

  beforeEach(() => {
    reserveStock = { run: jest.fn() } as unknown as jest.Mocked<ReserveStock>
    releaseStockForItem = { run: jest.fn() } as unknown as jest.Mocked<ReleaseStockForItem>
    releaseStockForOrder = { run: jest.fn() } as unknown as jest.Mocked<ReleaseStockForOrder>
    consumeStockReservation = { run: jest.fn() } as unknown as jest.Mocked<ConsumeStockReservation>

    adapter = new InventoryStockReservationAdapter(
      reserveStock,
      releaseStockForItem,
      releaseStockForOrder,
      consumeStockReservation
    )
  })

  it('forwards reserve to ReserveStock.run with the same args', async () => {
    const orderId = UuidMother.random()
    const lines = [
      {
        itemId: UuidMother.random(),
        ingredientId: UuidMother.random(),
        quantity: 2,
        unitId: 'unit'
      }
    ]
    reserveStock.run.mockResolvedValue(undefined)

    await adapter.reserve(orderId, lines)

    expect(reserveStock.run).toHaveBeenCalledWith(orderId, lines)
  })

  it('passes through a rejection from reserve unwrapped', async () => {
    const orderId = UuidMother.random()
    const error = new InsufficientStockForReservation(UuidMother.random(), 2, 1)
    reserveStock.run.mockRejectedValue(error)

    await expect(adapter.reserve(orderId, [])).rejects.toBe(error)
  })

  it('forwards releaseForItem to ReleaseStockForItem.run with the same args', async () => {
    const orderId = UuidMother.random()
    const itemId = UuidMother.random()
    releaseStockForItem.run.mockResolvedValue(undefined)

    await adapter.releaseForItem(orderId, itemId)

    expect(releaseStockForItem.run).toHaveBeenCalledWith(orderId, itemId)
  })

  it('forwards releaseForOrder to ReleaseStockForOrder.run with the same args', async () => {
    const orderId = UuidMother.random()
    releaseStockForOrder.run.mockResolvedValue(undefined)

    await adapter.releaseForOrder(orderId)

    expect(releaseStockForOrder.run).toHaveBeenCalledWith(orderId)
  })

  it('forwards consume to ConsumeStockReservation.run and returns its result', async () => {
    const orderId = UuidMother.random()
    const itemId = UuidMother.random()
    consumeStockReservation.run.mockResolvedValue(true)

    const result = await adapter.consume(orderId, itemId, 'Venta de orden')

    expect(consumeStockReservation.run).toHaveBeenCalledWith(orderId, itemId, 'Venta de orden')
    expect(result).toBe(true)
  })
})
