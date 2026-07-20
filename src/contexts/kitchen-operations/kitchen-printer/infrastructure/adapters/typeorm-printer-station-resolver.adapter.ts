import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import {
  PrinterStationResolverPort,
  ResolvedPrinterStation
} from '../../application/ports/printer-station-resolver.port'

interface StationRow {
  id: string
  name: string
  printer_address: string | null
  connection_type: 'network' | 'usb'
  usb_identifier: string | null
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
  ): Promise<Array<ResolvedPrinterStation>> {
    const nonNullIds = stationIds.filter((id): id is string => id !== null)

    if (nonNullIds.length === 0) return []

    const rows: StationRow[] = await this.dataSource.query(
      `SELECT id, name, printer_address, connection_type, usb_identifier
       FROM stations
       WHERE output_device = 'printer'
         AND id = ANY($1)`,
      [nonNullIds]
    )

    return rows.map(row => ({
      stationId: row.id,
      stationName: row.name,
      connectionType: row.connection_type,
      printerAddress: row.printer_address,
      usbIdentifier: row.usb_identifier
    }))
  }
}
