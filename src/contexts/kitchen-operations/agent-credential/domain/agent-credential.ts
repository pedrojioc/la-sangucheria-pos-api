import { randomBytes } from 'crypto'
import { AggregateRoot } from '@shared/domain/aggregate-root'
import { AgentCredentialId } from './agent-credential-id'
import { AgentCredentialSecretHash } from './agent-credential-secret-hash'
import { AgentCredentialSecretHasher } from './services/agent-credential-secret-hasher'

export const AGENT_CREDENTIAL_GRACE_PERIOD_MS = 48 * 60 * 60 * 1000 // 48h

// See design Decision (c): 30 days is >>> the 48h grace period (15x),
// giving a comfortable rotation window even for stations that only send
// traffic intermittently.
export const AGENT_CREDENTIAL_ACTIVE_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
export const ROTATION_LEAD_MS = 3 * 24 * 60 * 60 * 1000 // 3 days

export type AgentCredentialStatus = 'active' | 'superseded' | 'revoked'

export interface AgentCredentialPrimitives {
  id: string
  establishmentId: string
  secretHash: string
  status: AgentCredentialStatus
  gracePeriodEndsAt: Date | null
  createdAt: Date
  updatedAt: Date
  activeExpiresAt: Date | null
}

export interface IssueAgentCredentialParams {
  id: string
  establishmentId: string
}

export interface IssuedAgentCredential {
  credential: AgentCredential
  plainSecret: string
}

export class AgentCredential extends AggregateRoot {
  private constructor(
    public readonly id: AgentCredentialId,
    private readonly establishmentId: string,
    private secretHash: AgentCredentialSecretHash,
    private status: AgentCredentialStatus,
    private gracePeriodEndsAt: Date | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private activeExpiresAt: Date | null
  ) {
    super()
  }

  static async issue(
    params: IssueAgentCredentialParams,
    hasher: AgentCredentialSecretHasher,
    now: Date = new Date()
  ): Promise<IssuedAgentCredential> {
    const plainSecret = AgentCredential.generateSecret()
    const secretHash = await hasher.hash(plainSecret)

    const credential = new AgentCredential(
      new AgentCredentialId(params.id),
      params.establishmentId,
      new AgentCredentialSecretHash(secretHash),
      'active',
      null,
      now,
      now,
      new Date(now.getTime() + AGENT_CREDENTIAL_ACTIVE_TTL_MS)
    )

    return { credential, plainSecret }
  }

  static fromPrimitives(primitives: AgentCredentialPrimitives): AgentCredential {
    return new AgentCredential(
      new AgentCredentialId(primitives.id),
      primitives.establishmentId,
      new AgentCredentialSecretHash(primitives.secretHash),
      primitives.status,
      primitives.gracePeriodEndsAt,
      primitives.createdAt,
      primitives.updatedAt,
      primitives.activeExpiresAt
    )
  }

  getEstablishmentId(): string {
    return this.establishmentId
  }

  getStatus(): AgentCredentialStatus {
    return this.status
  }

  getSecretHash(): string {
    return this.secretHash.value
  }

  // active -> revoked, immediate, no grace period
  revoke(now: Date = new Date()): void {
    this.status = 'revoked'
    this.gracePeriodEndsAt = null
    this.updatedAt = now
  }

  // active -> superseded, with a grace window during which it still authenticates
  supersede(
    now: Date = new Date(),
    gracePeriodMs: number = AGENT_CREDENTIAL_GRACE_PERIOD_MS
  ): void {
    this.status = 'superseded'
    this.gracePeriodEndsAt = new Date(now.getTime() + gracePeriodMs)
    this.updatedAt = now
  }

  isAuthenticatable(now: Date = new Date()): boolean {
    if (this.status === 'active') {
      // Defensive bound: rotation fires ROTATION_LEAD_MS before expiry, so
      // this should not normally trigger — but if rotation is somehow
      // missed, a hard-expired active credential still stops authenticating
      // rather than remaining valid forever.
      if (this.activeExpiresAt !== null && now >= this.activeExpiresAt) return false
      return true
    }
    if (this.status === 'superseded' && this.gracePeriodEndsAt) {
      return now < this.gracePeriodEndsAt
    }
    return false
  }

  // TTL math stays entirely in the aggregate — no caller duplicates it.
  needsRotation(now: Date = new Date(), leadTimeMs: number = ROTATION_LEAD_MS): boolean {
    if (this.status !== 'active' || this.activeExpiresAt === null) return false
    return now >= new Date(this.activeExpiresAt.getTime() - leadTimeMs)
  }

  getActiveExpiresAt(): Date | null {
    return this.activeExpiresAt
  }

  async verify(plainSecret: string, hasher: AgentCredentialSecretHasher): Promise<boolean> {
    return hasher.verify(plainSecret, this.secretHash.value)
  }

  private static generateSecret(): string {
    return `lspa_${randomBytes(32).toString('hex')}`
  }

  toPrimitives(): AgentCredentialPrimitives {
    return {
      id: this.id.value,
      establishmentId: this.establishmentId,
      secretHash: this.secretHash.value,
      status: this.status,
      gracePeriodEndsAt: this.gracePeriodEndsAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      activeExpiresAt: this.activeExpiresAt
    }
  }
}
