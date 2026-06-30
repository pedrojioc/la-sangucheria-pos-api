import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ProductCategoryEntity } from '../persistence/typeorm/product-category.entity'
import { ProductCategoryQueryService } from '../../application/services/product-category-query.service'
import { ProductCategoryListItem } from '../../application/dto/product-category-list-item'
import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { FilterOperator } from '@/shared/domain/criteria/filter-operator'
import { OrderType } from '@/shared/domain/criteria/order-type'

@Injectable()
export class TypeOrmProductCategoryQueryService implements ProductCategoryQueryService {
  constructor(
    @InjectRepository(ProductCategoryEntity)
    private readonly repository: Repository<ProductCategoryEntity>
  ) {}

  async search(criteria: Criteria): Promise<PaginatedResult<ProductCategoryListItem>> {
    const qb = this.repository
      .createQueryBuilder('pc')
      .select([
        'pc.id',
        'pc.name',
        'pc.description',
        'pc.icon',
        'pc.color',
        'pc.displayOrder',
        'pc.isActive',
        'pc.defaultStationId'
      ])

    this.applyFilters(qb, criteria)
    this.applyOrdering(qb, criteria)

    const total = await qb.getCount()

    const offset = (criteria.pagination.page - 1) * criteria.pagination.pageSize
    qb.skip(offset).take(criteria.pagination.pageSize)

    const entities = await qb.getMany()

    const items: ProductCategoryListItem[] = entities.map(entity => ({
      id: entity.id,
      name: entity.name,
      description: entity.description,
      icon: entity.icon,
      color: entity.color,
      displayOrder: entity.displayOrder,
      isActive: entity.isActive,
      defaultStationId: entity.defaultStationId
    }))

    return PaginatedResult.create(
      items,
      total,
      criteria.pagination.page,
      criteria.pagination.pageSize
    )
  }

  private applyFilters(
    qb: ReturnType<Repository<ProductCategoryEntity>['createQueryBuilder']>,
    criteria: Criteria
  ): void {
    criteria.filters.items.forEach((filter, index) => {
      const paramName = `param${index}`
      const field = filter.field.value
      const value = filter.value.value

      const columnMap: Record<string, string> = {
        id: 'pc.id',
        name: 'pc.name',
        isActive: 'pc.isActive',
        displayOrder: 'pc.displayOrder'
      }

      const column = columnMap[field] ?? `pc.${field}`

      switch (filter.operator) {
        case FilterOperator.EQUAL:
          qb.andWhere(`${column} = :${paramName}`, { [paramName]: value })
          break
        case FilterOperator.NOT_EQUAL:
          qb.andWhere(`${column} != :${paramName}`, { [paramName]: value })
          break
        case FilterOperator.CONTAINS:
          qb.andWhere(`${column} ILIKE :${paramName}`, { [paramName]: `%${value}%` })
          break
        case FilterOperator.STARTS_WITH:
          qb.andWhere(`${column} ILIKE :${paramName}`, { [paramName]: `${value}%` })
          break
        case FilterOperator.ENDS_WITH:
          qb.andWhere(`${column} ILIKE :${paramName}`, { [paramName]: `%${value}` })
          break
        case FilterOperator.GT:
          qb.andWhere(`${column} > :${paramName}`, { [paramName]: value })
          break
        case FilterOperator.GTE:
          qb.andWhere(`${column} >= :${paramName}`, { [paramName]: value })
          break
        case FilterOperator.LT:
          qb.andWhere(`${column} < :${paramName}`, { [paramName]: value })
          break
        case FilterOperator.LTE:
          qb.andWhere(`${column} <= :${paramName}`, { [paramName]: value })
          break
        case FilterOperator.IN: {
          const inValues = Array.isArray(value) ? value : String(value).split(',')
          qb.andWhere(`${column} IN (:...${paramName})`, { [paramName]: inValues })
          break
        }
        case FilterOperator.NOT_IN: {
          const notInValues = Array.isArray(value) ? value : String(value).split(',')
          qb.andWhere(`${column} NOT IN (:...${paramName})`, { [paramName]: notInValues })
          break
        }
        case FilterOperator.IS_NULL:
          qb.andWhere(`${column} IS NULL`)
          break
        case FilterOperator.IS_NOT_NULL:
          qb.andWhere(`${column} IS NOT NULL`)
          break
      }
    })
  }

  private applyOrdering(
    qb: ReturnType<Repository<ProductCategoryEntity>['createQueryBuilder']>,
    criteria: Criteria
  ): void {
    const orderBy = criteria.order.orderBy.value
    const orderType = criteria.order.orderType === OrderType.ASC ? 'ASC' : 'DESC'

    if (!orderBy || orderBy === 'none') {
      qb.orderBy('pc.displayOrder', 'ASC')
      return
    }

    const columnMap: Record<string, string> = {
      id: 'pc.id',
      name: 'pc.name',
      displayOrder: 'pc.displayOrder',
      isActive: 'pc.isActive'
    }

    const column = columnMap[orderBy] ?? `pc.${orderBy}`
    qb.orderBy(column, orderType)
  }
}
