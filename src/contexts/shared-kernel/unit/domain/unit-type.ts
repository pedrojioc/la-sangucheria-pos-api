import { ValueObject } from '@/shared/domain/value-objects/value-object'
import { InvalidUnitType } from './exceptions/invalid-unit-type'

export enum UnitTypeEnum {
  WEIGHT = 'weight',
  VOLUME = 'volume',
  LENGTH = 'length',
  UNIT = 'unit'
}

export class UnitType extends ValueObject<UnitTypeEnum> {
  constructor(value: UnitTypeEnum) {
    super(value)
    this.ensureIsValidType(value)
  }

  private ensureIsValidType(value: UnitTypeEnum): void {
    if (!Object.values(UnitTypeEnum).includes(value)) {
      throw new InvalidUnitType()
    }
  }

  isWeight(): boolean {
    return this.value === UnitTypeEnum.WEIGHT
  }

  isVolume(): boolean {
    return this.value === UnitTypeEnum.VOLUME
  }

  isLength(): boolean {
    return this.value === UnitTypeEnum.LENGTH
  }

  isUnit(): boolean {
    return this.value === UnitTypeEnum.UNIT
  }
}
