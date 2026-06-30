import { faker } from '@faker-js/faker'
import { Unit, UnitPrimitives } from '@/contexts/shared-kernel/unit/domain/unit'
import { UnitTypeEnum } from '@/contexts/shared-kernel/unit/domain/unit-type'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

export class UnitMother {
  static create(params: Partial<UnitPrimitives> = {}): Unit {
    const primitives: UnitPrimitives = {
      id: params.id ?? UuidMother.random(),
      name: params.name ?? faker.commerce.productMaterial().slice(0, 50),
      symbol: params.symbol ?? faker.string.alpha({ length: { min: 1, max: 5 } }),
      type: params.type ?? UnitTypeEnum.WEIGHT,
      isActive: params.isActive ?? true
    }
    return Unit.fromPrimitives(primitives)
  }

  static random(): Unit {
    return this.create()
  }

  static kilogram(): Unit {
    return this.create({ name: 'Kilogram', symbol: 'kg', type: UnitTypeEnum.WEIGHT })
  }

  static liter(): Unit {
    return this.create({ name: 'Liter', symbol: 'l', type: UnitTypeEnum.VOLUME })
  }

  static unit(): Unit {
    return this.create({ name: 'Unit', symbol: 'u', type: UnitTypeEnum.UNIT })
  }

  static inactive(): Unit {
    return this.create({ isActive: false })
  }

  static withId(id: string): Unit {
    return this.create({ id })
  }
}
