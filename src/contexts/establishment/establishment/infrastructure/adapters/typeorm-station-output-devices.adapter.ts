import { Injectable } from '@nestjs/common'
import { StationRepository } from '@contexts/kitchen-operations/station/domain/repositories/station.repository'
import { StationOutputDevicesPort } from '../../application/ports/station-output-devices.port'

/** Fetches all stations' outputDevice values so deriveKitchenMode can compute the current kitchen communication mode. */
@Injectable()
export class TypeOrmStationOutputDevicesAdapter implements StationOutputDevicesPort {
  constructor(private readonly stationRepository: StationRepository) {}

  async list(): Promise<string[]> {
    const stations = await this.stationRepository.searchAll()
    return stations.map(s => s.toPrimitives().outputDevice)
  }
}
