import { UnitResponse } from './unit.response'
import { Unit } from '../../domain/unit'

export class UnitListResponse {
  constructor(public readonly data: UnitResponse[]) {}

  static fromDomain(units: Unit[]): UnitListResponse {
    const items = units.map(unit => UnitResponse.fromDomain(unit))
    return new UnitListResponse(items)
  }
}
