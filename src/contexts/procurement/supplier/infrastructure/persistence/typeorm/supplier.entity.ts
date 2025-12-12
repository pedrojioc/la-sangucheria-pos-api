import { Entity, Column, PrimaryColumn } from 'typeorm'

@Entity('suppliers')
export class SupplierEntity {
  @PrimaryColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 200 })
  name: string

  @Column({ name: 'contact_name', type: 'varchar', length: 100, nullable: true })
  contactName: string | null

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string | null

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null

  @Column({ name: 'whatsapp_number', type: 'varchar', length: 20, nullable: true })
  whatsappNumber: string | null

  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string | null

  @Column({ name: 'tax_id', type: 'varchar', length: 50, nullable: true })
  taxId: string | null

  @Column({ name: 'payment_terms', type: 'varchar', length: 200, nullable: true })
  paymentTerms: string | null

  @Column({ type: 'text', nullable: true })
  notes: string | null

  @Column({ type: 'integer', nullable: true })
  rating: number | null

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean
}
