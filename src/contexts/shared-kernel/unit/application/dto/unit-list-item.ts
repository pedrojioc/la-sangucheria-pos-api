import { UnitConversionListItem } from './unit-conversion-list-item'

export class UnitListItem {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly symbol: string,
    public readonly type: string,
    public readonly isActive: boolean,
    public readonly conversions: UnitConversionListItem[]
  ) {}
}
