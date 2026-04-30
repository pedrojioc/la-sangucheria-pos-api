import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { PurchaseOrderEntity } from './purchase-order.entity'
import { IngredientEntity } from '@/contexts/inventory/ingredient/infrastructure/persistence/typeorm/ingredient.entity'
import { UnitEntity } from '@/contexts/shared-kernel/unit/infrastructure/persistence/typeorm/unit.entity'

/**
 * PurchaseOrderItemEntity - TypeORM Entity
 *
 * Represents a purchase order item (line) in the database.
 * This is a child entity of PurchaseOrderEntity.
 *
 * Table: purchase_order_items
 */
@Entity('purchase_order_items')
export class PurchaseOrderItemEntity {
  @PrimaryColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'purchase_order_id' })
  purchaseOrderId: string

  @Column({ type: 'uuid', name: 'ingredient_id' })
  ingredientId: string

  @Column({ type: 'decimal', precision: 10, scale: 3, name: 'quantity_requested' })
  quantityRequested: number

  @Column({ type: 'uuid', name: 'quantity_requested_unit_id' })
  quantityRequestedUnitId: string

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 3,
    name: 'quantity_received',
    nullable: true
  })
  quantityReceived: number | null

  @Column({ type: 'uuid', name: 'quantity_received_unit_id', nullable: true })
  quantityReceivedUnitId: string | null

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'unit_cost' })
  unitCost: number

  @Column({ type: 'varchar', length: 3, name: 'currency' })
  currency: string

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_cost' })
  totalCost: number

  @Column({ type: 'text', nullable: true })
  notes: string | null

  @Column({ type: 'boolean', name: 'is_cancelled', default: false })
  isCancelled: boolean

  @Column({ type: 'text', name: 'cancellation_reason', nullable: true })
  cancellationReason: string | null

  // Relación con PurchaseOrder
  @ManyToOne(() => PurchaseOrderEntity, order => order.items)
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder: PurchaseOrderEntity

  // Relación con Ingredient
  @ManyToOne(() => IngredientEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: IngredientEntity

  // Relación con Unit
  @ManyToOne(() => UnitEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'quantity_requested_unit_id' })
  quantityRequestedUnit: UnitEntity

  @ManyToOne(() => UnitEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'quantity_received_unit_id' })
  quantityReceivedUnit: UnitEntity
}
