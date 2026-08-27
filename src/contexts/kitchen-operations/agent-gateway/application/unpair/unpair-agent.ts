import { Logger } from '@nestjs/common'
import { RevokeAgentCredential } from '@contexts/kitchen-operations/agent-credential/application/revoke/revoke-agent-credential'
import { NoActiveAgentCredential } from '@contexts/kitchen-operations/agent-credential/domain/exceptions/no-active-agent-credential.exception'
import { AgentConnectionRegistry } from '@contexts/kitchen-operations/agent-gateway/domain/agent-connection-registry'
import { EstablishmentId } from '@contexts/establishment/establishment/domain/establishment-id'

export class UnpairAgent {
  private readonly logger = new Logger(UnpairAgent.name)

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
    const connection = this.registry.current(establishmentId)
    if (!connection) {
      this.logger.warn(
        `No live connection registered for establishment ${establishmentId.value}; skipping agent-unpaired emit`
      )
      return
    }

    try {
      connection.emit('agent-unpaired', {})
      this.logger.log(`Emitted agent-unpaired to establishment ${establishmentId.value}`)
    } catch (error) {
      // A stale socket must not fail a completed revoke.
      this.logger.warn(
        `Failed to emit agent-unpaired for establishment ${establishmentId.value}: ${error}`
      )
    }
  }
}
