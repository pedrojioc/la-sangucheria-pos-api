import { ProductCategory } from '../../domain/product-category'
import { ProductCategoryResponse } from './product-category.response'

export class ProductCategoryListResponse {
  constructor(public readonly data: ProductCategoryResponse[]) {}

  static fromDomain(categories: ProductCategory[]): ProductCategoryListResponse {
    const items = categories.map(category => ProductCategoryResponse.fromDomain(category))
    return new ProductCategoryListResponse(items)
  }
}
