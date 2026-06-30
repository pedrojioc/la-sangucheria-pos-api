import { IngredientEntity } from '@/contexts/inventory/ingredient/infrastructure/persistence/typeorm/ingredient.entity'
import { UnitEntity } from '@/contexts/shared-kernel/unit/infrastructure/persistence/typeorm/unit.entity'
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn
} from 'typeorm'
import { decimalTransformer } from '@shared/infrastructure/persistence/typeorm/decimal-transformer'

@Entity('inventory_batches')
@Index(['ingredientId', 'purchaseDate'])
export class InventoryBatchEntity {
  @PrimaryColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'ingredient_id' })
  @Index()
  ingredientId: string

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 3,
    name: 'initial_quantity',
    transformer: decimalTransformer
  })
  initialQuantity: number

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 3,
    name: 'remaining_quantity',
    transformer: decimalTransformer
  })
  remainingQuantity: number

  @Column({ type: 'uuid', name: 'unit_id' })
  unitId: string

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'unit_cost',
    transformer: decimalTransformer
  })
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

  @ManyToOne(() => IngredientEntity)
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: IngredientEntity

  @ManyToOne(() => UnitEntity)
  @JoinColumn({ name: 'unit_id' })
  unit: UnitEntity
}
