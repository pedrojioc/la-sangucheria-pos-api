import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, EntityManager, Repository } from 'typeorm'
import { OptionGroup } from '../../../domain/option-group'
import {
  ProductOptionGroupAssignment,
  ProductOptionGroupRepository
} from '../../../domain/repositories/product-option-group.repository'
import { ProductOptionGroupEntity } from './product-option-group.entity'
import { OptionGroupEntity } from './option-group.entity'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'

@Injectable()
export class TypeOrmProductOptionGroupRepository
  extends TransactionalRepository<ProductOptionGroupEntity>
  implements ProductOptionGroupRepository
{
  constructor(
    @InjectRepository(ProductOptionGroupEntity)
    repository: Repository<ProductOptionGroupEntity>,
    @InjectRepository(OptionGroupEntity)
    private readonly groupRepository: Repository<OptionGroupEntity>,
    private readonly dataSource: DataSource,
    private readonly uowHolder: UnitOfWorkContextHolder
  ) {
    super(repository, uowHolder)
  }

  /**
   * D8 dual-path atomicity (same reasoning as EventBusRouter.publish()):
   * this delete-then-reinsert replace needs its own atomicity regardless of
   * whether the caller's endpoint carries a TransactionInterceptor. If an
   * ambient UnitOfWorkContext exists (checked directly via the holder, same
   * as EventBusRouter.publish()), join it so this write becomes part of the
   * larger request transaction. If not, open a short-lived transaction
   * scoped only to this replace so it is still atomic on its own.
   */
  async replaceForProduct(
    productId: string,
    assignments: ProductOptionGroupAssignment[]
  ): Promise<void> {
    const context = this.uowHolder.current()

    if (context) {
      await this.replaceForProductWithin(context.manager, productId, assignments)
      return
    }

    await this.dataSource.transaction(manager =>
      this.replaceForProductWithin(manager, productId, assignments)
    )
  }

  private async replaceForProductWithin(
    manager: EntityManager,
    productId: string,
    assignments: ProductOptionGroupAssignment[]
  ): Promise<void> {
    await manager.delete(ProductOptionGroupEntity, { productId })

    if (assignments.length > 0) {
      const rows = assignments.map(a =>
        manager.create(ProductOptionGroupEntity, {
          productId,
          optionGroupId: a.groupId,
          sortOrder: a.sortOrder
        })
      )
      await manager.save(ProductOptionGroupEntity, rows)
    }
  }

  async findByProductId(productId: string): Promise<OptionGroup[]> {
    const rows = await this.repo.find({
      where: { productId },
      relations: ['optionGroup', 'optionGroup.items'],
      order: { sortOrder: 'ASC' }
    })

    return rows.map(row => this.toDomain(row.optionGroup))
  }

  private toDomain(entity: OptionGroupEntity): OptionGroup {
    const items = (entity.items ?? []).sort((a, b) => a.sortOrder - b.sortOrder)

    return OptionGroup.fromPrimitives({
      id: entity.id,
      name: entity.name,
      type: entity.type,
      required: entity.required,
      minSelections: entity.minSelections,
      maxSelections: entity.maxSelections,
      isActive: entity.isActive,
      items: items.map(item => ({
        id: item.id,
        groupId: item.groupId,
        label: item.label,
        ingredientId: item.ingredientId,
        quantity: Number(item.quantity),
        unitId: item.unitId,
        extraPrice: Number(item.extraPrice),
        sortOrder: item.sortOrder,
        isActive: item.isActive
      })),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    })
  }
}
