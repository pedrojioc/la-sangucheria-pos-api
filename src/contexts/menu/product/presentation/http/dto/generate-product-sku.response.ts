export class GenerateProductSkuResponse {
  sku: string

  constructor(sku: string) {
    this.sku = sku
  }

  static create(sku: string): GenerateProductSkuResponse {
    return new GenerateProductSkuResponse(sku)
  }
}
