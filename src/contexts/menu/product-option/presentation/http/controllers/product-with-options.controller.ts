import { Controller, Get, Param } from '@nestjs/common'
import { FindProductWithOptions } from '../../../application/find-product-with-options/find-product-with-options'
import { ProductWithOptionsResponse } from '../../../application/dto/product-with-options.response'

@Controller('products')
export class ProductWithOptionsController {
  constructor(private readonly findProductWithOptions: FindProductWithOptions) {}

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ProductWithOptionsResponse> {
    return this.findProductWithOptions.run(id)
  }
}
