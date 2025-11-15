import { Unit } from '@contexts/shared-kernel/unit/domain/unit'
import { UnitTypeEnum } from '@contexts/shared-kernel/unit/domain/unit-type'
import { UnitMother } from '../__mothers__/UnitMother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('Unit', () => {
  describe('create', () => {
    it('should create a unit with valid data', () => {
      const id = UuidMother.random()
      const name = 'Kilogram'
      const symbol = 'kg'
      const type = UnitTypeEnum.WEIGHT
      const isActive = true

      const unit = Unit.create(id, name, symbol, type, isActive)

      expect(unit.id.value).toBe(id)
      expect(unit.toPrimitives()).toEqual({
        id,
        name,
        symbol,
        type,
        isActive
      })
    })

    it('should record UnitCreatedEvent when created', () => {
      const id = UuidMother.random()
      const name = 'Liter'
      const symbol = 'l'
      const type = UnitTypeEnum.VOLUME
      const isActive = true

      const unit = Unit.create(id, name, symbol, type, isActive)
      const events = unit.pullDomainEvents()

      expect(events).toHaveLength(1)
      expect(events[0]).toBeInstanceOf(UnitCreatedEvent)
      expect(events[0].aggregateId).toBe(id)
      expect((events[0] as UnitCreatedEvent).name).toBe(name)
      expect((events[0] as UnitCreatedEvent).symbol).toBe(symbol)
      expect((events[0] as UnitCreatedEvent).type).toBe(type)
    })
  })

  describe('update', () => {
    it('should update unit properties', () => {
      const unit = UnitMother.kilogram()
      const newName = 'Gram'
      const newSymbol = 'g'
      const newType = UnitTypeEnum.WEIGHT
      const newIsActive = false

      unit.update(newName, newSymbol, newType, newIsActive)

      const primitives = unit.toPrimitives()
      expect(primitives.name).toBe(newName)
      expect(primitives.symbol).toBe(newSymbol)
      expect(primitives.type).toBe(newType)
      expect(primitives.isActive).toBe(newIsActive)
    })

    it('should record UnitUpdatedEvent when updated', () => {
      const unit = UnitMother.liter()
      const newName = 'Milliliter'
      const newSymbol = 'ml'
      const newType = UnitTypeEnum.VOLUME
      const newIsActive = true

      // Pull initial creation event
      unit.pullDomainEvents()

      unit.update(newName, newSymbol, newType, newIsActive)
      const events = unit.pullDomainEvents()

      expect(events).toHaveLength(1)
      expect(events[0]).toBeInstanceOf(UnitUpdatedEvent)
      expect((events[0] as UnitUpdatedEvent).name).toBe(newName)
      expect((events[0] as UnitUpdatedEvent).symbol).toBe(newSymbol)
      expect((events[0] as UnitUpdatedEvent).type).toBe(newType)
    })
  })

  describe('delete', () => {
    it('should record UnitDeletedEvent when deleted', () => {
      const unit = UnitMother.meter()

      // Pull initial creation event
      unit.pullDomainEvents()

      unit.delete()
      const events = unit.pullDomainEvents()

      expect(events).toHaveLength(1)
      expect(events[0]).toBeInstanceOf(UnitDeletedEvent)
      expect(events[0].aggregateId).toBe(unit.id.value)
      expect((events[0] as UnitDeletedEvent).name).toBe(unit.toPrimitives().name)
    })
  })

  describe('fromPrimitives', () => {
    it('should create unit from primitives', () => {
      const primitives = {
        id: UuidMother.random(),
        name: 'Unit',
        symbol: 'unit',
        type: UnitTypeEnum.UNIT,
        isActive: true
      }

      const unit = Unit.fromPrimitives(primitives)

      expect(unit.toPrimitives()).toEqual(primitives)
    })
  })

  describe('toPrimitives', () => {
    it('should convert unit to primitives', () => {
      const unit = UnitMother.kilogram()

      const primitives = unit.toPrimitives()

      expect(primitives).toHaveProperty('id')
      expect(primitives).toHaveProperty('name')
      expect(primitives).toHaveProperty('symbol')
      expect(primitives).toHaveProperty('type')
      expect(primitives).toHaveProperty('isActive')
    })
  })
})
