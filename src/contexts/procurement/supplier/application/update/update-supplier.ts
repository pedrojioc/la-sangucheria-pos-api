import { SupplierRepository } from '../../domain/repositories/supplier.repository'
import { SupplierId } from '../../domain/supplier-id'
import { SupplierNotExist } from '../../domain/exceptions/supplier-not-exist.exception'
import { EventBus } from '@/shared/domain/events'

export class UpdateSupplier {
  constructor(
    private readonly repository: SupplierRepository,
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
    const supplierId = new SupplierId(id)
    const supplier = await this.repository.search(supplierId)

    if (!supplier) {
      throw new SupplierNotExist(id)
    }

    supplier.update(
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

    await this.repository.save(supplier)

    const events = supplier.pullDomainEvents()
    await this.eventBus.publish(events)
  }
}
