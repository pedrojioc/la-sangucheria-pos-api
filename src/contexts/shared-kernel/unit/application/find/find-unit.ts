import { UnitRepository } from '../../domain/repositories/unit.repository'
import { UnitId } from '../../domain/unit-id'
import { UnitNotExist } from '../../domain/exceptions/unit-not-exist.exception'
import { Unit } from '../../domain/unit'

export class FindUnit {
  constructor(private readonly repository: UnitRepository) {}

  async run(id: string): Promise<Unit> {
    const unitId = new UnitId(id)
    const unit = await this.repository.findById(unitId)

    if (!unit) {
      throw new UnitNotExist(id)
    }

    return unit
  }
}
