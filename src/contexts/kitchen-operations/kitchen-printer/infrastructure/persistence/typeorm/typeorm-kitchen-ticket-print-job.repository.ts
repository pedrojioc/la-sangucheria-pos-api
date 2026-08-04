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

@Injectable()
export class TypeOrmKitchenTicketPrintJobRepository implements KitchenTicketPrintJobRepository {
  constructor(
    @InjectRepository(KitchenTicketPrintJobEntity)
    private readonly repository: Repository<KitchenTicketPrintJobEntity>
  ) {}

  async save(job: KitchenTicketPrintJob): Promise<void> {
    const primitives = job.toPrimitives()
    const entity = this.repository.create(primitives)
    await this.repository.save(entity)
  }

  async search(id: string): Promise<KitchenTicketPrintJob | null> {
    const entity = await this.repository.findOne({ where: { id } })

    if (!entity) {
      return null
    }

    return this.toDomain(entity)
  }

  // MUST filter status IN ('pending', 'delivered') — NEVER status = 'pending' alone.
  async searchUnprinted(): Promise<KitchenTicketPrintJob[]> {
    const entities = await this.repository.find({
      where: { status: In(['pending', 'delivered']) },
      order: { createdAt: 'ASC' }
    })

    return entities.map(entity => this.toDomain(entity))
  }

  // MUST filter status = 'failed' only.
  async searchFailed(): Promise<KitchenTicketPrintJob[]> {
    const entities = await this.repository.find({
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
