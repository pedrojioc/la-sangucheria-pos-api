import { OptionGroup } from '../option-group'

export interface ProductOptionGroupAssignment {
  groupId: string
  sortOrder: number
}

export abstract class ProductOptionGroupRepository {
  abstract replaceForProduct(
    productId: string,
    assignments: ProductOptionGroupAssignment[]
  ): Promise<void>
  abstract findByProductId(productId: string): Promise<OptionGroup[]>
}
