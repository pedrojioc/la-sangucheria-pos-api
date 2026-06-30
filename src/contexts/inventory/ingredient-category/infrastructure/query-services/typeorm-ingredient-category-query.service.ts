import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { TypeOrmCriteriaConverter } from '@/shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'
import { IngredientCategoryQueryService } from '../../application/services/ingredient-category-query.service'
import { IngredientCategoryListItem } from '../../application/dto/ingredient-category-list-item'
import { IngredientCategoryEntity } from '../persistence/typeorm/ingredient-category.entity'

@Injectable()
export class TypeOrmIngredientCategoryQueryService implements IngredientCategoryQueryService {
  constructor(
    @InjectRepository(IngredientCategoryEntity)
    private readonly repository: Repository<IngredientCategoryEntity>
  ) {}

  async search(criteria: Criteria): Promise<PaginatedResult<IngredientCategoryListItem>> {
    const converter = new TypeOrmCriteriaConverter<IngredientCategoryEntity>()
    let qb = this.repository.createQueryBuilder('ingredientCategory')
    qb = converter.convert(qb, criteria, 'ingredientCategory')
    const [entities, total] = await qb.getManyAndCount()

    const items: IngredientCategoryListItem[] = entities.map(e => ({
      id: e.id,
      name: e.name,
      description: e.description,
      icon: e.icon,
      color: e.color,
      sortOrder: e.sortOrder,
      isActive: e.isActive,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt
    }))

    return PaginatedResult.create(
      items,
      total,
      criteria.pagination.page,
      criteria.pagination.pageSize
    )
  }
}
