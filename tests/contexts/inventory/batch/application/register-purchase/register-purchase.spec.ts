import { RegisterPurchase } from '@contexts/inventory/batch/application/register-purchase/register-purchase'
import { IngredientRepository } from '@contexts/inventory/ingredient/domain/repositories/ingredient.repository'
import { InventoryBatchRepository } from '@contexts/inventory/batch/domain/repositories/inventory-batch.repository'
import { InventoryMovementRepository } from '@contexts/inventory/stock-level/domain/repositories/inventory-movement.repository'
import { InventoryLevelRepository } from '@contexts/inventory/stock-level/domain/repositories/inventory-level.repository'
import { UnitConversionRepository } from '@contexts/shared-kernel/unit-conversion/domain/repositories/unit-conversion.repository'
import { UnitConversion } from '@contexts/shared-kernel/unit-conversion/domain/unit-conversion'
import { UnitConversionNotFound } from '@contexts/shared-kernel/unit-conversion/domain/exceptions/unit-conversion-not-found.exception'
import { NotFoundException } from '@shared/domain/exceptions/domain.exception'
import { EventBus } from '@shared/domain/events'
import { IngredientMother } from '@test/contexts/inventory/ingredient/__mothers__/ingredient.mother'
import { InventoryLevelMother } from '@test/contexts/inventory/stock-level/__mothers__/inventory-level.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { NumberMother } from '@test/shared/__mothers__/NumberMother'

