import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { FindProductQuery } from './find-product.query'
import { FindProduct } from './find-product'
import { ProductResponse } from '../dto/product.response'

@QueryHandler(FindProductQuery)
export class FindProductHandler implements IQueryHandler<FindProductQuery> {
  constructor(private readonly findProduct: FindProduct) {}

  async execute(query: FindProductQuery): Promise<ProductResponse> {
    const product = await this.findProduct.run(query.id)
    return ProductResponse.fromDomain(product)
  }
}
