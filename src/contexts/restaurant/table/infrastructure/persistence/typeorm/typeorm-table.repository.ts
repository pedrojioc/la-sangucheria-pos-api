import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { Table } from '@contexts/restaurant/table/domain/table'
import { TableId } from '@contexts/restaurant/table/domain/table-id'
import { TableRepository } from '@contexts/restaurant/table/domain/repositories/table.repository'
import { TableEntity } from './table.entity'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'

@Injectable()
export class TypeOrmTableRepository
  extends TransactionalRepository<TableEntity>
  implements TableRepository
{
  constructor(
    @InjectRepository(TableEntity)
    repository: Repository<TableEntity>,
    uow: UnitOfWorkContextHolder
  ) {
    super(repository, uow)
  }

  async save(table: Table): Promise<void> {
    const p = table.toPrimitives()
    await this.repo.save({
      id: p.id,
      number: p.number,
      capacity: p.capacity,
      status: p.status,
      shape: p.shape,
      currentOrderId: p.currentOrderId,
      zoneId: p.zoneId,
      positionX: p.positionX,
      positionY: p.positionY,
      rotation: p.rotation
    })
  }

  async search(id: TableId): Promise<Table | null> {
    const entity = await this.repo.findOne({ where: { id: id.value } })
    if (!entity) return null
    return this.toDomain(entity)
  }

  async searchByNumber(number: string): Promise<Table | null> {
    const entity = await this.repo.findOne({ where: { number } })
    if (!entity) return null
    return this.toDomain(entity)
  }

  async searchAll(): Promise<Table[]> {
    const entities = await this.repo.find({ order: { number: 'ASC' } })
    return entities.map(e => this.toDomain(e))
  }

  private toDomain(entity: TableEntity): Table {
    return Table.fromPrimitives({
      id: entity.id,
      number: entity.number,
      capacity: entity.capacity,
      status: entity.status,
      shape: entity.shape,
      currentOrderId: entity.currentOrderId,
      zoneId: entity.zoneId,
      positionX: entity.positionX !== null ? Number(entity.positionX) : null,
      positionY: entity.positionY !== null ? Number(entity.positionY) : null,
      rotation: entity.rotation
    })
  }
}
