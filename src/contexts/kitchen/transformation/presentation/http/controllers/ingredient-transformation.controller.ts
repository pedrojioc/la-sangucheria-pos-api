import { Controller, Post, Body } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'
import { RegisterTransformationRequest } from '../dto/register-transformation.request'
import { RegisterTransformationCommand } from '@contexts/kitchen/transformation/application/register/register-transformation.command'
import { CurrentUser } from '@/contexts/iam/shared/decorators/current-user.decorator'

@Controller('ingredient-transformations')
export class IngredientTransformationController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async register(
    @Body() dto: RegisterTransformationRequest,
    @CurrentUser('userId') userId: string
  ): Promise<void> {
    const command = new RegisterTransformationCommand(
      dto.id,
      dto.recipeId,
      dto.inputQuantity,
      dto.inputUnitId,
      dto.outputQuantity,
      dto.outputUnitId,
      userId,
      dto.notes ?? null
    )

    await this.commandBus.execute(command)
  }
}
