import { Supplier } from '../../domain/supplier'
import { SupplierRepository } from '../../domain/repositories/supplier.repository'

export class FindAllSuppliers {
  constructor(private readonly repository: SupplierRepository) {}

  async run(): Promise<Supplier[]> {
    return this.repository.searchAll()
  }
}
