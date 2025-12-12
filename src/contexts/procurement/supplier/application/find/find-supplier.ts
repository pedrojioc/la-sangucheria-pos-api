import { Supplier } from '../../domain/supplier'
import { SupplierId } from '../../domain/supplier-id'
import { SupplierRepository } from '../../domain/repositories/supplier.repository'
import { SupplierNotExist } from '../../domain/exceptions/supplier-not-exist.exception'

export class FindSupplier {
  constructor(private readonly repository: SupplierRepository) {}

  async run(id: string): Promise<Supplier> {
    const supplier = await this.repository.search(new SupplierId(id))

    if (!supplier) {
      throw new SupplierNotExist(id)
    }

    return supplier
  }
}
