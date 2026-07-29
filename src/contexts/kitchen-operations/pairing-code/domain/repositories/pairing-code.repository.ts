import { PairingCode } from '../pairing-code'

export abstract class PairingCodeRepository {
  abstract save(pairingCode: PairingCode): Promise<void>
  abstract findByCode(code: string): Promise<PairingCode | null>
}
