import { Entity, PrimaryColumn, Column } from 'typeorm'

/**
 * Backs TypeOrmOrderRepository.nextOrderNumber()'s atomic
 * UPSERT-then-UPDATE...RETURNING sequence allocator (see that method's
 * doc comment for why it uses raw SQL and its own independent
 * transaction instead of the ambient UnitOfWork). Modeled as a real
 * @Entity purely so this table is captured by migration:generate like
 * every other table — the allocator itself keeps using manager.query()
 * against it, since TypeORM's standard repository API has no atomic
 * UPSERT+RETURNING primitive.
 */
@Entity('order_daily_sequence')
export class OrderDailySequenceEntity {
  @PrimaryColumn({ name: 'date_key', type: 'date' })
  dateKey: string

  @Column({ name: 'last_number', type: 'integer', default: 0 })
  lastNumber: number
}
