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

  // NOTE (PR2, device-identity-mapping chain): StationEntity/the `stations`
  // table still has the legacy printer_address/connection_type/usb_identifier
  // columns — dropping them and adding discovered_printer_device_id is PR3
  // scope (entity + auto-generated migration). This mapping is a minimal,
  // temporary adjustment so the repository compiles against the Station
  // aggregate's new shape; discoveredPrinterDeviceId is NOT yet persisted.
  // PR3 completes this by updating StationEntity and this mapping together.
  async save(station: Station): Promise<void> {
    const p = station.toPrimitives()
    await this.repository.save({
      id: p.id,
      name: p.name,
      displayOrder: p.displayOrder,
      isActive: p.isActive,
      color: p.color,
      outputDevice: p.outputDevice
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
    // discoveredPrinterDeviceId is not yet persisted (see NOTE above) — PR3
    // adds the column and wires it through here.
    return Station.fromPrimitives({
      id: entity.id,
      name: entity.name,
      displayOrder: entity.displayOrder,
      isActive: entity.isActive,
      color: entity.color,
      outputDevice: entity.outputDevice,
      discoveredPrinterDeviceId: null
    })
  }
}
