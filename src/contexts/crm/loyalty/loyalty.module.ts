import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CqrsModule } from '@nestjs/cqrs'

import { LoyaltyAccountEntity } from './infrastructure/persistence/typeorm/loyalty-account.entity'
import { LoyaltyAccountRepository } from './domain/repositories/loyalty-account.repository'
import { TypeOrmLoyaltyAccountRepository } from './infrastructure/persistence/typeorm/typeorm-loyalty-account.repository'

import { EventBus } from '@/shared/domain/events'

import { ReactOnCustomerCreated } from './application/subscribers/react-on-customer-created'

import { createProvider } from '@/core/utils/create-provider'

@Module({
  imports: [TypeOrmModule.forFeature([LoyaltyAccountEntity]), CqrsModule],
  providers: [
    { provide: LoyaltyAccountRepository, useClass: TypeOrmLoyaltyAccountRepository },

    createProvider(ReactOnCustomerCreated, [LoyaltyAccountRepository, EventBus])
  ],
  exports: [LoyaltyAccountRepository]
})
export class LoyaltyModule {}
