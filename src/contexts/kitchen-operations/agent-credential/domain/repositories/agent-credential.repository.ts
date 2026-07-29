import { AgentCredential } from '../agent-credential'
import { AgentCredentialId } from '../agent-credential-id'

export abstract class AgentCredentialRepository {
  abstract save(credential: AgentCredential): Promise<void>
  abstract search(id: AgentCredentialId): Promise<AgentCredential | null>
  abstract findActiveByEstablishment(establishmentId: string): Promise<AgentCredential | null>
  abstract findCandidatesByEstablishment(establishmentId: string): Promise<AgentCredential[]>
  // All currently-authenticatable credentials (active + in-grace superseded) across every
  // establishment — used by the verifier, which resolves the establishment FROM the key.
  abstract findAllAuthenticatableCandidates(now: Date): Promise<AgentCredential[]>
}
