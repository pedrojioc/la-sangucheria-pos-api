import { StationRepository } from '../../domain/repositories/station.repository'
import { StationWithPrinterDevice } from '../../domain/station-with-printer-device'

export class FindAllStations {
  constructor(private readonly repository: StationRepository) {}

  async run(): Promise<StationWithPrinterDevice[]> {
    return this.repository.searchAllWithPrinterDevice()
  }
}
