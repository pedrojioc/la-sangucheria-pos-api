import { AgentCredentialRepository } from '../../domain/repositories/agent-credential.repository'
import { AgentCredentialSecretHasher } from '../../domain/services/agent-credential-secret-hasher'
import { AgentCredential } from '../../domain/agent-credential'
import { AgentCredentialId } from '../../domain/agent-credential-id'

export interface IssueAgentCredentialResult {
  credential: AgentCredential
  plainSecret: string
}

export class IssueAgentCredential {
  constructor(
    private readonly repository: AgentCredentialRepository,
    private readonly hasher: AgentCredentialSecretHasher
  ) {}

  async run(establishmentId: string): Promise<IssueAgentCredentialResult> {
    const now = new Date()
    const existingActive = await this.repository.findActiveByEstablishment(establishmentId)

    if (existingActive) {
      existingActive.supersede(now)
      await this.repository.save(existingActive)
    }

    const { credential, plainSecret } = await AgentCredential.issue(
      { id: AgentCredentialId.random().value, establishmentId },
      this.hasher,
      now
    )
    await this.repository.save(credential)

    return { credential, plainSecret }
  }
}
