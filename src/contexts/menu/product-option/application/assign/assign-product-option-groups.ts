import { ProductRepository } from '@contexts/menu/product/domain/repositories/product.repository'
import { ProductId } from '@contexts/menu/product/domain/product-id'
import { ProductNotExist } from '@contexts/menu/product/domain/exceptions/product-not-exist.exception'
import { OptionGroupRepository } from '../../domain/repositories/option-group.repository'
import { ProductOptionGroupRepository } from '../../domain/repositories/product-option-group.repository'
import { OptionGroupNotFound } from '../../domain/exceptions/option-group-not-found.exception'
import { DuplicateOptionGroupInAssignment } from '../../domain/exceptions/duplicate-option-group-in-assignment.exception'

export interface AssignmentItem {
  id: string
  sortOrder: number
}

export class AssignProductOptionGroups {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly optionGroupRepository: OptionGroupRepository,
    private readonly productOptionGroupRepository: ProductOptionGroupRepository
  ) {}

  async run(productId: string, assignments: AssignmentItem[]): Promise<void> {
    const product = await this.productRepository.search(new ProductId(productId))

    if (!product) {
      throw new ProductNotExist(new ProductId(productId))
    }

    const groupIds = assignments.map(a => a.id)

    const duplicates = groupIds.filter((id, index) => groupIds.indexOf(id) !== index)
    if (duplicates.length > 0) {
      throw new DuplicateOptionGroupInAssignment(duplicates[0])
    }

    if (groupIds.length > 0) {
      const found = await this.optionGroupRepository.findByIds(groupIds)
      if (found.length !== groupIds.length) {
        const foundIds = new Set(found.map(g => g.id.value))
        const missing = groupIds.find(id => !foundIds.has(id))!
        throw new OptionGroupNotFound(missing)
      }
    }

    await this.productOptionGroupRepository.replaceForProduct(
      productId,
      assignments.map(a => ({ groupId: a.id, sortOrder: a.sortOrder }))
    )
  }
}
