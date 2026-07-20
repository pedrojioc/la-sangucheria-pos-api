import { Module, OnModuleInit } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { EventBus } from '@shared/domain/events'
import { createProvider } from '@core/utils/create-provider'

import { KitchenPrinterPort } from './application/ports/kitchen-printer.port'
import { PrinterStationResolverPort } from './application/ports/printer-station-resolver.port'
import { KitchenPrinterDispatcher } from './application/kitchen-printer-dispatcher'
import { OnOrderSentPrintKitchenTicket } from './application/subscribers/on-order-sent-print-kitchen-ticket'
import { EscPosKitchenPrinterAdapter } from './infrastructure/adapters/esc-pos-kitchen-printer.adapter'
import { TypeOrmPrinterStationResolverAdapter } from './infrastructure/adapters/typeorm-printer-station-resolver.adapter'
import { KitchenTicketPrintJobRepository } from './domain/repositories/kitchen-ticket-print-job.repository'
import { KitchenTicketPrintJobEntity } from './infrastructure/persistence/typeorm/kitchen-ticket-print-job.entity'
import { TypeOrmKitchenTicketPrintJobRepository } from './infrastructure/persistence/typeorm/typeorm-kitchen-ticket-print-job.repository'

@Module({
  imports: [TypeOrmModule.forFeature([KitchenTicketPrintJobEntity])],
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
    // KitchenTicketPrintJob is not yet wired into the dispatcher — that
    // integration is scoped to a later change (dispatcher branching by
    // connectionType). This binding only exists so AgentGatewayModule's
    // AcknowledgePrintJob use case can resolve the repository.
    {
      provide: KitchenTicketPrintJobRepository,
      useClass: TypeOrmKitchenTicketPrintJobRepository
    },

    // USE CASE / DISPATCHER
    createProvider(KitchenPrinterDispatcher, [KitchenPrinterPort, PrinterStationResolverPort]),

    // SUBSCRIBER
    {
      provide: OnOrderSentPrintKitchenTicket,
      useFactory: (dispatcher: KitchenPrinterDispatcher) =>
        new OnOrderSentPrintKitchenTicket(dispatcher),
      inject: [KitchenPrinterDispatcher]
    }
  ],
  exports: [KitchenTicketPrintJobRepository]
})
export class KitchenPrinterModule implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBus,
    private readonly subscriber: OnOrderSentPrintKitchenTicket
  ) {}

  onModuleInit(): void {
    this.eventBus.addSubscribers([this.subscriber])
  }
}
