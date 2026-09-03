import { UnitConversionListItem } from './unit-conversion-list-item'

class UnitRefResponse {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly symbol: string
  ) {}
}

export class UnitConversionListItemResponse {
  constructor(
    public readonly id: string,
    public readonly fromUnit: UnitRefResponse,
    public readonly toUnit: UnitRefResponse,
    public readonly factor: number,
    public readonly description: string | null
  ) {}

  static fromReadModel(item: UnitConversionListItem): UnitConversionListItemResponse {
    return new UnitConversionListItemResponse(
      item.id,
      new UnitRefResponse(item.fromUnit.id, item.fromUnit.name, item.fromUnit.symbol),
      new UnitRefResponse(item.toUnit.id, item.toUnit.name, item.toUnit.symbol),
      item.factor,
      item.description
    )
  }
}
