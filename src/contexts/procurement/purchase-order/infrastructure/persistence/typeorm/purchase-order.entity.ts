import { Entity, PrimaryColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm'
import { PurchaseOrderItemEntity } from './purchase-order-item.entity'
import { SupplierEntity } from '@/contexts/procurement/supplier/infrastructure/persistence/typeorm/supplier.entity'
import { PurchaseMethod } from '@/contexts/procurement/purchase-order/domain/purchase-method'

/**
 * PurchaseOrderEntity - TypeORM Entity
 *
 * Represents a purchase order in the database.
 * This is the aggregate root entity for purchase orders.
 *
 * Table: purchase_orders
 */
@Entity('purchase_orders')
export class PurchaseOrderEntity {
  @PrimaryColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 50, unique: true, name: 'order_number' })
  orderNumber: string

  @Column({ type: 'uuid', name: 'supplier_id' })
  supplierId: string

  @Column({
    type: 'enum',
    enum: [
      'DRAFT',
      'PENDING_APPROVAL',
      'APPROVED',
      'PARTIALLY_RECEIVED',
      'CLOSED',
      'REJECTED',
      'CANCELLED'
    ]
  })
  status: string

  @Column({ type: 'uuid', name: 'requested_by' })
  requestedBy: string

  @Column({ type: 'uuid', name: 'approved_by', nullable: true })
  approvedBy: string | null

  @Column({ type: 'uuid', name: 'rejected_by', nullable: true })
  rejectedBy: string | null

  @Column({ type: 'uuid', name: 'sent_by', nullable: true })
  sentBy: string | null

  @Column({ type: 'uuid', name: 'closed_by', nullable: true })
  closedBy: string | null

  @Column({ type: 'uuid', name: 'received_by', nullable: true })
  receivedBy: string | null

  @Column({
    type: 'enum',
    enum: PurchaseMethod,
    name: 'purchase_method',
    nullable: true
  })
  purchaseMethod: PurchaseMethod | null

  @Column({ type: 'varchar', length: 500, name: 'purchase_method_details', nullable: true })
  purchaseMethodDetails: string | null

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_amount' })
  totalAmount: number

  @Column({ type: 'varchar', length: 3 })
  currency: string

  @Column({ type: 'timestamp', name: 'requested_date' })
  requestedDate: Date

  @Column({ type: 'timestamp', name: 'expected_delivery_date', nullable: true })
  expectedDeliveryDate: Date | null

  @Column({ type: 'timestamp', name: 'approved_date', nullable: true })
  approvedDate: Date | null

  @Column({ type: 'timestamp', name: 'sent_date', nullable: true })
  sentDate: Date | null

  @Column({ type: 'timestamp', name: 'received_date', nullable: true })
  receivedDate: Date | null

  @Column({ type: 'timestamp', name: 'closed_date', nullable: true })
  closedDate: Date | null

  @Column({ type: 'text', nullable: true })
  notes: string | null

  @Column({ type: 'int', name: 'item_count', default: 0 })
  itemCount: number

  // Relación con supplier (ManyToOne)
  @ManyToOne(() => SupplierEntity, { nullable: false })
  @JoinColumn({ name: 'supplier_id' })
  supplier: SupplierEntity

  // Relación con items (OneToMany)
  // NO usar cascade aquí - los items se gestionan manualmente en el repository
  @OneToMany(() => PurchaseOrderItemEntity, item => item.purchaseOrder, {
    cascade: false
  })
  items: PurchaseOrderItemEntity[]
}
