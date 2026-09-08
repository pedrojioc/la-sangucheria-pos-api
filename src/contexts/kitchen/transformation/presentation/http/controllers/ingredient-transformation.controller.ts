import { Controller, Post, Body } from '@nestjs/common'
import { RegisterTransformationRequest } from '../dto/register-transformation.request'
import { RegisterTransformation } from '@contexts/kitchen/transformation/application/register/register-transformation'
import { CurrentUser } from '@/contexts/iam/shared/decorators/current-user.decorator'

@Controller('ingredient-transformations')
export class IngredientTransformationController {
  constructor(private readonly registerTransformation: RegisterTransformation) {}

  @Post()
  async register(
    @Body() dto: RegisterTransformationRequest,
    @CurrentUser('userId') userId: string
  ): Promise<void> {
    await this.registerTransformation.run(
      dto.id,
      dto.recipeId,
      dto.inputQuantity,
      dto.inputUnitId,
      dto.outputQuantity,
      dto.outputUnitId,
      userId,
      dto.notes ?? null
    )
  }
}
