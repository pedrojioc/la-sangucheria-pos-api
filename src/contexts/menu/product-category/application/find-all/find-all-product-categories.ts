import { ProductCategoryRepository } from '../../domain/repositories/product-category.repository'
import { ProductCategory } from '../../domain/product-category'

export class FindAllProductCategories {
  constructor(private readonly repository: ProductCategoryRepository) {}

  async run(): Promise<ProductCategory[]> {
    return this.repository.searchAll()
  }
}
