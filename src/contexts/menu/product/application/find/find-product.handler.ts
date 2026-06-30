import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { FindProductQuery } from './find-product.query'
import { FindProduct } from './find-product'
import { ProductResponse } from '../dto/product.response'
import { ProductAvailabilityQueryService } from '../services/product-availability-query.service'

@QueryHandler(FindProductQuery)
export class FindProductHandler implements IQueryHandler<FindProductQuery> {
  constructor(
    private readonly findProduct: FindProduct,
    private readonly availabilityQueryService: ProductAvailabilityQueryService
  ) {}

  async execute(query: FindProductQuery): Promise<ProductResponse> {
    const product = await this.findProduct.run(query.id)
    const availabilityMap = await this.availabilityQueryService.getAvailabilityMap([
      product.id.value
    ])
    return ProductResponse.fromDomain(
      product,
      availabilityMap.get(product.id.value) ?? 'UNAVAILABLE'
    )
  }
}
