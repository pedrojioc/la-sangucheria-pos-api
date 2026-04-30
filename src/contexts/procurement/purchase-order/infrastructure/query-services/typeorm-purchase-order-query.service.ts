import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PurchaseOrderEntity } from '../persistence/typeorm/purchase-order.entity'
import { PurchaseOrderQueryService } from '../../application/services/purchase-order-query.service'
import { PurchaseOrderListItem } from '../../application/dto/purchase-order-list-item'
import {
  PurchaseOrderDetailReadModel,
  PurchaseOrderItemReadModel
} from '../../application/dto/purchase-order-detail-read-model'
import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { FilterOperator } from '@/shared/domain/criteria/filter-operator'
import { OrderType } from '@/shared/domain/criteria/order-type'
import { PurchaseOrderStatus } from '../../domain/purchase-order-status'
import { PurchaseMethod } from '../../domain/purchase-method'

/**
 * TypeOrmPurchaseOrderQueryService - Infrastructure Implementation
 *
 * Implementa el servicio de consultas usando TypeORM.
 * Esta clase puede hacer JOINs libremente porque trabaja con Read Models,
 * no con agregados de dominio.
 *
 * Características:
 * - JOINs optimizados para incluir supplierName, ingredientName, etc.
 * - Queries específicas para listados (sin items) y detalle (con items)
 * - Separación clara de lectura vs escritura
 */
@Injectable()
export class TypeOrmPurchaseOrderQueryService implements PurchaseOrderQueryService {
  constructor(
    @InjectRepository(PurchaseOrderEntity)
    private readonly repository: Repository<PurchaseOrderEntity>
  ) {}

  /**
   * Busca órdenes con filtrado, ordenamiento y paginación
   * Incluye LEFT JOIN con suppliers para obtener supplierName
   * NO carga items para optimizar performance
   */
  async search(criteria: Criteria): Promise<PaginatedResult<PurchaseOrderListItem>> {
    const qb = this.repository
      .createQueryBuilder('po')
      .leftJoin('po.supplier', 'supplier')
      .select([
        'po.id',
        'po.orderNumber',
        'po.supplierId',
        'supplier.name',
        'po.status',
        'po.itemCount',
        'po.requestedBy',
        'po.approvedBy',
        'po.rejectedBy',
        'po.sentBy',
        'po.closedBy',
        'po.receivedBy',
        'po.purchaseMethod',
        'po.purchaseMethodDetails',
        'po.totalAmount',
        'po.currency',
        'po.requestedDate',
        'po.expectedDeliveryDate',
        'po.approvedDate',
        'po.sentDate',
        'po.receivedDate',
        'po.closedDate',
        'po.notes'
      ])

    // Apply filters
    this.applyFilters(qb, criteria)

    // Apply ordering
    this.applyOrdering(qb, criteria)

    // Get total count before pagination
    const total = await qb.getCount()

    // Apply pagination
    const offset = (criteria.pagination.page - 1) * criteria.pagination.pageSize
    qb.skip(offset).take(criteria.pagination.pageSize)

    // Execute query
    const entities = await qb.getMany()

    // Map to read models
    const items: PurchaseOrderListItem[] = entities.map(entity => ({
      id: entity.id,
      orderNumber: entity.orderNumber,
      supplierId: entity.supplierId,
      supplierName: entity.supplier?.name ?? 'Unknown',
      status: entity.status as PurchaseOrderStatus,
      itemCount: entity.itemCount,
      requestedBy: entity.requestedBy,
      approvedBy: entity.approvedBy,
      rejectedBy: entity.rejectedBy,
      sentBy: entity.sentBy,
      receivedBy: entity.receivedBy,
      closedBy: entity.closedBy,
      purchaseMethod: entity.purchaseMethod,
      purchaseMethodDetails: entity.purchaseMethodDetails,
      totalAmount: Number(entity.totalAmount),
      currency: entity.currency,
      requestedDate: entity.requestedDate,
      expectedDeliveryDate: entity.expectedDeliveryDate,
      approvedDate: entity.approvedDate,
      sentDate: entity.sentDate,
      receivedDate: entity.receivedDate,
      closedDate: entity.closedDate,
      notes: entity.notes
    }))

    return PaginatedResult.create(
      items,
      total,
      criteria.pagination.page,
      criteria.pagination.pageSize
    )
  }

