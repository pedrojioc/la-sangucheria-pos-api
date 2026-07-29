import { PairingGateway } from '@contexts/kitchen-operations/agent-gateway/infrastructure/websocket/agent-pairing.gateway'
import { PairingSocketRegistry } from '@contexts/kitchen-operations/agent-gateway/infrastructure/websocket/pairing-socket-registry'
import { IssuePairingCode } from '@contexts/kitchen-operations/pairing-code/application/issue/issue-pairing-code'
import { PairingCodeRepository } from '@contexts/kitchen-operations/pairing-code/domain/repositories/pairing-code.repository'

type FakeSocket = {
  id: string
  handshake: { address: string }
  emit: jest.Mock
  disconnect: jest.Mock
}

const buildSocket = (id = 'socket-1', address = '127.0.0.1'): FakeSocket => ({
  id,
  handshake: { address },
  emit: jest.fn(),
  disconnect: jest.fn()
})

describe('PairingGateway', () => {
  let registry: PairingSocketRegistry
  let issuePairingCode: IssuePairingCode
  let repository: jest.Mocked<PairingCodeRepository>
  let gateway: PairingGateway

  beforeEach(() => {
    registry = new PairingSocketRegistry()
    repository = {
      save: jest.fn(),
      findByCode: jest.fn()
    } as unknown as jest.Mocked<PairingCodeRepository>
    issuePairingCode = new IssuePairingCode(repository)
    gateway = new PairingGateway(registry, issuePairingCode)
  })

  describe('connection', () => {
    it('accepts an unauthenticated connection without disconnecting', async () => {
      const socket = buildSocket()

      await gateway.handleConnection(socket as any)

      expect(socket.disconnect).not.toHaveBeenCalled()
    })
  })

  describe('request-pairing-code', () => {
    it('issues a code, registers the socket, and emits pairing-code', async () => {
      const socket = buildSocket()

      await gateway.handleRequestPairingCode(socket as any, {})

      expect(repository.save).toHaveBeenCalledTimes(1)
      const saved = repository.save.mock.calls[0][0]
      expect(socket.emit).toHaveBeenCalledWith('pairing-code', {
        code: saved.code,
        expiresAt: saved.expiresAt
      })
      expect(registry.getSocket(saved.code)).toBe(socket)
    })
  })

  describe('narrow message boundary', () => {
    it('does not expose any handler for report-devices or other /agent capabilities', () => {
      const gatewayMethods = Object.getOwnPropertyNames(PairingGateway.prototype)

      expect(gatewayMethods).not.toContain('handleReportDevices')
      expect(gatewayMethods).not.toContain('handleRegisterAgent')
      expect(gatewayMethods).not.toContain('handlePrintAck')
    })
  })

  describe('reconnect-with-same-code delivery', () => {
    it('redelivers the pending credential when reconnecting with a still-valid code that has a pending delivery', async () => {
      registry.setPendingDelivery('ABC234', 'lspa_pending_secret')
      const socket = buildSocket('socket-2')

      await gateway.handleRequestPairingCode(socket as any, { code: 'ABC234' })

      expect(socket.emit).toHaveBeenCalledWith('agent-credential', {
        apiKey: 'lspa_pending_secret'
      })
      expect(registry.getSocket('ABC234')).toBe(socket)
      // No new code is issued when redelivering a pending credential.
      expect(repository.save).not.toHaveBeenCalled()
    })

    it('does not emit agent-credential when reconnecting with a code that has no pending delivery', async () => {
      const socket = buildSocket('socket-3')

      await gateway.handleRequestPairingCode(socket as any, { code: 'NOPEND' })

      expect(socket.emit).not.toHaveBeenCalledWith('agent-credential', expect.anything())
      // Falls back to issuing a fresh code.
      expect(repository.save).toHaveBeenCalledTimes(1)
    })
  })

  describe('rate limiting', () => {
    it('rejects a repeated pair-request from the same socket within the minimum interval', async () => {
      const socket = buildSocket('socket-rl')

      await gateway.handleRequestPairingCode(socket as any, {})
      const firstCallCount = repository.save.mock.calls.length
      await gateway.handleRequestPairingCode(socket as any, {})

      // No new code issued for the immediate repeat — request was rejected.
      expect(repository.save.mock.calls.length).toBe(firstCallCount)
      expect(socket.emit).toHaveBeenCalledWith('pairing-code-error', {
        reason: 'rate-limited'
      })
    })

    it('allows a new pair-request from a different socket even within the same window', async () => {
      const first = buildSocket('socket-a')
      const second = buildSocket('socket-b')

      await gateway.handleRequestPairingCode(first as any, {})
      await gateway.handleRequestPairingCode(second as any, {})

      expect(repository.save).toHaveBeenCalledTimes(2)
    })

    it('caps the number of outstanding un-redeemed codes', async () => {
      // Exhaust the cap with distinct sockets so per-socket throttling doesn't interfere.
      const maxOutstanding = 50
      for (let i = 0; i < maxOutstanding; i++) {
        const socket = buildSocket(`socket-cap-${i}`)

        await gateway.handleRequestPairingCode(socket as any, {})
      }
      const callsBeforeOverflow = repository.save.mock.calls.length

      const overflowSocket = buildSocket('socket-overflow')
      await gateway.handleRequestPairingCode(overflowSocket as any, {})

      expect(repository.save.mock.calls.length).toBe(callsBeforeOverflow)
      expect(overflowSocket.emit).toHaveBeenCalledWith('pairing-code-error', {
        reason: 'too-many-outstanding-codes'
      })
    })
  })
})
