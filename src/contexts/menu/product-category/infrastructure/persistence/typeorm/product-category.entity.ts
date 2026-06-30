import { ProductEntity } from '@/contexts/menu/product/infrastructure/persistence/typeorm/product.entity'
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany
} from 'typeorm'

@Entity('product_categories')
export class ProductCategoryEntity {
  @PrimaryColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 100 })
  name: string

  @Column({ type: 'text', nullable: true })
  description: string | null

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon: string | null

  @Column({ type: 'varchar', length: 50, nullable: true })
  color: string | null

  @Column({ type: 'int', name: 'display_order' })
  displayOrder: number

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean

  @Column({ type: 'uuid', name: 'default_station_id', nullable: true })
  defaultStationId: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @OneToMany(() => ProductEntity, product => product.category)
  products: ProductEntity[]
}
