import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { FindAllProductCategoriesQuery } from './find-all-product-categories.query'
import { FindAllProductCategories } from './find-all-product-categories'
import { ProductCategoryListResponse } from '../dto/product-category-list.response'

@QueryHandler(FindAllProductCategoriesQuery)
export class FindAllProductCategoriesHandler
  implements IQueryHandler<FindAllProductCategoriesQuery, ProductCategoryListResponse>
{
  constructor(private readonly useCase: FindAllProductCategories) {}

  async execute(): Promise<ProductCategoryListResponse> {
    const categories = await this.useCase.run()
    return ProductCategoryListResponse.fromDomain(categories)
  }
}
