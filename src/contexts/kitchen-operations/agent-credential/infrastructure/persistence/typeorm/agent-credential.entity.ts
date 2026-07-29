import { Entity, PrimaryColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('agent_credentials')
@Index(['establishmentId', 'status'])
export class AgentCredentialEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string

  @Column({ name: 'establishment_id', type: 'uuid' })
  establishmentId: string

  @Column({ name: 'secret_hash', type: 'varchar', length: 255 })
  secretHash: string

  @Column({ type: 'varchar', length: 10, default: 'active' })
  status: string

  @Column({ name: 'grace_period_ends_at', type: 'timestamptz', nullable: true })
  gracePeriodEndsAt: Date | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
