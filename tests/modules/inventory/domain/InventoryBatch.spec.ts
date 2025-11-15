import { InventoryBatch } from '@contexts/inventory/batch/domain/inventory-batch'
import { InventoryBatchMother } from '../__mothers__/InventoryBatchMother'
import { Quantity } from '@/shared/domain/value-objects/quantity'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('InventoryBatch', () => {
  describe('create', () => {
    it('should create a new inventory batch', () => {
      const batch = InventoryBatchMother.random()

      expect(batch).toBeInstanceOf(InventoryBatch)
      expect(batch.id).toBeDefined()
      expect(batch.ingredientId).toBeDefined()
    })

    it('should initialize available quantity equal to initial quantity', () => {
      const initialQuantity = 100
      const batch = InventoryBatchMother.create({ initialQuantity })

      const primitives = batch.toPrimitives()
      expect(primitives.availableQuantity).toBe(initialQuantity)
      expect(primitives.initialQuantity).toBe(initialQuantity)
    })
  })

  describe('consume', () => {
    it('should reduce available quantity when consuming', () => {
      const batch = InventoryBatchMother.create({
        initialQuantity: 100,
        availableQuantity: 100,
        unitId: 'unit-kg'
      })

      const consumeQuantity = new Quantity(30, new UnitId('unit-kg'))
      batch.consume(consumeQuantity)

      const primitives = batch.toPrimitives()
      expect(primitives.availableQuantity).toBe(70)
    })

    it('should throw InsufficientStockException when trying to consume more than available', () => {
      const batch = InventoryBatchMother.create({
        availableQuantity: 50,
        unitId: 'unit-kg'
      })

      const consumeQuantity = new Quantity(60, new UnitId('unit-kg'))

      expect(() => batch.consume(consumeQuantity)).toThrow(InsufficientStockException)
    })

    it('should allow consuming exact available quantity', () => {
      const batch = InventoryBatchMother.create({
        availableQuantity: 50,
        unitId: 'unit-kg'
      })

      const consumeQuantity = new Quantity(50, new UnitId('unit-kg'))
      batch.consume(consumeQuantity)

      const primitives = batch.toPrimitives()
      expect(primitives.availableQuantity).toBe(0)
    })
  })

  describe('getAvailableQuantity', () => {
    it('should return current available quantity', () => {
      const batch = InventoryBatchMother.partiallyConsumed()
      const available = batch.getAvailableQuantity()

      const primitives = batch.toPrimitives()
      expect(available.value).toBe(primitives.availableQuantity)
    })

    it('should return zero for fully consumed batch', () => {
      const batch = InventoryBatchMother.fullyConsumed()
      const available = batch.getAvailableQuantity()

      expect(available.value).toBe(0)
    })
  })

  describe('isFullyConsumed', () => {
    it('should return true when available quantity is zero', () => {
      const batch = InventoryBatchMother.fullyConsumed()

      expect(batch.isFullyConsumed()).toBe(true)
    })

    it('should return false when there is available quantity', () => {
      const batch = InventoryBatchMother.partiallyConsumed()

      expect(batch.isFullyConsumed()).toBe(false)
    })
  })

  describe('isExpired', () => {
    it('should return true when expiry date has passed', () => {
      const batch = InventoryBatchMother.expired()

      expect(batch.isExpired()).toBe(true)
    })

    it('should return false when expiry date is in the future', () => {
      const batch = InventoryBatchMother.expiresIn(30)

      expect(batch.isExpired()).toBe(false)
    })

    it('should return false when batch has no expiry date', () => {
      const batch = InventoryBatchMother.withoutExpiry()

      expect(batch.isExpired()).toBe(false)
    })
  })

  describe('calculateCost', () => {
    it('should calculate cost for given quantity', () => {
      const batch = InventoryBatchMother.create({
        unitCost: 10,
        currency: 'PEN',
        unitId: 'unit-kg'
      })

      const quantity = new Quantity(5, new UnitId('unit-kg'))
      const cost = batch.calculateCost(quantity)

      expect(cost.amount).toBe(50)
      expect(cost.currency).toBe('PEN')
    })

    it('should calculate cost for fractional quantity', () => {
      const batch = InventoryBatchMother.create({
        unitCost: 10,
        currency: 'PEN',
        unitId: 'unit-kg'
      })

      const quantity = new Quantity(2.5, new UnitId('unit-kg'))
      const cost = batch.calculateCost(quantity)

      expect(cost.amount).toBe(25)
    })

    it('should throw error when units do not match', () => {
      const batch = InventoryBatchMother.create({
        unitId: 'unit-kg'
      })

      const quantity = new Quantity(5, new UnitId('unit-liters'))

      expect(() => batch.calculateCost(quantity)).toThrow()
    })
  })

  describe('fromPrimitives / toPrimitives', () => {
    it('should serialize and deserialize correctly', () => {
      const original = InventoryBatchMother.random()
      const primitives = original.toPrimitives()
      const restored = InventoryBatch.fromPrimitives(primitives)

      expect(restored.toPrimitives()).toEqual(primitives)
    })
  })
})
