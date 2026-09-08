import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Entities
import { RecipeEntity } from '@/contexts/kitchen/recipe/infrastructure/persistence/typeorm/recipe.entity'
import { RecipeItemEntity } from '@/contexts/kitchen/recipe/infrastructure/persistence/typeorm/recipe-item.entity'

// Repositories
import { RecipeRepository } from '@/contexts/kitchen/recipe/domain/repositories/recipe.repository'
import { TypeOrmRecipeRepository } from '@/contexts/kitchen/recipe/infrastructure/persistence/typeorm/typeorm-recipe.repository'

// Events
import { EventBus } from '@/shared/domain/events'

// Use Cases
import { CreateRecipe } from '@/contexts/kitchen/recipe/application/create/create-recipe'
import { UpdateRecipe } from '@/contexts/kitchen/recipe/application/update/update-recipe'
import { DeleteRecipe } from '@/contexts/kitchen/recipe/application/delete/delete-recipe'
import { FindRecipe } from '@/contexts/kitchen/recipe/application/find/find-recipe'
import { SearchAllRecipes } from '@/contexts/kitchen/recipe/application/search-all/search-all-recipes'

// Controllers
import { RecipeController } from '@/contexts/kitchen/recipe/presentation/http/controllers/recipe.controller'

// Utils
import { createProvider } from '@/core/utils/create-provider'

@Module({
  imports: [TypeOrmModule.forFeature([RecipeEntity, RecipeItemEntity])],
  controllers: [RecipeController],
  providers: [
    // REPOSITORIES
    {
      provide: RecipeRepository,
      useClass: TypeOrmRecipeRepository
    },

    // USE CASES
    createProvider(CreateRecipe, [RecipeRepository, EventBus]),
    createProvider(UpdateRecipe, [RecipeRepository, EventBus]),
    createProvider(DeleteRecipe, [RecipeRepository, EventBus]),
    createProvider(FindRecipe, [RecipeRepository]),
    createProvider(SearchAllRecipes, [RecipeRepository])
  ],
  exports: [RecipeRepository, FindRecipe]
})
export class RecipeModule {}
