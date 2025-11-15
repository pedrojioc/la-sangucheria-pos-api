import { UnitName } from '@contexts/shared-kernel/unit/domain/unit-name'
import { StringMother } from '@test/shared/__mothers__/StringMother'

export class UnitNameMother {
  static create(value: string): UnitName {
    return new UnitName(value)
  }

  static random(): UnitName {
    return this.create(StringMother.random({ max: 50 }))
  }

  static kilogram(): UnitName {
    return this.create('Kilogram')
  }

  static liter(): UnitName {
    return this.create('Liter')
  }

  static meter(): UnitName {
    return this.create('Meter')
  }
}
