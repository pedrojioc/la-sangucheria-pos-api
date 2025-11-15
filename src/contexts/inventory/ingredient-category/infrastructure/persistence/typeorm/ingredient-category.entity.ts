import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'

@Entity('ingredient_categories')
@Index(['name'], { unique: true })
@Index(['sortOrder'])
@Index(['isActive'])
export class IngredientCategoryEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string

  @Column({ type: 'text', nullable: true })
  description: string | null

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon: string | null

  @Column({ type: 'varchar', length: 7, nullable: true })
  color: string | null

  @Column({ name: 'sort_order', type: 'int', nullable: true })
  sortOrder: number | null

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
