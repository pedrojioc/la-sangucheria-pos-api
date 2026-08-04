import { AggregateRoot } from '@shared/domain/aggregate-root'
import { StationId } from './station-id'
import { StationName } from './station-name'
import { StationColor } from './station-color'
import { StationDisplayOrder } from './station-display-order'
import { StationIsActive } from './station-is-active'
import { StationOutputDevice, StationOutputDeviceEnum } from './station-output-device'
import { StationConnectionType, StationConnectionTypeEnum } from './station-connection-type'
import { PrinterAddress } from './printer-address'
import { UsbPrinterIdentifier } from './usb-printer-identifier'
import { PrinterAddressRequired } from './exceptions/printer-address-required.exception'
import { UsbIdentifierRequired } from './exceptions/usb-identifier-required.exception'
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
  connectionType: string
  usbIdentifier: string | null
}

export interface CreateStationParams {
  id: string
  name: string
  displayOrder: number
  color: string | null
  outputDevice?: string
  printerAddress?: string | null
  connectionType?: string
  usbIdentifier?: string | null
}

export interface UpdateStationParams {
  name: string
  displayOrder: number
  isActive: boolean
  color: string | null
  outputDevice?: string
  printerAddress?: string | null
  connectionType?: string
  usbIdentifier?: string | null
}

interface ResolvedPrinterIdentifiers {
  printerAddress: PrinterAddress | null
  usbIdentifier: UsbPrinterIdentifier | null
}

export class Station extends AggregateRoot {
  private constructor(
    public readonly id: StationId,
    private name: StationName,
    private displayOrder: StationDisplayOrder,
    private isActive: StationIsActive,
    private color: StationColor | null,
    private outputDevice: StationOutputDevice,
    private printerAddress: PrinterAddress | null,
    private connectionType: StationConnectionType,
    private usbIdentifier: UsbPrinterIdentifier | null
  ) {
    super()
  }

  static create(params: CreateStationParams): Station {
    const device = new StationOutputDevice(
      (params.outputDevice ?? StationOutputDeviceEnum.KDS) as StationOutputDeviceEnum
    )
    const connectionType = new StationConnectionType(
      (params.connectionType ?? StationConnectionTypeEnum.NETWORK) as StationConnectionTypeEnum
    )
    const resolved = Station.resolvePrinterIdentifiers(
      device,
      connectionType,
      params.printerAddress ?? null,
      params.usbIdentifier ?? null
    )
    const primitives: StationPrimitives = {
      id: params.id,
      name: params.name,
      displayOrder: params.displayOrder,
      isActive: true,
      color: params.color,
      outputDevice: device.value,
      printerAddress: resolved.printerAddress?.value ?? null,
      connectionType: connectionType.value,
      usbIdentifier: resolved.usbIdentifier?.value ?? null
    }
    const station = Station.fromPrimitives(primitives)
    station.record(
      new StationCreatedEvent({
        stationId: params.id,
        name: params.name,
        displayOrder: params.displayOrder,
        color: params.color,
        outputDevice: device.value,
        printerAddress: resolved.printerAddress?.value ?? null,
        connectionType: connectionType.value,
        usbIdentifier: resolved.usbIdentifier?.value ?? null
      })
    )
    return station
  }

  update(params: UpdateStationParams): Station {
    const device = new StationOutputDevice(
      (params.outputDevice ?? this.outputDevice.value) as StationOutputDeviceEnum
    )
    const connectionType = new StationConnectionType(
      (params.connectionType ?? this.connectionType.value) as StationConnectionTypeEnum
    )
    const resolved = Station.resolvePrinterIdentifiers(
      device,
      connectionType,
      params.printerAddress ?? null,
      params.usbIdentifier ?? null
    )
    const primitives: StationPrimitives = {
      id: this.id.value,
      name: params.name,
      displayOrder: params.displayOrder,
      isActive: params.isActive,
      color: params.color,
      outputDevice: device.value,
      printerAddress: resolved.printerAddress?.value ?? null,
      connectionType: connectionType.value,
      usbIdentifier: resolved.usbIdentifier?.value ?? null
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
        printerAddress: resolved.printerAddress?.value ?? null,
        connectionType: connectionType.value,
        usbIdentifier: resolved.usbIdentifier?.value ?? null
      })
    )
    return updated
  }

  getName(): string {
    return this.name.value
  }

  private static resolvePrinterIdentifiers(
    device: StationOutputDevice,
    connectionType: StationConnectionType,
    address: string | null,
    usbIdentifier: string | null
  ): ResolvedPrinterIdentifiers {
    if (!device.isPrinter()) {
      return { printerAddress: null, usbIdentifier: null }
    }

    if (connectionType.isUsb()) {
      if (!usbIdentifier) {
        throw new UsbIdentifierRequired()
      }
      return { printerAddress: null, usbIdentifier: new UsbPrinterIdentifier(usbIdentifier) }
    }

    if (!address) {
      throw new PrinterAddressRequired()
    }
    return { printerAddress: new PrinterAddress(address), usbIdentifier: null }
  }

  static fromPrimitives(primitives: StationPrimitives): Station {
    return new Station(
      new StationId(primitives.id),
      new StationName(primitives.name),
      new StationDisplayOrder(primitives.displayOrder),
      new StationIsActive(primitives.isActive),
      primitives.color ? new StationColor(primitives.color) : null,
      new StationOutputDevice(primitives.outputDevice as StationOutputDeviceEnum),
      primitives.printerAddress ? new PrinterAddress(primitives.printerAddress) : null,
      new StationConnectionType(
        (primitives.connectionType ??
          StationConnectionTypeEnum.NETWORK) as StationConnectionTypeEnum
      ),
      primitives.usbIdentifier ? new UsbPrinterIdentifier(primitives.usbIdentifier) : null
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
      printerAddress: this.printerAddress?.value ?? null,
      connectionType: this.connectionType.value,
      usbIdentifier: this.usbIdentifier?.value ?? null
    }
  }
}
