import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuthenticationModule } from '@contexts/iam/authentication/authentication.module'
import { createProvider } from '@core/utils/create-provider'

import { AgentConnectionRegistry } from './domain/agent-connection-registry'
import { AgentGateway } from './infrastructure/websocket/agent.gateway'
import { PairingGateway } from './infrastructure/websocket/agent-pairing.gateway'
import { PairingSocketRegistry } from './infrastructure/websocket/pairing-socket-registry'
import { AgentPairingController } from './presentation/http/agent-pairing.controller'
import { DiscoveredPrinterDeviceController } from './presentation/http/discovered-printer-device.controller'
import { WebSocketKitchenAgentNotifierAdapter } from './infrastructure/adapters/websocket-kitchen-agent-notifier.adapter'
import { KitchenAgentNotifierPort } from '@contexts/kitchen-operations/kitchen-printer/application/ports/kitchen-agent-notifier.port'
import { KitchenTicketPrintJobRepository } from '@contexts/kitchen-operations/kitchen-printer/domain/repositories/kitchen-ticket-print-job.repository'
import { AcknowledgePrintJob } from '@contexts/kitchen-operations/kitchen-printer/application/acknowledge/acknowledge-print-job'
import { KitchenPrinterModule } from '@contexts/kitchen-operations/kitchen-printer/kitchen-printer.module'

import { PairingCodeEntity } from '@contexts/kitchen-operations/pairing-code/infrastructure/persistence/typeorm/pairing-code.entity'
import { PairingCodeRepository } from '@contexts/kitchen-operations/pairing-code/domain/repositories/pairing-code.repository'
import { TypeOrmPairingCodeRepository } from '@contexts/kitchen-operations/pairing-code/infrastructure/persistence/typeorm/typeorm-pairing-code.repository'
import { IssuePairingCode } from '@contexts/kitchen-operations/pairing-code/application/issue/issue-pairing-code'
import { RedeemPairingCode } from '@contexts/kitchen-operations/pairing-code/application/redeem/redeem-pairing-code'

import { AgentCredentialModule } from '@contexts/kitchen-operations/agent-credential/agent-credential.module'
import { IssueAgentCredential } from '@contexts/kitchen-operations/agent-credential/application/issue/issue-agent-credential'
import { AgentCredentialVerifierPort } from '@contexts/kitchen-operations/agent-credential/domain/services/agent-credential-verifier.port'

import { EstablishmentModule } from '@contexts/establishment/establishment/establishment.module'

import { PrinterDiscoveryModule } from '@contexts/kitchen-operations/printer-discovery/printer-discovery.module'
import { RecordDiscoveredDevice } from '@contexts/kitchen-operations/printer-discovery/application/record/record-discovered-device'

@Module({
  // KitchenPrinterModule imports AgentGatewayModule (for KitchenAgentNotifierPort),
  // so this side must use forwardRef to break the circular dependency.
  imports: [
    AuthenticationModule,
    forwardRef(() => KitchenPrinterModule),
    TypeOrmModule.forFeature([PairingCodeEntity]),
    AgentCredentialModule,
    EstablishmentModule,
    PrinterDiscoveryModule
  ],
  controllers: [AgentPairingController, DiscoveredPrinterDeviceController],
  providers: [
    // REGISTRIES
    AgentConnectionRegistry,
    PairingSocketRegistry,

    // PORTS -> ADAPTERS
    {
      provide: KitchenAgentNotifierPort,
      useClass: WebSocketKitchenAgentNotifierAdapter
    },
    { provide: PairingCodeRepository, useClass: TypeOrmPairingCodeRepository },

    // USE CASES
    createProvider(AcknowledgePrintJob, [KitchenTicketPrintJobRepository]),
    createProvider(IssuePairingCode, [PairingCodeRepository]),
    createProvider(RedeemPairingCode, [PairingCodeRepository, IssueAgentCredential]),

    // GATEWAYS
    createProvider(AgentGateway, [
      AgentConnectionRegistry,
      AgentCredentialVerifierPort,
      AcknowledgePrintJob,
      RecordDiscoveredDevice
    ]),
    createProvider(PairingGateway, [PairingSocketRegistry, IssuePairingCode])
  ],
  exports: [KitchenAgentNotifierPort]
})
export class AgentGatewayModule {}
