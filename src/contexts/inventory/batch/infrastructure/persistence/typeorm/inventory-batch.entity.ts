import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'

@Entity('inventory_batches')
@Index(['ingredientId', 'purchaseDate']) // Para búsquedas FIFO
export class InventoryBatchEntity {
  @PrimaryColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'ingredient_id' })
  @Index()
  ingredientId: string

  @Column({ type: 'decimal', precision: 12, scale: 3, name: 'initial_quantity' })
  initialQuantity: number

  @Column({ type: 'decimal', precision: 12, scale: 3, name: 'remaining_quantity' })
  remainingQuantity: number

  @Column({ type: 'uuid', name: 'unit_id' })
  unitId: string

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'unit_cost' })
  unitCost: number

  @Column({ type: 'varchar', length: 3 })
  currency: string

  @Column({ type: 'timestamp', name: 'purchase_date' })
  @Index()
  purchaseDate: Date

  @Column({ type: 'timestamp', nullable: true, name: 'expiration_date' })
  expirationDate: Date | null

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'supplier_id' })
  supplierId: string | null

  @Column({ name: 'reference_code', type: 'varchar', length: 100, nullable: true })
  referenceCode: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
