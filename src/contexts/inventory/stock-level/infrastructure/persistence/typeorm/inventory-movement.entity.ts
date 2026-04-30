import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm'
import { MovementType } from '../../../domain/movement-type'

@Entity('inventory_movements')
@Index(['ingredientId'])
@Index(['batchId'])
@Index(['type'])
@Index(['referenceId'])
export class InventoryMovementEntity {
  @PrimaryColumn('uuid')
  id: string

  @Column({ name: 'ingredient_id', type: 'uuid' })
  ingredientId: string

  @Column({ name: 'batch_id', type: 'uuid', nullable: true })
  batchId: string | null

  @Column({ type: 'varchar', length: 20 })
  type: MovementType

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  quantity: number

  @Column({ name: 'unit_id', type: 'uuid' })
  unitId: string

  @Column({ name: 'unit_cost', type: 'decimal', precision: 12, scale: 4 })
  unitCost: number

  @Column({ type: 'varchar', length: 3 })
  currency: string

  @Column({ name: 'total_cost', type: 'decimal', precision: 12, scale: 4 })
  totalCost: number

  @Column({ type: 'text', nullable: true })
  reason: string | null

  @Column({ name: 'reference_id', type: 'varchar', length: 255, nullable: true })
  referenceId: string | null

  @Column({ name: 'performed_by', type: 'uuid', nullable: true })
  performedBy: string | null

  @Column({ name: 'performed_at', type: 'timestamp' })
  performedAt: Date

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
