import { Unit } from '../unit'
import { UnitId } from '../unit-id'

export abstract class UnitRepository {
  abstract save(unit: Unit): Promise<void>

  abstract findById(id: UnitId): Promise<Unit | null>

  abstract findAll(): Promise<Unit[]>

  abstract delete(id: UnitId): Promise<void>
}
