import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { OptionGroupEntity } from '../persistence/typeorm/option-group.entity'
import { OptionGroupQueryService } from '../../application/services/option-group-query.service'
import {
  OptionGroupListItem,
  OptionItemListData
} from '../../application/dto/option-group-list-item'
import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { TypeOrmCriteriaConverter } from '@/shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'

@Injectable()
export class TypeOrmOptionGroupQueryService implements OptionGroupQueryService {
  constructor(
    @InjectRepository(OptionGroupEntity)
    private readonly repository: Repository<OptionGroupEntity>
  ) {}

  async search(criteria: Criteria): Promise<PaginatedResult<OptionGroupListItem>> {
    const qb = this.repository
      .createQueryBuilder('option_group')
      .leftJoinAndSelect('option_group.items', 'items')

    const converter = new TypeOrmCriteriaConverter()
    converter.convert(qb, criteria, 'option_group')

    const [entities, total] = await qb.getManyAndCount()

    const items: OptionGroupListItem[] = entities.map(
      entity =>
        new OptionGroupListItem(
          entity.id,
          entity.name,
          entity.type,
          entity.required,
          entity.minSelections,
          entity.maxSelections,
          entity.isActive,
          (entity.items ?? []).map(
            (item): OptionItemListData => ({
              id: item.id,
              groupId: item.groupId,
              label: item.label,
              ingredientId: item.ingredientId,
              quantity: Number(item.quantity),
              unitId: item.unitId,
              extraPrice: Number(item.extraPrice),
              sortOrder: item.sortOrder,
              isActive: item.isActive
            })
          )
        )
    )

    return PaginatedResult.create(
      items,
      total,
      criteria.pagination?.page || 1,
      criteria.pagination?.pageSize || 20
    )
  }
}
