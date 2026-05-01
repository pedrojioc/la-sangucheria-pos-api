import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

@Entity('loyalty_accounts')
export class LoyaltyAccountEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string

  @Column({ name: 'customer_id', type: 'uuid', unique: true })
  customerId: string

  @Column({ type: 'integer', default: 0 })
  points: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