  /**
   * Obtiene el detalle completo de una orden incluyendo items
   * con datos enriquecidos de supplier, ingredientes y unidades
   */
  async findDetail(id: string): Promise<PurchaseOrderDetailReadModel | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: {
        supplier: true,
        items: {
          ingredient: true,
          quantityRequestedUnit: true,
          quantityReceivedUnit: true
        }
      }
    })

    if (!entity) {
      return null
    }

    // Map items to read model
    const items: PurchaseOrderItemReadModel[] = entity.items.map(item => ({
      id: item.id,
      ingredientId: item.ingredientId,
      ingredientName: item.ingredient?.name ?? 'Unknown',
      quantityRequested: Number(item.quantityRequested),
      quantityRequestedUnitId: item.quantityRequestedUnitId,
      quantityRequestedUnitName: item.quantityRequestedUnit?.name ?? 'Unknown',
      quantityRequestedUnitSymbol: item.quantityRequestedUnit?.symbol ?? '',
      quantityReceived: item.quantityReceived ? Number(item.quantityReceived) : null,
      quantityReceivedUnitId: item.quantityReceivedUnitId,
      quantityReceivedUnitName: item.quantityReceivedUnit?.name ?? null,
      quantityReceivedUnitSymbol: item.quantityReceivedUnit?.symbol ?? null,
      unitCost: Number(item.unitCost),
      totalCost: Number(item.totalCost),
      currency: item.currency,
      notes: item.notes,
      isCancelled: item.isCancelled,
      cancellationReason: item.cancellationReason
    }))

    return {
      id: entity.id,
      orderNumber: entity.orderNumber,
      supplier: {
        id: entity.supplierId,
        name: entity.supplier?.name ?? 'Unknown',
        contactName: entity.supplier?.contactName ?? null,
        email: entity.supplier?.email ?? null,
        phone: entity.supplier?.phone ?? null
      },
      status: entity.status as PurchaseOrderStatus,
      items,
      itemCount: entity.itemCount,
      requestedBy: entity.requestedBy,
      approvedBy: entity.approvedBy,
      rejectedBy: entity.rejectedBy,
      sentBy: entity.sentBy,
      receivedBy: entity.receivedBy,
      closedBy: entity.closedBy,
      purchaseMethod: entity.purchaseMethod as PurchaseMethod | null,
      purchaseMethodDetails: entity.purchaseMethodDetails,
      totalAmount: Number(entity.totalAmount),
      currency: entity.currency,
      requestedDate: entity.requestedDate,
      expectedDeliveryDate: entity.expectedDeliveryDate,
      approvedDate: entity.approvedDate,
      sentDate: entity.sentDate,
      receivedDate: entity.receivedDate,
      closedDate: entity.closedDate,
      notes: entity.notes
    }
  }

  /**
   * Aplica los filtros del criteria al query builder
   */
  private applyFilters(
    qb: ReturnType<Repository<PurchaseOrderEntity>['createQueryBuilder']>,
    criteria: Criteria
  ): void {
    criteria.filters.items.forEach((filter, index) => {
      const paramName = `param${index}`
      const field = filter.field.value
      const value = filter.value.value

      // Handle supplierName filter specially (it's on joined table)
      if (field === 'supplierName') {
        this.applySupplierNameFilter(qb, filter.operator, value, paramName)
        return
      }

      // Map field names to entity columns
      const columnMap: Record<string, string> = {
        id: 'po.id',
        orderNumber: 'po.orderNumber',
        supplierId: 'po.supplierId',
        status: 'po.status',
        requestedBy: 'po.requestedBy',
        approvedBy: 'po.approvedBy',
        totalAmount: 'po.totalAmount',
        requestedDate: 'po.requestedDate',
        expectedDeliveryDate: 'po.expectedDeliveryDate',
        approvedDate: 'po.approvedDate'
      }

      const column = columnMap[field] ?? `po.${field}`

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

  /**
   * Aplica filtro especial para supplierName (campo de tabla joineada)
   */
  private applySupplierNameFilter(
    qb: ReturnType<Repository<PurchaseOrderEntity>['createQueryBuilder']>,
    operator: FilterOperator,
    value: unknown,
    paramName: string
  ): void {
    switch (operator) {
      case FilterOperator.CONTAINS:
        qb.andWhere(`supplier.name ILIKE :${paramName}`, { [paramName]: `%${value}%` })
        break
      case FilterOperator.STARTS_WITH:
        qb.andWhere(`supplier.name ILIKE :${paramName}`, { [paramName]: `${value}%` })
        break
      case FilterOperator.ENDS_WITH:
        qb.andWhere(`supplier.name ILIKE :${paramName}`, { [paramName]: `%${value}` })
        break
      case FilterOperator.EQUAL:
        qb.andWhere(`supplier.name = :${paramName}`, { [paramName]: value })
        break
    }
  }

  /**
   * Aplica el ordenamiento del criteria al query builder
   */
  private applyOrdering(
    qb: ReturnType<Repository<PurchaseOrderEntity>['createQueryBuilder']>,
    criteria: Criteria
  ): void {
    const orderBy = criteria.order.orderBy.value
    const orderType = criteria.order.orderType === OrderType.ASC ? 'ASC' : 'DESC'

    if (!orderBy || orderBy === 'none') {
      qb.orderBy('po.requestedDate', 'DESC')
      return
    }

    // Handle supplierName ordering specially
    if (orderBy === 'supplierName') {
      qb.orderBy('supplier.name', orderType)
      return
    }

    // Map field names to entity columns
    const columnMap: Record<string, string> = {
      id: 'po.id',
      orderNumber: 'po.orderNumber',
      status: 'po.status',
      totalAmount: 'po.totalAmount',
      requestedDate: 'po.requestedDate',
      expectedDeliveryDate: 'po.expectedDeliveryDate',
      approvedDate: 'po.approvedDate'
    }

    const column = columnMap[orderBy] ?? `po.${orderBy}`
    qb.orderBy(column, orderType)
  }
}
