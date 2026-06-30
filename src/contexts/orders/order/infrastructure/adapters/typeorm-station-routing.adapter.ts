import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { StationRoutingPort, RoutableItem } from '../../application/ports/station-routing.port'

@Injectable()
export class TypeOrmStationRoutingAdapter extends StationRoutingPort {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {
    super()
  }

  async resolveStations(items: RoutableItem[]): Promise<Map<string, string | null>> {
    const result = new Map<string, string | null>()

    if (items.length === 0) {
      return result
    }

    const productIds = items.map(i => i.productId)

    const rows: Array<{
      product_id: string
      default_station_id: string | null
    }> = await this.dataSource.query(
      `
      SELECT
        p.id AS product_id,
        pc.default_station_id
      FROM products p
      JOIN product_categories pc ON pc.id = p.category_id
      WHERE p.id = ANY($1)
      `,
      [productIds]
    )

    const stationByProduct = new Map<string, string | null>()
    for (const row of rows) {
      stationByProduct.set(row.product_id, row.default_station_id)
    }

    for (const item of items) {
      result.set(item.productId, stationByProduct.get(item.productId) ?? null)
    }

    return result
  }
}
