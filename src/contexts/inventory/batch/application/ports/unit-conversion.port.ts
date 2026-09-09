export abstract class UnitConversionPort {
  abstract getFactor(fromUnitId: string, toUnitId: string): Promise<number>
}
