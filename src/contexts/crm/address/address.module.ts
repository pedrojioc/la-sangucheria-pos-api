import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

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
import { FindAddressesByCustomer } from './application/find-by-customer/find-addresses-by-customer'

import { AddressController } from './presentation/http/controllers/address.controller'

import { createProvider } from '@/core/utils/create-provider'

@Module({
  imports: [TypeOrmModule.forFeature([AddressEntity]), CustomerModule],
  controllers: [AddressController],
  providers: [
    { provide: AddressRepository, useClass: TypeOrmAddressRepository },

    createProvider(AddAddress, [AddressRepository, CustomerRepository, EventBus]),
    createProvider(UpdateAddress, [AddressRepository, EventBus]),
    createProvider(RemoveAddress, [AddressRepository, CustomerRepository, EventBus]),
    createProvider(SetDefaultAddress, [AddressRepository, CustomerRepository, EventBus]),
    createProvider(FindAddressesByCustomer, [AddressRepository])
  ],
  exports: [AddressRepository]
})
export class AddressModule {}
