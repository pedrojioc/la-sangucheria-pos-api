import { BusinessRuleViolationException } from '@/shared/domain/exceptions/domain.exception'

export class ProductSkuAlreadyExists extends BusinessRuleViolationException {
  constructor(sku: string) {
    super(`Product with SKU <${sku}> already exists`)
  }
}
