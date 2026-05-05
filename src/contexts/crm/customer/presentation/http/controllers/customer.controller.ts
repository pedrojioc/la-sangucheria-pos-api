import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query
} from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { CreateCustomerRequest } from '../dto/create-customer.request'
import { UpdateCustomerRequest } from '../dto/update-customer.request'
import { SearchCustomersRequest } from '../dto/search-customers.request'
import { CreateCustomerCommand } from '../../../application/create/create-customer.command'
import { UpdateCustomerCommand } from '../../../application/update/update-customer.command'
import { FindCustomerQuery } from '../../../application/find/find-customer.query'
import { SearchCustomersByPhoneQuery } from '../../../application/search-by-phone/search-customers-by-phone.query'
import { SearchCustomersByCriteriaQuery } from '../../../application/search-by-criteria/search-customers-by-criteria.query'
import { CustomerResponse } from '../../../application/dto/customer.response'
import { PaginatedCustomerListResponse } from '../../../application/dto/paginated-customer-list.response'

@Controller('customers')
export class CustomerController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateCustomerRequest): Promise<void> {
    await this.commandBus.execute(
      new CreateCustomerCommand(
        dto.id,
        dto.name,
        dto.phone,
        dto.email ?? null,
        dto.documentType,
        dto.documentNumber,
        dto.taxRegime,
        dto.notes ?? null
      )
    )
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerRequest): Promise<void> {
    await this.commandBus.execute(
      new UpdateCustomerCommand(
        id,
        dto.name,
        dto.phone,
        dto.email ?? null,
        dto.taxRegime,
        dto.notes ?? null
      )
    )
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CustomerResponse> {
    return this.queryBus.execute(new FindCustomerQuery(id))
  }

  @Get()
  async search(
    @Query() dto: SearchCustomersRequest
  ): Promise<CustomerResponse[] | PaginatedCustomerListResponse> {
    if (dto.phone) {
      return this.queryBus.execute(new SearchCustomersByPhoneQuery(dto.phone))
    }
    return this.queryBus.execute(new SearchCustomersByCriteriaQuery(dto.toCriteria()))
  }
}
