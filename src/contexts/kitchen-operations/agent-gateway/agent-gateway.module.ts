import { Module } from '@nestjs/common'

import { AuthenticationModule } from '@contexts/iam/authentication/authentication.module'
import { JwtService } from '@contexts/iam/authentication/domain/services/jwt.service'
import { createProvider } from '@core/utils/create-provider'

import { AgentConnectionRegistry } from './domain/agent-connection-registry'
import { AgentGateway } from './infrastructure/websocket/agent.gateway'
import { WebSocketKitchenAgentNotifierAdapter } from './infrastructure/adapters/websocket-kitchen-agent-notifier.adapter'
import { KitchenAgentNotifierPort } from '@contexts/kitchen-operations/kitchen-printer/application/ports/kitchen-agent-notifier.port'
import { KitchenTicketPrintJobRepository } from '@contexts/kitchen-operations/kitchen-printer/domain/repositories/kitchen-ticket-print-job.repository'
import { AcknowledgePrintJob } from '@contexts/kitchen-operations/kitchen-printer/application/acknowledge/acknowledge-print-job'
import { KitchenPrinterModule } from '@contexts/kitchen-operations/kitchen-printer/kitchen-printer.module'

@Module({
  imports: [AuthenticationModule, KitchenPrinterModule],
  providers: [
    // REGISTRY
    AgentConnectionRegistry,

    // PORTS -> ADAPTERS
    {
      provide: KitchenAgentNotifierPort,
      useClass: WebSocketKitchenAgentNotifierAdapter
    },

    // USE CASES
    createProvider(AcknowledgePrintJob, [KitchenTicketPrintJobRepository]),

    // GATEWAY
    createProvider(AgentGateway, [AgentConnectionRegistry, JwtService, AcknowledgePrintJob])
  ],
  exports: [KitchenAgentNotifierPort]
})
export class AgentGatewayModule {}