describe('RegisterPurchase', () => {
  const buildDeps = () => {
    const ingredientRepository = {
      search: jest.fn()
    } as unknown as jest.Mocked<IngredientRepository>
    const unitConversionRepository = {
      findByUnits: jest.fn()
    } as unknown as jest.Mocked<UnitConversionRepository>
    const batchRepository = { save: jest.fn() } as unknown as jest.Mocked<InventoryBatchRepository>
    const movementRepository = {
      save: jest.fn()
    } as unknown as jest.Mocked<InventoryMovementRepository>
    const levelRepository = {
      save: jest.fn(),
      findByIngredient: jest.fn()
    } as unknown as jest.Mocked<InventoryLevelRepository>
    const eventBus = { publish: jest.fn() } as unknown as jest.Mocked<EventBus>

    const useCase = new RegisterPurchase(
      ingredientRepository,
      unitConversionRepository,
      batchRepository,
      movementRepository,
      levelRepository,
      eventBus
    )

    return {
      useCase,
      ingredientRepository,
      unitConversionRepository,
      batchRepository,
      movementRepository,
      levelRepository,
      eventBus
    }
  }

  const runArgs = (overrides: Partial<{ ingredientId: string; unitId: string }> = {}) => {
    const ingredientId = overrides.ingredientId ?? UuidMother.random()
    const unitId = overrides.unitId ?? UuidMother.random()

    return {
      batchId: UuidMother.random(),
      ingredientId,
      quantity: NumberMother.random({ min: 1, max: 100 }),
      unitId,
      unitCost: NumberMother.random({ min: 1, max: 100 }),
      currency: 'COP',
      purchaseDate: new Date('2026-01-15T10:00:00.000Z'),
      expirationDate: null,
      supplier: UuidMother.random(),
      referenceCode: 'PO-2026-0001'
    }
  }

  it('saves batch, movement and level when the purchase unit matches the ingredient base unit', async () => {
    const deps = buildDeps()
    const unitId = UuidMother.random()
    const ingredient = IngredientMother.create({ unitId })
    deps.ingredientRepository.search.mockResolvedValue(ingredient)
    deps.levelRepository.findByIngredient.mockResolvedValue(null)

    const args = runArgs({ ingredientId: ingredient.toPrimitives().id, unitId })

    await deps.useCase.run(
      args.batchId,
      args.ingredientId,
      args.quantity,
      args.unitId,
      args.unitCost,
      args.currency,
      args.purchaseDate,
      args.expirationDate,
      args.supplier,
      args.referenceCode
    )

    expect(deps.unitConversionRepository.findByUnits).not.toHaveBeenCalled()
    expect(deps.batchRepository.save).toHaveBeenCalledTimes(1)
    expect(deps.movementRepository.save).toHaveBeenCalledTimes(1)
    expect(deps.levelRepository.save).toHaveBeenCalledTimes(1)
  })

  it('converts quantity and unit cost to the ingredient base unit when units differ', async () => {
    const deps = buildDeps()
    const baseUnitId = UuidMother.random()
    const purchaseUnitId = UuidMother.random()
    const ingredient = IngredientMother.create({ unitId: baseUnitId })
    deps.ingredientRepository.search.mockResolvedValue(ingredient)
    deps.levelRepository.findByIngredient.mockResolvedValue(null)

    const factor = 1000 // kg -> g
    const conversionRule = UnitConversion.create(
      UuidMother.random(),
      purchaseUnitId,
      baseUnitId,
      factor
    )
    deps.unitConversionRepository.findByUnits.mockResolvedValue(conversionRule)

    const args = runArgs({ ingredientId: ingredient.toPrimitives().id, unitId: purchaseUnitId })
    const quantity = 10
    const unitCost = 150000

    await deps.useCase.run(
      args.batchId,
      args.ingredientId,
      quantity,
      purchaseUnitId,
      unitCost,
      args.currency,
      args.purchaseDate,
      args.expirationDate,
      args.supplier,
      args.referenceCode
    )

    expect(deps.unitConversionRepository.findByUnits).toHaveBeenCalledWith(
      purchaseUnitId,
      baseUnitId
    )

    const savedBatch = deps.batchRepository.save.mock.calls[0][0]
    const primitives = savedBatch.toPrimitives()
    expect(primitives.initialQuantity).toBe(quantity * factor)
    expect(primitives.unitId).toBe(baseUnitId)
    expect(primitives.unitCost).toBe(unitCost / factor)
  })

  it('throws NotFoundException when the ingredient does not exist', async () => {
    const deps = buildDeps()
    deps.ingredientRepository.search.mockResolvedValue(null)
    const args = runArgs()

    await expect(
      deps.useCase.run(
        args.batchId,
        args.ingredientId,
        args.quantity,
        args.unitId,
        args.unitCost,
        args.currency,
        args.purchaseDate,
        args.expirationDate,
        args.supplier,
        args.referenceCode
      )
    ).rejects.toBeInstanceOf(NotFoundException)

    expect(deps.batchRepository.save).not.toHaveBeenCalled()
    expect(deps.movementRepository.save).not.toHaveBeenCalled()
    expect(deps.levelRepository.save).not.toHaveBeenCalled()
  })

  it('throws UnitConversionNotFound when no conversion rule exists', async () => {
    const deps = buildDeps()
    const baseUnitId = UuidMother.random()
    const purchaseUnitId = UuidMother.random()
    const ingredient = IngredientMother.create({ unitId: baseUnitId })
    deps.ingredientRepository.search.mockResolvedValue(ingredient)
    deps.unitConversionRepository.findByUnits.mockResolvedValue(null)

    const args = runArgs({ ingredientId: ingredient.toPrimitives().id, unitId: purchaseUnitId })

    await expect(
      deps.useCase.run(
        args.batchId,
        args.ingredientId,
        args.quantity,
        purchaseUnitId,
        args.unitCost,
        args.currency,
        args.purchaseDate,
        args.expirationDate,
        args.supplier,
        args.referenceCode
      )
    ).rejects.toBeInstanceOf(UnitConversionNotFound)

    expect(deps.batchRepository.save).not.toHaveBeenCalled()
    expect(deps.movementRepository.save).not.toHaveBeenCalled()
    expect(deps.levelRepository.save).not.toHaveBeenCalled()
  })

  it('creates a new InventoryLevel when none exists for the ingredient', async () => {
    const deps = buildDeps()
    const unitId = UuidMother.random()
    const ingredient = IngredientMother.create({ unitId })
    deps.ingredientRepository.search.mockResolvedValue(ingredient)
    deps.levelRepository.findByIngredient.mockResolvedValue(null)

    const args = runArgs({ ingredientId: ingredient.toPrimitives().id, unitId })

    await deps.useCase.run(
      args.batchId,
      args.ingredientId,
      args.quantity,
      args.unitId,
      args.unitCost,
      args.currency,
      args.purchaseDate,
      args.expirationDate,
      args.supplier,
      args.referenceCode
    )

    const savedLevel = deps.levelRepository.save.mock.calls[0][0]
    expect(savedLevel.toPrimitives().currentQuantity).toBe(args.quantity)
  })

  it('increases the existing level when one already exists for the ingredient', async () => {
    const deps = buildDeps()
    const unitId = UuidMother.random()
    const ingredient = IngredientMother.create({ unitId })
    deps.ingredientRepository.search.mockResolvedValue(ingredient)
    const existingLevel = InventoryLevelMother.create({
      ingredientId: ingredient.toPrimitives().id,
      unitId,
      currentQuantity: 50
    })
    deps.levelRepository.findByIngredient.mockResolvedValue(existingLevel)

    const args = runArgs({ ingredientId: ingredient.toPrimitives().id, unitId })

    await deps.useCase.run(
      args.batchId,
      args.ingredientId,
      args.quantity,
      args.unitId,
      args.unitCost,
      args.currency,
      args.purchaseDate,
      args.expirationDate,
      args.supplier,
      args.referenceCode
    )

    const savedLevel = deps.levelRepository.save.mock.calls[0][0]
    expect(savedLevel.toPrimitives().currentQuantity).toBe(50 + args.quantity)
  })

  it('publishes batch and level domain events', async () => {
    const deps = buildDeps()
    const unitId = UuidMother.random()
    const ingredient = IngredientMother.create({ unitId })
    deps.ingredientRepository.search.mockResolvedValue(ingredient)
    deps.levelRepository.findByIngredient.mockResolvedValue(null)

    const args = runArgs({ ingredientId: ingredient.toPrimitives().id, unitId })

    await deps.useCase.run(
      args.batchId,
      args.ingredientId,
      args.quantity,
      args.unitId,
      args.unitCost,
      args.currency,
      args.purchaseDate,
      args.expirationDate,
      args.supplier,
      args.referenceCode
    )

    expect(deps.eventBus.publish).toHaveBeenCalledTimes(1)
    const publishedEvents = deps.eventBus.publish.mock.calls[0][0]
    expect(Array.isArray(publishedEvents)).toBe(true)
    expect(publishedEvents.length).toBeGreaterThan(0)
  })

  it('saves batch, movement and level before publishing (no own transaction/UoW dependency)', async () => {
    const deps = buildDeps()
    const unitId = UuidMother.random()
    const ingredient = IngredientMother.create({ unitId })
    deps.ingredientRepository.search.mockResolvedValue(ingredient)
    deps.levelRepository.findByIngredient.mockResolvedValue(null)

    const callOrder: string[] = []
    deps.batchRepository.save.mockImplementation(() => {
      callOrder.push('batch')
      return Promise.resolve()
    })
    deps.movementRepository.save.mockImplementation(() => {
      callOrder.push('movement')
      return Promise.resolve()
    })
    deps.levelRepository.save.mockImplementation(() => {
      callOrder.push('level')
      return Promise.resolve()
    })
    deps.eventBus.publish.mockImplementation(() => {
      callOrder.push('publish')
      return Promise.resolve()
    })

    const args = runArgs({ ingredientId: ingredient.toPrimitives().id, unitId })

    await deps.useCase.run(
      args.batchId,
      args.ingredientId,
      args.quantity,
      args.unitId,
      args.unitCost,
      args.currency,
      args.purchaseDate,
      args.expirationDate,
      args.supplier,
      args.referenceCode
    )

    expect(callOrder).toEqual(['batch', 'movement', 'level', 'publish'])
  })
})
