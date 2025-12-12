import { Supplier } from '../../domain/supplier'
import { SupplierRepository } from '../../domain/repositories/supplier.repository'
import { EventBus } from '@/shared/domain/events'

export class CreateSupplier {
  constructor(
    private readonly supplierRepository: SupplierRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(
    id: string,
    name: string,
    contactName: string | null,
    email: string | null,
    phone: string | null,
    whatsappNumber: string | null,
    address: string | null,
    taxId: string | null,
    paymentTerms: string | null,
    notes: string | null,
    rating: number | null,
    isActive: boolean
  ): Promise<void> {
    const supplier = Supplier.create(
      id,
      name,
      contactName,
      email,
      phone,
      whatsappNumber,
      address,
      taxId,
      paymentTerms,
      notes,
      rating,
      isActive
    )

    await this.supplierRepository.save(supplier)

    const events = supplier.pullDomainEvents()
    await this.eventBus.publish(events)
  }
}
