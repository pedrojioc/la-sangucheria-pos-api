import { PairingCodeRepository } from '../../domain/repositories/pairing-code.repository'
import { PairingCode } from '../../domain/pairing-code'
import { PairingCodeId } from '../../domain/pairing-code-id'

export interface IssuePairingCodeResult {
  code: string
  expiresAt: Date
}

export class IssuePairingCode {
  constructor(private readonly repository: PairingCodeRepository) {}

  async run(): Promise<IssuePairingCodeResult> {
    const now = new Date()
    const pairingCode = PairingCode.issue(PairingCodeId.random().value, now)
    await this.repository.save(pairingCode)

    return { code: pairingCode.code, expiresAt: pairingCode.expiresAt }
  }
}
