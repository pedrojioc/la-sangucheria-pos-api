import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'
import { AddAddressRequest } from '../dto/add-address.request'
import { UpdateAddressRequest } from '../dto/update-address.request'
import { AddAddressCommand } from '../../../application/add/add-address.command'
import { UpdateAddressCommand } from '../../../application/update/update-address.command'
import { RemoveAddressCommand } from '../../../application/remove/remove-address.command'
import { SetDefaultAddressCommand } from '../../../application/set-default/set-default-address.command'

@Controller('customers/:customerId/addresses')
export class AddressController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
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
