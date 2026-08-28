import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'

import { Invoice, InvoicePrimitives } from '@contexts/billing/invoice/domain/invoice'
import { InvoiceId } from '@contexts/billing/invoice/domain/invoice-id'
import { InvoiceRepository } from '@contexts/billing/invoice/domain/repositories/invoice.repository'
import { InvoiceStatus } from '@contexts/billing/invoice/domain/invoice-status'
import { DocumentType } from '@contexts/billing/invoice/domain/document-type'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { InvoiceEntity } from './invoice.entity'

@Injectable()
export class TypeOrmInvoiceRepository
  extends TransactionalRepository<InvoiceEntity>
  implements InvoiceRepository
{
  constructor(
    @InjectRepository(InvoiceEntity)
    repository: Repository<InvoiceEntity>,
    uow: UnitOfWorkContextHolder
  ) {
    super(repository, uow)
  }

  async save(invoice: Invoice): Promise<void> {
    const primitives = invoice.toPrimitives()
    const entity = this.repo.create({
      id: primitives.id,
      documentType: primitives.documentType,
      snapshot: primitives.snapshot,
      status: primitives.status,
      cufeCude: primitives.cufeCude,
      factusDocumentNumber: primitives.factusDocumentNumber,
      failureReason: primitives.failureReason,
      attempts: primitives.attempts
    })
    await this.repo.save(entity)
  }

  async search(id: InvoiceId): Promise<Invoice | null> {
    const entity = await this.repo.findOne({ where: { id: id.value } })
    if (!entity) {
      return null
    }
    return Invoice.fromPrimitives(this.toDomain(entity))
  }

  async searchPending(): Promise<Invoice[]> {
    const entities = await this.repo.find({
      where: {
        status: In([InvoiceStatus.FAILED, InvoiceStatus.PENDING])
      }
    })
    return entities.map(entity => Invoice.fromPrimitives(this.toDomain(entity)))
  }

  private toDomain(entity: InvoiceEntity): InvoicePrimitives {
    return {
      id: entity.id,
      documentType: entity.documentType as DocumentType,
      snapshot: entity.snapshot,
      status: entity.status as InvoiceStatus,
      cufeCude: entity.cufeCude,
      factusDocumentNumber: entity.factusDocumentNumber,
      failureReason: entity.failureReason,
      attempts: entity.attempts,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    }
  }
}
