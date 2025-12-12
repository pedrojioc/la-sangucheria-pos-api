import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CqrsModule } from '@nestjs/cqrs'
import { EventBus } from '@/shared/domain/events'
import { createUseCaseProvider } from '@/core/utils/createUseCaseProvider'

// Modules
import { IngredientModule } from '@contexts/inventory/ingredient/ingredient.module'

// Entities
import { PreparationRecipeEntity } from './infrastructure/persistence/typeorm/preparation-recipe.entity'

// Repositories
import { PreparationRecipeRepository } from './domain/repositories/preparation-recipe.repository'
import { TypeOrmPreparationRecipeRepository } from './infrastructure/persistence/typeorm/typeorm-preparation-recipe.repository'

// Use Cases
import { CreatePreparationRecipe } from './application/create/create-preparation-recipe'
import { FindIngredient } from '@/contexts/inventory/ingredient/application/find/find-ingredient'

// Handlers
import { CreatePreparationRecipeHandler } from './application/create/create-preparation-recipe.handler'

// Services
import { PreparationRecipeCreatorService } from './application/services/preparation-recipe-creator.service'
import { CreateIngredient } from '@contexts/inventory/ingredient/application/create/create-ingredient'

// Controllers
import { PreparationRecipeController } from './presentation/http/controllers/preparation-recipe.controller'

const CommandHandlers = [CreatePreparationRecipeHandler]

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([PreparationRecipeEntity]), IngredientModule],
  controllers: [PreparationRecipeController],
  providers: [
    // REPOSITORIES
    {
      provide: PreparationRecipeRepository,
      useClass: TypeOrmPreparationRecipeRepository
    },

    // USE CASES
    createUseCaseProvider(CreatePreparationRecipe, [
      PreparationRecipeRepository,
      FindIngredient,
      EventBus
    ]),

    // COMMAND HANDLERS
    ...CommandHandlers,

    // APPLICATION SERVICES
    createUseCaseProvider(PreparationRecipeCreatorService, [
      CreateIngredient,
      CreatePreparationRecipe,
      FindIngredient
    ])
  ],
  exports: [PreparationRecipeCreatorService]
})
export class TransformationModule {}
