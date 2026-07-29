import { AgentGateway } from '@contexts/kitchen-operations/agent-gateway/infrastructure/websocket/agent.gateway'
import { AgentConnectionRegistry } from '@contexts/kitchen-operations/agent-gateway/domain/agent-connection-registry'
import { AgentCredentialVerifierPort } from '@contexts/kitchen-operations/agent-credential/domain/services/agent-credential-verifier.port'
import { AcknowledgePrintJob } from '@contexts/kitchen-operations/kitchen-printer/application/acknowledge/acknowledge-print-job'
import { RecordDiscoveredDevice } from '@contexts/kitchen-operations/printer-discovery/application/record/record-discovered-device'
import { EstablishmentId } from '@contexts/establishment/establishment/domain/establishment-id'

type FakeSocket = {
  id: string
  handshake: { auth: Record<string, unknown> }
  emit: jest.Mock
  disconnect: jest.Mock
}

const buildSocket = (key: string | undefined, id = 'socket-1'): FakeSocket => ({
  id,
  handshake: { auth: { key } },
  emit: jest.fn(),
  disconnect: jest.fn()
})

describe('AgentGateway', () => {
  let registry: AgentConnectionRegistry
  let verifier: jest.Mocked<AgentCredentialVerifierPort>
  let acknowledgePrintJob: jest.Mocked<AcknowledgePrintJob>
  let recordDiscoveredDevice: jest.Mocked<RecordDiscoveredDevice>
  let gateway: AgentGateway
  const establishmentId1 = EstablishmentId.random()

  beforeEach(() => {
    registry = new AgentConnectionRegistry()
    verifier = { verify: jest.fn() } as unknown as jest.Mocked<AgentCredentialVerifierPort>
    acknowledgePrintJob = { run: jest.fn() } as unknown as jest.Mocked<AcknowledgePrintJob>
    recordDiscoveredDevice = { run: jest.fn() } as unknown as jest.Mocked<RecordDiscoveredDevice>
    gateway = new AgentGateway(registry, verifier, acknowledgePrintJob, recordDiscoveredDevice)
  })

  describe('handleConnection', () => {
    it('disconnects a socket with a missing key', async () => {
      const socket = buildSocket(undefined)

      await gateway.handleConnection(socket as any)

      expect(socket.disconnect).toHaveBeenCalled()
      expect(verifier.verify).not.toHaveBeenCalled()
    })

    it('disconnects a socket whose key matches no credential (invalid key)', async () => {
      verifier.verify.mockResolvedValue(null)
      const socket = buildSocket('bad-key')

      await gateway.handleConnection(socket as any)

      expect(socket.disconnect).toHaveBeenCalled()
    })

    it('disconnects a socket whose key belongs to a revoked/non-authenticatable credential (verifier returns no match)', async () => {
      verifier.verify.mockResolvedValue(null)
      const socket = buildSocket('revoked-key')

      await gateway.handleConnection(socket as any)

      expect(socket.disconnect).toHaveBeenCalled()
    })

    it('does not disconnect a socket with a valid active key and resolves the EstablishmentId for subsequent registry ops', async () => {
      verifier.verify.mockResolvedValue(establishmentId1.value)
      const socket = buildSocket('good-key')

      await gateway.handleConnection(socket as any)

      expect(socket.disconnect).not.toHaveBeenCalled()
    })

    it('(regression guardrail) /agent still rejects unauthenticated connections despite /agent/pairing now existing', async () => {
      const socket = buildSocket(undefined)

      await gateway.handleConnection(socket as any)

      expect(socket.disconnect).toHaveBeenCalledWith(true)
    })
  })

  describe('register-agent', () => {
    it('stores the connection in the registry keyed by the resolved EstablishmentId and acknowledges registration', async () => {
      verifier.verify.mockResolvedValue(establishmentId1.value)
      const socket = buildSocket('good-key')
      await gateway.handleConnection(socket as any)

      const result = gateway.handleRegisterAgent(socket as any)

      expect(registry.current(establishmentId1)).toBe(socket)
      expect(result).toEqual({ registered: true })
    })

    it('replaces the previous connection when a new socket registers for the same establishment', async () => {
      verifier.verify.mockResolvedValue(establishmentId1.value)
      const first = buildSocket('good-key', 'socket-1')
      const second = buildSocket('good-key', 'socket-2')
      await gateway.handleConnection(first as any)
      await gateway.handleConnection(second as any)

      gateway.handleRegisterAgent(first as any)
      gateway.handleRegisterAgent(second as any)

      expect(registry.current(establishmentId1)).toBe(second)
    })
  })

  describe('print-ack', () => {
    it('invokes AcknowledgePrintJob.run with the received jobId', async () => {
      await gateway.handlePrintAck({ jobId: 'job-1' })

      expect(acknowledgePrintJob.run).toHaveBeenCalledWith('job-1')
    })
  })

  describe('handleDisconnect', () => {
    it('unregisters the disconnecting socket from the registry using the resolved EstablishmentId', async () => {
      verifier.verify.mockResolvedValue(establishmentId1.value)
      const socket = buildSocket('good-key')
      await gateway.handleConnection(socket as any)
      gateway.handleRegisterAgent(socket as any)

      gateway.handleDisconnect(socket as any)

      expect(registry.current(establishmentId1)).toBeUndefined()
    })
  })

  describe('report-devices', () => {
    it('delegates each pushed device to RecordDiscoveredDevice with the resolved EstablishmentId', async () => {
      verifier.verify.mockResolvedValue(establishmentId1.value)
      const socket = buildSocket('good-key')
      await gateway.handleConnection(socket as any)

      await gateway.handleReportDevices(
        {
          devices: [
            { connectionType: 'network', address: '192.168.1.50' },
            { connectionType: 'usb', usbIdentifier: 'USB001' }
          ]
        },
        socket as any
      )

      expect(recordDiscoveredDevice.run).toHaveBeenCalledTimes(2)
      expect(recordDiscoveredDevice.run).toHaveBeenNthCalledWith(1, {
        establishmentId: establishmentId1.value,
        connectionType: 'network',
        address: '192.168.1.50',
        usbIdentifier: undefined
      })
      expect(recordDiscoveredDevice.run).toHaveBeenNthCalledWith(2, {
        establishmentId: establishmentId1.value,
        connectionType: 'usb',
        address: undefined,
        usbIdentifier: 'USB001'
      })
    })

    it('does nothing when the socket has no resolved EstablishmentId (not authenticated)', async () => {
      const socket = buildSocket(undefined)

      await gateway.handleReportDevices(
        { devices: [{ connectionType: 'network', address: '192.168.1.50' }] },
        socket as any
      )

      expect(recordDiscoveredDevice.run).not.toHaveBeenCalled()
    })
  })
})
