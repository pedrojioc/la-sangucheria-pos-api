import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('billing_configs')
export class BillingConfigEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string

  @Column({ name: 'factus_api_token', type: 'text' })
  factusApiToken: string

  @Column({ name: 'factus_api_base_url', type: 'text' })
  factusApiBaseUrl: string

  @Column({ name: 'factus_test_mode', type: 'boolean', default: true })
  factusTestMode: boolean

  @Column({ name: 'resolucion_prefix', type: 'varchar', length: 20 })
  resolucionPrefix: string

  @Column({ name: 'resolucion_from', type: 'bigint' })
  resolucionFrom: number

  @Column({ name: 'resolucion_to', type: 'bigint' })
  resolucionTo: number

  @Column({ name: 'resolucion_valid_from', type: 'date' })
  resolucionValidFrom: Date

  @Column({ name: 'resolucion_valid_to', type: 'date' })
  resolucionValidTo: Date

  @Column({ name: 'singleton_guard', type: 'integer', default: 1 })
  singletonGuard: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
