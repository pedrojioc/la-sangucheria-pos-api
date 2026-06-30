import { FloorElementRepository } from '../../domain/repositories/floor-element.repository'
import { FloorElement } from '../../domain/floor-element'

export class FindAllFloorElements {
  constructor(private readonly repository: FloorElementRepository) {}

  async run(): Promise<FloorElement[]> {
    return this.repository.searchAll()
  }
}
