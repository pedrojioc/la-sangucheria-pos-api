import { ProductCategory } from '../product-category'
import { ProductCategoryId } from '@/contexts/menu/product-category/domain/product-category-id'

export interface ProductCategoryRepository {
  save(category: ProductCategory): Promise<void>
  search(id: ProductCategoryId): Promise<ProductCategory | null>
  searchAll(): Promise<ProductCategory[]>
  delete(id: ProductCategoryId): Promise<void>
}

export const ProductCategoryRepository = Symbol('ProductCategoryRepository')
