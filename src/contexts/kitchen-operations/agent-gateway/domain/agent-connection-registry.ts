// v1: a single active printing agent. Keyed by a fixed constant today; the
// key-derivation function is isolated so a future multi-tenant change can
// swap it for `establishmentId` without touching the gateway/dispatcher.
const AGENT_KEY = 'default'

function deriveAgentKey(): string {
  return AGENT_KEY
}

// Structural contract for a registered agent connection — a socket.io Socket
// satisfies this shape, and it keeps the registry/domain free of a hard
// socket.io import.
export interface AgentConnection {
  emit(event: string, payload: unknown): void
}

export class AgentConnectionRegistry {
  private readonly connections = new Map<string, AgentConnection>()

  register(connection: AgentConnection): void {
    this.connections.set(deriveAgentKey(), connection)
  }

  unregister(connection: AgentConnection): void {
    const key = deriveAgentKey()
    if (this.connections.get(key) === connection) {
      this.connections.delete(key)
    }
  }

  current(): AgentConnection | undefined {
    return this.connections.get(deriveAgentKey())
  }
}
