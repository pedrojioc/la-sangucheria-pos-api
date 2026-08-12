import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { Station } from '@contexts/kitchen-operations/station/domain/station'
import { StationId } from '@contexts/kitchen-operations/station/domain/station-id'
import { StationRepository } from '@contexts/kitchen-operations/station/domain/repositories/station.repository'
import { StationEntity } from './station.entity'

@Injectable()
export class TypeOrmStationRepository implements StationRepository {
  constructor(
    @InjectRepository(StationEntity)
    private readonly repository: Repository<StationEntity>
  ) {}

  async save(station: Station): Promise<void> {
    const p = station.toPrimitives()
    await this.repository.save({
      id: p.id,
      name: p.name,
      displayOrder: p.displayOrder,
      isActive: p.isActive,
      color: p.color,
      outputDevice: p.outputDevice,
      discoveredPrinterDeviceId: p.discoveredPrinterDeviceId
    })
  }

  async delete(id: StationId): Promise<void> {
    await this.repository.delete(id.value)
  }

  async search(id: StationId): Promise<Station | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } })
    if (!entity) return null
    return this.toDomain(entity)
  }

  async searchByName(name: string): Promise<Station | null> {
    const entity = await this.repository.findOne({ where: { name } })
    if (!entity) return null
    return this.toDomain(entity)
  }

  async searchAll(): Promise<Station[]> {
    const entities = await this.repository.find({
      order: { displayOrder: 'ASC', name: 'ASC' }
    })
    return entities.map(e => this.toDomain(e))
  }

  private toDomain(entity: StationEntity): Station {
    return Station.fromPrimitives({
      id: entity.id,
      name: entity.name,
      displayOrder: entity.displayOrder,
      isActive: entity.isActive,
      color: entity.color,
      outputDevice: entity.outputDevice,
      discoveredPrinterDeviceId: entity.discoveredPrinterDeviceId
    })
  }
}
