import { ReleaseStockForOrder } from '@contexts/inventory/stock-level/application/release-stock/release-stock-for-order'
import { StockReservationRepository } from '@contexts/inventory/stock-level/domain/repositories/stock-reservation.repository'
import { StockReservationStatus } from '@contexts/inventory/stock-level/domain/stock-reservation-status'
import { StockReservationMother } from '@test/contexts/inventory/stock-level/__mothers__/stock-reservation.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('ReleaseStockForOrder', () => {
  let reservationRepository: jest.Mocked<StockReservationRepository>
  let releaseStockForOrder: ReleaseStockForOrder

  beforeEach(() => {
    reservationRepository = {
      save: jest.fn(),
      search: jest.fn(),
      findActiveByOrderItem: jest.fn(),
      findActiveByOrder: jest.fn(),
      sumActiveByIngredient: jest.fn()
    } as unknown as jest.Mocked<StockReservationRepository>

    releaseStockForOrder = new ReleaseStockForOrder(reservationRepository)
  })

  it('releases only ACTIVE reservations returned for the order', async () => {
    const orderId = UuidMother.random()
    const active1 = StockReservationMother.create({
      orderId,
      status: StockReservationStatus.ACTIVE
    })
    const active2 = StockReservationMother.create({
      orderId,
      status: StockReservationStatus.ACTIVE
    })
    reservationRepository.findActiveByOrder.mockResolvedValue([active1, active2])

    await releaseStockForOrder.run(orderId)

    expect(reservationRepository.save).toHaveBeenCalledTimes(2)
    for (const call of reservationRepository.save.mock.calls) {
      expect(call[0].toPrimitives().status).toBe('RELEASED')
    }
  })

  it('is a no-op with no error when the order has no ACTIVE reservations', async () => {
    const orderId = UuidMother.random()
    reservationRepository.findActiveByOrder.mockResolvedValue([])

    await expect(releaseStockForOrder.run(orderId)).resolves.toBeUndefined()

    expect(reservationRepository.save).not.toHaveBeenCalled()
  })

  it('repeating whole-order release is a no-op the second time', async () => {
    const orderId = UuidMother.random()
    reservationRepository.findActiveByOrder.mockResolvedValueOnce([
      StockReservationMother.create({ orderId, status: StockReservationStatus.ACTIVE })
    ])
    await releaseStockForOrder.run(orderId)
    expect(reservationRepository.save).toHaveBeenCalledTimes(1)

    reservationRepository.save.mockClear()
    reservationRepository.findActiveByOrder.mockResolvedValueOnce([])
    await releaseStockForOrder.run(orderId)

    expect(reservationRepository.save).not.toHaveBeenCalled()
  })
})
