import { Station } from '../../domain/station'
import {
  PrinterDeviceSummary,
  StationWithPrinterDevice
} from '../../domain/station-with-printer-device'

export class StationResponse {
  readonly id: string
  readonly name: string
  readonly displayOrder: number
  readonly isActive: boolean
  readonly color: string | null
  readonly outputDevice: string
  readonly discoveredPrinterDeviceId: string | null
  readonly printer: PrinterDeviceSummary | null

  private constructor(
    id: string,
    name: string,
    displayOrder: number,
    isActive: boolean,
    color: string | null,
    outputDevice: string,
    discoveredPrinterDeviceId: string | null,
    printer: PrinterDeviceSummary | null
  ) {
    this.id = id
    this.name = name
    this.displayOrder = displayOrder
    this.isActive = isActive
    this.color = color
    this.outputDevice = outputDevice
    this.discoveredPrinterDeviceId = discoveredPrinterDeviceId
    this.printer = printer
  }

  static fromAggregate(station: Station): StationResponse {
    const p = station.toPrimitives()
    return new StationResponse(
      p.id,
      p.name,
      p.displayOrder,
      p.isActive,
      p.color,
      p.outputDevice,
      p.discoveredPrinterDeviceId,
      null
    )
  }

  static fromAggregateWithPrinterDevice(entry: StationWithPrinterDevice): StationResponse {
    const p = entry.station.toPrimitives()
    return new StationResponse(
      p.id,
      p.name,
      p.displayOrder,
      p.isActive,
      p.color,
      p.outputDevice,
      p.discoveredPrinterDeviceId,
      entry.printer
    )
  }
}
