import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm'

@Entity('addresses')
@Index(['customerId'])
export class AddressEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string

  @Column({ type: 'varchar', length: 100 })
  label: string

  @Column({ type: 'varchar', length: 500 })
  street: string

  @Column({ type: 'varchar', length: 200, nullable: true })
  neighborhood: string | null

  @Column({ type: 'varchar', length: 200 })
  city: string

  @Column({ type: 'text', nullable: true })
  reference: string | null

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  lat: number | null

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  lng: number | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
