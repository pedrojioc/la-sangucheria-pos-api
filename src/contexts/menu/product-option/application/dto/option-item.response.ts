import { OptionItemPrimitives } from '../../domain/option-item'

export class OptionItemResponse {
  constructor(
    public readonly id: string,
    public readonly groupId: string,
    public readonly label: string,
    public readonly ingredientId: string,
    public readonly quantity: number,
    public readonly unitId: string,
    public readonly extraPrice: number,
    public readonly sortOrder: number,
    public readonly isActive: boolean
  ) {}

  static fromPrimitives(primitives: OptionItemPrimitives): OptionItemResponse {
    return new OptionItemResponse(
      primitives.id,
      primitives.groupId,
      primitives.label,
      primitives.ingredientId,
      primitives.quantity,
      primitives.unitId,
      primitives.extraPrice,
      primitives.sortOrder,
      primitives.isActive
    )
  }
}
