import { NotFoundException, ConflictException } from '@nestjs/common'

import { AgentPairingPublicController } from '@contexts/kitchen-operations/agent-gateway/presentation/http/agent-pairing-public.controller'
import { IssuePairingCode } from '@contexts/kitchen-operations/pairing-code/application/issue/issue-pairing-code'
import { PollPairingCode } from '@contexts/kitchen-operations/pairing-code/application/poll/poll-pairing-code'
import { PairingCodeNotRedeemable } from '@contexts/kitchen-operations/pairing-code/domain/exceptions/pairing-code-not-redeemable.exception'
import { PairingCodePendingSecretUnavailable } from '@contexts/kitchen-operations/pairing-code/domain/exceptions/pairing-code-pending-secret-unavailable.exception'

describe('AgentPairingPublicController', () => {
  let issuePairingCode: jest.Mocked<IssuePairingCode>
  let pollPairingCode: jest.Mocked<PollPairingCode>
  let controller: AgentPairingPublicController

  beforeEach(() => {
    issuePairingCode = { run: jest.fn() } as unknown as jest.Mocked<IssuePairingCode>
    pollPairingCode = { run: jest.fn() } as unknown as jest.Mocked<PollPairingCode>
    controller = new AgentPairingPublicController(issuePairingCode, pollPairingCode)
  })

  describe('start', () => {
    it('returns code, pollToken, and expiresAt as an ISO string', async () => {
      const expiresAt = new Date('2026-01-01T00:10:00.000Z')
      issuePairingCode.run.mockResolvedValue({ code: 'ABC234', pollToken: 'poll-token', expiresAt })

      const result = await controller.start()

      expect(result).toEqual({
        code: 'ABC234',
        pollToken: 'poll-token',
        expiresAt: expiresAt.toISOString()
      })
    })
  })

  describe('poll', () => {
    it('returns pending', async () => {
      pollPairingCode.run.mockResolvedValue({ status: 'pending' })

      const result = await controller.poll({ code: 'ABC234', pollToken: 'poll-token' })

      expect(result).toEqual({ status: 'pending' })
    })

    it('returns ready with the apiKey', async () => {
      pollPairingCode.run.mockResolvedValue({ status: 'ready', apiKey: 'lspa_secret' })

      const result = await controller.poll({ code: 'ABC234', pollToken: 'poll-token' })

      expect(result).toEqual({ status: 'ready', apiKey: 'lspa_secret' })
    })

    it('returns delivered', async () => {
      pollPairingCode.run.mockResolvedValue({ status: 'delivered' })

      const result = await controller.poll({ code: 'ABC234', pollToken: 'poll-token' })

      expect(result).toEqual({ status: 'delivered' })
    })

    it('maps unknown-code to 404', async () => {
      pollPairingCode.run.mockRejectedValue(new PairingCodeNotRedeemable('unknown', 'ZZZ999'))

      await expect(controller.poll({ code: 'ZZZ999', pollToken: 'x' })).rejects.toThrow(
        NotFoundException
      )
    })

    it('maps expired-code to 409', async () => {
      pollPairingCode.run.mockRejectedValue(new PairingCodeNotRedeemable('expired', 'ABC234'))

      await expect(controller.poll({ code: 'ABC234', pollToken: 'x' })).rejects.toThrow(
        ConflictException
      )
    })

    it('maps PairingCodePendingSecretUnavailable to the generic pending response, never a 500', async () => {
      // Defense-in-depth: the repository's compare-and-wipe already guards
      // presence + TTL, so this exception is expected to be unreachable via
      // the normal poll path (verify-report obs #319 CRITICAL). This test
      // asserts the controller-level safety net in case any future call
      // path reaches retrieveAndWipeSecret() without that guard.
      pollPairingCode.run.mockRejectedValue(new PairingCodePendingSecretUnavailable())

      const result = await controller.poll({ code: 'ABC234', pollToken: 'x' })

      expect(result).toEqual({ status: 'pending' })
    })
  })
})
