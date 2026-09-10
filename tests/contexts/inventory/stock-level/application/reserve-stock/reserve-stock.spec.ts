import { ReserveStock } from '@contexts/inventory/stock-level/application/reserve-stock/reserve-stock'
import { StockReservationRepository } from '@contexts/inventory/stock-level/domain/repositories/stock-reservation.repository'
import { InventoryLevelRepository } from '@contexts/inventory/stock-level/domain/repositories/inventory-level.repository'
import { InsufficientStockForReservation } from '@contexts/inventory/stock-level/domain/exceptions/insufficient-stock-for-reservation.exception'
import { InventoryLevelMother } from '@test/contexts/inventory/stock-level/__mothers__/inventory-level.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('ReserveStock', () => {
  let reservationRepository: jest.Mocked<StockReservationRepository>
  let levelRepository: jest.Mocked<InventoryLevelRepository>
  let reserveStock: ReserveStock

  beforeEach(() => {
    reservationRepository = {
      save: jest.fn(),
      search: jest.fn(),
      findActiveByOrderItem: jest.fn(),
      findActiveByOrder: jest.fn(),
      sumActiveByIngredient: jest.fn()
    } as unknown as jest.Mocked<StockReservationRepository>

    levelRepository = {
      save: jest.fn(),
      search: jest.fn(),
      findByIngredient: jest.fn(),
      findByIngredientForUpdate: jest.fn(),
      findLowStock: jest.fn(),
      findBelowReorderPoint: jest.fn(),
      findOutOfStock: jest.fn(),
      searchAll: jest.fn()
    } as unknown as jest.Mocked<InventoryLevelRepository>

    reserveStock = new ReserveStock(reservationRepository, levelRepository)
  })

  it('reserves all lines when stock is sufficient', async () => {
    const orderId = UuidMother.random()
    const itemId = UuidMother.random()
    const ingredientId = UuidMother.random()
    const unitId = 'unit'

    levelRepository.findByIngredientForUpdate.mockResolvedValue(
      InventoryLevelMother.create({ ingredientId, currentQuantity: 10, unitId })
    )
    reservationRepository.sumActiveByIngredient.mockResolvedValue(0)

    await reserveStock.run(orderId, [{ itemId, ingredientId, quantity: 2, unitId }])

    expect(reservationRepository.save).toHaveBeenCalledTimes(1)
    const saved = reservationRepository.save.mock.calls[0][0].toPrimitives()
    expect(saved).toMatchObject({
      orderId,
      itemId,
      ingredientId,
      quantity: 2,
      unitId,
      status: 'ACTIVE'
    })
  })

  it('throws InsufficientStockForReservation and makes zero save calls when any ingredient is short', async () => {
    const orderId = UuidMother.random()
    const shortIngredientId = UuidMother.random()
    const okIngredientId = UuidMother.random()
    const unitId = 'unit'

    levelRepository.findByIngredientForUpdate.mockImplementation(ingredientId => {
      if (ingredientId.value === shortIngredientId) {
        return Promise.resolve(
          InventoryLevelMother.create({
            ingredientId: shortIngredientId,
            currentQuantity: 1,
            unitId
          })
        )
      }
      return Promise.resolve(
        InventoryLevelMother.create({
          ingredientId: okIngredientId,
          currentQuantity: 10,
          unitId
        })
      )
    })
    reservationRepository.sumActiveByIngredient.mockResolvedValue(0)

    await expect(
      reserveStock.run(orderId, [
        { itemId: UuidMother.random(), ingredientId: okIngredientId, quantity: 2, unitId },
        { itemId: UuidMother.random(), ingredientId: shortIngredientId, quantity: 2, unitId }
      ])
    ).rejects.toThrow(InsufficientStockForReservation)

    expect(reservationRepository.save).not.toHaveBeenCalled()
  })

  it('throws InsufficientStockForReservation when no inventory level exists for the ingredient', async () => {
    const orderId = UuidMother.random()
    const itemId = UuidMother.random()
    const ingredientId = UuidMother.random()

    levelRepository.findByIngredientForUpdate.mockResolvedValue(null)

    await expect(
      reserveStock.run(orderId, [{ itemId, ingredientId, quantity: 2, unitId: 'unit' }])
    ).rejects.toThrow(InsufficientStockForReservation)

    expect(reservationRepository.save).not.toHaveBeenCalled()
  })

  it('locks ingredients in ascending sorted-ingredientId order', async () => {
    const orderId = UuidMother.random()
    const ingredientA = '0a000000-0000-4000-8000-000000000000'
    const ingredientB = '0b000000-0000-4000-8000-000000000000'
    const unitId = 'unit'
    const lockOrder: string[] = []

    levelRepository.findByIngredientForUpdate.mockImplementation(ingredientId => {
      lockOrder.push(ingredientId.value)
      return Promise.resolve(
        InventoryLevelMother.create({
          ingredientId: ingredientId.value,
          currentQuantity: 10,
          unitId
        })
      )
    })
    reservationRepository.sumActiveByIngredient.mockResolvedValue(0)

    // Pass lines out of order (B before A) to prove the use case sorts them.
    await reserveStock.run(orderId, [
      { itemId: UuidMother.random(), ingredientId: ingredientB, quantity: 1, unitId },
      { itemId: UuidMother.random(), ingredientId: ingredientA, quantity: 1, unitId }
    ])

    expect(lockOrder).toEqual([ingredientA, ingredientB])
  })

  it('groups multiple lines for the same ingredient before locking, summing required quantity', async () => {
    const orderId = UuidMother.random()
    const ingredientId = UuidMother.random()
    const unitId = 'unit'

    levelRepository.findByIngredientForUpdate.mockResolvedValue(
      InventoryLevelMother.create({ ingredientId, currentQuantity: 10, unitId })
    )
    reservationRepository.sumActiveByIngredient.mockResolvedValue(0)

    // 6 + 5 = 11 > 10 available -> should reject as a single grouped check,
    // proving the two lines for the same ingredient were summed, not
    // checked independently (either alone would pass against 10 available).
    await expect(
      reserveStock.run(orderId, [
        { itemId: UuidMother.random(), ingredientId, quantity: 6, unitId },
        { itemId: UuidMother.random(), ingredientId, quantity: 5, unitId }
      ])
    ).rejects.toThrow(InsufficientStockForReservation)

    expect(levelRepository.findByIngredientForUpdate).toHaveBeenCalledTimes(1)
  })

  it('subtracts already-active reservations from available quantity', async () => {
    const orderId = UuidMother.random()
    const itemId = UuidMother.random()
    const ingredientId = UuidMother.random()
    const unitId = 'unit'

    levelRepository.findByIngredientForUpdate.mockResolvedValue(
      InventoryLevelMother.create({ ingredientId, currentQuantity: 10, unitId })
    )
    reservationRepository.sumActiveByIngredient.mockResolvedValue(9)

    await expect(
      reserveStock.run(orderId, [{ itemId, ingredientId, quantity: 2, unitId }])
    ).rejects.toThrow(InsufficientStockForReservation)

    expect(reservationRepository.save).not.toHaveBeenCalled()
  })
})
