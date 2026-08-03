import {
  Body,
  ConflictException,
  Controller,
  NotFoundException,
  Post,
  UseGuards
} from '@nestjs/common'

import { IssuePairingCode } from '@contexts/kitchen-operations/pairing-code/application/issue/issue-pairing-code'
import { PollPairingCode } from '@contexts/kitchen-operations/pairing-code/application/poll/poll-pairing-code'
import { PairingCodeNotRedeemable } from '@contexts/kitchen-operations/pairing-code/domain/exceptions/pairing-code-not-redeemable.exception'
import { PairingCodePendingSecretUnavailable } from '@contexts/kitchen-operations/pairing-code/domain/exceptions/pairing-code-pending-secret-unavailable.exception'
import { PairingIpThrottleGuard } from '../../infrastructure/guards/pairing-ip-throttle.guard'
import { StartPairingResponse } from './dto/start-pairing.response'
import { PollPairingRequest } from './dto/poll-pairing.request'
import { PollPairingResponse } from './dto/poll-pairing.response'

// UNAUTHENTICATED by design — Smart-TV-style pairing flow: an agent has no
// credential yet when it calls these two endpoints. Deliberately isolated
// from every other /agent capability: this controller exposes ONLY
// start/poll, nothing else (see spec's "pairing namespace isolation"
// requirement).
@UseGuards(PairingIpThrottleGuard)
@Controller('agent/pairing')
export class AgentPairingPublicController {
  constructor(
    private readonly issuePairingCode: IssuePairingCode,
    private readonly pollPairingCode: PollPairingCode
  ) {}

  @Post('start')
  async start(): Promise<StartPairingResponse> {
    const { code, pollToken, expiresAt } = await this.issuePairingCode.run()
    return { code, pollToken, expiresAt: expiresAt.toISOString() }
  }

  @Post('poll')
  async poll(@Body() dto: PollPairingRequest): Promise<PollPairingResponse> {
    try {
      return await this.pollPairingCode.run(dto.code, dto.pollToken)
    } catch (error) {
      if (error instanceof PairingCodeNotRedeemable) {
        if (error.reason === 'unknown') {
          throw new NotFoundException(error.message)
        }
        throw new ConflictException(error.message)
      }
      if (error instanceof PairingCodePendingSecretUnavailable) {
        // Defense-in-depth: the repository's compare-and-wipe WHERE clause
        // already guards presence + TTL, so this domain exception should be
        // unreachable via the normal poll path (verify-report obs #319
        // CRITICAL). Mapped to the same generic "pending" response the
        // domain exception's own contract requires, in case any future call
        // path reaches retrieveAndWipeSecret() without that same guard.
        return { status: 'pending' }
      }
      throw error
    }
  }
}
