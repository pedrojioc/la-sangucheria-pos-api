import { Body, Controller, HttpCode, HttpStatus, Param, Put } from '@nestjs/common'
import { AssignProductOptionGroupsRequest } from '../dto/assign-product-option-groups.request'
import { AssignProductOptionGroups } from '../../../application/assign/assign-product-option-groups'

@Controller('products')
export class ProductOptionGroupController {
  constructor(private readonly assignProductOptionGroups: AssignProductOptionGroups) {}

  @Put(':productId/option-groups')
  @HttpCode(HttpStatus.NO_CONTENT)
  async assign(
    @Param('productId') productId: string,
    @Body() dto: AssignProductOptionGroupsRequest
  ): Promise<void> {
    await this.assignProductOptionGroups.run(productId, dto.groups)
  }
}
