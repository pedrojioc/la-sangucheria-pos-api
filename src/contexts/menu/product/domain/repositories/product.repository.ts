import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { Product } from '../product'
import { ProductId } from '../product-id'
import { ProductSku } from '../product-sku'

export abstract class ProductRepository {
  abstract save(product: Product): Promise<void>

  abstract search(id: ProductId): Promise<Product | null>

  abstract findBySku(sku: ProductSku): Promise<Product | null>

  abstract matching(criteria: Criteria): Promise<PaginatedResult<Product>>

  abstract delete(id: ProductId): Promise<void>
}
