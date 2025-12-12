import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { GenerateProductSkuQuery } from './generate-product-sku.query'
import { GenerateProductSku } from './generate-product-sku'

@QueryHandler(GenerateProductSkuQuery)
export class GenerateProductSkuHandler implements IQueryHandler<GenerateProductSkuQuery> {
  constructor(private readonly useCase: GenerateProductSku) {}

  async execute(_query: GenerateProductSkuQuery): Promise<string> {
    return this.useCase.run()
  }
}
