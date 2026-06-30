import { FloorElementRepository } from '../../domain/repositories/floor-element.repository'
import { EventBus } from '@shared/domain/events'
import { FloorElement } from '../../domain/floor-element'
import { FloorElementType } from '../../domain/floor-element-type'

export class CreateFloorElement {
  constructor(
    private readonly repository: FloorElementRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(
    id: string,
    zoneId: string,
    type: FloorElementType,
    label: string | null,
    positionX: number,
    positionY: number,
    width: number,
    height: number,
    rotation: number,
    color: string | null
  ): Promise<void> {
    const element = FloorElement.create(
      id,
      zoneId,
      type,
      label,
      positionX,
      positionY,
      width,
      height,
      rotation,
      color
    )

    await this.repository.save(element)
    await this.eventBus.publish(element.pullDomainEvents())
  }
}
