import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { Station } from '@contexts/kitchen-operations/station/domain/station'
import { StationId } from '@contexts/kitchen-operations/station/domain/station-id'
import { StationRepository } from '@contexts/kitchen-operations/station/domain/repositories/station.repository'
import { StationWithPrinterDevice } from '@contexts/kitchen-operations/station/domain/station-with-printer-device'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { StationEntity } from './station.entity'

@Injectable()
export class TypeOrmStationRepository
  extends TransactionalRepository<StationEntity>
  implements StationRepository
{
  constructor(
    @InjectRepository(StationEntity)
    repository: Repository<StationEntity>,
    uow: UnitOfWorkContextHolder
  ) {
    super(repository, uow)
  }

  async save(station: Station): Promise<void> {
    const p = station.toPrimitives()
    await this.repo.save({
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
    await this.repo.delete(id.value)
  }

  async search(id: StationId): Promise<Station | null> {
    const entity = await this.repo.findOne({ where: { id: id.value } })
    if (!entity) return null
    return this.toDomain(entity)
  }

  async searchByName(name: string): Promise<Station | null> {
    const entity = await this.repo.findOne({ where: { name } })
    if (!entity) return null
    return this.toDomain(entity)
  }

  async searchAll(): Promise<Station[]> {
    const entities = await this.repo.find({
      order: { displayOrder: 'ASC', name: 'ASC' }
    })
    return entities.map(e => this.toDomain(e))
  }

  async searchAllWithPrinterDevice(): Promise<StationWithPrinterDevice[]> {
    const entities = await this.repo.find({
      relations: { discoveredPrinterDevice: true },
      order: { displayOrder: 'ASC', name: 'ASC' }
    })
    return entities.map(
      e =>
        new StationWithPrinterDevice(
          this.toDomain(e),
          e.discoveredPrinterDevice
            ? {
                model: e.discoveredPrinterDevice.model,
                status: e.discoveredPrinterDevice.status,
                address: e.discoveredPrinterDevice.address
              }
            : null
        )
    )
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
