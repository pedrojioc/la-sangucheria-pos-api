import { StationRepository } from '../../domain/repositories/station.repository'
import { EventBus } from '@shared/domain/events'
import { Station, CreateStationParams } from '../../domain/station'
import { StationNameAlreadyExists } from '../../domain/exceptions/station-name-already-exists.exception'
import { PrinterDeviceLookupPort } from '../../domain/ports/printer-device-lookup.port'
import { DiscoveredPrinterDeviceNotExist } from '../../domain/exceptions/discovered-printer-device-not-exist.exception'
import { EstablishmentRepository } from '@contexts/establishment/establishment/domain/repositories/establishment.repository'

export class CreateStation {
  constructor(
    private readonly repository: StationRepository,
    private readonly eventBus: EventBus,
    private readonly lookupPort: PrinterDeviceLookupPort,
    private readonly establishmentRepository: EstablishmentRepository
  ) {}

  async run(params: CreateStationParams): Promise<void> {
    const existing = await this.repository.searchByName(params.name)
    if (existing) throw new StationNameAlreadyExists(params.name)

    if (params.discoveredPrinterDeviceId) {
      const establishment = await this.establishmentRepository.findSingleton()
      const device = await this.lookupPort.findById(
        params.discoveredPrinterDeviceId,
        establishment.id.value
      )
      if (!device) throw new DiscoveredPrinterDeviceNotExist(params.discoveredPrinterDeviceId)
    }

    const station = Station.create(params)
    await this.repository.save(station)
    await this.eventBus.publish(station.pullDomainEvents())
  }
}
