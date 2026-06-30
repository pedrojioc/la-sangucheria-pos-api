import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { PrinterStationResolverPort } from '../../application/ports/printer-station-resolver.port'

interface StationRow {
  id: string
  name: string
  printer_address: string
}

@Injectable()
export class TypeOrmPrinterStationResolverAdapter extends PrinterStationResolverPort {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {
    super()
  }

  async resolvePrinterStations(
    stationIds: Array<string | null>
  ): Promise<Array<{ stationId: string; stationName: string; printerAddress: string }>> {
    const nonNullIds = stationIds.filter((id): id is string => id !== null)

    if (nonNullIds.length === 0) return []

    const rows: StationRow[] = await this.dataSource.query(
      `SELECT id, name, printer_address
       FROM stations
       WHERE output_device = 'printer'
         AND printer_address IS NOT NULL
         AND id = ANY($1)`,
      [nonNullIds]
    )

    return rows.map(row => ({
      stationId: row.id,
      stationName: row.name,
      printerAddress: row.printer_address
    }))
  }
}
