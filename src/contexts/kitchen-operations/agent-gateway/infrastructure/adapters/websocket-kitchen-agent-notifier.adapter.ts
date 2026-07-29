import { Injectable } from '@nestjs/common'

import {
  KitchenAgentNotifierPort,
  NotifyResult
} from '@contexts/kitchen-operations/kitchen-printer/application/ports/kitchen-agent-notifier.port'
import { KitchenPrintTicket } from '@contexts/kitchen-operations/kitchen-printer/application/kitchen-print-ticket'
import { AgentConnectionRegistry } from '@contexts/kitchen-operations/agent-gateway/domain/agent-connection-registry'
import { EstablishmentRepository } from '@contexts/establishment/establishment/domain/repositories/establishment.repository'

@Injectable()
export class WebSocketKitchenAgentNotifierAdapter implements KitchenAgentNotifierPort {
  constructor(
    private readonly registry: AgentConnectionRegistry,
    private readonly establishmentRepository: EstablishmentRepository
  ) {}

  // The KitchenAgentNotifierPort contract stays guardrail-frozen — no
  // AgentCredential/EstablishmentId parameter. This adapter resolves the
  // singleton Establishment internally purely to key the registry lookup
  // (same pattern as AgentPairingController), since the registry is now
  // keyed by EstablishmentId instead of an implicit single-agent slot.
  // Returns ONLY the socket-delivery outcome. Print confirmation arrives later,
  // out-of-band, via the 'print-ack' event — this method never waits on it.
  async notify(ticket: KitchenPrintTicket, jobId: string): Promise<NotifyResult> {
    const establishment = await this.establishmentRepository.findSingleton()
    const connection = this.registry.current(establishment.id)

    if (!connection) {
      return { delivered: false }
    }

    connection.emit('print-ticket', { ticket, jobId })

    return { delivered: true }
  }
}
