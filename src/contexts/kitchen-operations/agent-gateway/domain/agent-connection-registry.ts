import { EstablishmentId } from '@contexts/establishment/establishment/domain/establishment-id'

// Keyed by the authenticated connection's EstablishmentId, resolved from the
// verified AgentCredential at handshake time (no more hardcoded 'default').
function deriveAgentKey(establishmentId: EstablishmentId): string {
  return establishmentId.value
}

// Structural contract for a registered agent connection — a socket.io Socket
// satisfies this shape, and it keeps the registry/domain free of a hard
// socket.io import.
export interface AgentConnection {
  emit(event: string, payload: unknown): void
}

export class AgentConnectionRegistry {
  private readonly connections = new Map<string, AgentConnection>()

  register(establishmentId: EstablishmentId, connection: AgentConnection): void {
    this.connections.set(deriveAgentKey(establishmentId), connection)
  }

  unregister(establishmentId: EstablishmentId, connection: AgentConnection): void {
    const key = deriveAgentKey(establishmentId)
    if (this.connections.get(key) === connection) {
      this.connections.delete(key)
    }
  }

  current(establishmentId: EstablishmentId): AgentConnection | undefined {
    return this.connections.get(deriveAgentKey(establishmentId))
  }
}
