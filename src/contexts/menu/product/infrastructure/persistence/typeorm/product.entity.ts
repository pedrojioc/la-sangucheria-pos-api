import {
  Entity,
  PrimaryColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm'

@Entity('products')
export class ProductEntity {
  @PrimaryColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 100 })
  name: string

  @Column({ type: 'text', nullable: true })
  description: string | null

  @Column({ type: 'uuid', name: 'category_id' })
  categoryId: string

  @Column({ type: 'uuid', name: 'recipe_id', nullable: true })
  recipeId: string | null

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'image_url' })
  imageUrl: string | null

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'image_storage_key' })
  imageStorageKey: string | null

  @Column({ type: 'int', name: 'preparation_time', nullable: true })
  preparationTime: number | null

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean

  @Column({ type: 'int', name: 'display_order', default: 0 })
  displayOrder: number

  @Column({ type: 'varchar', length: 20 })
  @Index({ unique: true })
  sku: string

  @Column({ type: 'simple-array' })
  tags: string[]

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'inventory_strategy_type'
  })
  @Index()
  inventoryStrategyType: 'RECIPE' | 'DIRECT' | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
