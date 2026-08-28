import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { Zone } from '@contexts/restaurant/zone/domain/zone'
import { ZoneId } from '@contexts/restaurant/zone/domain/zone-id'
import { ZoneRepository } from '@contexts/restaurant/zone/domain/repositories/zone.repository'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { ZoneEntity } from './zone.entity'

@Injectable()
export class TypeOrmZoneRepository
  extends TransactionalRepository<ZoneEntity>
  implements ZoneRepository
{
  constructor(
    @InjectRepository(ZoneEntity)
    repository: Repository<ZoneEntity>,
    uow: UnitOfWorkContextHolder
  ) {
    super(repository, uow)
  }

  async save(zone: Zone): Promise<void> {
    const p = zone.toPrimitives()
    await this.repo.save({
      id: p.id,
      name: p.name,
      color: p.color,
      sortIndex: p.sortIndex,
      isActive: p.isActive
    })
  }

  async search(id: ZoneId): Promise<Zone | null> {
    const entity = await this.repo.findOne({ where: { id: id.value } })
    if (!entity) return null
    return this.toDomain(entity)
  }

  async searchByName(name: string): Promise<Zone | null> {
    const entity = await this.repo.findOne({ where: { name } })
    if (!entity) return null
    return this.toDomain(entity)
  }

  async searchAll(): Promise<Zone[]> {
    const entities = await this.repo.find({ order: { sortIndex: 'ASC', name: 'ASC' } })
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
