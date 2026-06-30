import { FloorElementRepository } from '../../domain/repositories/floor-element.repository'
import { FloorElement } from '../../domain/floor-element'

export class FindAllFloorElementsByZone {
  constructor(private readonly repository: FloorElementRepository) {}

  async run(zoneId: string): Promise<FloorElement[]> {
    return this.repository.searchAllByZone(zoneId)
  }
}
