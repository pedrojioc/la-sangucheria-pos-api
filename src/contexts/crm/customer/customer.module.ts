import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CqrsModule } from '@nestjs/cqrs'

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

import { CreateCustomerHandler } from './application/create/create-customer.handler'
import { UpdateCustomerHandler } from './application/update/update-customer.handler'
import { FindCustomerHandler } from './application/find/find-customer.handler'
import { SearchCustomersByPhoneHandler } from './application/search-by-phone/search-customers-by-phone.handler'
import { SearchCustomersByCriteriaHandler } from './application/search-by-criteria/search-customers-by-criteria.handler'

import { CustomerController } from './presentation/http/controllers/customer.controller'
import { createProvider } from '@/core/utils/create-provider'

const CommandHandlers = [CreateCustomerHandler, UpdateCustomerHandler]
const QueryHandlers = [
  FindCustomerHandler,
  SearchCustomersByPhoneHandler,
  SearchCustomersByCriteriaHandler
]

@Module({
  imports: [TypeOrmModule.forFeature([CustomerEntity]), CqrsModule],
  controllers: [CustomerController],
  providers: [
    { provide: CustomerRepository, useClass: TypeOrmCustomerRepository },
    { provide: CustomerQueryService, useClass: TypeOrmCustomerQueryService },

    createProvider(CreateCustomer, [CustomerRepository, EventBus]),
    createProvider(UpdateCustomer, [CustomerRepository, EventBus]),
    createProvider(FindCustomer, [CustomerRepository]),
    createProvider(SearchCustomersByPhone, [CustomerRepository]),
    createProvider(SearchCustomersByCriteria, [CustomerQueryService]),

    ...CommandHandlers,
    ...QueryHandlers
  ],
  exports: [CustomerRepository, FindCustomer]
})
export class CustomerModule {}
