import { AgentConnectionRegistry } from '@contexts/kitchen-operations/agent-gateway/domain/agent-connection-registry'

describe('AgentConnectionRegistry', () => {
  it('returns undefined when no agent is registered', () => {
    const registry = new AgentConnectionRegistry()

    expect(registry.current()).toBeUndefined()
  })

  it('stores a connection on register and returns it via current()', () => {
    const registry = new AgentConnectionRegistry()
    const connection = { emit: jest.fn() }

    registry.register(connection)

    expect(registry.current()).toBe(connection)
  })

  it('replaces the previous connection when a second agent registers (v1 single-agent)', () => {
    const registry = new AgentConnectionRegistry()
    const first = { emit: jest.fn() }
    const second = { emit: jest.fn() }

    registry.register(first)
    registry.register(second)

    expect(registry.current()).toBe(second)
  })

  it('clears the current connection when unregister is called for the active connection', () => {
    const registry = new AgentConnectionRegistry()
    const connection = { emit: jest.fn() }
    registry.register(connection)

    registry.unregister(connection)

    expect(registry.current()).toBeUndefined()
  })

  it('does not clear the current connection when unregister is called for a stale connection', () => {
    const registry = new AgentConnectionRegistry()
    const first = { emit: jest.fn() }
    const second = { emit: jest.fn() }
    registry.register(first)
    registry.register(second)

    registry.unregister(first)

    expect(registry.current()).toBe(second)
  })
})
