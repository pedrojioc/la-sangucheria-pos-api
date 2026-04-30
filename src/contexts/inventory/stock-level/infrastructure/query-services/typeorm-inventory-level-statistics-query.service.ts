import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { InventoryLevelStatisticsQueryService } from '../../application/services/inventory-level-statistics-query.service'
import { InventoryLevelStatistics } from '../../application/dto/inventory-level-statistics'

@Injectable()
export class TypeOrmInventoryLevelStatisticsQueryService
  implements InventoryLevelStatisticsQueryService
{
  constructor(private readonly dataSource: DataSource) {}

  async getStatistics(): Promise<InventoryLevelStatistics> {
    const [stockStats, valueResult] = await Promise.all([
      this.dataSource.query<
        [
          {
            totalIngredients: string
            lowStockCount: string
            criticalStockCount: string
            outOfStockCount: string
          }
        ]
      >(`
        SELECT
          COUNT(*)::int AS "totalIngredients",
          SUM(CASE
            WHEN current_quantity > 0
              AND minimum_quantity > 0
              AND current_quantity < minimum_quantity
            THEN 1 ELSE 0
          END)::int AS "lowStockCount",
          SUM(CASE
            WHEN current_quantity > 0
              AND minimum_quantity > 0
              AND current_quantity <= minimum_quantity * 0.25
            THEN 1 ELSE 0
          END)::int AS "criticalStockCount",
          SUM(CASE WHEN current_quantity = 0 THEN 1 ELSE 0 END)::int AS "outOfStockCount"
        FROM inventory_levels
      `),
      this.dataSource.query<[{ totalValue: string }]>(`
        SELECT COALESCE(SUM(remaining_quantity * unit_cost), 0) AS "totalValue"
        FROM inventory_batches
        WHERE remaining_quantity > 0
      `)
    ])

    const stats = stockStats[0]

    return {
      totalIngredients: Number(stats.totalIngredients),
      lowStockCount: Number(stats.lowStockCount),
      criticalStockCount: Number(stats.criticalStockCount),
      outOfStockCount: Number(stats.outOfStockCount),
      totalInventoryValue: Number(valueResult[0].totalValue)
    }
  }
}
