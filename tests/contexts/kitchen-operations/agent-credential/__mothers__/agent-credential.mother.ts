import {
  AgentCredential,
  AgentCredentialPrimitives,
  AgentCredentialStatus,
  AGENT_CREDENTIAL_ACTIVE_TTL_MS
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
      updatedAt: params.updatedAt ?? now,
      activeExpiresAt:
        params.activeExpiresAt !== undefined
          ? params.activeExpiresAt
          : new Date(now.getTime() + AGENT_CREDENTIAL_ACTIVE_TTL_MS)
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

  static nearingRotation(establishmentId?: string, now: Date = new Date()): AgentCredential {
    return this.create({
      establishmentId,
      status: 'active',
      activeExpiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) // 1 day left, < 3-day lead
    })
  }

  static farFromRotation(establishmentId?: string, now: Date = new Date()): AgentCredential {
    return this.create({
      establishmentId,
      status: 'active',
      activeExpiresAt: new Date(now.getTime() + AGENT_CREDENTIAL_ACTIVE_TTL_MS)
    })
  }
}
