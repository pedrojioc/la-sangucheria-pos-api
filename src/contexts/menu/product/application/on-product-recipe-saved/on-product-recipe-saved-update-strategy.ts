import { ProductRepository } from '../../domain/repositories/product.repository'
import { ProductId } from '../../domain/product-id'

export class OnProductRecipeSavedUpdateStrategy {
  constructor(private readonly productRepository: ProductRepository) {}

  async run(productId: string): Promise<void> {
    const id = new ProductId(productId)
    const product = await this.productRepository.search(id)
    if (!product) return

    if (product.getInventoryStrategyType() === 'RECIPE') return

    product.markAsRecipe()
    await this.productRepository.save(product)
  }
}
