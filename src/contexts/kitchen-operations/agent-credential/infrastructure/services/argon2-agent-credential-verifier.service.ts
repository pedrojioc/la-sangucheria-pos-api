import { Injectable } from '@nestjs/common'
import { AgentCredentialVerifierPort } from '../../domain/services/agent-credential-verifier.port'
import { AgentCredentialRepository } from '../../domain/repositories/agent-credential.repository'
import { AgentCredentialSecretHasher } from '../../domain/services/agent-credential-secret-hasher'

@Injectable()
export class Argon2AgentCredentialVerifier implements AgentCredentialVerifierPort {
  constructor(
    private readonly repository: AgentCredentialRepository,
    private readonly hasher: AgentCredentialSecretHasher
  ) {}

  async verify(plainSecret: string): Promise<string | null> {
    const candidates = await this.repository.findAllAuthenticatableCandidates(new Date())

    for (const candidate of candidates) {
      const matches = await candidate.verify(plainSecret, this.hasher)
      if (matches) {
        return candidate.getEstablishmentId()
      }
    }

    return null
  }
}
