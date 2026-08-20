import { RevokeAgentCredential } from '@contexts/kitchen-operations/agent-credential/application/revoke/revoke-agent-credential'
import { NoActiveAgentCredential } from '@contexts/kitchen-operations/agent-credential/domain/exceptions/no-active-agent-credential.exception'
import { AgentConnectionRegistry } from '@contexts/kitchen-operations/agent-gateway/domain/agent-connection-registry'
import { EstablishmentId } from '@contexts/establishment/establishment/domain/establishment-id'

export class UnpairAgent {
  constructor(
    private readonly revokeAgentCredential: RevokeAgentCredential,
    private readonly registry: AgentConnectionRegistry
  ) {}

  async run(establishmentId: EstablishmentId): Promise<void> {
    try {
      await this.revokeAgentCredential.run(establishmentId.value)
    } catch (error) {
      // Idempotent by design: "already unpaired" is the desired end state.
      if (!(error instanceof NoActiveAgentCredential)) throw error
    }

    // Best-effort courtesy notification. The credential is already revoked, so
    // safety never depends on the agent receiving or honouring this.
    try {
      this.registry.current(establishmentId)?.emit('agent-unpaired', {})
    } catch {
      // A stale socket must not fail a completed revoke.
    }
  }
}
