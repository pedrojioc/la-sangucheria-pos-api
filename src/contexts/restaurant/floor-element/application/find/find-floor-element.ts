import { FloorElementRepository } from '../../domain/repositories/floor-element.repository'
import { FloorElementId } from '../../domain/floor-element-id'
import { FloorElement } from '../../domain/floor-element'
import { FloorElementNotExist } from '../../domain/exceptions/floor-element-not-exist.exception'

export class FindFloorElement {
  constructor(private readonly repository: FloorElementRepository) {}

  async run(id: string): Promise<FloorElement> {
    const element = await this.repository.search(new FloorElementId(id))
    if (!element) throw new FloorElementNotExist(id)
    return element
  }
}
