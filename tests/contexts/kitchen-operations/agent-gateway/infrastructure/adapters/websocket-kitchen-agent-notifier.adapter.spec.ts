import { WebSocketKitchenAgentNotifierAdapter } from '@contexts/kitchen-operations/agent-gateway/infrastructure/adapters/websocket-kitchen-agent-notifier.adapter'
import { AgentConnectionRegistry } from '@contexts/kitchen-operations/agent-gateway/domain/agent-connection-registry'
import { KitchenPrintTicketMother } from '@test/contexts/kitchen-operations/kitchen-printer/__mothers__/kitchen-print-ticket.mother'

describe('WebSocketKitchenAgentNotifierAdapter', () => {
  it('returns delivered:false without emitting when no agent is connected', async () => {
    const registry = new AgentConnectionRegistry()
    const adapter = new WebSocketKitchenAgentNotifierAdapter(registry)
    const ticket = KitchenPrintTicketMother.create()

    const result = await adapter.notify(ticket, 'job-1')

    expect(result).toEqual({ delivered: false })
  })

  it('emits print-ticket with { ticket, jobId } and returns delivered:true when an agent is connected', async () => {
    const registry = new AgentConnectionRegistry()
    const emit = jest.fn()
    registry.register({ emit })
    const adapter = new WebSocketKitchenAgentNotifierAdapter(registry)
    const ticket = KitchenPrintTicketMother.create()

    const result = await adapter.notify(ticket, 'job-1')

    expect(emit).toHaveBeenCalledWith('print-ticket', { ticket, jobId: 'job-1' })
    expect(result).toEqual({ delivered: true })
  })

  it('does not block on any response from the socket emit', async () => {
    const registry = new AgentConnectionRegistry()
    const emit = jest.fn()
    registry.register({ emit })
    const adapter = new WebSocketKitchenAgentNotifierAdapter(registry)
    const ticket = KitchenPrintTicketMother.create()

    const start = Date.now()
    await adapter.notify(ticket, 'job-1')
    const elapsed = Date.now() - start

    expect(elapsed).toBeLessThan(50)
  })
})
