import { forwardRef, Module, OnModuleInit } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { EventBus } from '@shared/domain/events'
import { createProvider } from '@core/utils/create-provider'
import { AgentGatewayModule } from '@contexts/kitchen-operations/agent-gateway/agent-gateway.module'

import { KitchenPrinterPort } from './application/ports/kitchen-printer.port'
import { PrinterStationResolverPort } from './application/ports/printer-station-resolver.port'
import { KitchenAgentNotifierPort } from './application/ports/kitchen-agent-notifier.port'
import { KitchenPrinterDispatcher } from './application/kitchen-printer-dispatcher'
import { ReprintKitchenTicket } from './application/reprint/reprint-kitchen-ticket'
import { FindUnprintedPrintJobs } from './application/find-unprinted/find-unprinted-print-jobs'
import { FindFailedPrintJobs } from './application/find-failed/find-failed-print-jobs'
import { PrintKitchenTicketOnOrderSent } from './application/subscribers/print-kitchen-ticket-on-order-sent'
import { EscPosKitchenPrinterAdapter } from './infrastructure/adapters/esc-pos-kitchen-printer.adapter'
import { TypeOrmPrinterStationResolverAdapter } from './infrastructure/adapters/typeorm-printer-station-resolver.adapter'
import { KitchenTicketPrintJobRepository } from './domain/repositories/kitchen-ticket-print-job.repository'
import { KitchenTicketPrintJobEntity } from './infrastructure/persistence/typeorm/kitchen-ticket-print-job.entity'
import { TypeOrmKitchenTicketPrintJobRepository } from './infrastructure/persistence/typeorm/typeorm-kitchen-ticket-print-job.repository'
import { KitchenPrintJobController } from './presentation/http/controllers/kitchen-print-job.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([KitchenTicketPrintJobEntity]),
    // AgentGatewayModule imports KitchenPrinterModule (for KitchenTicketPrintJobRepository),
    // so this side must use forwardRef to break the circular dependency.
    forwardRef(() => AgentGatewayModule)
  ],
  controllers: [KitchenPrintJobController],
  providers: [
    // PORTS → ADAPTERS
    {
      provide: KitchenPrinterPort,
      useClass: EscPosKitchenPrinterAdapter
    },
    {
      provide: PrinterStationResolverPort,
      useClass: TypeOrmPrinterStationResolverAdapter
    },

    // REPOSITORIES
    {
      provide: KitchenTicketPrintJobRepository,
      useClass: TypeOrmKitchenTicketPrintJobRepository
    },

    // USE CASES / DISPATCHER
    createProvider(KitchenPrinterDispatcher, [
      KitchenPrinterPort,
      PrinterStationResolverPort,
      KitchenAgentNotifierPort,
      KitchenTicketPrintJobRepository
    ]),
    createProvider(ReprintKitchenTicket, [
      KitchenTicketPrintJobRepository,
      KitchenAgentNotifierPort
    ]),
    createProvider(FindUnprintedPrintJobs, [KitchenTicketPrintJobRepository]),
    createProvider(FindFailedPrintJobs, [KitchenTicketPrintJobRepository]),

    // SUBSCRIBER
    {
      provide: PrintKitchenTicketOnOrderSent,
      useFactory: (dispatcher: KitchenPrinterDispatcher) =>
        new PrintKitchenTicketOnOrderSent(dispatcher),
      inject: [KitchenPrinterDispatcher]
    }
  ],
  exports: [KitchenTicketPrintJobRepository]
})
export class KitchenPrinterModule implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBus,
    private readonly subscriber: PrintKitchenTicketOnOrderSent
  ) {}

  onModuleInit(): void {
    this.eventBus.addSubscribers([this.subscriber])
  }
}
