import { MovementType } from '../../domain/movement-type'

export class RegisterManualAdjustmentCommand {
  constructor(
    public readonly ingredientId: string,
    public readonly type: MovementType.ADJUSTMENT | MovementType.WASTE,
    public readonly quantity: number,
    public readonly note: string | null,
    public readonly performedBy: string | null
  ) {}
}
