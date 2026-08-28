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
  UseInterceptors
} from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { TransactionInterceptor } from '@shared/infrastructure/unit-of-work/transaction.interceptor'
import { AddAddressRequest } from '../dto/add-address.request'
import { UpdateAddressRequest } from '../dto/update-address.request'
import { AddAddressCommand } from '../../../application/add/add-address.command'
import { UpdateAddressCommand } from '../../../application/update/update-address.command'
import { RemoveAddressCommand } from '../../../application/remove/remove-address.command'
import { SetDefaultAddressCommand } from '../../../application/set-default/set-default-address.command'
import { FindAddressesByCustomerQuery } from '../../../application/find-by-customer/find-addresses-by-customer.query'
import { AddressResponse } from '../../../application/dto/address.response'

@Controller('customers/:customerId/addresses')
export class AddressController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Get()
  findAll(@Param('customerId') customerId: string): Promise<AddressResponse[]> {
    return this.queryBus.execute(new FindAddressesByCustomerQuery(customerId))
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(TransactionInterceptor)
  async add(
    @Param('customerId') customerId: string,
    @Body() dto: AddAddressRequest
  ): Promise<void> {
    await this.commandBus.execute(
      new AddAddressCommand(
        dto.id,
        customerId,
        dto.label,
        dto.street,
        dto.neighborhood ?? null,
        dto.city,
        dto.reference ?? null,
        dto.coordinates ?? null
      )
    )
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateAddressRequest): Promise<void> {
    await this.commandBus.execute(
      new UpdateAddressCommand(
        id,
        dto.label,
        dto.street,
        dto.neighborhood ?? null,
        dto.city,
        dto.reference ?? null,
        dto.coordinates ?? null
      )
    )
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseInterceptors(TransactionInterceptor)
  async remove(@Param('customerId') customerId: string, @Param('id') id: string): Promise<void> {
    await this.commandBus.execute(new RemoveAddressCommand(id, customerId))
  }

  @Post(':id/set-default')
  @HttpCode(HttpStatus.NO_CONTENT)
  async setDefault(
    @Param('customerId') customerId: string,
    @Param('id') id: string
  ): Promise<void> {
    await this.commandBus.execute(new SetDefaultAddressCommand(id, customerId))
  }
}
