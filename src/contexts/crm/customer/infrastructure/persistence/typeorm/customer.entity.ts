import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { DocumentTypeValue } from '../../../domain/customer-document-type'
import { TaxRegimeValue } from '../../../domain/customer-tax-regime'
import { CustomerStatusValue } from '../../../domain/customer-status'

@Entity('customers')
@Index(['status'])
@Index(['phone'])
export class CustomerEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string

  @Column({ type: 'varchar', length: 200 })
  name: string

  @Column({ type: 'varchar', length: 30, unique: true })
  phone: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null

  @Column({ name: 'document_type', type: 'varchar', length: 20 })
  documentType: DocumentTypeValue

  @Column({ name: 'document_number', type: 'varchar', length: 50 })
  documentNumber: string

  @Column({ name: 'tax_regime', type: 'varchar', length: 20 })
  taxRegime: TaxRegimeValue

  @Column({ name: 'default_address_id', type: 'uuid', nullable: true })
  defaultAddressId: string | null

  @Column({ type: 'text', nullable: true })
  notes: string | null

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: CustomerStatusValue

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
