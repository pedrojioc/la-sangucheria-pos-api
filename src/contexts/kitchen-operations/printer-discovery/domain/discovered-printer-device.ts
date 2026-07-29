import { AggregateRoot } from '@shared/domain/aggregate-root'
import { DiscoveredPrinterDeviceId } from './discovered-printer-device-id'

export type DiscoveredPrinterDeviceConnectionType = 'network' | 'usb'

export interface DiscoveredPrinterDevicePrimitives {
  id: string
  establishmentId: string
  connectionType: DiscoveredPrinterDeviceConnectionType
  address: string | null
  usbIdentifier: string | null
  lastSeenAt: Date
}

export interface CreateDiscoveredPrinterDeviceParams {
  id: string
  establishmentId: string
  connectionType: DiscoveredPrinterDeviceConnectionType
  address: string | null
  usbIdentifier: string | null
}

export class DiscoveredPrinterDevice extends AggregateRoot {
  private constructor(
    public readonly id: DiscoveredPrinterDeviceId,
    private readonly establishmentId: string,
    private readonly connectionType: DiscoveredPrinterDeviceConnectionType,
    private readonly address: string | null,
    private readonly usbIdentifier: string | null,
    private lastSeenAt: Date
  ) {
    super()
  }

  static create(
    params: CreateDiscoveredPrinterDeviceParams,
    now: Date = new Date()
  ): DiscoveredPrinterDevice {
    return new DiscoveredPrinterDevice(
      new DiscoveredPrinterDeviceId(params.id),
      params.establishmentId,
      params.connectionType,
      params.address,
      params.usbIdentifier,
      now
    )
  }

  static fromPrimitives(primitives: DiscoveredPrinterDevicePrimitives): DiscoveredPrinterDevice {
    return new DiscoveredPrinterDevice(
      new DiscoveredPrinterDeviceId(primitives.id),
      primitives.establishmentId,
      primitives.connectionType,
      primitives.address,
      primitives.usbIdentifier,
      primitives.lastSeenAt
    )
  }

  getEstablishmentId(): string {
    return this.establishmentId
  }

  getConnectionType(): DiscoveredPrinterDeviceConnectionType {
    return this.connectionType
  }

  getAddress(): string | null {
    return this.address
  }

  getUsbIdentifier(): string | null {
    return this.usbIdentifier
  }

  // Re-reporting the same device only refreshes lastSeenAt — identity (type +
  // address/usbIdentifier) never changes after creation.
  touch(now: Date = new Date()): void {
    this.lastSeenAt = now
  }

  toPrimitives(): DiscoveredPrinterDevicePrimitives {
    return {
      id: this.id.value,
      establishmentId: this.establishmentId,
      connectionType: this.connectionType,
      address: this.address,
      usbIdentifier: this.usbIdentifier,
      lastSeenAt: this.lastSeenAt
    }
  }
}
