import { TypeOrmProductWithOptionsQueryService } from '../../infrastructure/query-services/typeorm-product-with-options-query.service'
import { ProductWithOptionsResponse } from '../dto/product-with-options.response'
import { ProductNotExist } from '@contexts/menu/product/domain/exceptions/product-not-exist'
import { ProductId } from '@contexts/menu/product/domain/product-id'

export class FindProductWithOptions {
  constructor(private readonly queryService: TypeOrmProductWithOptionsQueryService) {}

  async run(id: string): Promise<ProductWithOptionsResponse> {
    const model = await this.queryService.findById(id)

    if (!model) {
      throw new ProductNotExist(new ProductId(id))
    }

    return ProductWithOptionsResponse.fromReadModel(model)
  }
}
