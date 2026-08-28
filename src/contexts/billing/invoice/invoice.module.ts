import { Module, OnModuleInit } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Entities
import { InvoiceEntity } from '@contexts/billing/invoice/infrastructure/persistence/typeorm/invoice.entity'

// Repositories
import { InvoiceRepository } from '@contexts/billing/invoice/domain/repositories/invoice.repository'
import { TypeOrmInvoiceRepository } from '@contexts/billing/invoice/infrastructure/persistence/typeorm/typeorm-invoice.repository'

// Ports
import { FactusApiPort } from '@contexts/billing/invoice/application/ports/factus-api.port'

// Adapters
import { FactusApiAdapter } from '@contexts/billing/invoice/infrastructure/adapters/factus-api.adapter'

// Use Cases
import { IssueInvoice } from '@contexts/billing/invoice/application/issue-invoice/issue-invoice'
import { RetryInvoice } from '@contexts/billing/invoice/application/retry-invoice/retry-invoice'
import { ListPendingInvoices } from '@contexts/billing/invoice/application/list-pending-invoices/list-pending-invoices'

// Subscribers
import { IssueBillingDocumentOnOrderClosed } from '@contexts/billing/invoice/application/subscribers/issue-billing-document-on-order-closed'

// Controllers
import { InvoiceController } from '@contexts/billing/invoice/presentation/invoice.controller'

// Cross-module imports
import { BillingConfigModule } from '@contexts/billing/billing-config/billing-config.module'
import { BillingConfigRepository } from '@contexts/billing/billing-config/domain/repositories/billing-config.repository'

// Events
import { EventBus } from '@shared/domain/events'

// Utils
import { createProvider } from '@core/utils/create-provider'

@Module({
  imports: [TypeOrmModule.forFeature([InvoiceEntity]), BillingConfigModule],
  controllers: [InvoiceController],
  providers: [
    // REPOSITORIES
    {
      provide: InvoiceRepository,
      useClass: TypeOrmInvoiceRepository
    },

    // PORTS (ACL)
    {
      provide: FactusApiPort,
      useClass: FactusApiAdapter
    },

    // USE CASES
    createProvider(IssueInvoice, [
      InvoiceRepository,
      BillingConfigRepository,
      FactusApiPort,
      EventBus
    ]),
    createProvider(RetryInvoice, [
      InvoiceRepository,
      BillingConfigRepository,
      FactusApiPort,
      EventBus
    ]),
    createProvider(ListPendingInvoices, [InvoiceRepository]),

    // SUBSCRIBERS
    createProvider(IssueBillingDocumentOnOrderClosed, [IssueInvoice])
  ]
})
export class InvoiceModule implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBus,
    private readonly issueBillingDocumentOnOrderClosed: IssueBillingDocumentOnOrderClosed
  ) {}

  onModuleInit(): void {
    this.eventBus.addSubscribers([this.issueBillingDocumentOnOrderClosed])
  }
}
