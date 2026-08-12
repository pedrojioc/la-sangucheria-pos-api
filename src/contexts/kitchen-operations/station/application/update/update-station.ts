import { StationRepository } from '../../domain/repositories/station.repository'
import { EventBus } from '@shared/domain/events'
import { FindStation } from '../find/find-station'
import { UpdateStationParams } from '../../domain/station'
import { StationNameAlreadyExists } from '../../domain/exceptions/station-name-already-exists.exception'
import { PrinterDeviceLookupPort } from '../../domain/ports/printer-device-lookup.port'
import { DiscoveredPrinterDeviceNotExist } from '../../domain/exceptions/discovered-printer-device-not-exist.exception'

export class UpdateStation {
  constructor(
    private readonly repository: StationRepository,
    private readonly eventBus: EventBus,
    private readonly findStation: FindStation,
    private readonly lookupPort: PrinterDeviceLookupPort
  ) {}

  async run(id: string, params: UpdateStationParams): Promise<void> {
    const existing = await this.findStation.run(id)

    if (existing.getName() !== params.name) {
      const conflict = await this.repository.searchByName(params.name)
      if (conflict) throw new StationNameAlreadyExists(params.name)
    }

    if (params.discoveredPrinterDeviceId) {
      const device = await this.lookupPort.findById(params.discoveredPrinterDeviceId)
      if (!device) throw new DiscoveredPrinterDeviceNotExist(params.discoveredPrinterDeviceId)
    }

    const updated = existing.update(params)
    await this.repository.save(updated)
    await this.eventBus.publish(updated.pullDomainEvents())
  }
}
