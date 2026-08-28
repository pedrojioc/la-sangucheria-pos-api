import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'

import {
  FailureReason,
  KitchenTicketPrintJob,
  KitchenTicketPrintJobStatus
} from '@contexts/kitchen-operations/kitchen-printer/domain/kitchen-ticket-print-job'
import { KitchenTicketPrintJobRepository } from '@contexts/kitchen-operations/kitchen-printer/domain/repositories/kitchen-ticket-print-job.repository'
import { KitchenTicketPrintJobEntity } from './kitchen-ticket-print-job.entity'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'

@Injectable()
export class TypeOrmKitchenTicketPrintJobRepository
  extends TransactionalRepository<KitchenTicketPrintJobEntity>
  implements KitchenTicketPrintJobRepository
{
  constructor(
    @InjectRepository(KitchenTicketPrintJobEntity)
    repository: Repository<KitchenTicketPrintJobEntity>,
    uow: UnitOfWorkContextHolder
  ) {
    super(repository, uow)
  }

  async save(job: KitchenTicketPrintJob): Promise<void> {
    const primitives = job.toPrimitives()
    const entity = this.repo.create(primitives)
    await this.repo.save(entity)
  }

  async search(id: string): Promise<KitchenTicketPrintJob | null> {
    const entity = await this.repo.findOne({ where: { id } })

    if (!entity) {
      return null
    }

    return this.toDomain(entity)
  }

  // MUST filter status IN ('pending', 'delivered') — NEVER status = 'pending' alone.
  async searchUnprinted(): Promise<KitchenTicketPrintJob[]> {
    const entities = await this.repo.find({
      where: { status: In(['pending', 'delivered']) },
      order: { createdAt: 'ASC' }
    })

    return entities.map(entity => this.toDomain(entity))
  }

  // MUST filter status = 'failed' only.
  async searchFailed(): Promise<KitchenTicketPrintJob[]> {
    const entities = await this.repo.find({
      where: { status: 'failed' },
      order: { createdAt: 'ASC' }
    })

    return entities.map(entity => this.toDomain(entity))
  }

  private toDomain(entity: KitchenTicketPrintJobEntity): KitchenTicketPrintJob {
    return KitchenTicketPrintJob.fromPrimitives({
      id: entity.id,
      ticketNumber: entity.ticketNumber,
      stationId: entity.stationId,
      stationName: entity.stationName,
      payload: entity.payload,
      status: entity.status as KitchenTicketPrintJobStatus,
      createdAt: entity.createdAt,
      deliveredAt: entity.deliveredAt,
      printedAt: entity.printedAt,
      failureReason: entity.failureReason as FailureReason | null,
      failedAt: entity.failedAt,
      updatedAt: entity.updatedAt
    })
  }
}
