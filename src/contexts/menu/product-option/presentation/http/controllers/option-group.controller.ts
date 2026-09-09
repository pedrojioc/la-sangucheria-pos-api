import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseInterceptors
} from '@nestjs/common'
import { TransactionInterceptor } from '@shared/infrastructure/unit-of-work/transaction.interceptor'
import { CreateOptionGroupRequest } from '../dto/create-option-group.request'
import { UpdateOptionGroupRequest } from '../dto/update-option-group.request'
import { SearchOptionGroupsRequest } from '../dto/search-option-groups.request'
import { OptionGroupResponse } from '../../../application/dto/option-group.response'
import { OptionGroupListItemResponse } from '../../../application/dto/option-group-list-item.response'
import { PaginatedOptionGroupListResponse } from '../../../application/dto/paginated-option-group-list.response'
import { CreateOptionGroup } from '../../../application/create/create-option-group'
import { UpdateOptionGroup } from '../../../application/update/update-option-group'
import { DeactivateOptionGroup } from '../../../application/deactivate/deactivate-option-group'
import { FindOptionGroup } from '../../../application/find/find-option-group'
import { SearchOptionGroupsByCriteria } from '../../../application/search-by-criteria/search-option-groups-by-criteria'

@Controller('option-groups')
export class OptionGroupController {
  constructor(
    private readonly createOptionGroup: CreateOptionGroup,
    private readonly updateOptionGroup: UpdateOptionGroup,
    private readonly deactivateOptionGroup: DeactivateOptionGroup,
    private readonly findOptionGroup: FindOptionGroup,
    private readonly searchOptionGroupsByCriteria: SearchOptionGroupsByCriteria
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(TransactionInterceptor)
  async create(@Body() dto: CreateOptionGroupRequest): Promise<void> {
    await this.createOptionGroup.run(
      dto.id,
      dto.name,
      dto.type,
      dto.required,
      dto.minSelections,
      dto.maxSelections,
      dto.items
    )
  }

  @Get()
  async search(@Query() dto: SearchOptionGroupsRequest): Promise<PaginatedOptionGroupListResponse> {
    const result = await this.searchOptionGroupsByCriteria.run(dto.toCriteria())
    return new PaginatedOptionGroupListResponse(
      result.data.map(item => OptionGroupListItemResponse.fromReadModel(item)),
      result.meta
    )
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<OptionGroupResponse> {
    const group = await this.findOptionGroup.run(id)
    return OptionGroupResponse.fromDomain(group)
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseInterceptors(TransactionInterceptor)
  async update(@Param('id') id: string, @Body() dto: UpdateOptionGroupRequest): Promise<void> {
    await this.updateOptionGroup.run(
      id,
      dto.name,
      dto.type,
      dto.required,
      dto.minSelections,
      dto.maxSelections,
      dto.items
    )
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseInterceptors(TransactionInterceptor)
  async deactivate(@Param('id') id: string): Promise<void> {
    await this.deactivateOptionGroup.run(id)
  }
}
