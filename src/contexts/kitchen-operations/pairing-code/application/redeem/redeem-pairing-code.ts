import { PairingCodeRepository } from '../../domain/repositories/pairing-code.repository'
import { PairingCodeNotRedeemable } from '../../domain/exceptions/pairing-code-not-redeemable.exception'
import { IssueAgentCredential } from '@contexts/kitchen-operations/agent-credential/application/issue/issue-agent-credential'

export interface RedeemPairingCodeResult {
  code: string
  apiKey: string
}

export class RedeemPairingCode {
  constructor(
    private readonly repository: PairingCodeRepository,
    private readonly issueAgentCredential: IssueAgentCredential
  ) {}

  async run(code: string, establishmentId: string): Promise<RedeemPairingCodeResult> {
    const now = new Date()
    const pairingCode = await this.repository.findByCode(code)

    if (!pairingCode) {
      throw new PairingCodeNotRedeemable('unknown', code)
    }
    if (pairingCode.getStatus() === 'consumed') {
      throw new PairingCodeNotRedeemable('consumed', code)
    }
    if (pairingCode.isExpired(now)) {
      throw new PairingCodeNotRedeemable('expired', code)
    }

    pairingCode.consume(now)
    const { credential, plainSecret } = await this.issueAgentCredential.run(establishmentId)
    pairingCode.attachCredential(credential.id.value, now)
    await this.repository.save(pairingCode)

    return { code: pairingCode.code, apiKey: plainSecret }
  }
}
