import { AgentCredentialRepository } from '../../domain/repositories/agent-credential.repository'
import { NoActiveAgentCredential } from '../../domain/exceptions/no-active-agent-credential.exception'

export class RevokeAgentCredential {
  constructor(private readonly repository: AgentCredentialRepository) {}

  async run(establishmentId: string): Promise<void> {
    const active = await this.repository.findActiveByEstablishment(establishmentId)
    if (!active) {
      throw new NoActiveAgentCredential(establishmentId)
    }

    active.revoke()
    await this.repository.save(active)
  }
}
