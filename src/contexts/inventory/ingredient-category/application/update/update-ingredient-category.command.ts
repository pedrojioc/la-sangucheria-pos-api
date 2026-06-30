import { Command } from '@/shared/application/bus/command'

export class UpdateIngredientCategoryCommand extends Command {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly icon: string | null,
    public readonly color: string | null,
    public readonly sortOrder: number | null,
    public readonly isActive: boolean
  ) {
    super()
  }
}
