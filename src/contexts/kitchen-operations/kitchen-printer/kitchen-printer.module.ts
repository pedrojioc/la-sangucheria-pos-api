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

@Module({
  imports: [TypeOrmModule.forFeature([])],
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

    // USE CASE / DISPATCHER
    createProvider(KitchenPrinterDispatcher, [KitchenPrinterPort, PrinterStationResolverPort]),

    // SUBSCRIBER
    {
      provide: OnOrderSentPrintKitchenTicket,
      useFactory: (dispatcher: KitchenPrinterDispatcher) =>
        new OnOrderSentPrintKitchenTicket(dispatcher),
      inject: [KitchenPrinterDispatcher]
    }
  ]
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
