import { UnitType, UnitTypeEnum } from '@contexts/shared-kernel/unit/domain/unit-type'

export class UnitTypeMother {
  static create(value: UnitTypeEnum): UnitType {
    return new UnitType(value)
  }

  static random(): UnitType {
    const types = Object.values(UnitTypeEnum)
    const randomIndex = Math.floor(Math.random() * types.length)
    return this.create(types[randomIndex])
  }

  static weight(): UnitType {
    return this.create(UnitTypeEnum.WEIGHT)
  }

  static volume(): UnitType {
    return this.create(UnitTypeEnum.VOLUME)
  }

  static length(): UnitType {
    return this.create(UnitTypeEnum.LENGTH)
  }

  static unit(): UnitType {
    return this.create(UnitTypeEnum.UNIT)
  }
}
