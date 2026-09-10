import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { decimalTransformer } from '@shared/infrastructure/persistence/typeorm/decimal-transformer'

@Entity('stock_reservations')
@Index(['orderId', 'itemId', 'status'])
@Index(['ingredientId', 'status'])
@Index(['orderId', 'itemId', 'ingredientId'], { unique: true })
export class StockReservationEntity {
  @PrimaryColumn('uuid')
  id: string

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string

  @Column({ name: 'item_id', type: 'uuid' })
  itemId: string

  @Column({ name: 'ingredient_id', type: 'uuid' })
  ingredientId: string

  @Column({ type: 'decimal', precision: 12, scale: 4, transformer: decimalTransformer })
  quantity: number

  /**
   * varchar(64), NOT uuid. Matches the pre-existing DIRECT_DEDUCTION_UNIT_ID = 'unit'
   * sentinel string used by the DIRECT deduction strategy elsewhere in this codebase.
   */
  @Column({ name: 'unit_id', type: 'varchar', length: 64 })
  unitId: string

  @Column({ type: 'varchar', length: 20 })
  status: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
