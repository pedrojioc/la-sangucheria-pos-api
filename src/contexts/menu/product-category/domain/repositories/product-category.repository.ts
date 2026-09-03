import { ProductCategory } from '../product-category'
import { ProductCategoryId } from '@/contexts/menu/product-category/domain/product-category-id'

export abstract class ProductCategoryRepository {
  abstract save(category: ProductCategory): Promise<void>

  abstract search(id: ProductCategoryId): Promise<ProductCategory | null>

  abstract searchAll(): Promise<ProductCategory[]>

  abstract delete(id: ProductCategoryId): Promise<void>
}
