import { ProductCategoryRepository } from '@/contexts/menu/product-category/domain/repositories/product-category.repository'
import { ProductCategoryId } from '@/contexts/menu/product-category/domain/product-category-id'
import { ProductCategoryNotExist } from '@/contexts/menu/product-category/domain/exceptions/product-category-not-exist.exception'
import { ProductCategory } from '@/contexts/menu/product-category/domain/product-category'

export class FindProductCategory {
  constructor(private readonly productCategoryRepository: ProductCategoryRepository) {}

  async run(id: string): Promise<ProductCategory> {
    const productCategoryId = new ProductCategoryId(id)
    const productCategory = await this.productCategoryRepository.search(productCategoryId)

    if (!productCategory) {
      throw new ProductCategoryNotExist(productCategoryId)
    }

    return productCategory
  }
}
