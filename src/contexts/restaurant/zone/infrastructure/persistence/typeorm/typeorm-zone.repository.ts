import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { Zone } from '@contexts/restaurant/zone/domain/zone'
import { ZoneId } from '@contexts/restaurant/zone/domain/zone-id'
import { ZoneRepository } from '@contexts/restaurant/zone/domain/repositories/zone.repository'
import { ZoneEntity } from './zone.entity'

@Injectable()
export class TypeOrmZoneRepository implements ZoneRepository {
  constructor(
    @InjectRepository(ZoneEntity)
    private readonly repository: Repository<ZoneEntity>
  ) {}

  async save(zone: Zone): Promise<void> {
    const p = zone.toPrimitives()
    await this.repository.save({
      id: p.id,
      name: p.name,
      color: p.color,
      sortIndex: p.sortIndex,
      isActive: p.isActive
    })
  }

  async search(id: ZoneId): Promise<Zone | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } })
    if (!entity) return null
    return this.toDomain(entity)
  }

  async searchByName(name: string): Promise<Zone | null> {
    const entity = await this.repository.findOne({ where: { name } })
    if (!entity) return null
    return this.toDomain(entity)
  }

  async searchAll(): Promise<Zone[]> {
    const entities = await this.repository.find({ order: { sortIndex: 'ASC', name: 'ASC' } })
    return entities.map(e => this.toDomain(e))
  }

  private toDomain(entity: ZoneEntity): Zone {
    return Zone.fromPrimitives({
      id: entity.id,
      name: entity.name,
      color: entity.color,
      sortIndex: entity.sortIndex,
      isActive: entity.isActive
    })
  }
}
