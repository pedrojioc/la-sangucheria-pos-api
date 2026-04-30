import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { InventoryLevelEntity } from '../persistence/typeorm/inventory-level.entity'
import { InventoryMovementEntity } from '../persistence/typeorm/inventory-movement.entity'
import { InventoryLevelQueryService } from '../../application/services/inventory-level-query.service'
import { InventoryLevelListItem } from '../../application/dto/inventory-level-list-item'
import { InventoryLevelSearchResult } from '../../application/dto/inventory-level-search-result'
import { MovementType } from '../../domain/movement-type'
import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { FilterOperator } from '@/shared/domain/criteria/filter-operator'
import { OrderType } from '@/shared/domain/criteria/order-type'

/**
 * TypeOrmInventoryLevelQueryService - Infrastructure Implementation
 *
 * Implementa el servicio de consultas usando TypeORM.
 * Hace JOINs con ingredients y units para obtener nombres desnormalizados.
 */
@Injectable()
export class TypeOrmInventoryLevelQueryService implements InventoryLevelQueryService {
  constructor(
    @InjectRepository(InventoryLevelEntity)
    private readonly repository: Repository<InventoryLevelEntity>,
    @InjectRepository(InventoryMovementEntity)
    private readonly movementRepository: Repository<InventoryMovementEntity>
  ) {}

  async search(criteria: Criteria): Promise<InventoryLevelSearchResult> {
    const statusFields = new Set(['isLowStock', 'isCriticalStock', 'isOutOfStock'])
    const baseFilterItems = criteria.filters.items.filter(f => !statusFields.has(f.field.value))
    const statusFilterItems = criteria.filters.items.filter(f => statusFields.has(f.field.value))

    // QB base con JOINs y solo filtros no-status (reutilizado para stats)
    const baseQb = this.repository
      .createQueryBuilder('il')
      .leftJoin('il.ingredient', 'ingredient')
      .leftJoin('ingredient.category', 'category')
      .leftJoin('il.unit', 'unit')
      .select([
        'il.id',
        'il.ingredientId',
        'il.currentQuantity',
        'il.unitId',
        'il.minimumQuantity',
        'il.maximumQuantity',
        'il.reorderPoint',
        'il.updatedAt',
        'ingredient.name',
        'category.name',
        'unit.name',
        'unit.symbol'
      ])

    this.applyFilterItems(baseQb, baseFilterItems)

    // QB de datos: agrega filtros de status, orden y paginación
    const dataQb = baseQb.clone()
    this.applyFilterItems(dataQb, statusFilterItems)
    this.applyOrdering(dataQb, criteria)

    const total = await dataQb.getCount()

    const offset = (criteria.pagination.page - 1) * criteria.pagination.pageSize
    dataQb.skip(offset).take(criteria.pagination.pageSize)

    const entities = await dataQb.getMany()

    const ingredientIds = entities.map(e => e.ingredientId)
    const lastMovementByIngredient = await this.fetchLastMovementTypes(ingredientIds)

    const items: InventoryLevelListItem[] = entities.map(entity => {
      const currentQty = Number(entity.currentQuantity)
      const minQty = Number(entity.minimumQuantity)

      return {
        id: entity.id,
        ingredientId: entity.ingredientId,
        ingredientName: entity.ingredient?.name ?? 'Unknown',
        categoryName: entity.ingredient?.category?.name ?? 'Unknown',
        currentQuantity: currentQty,
        unitId: entity.unitId,
        unitName: entity.unit?.name ?? 'Unknown',
        unitSymbol: entity.unit?.symbol ?? '',
        minimumQuantity: minQty,
        maximumQuantity: entity.maximumQuantity !== null ? Number(entity.maximumQuantity) : null,
        reorderPoint: entity.reorderPoint !== null ? Number(entity.reorderPoint) : null,
        isLowStock: minQty > 0 && currentQty < minQty && currentQty > 0,
        isCriticalStock: minQty > 0 && currentQty > 0 && currentQty <= minQty * 0.25,
        isOutOfStock: currentQty === 0,
        lastMovementType: lastMovementByIngredient.get(entity.ingredientId) ?? null,
        updatedAt: entity.updatedAt
      }
    })

    // Stats: 3 COUNTs paralelos sobre el QB base (respetan filtros no-status)
    const [lowStockCount, criticalStockCount, outOfStockCount] = await Promise.all([
      baseQb
        .clone()
        .andWhere('il.minimum_quantity > 0')
        .andWhere('il.current_quantity > 0')
        .andWhere('il.current_quantity < il.minimum_quantity')
        .getCount(),
      baseQb
        .clone()
        .andWhere('il.minimum_quantity > 0')
        .andWhere('il.current_quantity > 0')
        .andWhere('il.current_quantity <= il.minimum_quantity * 0.25')
        .getCount(),
      baseQb.clone().andWhere('il.current_quantity = 0').getCount()
    ])

    return {
      paginated: PaginatedResult.create(
        items,
        total,
        criteria.pagination.page,
        criteria.pagination.pageSize
      ),
      stats: { lowStockCount, criticalStockCount, outOfStockCount }
    }
  }

