import { Unit, UnitPrimitives } from '../../domain/unit'

export class UnitResponse {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly symbol: string,
    public readonly type: string,
    public readonly isActive: boolean
  ) {}

  static fromDomain(unit: Unit) {
    const primitives = unit.toPrimitives()
    return new UnitResponse(
      primitives.id,
      primitives.name,
      primitives.symbol,
      primitives.type,
      primitives.isActive
    )
  }
}
