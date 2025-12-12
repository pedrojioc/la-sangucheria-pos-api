import { ProductRepository } from '../../domain/repositories/product.repository'
import { ProductSkuGenerator } from '../../domain/services/product-sku-generator.service'

export class GenerateProductSku {
  constructor(private readonly repository: ProductRepository) {}

  async run(): Promise<string> {
    const lastSkuNumber = await this.repository.getLastSkuNumber()
    const newSku = ProductSkuGenerator.generate(lastSkuNumber)
    return newSku.value
  }
}
