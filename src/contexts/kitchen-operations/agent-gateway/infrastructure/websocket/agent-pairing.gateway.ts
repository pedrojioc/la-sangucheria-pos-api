import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection
} from '@nestjs/websockets'
import { Socket } from 'socket.io'

import { PairingSocketRegistry } from './pairing-socket-registry'
import { IssuePairingCode } from '@contexts/kitchen-operations/pairing-code/application/issue/issue-pairing-code'

// v1 abuse-resistance: simple in-memory counter + timestamp guard, no
// @nestjs/throttler dependency (not in this repo). Scoped to the design's
// stated assumption that /agent/pairing is only reachable from the
// restaurant's internal LAN, not the public internet.
const MIN_INTERVAL_BETWEEN_REQUESTS_MS = 5000
const MAX_OUTSTANDING_CODES = 50

// /agent/pairing accepts UNAUTHENTICATED connections — by design, per the
// Smart-TV-style pairing flow. This is a deliberate, isolated exception:
// it ONLY supports the pairing request/await-credential exchange and MUST
// NOT expose any other /agent capability (report-devices, print-ack, etc).
// /agent (agent.gateway.ts) remains fully authenticated with zero exceptions.
@WebSocketGateway({ namespace: '/agent/pairing' })
export class PairingGateway implements OnGatewayConnection {
  private readonly lastRequestAtBySocket = new Map<string, number>()
  private outstandingCodeCount = 0

  constructor(
    private readonly registry: PairingSocketRegistry,
    private readonly issuePairingCode: IssuePairingCode
  ) {}

  // No auth handshake here — this namespace is unauthenticated by design.
  async handleConnection(_socket: Socket): Promise<void> {
    // No-op: connection is accepted unconditionally.
  }

  @SubscribeMessage('request-pairing-code')
  async handleRequestPairingCode(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: { code?: string }
  ): Promise<void> {
    // Reconnect with a still-valid code: if a credential was redeemed while
    // this socket was disconnected, deliver it now instead of issuing a
    // fresh code (race recovery — see design's socket-push race recovery).
    if (payload?.code) {
      const pendingApiKey = this.registry.getPendingDelivery(payload.code)
      if (pendingApiKey) {
        this.registry.setSocket(payload.code, socket)
        socket.emit('agent-credential', { apiKey: pendingApiKey })
        return
      }
    }

    if (this.isRateLimited(socket.id)) {
      socket.emit('pairing-code-error', { reason: 'rate-limited' })
      return
    }

    if (this.outstandingCodeCount >= MAX_OUTSTANDING_CODES) {
      socket.emit('pairing-code-error', { reason: 'too-many-outstanding-codes' })
      return
    }

    this.lastRequestAtBySocket.set(socket.id, Date.now())
    const { code, expiresAt } = await this.issuePairingCode.run()
    this.outstandingCodeCount += 1
    this.registry.setSocket(code, socket)
    socket.emit('pairing-code', { code, expiresAt })
  }

  private isRateLimited(socketId: string): boolean {
    const lastRequestAt = this.lastRequestAtBySocket.get(socketId)
    if (lastRequestAt === undefined) return false
    return Date.now() - lastRequestAt < MIN_INTERVAL_BETWEEN_REQUESTS_MS
  }
}
