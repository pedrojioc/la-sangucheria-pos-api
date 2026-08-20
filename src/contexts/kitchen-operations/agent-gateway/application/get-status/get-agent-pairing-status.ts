import { AgentCredentialRepository } from '@contexts/kitchen-operations/agent-credential/domain/repositories/agent-credential.repository'
import { AgentConnectionRegistry } from '@contexts/kitchen-operations/agent-gateway/domain/agent-connection-registry'
import { EstablishmentId } from '@contexts/establishment/establishment/domain/establishment-id'

export interface AgentPairingStatus {
  paired: boolean
  connected: boolean
}

export class GetAgentPairingStatus {
  constructor(
    private readonly credentialRepository: AgentCredentialRepository,
    private readonly registry: AgentConnectionRegistry
  ) {}

  async run(establishmentId: EstablishmentId): Promise<AgentPairingStatus> {
    const now = new Date()
    const candidates = await this.credentialRepository.findCandidatesByEstablishment(
      establishmentId.value
    )

    return {
      // Establishment-scoped candidates ONLY. Never findAllAuthenticatableCandidates
      // (cross-establishment, reserved for Argon2AgentCredentialVerifierService, which
      // resolves the establishment FROM the verified secret and legitimately needs to
      // scan globally). Using that method here would leak/evaluate other establishments'
      // credential state. Expiry/grace-window rules stay in the aggregate — do not
      // re-derive them here.
      paired: candidates.some(credential => credential.isAuthenticatable(now)),
      connected: this.registry.current(establishmentId) !== undefined
    }
  }
}
