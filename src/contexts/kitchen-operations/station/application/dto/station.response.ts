import { Station } from '../../domain/station'

export class StationResponse {
  readonly id: string
  readonly name: string
  readonly displayOrder: number
  readonly isActive: boolean
  readonly color: string | null
  readonly outputDevice: string
  readonly printerAddress: string | null

  private constructor(
    id: string,
    name: string,
    displayOrder: number,
    isActive: boolean,
    color: string | null,
    outputDevice: string,
    printerAddress: string | null
  ) {
    this.id = id
    this.name = name
    this.displayOrder = displayOrder
    this.isActive = isActive
    this.color = color
    this.outputDevice = outputDevice
    this.printerAddress = printerAddress
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
      p.printerAddress
    )
  }
}
