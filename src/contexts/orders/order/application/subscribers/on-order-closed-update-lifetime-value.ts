import { Injectable } from '@nestjs/common'
import { DomainEventClass, DomainEventSubscriber } from '@shared/domain/events'
import { OrderClosedEvent } from '../../domain/events/order-closed.event'
import { CustomerRepository } from '@contexts/crm/customer/domain/repositories/customer.repository'
import { CustomerId } from '@contexts/crm/customer/domain/customer-id'

@Injectable()
export class OnOrderClosedUpdateLifetimeValue implements DomainEventSubscriber<OrderClosedEvent> {
  constructor(private readonly customerRepository: CustomerRepository) {}

  subscribedTo(): DomainEventClass[] {
    return [OrderClosedEvent]
  }

  async on(event: OrderClosedEvent): Promise<void> {
    const { customerId, total } = event.toPrimitives()
    if (!customerId) return

    const customer = await this.customerRepository.search(new CustomerId(customerId))
    if (!customer) return

    customer.addToLifetimeValue(total)
    await this.customerRepository.save(customer)
  }
}
