import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm'
import { ProductEntity } from '@contexts/menu/product/infrastructure/persistence/typeorm/product.entity'
import { OptionGroupEntity } from './option-group.entity'

@Entity('product_option_groups')
export class ProductOptionGroupEntity {
  @PrimaryColumn({ type: 'uuid', name: 'product_id' })
  productId: string

  @PrimaryColumn({ type: 'uuid', name: 'option_group_id' })
  optionGroupId: string

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sortOrder: number

  @ManyToOne(() => ProductEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity

  @ManyToOne(() => OptionGroupEntity, { onDelete: 'RESTRICT', eager: true })
  @JoinColumn({ name: 'option_group_id' })
  optionGroup: OptionGroupEntity
}