  private async fetchLastMovementTypes(
    ingredientIds: string[]
  ): Promise<Map<string, MovementType>> {
    if (ingredientIds.length === 0) return new Map()

    const rows = await this.movementRepository
      .createQueryBuilder('im')
      .select('im.ingredientId', 'ingredientId')
      .addSelect('im.type', 'type')
      .where('im.ingredientId IN (:...ids)', { ids: ingredientIds })
      .andWhere(
        `im.performedAt = (
          SELECT MAX(im2.performed_at)
          FROM inventory_movements im2
          WHERE im2.ingredient_id = im.ingredient_id
        )`
      )
      .distinctOn(['im.ingredientId'])
      .getRawMany<{ ingredientId: string; type: MovementType }>()

    return new Map(rows.map(r => [r.ingredientId, r.type]))
  }

  private applyFilterItems(
    qb: ReturnType<Repository<InventoryLevelEntity>['createQueryBuilder']>,
    filters: Criteria['filters']['items']
  ): void {
    filters.forEach((filter, index) => {
      const paramName = `param${index}`
      const field = filter.field.value
      const value = filter.value.value

      // Filtros en tablas joineadas
      if (field === 'ingredientName') {
        this.applyStringFilter(qb, 'ingredient.name', filter.operator, value, paramName)
        return
      }

      if (field === 'categoryName') {
        this.applyStringFilter(qb, 'category.name', filter.operator, value, paramName)
        return
      }

      // Filtros booleanos calculados
      if (field === 'isLowStock' && String(value) === 'true') {
        qb.andWhere('il.current_quantity < il.minimum_quantity')
        qb.andWhere('il.current_quantity > 0')
        return
      }

      if (field === 'isCriticalStock' && String(value) === 'true') {
        qb.andWhere('il.current_quantity > 0')
        qb.andWhere('il.current_quantity <= il.minimum_quantity * 0.25')
        qb.andWhere('il.minimum_quantity > 0')
        return
      }

      if (field === 'isOutOfStock' && String(value) === 'true') {
        qb.andWhere('il.current_quantity = 0')
        return
      }

      const columnMap: Record<string, string> = {
        id: 'il.id',
        ingredientId: 'il.ingredientId',
        currentQuantity: 'il.currentQuantity',
        minimumQuantity: 'il.minimumQuantity',
        maximumQuantity: 'il.maximumQuantity',
        reorderPoint: 'il.reorderPoint',
        unitId: 'il.unitId'
      }

      const column = columnMap[field] ?? `il.${field}`

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
        case FilterOperator.IS_NULL:
          qb.andWhere(`${column} IS NULL`)
          break
        case FilterOperator.IS_NOT_NULL:
          qb.andWhere(`${column} IS NOT NULL`)
          break
      }
    })
  }

  private applyStringFilter(
    qb: ReturnType<Repository<InventoryLevelEntity>['createQueryBuilder']>,
    column: string,
    operator: FilterOperator,
    value: unknown,
    paramName: string
  ): void {
    switch (operator) {
      case FilterOperator.CONTAINS:
        qb.andWhere(`${column} ILIKE :${paramName}`, { [paramName]: `%${value}%` })
        break
      case FilterOperator.STARTS_WITH:
        qb.andWhere(`${column} ILIKE :${paramName}`, { [paramName]: `${value}%` })
        break
      case FilterOperator.ENDS_WITH:
        qb.andWhere(`${column} ILIKE :${paramName}`, { [paramName]: `%${value}` })
        break
      case FilterOperator.EQUAL:
        qb.andWhere(`${column} = :${paramName}`, { [paramName]: value })
        break
    }
  }

  private applyOrdering(
    qb: ReturnType<Repository<InventoryLevelEntity>['createQueryBuilder']>,
    criteria: Criteria
  ): void {
    const orderBy = criteria.order.orderBy.value
    const orderType = criteria.order.orderType === OrderType.ASC ? 'ASC' : 'DESC'

    if (!orderBy || orderBy === 'none') {
      // Default: menos stock primero
      qb.orderBy('il.currentQuantity', 'ASC')
      return
    }

    if (orderBy === 'ingredientName') {
      qb.orderBy('ingredient.name', orderType)
      return
    }

    if (orderBy === 'categoryName') {
      qb.orderBy('category.name', orderType)
      return
    }

    const columnMap: Record<string, string> = {
      currentQuantity: 'il.currentQuantity',
      minimumQuantity: 'il.minimumQuantity',
      updatedAt: 'il.updatedAt'
    }

    const column = columnMap[orderBy] ?? `il.${orderBy}`
    qb.orderBy(column, orderType)
  }
}
