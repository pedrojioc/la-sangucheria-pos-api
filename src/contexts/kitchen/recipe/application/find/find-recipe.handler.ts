import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { FindRecipeQuery } from './find-recipe.query'
import { FindRecipe } from './find-recipe'
import { Recipe } from '@contexts/kitchen/recipe/domain/recipe'

@QueryHandler(FindRecipeQuery)
export class FindRecipeHandler implements IQueryHandler<FindRecipeQuery> {
  constructor(private readonly useCase: FindRecipe) {}

  async execute(query: FindRecipeQuery): Promise<Recipe> {
    return this.useCase.run(query.id)
  }
}
