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
import { IngredientCategoryEntity } from '@contexts/inventory/ingredient-category/infrastructure/persistence/typeorm/ingredient-category.entity'
import { UnitEntity } from '@contexts/shared-kernel/unit/infrastructure/persistence/typeorm/unit.entity'

@Entity('ingredients')
@Index(['ingredientCategoryId'])
@Index(['isActive'])
@Index(['name'])
export class IngredientEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string

  @Column({ type: 'varchar', length: 100 })
  name: string

  @Column({ type: 'text', nullable: true })
  description: string | null

  @Column({ name: 'ingredient_category_id', type: 'uuid' })
  ingredientCategoryId: string

  @Column({ name: 'unit_id', type: 'uuid' })
  unitId: string

  @Column({ name: 'preferred_supplier_id', type: 'uuid', nullable: true })
  preferredSupplierId: string | null

  @Column({ name: 'minimum_stock', type: 'decimal', precision: 10, scale: 2, nullable: true })
  minimumStock: number | null

  @Column({ name: 'maximum_stock', type: 'decimal', precision: 10, scale: 2, nullable: true })
  maximumStock: number | null

  @Column({ name: 'is_perishable', type: 'boolean', default: false })
  isPerishable: boolean

  @Column({ name: 'shelf_life_days', type: 'int', nullable: true })
  shelfLifeDays: number | null

  @Column({ name: 'storage_location', type: 'varchar', length: 100, nullable: true })
  storageLocation: string | null

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @ManyToOne(() => IngredientCategoryEntity)
  @JoinColumn({ name: 'ingredient_category_id' })
  category: IngredientCategoryEntity

  @ManyToOne(() => UnitEntity)
  @JoinColumn({ name: 'unit_id' })
  unit: UnitEntity
}
