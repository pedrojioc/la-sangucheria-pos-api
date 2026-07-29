import { DiscoveredPrinterDevice } from '../discovered-printer-device'

export abstract class DiscoveredPrinterDeviceRepository {
  abstract save(device: DiscoveredPrinterDevice): Promise<void>
  abstract findByEstablishmentAndIdentity(
    establishmentId: string,
    connectionType: string,
    identity: string
  ): Promise<DiscoveredPrinterDevice | null>
  abstract searchAllByEstablishment(establishmentId: string): Promise<DiscoveredPrinterDevice[]>
}
