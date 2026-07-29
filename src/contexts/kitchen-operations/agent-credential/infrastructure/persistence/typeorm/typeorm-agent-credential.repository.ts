import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { MoreThan, Repository } from 'typeorm'

import {
  AgentCredential,
  AgentCredentialStatus
} from '@contexts/kitchen-operations/agent-credential/domain/agent-credential'
import { AgentCredentialId } from '@contexts/kitchen-operations/agent-credential/domain/agent-credential-id'
import { AgentCredentialRepository } from '@contexts/kitchen-operations/agent-credential/domain/repositories/agent-credential.repository'
import { AgentCredentialEntity } from './agent-credential.entity'

@Injectable()
export class TypeOrmAgentCredentialRepository implements AgentCredentialRepository {
  constructor(
    @InjectRepository(AgentCredentialEntity)
    private readonly repository: Repository<AgentCredentialEntity>
  ) {}

  async save(credential: AgentCredential): Promise<void> {
    const p = credential.toPrimitives()
    await this.repository.save({
      id: p.id,
      establishmentId: p.establishmentId,
      secretHash: p.secretHash,
      status: p.status,
      gracePeriodEndsAt: p.gracePeriodEndsAt
    })
  }

  async search(id: AgentCredentialId): Promise<AgentCredential | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } })
    if (!entity) return null
    return this.toDomain(entity)
  }

  async findActiveByEstablishment(establishmentId: string): Promise<AgentCredential | null> {
    const entity = await this.repository.findOne({
      where: { establishmentId, status: 'active' }
    })
    if (!entity) return null
    return this.toDomain(entity)
  }

  async findCandidatesByEstablishment(establishmentId: string): Promise<AgentCredential[]> {
    const entities = await this.repository.find({
      where: [
        { establishmentId, status: 'active' },
        { establishmentId, status: 'superseded' }
      ]
    })
    return entities.map(e => this.toDomain(e))
  }

  async findAllAuthenticatableCandidates(now: Date): Promise<AgentCredential[]> {
    const entities = await this.repository.find({
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
      updatedAt: entity.updatedAt
    })
  }
}
