export interface UnitRef {
  id: string
  name: string
  symbol: string
}

export class UnitConversionListItem {
  constructor(
    public readonly id: string,
    public readonly fromUnit: UnitRef,
    public readonly toUnit: UnitRef,
    public readonly factor: number,
    public readonly description: string | null
  ) {}
}
