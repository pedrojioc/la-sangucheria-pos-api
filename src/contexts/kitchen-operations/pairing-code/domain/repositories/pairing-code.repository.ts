import { PairingCode } from '../pairing-code'

export abstract class PairingCodeRepository {
  abstract save(pairingCode: PairingCode): Promise<void>
  abstract findByCode(code: string): Promise<PairingCode | null>

  // Atomic compare-and-wipe for poll delivery: wipes `pending_secret` and
  // stamps `delivered_at` in a single conditional UPDATE guarded by
  // `WHERE pending_secret IS NOT NULL`, closing the TOCTOU gap between two
  // concurrent `poll` calls both reading a non-null secret before either
  // commits (design-gate review obs #315, Warning 1). Returns the
  // now-delivered PairingCode with the plaintext secret if THIS caller won
  // the race, or `null` if the row had no live pending secret (already
  // wiped by a concurrent poll, expired, or absent) — the caller (A7) must
  // treat `null` identically to "already delivered".
  abstract compareAndWipePendingSecret(id: string, now: Date): Promise<PairingCode | null>
}
