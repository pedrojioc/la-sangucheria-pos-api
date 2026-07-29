import { WebSocketKitchenAgentNotifierAdapter } from '@contexts/kitchen-operations/agent-gateway/infrastructure/adapters/websocket-kitchen-agent-notifier.adapter'
import { AgentConnectionRegistry } from '@contexts/kitchen-operations/agent-gateway/domain/agent-connection-registry'
import { EstablishmentRepository } from '@contexts/establishment/establishment/domain/repositories/establishment.repository'
import { EstablishmentMother } from '@test/contexts/establishment/establishment/__mothers__/establishment.mother'
import { KitchenPrintTicketMother } from '@test/contexts/kitchen-operations/kitchen-printer/__mothers__/kitchen-print-ticket.mother'

// The KitchenAgentNotifierPort contract itself stays guardrail-frozen:
// notify(ticket, jobId) has no AgentCredential/EstablishmentId parameter.
// This adapter resolves the singleton Establishment internally (same
// pattern as AgentPairingController) purely to key the registry lookup —
// the port signature and dispatcher call site are untouched.
describe('WebSocketKitchenAgentNotifierAdapter', () => {
  const establishment = EstablishmentMother.create()

  const buildEstablishmentRepository = (): jest.Mocked<EstablishmentRepository> =>
    ({
      findSingleton: jest.fn().mockResolvedValue(establishment),
      save: jest.fn()
    }) as unknown as jest.Mocked<EstablishmentRepository>

  it('returns delivered:false without emitting when no agent is connected', async () => {
    const registry = new AgentConnectionRegistry()
    const establishmentRepository = buildEstablishmentRepository()
    const adapter = new WebSocketKitchenAgentNotifierAdapter(registry, establishmentRepository)
    const ticket = KitchenPrintTicketMother.create()

    const result = await adapter.notify(ticket, 'job-1')

    expect(result).toEqual({ delivered: false })
  })

  it('emits print-ticket with { ticket, jobId } and returns delivered:true when an agent is connected', async () => {
    const registry = new AgentConnectionRegistry()
    const emit = jest.fn()
    registry.register(establishment.id, { emit })
    const establishmentRepository = buildEstablishmentRepository()
    const adapter = new WebSocketKitchenAgentNotifierAdapter(registry, establishmentRepository)
    const ticket = KitchenPrintTicketMother.create()

    const result = await adapter.notify(ticket, 'job-1')

    expect(emit).toHaveBeenCalledWith('print-ticket', { ticket, jobId: 'job-1' })
    expect(result).toEqual({ delivered: true })
  })

  it('does not block on any response from the socket emit', async () => {
    const registry = new AgentConnectionRegistry()
    const emit = jest.fn()
    registry.register(establishment.id, { emit })
    const establishmentRepository = buildEstablishmentRepository()
    const adapter = new WebSocketKitchenAgentNotifierAdapter(registry, establishmentRepository)
    const ticket = KitchenPrintTicketMother.create()

    const start = Date.now()
    await adapter.notify(ticket, 'job-1')
    const elapsed = Date.now() - start

    expect(elapsed).toBeLessThan(50)
  })
})
