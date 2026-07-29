import { NotFoundException, ConflictException } from '@nestjs/common'

import { AgentPairingController } from '@contexts/kitchen-operations/agent-gateway/presentation/http/agent-pairing.controller'
import { RedeemPairingCode } from '@contexts/kitchen-operations/pairing-code/application/redeem/redeem-pairing-code'
import { PairingCodeNotRedeemable } from '@contexts/kitchen-operations/pairing-code/domain/exceptions/pairing-code-not-redeemable.exception'
import { PairingSocketRegistry } from '@contexts/kitchen-operations/agent-gateway/infrastructure/websocket/pairing-socket-registry'
import { EstablishmentRepository } from '@contexts/establishment/establishment/domain/repositories/establishment.repository'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('AgentPairingController', () => {
  let redeemPairingCode: jest.Mocked<RedeemPairingCode>
  let registry: PairingSocketRegistry
  let establishmentRepository: jest.Mocked<EstablishmentRepository>
  let controller: AgentPairingController

  const establishmentId = UuidMother.random()

  beforeEach(() => {
    redeemPairingCode = { run: jest.fn() } as unknown as jest.Mocked<RedeemPairingCode>
    registry = new PairingSocketRegistry()
    establishmentRepository = {
      findSingleton: jest.fn().mockResolvedValue({ id: { value: establishmentId } }),
      save: jest.fn()
    } as unknown as jest.Mocked<EstablishmentRepository>
    controller = new AgentPairingController(redeemPairingCode, registry, establishmentRepository)
  })

  it('returns { paired: true } with no secret field when redemption succeeds', async () => {
    redeemPairingCode.run.mockResolvedValue({ code: 'ABC234', apiKey: 'lspa_secret' })

    const result = await controller.redeem({ code: 'ABC234' })

    expect(result).toEqual({ paired: true })
    expect(JSON.stringify(result)).not.toContain('lspa_secret')
    expect(redeemPairingCode.run).toHaveBeenCalledWith('ABC234', establishmentId)
  })

  it('pushes the credential over the registered pairing socket on success', async () => {
    const socket = { emit: jest.fn() }
    registry.setSocket('ABC234', socket)
    redeemPairingCode.run.mockResolvedValue({ code: 'ABC234', apiKey: 'lspa_secret' })

    await controller.redeem({ code: 'ABC234' })

    expect(socket.emit).toHaveBeenCalledWith('agent-credential', { apiKey: 'lspa_secret' })
  })

  it('rejects an unknown code with 404', async () => {
    redeemPairingCode.run.mockRejectedValue(new PairingCodeNotRedeemable('unknown', 'ZZZ999'))

    await expect(controller.redeem({ code: 'ZZZ999' })).rejects.toThrow(NotFoundException)
  })

  it('rejects an expired or consumed code with 409', async () => {
    redeemPairingCode.run.mockRejectedValue(new PairingCodeNotRedeemable('expired', 'ABC234'))

    await expect(controller.redeem({ code: 'ABC234' })).rejects.toThrow(ConflictException)
  })

  describe('invalid-attempt throttling', () => {
    it('rejects further attempts after N consecutive invalid codes for the same establishment', async () => {
      redeemPairingCode.run.mockRejectedValue(new PairingCodeNotRedeemable('unknown', 'ZZZ999'))

      // 5 consecutive invalid attempts (N=5) exhaust the throttle.
      for (let i = 0; i < 5; i++) {
        await expect(controller.redeem({ code: 'ZZZ999' })).rejects.toThrow(NotFoundException)
      }

      // The 6th attempt is throttled before even calling the use case again.
      const callsBeforeThrottle = redeemPairingCode.run.mock.calls.length
      await expect(controller.redeem({ code: 'ZZZ999' })).rejects.toThrow(ConflictException)
      expect(redeemPairingCode.run.mock.calls.length).toBe(callsBeforeThrottle)
    })

    it('resets the invalid-attempt count after a successful redemption', async () => {
      redeemPairingCode.run.mockRejectedValueOnce(new PairingCodeNotRedeemable('unknown', 'ZZZ999'))
      redeemPairingCode.run.mockRejectedValueOnce(new PairingCodeNotRedeemable('unknown', 'ZZZ999'))
      redeemPairingCode.run.mockResolvedValueOnce({ code: 'ABC234', apiKey: 'lspa_secret' })

      await expect(controller.redeem({ code: 'ZZZ999' })).rejects.toThrow(NotFoundException)
      await expect(controller.redeem({ code: 'ZZZ999' })).rejects.toThrow(NotFoundException)
      await controller.redeem({ code: 'ABC234' })

      redeemPairingCode.run.mockRejectedValue(new PairingCodeNotRedeemable('unknown', 'ZZZ999'))
      // Should not be immediately throttled since the counter reset on success.
      await expect(controller.redeem({ code: 'ZZZ999' })).rejects.toThrow(NotFoundException)
    })
  })
})
