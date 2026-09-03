import { DomainException } from '@/shared/domain/exceptions/domain.exception'
import { ProductId } from '../product-id'

export class ProductNotExist extends DomainException {
  constructor(id: ProductId) {
    super(`Product with id <${id.value}> does not exist`)
  }
}
