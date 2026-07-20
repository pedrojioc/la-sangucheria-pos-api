import { Injectable } from '@nestjs/common'

import {
  KitchenAgentNotifierPort,
  NotifyResult
} from '@contexts/kitchen-operations/kitchen-printer/application/ports/kitchen-agent-notifier.port'
import { KitchenPrintTicket } from '@contexts/kitchen-operations/kitchen-printer/application/kitchen-print-ticket'
import { AgentConnectionRegistry } from '@contexts/kitchen-operations/agent-gateway/domain/agent-connection-registry'

@Injectable()
export class WebSocketKitchenAgentNotifierAdapter implements KitchenAgentNotifierPort {
  constructor(private readonly registry: AgentConnectionRegistry) {}

  // Returns ONLY the socket-delivery outcome. Print confirmation arrives later,
  // out-of-band, via the 'print-ack' event — this method never waits on it.
  // No `await` inside is intentional: the socket emit is fire-and-forget.
  notify(ticket: KitchenPrintTicket, jobId: string): Promise<NotifyResult> {
    const connection = this.registry.current()

    if (!connection) {
      return Promise.resolve({ delivered: false })
    }

    connection.emit('print-ticket', { ticket, jobId })

    return Promise.resolve({ delivered: true })
  }
}
