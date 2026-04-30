import { Controller, Post, Body } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'
import { CreatePreparationRecipeRequest } from '../dto/create-preparation-recipe.request'
import { CreatePreparationRecipeCommand } from '@contexts/kitchen/transformation/application/create/create-preparation-recipe.command'

@Controller('preparation-recipes')
export class PreparationRecipeController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async create(@Body() dto: CreatePreparationRecipeRequest): Promise<void> {
    const command = new CreatePreparationRecipeCommand(
      dto.id,
      dto.name,
      dto.baseIngredientId,
      dto.outputIngredientId,
      dto.yieldPercentage,
      dto.additionalIngredients.map(item => ({
        ingredientId: item.ingredientId,
        quantityPerUnit: item.quantityPerUnit,
        unitId: item.unitId
      })),
      dto.description ?? null
    )

    await this.commandBus.execute(command)
  }
}
