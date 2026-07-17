import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { InvoiceSnapshot } from '@contexts/billing/invoice/domain/invoice-snapshot'

@Entity('invoices')
export class InvoiceEntity {
  @PrimaryColumn({ type: 'varchar' })
  id: string

  @Column({ name: 'document_type', type: 'varchar', length: 50 })
  documentType: string

  @Column({ name: 'snapshot', type: 'jsonb' })
  snapshot: InvoiceSnapshot

  @Column({ name: 'status', type: 'varchar', length: 20 })
  status: string

  @Column({ name: 'cufe_cude', type: 'varchar', length: 200, nullable: true })
  cufeCude: string | null

  @Column({ name: 'factus_document_number', type: 'varchar', length: 100, nullable: true })
  factusDocumentNumber: string | null

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason: string | null

  @Column({ name: 'attempts', type: 'integer', default: 0 })
  attempts: number

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date
}
