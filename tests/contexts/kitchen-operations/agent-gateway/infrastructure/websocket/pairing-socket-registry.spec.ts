import { PairingSocketRegistry } from '@contexts/kitchen-operations/agent-gateway/infrastructure/websocket/pairing-socket-registry'

describe('PairingSocketRegistry', () => {
  describe('socket map', () => {
    it('returns undefined when no socket is registered for a code', () => {
      const registry = new PairingSocketRegistry()

      expect(registry.getSocket('ABC123')).toBeUndefined()
    })

    it('stores and retrieves a socket by code', () => {
      const registry = new PairingSocketRegistry()
      const socket = { emit: jest.fn() }

      registry.setSocket('ABC123', socket)

      expect(registry.getSocket('ABC123')).toBe(socket)
    })

    it('deletes a socket by code', () => {
      const registry = new PairingSocketRegistry()
      const socket = { emit: jest.fn() }
      registry.setSocket('ABC123', socket)

      registry.deleteSocket('ABC123')

      expect(registry.getSocket('ABC123')).toBeUndefined()
    })
  })

  describe('pending delivery map', () => {
    it('returns undefined when no pending apiKey exists for a code', () => {
      const registry = new PairingSocketRegistry()

      expect(registry.getPendingDelivery('ABC123')).toBeUndefined()
    })

    it('stores and retrieves a pending apiKey by code', () => {
      const registry = new PairingSocketRegistry()

      registry.setPendingDelivery('ABC123', 'lspa_secret')

      expect(registry.getPendingDelivery('ABC123')).toBe('lspa_secret')
    })

    it('deletes a pending apiKey by code', () => {
      const registry = new PairingSocketRegistry()
      registry.setPendingDelivery('ABC123', 'lspa_secret')

      registry.deletePendingDelivery('ABC123')

      expect(registry.getPendingDelivery('ABC123')).toBeUndefined()
    })
  })
})
