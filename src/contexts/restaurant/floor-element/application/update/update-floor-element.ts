import { FloorElementRepository } from '../../domain/repositories/floor-element.repository'
import { EventBus } from '@shared/domain/events'
import { FindFloorElement } from '../find/find-floor-element'
import { FloorElementType } from '../../domain/floor-element-type'

export interface UpdateFloorElementParams {
  type?: FloorElementType
  label?: string | null
  positionX?: number
  positionY?: number
  width?: number
  height?: number
  rotation?: number
  color?: string | null
  isActive?: boolean
}

export class UpdateFloorElement {
  constructor(
    private readonly repository: FloorElementRepository,
    private readonly eventBus: EventBus,
    private readonly findFloorElement: FindFloorElement
  ) {}

  async run(id: string, params: UpdateFloorElementParams): Promise<void> {
    const element = await this.findFloorElement.run(id)
    const current = element.toPrimitives()

    const updated = element.update(
      params.type ?? current.type,
      params.label !== undefined ? params.label : current.label,
      params.positionX ?? current.positionX,
      params.positionY ?? current.positionY,
      params.width ?? current.width,
      params.height ?? current.height,
      params.rotation ?? current.rotation,
      params.color !== undefined ? params.color : current.color,
      params.isActive ?? current.isActive
    )

    await this.repository.save(updated)
    await this.eventBus.publish(updated.pullDomainEvents())
  }
}
