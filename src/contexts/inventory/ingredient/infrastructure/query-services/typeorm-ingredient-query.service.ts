import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { Criteria } from '@/shared/domain/criteria/criteria'
import { IngredientEntity } from '@/contexts/inventory/ingredient/infrastructure/persistence/typeorm/ingredient.entity'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { IngredientQueryService } from '@/contexts/inventory/ingredient/application/services/ingredient-query.service'
import { TypeOrmCriteriaConverter } from '@/shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'
import { IngredientWithDetailsDto } from '@/contexts/inventory/ingredient/application/dto/ingredient-with-details.dto'

export class TypeormIngredientQueryService implements IngredientQueryService {
  constructor(
    @InjectRepository(IngredientEntity)
    private readonly ingredientRepository: Repository<IngredientEntity>
  ) {}

  async searchWithDetails(criteria: Criteria): Promise<PaginatedResult<IngredientWithDetailsDto>> {
    const converter = new TypeOrmCriteriaConverter<IngredientEntity>()

    let queryBuilder = this.ingredientRepository.createQueryBuilder('ingredient')
    queryBuilder.leftJoinAndSelect('ingredient.category', 'category')
    queryBuilder.leftJoinAndSelect('ingredient.unit', 'unit')
    // queryBuilder.leftJoinAndSelect('ingredient.preferredSupplier', 'supplier')

    queryBuilder = converter.convert(queryBuilder, criteria, 'ingredient')

    const [items, total] = await queryBuilder.getManyAndCount()
    const ingredients = items.map(
      row =>
        new IngredientWithDetailsDto(
          row.id,
          row.name,
          row.description,
          row.category,
          row.unit,
          row.minimumStock,
          row.maximumStock,
          row.isPerishable,
          row.shelfLifeDays,
          row.storageLocation,
          row.isActive
        )
    )

    return PaginatedResult.create(
      ingredients,
      total,
      criteria.pagination.page,
      criteria.pagination.pageSize
    )
  }
}
