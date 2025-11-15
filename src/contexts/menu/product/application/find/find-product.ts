import { ProductRepository } from '../../domain/repositories/product.repository'
import { Product } from '../../domain/product'
import { ProductId } from '../../domain/product-id'
import { ProductNotExist } from '../../domain/exceptions/product-not-exist'

export class FindProduct {
  constructor(private readonly productRepository: ProductRepository) {}

  async run(id: string): Promise<Product> {
    const productId = new ProductId(id)
    const product = await this.productRepository.search(productId)

    if (!product) {
      throw new ProductNotExist(productId)
    }

    return product
  }
}
