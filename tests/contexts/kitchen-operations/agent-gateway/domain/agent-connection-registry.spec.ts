import { AgentConnectionRegistry } from '@contexts/kitchen-operations/agent-gateway/domain/agent-connection-registry'
import { EstablishmentId } from '@contexts/establishment/establishment/domain/establishment-id'

describe('AgentConnectionRegistry', () => {
  const establishmentId1 = EstablishmentId.random()
  const establishmentId2 = EstablishmentId.random()

  it('returns undefined when no agent is registered for the establishment', () => {
    const registry = new AgentConnectionRegistry()

    expect(registry.current(establishmentId1)).toBeUndefined()
  })

  it('stores a connection on register and returns it via current() for that establishment', () => {
    const registry = new AgentConnectionRegistry()
    const connection = { emit: jest.fn() }

    registry.register(establishmentId1, connection)

    expect(registry.current(establishmentId1)).toBe(connection)
  })

  it('replaces the previous connection when a second agent registers for the same establishment (v1 single-agent per establishment)', () => {
    const registry = new AgentConnectionRegistry()
    const first = { emit: jest.fn() }
    const second = { emit: jest.fn() }

    registry.register(establishmentId1, first)
    registry.register(establishmentId1, second)

    expect(registry.current(establishmentId1)).toBe(second)
  })

  it('clears the current connection when unregister is called for the active connection', () => {
    const registry = new AgentConnectionRegistry()
    const connection = { emit: jest.fn() }
    registry.register(establishmentId1, connection)

    registry.unregister(establishmentId1, connection)

    expect(registry.current(establishmentId1)).toBeUndefined()
  })

  it('does not clear the current connection when unregister is called for a stale connection', () => {
    const registry = new AgentConnectionRegistry()
    const first = { emit: jest.fn() }
    const second = { emit: jest.fn() }
    registry.register(establishmentId1, first)
    registry.register(establishmentId1, second)

    registry.unregister(establishmentId1, first)

    expect(registry.current(establishmentId1)).toBe(second)
  })

  it('does not let two establishments collide', () => {
    const registry = new AgentConnectionRegistry()
    const connection1 = { emit: jest.fn() }
    const connection2 = { emit: jest.fn() }

    registry.register(establishmentId1, connection1)
    registry.register(establishmentId2, connection2)

    expect(registry.current(establishmentId1)).toBe(connection1)
    expect(registry.current(establishmentId2)).toBe(connection2)
  })

  it('unregister only clears the matching establishment, others are unaffected', () => {
    const registry = new AgentConnectionRegistry()
    const connection1 = { emit: jest.fn() }
    const connection2 = { emit: jest.fn() }
    registry.register(establishmentId1, connection1)
    registry.register(establishmentId2, connection2)

    registry.unregister(establishmentId1, connection1)

    expect(registry.current(establishmentId1)).toBeUndefined()
    expect(registry.current(establishmentId2)).toBe(connection2)
  })
})
