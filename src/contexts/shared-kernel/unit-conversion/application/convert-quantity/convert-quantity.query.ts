export class ConvertQuantityQuery {
  constructor(
    public readonly quantity: number,
    public readonly fromUnitId: string,
    public readonly toUnitId: string
  ) {}
}
