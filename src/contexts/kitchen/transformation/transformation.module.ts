import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CqrsModule } from '@nestjs/cqrs'
import { EventBus } from '@/shared/domain/events'
import { createProvider } from '@/core/utils/create-provider'

// Entities
import { PreparationRecipeEntity } from './infrastructure/persistence/typeorm/preparation-recipe.entity'

// Repositories
import { PreparationRecipeRepository } from './domain/repositories/preparation-recipe.repository'
import { TypeOrmPreparationRecipeRepository } from './infrastructure/persistence/typeorm/typeorm-preparation-recipe.repository'

// Use Cases
import { CreatePreparationRecipe } from './application/create/create-preparation-recipe'

// Handlers
import { CreatePreparationRecipeHandler } from './application/create/create-preparation-recipe.handler'

// Controllers
import { PreparationRecipeController } from './presentation/http/controllers/preparation-recipe.controller'

const CommandHandlers = [CreatePreparationRecipeHandler]

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([PreparationRecipeEntity])],
  controllers: [PreparationRecipeController],
  providers: [
    // REPOSITORIES
    {
      provide: PreparationRecipeRepository,
      useClass: TypeOrmPreparationRecipeRepository
    },

    // USE CASES
    createProvider(CreatePreparationRecipe, [PreparationRecipeRepository, EventBus]),

    // COMMAND HANDLERS
    ...CommandHandlers
  ]
})
export class TransformationModule {}
