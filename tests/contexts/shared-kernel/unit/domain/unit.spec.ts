import { Unit } from '@/contexts/shared-kernel/unit/domain/unit'
import { UnitTypeEnum } from '@/contexts/shared-kernel/unit/domain/unit-type'
import { UnitCreatedEvent } from '@/contexts/shared-kernel/unit/domain/events/unit-created.event'
import { UnitUpdatedEvent } from '@/contexts/shared-kernel/unit/domain/events/unit-updated.event'
import { UnitDeletedEvent } from '@/contexts/shared-kernel/unit/domain/events/unit-deleted.event'
import { UnitMother } from '../__mothers__/unit.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('Unit', () => {
  describe('create', () => {
    it('should create a unit with valid primitives', () => {
      const id = UuidMother.random()
      const unit = Unit.create(id, 'Kilogram', 'kg', UnitTypeEnum.WEIGHT, true)
      const p = unit.toPrimitives()

      expect(p.id).toBe(id)
      expect(p.name).toBe('Kilogram')
      expect(p.symbol).toBe('kg')
      expect(p.type).toBe(UnitTypeEnum.WEIGHT)
      expect(p.isActive).toBe(true)
    })

    it('should record a UnitCreatedEvent', () => {
      const unit = Unit.create(UuidMother.random(), 'Liter', 'l', UnitTypeEnum.VOLUME, true)
      const events = unit.pullDomainEvents()

      expect(events).toHaveLength(1)
      expect(events[0]).toBeInstanceOf(UnitCreatedEvent)
    })
  })

  describe('update', () => {
    it('should update all mutable fields', () => {
      const unit = UnitMother.kilogram()
      unit.update('Gram', 'g', UnitTypeEnum.WEIGHT, true)
      const p = unit.toPrimitives()

      expect(p.name).toBe('Gram')
      expect(p.symbol).toBe('g')
    })

    it('should record a UnitUpdatedEvent', () => {
      const unit = UnitMother.kilogram()
      unit.update('Gram', 'g', UnitTypeEnum.WEIGHT, true)
      const events = unit.pullDomainEvents()

      expect(events).toHaveLength(1)
      expect(events[0]).toBeInstanceOf(UnitUpdatedEvent)
    })

    it('should deactivate a unit', () => {
      const unit = UnitMother.kilogram()
      unit.update(unit.toPrimitives().name, unit.toPrimitives().symbol, UnitTypeEnum.WEIGHT, false)

      expect(unit.toPrimitives().isActive).toBe(false)
    })
  })

  describe('delete', () => {
    it('should record a UnitDeletedEvent', () => {
      const unit = UnitMother.kilogram()
      unit.delete()
      const events = unit.pullDomainEvents()

      expect(events).toHaveLength(1)
      expect(events[0]).toBeInstanceOf(UnitDeletedEvent)
    })
  })

  describe('fromPrimitives / toPrimitives', () => {
    it('should serialize and deserialize correctly', () => {
      const original = UnitMother.random()
      const primitives = original.toPrimitives()
      const restored = Unit.fromPrimitives(primitives)

      expect(restored.toPrimitives()).toEqual(primitives)
    })
  })
})
