import { FloorElementRepository } from '../../domain/repositories/floor-element.repository'
import { EventBus } from '@shared/domain/events'
import { FindFloorElement } from '../find/find-floor-element'

export class MoveFloorElement {
  constructor(
    private readonly repository: FloorElementRepository,
    private readonly eventBus: EventBus,
    private readonly findFloorElement: FindFloorElement
  ) {}

  async run(id: string, positionX: number, positionY: number, rotation?: number): Promise<void> {
    const element = await this.findFloorElement.run(id)
    element.move(positionX, positionY, rotation)

    await this.repository.save(element)
    await this.eventBus.publish(element.pullDomainEvents())
  }
}
