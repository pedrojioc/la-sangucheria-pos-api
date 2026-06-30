import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { FloorElement } from '@contexts/restaurant/floor-element/domain/floor-element'
import { FloorElementId } from '@contexts/restaurant/floor-element/domain/floor-element-id'
import { FloorElementRepository } from '@contexts/restaurant/floor-element/domain/repositories/floor-element.repository'
import { FloorElementEntity } from './floor-element.entity'

@Injectable()
export class TypeOrmFloorElementRepository implements FloorElementRepository {
  constructor(
    @InjectRepository(FloorElementEntity)
    private readonly repository: Repository<FloorElementEntity>
  ) {}

  async save(element: FloorElement): Promise<void> {
    const p = element.toPrimitives()
    await this.repository.save({
      id: p.id,
      zoneId: p.zoneId,
      type: p.type,
      label: p.label,
      positionX: p.positionX,
      positionY: p.positionY,
      width: p.width,
      height: p.height,
      rotation: p.rotation,
      color: p.color,
      isActive: p.isActive
    })
  }

  async search(id: FloorElementId): Promise<FloorElement | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } })
    if (!entity) return null
    return this.toDomain(entity)
  }

  async searchAll(): Promise<FloorElement[]> {
    const entities = await this.repository.find({ order: { zoneId: 'ASC', createdAt: 'ASC' } })
    return entities.map(e => this.toDomain(e))
  }

  async searchAllByZone(zoneId: string): Promise<FloorElement[]> {
    const entities = await this.repository.find({
      where: { zoneId },
      order: { createdAt: 'ASC' }
    })
    return entities.map(e => this.toDomain(e))
  }

  async delete(id: FloorElementId): Promise<void> {
    await this.repository.delete({ id: id.value })
  }

  private toDomain(entity: FloorElementEntity): FloorElement {
    return FloorElement.fromPrimitives({
      id: entity.id,
      zoneId: entity.zoneId,
      type: entity.type,
      label: entity.label,
      positionX: Number(entity.positionX),
      positionY: Number(entity.positionY),
      width: Number(entity.width),
      height: Number(entity.height),
      rotation: entity.rotation,
      color: entity.color,
      isActive: entity.isActive
    })
  }
}
