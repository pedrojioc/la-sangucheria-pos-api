import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common'
import { CreateSupplierRequest } from '../dto/create-supplier.request'
import { UpdateSupplierRequest } from '../dto/update-supplier.request'
import { SearchSuppliersRequest } from '../dto/search-suppliers.request'
import { CreateSupplier } from '../../../application/create/create-supplier'
import { UpdateSupplier } from '../../../application/update/update-supplier'
import { FindSupplier } from '../../../application/find/find-supplier'
import { FindAllSuppliers } from '../../../application/find-all/find-all-supplier'
import { SearchSuppliersByCriteria } from '../../../application/search-by-criteria/search-suppliers-by-criteria'
import { GetSupplierStatistics } from '../../../application/get-statistics/get-supplier-statistics'
import { SupplierResponse } from '../../../application/dto/supplier.response'
import { SupplierListResponse } from '../../../application/dto/supplier-list.response'
import { PaginatedSupplierListResponse } from '../../../application/dto/paginated-supplier-list.response'
import { SupplierListItemResponse } from '../../../application/dto/supplier-list-item.response'
import { SupplierStatisticsResponse } from '../../../application/dto/supplier-statistics.response'

@Controller('suppliers')
export class SupplierController {
  constructor(
    private readonly createSupplier: CreateSupplier,
    private readonly updateSupplier: UpdateSupplier,
    private readonly findSupplier: FindSupplier,
    private readonly findAllSuppliers: FindAllSuppliers,
    private readonly searchSuppliersByCriteria: SearchSuppliersByCriteria,
    private readonly getSupplierStatistics: GetSupplierStatistics
  ) {}

  @Post()
  async create(@Body() dto: CreateSupplierRequest): Promise<void> {
    await this.createSupplier.run(
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
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSupplierRequest): Promise<void> {
    await this.updateSupplier.run(
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
  }

  @Get('statistics')
  async getStatistics(): Promise<SupplierStatisticsResponse> {
    const statistics = await this.getSupplierStatistics.run()
    return SupplierStatisticsResponse.fromDomain(statistics)
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<SupplierResponse> {
    const supplier = await this.findSupplier.run(id)
    return SupplierResponse.fromDomain(supplier)
  }

  @Get()
  async findAll(
    @Query() searchDto?: SearchSuppliersRequest
  ): Promise<SupplierListResponse | PaginatedSupplierListResponse> {
    // If search parameters are provided, use criteria-based search
    if (searchDto && (searchDto.page || searchDto.pageSize || searchDto.filters)) {
      const criteria = searchDto.toCriteria()
      const result = await this.searchSuppliersByCriteria.run(criteria)
      const data = result.data.map(item => SupplierListItemResponse.fromReadModel(item))
      return new PaginatedSupplierListResponse(data, result.meta)
    }

    // Otherwise, return all suppliers
    const suppliers = await this.findAllSuppliers.run()
    return SupplierListResponse.fromDomain(suppliers)
  }
}
