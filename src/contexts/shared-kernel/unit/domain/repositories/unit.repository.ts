import { Unit } from '../unit'
import { UnitId } from '../unit-id'

export interface UnitRepository {
  save(unit: Unit): Promise<void>
  findById(id: UnitId): Promise<Unit | null>
  findAll(): Promise<Unit[]>
  delete(id: UnitId): Promise<void>
}

export const UnitRepository = Symbol('UnitRepository')
