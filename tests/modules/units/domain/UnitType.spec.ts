import { UnitType, UnitTypeEnum } from '@contexts/shared-kernel/unit/domain/unit-type'
import { InvalidUnitType } from '@contexts/shared-kernel/unit/domain/exceptions/invalid-unit-type'

describe('UnitType', () => {
  it('should create a valid unit type', () => {
    const type = new UnitType(UnitTypeEnum.WEIGHT)

    expect(type.value).toBe(UnitTypeEnum.WEIGHT)
  })

  it('should throw error for invalid unit type', () => {
    expect(() => new UnitType('invalid' as UnitTypeEnum)).toThrow(InvalidUnitType)
  })

  describe('type checks', () => {
    it('should identify weight type', () => {
      const type = new UnitType(UnitTypeEnum.WEIGHT)

      expect(type.isWeight()).toBe(true)
      expect(type.isVolume()).toBe(false)
      expect(type.isLength()).toBe(false)
      expect(type.isUnit()).toBe(false)
    })

    it('should identify volume type', () => {
      const type = new UnitType(UnitTypeEnum.VOLUME)

      expect(type.isWeight()).toBe(false)
      expect(type.isVolume()).toBe(true)
      expect(type.isLength()).toBe(false)
      expect(type.isUnit()).toBe(false)
    })

    it('should identify length type', () => {
      const type = new UnitType(UnitTypeEnum.LENGTH)

      expect(type.isWeight()).toBe(false)
      expect(type.isVolume()).toBe(false)
      expect(type.isLength()).toBe(true)
      expect(type.isUnit()).toBe(false)
    })

    it('should identify unit type', () => {
      const type = new UnitType(UnitTypeEnum.UNIT)

      expect(type.isWeight()).toBe(false)
      expect(type.isVolume()).toBe(false)
      expect(type.isLength()).toBe(false)
      expect(type.isUnit()).toBe(true)
    })
  })
})
