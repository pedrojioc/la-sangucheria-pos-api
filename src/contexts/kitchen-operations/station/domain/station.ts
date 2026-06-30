import { AggregateRoot } from '@shared/domain/aggregate-root'
import { StationId } from './station-id'
import { StationName } from './station-name'
import { StationColor } from './station-color'
import { StationDisplayOrder } from './station-display-order'
import { StationIsActive } from './station-is-active'
import { StationOutputDevice, StationOutputDeviceEnum } from './station-output-device'
import { PrinterAddress } from './printer-address'
import { PrinterAddressRequired } from './exceptions/printer-address-required.exception'
import { StationCreatedEvent } from './events/station-created.event'
import { StationUpdatedEvent } from './events/station-updated.event'

export interface StationPrimitives {
  id: string
  name: string
  displayOrder: number
  isActive: boolean
  color: string | null
  outputDevice: string
  printerAddress: string | null
}

export interface CreateStationParams {
  id: string
  name: string
  displayOrder: number
  color: string | null
  outputDevice?: string
  printerAddress?: string | null
}

export interface UpdateStationParams {
  name: string
  displayOrder: number
  isActive: boolean
  color: string | null
  outputDevice?: string
  printerAddress?: string | null
}

export class Station extends AggregateRoot {
  private constructor(
    public readonly id: StationId,
    private name: StationName,
    private displayOrder: StationDisplayOrder,
    private isActive: StationIsActive,
    private color: StationColor | null,
    private outputDevice: StationOutputDevice,
    private printerAddress: PrinterAddress | null
  ) {
    super()
  }

  static create(params: CreateStationParams): Station {
    const device = new StationOutputDevice(
      (params.outputDevice ?? StationOutputDeviceEnum.KDS) as StationOutputDeviceEnum
    )
    const resolvedAddress = Station.resolvePrinterAddress(device, params.printerAddress ?? null)
    const primitives: StationPrimitives = {
      id: params.id,
      name: params.name,
      displayOrder: params.displayOrder,
      isActive: true,
      color: params.color,
      outputDevice: device.value,
      printerAddress: resolvedAddress?.value ?? null
    }
    const station = Station.fromPrimitives(primitives)
    station.record(
      new StationCreatedEvent({
        stationId: params.id,
        name: params.name,
        displayOrder: params.displayOrder,
        color: params.color,
        outputDevice: device.value,
        printerAddress: resolvedAddress?.value ?? null
      })
    )
    return station
  }

  update(params: UpdateStationParams): Station {
    const device = new StationOutputDevice(
      (params.outputDevice ?? this.outputDevice.value) as StationOutputDeviceEnum
    )
    const resolvedAddress = Station.resolvePrinterAddress(device, params.printerAddress ?? null)
    const primitives: StationPrimitives = {
      id: this.id.value,
      name: params.name,
      displayOrder: params.displayOrder,
      isActive: params.isActive,
      color: params.color,
      outputDevice: device.value,
      printerAddress: resolvedAddress?.value ?? null
    }
    const updated = Station.fromPrimitives(primitives)
    updated.record(
      new StationUpdatedEvent({
        stationId: this.id.value,
        name: params.name,
        displayOrder: params.displayOrder,
        isActive: params.isActive,
        color: params.color,
        outputDevice: device.value,
        printerAddress: resolvedAddress?.value ?? null
      })
    )
    return updated
  }

  getName(): string {
    return this.name.value
  }

  private static resolvePrinterAddress(
    device: StationOutputDevice,
    address: string | null
  ): PrinterAddress | null {
    if (device.isPrinter()) {
      if (!address) {
        throw new PrinterAddressRequired()
      }
      return new PrinterAddress(address)
    }
    return null
  }

  static fromPrimitives(primitives: StationPrimitives): Station {
    return new Station(
      new StationId(primitives.id),
      new StationName(primitives.name),
      new StationDisplayOrder(primitives.displayOrder),
      new StationIsActive(primitives.isActive),
      primitives.color ? new StationColor(primitives.color) : null,
      new StationOutputDevice(primitives.outputDevice as StationOutputDeviceEnum),
      primitives.printerAddress ? new PrinterAddress(primitives.printerAddress) : null
    )
  }

  toPrimitives(): StationPrimitives {
    return {
      id: this.id.value,
      name: this.name.value,
      displayOrder: this.displayOrder.value,
      isActive: this.isActive.value,
      color: this.color?.value ?? null,
      outputDevice: this.outputDevice.value,
      printerAddress: this.printerAddress?.value ?? null
    }
  }
}
