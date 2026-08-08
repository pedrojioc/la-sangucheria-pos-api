import { AggregateRoot } from '@shared/domain/aggregate-root'
import { DiscoveredPrinterDeviceId } from './discovered-printer-device-id'

export type DiscoveredPrinterDeviceConnectionType = 'network' | 'usb'

export type DiscoveredPrinterDeviceStatus = 'online' | 'offline' | 'unknown'

export interface DiscoveredPrinterDevicePrimitives {
  id: string
  establishmentId: string
  connectionType: DiscoveredPrinterDeviceConnectionType
  address: string | null
  usbIdentifier: string | null
  model: string | null
  lastSeenAt: Date
  status: DiscoveredPrinterDeviceStatus
  statusUpdatedAt: Date | null
}

export interface CreateDiscoveredPrinterDeviceParams {
  id: string
  establishmentId: string
  connectionType: DiscoveredPrinterDeviceConnectionType
  address: string | null
  usbIdentifier: string | null
  model?: string | null
  status?: DiscoveredPrinterDeviceStatus
  statusUpdatedAt?: Date | null
}

export class DiscoveredPrinterDevice extends AggregateRoot {
  private constructor(
    public readonly id: DiscoveredPrinterDeviceId,
    private readonly establishmentId: string,
    private readonly connectionType: DiscoveredPrinterDeviceConnectionType,
    private readonly address: string | null,
    private readonly usbIdentifier: string | null,
    private model: string | null,
    private lastSeenAt: Date,
    private status: DiscoveredPrinterDeviceStatus,
    private statusUpdatedAt: Date | null
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
      params.model ?? null,
      now,
      params.status ?? 'unknown',
      params.statusUpdatedAt ?? null
    )
  }

  static fromPrimitives(primitives: DiscoveredPrinterDevicePrimitives): DiscoveredPrinterDevice {
    return new DiscoveredPrinterDevice(
      new DiscoveredPrinterDeviceId(primitives.id),
      primitives.establishmentId,
      primitives.connectionType,
      primitives.address,
      primitives.usbIdentifier,
      primitives.model,
      primitives.lastSeenAt,
      primitives.status,
      primitives.statusUpdatedAt
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

  getModel(): string | null {
    return this.model
  }

  // Re-reporting the same device refreshes lastSeenAt and model — identity
  // (type + address/usbIdentifier) never changes after creation, but the
  // agent may resolve the model after the device was first seen.
  touch(model: string | null | undefined, now: Date = new Date()): void {
    if (model !== undefined) {
      this.model = model
    }
    this.lastSeenAt = now
  }

  // Status is a signal independent from discovery/reporting freshness
  // (touch()/lastSeenAt) — it is only ever set by an explicit agent status
  // ping, and both fields always change together (never independently).
  reportStatus(status: DiscoveredPrinterDeviceStatus, now: Date = new Date()): void {
    this.status = status
    this.statusUpdatedAt = now
  }

  toPrimitives(): DiscoveredPrinterDevicePrimitives {
    return {
      id: this.id.value,
      establishmentId: this.establishmentId,
      connectionType: this.connectionType,
      address: this.address,
      usbIdentifier: this.usbIdentifier,
      model: this.model,
      lastSeenAt: this.lastSeenAt,
      status: this.status,
      statusUpdatedAt: this.statusUpdatedAt
    }
  }
}
