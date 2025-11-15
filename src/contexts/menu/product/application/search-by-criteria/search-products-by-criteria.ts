import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { ProductRepository } from '../../domain/repositories/product.repository'
import { Product } from '../../domain/product'

export class SearchProductsByCriteria {
  constructor(private readonly productRepository: ProductRepository) {}

  async run(criteria: Criteria): Promise<PaginatedResult<Product>> {
    return this.productRepository.matching(criteria)
  }
}
