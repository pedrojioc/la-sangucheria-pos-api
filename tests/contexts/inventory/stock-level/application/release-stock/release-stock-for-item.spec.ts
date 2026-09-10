import { ReleaseStockForItem } from '@contexts/inventory/stock-level/application/release-stock/release-stock-for-item'
import { StockReservationRepository } from '@contexts/inventory/stock-level/domain/repositories/stock-reservation.repository'
import { StockReservationMother } from '@test/contexts/inventory/stock-level/__mothers__/stock-reservation.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('ReleaseStockForItem', () => {
  let reservationRepository: jest.Mocked<StockReservationRepository>
  let releaseStockForItem: ReleaseStockForItem

  beforeEach(() => {
    reservationRepository = {
      save: jest.fn(),
      search: jest.fn(),
      findActiveByOrderItem: jest.fn(),
      findActiveByOrder: jest.fn(),
      sumActiveByIngredient: jest.fn()
    } as unknown as jest.Mocked<StockReservationRepository>

    releaseStockForItem = new ReleaseStockForItem(reservationRepository)
  })

  it('releases the ACTIVE reservation for the given order item', async () => {
    const orderId = UuidMother.random()
    const itemId = UuidMother.random()
    const reservation = StockReservationMother.forOrderItem(orderId, itemId)
    reservationRepository.findActiveByOrderItem.mockResolvedValue([reservation])

    await releaseStockForItem.run(orderId, itemId)

    expect(reservationRepository.save).toHaveBeenCalledTimes(1)
    expect(reservationRepository.save.mock.calls[0][0].toPrimitives().status).toBe('RELEASED')
  })

  it('is a no-op with no error when no ACTIVE reservation exists for the item', async () => {
    const orderId = UuidMother.random()
    const itemId = UuidMother.random()
    reservationRepository.findActiveByOrderItem.mockResolvedValue([])

    await expect(releaseStockForItem.run(orderId, itemId)).resolves.toBeUndefined()

    expect(reservationRepository.save).not.toHaveBeenCalled()
  })
})
