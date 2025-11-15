import { UnitSymbol } from '@contexts/shared-kernel/unit/domain/unit-symbol'
import { StringMother } from '@test/shared/__mothers__/StringMother'

export class UnitSymbolMother {
  static create(value: string): UnitSymbol {
    return new UnitSymbol(value)
  }

  static random(): UnitSymbol {
    return this.create(StringMother.random({ max: 10 }))
  }

  static kg(): UnitSymbol {
    return this.create('kg')
  }

  static l(): UnitSymbol {
    return this.create('l')
  }

  static m(): UnitSymbol {
    return this.create('m')
  }

  static unit(): UnitSymbol {
    return this.create('unit')
  }
}
