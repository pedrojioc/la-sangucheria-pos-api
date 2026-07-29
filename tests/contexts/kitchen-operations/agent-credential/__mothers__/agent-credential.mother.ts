import {
  AgentCredential,
  AgentCredentialPrimitives,
  AgentCredentialStatus
} from '@contexts/kitchen-operations/agent-credential/domain/agent-credential'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

export class AgentCredentialMother {
  static create(params: Partial<AgentCredentialPrimitives> = {}): AgentCredential {
    const now = new Date()
    const primitives: AgentCredentialPrimitives = {
      id: params.id ?? UuidMother.random(),
      establishmentId: params.establishmentId ?? UuidMother.random(),
      secretHash: params.secretHash ?? '$argon2id$v=19$m=131072,t=3,p=4$fakestubhashvalue',
      status: params.status ?? ('active' as AgentCredentialStatus),
      gracePeriodEndsAt: params.gracePeriodEndsAt !== undefined ? params.gracePeriodEndsAt : null,
      createdAt: params.createdAt ?? now,
      updatedAt: params.updatedAt ?? now
    }
    return AgentCredential.fromPrimitives(primitives)
  }

  static random(): AgentCredential {
    return this.create()
  }

  static active(establishmentId?: string): AgentCredential {
    return this.create({ establishmentId, status: 'active' })
  }

  static revoked(establishmentId?: string): AgentCredential {
    return this.create({ establishmentId, status: 'revoked' })
  }

  static supersededInGrace(establishmentId?: string, now: Date = new Date()): AgentCredential {
    return this.create({
      establishmentId,
      status: 'superseded',
      gracePeriodEndsAt: new Date(now.getTime() + 60 * 60 * 1000)
    })
  }

  static supersededExpired(establishmentId?: string, now: Date = new Date()): AgentCredential {
    return this.create({
      establishmentId,
      status: 'superseded',
      gracePeriodEndsAt: new Date(now.getTime() - 60 * 60 * 1000)
    })
  }
}
