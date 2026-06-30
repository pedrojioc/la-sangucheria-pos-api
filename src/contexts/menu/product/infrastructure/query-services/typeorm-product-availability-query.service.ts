import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import {
  ProductAvailability,
  ProductAvailabilityQueryService
} from '../../application/services/product-availability-query.service'

@Injectable()
export class TypeOrmProductAvailabilityQueryService implements ProductAvailabilityQueryService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getAvailabilityMap(productIds: string[]): Promise<Map<string, ProductAvailability>> {
    if (productIds.length === 0) {
      return new Map()
    }

    const recipeResults: { product_id: string; available: boolean }[] = await this.dataSource.query(
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

    const directResults: { product_id: string; available: boolean }[] = await this.dataSource.query(
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

    for (const row of recipeResults) {
      map.set(row.product_id, row.available ? 'AVAILABLE' : 'UNAVAILABLE')
    }

    for (const row of directResults) {
      map.set(row.product_id, row.available ? 'AVAILABLE' : 'UNAVAILABLE')
    }

    for (const id of productIds) {
      if (!map.has(id)) {
        map.set(id, 'UNAVAILABLE')
      }
    }

    return map
  }
}
