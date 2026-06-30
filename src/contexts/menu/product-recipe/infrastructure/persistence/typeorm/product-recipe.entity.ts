import {
  Entity,
  PrimaryColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm'
import { ProductRecipeItemEntity } from './product-recipe-item.entity'

@Entity('product_recipes')
export class ProductRecipeEntity {
  @PrimaryColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'product_id', unique: true })
  productId: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @OneToMany(() => ProductRecipeItemEntity, item => item.recipe, { cascade: true, eager: true })
  items: ProductRecipeItemEntity[]
}
