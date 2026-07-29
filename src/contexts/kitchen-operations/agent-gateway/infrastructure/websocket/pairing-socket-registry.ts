// Transient, in-memory routing for the /agent/pairing exchange — separate
// from AgentConnectionRegistry, which keys long-lived authenticated agent
// connections by EstablishmentId. Pairing sockets are short-lived (one
// code, ~10 min, then gone); no persistence of volatile socket handles.
export interface PairingSocket {
  emit(event: string, payload: unknown): void
}

export class PairingSocketRegistry {
  private readonly sockets = new Map<string, PairingSocket>()
  private readonly pendingDelivery = new Map<string, string>()

  setSocket(code: string, socket: PairingSocket): void {
    this.sockets.set(code, socket)
  }

  getSocket(code: string): PairingSocket | undefined {
    return this.sockets.get(code)
  }

  deleteSocket(code: string): void {
    this.sockets.delete(code)
  }

  setPendingDelivery(code: string, apiKey: string): void {
    this.pendingDelivery.set(code, apiKey)
  }

  getPendingDelivery(code: string): string | undefined {
    return this.pendingDelivery.get(code)
  }

  deletePendingDelivery(code: string): void {
    this.pendingDelivery.delete(code)
  }
}
