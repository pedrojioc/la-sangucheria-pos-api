import { DomainException } from '@/shared/domain/exceptions/domain.exception'

export class ProductSkuAlreadyExists extends DomainException {
  constructor(sku: string) {
    super(`Product with SKU <${sku}> already exists`)
  }
}
