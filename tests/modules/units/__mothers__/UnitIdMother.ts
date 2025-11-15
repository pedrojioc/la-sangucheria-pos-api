import { UnitId } from '@contexts/shared-kernel/unit/domain/unit-id'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

export class UnitIdMother {
  static create(value: string): UnitId {
    return new UnitId(value)
  }

  static random(): UnitId {
    return this.create(UuidMother.random())
  }
}
