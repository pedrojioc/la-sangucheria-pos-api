import { InventoryBatchRepository } from '@contexts/inventory/batch/domain/repositories/inventory-batch.repository'
import { InventoryLevelRepository } from '@contexts/inventory/stock-level/domain/repositories/inventory-level.repository'
import { InventoryMovementRepository } from '@contexts/inventory/stock-level/domain/repositories/inventory-movement.repository'
import { InventoryLevelMother } from '../__mothers__/InventoryLevelMother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('ReceiveInventory', () => {
  let useCase: ReceiveInventory
  let mockBatchRepository: jest.Mocked<InventoryBatchRepository>
  let mockLevelRepository: jest.Mocked<InventoryLevelRepository>
  let mockMovementRepository: jest.Mocked<InventoryMovementRepository>

  beforeEach(() => {
    mockBatchRepository = {
      save: jest.fn(),
      search: jest.fn(),
      searchAll: jest.fn(),
      findAvailableByIngredient: jest.fn(),
      findExpiredBatches: jest.fn()
    } as any

    mockLevelRepository = {
      save: jest.fn(),
      search: jest.fn(),
      searchAll: jest.fn(),
      findByIngredient: jest.fn(),
      findLowStock: jest.fn(),
      findOutOfStock: jest.fn()
    } as any

    mockMovementRepository = {
      save: jest.fn(),
      search: jest.fn(),
      searchAll: jest.fn(),
      findByIngredient: jest.fn()
    } as any

    useCase = new ReceiveInventory(
      mockBatchRepository,
      mockLevelRepository,
      mockMovementRepository
    )
  })

  describe('run', () => {
    it('should create a new batch when receiving inventory', async () => {
      const ingredientId = UuidMother.random()
      const unitId = UuidMother.random()
      const existingLevel = InventoryLevelMother.create({
        ingredientId,
        unitId,
        currentQuantity: 50
      })

      mockLevelRepository.findByIngredient.mockResolvedValue(existingLevel)

      await useCase.run(
        UuidMother.random(),
        ingredientId,
        100,
        unitId,
        50,
        'PEN',
        new Date(),
        null,
        UuidMother.random()
      )

      expect(mockBatchRepository.save).toHaveBeenCalledWith(
        expect.any(InventoryBatch)
      )
    })

    it('should create a movement record for the receipt', async () => {
      const ingredientId = UuidMother.random()
      const unitId = UuidMother.random()
      const existingLevel = InventoryLevelMother.create({
        ingredientId,
        unitId,
        currentQuantity: 50
      })

      mockLevelRepository.findByIngredient.mockResolvedValue(existingLevel)

      await useCase.run(
        UuidMother.random(),
        ingredientId,
        100,
        unitId,
        50,
        'PEN',
        new Date(),
        null,
        UuidMother.random()
      )

      expect(mockMovementRepository.save).toHaveBeenCalledWith(
        expect.any(InventoryMovement)
      )
    })

    it('should update inventory level when receiving inventory', async () => {
      const ingredientId = UuidMother.random()
      const unitId = UuidMother.random()
      const existingLevel = InventoryLevelMother.create({
        ingredientId,
        unitId,
        currentQuantity: 50
      })

      mockLevelRepository.findByIngredient.mockResolvedValue(existingLevel)

      await useCase.run(
        UuidMother.random(),
        ingredientId,
        100,
        unitId,
        50,
        'PEN',
        new Date(),
        null,
        UuidMother.random()
      )

      expect(mockLevelRepository.save).toHaveBeenCalledWith(
        expect.any(InventoryLevel)
      )

      const savedLevel = mockLevelRepository.save.mock.calls[0][0] as InventoryLevel
      const primitives = savedLevel.toPrimitives()
      expect(primitives.currentQuantity).toBe(150) // 50 + 100
    })

    it('should create a new inventory level if none exists', async () => {
      const ingredientId = UuidMother.random()
      const unitId = UuidMother.random()

      mockLevelRepository.findByIngredient.mockResolvedValue(null)

      await useCase.run(
        UuidMother.random(),
        ingredientId,
        100,
        unitId,
        50,
        'PEN',
        new Date(),
        null,
        UuidMother.random()
      )

      expect(mockLevelRepository.save).toHaveBeenCalledWith(
        expect.any(InventoryLevel)
      )

      const savedLevel = mockLevelRepository.save.mock.calls[0][0] as InventoryLevel
      const primitives = savedLevel.toPrimitives()
      expect(primitives.currentQuantity).toBe(100)
    })

    it('should handle receipts with expiry date', async () => {
      const ingredientId = UuidMother.random()
      const unitId = UuidMother.random()
      const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      const existingLevel = InventoryLevelMother.create({
        ingredientId,
        unitId
      })

      mockLevelRepository.findByIngredient.mockResolvedValue(existingLevel)

      await useCase.run(
        UuidMother.random(),
        ingredientId,
        100,
        unitId,
        50,
        'PEN',
        new Date(),
        expiryDate,
        UuidMother.random()
      )

      expect(mockBatchRepository.save).toHaveBeenCalledWith(
        expect.any(InventoryBatch)
      )

      const savedBatch = mockBatchRepository.save.mock.calls[0][0] as InventoryBatch
      const primitives = savedBatch.toPrimitives()
      expect(primitives.expiresAt).toEqual(expiryDate)
    })
  })
})
