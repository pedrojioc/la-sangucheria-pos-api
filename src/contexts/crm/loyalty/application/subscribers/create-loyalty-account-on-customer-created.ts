import { Injectable } from '@nestjs/common'
import { DomainEventClass, DomainEventSubscriber } from '@/shared/domain/events'
import { CustomerCreatedEvent } from '@/contexts/crm/customer/domain/events/customer-created.event'
import { LoyaltyAccount } from '../../domain/loyalty-account'
import { LoyaltyAccountRepository } from '../../domain/repositories/loyalty-account.repository'
import { EventBus } from '@/shared/domain/events'
import { Uuid } from '@shared/domain/value-objects/uuid'

@Injectable()
export class CreateLoyaltyAccountOnCustomerCreated
  implements DomainEventSubscriber<CustomerCreatedEvent>
{
  constructor(
    private readonly loyaltyAccountRepository: LoyaltyAccountRepository,
    private readonly eventBus: EventBus
  ) {}

  subscribedTo(): DomainEventClass[] {
    return [CustomerCreatedEvent]
  }

  async on(event: CustomerCreatedEvent): Promise<void> {
    const { customerId } = event.toPrimitives()
    const accountId = Uuid.random().value
    const account = LoyaltyAccount.create(accountId, customerId)
    await this.loyaltyAccountRepository.save(account)
    await this.eventBus.publish(account.pullDomainEvents())
  }
}
