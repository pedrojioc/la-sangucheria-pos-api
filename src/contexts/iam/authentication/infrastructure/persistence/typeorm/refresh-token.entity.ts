import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm'

@Entity('refresh_tokens')
export class RefreshTokenEntity {
  @PrimaryColumn('uuid')
  id: string

  @Index()
  @Column({ type: 'varchar', length: 255, unique: true })
  jti: string

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string

  @Column({ type: 'varchar', length: 255, name: 'token_hash' })
  tokenHash: string

  @Index()
  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date

  @Index()
  @Column({ type: 'boolean', name: 'is_revoked', default: false })
  isRevoked: boolean

  @Column({ type: 'timestamp', name: 'revoked_at', nullable: true })
  revokedAt: Date | null

  @Column({ type: 'varchar', length: 100, name: 'revoked_reason', nullable: true })
  revokedReason: string | null

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date

  @Column({ type: 'varchar', length: 45, name: 'ip_address', nullable: true })
  ipAddress: string | null

  @Column({ type: 'text', name: 'user_agent', nullable: true })
  userAgent: string | null

  @Column({ type: 'varchar', length: 255, name: 'replaced_by_jti', nullable: true })
  replacedByJti: string | null
}
