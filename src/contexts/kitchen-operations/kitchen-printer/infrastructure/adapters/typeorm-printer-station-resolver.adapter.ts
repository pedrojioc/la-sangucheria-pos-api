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
  address: string | null
  connection_type: 'network' | 'usb'
  usb_identifier: string | null
  last_seen_at: Date
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
      `SELECT stations.id AS id,
              stations.name AS name,
              discovered_printer_devices.connection_type AS connection_type,
              discovered_printer_devices.address AS address,
              discovered_printer_devices.usb_identifier AS usb_identifier,
              discovered_printer_devices.last_seen_at AS last_seen_at
       FROM stations
       JOIN discovered_printer_devices
         ON stations.discovered_printer_device_id = discovered_printer_devices.id
       WHERE stations.output_device = 'printer'
         AND stations.id = ANY($1)`,
      [nonNullIds]
    )

    return rows.map(row => ({
      stationId: row.id,
      stationName: row.name,
      connectionType: row.connection_type,
      printerAddress: row.address,
      usbIdentifier: row.usb_identifier,
      lastSeenAt: row.last_seen_at
    }))
  }
}
