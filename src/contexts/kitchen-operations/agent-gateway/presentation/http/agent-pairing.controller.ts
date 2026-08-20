import { Body, ConflictException, Controller, Get, NotFoundException, Post } from '@nestjs/common'

import { RedeemPairingCode } from '@contexts/kitchen-operations/pairing-code/application/redeem/redeem-pairing-code'
import { PairingCodeNotRedeemable } from '@contexts/kitchen-operations/pairing-code/domain/exceptions/pairing-code-not-redeemable.exception'
import { EstablishmentRepository } from '@contexts/establishment/establishment/domain/repositories/establishment.repository'
import { GetAgentPairingStatus } from '@contexts/kitchen-operations/agent-gateway/application/get-status/get-agent-pairing-status'
import { RedeemPairingCodeRequest } from './dto/redeem-pairing-code.request'
import { AgentPairingStatusResponse } from './dto/agent-pairing-status.response'

export interface RedeemPairingCodeResponse {
  paired: true
}

// Cheap defense-in-depth per the design's "code brute-force" note: redemption
// is already behind an authenticated admin session, so entropy alone is
// adequate — this throttle only guards against automated retry storms.
const MAX_CONSECUTIVE_INVALID_ATTEMPTS = 5

// Under the same global JWT guard as every other admin endpoint (e.g.
// station.controller.ts) — no new guard. The response NEVER contains the
// plaintext secret; delivery is now poll-retrievable via
// AgentPairingPublicController, not pushed over a socket.
@Controller('agent-pairing')
export class AgentPairingController {
  private readonly invalidAttemptsByEstablishment = new Map<string, number>()

  constructor(
    private readonly redeemPairingCode: RedeemPairingCode,
    private readonly establishmentRepository: EstablishmentRepository,
    private readonly getAgentPairingStatus: GetAgentPairingStatus
  ) {}

  @Get('status')
  async status(): Promise<AgentPairingStatusResponse> {
    const establishment = await this.establishmentRepository.findSingleton()
    return this.getAgentPairingStatus.run(establishment.id)
  }

  @Post('redeem')
  async redeem(@Body() dto: RedeemPairingCodeRequest): Promise<RedeemPairingCodeResponse> {
    const establishment = await this.establishmentRepository.findSingleton()
    const establishmentId = establishment.id.value

    if (this.isThrottled(establishmentId)) {
      throw new ConflictException('Too many invalid pairing code attempts. Try again later.')
    }

    try {
      await this.redeemPairingCode.run(dto.code, establishmentId)
      this.invalidAttemptsByEstablishment.delete(establishmentId)

      return { paired: true }
    } catch (error) {
      if (error instanceof PairingCodeNotRedeemable) {
        this.recordInvalidAttempt(establishmentId)
        if (error.reason === 'unknown') {
          throw new NotFoundException(error.message)
        }
        throw new ConflictException(error.message)
      }
      throw error
    }
  }

  private isThrottled(establishmentId: string): boolean {
    const attempts = this.invalidAttemptsByEstablishment.get(establishmentId) ?? 0
    return attempts >= MAX_CONSECUTIVE_INVALID_ATTEMPTS
  }

  private recordInvalidAttempt(establishmentId: string): void {
    const attempts = this.invalidAttemptsByEstablishment.get(establishmentId) ?? 0
    this.invalidAttemptsByEstablishment.set(establishmentId, attempts + 1)
  }
}
