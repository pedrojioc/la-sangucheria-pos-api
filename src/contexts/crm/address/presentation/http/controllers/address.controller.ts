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
import { TransactionInterceptor } from '@shared/infrastructure/unit-of-work/transaction.interceptor'
import { AddAddressRequest } from '../dto/add-address.request'
import { UpdateAddressRequest } from '../dto/update-address.request'
import { AddAddress } from '../../../application/add/add-address'
import { UpdateAddress } from '../../../application/update/update-address'
import { RemoveAddress } from '../../../application/remove/remove-address'
import { SetDefaultAddress } from '../../../application/set-default/set-default-address'
import { FindAddressesByCustomer } from '../../../application/find-by-customer/find-addresses-by-customer'
import { AddressResponse } from '../../../application/dto/address.response'

@Controller('customers/:customerId/addresses')
export class AddressController {
  constructor(
    private readonly addAddress: AddAddress,
    private readonly updateAddress: UpdateAddress,
    private readonly removeAddress: RemoveAddress,
    private readonly setDefaultAddress: SetDefaultAddress,
    private readonly findAddressesByCustomer: FindAddressesByCustomer
  ) {}

  @Get()
  findAll(@Param('customerId') customerId: string): Promise<AddressResponse[]> {
    return this.findAddressesByCustomer.run(customerId)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(TransactionInterceptor)
  async add(
    @Param('customerId') customerId: string,
    @Body() dto: AddAddressRequest
  ): Promise<void> {
    await this.addAddress.run(
      dto.id,
      customerId,
      dto.label,
      dto.street,
      dto.neighborhood ?? null,
      dto.city,
      dto.reference ?? null,
      dto.coordinates ?? null
    )
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateAddressRequest): Promise<void> {
    await this.updateAddress.run(
      id,
      dto.label,
      dto.street,
      dto.neighborhood ?? null,
      dto.city,
      dto.reference ?? null,
      dto.coordinates ?? null
    )
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseInterceptors(TransactionInterceptor)
  async remove(@Param('customerId') customerId: string, @Param('id') id: string): Promise<void> {
    await this.removeAddress.run(id, customerId)
  }

  @Post(':id/set-default')
  @HttpCode(HttpStatus.NO_CONTENT)
  async setDefault(
    @Param('customerId') customerId: string,
    @Param('id') id: string
  ): Promise<void> {
    await this.setDefaultAddress.run(id, customerId)
  }
}
