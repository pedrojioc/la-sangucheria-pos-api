import {
  Body,
  Controller,
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
import { CreateCustomerRequest } from '../dto/create-customer.request'
import { UpdateCustomerRequest } from '../dto/update-customer.request'
import { SearchCustomersRequest } from '../dto/search-customers.request'
import { CreateCustomer } from '../../../application/create/create-customer'
import { UpdateCustomer } from '../../../application/update/update-customer'
import { FindCustomer } from '../../../application/find/find-customer'
import { SearchCustomersByPhone } from '../../../application/search-by-phone/search-customers-by-phone'
import { SearchCustomersByCriteria } from '../../../application/search-by-criteria/search-customers-by-criteria'
import { CustomerResponse } from '../../../application/dto/customer.response'
import { PaginatedResult } from '@shared/domain/criteria/paginated-result'
import { CustomerListItem } from '../../../application/dto/customer-list-item'

@Controller('customers')
export class CustomerController {
  constructor(
    private readonly createCustomer: CreateCustomer,
    private readonly updateCustomer: UpdateCustomer,
    private readonly findCustomer: FindCustomer,
    private readonly searchCustomersByPhone: SearchCustomersByPhone,
    private readonly searchCustomersByCriteria: SearchCustomersByCriteria
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(TransactionInterceptor)
  async create(@Body() dto: CreateCustomerRequest): Promise<void> {
    await this.createCustomer.run(
      dto.id,
      dto.name,
      dto.phone,
      dto.email ?? null,
      dto.documentType,
      dto.documentNumber,
      dto.taxRegime,
      dto.notes ?? null
    )
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerRequest): Promise<void> {
    await this.updateCustomer.run(
      id,
      dto.name,
      dto.phone,
      dto.email ?? null,
      dto.taxRegime,
      dto.notes ?? null
    )
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CustomerResponse> {
    return this.findCustomer.run(id)
  }

  @Get()
  async search(
    @Query() dto: SearchCustomersRequest
  ): Promise<CustomerResponse[] | PaginatedResult<CustomerListItem>> {
    if (dto.phone) {
      return this.searchCustomersByPhone.run(dto.phone)
    }
    return this.searchCustomersByCriteria.run(dto.toCriteria())
  }
}
