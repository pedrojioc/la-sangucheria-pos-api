import { PreparationRecipeQueryService } from '../services/preparation-recipe-query.service'
import { PreparationRecipeDetail } from '../dto/preparation-recipe-detail'
import { PreparationRecipeNotFoundException } from '../../domain/exceptions/preparation-recipe-not-found.exception'

export class FindPreparationRecipeDetail {
  constructor(private readonly queryService: PreparationRecipeQueryService) {}

  async run(id: string): Promise<PreparationRecipeDetail> {
    const detail = await this.queryService.findById(id)

    if (!detail) {
      throw new PreparationRecipeNotFoundException(id)
    }

    return detail
  }
}
