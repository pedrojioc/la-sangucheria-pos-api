import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { FindProductWithOptionsQuery } from './find-product-with-options.query'
import { FindProductWithOptions } from './find-product-with-options'
import { ProductWithOptionsResponse } from '../dto/product-with-options.response'

@QueryHandler(FindProductWithOptionsQuery)
export class FindProductWithOptionsHandler implements IQueryHandler<FindProductWithOptionsQuery> {
  constructor(private readonly findProductWithOptions: FindProductWithOptions) {}

  async execute(query: FindProductWithOptionsQuery): Promise<ProductWithOptionsResponse> {
    return this.findProductWithOptions.run(query.id)
  }
}
