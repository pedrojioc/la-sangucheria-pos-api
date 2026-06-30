import { FloorElementRepository } from '../../domain/repositories/floor-element.repository'
import { FloorElementId } from '../../domain/floor-element-id'
import { FindFloorElement } from '../find/find-floor-element'

export class DeleteFloorElement {
  constructor(
    private readonly repository: FloorElementRepository,
    private readonly findFloorElement: FindFloorElement
  ) {}

  async run(id: string): Promise<void> {
    await this.findFloorElement.run(id)
    await this.repository.delete(new FloorElementId(id))
  }
}
