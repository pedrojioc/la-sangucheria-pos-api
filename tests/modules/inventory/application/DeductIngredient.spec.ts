import { DeductIngredient } from '@contexts/inventory/stock-level/application/deduct/deduct-ingredient'
import { InventoryBatchRepository } from '@contexts/inventory/batch/domain/repositories/inventory-batch.repository'
import { InventoryLevelRepository } from '@contexts/inventory/stock-level/domain/repositories/inventory-level.repository'
import { InventoryMovementRepository } from '@contexts/inventory/stock-level/domain/repositories/inventory-movement.repository'
import { FifoInventoryService } from '@contexts/inventory/batch/domain/services/fifo-inventory.service'
import { EventBus } from '@/shared/domain/events'
import { InventoryBatchMother } from '../__mothers__/InventoryBatchMother'
import { InventoryLevelMother } from '../__mothers__/InventoryLevelMother'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'
import { Quantity } from '@/shared/domain/value-objects/quantity'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('DeductIngredient', () => {
  let useCase: DeductIngredient
  let mockBatchRepository: jest.Mocked<InventoryBatchRepository>
  let mockLevelRepository: jest.Mocked<InventoryLevelRepository>
  let mockMovementRepository: jest.Mocked<InventoryMovementRepository>
  let mockFifoService: jest.Mocked<FifoInventoryService>
  let mockEventBus: jest.Mocked<EventBus>

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

    mockFifoService = {
      calculateCost: jest.fn(),
      consumeFromBatches: jest.fn()
    } as any

    mockEventBus = {
      publish: jest.fn()
    } as any

    useCase = new DeductIngredient(
      mockBatchRepository,
      mockMovementRepository,
      mockLevelRepository,
      mockFifoService,
      mockEventBus
    )
  })

  describe('run', () => {
    it('should deduct quantity from inventory using FIFO', async () => {
      const ingredientId = UuidMother.random()
      const unitId = UuidMother.random()
      const batch1 = InventoryBatchMother.create({
        ingredientId,
        unitId,
        availableQuantity: 50,
        receivedAt: new Date('2024-01-01')
      })
      const batch2 = InventoryBatchMother.create({
        ingredientId,
        unitId,
        availableQuantity: 50,
        receivedAt: new Date('2024-01-02')
      })
      const level = InventoryLevelMother.create({
        ingredientId,
        unitId,
        currentQuantity: 100
      })

      mockBatchRepository.findAvailableByIngredient.mockResolvedValue([batch1, batch2])
      mockLevelRepository.findByIngredient.mockResolvedValue(level)
      mockFifoService.consumeFromBatches.mockReturnValue([batch1, batch2])

      await useCase.run(
        ingredientId,
        30,
        unitId,
        UuidMother.random()
      )

      expect(mockFifoService.consumeFromBatches).toHaveBeenCalledWith(
        [batch1, batch2],
        expect.any(Quantity)
      )
    })

    it('should throw InsufficientStockException when not enough stock', async () => {
      const ingredientId = UuidMother.random()
      const unitId = UuidMother.random()
      const batch = InventoryBatchMother.create({
        ingredientId,
        unitId,
        availableQuantity: 10
      })
      const level = InventoryLevelMother.create({
        ingredientId,
        unitId,
        currentQuantity: 10
      })

      mockBatchRepository.findAvailableByIngredient.mockResolvedValue([batch])
      mockLevelRepository.findByIngredient.mockResolvedValue(level)

      await expect(
        useCase.run(ingredientId, 50, unitId, UuidMother.random())
      ).rejects.toThrow(InsufficientStockException)
    })

    it('should update inventory level after deduction', async () => {
      const ingredientId = UuidMother.random()
      const unitId = UuidMother.random()
      const batch = InventoryBatchMother.create({
        ingredientId,
        unitId,
        availableQuantity: 50
      })
      const level = InventoryLevelMother.create({
        ingredientId,
        unitId,
        currentQuantity: 50
      })

      mockBatchRepository.findAvailableByIngredient.mockResolvedValue([batch])
      mockLevelRepository.findByIngredient.mockResolvedValue(level)
      mockFifoService.consumeFromBatches.mockReturnValue([batch])

      await useCase.run(ingredientId, 20, unitId, UuidMother.random())

      expect(mockLevelRepository.save).toHaveBeenCalledWith(
        expect.any(Object)
      )
    })

    it('should save consumed batches', async () => {
      const ingredientId = UuidMother.random()
      const unitId = UuidMother.random()
      const batch = InventoryBatchMother.create({
        ingredientId,
        unitId,
        availableQuantity: 50
      })
      const level = InventoryLevelMother.create({
        ingredientId,
        unitId,
        currentQuantity: 50
      })

      mockBatchRepository.findAvailableByIngredient.mockResolvedValue([batch])
      mockLevelRepository.findByIngredient.mockResolvedValue(level)
      mockFifoService.consumeFromBatches.mockReturnValue([batch])

      await useCase.run(ingredientId, 20, unitId, UuidMother.random())

      expect(mockBatchRepository.save).toHaveBeenCalled()
    })

    it('should create a deduction movement record', async () => {
      const ingredientId = UuidMother.random()
      const unitId = UuidMother.random()
      const batch = InventoryBatchMother.create({
        ingredientId,
        unitId,
        availableQuantity: 50
      })
      const level = InventoryLevelMother.create({
        ingredientId,
        unitId,
        currentQuantity: 50
      })

      mockBatchRepository.findAvailableByIngredient.mockResolvedValue([batch])
      mockLevelRepository.findByIngredient.mockResolvedValue(level)
      mockFifoService.consumeFromBatches.mockReturnValue([batch])

      await useCase.run(ingredientId, 20, unitId, UuidMother.random())

      expect(mockMovementRepository.save).toHaveBeenCalled()
    })

    it('should publish domain events after deduction', async () => {
      const ingredientId = UuidMother.random()
      const unitId = UuidMother.random()
      const batch = InventoryBatchMother.create({
        ingredientId,
        unitId,
        availableQuantity: 100
      })
      const level = InventoryLevelMother.create({
        ingredientId,
        unitId,
        currentQuantity: 100,
        minimumStock: 20
      })

      mockBatchRepository.findAvailableByIngredient.mockResolvedValue([batch])
      mockLevelRepository.findByIngredient.mockResolvedValue(level)
      mockFifoService.consumeFromBatches.mockReturnValue([batch])

      // Deducir hasta nivel bajo
      await useCase.run(ingredientId, 90, unitId, UuidMother.random())

      // Verificar que se publicaron eventos si el nivel quedó bajo
      expect(mockEventBus.publish).toHaveBeenCalled()
    })
  })
})
