import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { MoreThan, Repository } from 'typeorm'

import {
  AgentCredential,
  AgentCredentialStatus
} from '@contexts/kitchen-operations/agent-credential/domain/agent-credential'
import { AgentCredentialId } from '@contexts/kitchen-operations/agent-credential/domain/agent-credential-id'
import { AgentCredentialRepository } from '@contexts/kitchen-operations/agent-credential/domain/repositories/agent-credential.repository'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { AgentCredentialEntity } from './agent-credential.entity'

@Injectable()
export class TypeOrmAgentCredentialRepository
  extends TransactionalRepository<AgentCredentialEntity>
  implements AgentCredentialRepository
{
  constructor(
    @InjectRepository(AgentCredentialEntity)
    repository: Repository<AgentCredentialEntity>,
    uow: UnitOfWorkContextHolder
  ) {
    super(repository, uow)
  }

  async save(credential: AgentCredential): Promise<void> {
    const p = credential.toPrimitives()
    await this.repo.save({
      id: p.id,
      establishmentId: p.establishmentId,
      secretHash: p.secretHash,
      status: p.status,
      gracePeriodEndsAt: p.gracePeriodEndsAt,
      activeExpiresAt: p.activeExpiresAt
    })
  }

  async search(id: AgentCredentialId): Promise<AgentCredential | null> {
    const entity = await this.repo.findOne({ where: { id: id.value } })
    if (!entity) return null
    return this.toDomain(entity)
  }

  async findActiveByEstablishment(establishmentId: string): Promise<AgentCredential | null> {
    const entity = await this.repo.findOne({
      where: { establishmentId, status: 'active' }
    })
    if (!entity) return null
    return this.toDomain(entity)
  }

  async findCandidatesByEstablishment(establishmentId: string): Promise<AgentCredential[]> {
    const entities = await this.repo.find({
      where: [
        { establishmentId, status: 'active' },
        { establishmentId, status: 'superseded' }
      ]
    })
    return entities.map(e => this.toDomain(e))
  }

  async findAllAuthenticatableCandidates(now: Date): Promise<AgentCredential[]> {
    const entities = await this.repo.find({
      where: [{ status: 'active' }, { status: 'superseded', gracePeriodEndsAt: MoreThan(now) }]
    })
    return entities.map(e => this.toDomain(e))
  }

  private toDomain(entity: AgentCredentialEntity): AgentCredential {
    return AgentCredential.fromPrimitives({
      id: entity.id,
      establishmentId: entity.establishmentId,
      secretHash: entity.secretHash,
      status: entity.status as AgentCredentialStatus,
      gracePeriodEndsAt: entity.gracePeriodEndsAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      activeExpiresAt: entity.activeExpiresAt
    })
  }
}
