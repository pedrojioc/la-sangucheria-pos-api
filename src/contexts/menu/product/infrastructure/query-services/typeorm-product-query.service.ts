import { Injectable } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { TypeOrmCriteriaConverter } from '@/shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'
import { ProductQueryService } from '../../application/services/product-query.service'
import type {
  ProductListItem,
  ProductListItemOptionGroup,
  ProductListItemOptionItem
} from '../../application/dto/product-list-item'
import { ProductAvailability } from '../../application/services/product-availability-query.service'
import { ProductEntity } from '../persistence/typeorm/product.entity'

@Injectable()
export class TypeOrmProductQueryService implements ProductQueryService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly repository: Repository<ProductEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {}

  async search(criteria: Criteria): Promise<PaginatedResult<ProductListItem>> {
    const converter = new TypeOrmCriteriaConverter<ProductEntity>()
    let qb = this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')

    qb = converter.convert(qb, criteria, 'product')

    const total = await qb.getCount()
    const entities = await qb.getMany()

    if (entities.length === 0) {
      return PaginatedResult.create(
        [],
        total,
        criteria.pagination.page,
        criteria.pagination.pageSize
      )
    }

    const productIds = entities.map(e => e.id)
    const [availabilityMap, optionGroupsMap] = await Promise.all([
      this.fetchAvailabilityMap(productIds),
      this.fetchOptionGroupsMap(productIds)
    ])

    const items: ProductListItem[] = entities.map(e => ({
      id: e.id,
      name: e.name,
      description: e.description,
      categoryId: e.categoryId,
      categoryName: e.category?.name ?? '',
      ingredientId: e.ingredientId,
      price: Number(e.price),
      imageUrl: e.imageUrl,
      preparationTime: e.preparationTime,
      isActive: e.isActive,
      displayOrder: e.displayOrder,
      sku: e.sku,
      tags: e.tags,
      inventoryStrategyType: e.inventoryStrategyType,
      availability: availabilityMap.get(e.id) ?? 'UNAVAILABLE',
      optionGroups: optionGroupsMap.get(e.id) ?? [],
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

  private async fetchAvailabilityMap(
    productIds: string[]
  ): Promise<Map<string, ProductAvailability>> {
    const recipeRows: { product_id: string; available: boolean }[] = await this.dataSource.query(
      `
      SELECT
        p.id AS product_id,
        BOOL_AND(
          COALESCE((
            SELECT SUM(b.remaining_quantity)
            FROM inventory_batches b
            WHERE b.ingredient_id = pri.ingredient_id
              AND b.remaining_quantity > 0
          ), 0) >= pri.quantity
        ) AS available
      FROM products p
      JOIN product_recipes pr ON pr.product_id = p.id
      JOIN product_recipe_items pri ON pri.product_recipe_id = pr.id
      WHERE p.id = ANY($1)
        AND p.inventory_strategy_type = 'RECIPE'
      GROUP BY p.id
      `,
      [productIds]
    )

    const directRows: { product_id: string; available: boolean }[] = await this.dataSource.query(
      `
      SELECT
        p.id AS product_id,
        COALESCE(SUM(b.remaining_quantity), 0) > 0 AS available
      FROM products p
      LEFT JOIN inventory_batches b ON b.ingredient_id = p.ingredient_id AND b.remaining_quantity > 0
      WHERE p.id = ANY($1)
        AND p.inventory_strategy_type = 'DIRECT'
      GROUP BY p.id
      `,
      [productIds]
    )

    const map = new Map<string, ProductAvailability>()

    for (const row of recipeRows) {
      map.set(row.product_id, row.available ? 'AVAILABLE' : 'UNAVAILABLE')
    }
    for (const row of directRows) {
      map.set(row.product_id, row.available ? 'AVAILABLE' : 'UNAVAILABLE')
    }
    for (const id of productIds) {
      if (!map.has(id)) map.set(id, 'UNAVAILABLE')
    }

    return map
  }

  private async fetchOptionGroupsMap(
    productIds: string[]
  ): Promise<Map<string, ProductListItemOptionGroup[]>> {
    const rows: {
      product_id: string
      group_id: string
      group_name: string
      group_type: 'SWAP' | 'ADD'
      required: boolean
      min_selections: number
      max_selections: number
      group_is_active: boolean
      group_sort_order: number
      item_id: string | null
      item_label: string | null
      ingredient_id: string | null
      quantity: number | null
      unit_id: string | null
      extra_price: number | null
      item_sort_order: number | null
      item_is_active: boolean | null
    }[] = await this.dataSource.query(
      `
      SELECT
        pog.product_id,
        og.id            AS group_id,
        og.name          AS group_name,
        og.type          AS group_type,
        og.required,
        og.min_selections,
        og.max_selections,
        og.is_active     AS group_is_active,
        pog.sort_order   AS group_sort_order,
        oi.id            AS item_id,
        oi.label         AS item_label,
        oi.ingredient_id,
        oi.quantity,
        oi.unit_id,
        oi.extra_price,
        oi.sort_order    AS item_sort_order,
        oi.is_active     AS item_is_active
      FROM product_option_groups pog
      JOIN option_groups og ON og.id = pog.option_group_id
      LEFT JOIN option_items oi ON oi.group_id = og.id
      WHERE pog.product_id = ANY($1)
      ORDER BY pog.product_id, pog.sort_order, oi.sort_order
      `,
      [productIds]
    )

    const map = new Map<string, Map<string, ProductListItemOptionGroup>>()

    for (const row of rows) {
      if (!map.has(row.product_id)) map.set(row.product_id, new Map())
      const groupsForProduct = map.get(row.product_id)!

      if (!groupsForProduct.has(row.group_id)) {
        groupsForProduct.set(row.group_id, {
          id: row.group_id,
          name: row.group_name,
          type: row.group_type,
          required: row.required,
          minSelections: row.min_selections,
          maxSelections: row.max_selections,
          isActive: row.group_is_active,
          items: []
        })
      }

      if (row.item_id !== null) {
        const item: ProductListItemOptionItem = {
          id: row.item_id,
          groupId: row.group_id,
          label: row.item_label!,
          ingredientId: row.ingredient_id!,
          quantity: Number(row.quantity),
          unitId: row.unit_id!,
          extraPrice: Number(row.extra_price),
          sortOrder: row.item_sort_order!,
          isActive: row.item_is_active!
        }
        groupsForProduct.get(row.group_id)!.items.push(item)
      }
    }

    const result = new Map<string, ProductListItemOptionGroup[]>()
    for (const [productId, groupsMap] of map) {
      result.set(productId, Array.from(groupsMap.values()))
    }
    return result
  }
}
