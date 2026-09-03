import { NotFoundException } from '@shared/domain/exceptions/domain.exception'

export class ProductRecipeNotFound extends NotFoundException {
  constructor(productId: string) {
    super(`Product recipe for product ${productId} does not exist`)
  }
}
