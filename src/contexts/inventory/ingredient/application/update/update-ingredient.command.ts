import { Command } from '@/shared/application/bus/command'

export class UpdateIngredientCommand extends Command {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly ingredientCategoryId: string,
    public readonly unitId: string,
    public readonly preferredSupplierId: string | null,
    public readonly minimumStock: number | null,
    public readonly maximumStock: number | null,
    public readonly isPerishable: boolean,
    public readonly shelfLifeDays: number | null,
    public readonly storageLocation: string | null,
    public readonly isActive: boolean
  ) {
    super()
  }
}
