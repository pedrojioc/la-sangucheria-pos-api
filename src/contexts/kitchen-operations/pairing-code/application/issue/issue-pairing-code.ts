import { randomBytes, createHash } from 'crypto'
import { PairingCodeRepository } from '../../domain/repositories/pairing-code.repository'
import { PairingCode } from '../../domain/pairing-code'
import { PairingCodeId } from '../../domain/pairing-code-id'

export interface IssuePairingCodeResult {
  code: string
  pollToken: string
  expiresAt: Date
}

export class IssuePairingCode {
  constructor(private readonly repository: PairingCodeRepository) {}

  async run(): Promise<IssuePairingCodeResult> {
    const now = new Date()

    // Plaintext pollToken lives only in this stack frame and the response to
    // the caller — only its sha256 hash is ever persisted. No key
    // derivation, no public-key material (see design Decision (a)).
    const pollToken = randomBytes(32).toString('hex')
    const pollTokenHash = createHash('sha256').update(pollToken).digest('hex')

    const pairingCode = PairingCode.issue(PairingCodeId.random().value, pollTokenHash, now)
    await this.repository.save(pairingCode)

    return { code: pairingCode.code, pollToken, expiresAt: pairingCode.expiresAt }
  }
}
