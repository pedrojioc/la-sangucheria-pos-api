import { ConsumeStockReservation } from '@contexts/inventory/stock-level/application/consume-stock-reservation/consume-stock-reservation'
import { StockReservationRepository } from '@contexts/inventory/stock-level/domain/repositories/stock-reservation.repository'
import { DeductIngredient } from '@contexts/inventory/stock-level/application/deduct/deduct-ingredient'
import { StockReservationMother } from '@test/contexts/inventory/stock-level/__mothers__/stock-reservation.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('ConsumeStockReservation', () => {
  let reservationRepository: jest.Mocked<StockReservationRepository>
  let deductIngredient: jest.Mocked<DeductIngredient>
  let consumeStockReservation: ConsumeStockReservation

  beforeEach(() => {
    reservationRepository = {
      save: jest.fn(),
      search: jest.fn(),
      findActiveByOrderItem: jest.fn(),
      findActiveByOrder: jest.fn(),
      sumActiveByIngredient: jest.fn()
    } as unknown as jest.Mocked<StockReservationRepository>

    deductIngredient = { run: jest.fn() } as unknown as jest.Mocked<DeductIngredient>

    consumeStockReservation = new ConsumeStockReservation(reservationRepository, deductIngredient)
  })

  it('returns false when no ACTIVE reservation is found for (orderId, itemId)', async () => {
    const orderId = UuidMother.random()
    const itemId = UuidMother.random()
    reservationRepository.findActiveByOrderItem.mockResolvedValue([])

    const result = await consumeStockReservation.run(orderId, itemId, 'Venta de orden')

    expect(result).toBe(false)
    expect(deductIngredient.run).not.toHaveBeenCalled()
    expect(reservationRepository.save).not.toHaveBeenCalled()
  })

  it('returns true and marks each ACTIVE reservation CONSUMED after deducting its snapshotted quantity', async () => {
    const orderId = UuidMother.random()
    const itemId = UuidMother.random()
    const reservation = StockReservationMother.forOrderItem(orderId, itemId)
    const primitives = reservation.toPrimitives()
    reservationRepository.findActiveByOrderItem.mockResolvedValue([reservation])
    deductIngredient.run.mockResolvedValue(undefined)

    const result = await consumeStockReservation.run(orderId, itemId, 'Venta de orden')

    expect(result).toBe(true)
    expect(deductIngredient.run).toHaveBeenCalledWith(
      primitives.ingredientId,
      primitives.quantity,
      primitives.unitId,
      'Venta de orden',
      orderId,
      null
    )
    expect(reservationRepository.save).toHaveBeenCalledTimes(1)
    expect(reservationRepository.save.mock.calls[0][0].toPrimitives().status).toBe('CONSUMED')
  })

  it('deducts each reservation line before marking any as CONSUMED, preserving snapshotted quantities across multiple lines', async () => {
    const orderId = UuidMother.random()
    const itemId = UuidMother.random()
    const reservationA = StockReservationMother.forOrderItem(orderId, itemId)
    const reservationB = StockReservationMother.forOrderItem(orderId, itemId)
    reservationRepository.findActiveByOrderItem.mockResolvedValue([reservationA, reservationB])
    deductIngredient.run.mockResolvedValue(undefined)

    const result = await consumeStockReservation.run(orderId, itemId, 'Venta de orden')

    expect(result).toBe(true)
    expect(deductIngredient.run).toHaveBeenCalledTimes(2)
    expect(reservationRepository.save).toHaveBeenCalledTimes(2)
  })
})
