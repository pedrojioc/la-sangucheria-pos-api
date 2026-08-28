import { Module, OnModuleInit } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CqrsModule } from '@nestjs/cqrs'

import { LoyaltyAccountEntity } from './infrastructure/persistence/typeorm/loyalty-account.entity'
import { LoyaltyAccountRepository } from './domain/repositories/loyalty-account.repository'
import { TypeOrmLoyaltyAccountRepository } from './infrastructure/persistence/typeorm/typeorm-loyalty-account.repository'

import { EventBus } from '@/shared/domain/events'

import { CreateLoyaltyAccountOnCustomerCreated } from './application/subscribers/create-loyalty-account-on-customer-created'

import { createProvider } from '@/core/utils/create-provider'

@Module({
  imports: [TypeOrmModule.forFeature([LoyaltyAccountEntity]), CqrsModule],
  providers: [
    { provide: LoyaltyAccountRepository, useClass: TypeOrmLoyaltyAccountRepository },

    createProvider(CreateLoyaltyAccountOnCustomerCreated, [LoyaltyAccountRepository, EventBus])
  ],
  exports: [LoyaltyAccountRepository]
})
export class LoyaltyModule implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBus,
    private readonly createLoyaltyAccountOnCustomerCreated: CreateLoyaltyAccountOnCustomerCreated
  ) {}

  onModuleInit(): void {
    this.eventBus.addSubscribers([this.createLoyaltyAccountOnCustomerCreated])
  }
}
