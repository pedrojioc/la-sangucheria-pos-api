import { FloorElement } from '../../domain/floor-element'
import { FloorElementType } from '../../domain/floor-element-type'

export class FloorElementResponse {
  id: string
  zoneId: string
  type: FloorElementType
  label: string | null
  positionX: number
  positionY: number
  width: number
  height: number
  rotation: number
  color: string | null
  isActive: boolean

  static fromAggregate(element: FloorElement): FloorElementResponse {
    const p = element.toPrimitives()
    const response = new FloorElementResponse()
    response.id = p.id
    response.zoneId = p.zoneId
    response.type = p.type
    response.label = p.label
    response.positionX = p.positionX
    response.positionY = p.positionY
    response.width = p.width
    response.height = p.height
    response.rotation = p.rotation
    response.color = p.color
    response.isActive = p.isActive
    return response
  }
}
