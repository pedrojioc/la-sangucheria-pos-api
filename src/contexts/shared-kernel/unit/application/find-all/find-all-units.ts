import { UnitRepository } from '../../domain/repositories/unit.repository'
import { Unit } from '../../domain/unit'

export class FindAllUnits {
  constructor(private readonly repository: UnitRepository) {}

  async run(): Promise<Unit[]> {
    return this.repository.findAll()
  }
}
