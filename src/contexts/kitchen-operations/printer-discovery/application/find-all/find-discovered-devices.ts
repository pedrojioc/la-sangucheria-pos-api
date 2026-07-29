import { DiscoveredPrinterDeviceRepository } from '../../domain/repositories/discovered-printer-device.repository'
import { DiscoveredPrinterDeviceConnectionType } from '../../domain/discovered-printer-device'

// Staleness is flagged, never hidden — a stale device stays in the result
// set and clears the flag on its next report-devices push. No scheduler,
// no deletion; derived purely from the injected `now` at read time.
export const DISCOVERED_DEVICE_STALE_TTL_MS = 15 * 60 * 1000 // 15 min

export interface DiscoveredDeviceView {
  id: string
  connectionType: DiscoveredPrinterDeviceConnectionType
  address: string | null
  usbIdentifier: string | null
  lastSeenAt: Date
  stale: boolean
}

export class FindDiscoveredDevices {
  constructor(private readonly repository: DiscoveredPrinterDeviceRepository) {}

  async run(establishmentId: string, now: Date = new Date()): Promise<DiscoveredDeviceView[]> {
    const devices = await this.repository.searchAllByEstablishment(establishmentId)

    return devices.map(device => {
      const primitives = device.toPrimitives()
      const stale = now.getTime() - primitives.lastSeenAt.getTime() > DISCOVERED_DEVICE_STALE_TTL_MS

      return {
        id: primitives.id,
        connectionType: primitives.connectionType,
        address: primitives.address,
        usbIdentifier: primitives.usbIdentifier,
        lastSeenAt: primitives.lastSeenAt,
        stale
      }
    })
  }
}
