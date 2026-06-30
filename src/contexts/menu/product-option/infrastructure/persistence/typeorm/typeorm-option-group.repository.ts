import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { OptionGroup } from '../../../domain/option-group'
import { OptionGroupId } from '../../../domain/option-group-id'
import { OptionGroupRepository } from '../../../domain/repositories/option-group.repository'
import { OptionGroupEntity } from './option-group.entity'
import { OptionItemEntity } from './option-item.entity'
import { ProductOptionGroupEntity } from './product-option-group.entity'

@Injectable()
export class TypeOrmOptionGroupRepository implements OptionGroupRepository {
  constructor(
    @InjectRepository(OptionGroupEntity)
    private readonly repository: Repository<OptionGroupEntity>,
    @InjectRepository(OptionItemEntity)
    private readonly itemRepository: Repository<OptionItemEntity>,
    @InjectRepository(ProductOptionGroupEntity)
    private readonly pivotRepository: Repository<ProductOptionGroupEntity>
  ) {}

  async save(group: OptionGroup): Promise<void> {
    const primitives = group.toPrimitives()

    const entity = this.repository.create({
      id: primitives.id,
      name: primitives.name,
      type: primitives.type,
      required: primitives.required,
      minSelections: primitives.minSelections,
      maxSelections: primitives.maxSelections,
      isActive: primitives.isActive,
      createdAt: primitives.createdAt,
      updatedAt: primitives.updatedAt
    })

    await this.repository.save(entity)

    await this.itemRepository.delete({ groupId: primitives.id })

    if (primitives.items.length > 0) {
      const itemEntities = primitives.items.map(item =>
        this.itemRepository.create({
          id: item.id,
          groupId: item.groupId,
          label: item.label,
          ingredientId: item.ingredientId,
          quantity: item.quantity,
          unitId: item.unitId,
          extraPrice: item.extraPrice,
          sortOrder: item.sortOrder,
          isActive: item.isActive
        })
      )
      await this.itemRepository.save(itemEntities)
    }
  }

  async search(id: OptionGroupId): Promise<OptionGroup | null> {
    const entity = await this.repository.findOne({
      where: { id: id.value },
      relations: ['items']
    })

    if (!entity) return null

    return this.toDomain(entity)
  }

  async searchAll(): Promise<OptionGroup[]> {
    const entities = await this.repository.find({
      where: { isActive: true },
      relations: ['items'],
      order: { createdAt: 'DESC' }
    })

    return entities.map(entity => this.toDomain(entity))
  }

  async findByIds(ids: string[]): Promise<OptionGroup[]> {
    if (ids.length === 0) return []

    const entities = await this.repository.find({
      where: { id: In(ids) },
      relations: ['items']
    })

    return entities.map(entity => this.toDomain(entity))
  }

  async delete(id: OptionGroupId): Promise<void> {
    await this.repository.delete({ id: id.value })
  }

  async isAssignedToAnyProduct(id: OptionGroupId): Promise<boolean> {
    const count = await this.pivotRepository.count({
      where: { optionGroupId: id.value }
    })
    return count > 0
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
