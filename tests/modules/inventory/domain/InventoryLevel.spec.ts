import { InventoryLevel } from '@contexts/inventory/stock-level/domain/inventory-level'
import { InventoryLevelMother } from '../__mothers__/InventoryLevelMother'
import { Quantity } from '@/shared/domain/value-objects/quantity'

describe('InventoryLevel', () => {
  describe('create', () => {
    it('should create a new inventory level', () => {
      const level = InventoryLevelMother.random()

      expect(level).toBeInstanceOf(InventoryLevel)
      expect(level.id).toBeDefined()
      expect(level.ingredientId).toBeDefined()
    })
  })

  describe('increase', () => {
    it('should increase current quantity', () => {
      const level = InventoryLevelMother.create({
        currentQuantity: 50,
        unitId: 'unit-kg'
      })

      const increaseBy = new Quantity(30, new UnitId('unit-kg'))
      level.increase(increaseBy)

      const primitives = level.toPrimitives()
      expect(primitives.currentQuantity).toBe(80)
    })

    it('should throw error when units do not match', () => {
      const level = InventoryLevelMother.create({
        unitId: 'unit-kg'
      })

      const increaseBy = new Quantity(30, new UnitId('unit-liters'))

      expect(() => level.increase(increaseBy)).toThrow()
    })
  })

  describe('decrease', () => {
    it('should decrease current quantity', () => {
      const level = InventoryLevelMother.create({
        currentQuantity: 50,
        unitId: 'unit-kg'
      })

      const decreaseBy = new Quantity(20, new UnitId('unit-kg'))
      level.decrease(decreaseBy)

      const primitives = level.toPrimitives()
      expect(primitives.currentQuantity).toBe(30)
    })

    it('should throw InsufficientStockException when trying to decrease more than available', () => {
      const level = InventoryLevelMother.create({
        currentQuantity: 30,
        unitId: 'unit-kg'
      })

      const decreaseBy = new Quantity(40, new UnitId('unit-kg'))

      expect(() => level.decrease(decreaseBy)).toThrow(InsufficientStockException)
    })

    it('should emit OutOfStockEvent when quantity reaches zero', () => {
      const level = InventoryLevelMother.create({
        currentQuantity: 20,
        unitId: 'unit-kg',
        minimumStock: 5
      })

      const decreaseBy = new Quantity(20, new UnitId('unit-kg'))
      level.decrease(decreaseBy)

      const events = level.pullDomainEvents()
      expect(events).toHaveLength(1)
      expect(events[0]).toBeInstanceOf(OutOfStockEvent)
    })

    it('should emit LowStockDetectedEvent when quantity falls below minimum', () => {
      const level = InventoryLevelMother.create({
        currentQuantity: 20,
        unitId: 'unit-kg',
        minimumStock: 10
      })

      const decreaseBy = new Quantity(15, new UnitId('unit-kg'))
      level.decrease(decreaseBy)

      const events = level.pullDomainEvents()
      expect(events).toHaveLength(1)
      expect(events[0]).toBeInstanceOf(LowStockDetectedEvent)
    })

    it('should not emit events when stock is still above minimum', () => {
      const level = InventoryLevelMother.create({
        currentQuantity: 50,
        unitId: 'unit-kg',
        minimumStock: 10
      })

      const decreaseBy = new Quantity(20, new UnitId('unit-kg'))
      level.decrease(decreaseBy)

      const events = level.pullDomainEvents()
      expect(events).toHaveLength(0)
    })
  })

  describe('isOutOfStock', () => {
    it('should return true when current quantity is zero', () => {
      const level = InventoryLevelMother.outOfStock()

      expect(level.isOutOfStock()).toBe(true)
    })

    it('should return false when there is stock', () => {
      const level = InventoryLevelMother.normalStock()

      expect(level.isOutOfStock()).toBe(false)
    })
  })

  describe('isLowStock', () => {
    it('should return true when below minimum stock but not zero', () => {
      const level = InventoryLevelMother.lowStock()

      expect(level.isLowStock()).toBe(true)
      expect(level.isOutOfStock()).toBe(false)
    })

    it('should return false when above minimum stock', () => {
      const level = InventoryLevelMother.normalStock()

      expect(level.isLowStock()).toBe(false)
    })

    it('should return false when no minimum stock is set', () => {
      const level = InventoryLevelMother.withoutThresholds()

      expect(level.isLowStock()).toBe(false)
    })
  })

  describe('isBelowReorderPoint', () => {
    it('should return true when below reorder point', () => {
      const level = InventoryLevelMother.belowReorderPoint()

      expect(level.isBelowReorderPoint()).toBe(true)
    })

    it('should return false when above reorder point', () => {
      const level = InventoryLevelMother.normalStock()

      expect(level.isBelowReorderPoint()).toBe(false)
    })

    it('should return false when no reorder point is set', () => {
      const level = InventoryLevelMother.withoutThresholds()

      expect(level.isBelowReorderPoint()).toBe(false)
    })
  })

  describe('getCurrentQuantity', () => {
    it('should return current quantity as Quantity value object', () => {
      const level = InventoryLevelMother.create({
        currentQuantity: 42,
        unitId: 'unit-kg'
      })

      const quantity = level.getCurrentQuantity()

      expect(quantity).toBeInstanceOf(Quantity)
      expect(quantity.value).toBe(42)
    })
  })

  describe('fromPrimitives / toPrimitives', () => {
    it('should serialize and deserialize correctly', () => {
      const original = InventoryLevelMother.random()
      const primitives = original.toPrimitives()
      const restored = InventoryLevel.fromPrimitives(primitives)

      expect(restored.toPrimitives()).toEqual(primitives)
    })
  })
})
