import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuthenticationModule } from '@contexts/iam/authentication/authentication.module'
import { createProvider } from '@core/utils/create-provider'

import { AgentConnectionRegistry } from './domain/agent-connection-registry'
import { AgentGateway } from './infrastructure/websocket/agent.gateway'
import { PairingIpThrottleGuard } from './infrastructure/guards/pairing-ip-throttle.guard'
import { AgentPairingController } from './presentation/http/agent-pairing.controller'
import { AgentPairingPublicController } from './presentation/http/agent-pairing-public.controller'
import { WebSocketKitchenAgentNotifierAdapter } from './infrastructure/adapters/websocket-kitchen-agent-notifier.adapter'
import { KitchenAgentNotifierPort } from '@contexts/kitchen-operations/kitchen-printer/application/ports/kitchen-agent-notifier.port'
import { KitchenTicketPrintJobRepository } from '@contexts/kitchen-operations/kitchen-printer/domain/repositories/kitchen-ticket-print-job.repository'
import { AcknowledgePrintJob } from '@contexts/kitchen-operations/kitchen-printer/application/acknowledge/acknowledge-print-job'
import { ReportPrintJobFailure } from '@contexts/kitchen-operations/kitchen-printer/application/report-print-job-failure/report-print-job-failure'
import { KitchenPrinterModule } from '@contexts/kitchen-operations/kitchen-printer/kitchen-printer.module'

import { PairingCodeEntity } from '@contexts/kitchen-operations/pairing-code/infrastructure/persistence/typeorm/pairing-code.entity'
import { PairingCodeRepository } from '@contexts/kitchen-operations/pairing-code/domain/repositories/pairing-code.repository'
import { TypeOrmPairingCodeRepository } from '@contexts/kitchen-operations/pairing-code/infrastructure/persistence/typeorm/typeorm-pairing-code.repository'
import { IssuePairingCode } from '@contexts/kitchen-operations/pairing-code/application/issue/issue-pairing-code'
import { RedeemPairingCode } from '@contexts/kitchen-operations/pairing-code/application/redeem/redeem-pairing-code'
import { PollPairingCode } from '@contexts/kitchen-operations/pairing-code/application/poll/poll-pairing-code'

import { AgentCredentialModule } from '@contexts/kitchen-operations/agent-credential/agent-credential.module'
import { IssueAgentCredential } from '@contexts/kitchen-operations/agent-credential/application/issue/issue-agent-credential'
import { RotateAgentCredentialIfNeeded } from '@contexts/kitchen-operations/agent-credential/application/rotate/rotate-agent-credential-if-needed'
import { AgentCredentialVerifierPort } from '@contexts/kitchen-operations/agent-credential/domain/services/agent-credential-verifier.port'

import { EstablishmentModule } from '@contexts/establishment/establishment/establishment.module'

import { PrinterDiscoveryModule } from '@contexts/kitchen-operations/printer-discovery/printer-discovery.module'
import { RecordDiscoveredDevice } from '@contexts/kitchen-operations/printer-discovery/application/record/record-discovered-device'
import { RecordDeviceStatus } from '@contexts/kitchen-operations/printer-discovery/application/record-status/record-device-status'

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
  controllers: [AgentPairingController, AgentPairingPublicController],
  providers: [
    // REGISTRIES
    AgentConnectionRegistry,

    // GUARDS
    PairingIpThrottleGuard,

    // PORTS -> ADAPTERS
    {
      provide: KitchenAgentNotifierPort,
      useClass: WebSocketKitchenAgentNotifierAdapter
    },
    { provide: PairingCodeRepository, useClass: TypeOrmPairingCodeRepository },

    // USE CASES
    createProvider(AcknowledgePrintJob, [KitchenTicketPrintJobRepository]),
    createProvider(ReportPrintJobFailure, [KitchenTicketPrintJobRepository]),
    createProvider(IssuePairingCode, [PairingCodeRepository]),
    createProvider(RedeemPairingCode, [PairingCodeRepository, IssueAgentCredential]),
    createProvider(PollPairingCode, [PairingCodeRepository]),

    // GATEWAYS
    createProvider(AgentGateway, [
      AgentConnectionRegistry,
      AgentCredentialVerifierPort,
      AcknowledgePrintJob,
      ReportPrintJobFailure,
      RecordDiscoveredDevice,
      RecordDeviceStatus,
      RotateAgentCredentialIfNeeded
    ])
  ],
  exports: [KitchenAgentNotifierPort]
})
export class AgentGatewayModule {}
