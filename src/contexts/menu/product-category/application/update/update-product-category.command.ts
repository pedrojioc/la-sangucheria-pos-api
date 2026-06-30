export class UpdateProductCategoryCommand {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly icon: string | null,
    public readonly color: string | null,
    public readonly isActive: boolean,
    public readonly displayOrder: number,
    public readonly defaultStationId: string | null = null
  ) {}
}
