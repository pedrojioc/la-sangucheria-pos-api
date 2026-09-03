import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { FindRecipeQuery } from './find-recipe.query'
import { FindRecipe } from './find-recipe'
import { RecipeResponse } from '@contexts/kitchen/recipe/application/dto/recipe.response'

@QueryHandler(FindRecipeQuery)
export class FindRecipeHandler implements IQueryHandler<FindRecipeQuery> {
  constructor(private readonly useCase: FindRecipe) {}

  async execute(query: FindRecipeQuery): Promise<RecipeResponse> {
    const recipe = await this.useCase.run(query.id)
    return RecipeResponse.fromDomain(recipe)
  }
}
