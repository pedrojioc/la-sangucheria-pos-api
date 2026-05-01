import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CqrsModule } from '@nestjs/cqrs'

import { AddressEntity } from './infrastructure/persistence/typeorm/address.entity'
import { AddressRepository } from './domain/repositories/address.repository'
import { TypeOrmAddressRepository } from './infrastructure/persistence/typeorm/typeorm-address.repository'

import { CustomerModule } from '@/contexts/crm/customer/customer.module'
import { CustomerRepository } from '@/contexts/crm/customer/domain/repositories/customer.repository'
import { EventBus } from '@/shared/domain/events'

import { AddAddress } from './application/add/add-address'
import { UpdateAddress } from './application/update/update-address'
import { RemoveAddress } from './application/remove/remove-address'
import { SetDefaultAddress } from './application/set-default/set-default-address'

import { AddAddressHandler } from './application/add/add-address.handler'
import { UpdateAddressHandler } from './application/update/update-address.handler'
import { RemoveAddressHandler } from './application/remove/remove-address.handler'
import { SetDefaultAddressHandler } from './application/set-default/set-default-address.handler'

import { AddressController } from './presentation/http/controllers/address.controller'

import { createProvider } from '@/core/utils/create-provider'

const CommandHandlers = [AddAddressHandler, UpdateAddressHandler, RemoveAddressHandler, SetDefaultAddressHandler]

@Module({
  imports: [TypeOrmModule.forFeature([AddressEntity]), CqrsModule, CustomerModule],
  controllers: [AddressController],
  providers: [
    { provide: AddressRepository, useClass: TypeOrmAddressRepository },

    createProvider(AddAddress, [AddressRepository, CustomerRepository, EventBus]),
    createProvider(UpdateAddress, [AddressRepository, EventBus]),
    createProvider(RemoveAddress, [AddressRepository, CustomerRepository, EventBus]),
    createProvider(SetDefaultAddress, [AddressRepository, CustomerRepository, EventBus]),

    ...CommandHandlers
  ],
  exports: [AddressRepository]
})
export class AddressModule {}
