import { InventoryBatch } from '@/contexts/inventory/batch/domain/inventory-batch'
import { InventoryBatchCreatedEvent } from '@/contexts/inventory/batch/domain/events/inventory-batch-created.event'
import { InventoryBatchMother } from '../__mothers__/inventory-batch.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { Quantity } from '@/shared/domain/value-objects/quantity'

describe('InventoryBatch', () => {
  const unitId = UuidMother.random()

  describe('create', () => {
    it('should create a batch with correct primitives', () => {
      const id = UuidMother.random()
      const ingredientId = UuidMother.random()
      const batch = InventoryBatch.create(id, ingredientId, 100, unitId, 10, 'COP', new Date())
      const p = batch.toPrimitives()

      expect(p.id).toBe(id)
      expect(p.ingredientId).toBe(ingredientId)
      expect(p.initialQuantity).toBe(100)
      expect(p.remainingQuantity).toBe(100)
      expect(p.unitId).toBe(unitId)
    })

    it('should record InventoryBatchCreatedEvent', () => {
      const batch = InventoryBatch.create(
        UuidMother.random(),
        UuidMother.random(),
        50,
        unitId,
        5,
        'COP',
        new Date()
      )
      const events = batch.pullDomainEvents()

      expect(events).toHaveLength(1)
      expect(events[0]).toBeInstanceOf(InventoryBatchCreatedEvent)
    })
  })

  describe('deduct', () => {
    it('should reduce remainingQuantity', () => {
      const batch = InventoryBatchMother.create({
        initialQuantity: 100,
        availableQuantity: 100,
        unitId
      })
      batch.deduct(new Quantity(30, unitId))

      expect(batch.toPrimitives().remainingQuantity).toBe(70)
    })

    it('should allow deducting the full remaining quantity', () => {
      const batch = InventoryBatchMother.create({
        initialQuantity: 50,
        availableQuantity: 50,
        unitId
      })
      batch.deduct(new Quantity(50, unitId))

      expect(batch.toPrimitives().remainingQuantity).toBe(0)
      expect(batch.isExhausted()).toBe(true)
    })

    it('should deduct only available when requesting more than remaining', () => {
      const batch = InventoryBatchMother.create({
        initialQuantity: 30,
        availableQuantity: 30,
        unitId
      })
      const deducted = batch.deduct(new Quantity(50, unitId))

      expect(deducted.value).toBe(30)
      expect(batch.isExhausted()).toBe(true)
    })

    it('should throw when units differ', () => {
      const batch = InventoryBatchMother.create({ unitId })
      const otherUnit = UuidMother.random()

      expect(() => batch.deduct(new Quantity(10, otherUnit))).toThrow()
    })
  })

  describe('calculateCost', () => {
    it('should calculate cost for a given quantity', () => {
      const batch = InventoryBatchMother.create({ unitCost: 10, currency: 'COP', unitId })
      const cost = batch.calculateCost(new Quantity(5, unitId))

      expect(cost.amount).toBe(50)
      expect(cost.currency).toBe('COP')
    })

    it('should throw when units differ', () => {
      const batch = InventoryBatchMother.create({ unitId })
      expect(() => batch.calculateCost(new Quantity(5, UuidMother.random()))).toThrow()
    })
  })

  describe('isExhausted', () => {
    it('should return true when remaining is zero', () => {
      expect(InventoryBatchMother.fullyConsumed().isExhausted()).toBe(true)
    })

    it('should return false when there is remaining stock', () => {
      expect(InventoryBatchMother.partiallyConsumed().isExhausted()).toBe(false)
    })
  })

  describe('fromPrimitives / toPrimitives', () => {
    it('should round-trip correctly', () => {
      const original = InventoryBatchMother.random()
      const restored = InventoryBatch.fromPrimitives(original.toPrimitives())
      expect(restored.toPrimitives()).toEqual(original.toPrimitives())
    })
  })
})
