import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

import { TaxType } from '@shared/domain/value-objects/tax-type'
import { KitchenMode } from '../../../domain/kitchen-mode'

@Entity('establishments')
export class EstablishmentEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string

  // Identity
  @Column({ type: 'varchar', length: 200 })
  name: string

  @Column({ name: 'display_name', type: 'varchar', length: 200 })
  displayName: string

  @Column({ name: 'legal_name', type: 'varchar', length: 300 })
  legalName: string

  @Column({ name: 'tax_id', type: 'varchar', length: 50 })
  taxId: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null

  @Column({ type: 'varchar', length: 200, nullable: true })
  email: string | null

  @Column({ type: 'text', nullable: true })
  address: string | null

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl: string | null

  @Column({ name: 'website_url', type: 'text', nullable: true })
  websiteUrl: string | null

  // Fiscal
  @Column({ name: 'default_currency', type: 'varchar', length: 3 })
  defaultCurrency: string

  @Column({
    name: 'default_tax_rate',
    type: 'decimal',
    precision: 5,
    scale: 4,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value)
    }
  })
  defaultTaxRate: number

  @Column({ name: 'default_tax_type', type: 'varchar', length: 20 })
  defaultTaxType: TaxType

  @Column({ name: 'tax_inclusive', type: 'boolean', default: true })
  taxInclusive: boolean

  // Kitchen
  @Column({ name: 'kitchen_mode', type: 'varchar', length: 30 })
  kitchenMode: KitchenMode

  @Column({ name: 'auto_send_to_kitchen', type: 'boolean', default: false })
  autoSendToKitchen: boolean

  // Receipt
  @Column({ name: 'receipt_header', type: 'text', nullable: true })
  receiptHeader: string | null

  @Column({ name: 'receipt_footer', type: 'text', nullable: true })
  receiptFooter: string | null

  // General
  @Column({ type: 'varchar', length: 100 })
  timezone: string

  @Column({ type: 'varchar', length: 20 })
  locale: string

  // Loyalty
  @Column({ name: 'loyalty_enabled', type: 'boolean', default: false })
  loyaltyEnabled: boolean

  // Extended config (SDD-2)
  @Column({ name: 'operating_hours', type: 'jsonb', nullable: true })
  operatingHours: object | null

  @Column({
    name: 'enabled_order_types',
    type: 'jsonb',
    default: () => '\'["DINE_IN","DELIVERY","TAKEOUT"]\''
  })
  enabledOrderTypes: string[]

  @Column({ name: 'service_charge', type: 'jsonb', nullable: true })
  serviceCharge: object | null

  @Column({ name: 'tip_suggestions', type: 'jsonb', nullable: true })
  tipSuggestions: number[] | null

  @Column({ name: 'split_check', type: 'boolean', default: false })
  splitCheck: boolean

  @Column({ name: 'payment_methods', type: 'jsonb', default: () => '\'["CASH","CARD"]\'' })
  paymentMethods: string[]

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
