import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { OptionGroup } from '../../../domain/option-group'
import {
  ProductOptionGroupAssignment,
  ProductOptionGroupRepository
} from '../../../domain/repositories/product-option-group.repository'
import { ProductOptionGroupEntity } from './product-option-group.entity'
import { OptionGroupEntity } from './option-group.entity'

@Injectable()
export class TypeOrmProductOptionGroupRepository implements ProductOptionGroupRepository {
  constructor(
    @InjectRepository(ProductOptionGroupEntity)
    private readonly repository: Repository<ProductOptionGroupEntity>,
    @InjectRepository(OptionGroupEntity)
    private readonly groupRepository: Repository<OptionGroupEntity>,
    private readonly dataSource: DataSource
  ) {}

  async replaceForProduct(
    productId: string,
    assignments: ProductOptionGroupAssignment[]
  ): Promise<void> {
    await this.dataSource.transaction(async manager => {
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
    })
  }

  async findByProductId(productId: string): Promise<OptionGroup[]> {
    const rows = await this.repository.find({
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
