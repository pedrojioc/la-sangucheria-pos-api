import { Zone } from '../../domain/zone'

export class ZoneResponse {
  id: string
  name: string
  color: string
  sortIndex: number
  isActive: boolean

  static fromAggregate(zone: Zone): ZoneResponse {
    const p = zone.toPrimitives()
    const response = new ZoneResponse()
    response.id = p.id
    response.name = p.name
    response.color = p.color
    response.sortIndex = p.sortIndex
    response.isActive = p.isActive
    return response
  }
}
