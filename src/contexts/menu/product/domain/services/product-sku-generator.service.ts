import { ProductSku } from '../product-sku'

export class ProductSkuGenerator {
  private static readonly PREFIX = 'PROD'
  private static readonly STARTING_NUMBER = 1000

  static generate(lastSkuNumber: number | null): ProductSku {
    const nextNumber = lastSkuNumber ? lastSkuNumber + 1 : this.STARTING_NUMBER
    const skuValue = `${this.PREFIX}-${nextNumber}`
    return new ProductSku(skuValue)
  }

  static extractNumber(sku: string): number | null {
    const match = sku.match(/^PROD-(\d+)$/)
    return match ? parseInt(match[1], 10) : null
  }
}
