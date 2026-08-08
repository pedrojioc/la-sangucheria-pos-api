import { Uuid } from '@shared/domain/value-objects/uuid'
import {
  DiscoveredPrinterDevice,
  DiscoveredPrinterDeviceConnectionType
} from '../../domain/discovered-printer-device'
import { DiscoveredPrinterDeviceRepository } from '../../domain/repositories/discovered-printer-device.repository'

export interface RecordDiscoveredDeviceParams {
  establishmentId: string
  connectionType: DiscoveredPrinterDeviceConnectionType
  address?: string
  usbIdentifier?: string
  model?: string
}

export class RecordDiscoveredDevice {
  constructor(private readonly repository: DiscoveredPrinterDeviceRepository) {}

  async run(params: RecordDiscoveredDeviceParams): Promise<void> {
    const identity = params.connectionType === 'usb' ? params.usbIdentifier : params.address
    const now = new Date()

    const existing = await this.repository.findByEstablishmentAndIdentity(
      params.establishmentId,
      params.connectionType,
      identity ?? ''
    )

    if (existing) {
      existing.touch(params.model, now)
      await this.repository.save(existing)
      return
    }

    const device = DiscoveredPrinterDevice.create(
      {
        id: Uuid.random().value,
        establishmentId: params.establishmentId,
        connectionType: params.connectionType,
        address: params.connectionType === 'network' ? (params.address ?? null) : null,
        usbIdentifier: params.connectionType === 'usb' ? (params.usbIdentifier ?? null) : null,
        model: params.model ?? null
      },
      now
    )

    await this.repository.save(device)
  }
}
