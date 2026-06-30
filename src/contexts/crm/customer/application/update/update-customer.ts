import { CustomerRepository } from '../../domain/repositories/customer.repository'
import { CustomerNotExist } from '../../domain/exceptions/customer-not-exist.exception'
import { CustomerPhoneAlreadyExists } from '../../domain/exceptions/customer-phone-already-exists.exception'
import { CustomerId } from '../../domain/customer-id'
import { TaxRegimeValue } from '../../domain/customer-tax-regime'
import { EventBus } from '@/shared/domain/events'

export class UpdateCustomer {
  constructor(
    private readonly repository: CustomerRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(
    id: string,
    name: string,
    phone: string,
    email: string | null,
    taxRegime: TaxRegimeValue,
    notes: string | null
  ): Promise<void> {
    const customer = await this.repository.search(new CustomerId(id))
    if (!customer) throw new CustomerNotExist(id)

    if (customer.toPrimitives().phone !== phone && (await this.repository.existsByPhone(phone))) {
      throw new CustomerPhoneAlreadyExists(phone)
    }

    customer.update(name, phone, email, taxRegime, notes)
    await this.repository.save(customer)
    await this.eventBus.publish(customer.pullDomainEvents())
  }
}
