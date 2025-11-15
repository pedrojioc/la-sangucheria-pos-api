import { DomainException } from '@/shared/domain/exceptions/domain.exception'
import { ProductCategoryId } from '@/contexts/menu/product-category/domain/product-category-id'

export class ProductCategoryNotExist extends DomainException {
  constructor(productCategoryId: ProductCategoryId) {
    super(`Product category with id ${productCategoryId.value} does not exist`)
  }
}
