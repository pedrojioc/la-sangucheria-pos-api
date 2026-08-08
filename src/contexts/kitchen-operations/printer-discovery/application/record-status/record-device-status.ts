import {
  DiscoveredPrinterDeviceConnectionType,
  DiscoveredPrinterDeviceStatus
} from '../../domain/discovered-printer-device'
import { DiscoveredPrinterDeviceRepository } from '../../domain/repositories/discovered-printer-device.repository'

export interface RecordDeviceStatusParams {
  establishmentId: string
  connectionType: DiscoveredPrinterDeviceConnectionType
  address?: string
  usbIdentifier?: string
  status: DiscoveredPrinterDeviceStatus
}

// Unlike RecordDiscoveredDevice, this use case NEVER auto-creates: a status
// ping describes an already-discovered printer, it does not discover one.
// No match -> log + drop.
export class RecordDeviceStatus {
  constructor(private readonly repository: DiscoveredPrinterDeviceRepository) {}

  async run(params: RecordDeviceStatusParams): Promise<void> {
    const identity = params.connectionType === 'usb' ? params.usbIdentifier : params.address

    const existing = await this.repository.findByEstablishmentAndIdentity(
      params.establishmentId,
      params.connectionType,
      identity ?? ''
    )

    if (!existing) {
      console.warn('RecordDeviceStatus: no matching device for status ping; dropping', {
        establishmentId: params.establishmentId,
        connectionType: params.connectionType,
        identity
      })
      return
    }

    existing.reportStatus(params.status, new Date())
    await this.repository.save(existing)
  }
}
