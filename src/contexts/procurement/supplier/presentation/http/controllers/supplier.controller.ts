import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { CreateSupplierRequest } from '../dto/create-supplier.request'
import { UpdateSupplierRequest } from '../dto/update-supplier.request'
import { SearchSuppliersRequest } from '../dto/search-suppliers.request'
import { CreateSupplierCommand } from '../../../application/create/create-supplier.command'
import { UpdateSupplierCommand } from '../../../application/update/update-supplier.command'
import { FindSupplierQuery } from '../../../application/find/find-supplier.query'
import { FindAllSuppliersQuery } from '../../../application/find-all/find-all-supplier.query'
import { SearchSuppliersByCriteriaQuery } from '../../../application/search-by-criteria/search-suppliers-by-criteria.query'
import { SupplierResponse } from '../../../application/dto/supplier.response'
import { SupplierListResponse } from '../../../application/dto/supplier-list.response'
import { PaginatedSupplierListResponse } from '../../../application/dto/paginated-supplier-list.response'

@Controller('suppliers')
export class SupplierController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post()
  async create(@Body() dto: CreateSupplierRequest): Promise<void> {
    const command = new CreateSupplierCommand(
      dto.id,
      dto.name,
      dto.contactName ?? null,
      dto.email ?? null,
      dto.phone ?? null,
      dto.whatsappNumber ?? null,
      dto.address ?? null,
      dto.taxId ?? null,
      dto.paymentTerms ?? null,
      dto.notes ?? null,
      dto.rating ?? null,
      dto.isActive ?? true
    )

    await this.commandBus.execute(command)
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSupplierRequest): Promise<void> {
    const command = new UpdateSupplierCommand(
      id,
      dto.name,
      dto.contactName ?? null,
      dto.email ?? null,
      dto.phone ?? null,
      dto.whatsappNumber ?? null,
      dto.address ?? null,
      dto.taxId ?? null,
      dto.paymentTerms ?? null,
      dto.notes ?? null,
      dto.rating ?? null,
      dto.isActive ?? true
    )

    await this.commandBus.execute(command)
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<SupplierResponse> {
    const query = new FindSupplierQuery(id)
    return this.queryBus.execute(query)
  }

  @Get()
  async findAll(
    @Query() searchDto?: SearchSuppliersRequest
  ): Promise<SupplierListResponse | PaginatedSupplierListResponse> {
    // If search parameters are provided, use criteria-based search
    if (searchDto && (searchDto.page || searchDto.pageSize || searchDto.filters)) {
      const criteria = searchDto.toCriteria()
      const query = new SearchSuppliersByCriteriaQuery(criteria)
      return this.queryBus.execute(query)
    }

    // Otherwise, return all suppliers
    const query = new FindAllSuppliersQuery()
    return this.queryBus.execute(query)
  }
}
