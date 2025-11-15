import { SelectQueryBuilder, ObjectLiteral } from 'typeorm'
import { Criteria } from '@/shared/domain/criteria/criteria'
import { Filter } from '@/shared/domain/criteria/filter'
import { FilterOperator } from '@/shared/domain/criteria/filter-operator'
import { Order } from '@/shared/domain/criteria/order'
import { Pagination } from '@/shared/domain/criteria/pagination'

export class TypeOrmCriteriaConverter<T extends ObjectLiteral> {
  private parameterIndex = 0

  convert(qb: SelectQueryBuilder<T>, criteria: Criteria, alias: string): SelectQueryBuilder<T> {
    this.applyFilters(qb, criteria.filters.items, alias)
    this.applyOrder(qb, criteria.order, alias)
    this.applyPagination(qb, criteria.pagination)
    return qb
  }

  applyFilters(qb: SelectQueryBuilder<T>, filters: Filter[], alias: string): void {
    filters.forEach(filter => {
      const field = `${alias}.${filter.field.value}`
      const paramName = `param${this.parameterIndex++}`

      switch (filter.operator) {
        case FilterOperator.EQUAL:
          qb.andWhere(`${field} = :${paramName}`, { [paramName]: filter.value.value })
          break

        case FilterOperator.NOT_EQUAL:
          qb.andWhere(`${field} != :${paramName}`, { [paramName]: filter.value.value })
          break

        case FilterOperator.GT:
          qb.andWhere(`${field} > :${paramName}`, { [paramName]: filter.value.value })
          break

        case FilterOperator.GTE:
          qb.andWhere(`${field} >= :${paramName}`, { [paramName]: filter.value.value })
          break

        case FilterOperator.LT:
          qb.andWhere(`${field} < :${paramName}`, { [paramName]: filter.value.value })
          break

        case FilterOperator.LTE:
          qb.andWhere(`${field} <= :${paramName}`, { [paramName]: filter.value.value })
          break

        case FilterOperator.CONTAINS:
          qb.andWhere(`${field} ILIKE :${paramName}`, {
            [paramName]: `%${filter.value.value}%`
          })
          break

        case FilterOperator.NOT_CONTAINS:
          qb.andWhere(`${field} NOT ILIKE :${paramName}`, {
            [paramName]: `%${filter.value.value}%`
          })
          break

        case FilterOperator.STARTS_WITH:
          qb.andWhere(`${field} ILIKE :${paramName}`, {
            [paramName]: `${filter.value.value}%`
          })
          break

        case FilterOperator.ENDS_WITH:
          qb.andWhere(`${field} ILIKE :${paramName}`, {
            [paramName]: `%${filter.value.value}`
          })
          break

        case FilterOperator.IN:
          qb.andWhere(`${field} IN (:...${paramName})`, { [paramName]: filter.value.value })
          break

        case FilterOperator.NOT_IN:
          qb.andWhere(`${field} NOT IN (:...${paramName})`, { [paramName]: filter.value.value })
          break

        case FilterOperator.IS_NULL:
          qb.andWhere(`${field} IS NULL`)
          break

        case FilterOperator.IS_NOT_NULL:
          qb.andWhere(`${field} IS NOT NULL`)
          break

        default:
          throw new Error(`Unsupported filter operator: ${filter.operator}`)
      }
    })
  }

  private applyOrder(qb: SelectQueryBuilder<T>, order: Order, alias: string): void {
    const field = `${alias}.${order.orderBy.value}`
    qb.orderBy(field, order.orderType as 'ASC' | 'DESC')
  }

  private applyPagination(qb: SelectQueryBuilder<T>, pagination: Pagination): void {
    qb.skip(pagination.offset).take(pagination.pageSize)
  }
}
