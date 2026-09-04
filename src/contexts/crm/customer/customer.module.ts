import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { CustomerEntity } from './infrastructure/persistence/typeorm/customer.entity'
import { CustomerRepository } from './domain/repositories/customer.repository'
import { TypeOrmCustomerRepository } from './infrastructure/persistence/typeorm/typeorm-customer.repository'
import { CustomerQueryService } from './application/services/customer-query.service'
import { TypeOrmCustomerQueryService } from './infrastructure/query-services/typeorm-customer-query.service'

import { EventBus } from '@/shared/domain/events'

import { CreateCustomer } from './application/create/create-customer'
import { UpdateCustomer } from './application/update/update-customer'
import { FindCustomer } from './application/find/find-customer'
import { SearchCustomersByPhone } from './application/search-by-phone/search-customers-by-phone'
import { SearchCustomersByCriteria } from './application/search-by-criteria/search-customers-by-criteria'

import { CustomerController } from './presentation/http/controllers/customer.controller'
import { createProvider } from '@/core/utils/create-provider'

@Module({
  imports: [TypeOrmModule.forFeature([CustomerEntity])],
  controllers: [CustomerController],
  providers: [
    { provide: CustomerRepository, useClass: TypeOrmCustomerRepository },
    { provide: CustomerQueryService, useClass: TypeOrmCustomerQueryService },

    createProvider(CreateCustomer, [CustomerRepository, EventBus]),
    createProvider(UpdateCustomer, [CustomerRepository, EventBus]),
    createProvider(FindCustomer, [CustomerRepository]),
    createProvider(SearchCustomersByPhone, [CustomerRepository]),
    createProvider(SearchCustomersByCriteria, [CustomerQueryService])
  ],
  exports: [CustomerRepository, FindCustomer]
})
export class CustomerModule {}
