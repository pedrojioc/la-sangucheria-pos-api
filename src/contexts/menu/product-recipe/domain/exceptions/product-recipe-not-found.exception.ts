import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class ProductRecipeNotFound extends DomainException {
  constructor(productId: string) {
    super(`Product recipe for product ${productId} does not exist`)
  }
}
