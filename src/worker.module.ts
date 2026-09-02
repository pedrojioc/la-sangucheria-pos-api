import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

// Configuration
import { EnvConfigModule } from './config/env/env.config'
import { DatabaseModule } from './config/database/database.module'
import appConfig from './config/app.config'

// Shared Infrastructure
import { SharedInfrastructureModule } from '@shared/infrastructure/shared-infrastructure.module'
import { OutboxPollerService } from '@shared/infrastructure/event-sourcing/outbox-poller.service'

// Feature Modules owning current category-2 (Deferred) subscribers
import { InvoiceModule } from '@contexts/billing/invoice/invoice.module'
import { KitchenPrinterModule } from '@contexts/kitchen-operations/kitchen-printer/kitchen-printer.module'

/**
 * WorkerModule (Slice: outbox-worker-process)
 *
 * Second, HTTP-less NestJS process bootstrapped via
 * NestFactory.createApplicationContext (src/worker.ts). Owns
 * OutboxPollerService exclusively — the API process (AppModule) no longer
 * provides it at all (see shared-infrastructure.module.ts's comment).
 *
 * Import graph is deliberately minimal: only the modules owning known
 * category-2 subscribers (InvoiceModule → IssueBillingDocumentOnOrderClosed,
 * KitchenPrinterModule → PrintKitchenTicketOnOrderSent), plus the shared
 * infrastructure the poller depends on (EventStoreModule + the in-memory
 * event bus / EventBusRouter wiring, both exported by
 * SharedInfrastructureModule, which is @Global() and also provides
 * ScheduleModule.forRoot() so @Interval(5000) fires here).
 *
 * KitchenPrinterModule transitively imports AgentGatewayModule via
 * forwardRef — accepted per design/proposal: it's inert without listen()/a
 * WebSocket gateway actually mounting, and start:worker:dev is smoke-tested
 * to confirm no port is bound.
 */
@Module({
  imports: [
    EnvConfigModule,
    ConfigModule.forFeature(appConfig),
    DatabaseModule,
    SharedInfrastructureModule,
    InvoiceModule,
    KitchenPrinterModule
  ],
  providers: [OutboxPollerService]
})
export class WorkerModule {}
