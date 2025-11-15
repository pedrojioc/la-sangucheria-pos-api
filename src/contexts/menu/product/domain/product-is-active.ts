import { BooleanValueObject } from '@/shared/domain/value-objects/boolean'

export class ProductIsActive extends BooleanValueObject {
  static active(): ProductIsActive {
    return new ProductIsActive(true)
  }

  static inactive(): ProductIsActive {
    return new ProductIsActive(false)
  }
}
