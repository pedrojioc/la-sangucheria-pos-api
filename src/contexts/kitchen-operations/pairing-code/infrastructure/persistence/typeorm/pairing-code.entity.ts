import { Entity, PrimaryColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('pairing_codes')
export class PairingCodeEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 6 })
  code: string

  @Column({ type: 'varchar', length: 10, default: 'issued' })
  status: string

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date

  @Column({ name: 'credential_id', type: 'uuid', nullable: true })
  credentialId: string | null

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt: Date | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @Column({ name: 'poll_token_hash', type: 'varchar' })
  pollTokenHash: string

  // Plaintext apiKey, held transiently between redeem and poll (see design
  // obs #311 rev 6 — TTL + atomic wipe, no encryption). NOT sealed/encrypted.
  @Column({ name: 'pending_secret', type: 'text', nullable: true })
  pendingSecret: string | null

  @Column({ name: 'pending_secret_expires_at', type: 'timestamptz', nullable: true })
  pendingSecretExpiresAt: Date | null
}
