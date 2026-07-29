import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AgentCredentialEntity } from '@contexts/kitchen-operations/agent-credential/infrastructure/persistence/typeorm/agent-credential.entity'
import { AgentCredentialRepository } from '@contexts/kitchen-operations/agent-credential/domain/repositories/agent-credential.repository'
import { TypeOrmAgentCredentialRepository } from '@contexts/kitchen-operations/agent-credential/infrastructure/persistence/typeorm/typeorm-agent-credential.repository'

import { AgentCredentialSecretHasher } from '@contexts/kitchen-operations/agent-credential/domain/services/agent-credential-secret-hasher'
import { Argon2AgentCredentialSecretHasher } from '@contexts/kitchen-operations/agent-credential/infrastructure/services/argon2-agent-credential-secret-hasher.service'
import { AgentCredentialVerifierPort } from '@contexts/kitchen-operations/agent-credential/domain/services/agent-credential-verifier.port'
import { Argon2AgentCredentialVerifier } from '@contexts/kitchen-operations/agent-credential/infrastructure/services/argon2-agent-credential-verifier.service'

import { IssueAgentCredential } from '@contexts/kitchen-operations/agent-credential/application/issue/issue-agent-credential'
import { RevokeAgentCredential } from '@contexts/kitchen-operations/agent-credential/application/revoke/revoke-agent-credential'

import { createProvider } from '@core/utils/create-provider'

@Module({
  imports: [TypeOrmModule.forFeature([AgentCredentialEntity])],
  providers: [
    { provide: AgentCredentialRepository, useClass: TypeOrmAgentCredentialRepository },
    { provide: AgentCredentialSecretHasher, useClass: Argon2AgentCredentialSecretHasher },
    { provide: AgentCredentialVerifierPort, useClass: Argon2AgentCredentialVerifier },
    createProvider(IssueAgentCredential, [AgentCredentialRepository, AgentCredentialSecretHasher]),
    createProvider(RevokeAgentCredential, [AgentCredentialRepository])
  ],
  exports: [
    AgentCredentialRepository,
    AgentCredentialVerifierPort,
    IssueAgentCredential,
    RevokeAgentCredential
  ]
})
export class AgentCredentialModule {}
