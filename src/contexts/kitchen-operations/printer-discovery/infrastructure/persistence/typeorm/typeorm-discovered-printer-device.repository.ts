import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import {
  DiscoveredPrinterDevice,
  DiscoveredPrinterDeviceConnectionType,
  DiscoveredPrinterDeviceStatus
} from '@contexts/kitchen-operations/printer-discovery/domain/discovered-printer-device'
import { DiscoveredPrinterDeviceRepository } from '@contexts/kitchen-operations/printer-discovery/domain/repositories/discovered-printer-device.repository'
import { DiscoveredPrinterDeviceEntity } from './discovered-printer-device.entity'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'

@Injectable()
export class TypeOrmDiscoveredPrinterDeviceRepository
  extends TransactionalRepository<DiscoveredPrinterDeviceEntity>
  implements DiscoveredPrinterDeviceRepository
{
  constructor(
    @InjectRepository(DiscoveredPrinterDeviceEntity)
    repository: Repository<DiscoveredPrinterDeviceEntity>,
    uow: UnitOfWorkContextHolder
  ) {
    super(repository, uow)
  }

  async save(device: DiscoveredPrinterDevice): Promise<void> {
    const p = device.toPrimitives()
    await this.repo.save({
      id: p.id,
      establishmentId: p.establishmentId,
      connectionType: p.connectionType,
      address: p.address,
      usbIdentifier: p.usbIdentifier,
      model: p.model,
      lastSeenAt: p.lastSeenAt,
      status: p.status,
      statusUpdatedAt: p.statusUpdatedAt
    })
  }

  async findById(id: string, establishmentId: string): Promise<DiscoveredPrinterDevice | null> {
    const entity = await this.repo.findOne({ where: { id, establishmentId } })
    if (!entity) return null
    return this.toDomain(entity)
  }

  async findByEstablishmentAndIdentity(
    establishmentId: string,
    connectionType: string,
    identity: string
  ): Promise<DiscoveredPrinterDevice | null> {
    const where =
      connectionType === 'usb'
        ? { establishmentId, connectionType, usbIdentifier: identity }
        : { establishmentId, connectionType, address: identity }

    const entity = await this.repo.findOne({ where })
    if (!entity) return null
    return this.toDomain(entity)
  }

  async searchAllByEstablishment(establishmentId: string): Promise<DiscoveredPrinterDevice[]> {
    const entities = await this.repo.find({
      where: { establishmentId },
      order: { lastSeenAt: 'DESC' }
    })
    return entities.map(e => this.toDomain(e))
  }

  private toDomain(entity: DiscoveredPrinterDeviceEntity): DiscoveredPrinterDevice {
    return DiscoveredPrinterDevice.fromPrimitives({
      id: entity.id,
      establishmentId: entity.establishmentId,
      connectionType: entity.connectionType as DiscoveredPrinterDeviceConnectionType,
      address: entity.address,
      usbIdentifier: entity.usbIdentifier,
      model: entity.model,
      lastSeenAt: entity.lastSeenAt,
      status: entity.status as DiscoveredPrinterDeviceStatus,
      statusUpdatedAt: entity.statusUpdatedAt
    })
  }
}
