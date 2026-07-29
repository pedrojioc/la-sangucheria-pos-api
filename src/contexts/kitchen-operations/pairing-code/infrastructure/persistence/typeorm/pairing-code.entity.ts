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
}
