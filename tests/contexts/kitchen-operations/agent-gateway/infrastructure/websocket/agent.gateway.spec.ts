import { AgentGateway } from '@contexts/kitchen-operations/agent-gateway/infrastructure/websocket/agent.gateway'
import { AgentConnectionRegistry } from '@contexts/kitchen-operations/agent-gateway/domain/agent-connection-registry'
import { JwtService } from '@contexts/iam/authentication/domain/services/jwt.service'
import { AcknowledgePrintJob } from '@contexts/kitchen-operations/kitchen-printer/application/acknowledge/acknowledge-print-job'

type FakeSocket = {
  id: string
  handshake: { auth: Record<string, unknown> }
  emit: jest.Mock
  disconnect: jest.Mock
}

const buildSocket = (token: string | undefined, id = 'socket-1'): FakeSocket => ({
  id,
  handshake: { auth: { token } },
  emit: jest.fn(),
  disconnect: jest.fn()
})

describe('AgentGateway', () => {
  let registry: AgentConnectionRegistry
  let jwtService: jest.Mocked<JwtService>
  let acknowledgePrintJob: jest.Mocked<AcknowledgePrintJob>
  let gateway: AgentGateway

  beforeEach(() => {
    registry = new AgentConnectionRegistry()
    jwtService = {
      verifyAccessToken: jest.fn(),
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
      verifyTokenHash: jest.fn()
    } as unknown as jest.Mocked<JwtService>
    acknowledgePrintJob = { run: jest.fn() } as unknown as jest.Mocked<AcknowledgePrintJob>
    gateway = new AgentGateway(registry, jwtService, acknowledgePrintJob)
  })

  describe('handleConnection', () => {
    it('disconnects a socket with a missing token', async () => {
      const socket = buildSocket(undefined)

      await gateway.handleConnection(socket as any)

      expect(socket.disconnect).toHaveBeenCalled()
    })

    it('disconnects a socket with an invalid token', async () => {
      jwtService.verifyAccessToken.mockRejectedValue(new Error('invalid'))
      const socket = buildSocket('bad-token')

      await gateway.handleConnection(socket as any)

      expect(socket.disconnect).toHaveBeenCalled()
    })

    it('does not disconnect a socket with a valid token', async () => {
      jwtService.verifyAccessToken.mockResolvedValue({
        sub: 'user-1',
        username: 'agent',
        email: 'agent@example.com',
        iss: 'test',
        aud: 'test',
        exp: 0,
        iat: 0
      })
      const socket = buildSocket('good-token')

      await gateway.handleConnection(socket as any)

      expect(socket.disconnect).not.toHaveBeenCalled()
    })
  })

  describe('register-agent', () => {
    it('stores the connection in the registry and acknowledges registration', () => {
      const socket = buildSocket('good-token')

      const result = gateway.handleRegisterAgent(socket as any)

      expect(registry.current()).toBe(socket)
      expect(result).toEqual({ registered: true })
    })

    it('replaces the previous connection when a new socket registers', () => {
      const first = buildSocket('good-token', 'socket-1')
      const second = buildSocket('good-token', 'socket-2')

      gateway.handleRegisterAgent(first as any)
      gateway.handleRegisterAgent(second as any)

      expect(registry.current()).toBe(second)
    })
  })

  describe('print-ack', () => {
    it('invokes AcknowledgePrintJob.run with the received jobId', async () => {
      await gateway.handlePrintAck({ jobId: 'job-1' })

      expect(acknowledgePrintJob.run).toHaveBeenCalledWith('job-1')
    })
  })

  describe('handleDisconnect', () => {
    it('unregisters the disconnecting socket from the registry', () => {
      const socket = buildSocket('good-token')
      gateway.handleRegisterAgent(socket as any)

      gateway.handleDisconnect(socket as any)

      expect(registry.current()).toBeUndefined()
    })
  })
})
